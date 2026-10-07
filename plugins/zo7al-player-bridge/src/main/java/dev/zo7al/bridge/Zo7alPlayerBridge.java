package dev.zo7al.bridge;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.OfflinePlayer;
import org.bukkit.entity.Player;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Method;
import java.io.File;
import java.io.IOException;
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
    private final Map<java.util.UUID, Long> linkAttempts = new HashMap<>();
    private ProfileQueue queue;
    private BridgeTransport transport;
    private ExecutorService network;
    private ExecutorService persistence;
    private PlayerCounters counters;
    private File statisticsDirectory;
    private int pending, queueLimit, saveElapsed;
    private volatile long queuedSave = -1;
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
        persistence = Executors.newSingleThreadExecutor(runnable -> { Thread thread = new Thread(runnable, "Zo7al-Local-Statistics"); thread.setDaemon(true); return thread; });
        try { counters = new PlayerCounters(new File(getDataFolder(), "player-counters.json")); }
        catch (IOException error) { log("stats-storage-failed", Map.of()); }
        network = Executors.newFixedThreadPool(2, runnable -> { Thread thread = new Thread(runnable, "Zo7al-Profile-HTTPS"); thread.setDaemon(true); return thread; });
        getServer().getPluginManager().registerEvents(this, this);
        configure();
        Bukkit.getScheduler().runTaskTimer(this, this::tick, 20L, 20L);
        log("enabled", Map.of());
    }
    @Override public void onDisable() {
        if (counters != null) { try { counters.save(counters.revision(), counters.snapshot()); } catch (IOException error) { log("stats-storage-failed", Map.of()); } }
        if (persistence != null) persistence.shutdown();
        generation++; if (activeRequest != null) activeRequest.cancel(true);
        Bukkit.getScheduler().cancelTasks(this); if (network != null) network.shutdownNow();
    }
    private void configure() {
        generation++; transport = null; failures = 0; nextAttempt = 0; elapsed = 0; pending = 0;
        batchSize = clamp(getConfig().getInt("batch-size", 100), 1, 100);
        interval = clamp(getConfig().getInt("sync-interval-seconds", 60), 15, 60);
        offlineBatch = clamp(getConfig().getInt("offline-players-per-second", 5), 1, 20);
        if (queue == null) { queueLimit = clamp(getConfig().getInt("queue-limit", 5000), 200, 20000); queue = new ProfileQueue(queueLimit); }
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
        statisticsDirectory = getServer().getWorlds().isEmpty() ? null : new File(getServer().getWorlds().getFirst().getWorldFolder(), "stats");
        for (var player : Bukkit.getOnlinePlayers()) capture(player, true);
        offline = transport != null && getConfig().getBoolean("sync-offline-on-start", true) ? Bukkit.getOfflinePlayers() : new OfflinePlayer[0];
        offlineCursor = 0;
    }
    private void tick() {
        if (++saveElapsed >= 60) { saveElapsed = 0; saveCounters(); }
        if (transport == null) return;
        if (++elapsed >= interval) { elapsed = 0; for (var player : Bukkit.getOnlinePlayers()) capture(player, true); }
        for (int n = 0; n < offlineBatch && offlineCursor < offline.length && room(); n++) {
            OfflinePlayer player = offline[offlineCursor++]; if (!player.isOnline()) capture(player, false);
        }
        if (offlineCursor >= offline.length && offline.length > 0) offline = new OfflinePlayer[0];
        if (sending || System.currentTimeMillis() < nextAttempt) return;
        if (queue.size() > 0 || lastSuccess == 0 || System.currentTimeMillis() - lastSuccess >= interval * 1000L) upload();
    }
    @EventHandler(priority = EventPriority.MONITOR) public void onJoin(PlayerJoinEvent event) {
        if (counters != null) counters.observe(event.getPlayer().getUniqueId());
        Bukkit.getScheduler().runTaskLater(this, () -> { if (event.getPlayer().isOnline()) capture(event.getPlayer(), true); }, 20L);
    }
    @EventHandler(priority = EventPriority.MONITOR) public void onQuit(PlayerQuitEvent event) { capture(event.getPlayer(), false); }
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true) public void onDeath(PlayerDeathEvent event) {
        Player victim = event.getEntity(), killer = victim.getKiller();
        if (counters != null) { counters.died(victim.getUniqueId()); if (killer != null && !killer.getUniqueId().equals(victim.getUniqueId())) counters.kill(killer.getUniqueId()); }
        Bukkit.getScheduler().runTaskLater(this, () -> { if (victim.isOnline()) capture(victim, true); if (killer != null && killer.isOnline()) capture(killer, true); }, 1L);
    }
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true) public void onPlace(BlockPlaceEvent event) {
        if (counters != null) counters.placed(event.getPlayer().getUniqueId());
    }
    private boolean room() { return pending < 100 && queue.size() + pending < queueLimit; }
    private void saveCounters() {
        if (counters == null || counters.revision() == queuedSave) return;
        long revision = counters.revision(); String snapshot = counters.snapshot(); queuedSave = revision;
        persistence.execute(() -> { try { counters.save(revision, snapshot); } catch (IOException error) { queuedSave = -1; log("stats-storage-failed", Map.of()); } });
    }
    private void capture(OfflinePlayer player, boolean online) {
        if (transport == null || player.getName() == null || !player.getName().matches("[.a-zA-Z0-9_ ]{3,32}") || excluded.contains(player.getName().toLowerCase(Locale.ROOT)) || !online && !player.hasPlayedBefore()) return;
        if (!room()) { warnQueue(); return; }
        Player active = player.getPlayer();
        Map<String, Double> stats = active == null ? new HashMap<>() : VanillaStatistics.read(active);
        if (counters != null) { if (active != null) counters.observe(player.getUniqueId()); stats.putAll(counters.stats(player.getUniqueId())); }
        Set<String> overridden = new java.util.HashSet<>();
        for (var setting : VanillaStatistics.SETTINGS.entrySet()) {
            if (!getConfig().getString("statistics." + setting.getValue(), "").isBlank()) overridden.add(setting.getKey());
            override(stats, setting.getKey(), player, setting.getValue());
        }
        stats.values().removeIf(value -> !Double.isFinite(value) || value < 0 || value > 1e12);
        long lastSeen = online || player.isOnline() ? System.currentTimeMillis() : player.getLastSeen();
        // Monotonic milliseconds keep asynchronous rank reads from reverting join/quit state.
        lastCapture = Math.max(System.currentTimeMillis(), lastCapture + 1);
        PlayerProfile snapshot = new PlayerProfile(player.getUniqueId(), player.getName(), null, online,
            lastSeen > 0 ? Instant.ofEpochMilli(lastSeen) : null, Instant.ofEpochMilli(lastCapture), stats);
        int epoch = generation; pending++;
        CompletableFuture<String> rank = ranks == null ? CompletableFuture.completedFuture(null) : ranks.rank(player.getUniqueId(), online);
        File file = statisticsDirectory == null ? null : new File(statisticsDirectory, player.getUniqueId() + ".json");
        CompletableFuture<Map<String, Double>> disk = active != null || file == null ? CompletableFuture.completedFuture(new HashMap<>())
            : CompletableFuture.supplyAsync(() -> OfflineStats.read(file), network);
        rank.handle((value, error) -> value).thenCombine(disk, (value, numbers) -> {
            numbers.keySet().removeAll(overridden); numbers.putAll(snapshot.stats()); return snapshot.withStats(numbers).withRank(value);
        }).whenComplete((ready, error) -> {
            if (!isEnabled() || epoch != generation) return;
            try { Bukkit.getScheduler().runTask(this, () -> { if (epoch == generation) { pending = Math.max(0, pending - 1); if (!queue.offer(error == null ? ready : snapshot)) warnQueue(); } }); }
            catch (IllegalStateException ignored) { }
        });
    }
    private void override(Map<String, Double> stats, String key, OfflinePlayer player, String setting) {
        String pattern = getConfig().getString("statistics." + setting, "");
        if (pattern.isBlank()) return;
        stats.remove(key);
        if (placeholders == null) return;
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
        if (command.getName().equalsIgnoreCase("zo7allink")) {
            if (!(sender instanceof Player)) { sender.sendMessage(text("link-player-only", Map.of())); return true; }
            final Player player = (Player) sender;
            if (args.length != 1 || !args[0].toUpperCase(Locale.ROOT).matches("[A-HJ-NP-Z2-9]{8}")) { player.sendMessage(text("link-usage", Map.of())); return true; }
            if (transport == null) { player.sendMessage(text("link-failed", Map.of())); return true; }
            long now = System.currentTimeMillis();
            if (now - linkAttempts.getOrDefault(player.getUniqueId(), 0L) < 10000L) { player.sendMessage(text("link-wait", Map.of())); return true; }
            linkAttempts.entrySet().removeIf(entry -> now - entry.getValue() > 60000L);
            linkAttempts.put(player.getUniqueId(), now);
            player.sendMessage(text("link-checking", Map.of()));
            final int epoch = generation;
            transport.link(player.getUniqueId(), player.getName(), args[0].toUpperCase(Locale.ROOT)).whenComplete((result, error) -> {
                if (!isEnabled()) return;
                try { Bukkit.getScheduler().runTask(this, () -> {
                    if (epoch == generation && player.isOnline()) player.sendMessage(text(error == null && result.confirmed() ? "link-success" : "link-failed", Map.of()));
                }); } catch (IllegalStateException ignored) { }
            });
            return true;
        }
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
        if (command.getName().equalsIgnoreCase("zo7allink")) return List.of();
        if (!sender.hasPermission("zo7al.bridge.admin")) return List.of();
        if (args.length == 1) return List.of("status", "reload", "sync").stream().filter(value -> value.startsWith(args[0].toLowerCase(Locale.ROOT))).toList();
        if (args.length == 2 && args[0].equalsIgnoreCase("sync")) return Bukkit.getOnlinePlayers().stream().map(OfflinePlayer::getName).filter(name -> name != null && name.toLowerCase(Locale.ROOT).startsWith(args[1].toLowerCase(Locale.ROOT))).toList();
        return new ArrayList<>();
    }
}
