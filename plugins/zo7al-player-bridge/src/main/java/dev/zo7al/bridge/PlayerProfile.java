package dev.zo7al.bridge;

import com.google.gson.JsonObject;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

record PlayerProfile(UUID uuid, String username, String rank, boolean online,
                     Instant lastSeen, Instant capturedAt, Map<String, Double> stats) {
    PlayerProfile { stats = Map.copyOf(stats); }
    PlayerProfile withRank(String value) { return new PlayerProfile(uuid, username, value, online, lastSeen, capturedAt, stats); }
    PlayerProfile withStats(Map<String, Double> values) { return new PlayerProfile(uuid, username, rank, online, lastSeen, capturedAt, values); }
    JsonObject json() {
        JsonObject value = new JsonObject();
        value.addProperty("uuid", uuid.toString()); value.addProperty("username", username);
        value.addProperty("rank", rank); value.addProperty("online", online);
        value.addProperty("lastSeen", lastSeen == null ? null : lastSeen.toString()); value.addProperty("capturedAt", capturedAt.toString());
        JsonObject counters = new JsonObject(); stats.forEach(counters::addProperty); value.add("stats", counters);
        return value;
    }
}
