package dev.zo7al.bridge;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class BridgeTest {
    private PlayerProfile profile(UUID id, String rank, boolean online, long second) {
        return new PlayerProfile(id, ".Bedrock Name", rank, online, Instant.ofEpochSecond(second), Instant.ofEpochSecond(second), Map.of("kills", 0.0, "playtimeSeconds", 61.5));
    }
    @Test void failedBatchesCannotOverwriteNewerJoinOrRank() {
        UUID id = UUID.randomUUID(); ProfileQueue queue = new ProfileQueue(10);
        queue.offer(profile(id, "VIP", true, 100)); var failed = queue.drain(100);
        queue.offer(profile(id, "MVP++", false, 101)); failed.forEach(queue::offer);
        assertEquals(1, queue.size()); var saved = queue.drain(1).getFirst(); assertEquals("MVP++", saved.rank()); assertFalse(saved.online());
    }
    @Test void queueLimitsAreBoundedAndDrainingPreservesRemainingProfiles() {
        ProfileQueue queue = new ProfileQueue(2); queue.offer(profile(UUID.randomUUID(), null, true, 100)); queue.offer(profile(UUID.randomUUID(), null, false, 100));
        assertTrue(queue.full()); assertFalse(queue.offer(profile(UUID.randomUUID(), "OWNER", true, 100))); assertEquals(1, queue.drain(1).size()); assertFalse(queue.full()); assertEquals(1, queue.size());
    }
    @Test void unknownWinsAndRanksStayUnknownInTheWirePayload() {
        var body = JsonParser.parseString(BridgeTransport.body(List.of(profile(UUID.randomUUID(), null, true, 100)))).getAsJsonObject();
        assertEquals(1, body.get("schemaVersion").getAsInt()); var p = body.getAsJsonArray("profiles").get(0).getAsJsonObject();
        assertEquals(".Bedrock Name", p.get("username").getAsString()); assertTrue(p.get("rank").isJsonNull()); assertFalse(p.getAsJsonObject("stats").has("wins")); assertEquals(0, p.getAsJsonObject("stats").get("kills").getAsDouble());
        assertFalse(p.has("ip")); assertFalse(p.has("inventory"));
    }
    @Test void websiteAcknowledgementMustBeRealAndMatchTheBatchSize() {
        assertTrue(BridgeTransport.confirmed("{\"ok\":true,\"accepted\":2}", 2));
        assertFalse(BridgeTransport.confirmed("{\"ok\":true,\"accepted\":2.2}", 2));
        assertFalse(BridgeTransport.confirmed("{\"ok\":true,\"accepted\":\"2\"}", 2));
        for (String body : List.of("<html>Login</html>", "{}", "{\"ok\":\"true\",\"accepted\":2}", "{\"ok\":true,\"accepted\":1}", "{\"ok\":false,\"accepted\":2}")) assertFalse(BridgeTransport.confirmed(body, 2));
    }
    @Test void keysCannotBeSentThroughHttpQueryStringsOrUserinfo() {
        assertEquals("https", BridgeTransport.validEndpoint("https://zo7al.is-a.dev/api/minecraft/bridge").getScheme());
        for (String endpoint : List.of("http://zo7al.is-a.dev/api/minecraft/bridge", "https://user:password@zo7al.is-a.dev/api/minecraft/bridge", "https://zo7al.is-a.dev/api/minecraft/bridge?token=secret", "https://zo7al.is-a.dev/api/admin/hub", "https://zo7al.is-a.dev/api/minecraft/bridge#secret")) assertThrows(IllegalArgumentException.class, () -> BridgeTransport.validEndpoint(endpoint));
    }
}
