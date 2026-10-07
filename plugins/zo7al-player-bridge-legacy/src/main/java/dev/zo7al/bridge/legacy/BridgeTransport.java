package dev.zo7al.bridge.legacy;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import javax.net.ssl.HttpsURLConnection;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

final class BridgeTransport {
    static final class Result {
        private final int status; private final boolean confirmed;
        Result(int status, boolean confirmed) { this.status = status; this.confirmed = confirmed; }
        int status() { return status; }
        boolean confirmed() { return confirmed; }
    }
    private final URI endpoint;
    private final String token;
    private final Executor network;
    BridgeTransport(String endpoint, String token, Executor network) {
        this.endpoint = validEndpoint(endpoint); this.network = network;
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw new IllegalArgumentException("Invalid bridge key");
        this.token = token;
    }
    static URI validEndpoint(String value) {
        URI uri = URI.create(value);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null || !"/api/minecraft/bridge".equals(uri.getPath())) throw new IllegalArgumentException("Invalid bridge endpoint");
        return uri;
    }
    static String body(List<PlayerProfile> profiles) {
        JsonObject payload = new JsonObject(); payload.addProperty("schemaVersion", 1); JsonArray values = new JsonArray();
        for (PlayerProfile profile : profiles) values.add(profile.json()); payload.add("profiles", values); return payload.toString();
    }
    static boolean confirmed(String body, int expected) {
        if (body == null || body.length() > 4096) return false;
        try {
            JsonObject value = new JsonParser().parse(body).getAsJsonObject();
            return value.has("ok") && value.get("ok").isJsonPrimitive() && value.get("ok").getAsJsonPrimitive().isBoolean() && value.get("ok").getAsBoolean()
                && value.has("accepted") && value.get("accepted").isJsonPrimitive() && value.get("accepted").getAsJsonPrimitive().isNumber()
                && value.get("accepted").getAsBigDecimal().compareTo(BigDecimal.valueOf(expected)) == 0;
        } catch (RuntimeException error) { return false; }
    }
    CompletableFuture<Result> send(final List<PlayerProfile> profiles) {
        return sendPayload(endpoint, body(profiles), profiles.size());
    }
    CompletableFuture<Result> link(java.util.UUID uuid, String username, String code) {
        JsonObject value = new JsonObject(); value.addProperty("uuid", uuid.toString()); value.addProperty("username", username); value.addProperty("code", code);
        return sendPayload(endpoint.resolve("/api/minecraft/link"), value.toString(), 0);
    }
    private CompletableFuture<Result> sendPayload(final URI target, final String payload, final int expected) {
        return CompletableFuture.supplyAsync(() -> {
            HttpsURLConnection connection = null;
            try {
                connection = (HttpsURLConnection) target.toURL().openConnection(); connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(8000); connection.setReadTimeout(15000); connection.setRequestMethod("POST"); connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json"); connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("Authorization", "Bearer " + token); connection.setRequestProperty("User-Agent", "Zo7alPlayerBridgeLegacy/1.0.0");
                byte[] bytes = payload.getBytes(StandardCharsets.UTF_8); connection.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream output = connection.getOutputStream()) { output.write(bytes); }
                int status = connection.getResponseCode(); if (status < 200 || status >= 300) return new Result(status, false);
                try (InputStream input = connection.getInputStream(); ByteArrayOutputStream response = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[1024]; int count;
                    while ((count = input.read(buffer)) != -1) { if (response.size() + count > 4096) return new Result(status, false); response.write(buffer, 0, count); }
                    return new Result(status, confirmed(new String(response.toByteArray(), StandardCharsets.UTF_8), expected));
                }
            } catch (Exception error) { return new Result(0, false); }
            finally { if (connection != null) connection.disconnect(); }
        }, network);
    }
}
