package dev.zo7al.bridge;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Local counters are independent of website credentials and survive reloads/restarts. */
final class PlayerCounters {
    private static final long LIMIT = 1_000_000_000_000L;
    private final File file;
    private final Map<UUID, long[]> players = new LinkedHashMap<UUID, long[]>();
    private long revision, savedRevision = -1;
    PlayerCounters(File file) throws IOException {
        this.file = file;
        if (file.isFile()) {
            if (Files.size(file.toPath()) > 8_000_000) throw new IOException("Statistics file is too large");
            try { restore(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8)); }
            catch (RuntimeException error) { throw new IOException("Invalid local statistics", error); }
        }
    }
    void observe(UUID id) {
        if (!players.containsKey(id) && players.size() < 50000) { players.put(id, new long[3]); revision++; }
    }
    void kill(UUID id) {
        observe(id); long[] stats = players.get(id); if (stats == null) return;
        stats[0] = Math.min(LIMIT, stats[0] + 1); stats[1] = Math.max(stats[1], stats[0]); revision++;
    }
    void died(UUID id) { observe(id); long[] stats = players.get(id); if (stats != null && stats[0] != 0) { stats[0] = 0; revision++; } }
    void placed(UUID id) { observe(id); long[] stats = players.get(id); if (stats != null) { stats[2] = Math.min(LIMIT, stats[2] + 1); revision++; } }
    Map<String, Double> stats(UUID id) {
        Map<String, Double> values = new HashMap<String, Double>(); long[] stats = players.get(id);
        if (stats != null) { values.put("streak", (double) stats[0]); values.put("bestStreak", (double) stats[1]); values.put("blocksPlaced", (double) stats[2]); }
        return values;
    }
    long revision() { return revision; }
    String snapshot() {
        JsonObject data = new JsonObject();
        for (Map.Entry<UUID, long[]> player : players.entrySet()) {
            JsonObject stats = new JsonObject(); long[] values = player.getValue();
            stats.addProperty("streak", values[0]); stats.addProperty("bestStreak", values[1]); stats.addProperty("blocksPlaced", values[2]);
            data.add(player.getKey().toString(), stats);
        }
        return data.toString();
    }
    private void restore(String json) {
        JsonObject data = new JsonParser().parse(json).getAsJsonObject();
        if (data.entrySet().size() > 50000) throw new IllegalArgumentException("Too many profiles");
        for (Map.Entry<String, JsonElement> player : data.entrySet()) {
            UUID id = UUID.fromString(player.getKey()); JsonObject raw = player.getValue().getAsJsonObject();
            long current = counter(raw.get("streak")), best = counter(raw.get("bestStreak")), placed = counter(raw.get("blocksPlaced"));
            players.put(id, new long[] { current, Math.max(current, best), placed });
        }
    }
    private static long counter(JsonElement raw) {
        if (raw == null || !raw.isJsonPrimitive() || !raw.getAsJsonPrimitive().isNumber()) throw new IllegalArgumentException("Missing counter");
        double value = raw.getAsDouble();
        if (!Double.isFinite(value) || value < 0 || value > LIMIT || value != Math.floor(value)) throw new IllegalArgumentException("Invalid counter");
        return (long) value;
    }
    synchronized void save(long version, String snapshot) throws IOException {
        // An older asynchronous save cannot replace the final shutdown snapshot.
        if (version <= savedRevision) return;
        Files.createDirectories(file.toPath().getParent()); File temporary = new File(file.getPath() + ".tmp");
        Files.write(temporary.toPath(), snapshot.getBytes(StandardCharsets.UTF_8));
        try { Files.move(temporary.toPath(), file.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); }
        catch (AtomicMoveNotSupportedException error) { Files.move(temporary.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING); }
        savedRevision = version;
    }
}
