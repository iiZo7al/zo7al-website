package dev.zo7al.bridge.legacy;

import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

final class PlayerProfile {
    private final UUID uuid;
    private final String username, rank;
    private final boolean online;
    private final Instant lastSeen, capturedAt;
    private final Map<String, Double> stats;
    PlayerProfile(UUID uuid, String username, String rank, boolean online, Instant lastSeen, Instant capturedAt, Map<String, Double> stats) {
        this.uuid = uuid; this.username = username; this.rank = rank; this.online = online; this.lastSeen = lastSeen; this.capturedAt = capturedAt;
        this.stats = Collections.unmodifiableMap(new LinkedHashMap<String, Double>(stats));
    }
    UUID uuid() { return uuid; }
    String rank() { return rank; }
    boolean online() { return online; }
    Instant capturedAt() { return capturedAt; }
    JsonObject json() {
        JsonObject value = new JsonObject(); value.addProperty("uuid", uuid.toString()); value.addProperty("username", username);
        if (rank == null) value.add("rank", JsonNull.INSTANCE); else value.addProperty("rank", rank);
        value.addProperty("online", online); if (lastSeen == null) value.add("lastSeen", JsonNull.INSTANCE); else value.addProperty("lastSeen", lastSeen.toString());
        value.addProperty("capturedAt", capturedAt.toString()); JsonObject numbers = new JsonObject();
        for (Map.Entry<String, Double> item : stats.entrySet()) numbers.addProperty(item.getKey(), item.getValue());
        value.add("stats", numbers); return value;
    }
}
