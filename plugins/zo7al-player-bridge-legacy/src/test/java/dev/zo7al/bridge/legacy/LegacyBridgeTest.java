package dev.zo7al.bridge.legacy;

import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class LegacyBridgeTest {
    private PlayerProfile profile(UUID uuid, String rank, boolean online, long second) {
        return new PlayerProfile(uuid, "ClassicPlayer", rank, online, Instant.ofEpochSecond(second), Instant.ofEpochSecond(second), Collections.singletonMap("kills", 0.0));
    }
    @Test void classicStatsAreReadWithoutInventingMissingWins() {
        Map<String, Double> stats = OfflineStats.parse("{\"stat.playerKills\":0,\"stat.deaths\":8,\"stat.playOneMinute\":2400,\"privateInventory\":999}");
        assertEquals(0.0, stats.get("kills").doubleValue()); assertEquals(8.0, stats.get("deaths").doubleValue()); assertEquals(120.0, stats.get("playtimeSeconds").doubleValue()); assertFalse(stats.containsKey("wins")); assertEquals(3, stats.size());
    }
    @Test void malformedMissingOrNegativeCountersStayUnknown() {
        assertTrue(OfflineStats.parse("not json").isEmpty()); assertTrue(OfflineStats.parse("{}").isEmpty());
        assertTrue(OfflineStats.parse("{\"stat.playerKills\":-1,\"stat.deaths\":\"7\",\"stat.playOneMinute\":null}").isEmpty());
    }
    @Test void failedUploadCannotRevertANewerQuitAndRank() {
        UUID uuid = UUID.randomUUID(); ProfileQueue queue = new ProfileQueue(2); queue.offer(profile(uuid, "VIP", true, 100));
        java.util.List<PlayerProfile> retry = queue.drain(100); queue.offer(profile(uuid, "MVP++", false, 101)); retry.forEach(queue::offer);
        PlayerProfile current = queue.drain(1).get(0); assertEquals("MVP++", current.rank()); assertFalse(current.online());
    }
    @Test void classicQueueIsBounded() {
        ProfileQueue queue = new ProfileQueue(1); assertTrue(queue.offer(profile(UUID.randomUUID(), null, false, 100))); assertTrue(queue.full());
        assertFalse(queue.offer(profile(UUID.randomUUID(), null, false, 100))); assertEquals(1, queue.drain(100).size()); assertEquals(0, queue.size());
    }
    @Test void sameWebsiteWireContractWorksWithTheLegacyGsonApi() {
        com.google.gson.JsonObject value = new JsonParser().parse(BridgeTransport.body(Collections.singletonList(profile(UUID.randomUUID(), null, true, 100)))).getAsJsonObject();
        assertEquals(1, value.get("schemaVersion").getAsInt()); com.google.gson.JsonObject player = value.getAsJsonArray("profiles").get(0).getAsJsonObject();
        assertTrue(player.get("rank").isJsonNull()); assertFalse(player.getAsJsonObject("stats").has("wins")); assertFalse(player.has("inventory"));
    }
    @Test void classicBridgeUsesPrivateHttpsKeysAndRealAcknowledgements() {
        assertTrue(BridgeTransport.confirmed("{\"ok\":true,\"accepted\":2}", 2));
        for (String body : Arrays.asList("{}", "<html>Login</html>", "{\"ok\":true,\"accepted\":2.3}", "{\"ok\":\"true\",\"accepted\":2}", "{\"ok\":true,\"accepted\":\"2\"}")) assertFalse(BridgeTransport.confirmed(body, 2));
        for (String endpoint : Arrays.asList("http://zo7al.is-a.dev/api/minecraft/bridge", "https://user:pass@zo7al.is-a.dev/api/minecraft/bridge", "https://zo7al.is-a.dev/api/minecraft/bridge?token=secret")) assertThrows(IllegalArgumentException.class, () -> BridgeTransport.validEndpoint(endpoint));
    }
}
