package dev.zo7al.bridge;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

final class BridgeTransport {
    record Result(int status, boolean confirmed) {}
    private final HttpClient http;
    private final URI endpoint;
    private final String token;
    BridgeTransport(String endpoint, String token, Executor executor) {
        this.endpoint = validEndpoint(endpoint);
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw new IllegalArgumentException("Invalid bridge key");
        this.token = token;
        http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).followRedirects(HttpClient.Redirect.NEVER).executor(executor).build();
    }
    static URI validEndpoint(String value) {
        URI uri = URI.create(value);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null || !uri.getPath().equals("/api/minecraft/bridge")) throw new IllegalArgumentException("Invalid bridge endpoint");
        return uri;
    }
    static String body(List<PlayerProfile> profiles) {
        JsonObject payload = new JsonObject(); payload.addProperty("schemaVersion", 1);
        JsonArray values = new JsonArray(); profiles.forEach(profile -> values.add(profile.json())); payload.add("profiles", values);
        return payload.toString();
    }
    static boolean confirmed(String body, int expected) {
        if (body == null || body.length() > 4096) return false;
        try {
            JsonObject value = JsonParser.parseString(body).getAsJsonObject();
            return value.has("ok") && value.get("ok").isJsonPrimitive() && value.get("ok").getAsJsonPrimitive().isBoolean() && value.get("ok").getAsBoolean()
                && value.has("accepted") && value.get("accepted").isJsonPrimitive() && value.get("accepted").getAsJsonPrimitive().isNumber()
                && value.get("accepted").getAsBigDecimal().compareTo(java.math.BigDecimal.valueOf(expected)) == 0;
        } catch (RuntimeException error) { return false; }
    }
    CompletableFuture<Result> send(List<PlayerProfile> profiles) {
        HttpRequest request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(15))
            .header("Content-Type", "application/json").header("Accept", "application/json")
            .header("Authorization", "Bearer " + token).header("User-Agent", "Zo7alPlayerBridge/1.0.0")
            .POST(HttpRequest.BodyPublishers.ofString(body(profiles), StandardCharsets.UTF_8)).build();
        return http.sendAsync(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
            .thenApply(response -> new Result(response.statusCode(), response.statusCode() >= 200 && response.statusCode() < 300 && confirmed(response.body(), profiles.size())));
    }
}
