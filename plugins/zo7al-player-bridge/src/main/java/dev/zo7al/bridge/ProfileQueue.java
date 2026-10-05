package dev.zo7al.bridge;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

/** Keeps the newest snapshot, including when an old failed upload is retried. */
final class ProfileQueue {
    private final LinkedHashMap<UUID, PlayerProfile> pending = new LinkedHashMap<>();
    private final int limit;
    ProfileQueue(int limit) { this.limit = limit; }
    synchronized boolean offer(PlayerProfile profile) {
        PlayerProfile current = pending.get(profile.uuid());
        if (current != null && !profile.capturedAt().isAfter(current.capturedAt())) return true;
        if (current == null && pending.size() >= limit) return false;
        pending.put(profile.uuid(), profile); return true;
    }
    synchronized List<PlayerProfile> drain(int maximum) {
        List<PlayerProfile> result = new ArrayList<>();
        var iterator = pending.entrySet().iterator();
        while (iterator.hasNext() && result.size() < maximum) { result.add(iterator.next().getValue()); iterator.remove(); }
        return result;
    }
    synchronized int size() { return pending.size(); }
    synchronized boolean full() { return pending.size() >= limit; }
}
