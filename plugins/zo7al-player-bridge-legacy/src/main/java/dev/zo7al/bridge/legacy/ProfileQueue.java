package dev.zo7al.bridge.legacy;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

final class ProfileQueue {
    private final int limit;
    private final LinkedHashMap<UUID, PlayerProfile> profiles = new LinkedHashMap<UUID, PlayerProfile>();
    ProfileQueue(int limit) { this.limit = limit; }
    synchronized boolean offer(PlayerProfile profile) {
        PlayerProfile existing = profiles.get(profile.uuid());
        if (existing != null && !profile.capturedAt().isAfter(existing.capturedAt())) return true;
        if (existing == null && profiles.size() >= limit) return false;
        profiles.put(profile.uuid(), profile); return true;
    }
    synchronized List<PlayerProfile> drain(int maximum) {
        List<PlayerProfile> values = new ArrayList<PlayerProfile>(); Iterator<PlayerProfile> iterator = profiles.values().iterator();
        while (iterator.hasNext() && values.size() < maximum) { values.add(iterator.next()); iterator.remove(); }
        return values;
    }
    synchronized int size() { return profiles.size(); }
    synchronized boolean full() { return profiles.size() >= limit; }
}
