package dev.zo7al.bridge;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.OfflinePlayer;
import org.bukkit.Statistic;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class Zo7alPlayerBridge extends JavaPlugin implements Listener {
    private ProfileQueue queue;
    private BridgeTransport transport;
    private ExecutorService network;
    private LuckPermsRanks ranks;
    private Method placeholders;
    private OfflinePlayer[] offline = new OfflinePlayer[0];
    private int offlineCursor, offlineBatch, batchSize, interval, elapsed, failures;
    private volatile int generation;
    private Set<String> excluded = Set.of();
    private boolean sending;
    private long nextAttempt, lastSuccess, lastWarning, lastCapture;
    private CompletableFuture<BridgeTransport.Result> activeRequest;

    @Override public void onEnable() {
        saveDefaultConfig();
        network = Executors.newFixedThreadPool(2, runnable -> { Thread thread = new Thread(runnable, "Zo7al-Profile-HTTPS"); thread.setDaemon(true); return thread; });
        getServer().getPluginManager().registerEvents(this, this);
        configure();
        Bukkit.getScheduler().runTaskTimer(this, this::tick, 20L, 20L);
        log("enabled", Map.of());
    }
    @Override public void onDisable() {
        generation++; if (activeRequest != null) activeRequest.cancel(true);
        Bukkit.getScheduler().cancelTasks(this); if (network != null) network.shutdownNow();
    }
    private void configure() {
        generation++; transport = null; failures = 0; nextAttempt = 0; elapsed = 0;
        batchSize = clamp(getConfig().getInt("batch-size", 100), 1, 100);
        interval = clamp(getConfig().getInt("sync-interval-seconds", 60), 15, 60);
        offlineBatch = clamp(getConfig().getInt("offline-players-per-second", 5), 1, 20);
        if (queue == null) queue = new ProfileQueue(clamp(getConfig().getInt("queue-limit", 5000), 200, 20000));
        excluded = Set.copyOf(getConfig().getStringList("excluded-players").stream().map(value -> value.toLowerCase(Locale.ROOT)).toList());
        ranks = null;
        if (getServer().getPluginManager().isPluginEnabled("LuckPerms")) {
            try { ranks = new LuckPermsRanks(getConfig().getConfigurationSection("rank-names")); } catch (RuntimeException | LinkageError ignored) { }
        }
        if (ranks == null) log("missing-luckperms", Map.of());
        placeholders = null;
        if (getServer().getPluginManager().isPluginEnabled("PlaceholderAPI")) {
            try { placeholders = Class.forName("me.clip.placeholderapi.PlaceholderAPI").getMethod("setPlaceholders", OfflinePlayer.class, String.class); } catch (ReflectiveOperationException ignored) { }
        }
        try { transport = new BridgeTransport(getConfig().getString("endpoint", ""), getConfig().getString("token", ""), network); }
        catch (RuntimeException error) { log("invalid-config", Map.of()); }
        // No Bukkit API access occurs on the network executor.
        for (var player : Bukkit.getOnlinePlayers()) capture(player, true);
        offline = transport != null && getConfig().getBoolean("sync-offline-on-start", true) ? Bukkit.getOfflinePlayers() : new OfflinePlayer[0];
        offlineCursor = 0;
    }
    private void tick() {
        if (transport == null) return;
        if (++elapsed >= interval) { elapsed = 0; for (var player : Bukkit.getOnlinePlayers()) capture(player, true); }
        if (!queue.full()) for (int n = 0; n < offlineBatch && offlineCursor < offline.length; n++) {
            OfflinePlayer player = offline[offlineCursor++]; if (!player.isOnline()) capture(player, false);
        }
        if (offlineCursor >= offline.length && offline.length > 0) offline = new OfflinePlayer[0];
        if (sending || System.currentTimeMillis() < nextAttempt) return;
        if (queue.size() > 0 || lastSuccess == 0 || System.currentTimeMillis() - lastSuccess >= interval * 1000L) upload();
    }
    @EventHandler(priority = EventPriority.MONITOR) public void onJoin(PlayerJoinEvent event) {
        Bukkit.getScheduler().runTaskLater(this, () -> { if (event.getPlayer().isOnline()) capture(event.getPlayer(), true); }, 20L);
    }
    @EventHandler(priority = EventPriority.MONITOR) public void onQuit(PlayerQuitEvent event) { capture(event.getPlayer(), false); }
    private void capture(OfflinePlayer player, boolean online) {
        if (transport == null || player.getName() == null || !player.getName().matches("[.a-zA-Z0-9_ ]{3,32}") || excluded.contains(player.getName().toLowerCase(Locale.ROOT)) || !online && !player.hasPlayedBefore()) return;
        Map<String, Double> stats = new HashMap<>();
        try { stats.put("kills", (double) player.getStatistic(Statistic.PLAYER_KILLS)); } catch (RuntimeException ignored) { }
        try { stats.put("deaths", (double) player.getStatistic(Statistic.DEATHS)); } catch (RuntimeException ignored) { }
        try { stats.put("playtimeSeconds", player.getStatistic(Statistic.PLAY_ONE_MINUTE) / 20.0); } catch (RuntimeException ignored) { }
        override(stats, "kills", player, "kills-placeholder"); override(stats, "deaths", player, "deaths-placeholder");
        override(stats, "wins", player, "wins-placeholder"); override(stats, "playtimeSeconds", player, "playtime-seconds-placeholder");
        stats.values().removeIf(value -> !Double.isFinite(value) || value < 0 || value > 1e12);
        long lastSeen = online || player.isOnline() ? System.currentTimeMillis() : player.getLastSeen();
        // Monotonic milliseconds keep asynchronous rank reads from reverting join/quit state.
        lastCapture = Math.max(System.currentTimeMillis(), lastCapture + 1);
        PlayerProfile snapshot = new PlayerProfile(player.getUniqueId(), player.getName(), null, online,
            lastSeen > 0 ? Instant.ofEpochMilli(lastSeen) : null, Instant.ofEpochMilli(lastCapture), stats);
        int epoch = generation;
        CompletableFuture<String> rank = ranks == null ? CompletableFuture.completedFuture(null) : ranks.rank(player.getUniqueId(), online);
        rank.whenComplete((value, error) -> {
            if (!isEnabled() || epoch != generation) return;
            try { Bukkit.getScheduler().runTask(this, () -> { if (epoch == generation && !queue.offer(snapshot.withRank(value))) warnQueue(); }); }
            catch (IllegalStateException ignored) { }
        });
    }
    private void override(Map<String, Double> stats, String key, OfflinePlayer player, String setting) {
        String pattern = getConfig().getString("statistics." + setting, "");
        if (placeholders == null || pattern.isBlank()) return;
        try {
            String value = String.valueOf(placeholders.invoke(null, player, pattern)).replace(",", "").trim();
            if (value.matches("[0-9]+(?:\\.[0-9]+)?")) { double number = Double.parseDouble(value); if (Double.isFinite(number) && number <= 1e12) stats.put(key, number); }
        } catch (ReflectiveOperationException | RuntimeException ignored) { }
    }
    private void upload() {
        List<PlayerProfile> batch = queue.drain(batchSize); sending = true;
        int epoch = generation; BridgeTransport current = transport;
        activeRequest = current.send(batch);
        activeRequest.whenComplete((result, error) -> {
            if (!isEnabled()) return;
            try { Bukkit.getScheduler().runTask(this, () -> {
                sending = false;
                if (epoch != generation) { batch.forEach(queue::offer); return; }
                if (error == null && result.confirmed()) { failures = 0; lastSuccess = System.currentTimeMillis(); nextAttempt = lastSuccess + 2000; }
                else {
                    batch.forEach(queue::offer); failures = Math.min(7, failures + 1);
                    long retry = Math.min(300_000, 5000L << (failures - 1)); nextAttempt = System.currentTimeMillis() + retry;
                    if (System.currentTimeMillis() - lastWarning > 60_000 || failures == 1) {
                        lastWarning = System.currentTimeMillis(); log("failed", Map.of("status", error == null ? String.valueOf(result.status()) : "network", "seconds", String.valueOf(retry / 1000)));
                    }
                }
            }); } catch (IllegalStateException ignored) { }
        });
    }
    private void warnQueue() { if (System.currentTimeMillis() - lastWarning > 60_000) { lastWarning = System.currentTimeMillis(); log("queue-full", Map.of()); } }
    private static int clamp(int n, int minimum, int maximum) { return Math.max(minimum, Math.min(maximum, n)); }
    private String text(String name, Map<String, String> replacements) {
        String value = getConfig().getString("messages." + name, name);
        for (var item : replacements.entrySet()) value = value.replace("{" + item.getKey() + "}", item.getValue());
        return ChatColor.translateAlternateColorCodes('&', getConfig().getString("messages.prefix", "&6Zo7al &8» &r") + value);
    }
    private void log(String name, Map<String, String> values) { getLogger().info(ChatColor.stripColor(text(name, values))); }
    @Override public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("zo7al.bridge.admin")) { sender.sendMessage(text("no-permission", Map.of())); return true; }
        String action = args.length == 0 ? "status" : args[0].toLowerCase(Locale.ROOT);
        switch (action) {
            case "reload" -> { reloadConfig(); configure(); sender.sendMessage(text("reloaded", Map.of())); }
            case "status" -> sender.sendMessage(text("status", Map.of("state", getConfig().getString("messages." + (transport == null ? "unconfigured" : "configured"), ""), "queued", String.valueOf(queue.size()), "last-sync", lastSuccess == 0 ? getConfig().getString("messages.never", "Not synchronized yet") : Instant.ofEpochMilli(lastSuccess).toString())));
            case "sync" -> {
                if (transport == null) { sender.sendMessage(text("invalid-config", Map.of())); return true; }
                if (args.length == 1) { var players = Bukkit.getOnlinePlayers(); players.forEach(player -> capture(player, true)); sender.sendMessage(text("queued", Map.of("count", String.valueOf(players.size())))); }
                else {
                    String name = String.join(" ", List.of(args).subList(1, args.length));
                    OfflinePlayer player = Bukkit.getOfflinePlayerIfCached(name);
                    if (player == null || !player.hasPlayedBefore() && !player.isOnline()) sender.sendMessage(text("unknown-player", Map.of()));
                    else { capture(player, player.isOnline()); sender.sendMessage(text("queued", Map.of("count", "1"))); }
                }
                nextAttempt = 0;
            }
            default -> sender.sendMessage(text("usage", Map.of()));
        }
        return true;
    }
    @Override public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!sender.hasPermission("zo7al.bridge.admin")) return List.of();
        if (args.length == 1) return List.of("status", "reload", "sync").stream().filter(value -> value.startsWith(args[0].toLowerCase(Locale.ROOT))).toList();
        if (args.length == 2 && args[0].equalsIgnoreCase("sync")) return Bukkit.getOnlinePlayers().stream().map(OfflinePlayer::getName).filter(name -> name != null && name.toLowerCase(Locale.ROOT).startsWith(args[1].toLowerCase(Locale.ROOT))).toList();
        return new ArrayList<>();
    }
}
