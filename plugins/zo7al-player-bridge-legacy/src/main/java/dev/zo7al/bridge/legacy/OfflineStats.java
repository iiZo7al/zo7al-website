package dev.zo7al.bridge.legacy;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

/** Reads only the three numeric counters from Minecraft 1.8 statistics JSON. */
final class OfflineStats {
    static Map<String, Double> read(File file) {
        try {
            if (!file.isFile() || Files.size(file.toPath()) > 1_000_000) return new HashMap<String, Double>();
            try (InputStream input = Files.newInputStream(file.toPath()); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096]; int n;
                while ((n = input.read(buffer)) != -1) { if (output.size() + n > 1_000_000) return new HashMap<String, Double>(); output.write(buffer, 0, n); }
                return parse(new String(output.toByteArray(), StandardCharsets.UTF_8));
            }
        } catch (Exception error) { return new HashMap<String, Double>(); }
    }
    static Map<String, Double> parse(String json) {
        Map<String, Double> values = new HashMap<String, Double>();
        if (json == null || json.length() > 1_000_000) return values;
        try {
            JsonObject object = new JsonParser().parse(json).getAsJsonObject();
            number(values, object, "stat.playerKills", "kills", 1); number(values, object, "stat.deaths", "deaths", 1); number(values, object, "stat.playOneMinute", "playtimeSeconds", 20);
        } catch (RuntimeException ignored) { }
        return values;
    }
    private static void number(Map<String, Double> values, JsonObject object, String field, String key, double divisor) {
        JsonElement raw = object.get(field); if (raw == null || !raw.isJsonPrimitive() || !raw.getAsJsonPrimitive().isNumber()) return;
        double value = raw.getAsDouble() / divisor; if (Double.isFinite(value) && value >= 0 && value <= 1e12) values.put(key, value);
    }
}
