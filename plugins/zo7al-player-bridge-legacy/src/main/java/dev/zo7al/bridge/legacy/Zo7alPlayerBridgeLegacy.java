package dev.zo7al.bridge.legacy;

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

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.stream.Collectors;

public final class Zo7alPlayerBridgeLegacy extends JavaPlugin implements Listener {
    private ProfileQueue queue;
    private BridgeTransport transport;
    private ExecutorService network;
    private ExecutorService persistence;
    private PlayerCounters counters;
    private int saveElapsed;
    private volatile long queuedSave = -1;
    private ScheduledExecutorService timer;
    private LuckPermsRanks ranks;
    private Method placeholders;
    private boolean playerPlaceholders;
    private File statisticsDirectory;
    private OfflinePlayer[] offline = new OfflinePlayer[0];
    private final Map<String, UUID> knownPlayers = new HashMap<String, UUID>();
    private int offlineCursor, offlineBatch, batchSize, interval, elapsed, failures, pending, queueLimit;
    private volatile int generation;
    private Set<String> excluded = Collections.emptySet();
    private boolean sending;
    private long nextAttempt, lastSuccess, lastWarning, lastCapture;
    private CompletableFuture<BridgeTransport.Result> activeRequest;

    @Override public void onEnable() {
        saveDefaultConfig();
        persistence = Executors.newSingleThreadExecutor(runnable -> { Thread thread = new Thread(runnable, "Zo7al-Legacy-Local-Statistics"); thread.setDaemon(true); return thread; });
        try { counters = new PlayerCounters(new File(getDataFolder(), "player-counters.json")); }
        catch (IOException error) { log("stats-storage-failed", Collections.emptyMap()); }
        network = Executors.newFixedThreadPool(2, runnable -> { Thread thread = new Thread(runnable, "Zo7al-Legacy-HTTPS"); thread.setDaemon(true); return thread; });
        timer = Executors.newSingleThreadScheduledExecutor(runnable -> { Thread thread = new Thread(runnable, "Zo7al-Legacy-Rank-Timeout"); thread.setDaemon(true); return thread; });
        getServer().getPluginManager().registerEvents(this, this); configure();
        Bukkit.getScheduler().runTaskTimer(this, this::tick, 20L, 20L); log("enabled", Collections.emptyMap());
    }
    @Override public void onDisable() {
        if (counters != null) { try { counters.save(counters.revision(), counters.snapshot()); } catch (IOException error) { log("stats-storage-failed", Collections.emptyMap()); } }
        if (persistence != null) persistence.shutdown();
        generation++; if (activeRequest != null) activeRequest.cancel(true);
        Bukkit.getScheduler().cancelTasks(this); if (network != null) network.shutdownNow(); if (timer != null) timer.shutdownNow();
    }
    private void configure() {
        generation++; transport = null; failures = 0; nextAttempt = 0; elapsed = 0; pending = 0;
        batchSize = clamp(getConfig().getInt("batch-size", 100), 1, 100);
        interval = clamp(getConfig().getInt("sync-interval-seconds", 60), 15, 60);
        offlineBatch = clamp(getConfig().getInt("offline-players-per-second", 5), 1, 20);
        if (queue == null) { queueLimit = clamp(getConfig().getInt("queue-limit", 5000), 200, 20000); queue = new ProfileQueue(queueLimit); }
        excluded = new HashSet<String>();
        for (String name : getConfig().getStringList("excluded-players")) excluded.add(name.toLowerCase(Locale.ROOT));
        ranks = null;
        if (getServer().getPluginManager().isPluginEnabled("LuckPerms")) {
            try { ranks = new LuckPermsRanks(getConfig().getConfigurationSection("rank-names"), timer); } catch (RuntimeException | LinkageError ignored) { }
        }
        if (ranks == null) log("missing-luckperms", Collections.emptyMap());
        placeholders = null; playerPlaceholders = false;
        if (getServer().getPluginManager().isPluginEnabled("PlaceholderAPI")) {
            try {
                Class<?> api = Class.forName("me.clip.placeholderapi.PlaceholderAPI");
                try { placeholders = api.getMethod("setPlaceholders", OfflinePlayer.class, String.class); }
                catch (NoSuchMethodException missing) { placeholders = api.getMethod("setPlaceholders", Player.class, String.class); playerPlaceholders = true; }
            } catch (ReflectiveOperationException ignored) { }
        }
        try { transport = new BridgeTransport(getConfig().getString("endpoint", ""), getConfig().getString("token", ""), network); }
        catch (RuntimeException error) { log("invalid-config", Collections.emptyMap()); }
        statisticsDirectory = getServer().getWorlds().isEmpty() ? null : new File(getServer().getWorlds().get(0).getWorldFolder(), "stats");
        knownPlayers.clear();
        OfflinePlayer[] known = transport == null ? new OfflinePlayer[0] : Bukkit.getOfflinePlayers();
        for (OfflinePlayer player : known) if (player.getName() != null) knownPlayers.put(player.getName().toLowerCase(Locale.ROOT), player.getUniqueId());
        for (Player player : Bukkit.getOnlinePlayers()) capture(player, true);
        offline = transport != null && getConfig().getBoolean("sync-offline-on-start", true) ? known : new OfflinePlayer[0]; offlineCursor = 0;
    }
    private void tick() {
        if (++saveElapsed >= 60) { saveElapsed = 0; saveCounters(); }
        if (transport == null) return;
        if (++elapsed >= interval) { elapsed = 0; for (Player player : Bukkit.getOnlinePlayers()) capture(player, true); }
        for (int n = 0; n < offlineBatch && offlineCursor < offline.length && room(); n++) {
            OfflinePlayer player = offline[offlineCursor++]; if (!player.isOnline()) capture(player, false);
        }
        if (offlineCursor >= offline.length && offline.length > 0) offline = new OfflinePlayer[0];
        if (sending || System.currentTimeMillis() < nextAttempt) return;
        if (queue.size() > 0 || lastSuccess == 0 || System.currentTimeMillis() - lastSuccess >= interval * 1000L) upload();
    }
    private boolean room() { return pending < 100 && queue.size() + pending < queueLimit; }
    @EventHandler(priority = EventPriority.MONITOR) public void onJoin(PlayerJoinEvent event) {
        if (counters != null) counters.observe(event.getPlayer().getUniqueId());
        Bukkit.getScheduler().runTaskLater(this, () -> { if (event.getPlayer().isOnline()) capture(event.getPlayer(), true); }, 20L);
    }
    @EventHandler(priority = EventPriority.MONITOR) public void onQuit(PlayerQuitEvent event) { capture(event.getPlayer(), false); }
    @EventHandler(priority = EventPriority.MONITOR) public void onDeath(PlayerDeathEvent event) {
        final Player victim = event.getEntity(), killer = victim.getKiller();
        if (counters != null) { counters.died(victim.getUniqueId()); if (killer != null && !killer.getUniqueId().equals(victim.getUniqueId())) counters.kill(killer.getUniqueId()); }
        Bukkit.getScheduler().runTaskLater(this, () -> { if (victim.isOnline()) capture(victim, true); if (killer != null && killer.isOnline()) capture(killer, true); }, 1L);
    }
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true) public void onPlace(BlockPlaceEvent event) {
        if (counters != null) counters.placed(event.getPlayer().getUniqueId());
    }
    private void saveCounters() {
        if (counters == null || counters.revision() == queuedSave) return;
        final long revision = counters.revision(); final String snapshot = counters.snapshot(); queuedSave = revision;
        persistence.execute(() -> { try { counters.save(revision, snapshot); } catch (IOException error) { queuedSave = -1; log("stats-storage-failed", Collections.emptyMap()); } });
    }
    private void capture(final OfflinePlayer player, final boolean online) {
        final String name = player.getName(); final UUID uuid = player.getUniqueId();
        if (transport == null || name == null || !name.matches("[.a-zA-Z0-9_ ]{3,32}") || excluded.contains(name.toLowerCase(Locale.ROOT)) || !online && !player.hasPlayedBefore()) return;
        knownPlayers.put(name.toLowerCase(Locale.ROOT), uuid);
        if (!room()) { warnQueue(); return; }
        final Player active = player.getPlayer();
        final Map<String, Double> counters = active == null ? new HashMap<String, Double>() : VanillaStatistics.read(active);
        if (this.counters != null) { if (active != null) this.counters.observe(uuid); counters.putAll(this.counters.stats(uuid)); }
        final Set<String> overridden = new HashSet<String>();
        for (Map.Entry<String, String> setting : VanillaStatistics.SETTINGS.entrySet()) {
            if (!getConfig().getString("statistics." + setting.getValue(), "").trim().isEmpty()) overridden.add(setting.getKey());
            override(counters, setting.getKey(), player, setting.getValue());
        }
        counters.values().removeIf(value -> !Double.isFinite(value) || value < 0 || value > 1e12);
        long seen = online || active != null ? System.currentTimeMillis() : player.getLastPlayed();
        final Instant lastSeen = seen > 0 ? Instant.ofEpochMilli(seen) : null;
        lastCapture = Math.max(System.currentTimeMillis(), lastCapture + 1); final Instant capturedAt = Instant.ofEpochMilli(lastCapture);
        final int epoch = generation; pending++;
        CompletableFuture<String> rank = ranks == null ? CompletableFuture.completedFuture(null) : ranks.rank(uuid, online);
        final File stats = statisticsDirectory == null ? null : new File(statisticsDirectory, uuid.toString() + ".json");
        CompletableFuture<Map<String, Double>> offlineStats = active != null || stats == null ? CompletableFuture.completedFuture(new HashMap<String, Double>())
            : CompletableFuture.supplyAsync(() -> OfflineStats.read(stats), network);
        rank.handle((value, error) -> value).thenCombine(offlineStats, (value, values) -> { values.keySet().removeAll(overridden); values.putAll(counters); return new PlayerProfile(uuid, name, value, online, lastSeen, capturedAt, values); })
            .whenComplete((snapshot, error) -> {
                if (!isEnabled() || epoch != generation) return;
                try { Bukkit.getScheduler().runTask(this, () -> {
                    if (epoch != generation) return; pending--;
                    if (snapshot != null && !queue.offer(snapshot)) warnQueue();
                }); } catch (IllegalStateException ignored) { }
            });
    }
    private void override(Map<String, Double> stats, String key, OfflinePlayer player, String setting) {
        String pattern = getConfig().getString("statistics." + setting, "");
        if (pattern.trim().isEmpty()) return;
        stats.remove(key);
        if (placeholders == null || playerPlaceholders && player.getPlayer() == null) return;
        try {
            Object subject = playerPlaceholders ? player.getPlayer() : player;
            String value = String.valueOf(placeholders.invoke(null, subject, pattern)).replace(",", "").trim();
            if (value.matches("[0-9]+(?:\\.[0-9]+)?")) { double number = Double.parseDouble(value); if (Double.isFinite(number) && number <= 1e12) stats.put(key, number); }
        } catch (ReflectiveOperationException | RuntimeException ignored) { }
    }
    private void upload() {
        final List<PlayerProfile> batch = queue.drain(batchSize); sending = true; final int epoch = generation;
        activeRequest = transport.send(batch);
        activeRequest.whenComplete((result, error) -> {
            if (!isEnabled()) return;
            try { Bukkit.getScheduler().runTask(this, () -> {
                sending = false; if (epoch != generation) { batch.forEach(queue::offer); return; }
                if (error == null && result.confirmed()) { failures = 0; lastSuccess = System.currentTimeMillis(); nextAttempt = lastSuccess + 2000; }
                else {
                    batch.forEach(queue::offer); failures = Math.min(7, failures + 1);
                    long retry = Math.min(300_000, 5000L << (failures - 1)); nextAttempt = System.currentTimeMillis() + retry;
                    if (System.currentTimeMillis() - lastWarning > 60_000 || failures == 1) {
                        lastWarning = System.currentTimeMillis(); log("failed", values("status", error == null && result.status() > 0 ? String.valueOf(result.status()) : "network", "seconds", String.valueOf(retry / 1000)));
                    }
                }
            }); } catch (IllegalStateException ignored) { }
        });
    }
    private void warnQueue() { if (System.currentTimeMillis() - lastWarning > 60_000) { lastWarning = System.currentTimeMillis(); log("queue-full", Collections.emptyMap()); } }
    private static int clamp(int n, int minimum, int maximum) { return Math.max(minimum, Math.min(maximum, n)); }
    private static Map<String, String> values(String... pairs) { Map<String, String> result = new HashMap<String, String>(); for (int i = 0; i < pairs.length; i += 2) result.put(pairs[i], pairs[i + 1]); return result; }
    private String text(String name, Map<String, String> replacements) {
        String value = getConfig().getString("messages." + name, name);
        for (Map.Entry<String, String> item : replacements.entrySet()) value = value.replace("{" + item.getKey() + "}", item.getValue());
        return ChatColor.translateAlternateColorCodes('&', getConfig().getString("messages.prefix", "&6Zo7al &8» &r") + value);
    }
    private void log(String name, Map<String, String> replacements) { getLogger().info(ChatColor.stripColor(text(name, replacements))); }
    @Override public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("zo7al.bridge.admin")) { sender.sendMessage(text("no-permission", Collections.emptyMap())); return true; }
        String action = args.length == 0 ? "status" : args[0].toLowerCase(Locale.ROOT);
        if ("reload".equals(action)) { reloadConfig(); configure(); sender.sendMessage(text("reloaded", Collections.emptyMap())); }
        else if ("status".equals(action)) sender.sendMessage(text("status", values("state", getConfig().getString("messages." + (transport == null ? "unconfigured" : "configured"), ""), "queued", String.valueOf(queue.size() + pending), "last-sync", lastSuccess == 0 ? getConfig().getString("messages.never", "Not synchronized yet") : Instant.ofEpochMilli(lastSuccess).toString())));
        else if ("sync".equals(action)) {
            if (transport == null) { sender.sendMessage(text("invalid-config", Collections.emptyMap())); return true; }
            if (args.length == 1) { for (Player player : Bukkit.getOnlinePlayers()) capture(player, true); sender.sendMessage(text("queued", values("count", String.valueOf(Bukkit.getOnlinePlayers().size())))); }
            else {
                String name = String.join(" ", Arrays.copyOfRange(args, 1, args.length)); UUID uuid = knownPlayers.get(name.toLowerCase(Locale.ROOT));
                if (uuid == null) sender.sendMessage(text("unknown-player", Collections.emptyMap()));
                else { OfflinePlayer player = Bukkit.getOfflinePlayer(uuid); capture(player, player.isOnline()); sender.sendMessage(text("queued", values("count", "1"))); }
            }
            nextAttempt = 0;
        } else sender.sendMessage(text("usage", Collections.emptyMap()));
        return true;
    }
    @Override public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!sender.hasPermission("zo7al.bridge.admin")) return Collections.emptyList();
        if (args.length == 1) return Arrays.asList("status", "reload", "sync").stream().filter(value -> value.startsWith(args[0].toLowerCase(Locale.ROOT))).collect(Collectors.toList());
        if (args.length == 2 && "sync".equalsIgnoreCase(args[0])) return Bukkit.getOnlinePlayers().stream().map(Player::getName).filter(name -> name.toLowerCase(Locale.ROOT).startsWith(args[1].toLowerCase(Locale.ROOT))).collect(Collectors.toList());
        return Collections.emptyList();
    }
}
