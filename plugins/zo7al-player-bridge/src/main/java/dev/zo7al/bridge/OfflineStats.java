package dev.zo7al.bridge;

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

/** Reads only numeric public statistics from old and current Minecraft stats JSON. */
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
            String[][] counters = { {"playerKills","player_kills","kills"}, {"deaths","deaths","deaths"},
                {"playOneMinute","play_time","playtimeSeconds"}, {"mobKills","mob_kills","mobKills"},
                {"jump","jump","jumps"}, {"fishCaught","fish_caught","fishCaught"}, {"animalsBred","animals_bred","animalsBred"},
                {"itemEnchanted","enchant_item","itemsEnchanted"}, {"damageDealt","damage_dealt","damageDealt"}, {"damageTaken","damage_taken","damageTaken"} };
            JsonObject stats = child(object, "stats"), custom = child(stats, "minecraft:custom");
            for (String[] counter : counters) {
                double divisor = counter[2].equals("playtimeSeconds") ? 20 : counter[2].startsWith("damage") ? 10 : 1;
                JsonElement raw = custom == null ? object.get("stat." + counter[0]) : custom.get("minecraft:" + counter[1]);
                Double value = number(raw, divisor); if (value != null) values.put(counter[2], value);
            }
            double distance = 0; boolean foundDistance = false, validDistance = true;
            String[][] distances = { {"walkOneCm","walk_one_cm"}, {"sprintOneCm","sprint_one_cm"}, {"crouchOneCm","crouch_one_cm"},
                {"swimOneCm","swim_one_cm"}, {"flyOneCm","fly_one_cm"}, {"aviateOneCm","aviate_one_cm"}, {"boatOneCm","boat_one_cm"},
                {"horseOneCm","horse_one_cm"}, {"minecartOneCm","minecart_one_cm"}, {"pigOneCm","pig_one_cm"},
                {"climbOneCm","climb_one_cm"}, {"walkOnWaterOneCm","walk_on_water_one_cm"}, {"walkUnderWaterOneCm","walk_under_water_one_cm"},
                {"striderOneCm","strider_one_cm"}, {"happyGhastOneCm","happy_ghast_one_cm"}, {"nautilusOneCm","nautilus_one_cm"} };
            for (String[] metric : distances) {
                JsonElement raw = custom == null ? object.get("stat." + metric[0]) : custom.get("minecraft:" + metric[1]);
                if (raw == null) continue; foundDistance = true; Double number = number(raw, 100);
                if (number == null) validDistance = false; else distance += number;
            }
            if (foundDistance && validDistance && distance <= 1e12) values.put("distanceMeters", distance);
            JsonObject mined = child(stats, "minecraft:mined"); double blocks = 0; boolean found = mined != null, valid = true;
            for (Map.Entry<String, JsonElement> entry : (mined == null ? object : mined).entrySet()) {
                if (mined == null && !entry.getKey().startsWith("stat.mineBlock.")) continue;
                found = true; Double count = number(entry.getValue(), 1); if (count == null) valid = false; else blocks += count;
            }
            if (found && valid && blocks <= 1e12) values.put("blocksBroken", blocks);
        } catch (RuntimeException ignored) { }
        return values;
    }
    private static JsonObject child(JsonObject object, String key) {
        JsonElement raw = object == null ? null : object.get(key); return raw != null && raw.isJsonObject() ? raw.getAsJsonObject() : null;
    }
    private static Double number(JsonElement raw, double divisor) {
        if (raw == null || !raw.isJsonPrimitive() || !raw.getAsJsonPrimitive().isNumber()) return null;
        double value = raw.getAsDouble() / divisor; return Double.isFinite(value) && value >= 0 && value <= 1e12 ? value : null;
    }
}
