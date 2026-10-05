package dev.zo7al.bridge.legacy;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import org.bukkit.configuration.ConfigurationSection;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

final class LuckPermsRanks {
    private final LuckPerms api = LuckPermsProvider.get();
    private final ConfigurationSection names;
    private final ScheduledExecutorService timer;
    LuckPermsRanks(ConfigurationSection names, ScheduledExecutorService timer) { this.names = names; this.timer = timer; }
    CompletableFuture<String> rank(UUID id, boolean online) {
        User cached = api.getUserManager().getUser(id); if (cached != null) return CompletableFuture.completedFuture(name(cached));
        CompletableFuture<User> loaded = api.getUserManager().loadUser(id);
        loaded.whenComplete((user, error) -> { if (user != null && !online) api.getUserManager().cleanupUser(user); });
        CompletableFuture<String> result = loaded.thenApply(this::name).exceptionally(error -> null);
        ScheduledFuture<?> timeout = timer.schedule(() -> result.complete(null), 8, TimeUnit.SECONDS);
        result.whenComplete((value, error) -> timeout.cancel(false)); return result;
    }
    private String name(User user) {
        String group = user.getPrimaryGroup(), value = names == null ? group : names.getString(group.toLowerCase(Locale.ROOT), group);
        value = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return value.isEmpty() || value.length() > 64 || value.chars().anyMatch(c -> c < 32 || c == 127 || c == '§' || c == '<' || c == '>') ? null : value;
    }
}
