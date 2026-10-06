package dev.zo7al.bridge;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class StatisticsTest {
    @TempDir File directory;
    @Test void streaksResetOnDeathAndBestStreakAndBlocksSurviveRestart() throws Exception {
        File file = new File(directory, "counters.json"); UUID player = UUID.randomUUID();
        PlayerCounters counters = new PlayerCounters(file);
        assertTrue(counters.stats(player).isEmpty());
        counters.kill(player); counters.kill(player); counters.placed(player);
        assertEquals(2.0, counters.stats(player).get("streak").doubleValue());
        counters.died(player); counters.save(counters.revision(), counters.snapshot());
        PlayerCounters restored = new PlayerCounters(file);
        assertEquals(0.0, restored.stats(player).get("streak").doubleValue());
        assertEquals(2.0, restored.stats(player).get("bestStreak").doubleValue());
        assertEquals(1.0, restored.stats(player).get("blocksPlaced").doubleValue());
        assertTrue(restored.stats(UUID.randomUUID()).isEmpty());
    }
    @Test void delayedSaveCannotReplaceNewerShutdownSnapshot() throws Exception {
        File file = new File(directory, "counters.json"); UUID player = UUID.randomUUID();
        PlayerCounters counters = new PlayerCounters(file); counters.kill(player);
        long oldVersion = counters.revision(); String old = counters.snapshot(); counters.kill(player);
        counters.save(counters.revision(), counters.snapshot()); counters.save(oldVersion, old);
        assertEquals(2.0, new PlayerCounters(file).stats(player).get("streak").doubleValue());
    }
    @Test void corruptStoredCountersAreRejectedWithoutOverwritingTheFile() throws Exception {
        File file = new File(directory, "counters.json"); Files.write(file.toPath(), "not json".getBytes(StandardCharsets.UTF_8));
        assertThrows(java.io.IOException.class, () -> new PlayerCounters(file));
        assertEquals("not json", new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
    }
    @Test void offlineClassicCountersConvertTicksAndDistanceAndSumMining() {
        Map<String, Double> stats = OfflineStats.parse("{\"stat.playOneMinute\":1210,\"stat.mobKills\":12,\"stat.jump\":9,\"stat.walkOneCm\":100,\"stat.sprintOneCm\":250,\"stat.damageDealt\":40,\"stat.mineBlock.minecraft.stone\":3,\"stat.mineBlock.minecraft.dirt\":2,\"ip\":123}");
        assertEquals(60.5, stats.get("playtimeSeconds").doubleValue());
        assertEquals(3.5, stats.get("distanceMeters").doubleValue());
        assertEquals(4.0, stats.get("damageDealt").doubleValue());
        assertEquals(5.0, stats.get("blocksBroken").doubleValue());
        assertEquals(12.0, stats.get("mobKills").doubleValue());
        assertFalse(stats.containsKey("ip")); assertFalse(stats.containsKey("wins")); assertFalse(stats.containsKey("streak"));
    }
    @Test void modernOfflineCountersKeepZeroAndRejectPartialInvalidMiningTotals() {
        Map<String, Double> stats = OfflineStats.parse("{\"stats\":{\"minecraft:custom\":{\"minecraft:player_kills\":0,\"minecraft:play_time\":2400,\"minecraft:fish_caught\":5},\"minecraft:mined\":{\"minecraft:stone\":10,\"minecraft:dirt\":2}}}");
        assertEquals(0.0, stats.get("kills").doubleValue()); assertEquals(120.0, stats.get("playtimeSeconds").doubleValue());
        assertEquals(5.0, stats.get("fishCaught").doubleValue()); assertEquals(12.0, stats.get("blocksBroken").doubleValue());
        assertFalse(OfflineStats.parse("{\"stat.mineBlock.minecraft.stone\":2,\"stat.mineBlock.minecraft.dirt\":-3}").containsKey("blocksBroken"));
    }
    @Test void everyWebsiteStatisticHasAConfigurableOverride() {
        assertEquals(17, VanillaStatistics.SETTINGS.size());
        assertEquals("playtime-seconds-placeholder", VanillaStatistics.SETTINGS.get("playtimeSeconds"));
        assertEquals("streak-placeholder", VanillaStatistics.SETTINGS.get("streak"));
        assertEquals("best-streak-placeholder", VanillaStatistics.SETTINGS.get("bestStreak"));
        assertEquals("losses-placeholder", VanillaStatistics.SETTINGS.get("losses"));
    }
}
