package dev.zo7al.bridge;

import org.bukkit.Material;
import org.bukkit.Statistic;
import org.bukkit.entity.Player;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

final class VanillaStatistics {
    static final Map<String, String> SETTINGS = new LinkedHashMap<String, String>();
    static {
        String[][] fields = { {"kills","kills"}, {"deaths","deaths"}, {"wins","wins"}, {"losses","losses"},
            {"streak","streak"}, {"bestStreak","best-streak"}, {"playtimeSeconds","playtime-seconds"},
            {"mobKills","mob-kills"}, {"blocksBroken","blocks-broken"}, {"blocksPlaced","blocks-placed"},
            {"jumps","jumps"}, {"fishCaught","fish-caught"}, {"animalsBred","animals-bred"}, {"itemsEnchanted","items-enchanted"},
            {"damageDealt","damage-dealt"}, {"damageTaken","damage-taken"}, {"distanceMeters","distance-meters"} };
        for (String[] field : fields) SETTINGS.put(field[0], field[1] + "-placeholder");
    }
    static Map<String, Double> read(Player player) {
        Map<String, Double> stats = new HashMap<String, Double>();
        String[][] counters = { {"kills","PLAYER_KILLS"}, {"deaths","DEATHS"}, {"mobKills","MOB_KILLS"},
            {"jumps","JUMP"}, {"fishCaught","FISH_CAUGHT"}, {"animalsBred","ANIMALS_BRED"}, {"itemsEnchanted","ITEM_ENCHANTED"},
            {"damageDealt","DAMAGE_DEALT"}, {"damageTaken","DAMAGE_TAKEN"} };
        for (String[] counter : counters) {
            Double value = read(player, counter[1]); if (value != null) stats.put(counter[0], counter[0].startsWith("damage") ? value / 10 : value);
        }
        Double ticks = read(player, "PLAY_ONE_MINUTE"); if (ticks == null) ticks = read(player, "PLAY_ONE_TICK");
        if (ticks != null) stats.put("playtimeSeconds", ticks / 20);
        double distance = 0; boolean found = false;
        for (String field : new String[] { "WALK_ONE_CM", "SPRINT_ONE_CM", "CROUCH_ONE_CM", "SWIM_ONE_CM", "FLY_ONE_CM",
                "AVIATE_ONE_CM", "BOAT_ONE_CM", "HORSE_ONE_CM", "MINECART_ONE_CM", "PIG_ONE_CM", "CLIMB_ONE_CM",
                "WALK_ON_WATER_ONE_CM", "WALK_UNDER_WATER_ONE_CM", "STRIDER_ONE_CM", "HAPPY_GHAST_ONE_CM", "NAUTILUS_ONE_CM" }) {
            Double value = read(player, field); if (value != null) { found = true; distance += value / 100; }
        }
        if (found) stats.put("distanceMeters", distance);
        double blocks = 0; boolean mined = false;
        for (Material material : Material.values()) {
            if (!material.isBlock() || material.name().startsWith("LEGACY_")) continue;
            try { blocks += player.getStatistic(Statistic.MINE_BLOCK, material); mined = true; } catch (RuntimeException ignored) { }
        }
        if (mined) stats.put("blocksBroken", blocks);
        return stats;
    }
    private static Double read(Player player, String name) {
        try { return (double) player.getStatistic(Statistic.valueOf(name)); }
        catch (RuntimeException ignored) { return null; }
    }
}
