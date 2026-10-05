package dev.zo7al.bridge;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import org.bukkit.configuration.ConfigurationSection;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/** Only loaded when LuckPerms is available. Never edits permissions or prefixes. */
final class LuckPermsRanks {
    private final LuckPerms api = LuckPermsProvider.get();
    private final ConfigurationSection names;
    LuckPermsRanks(ConfigurationSection names) { this.names = names; }
    CompletableFuture<String> rank(UUID id, boolean online) {
        User cached = api.getUserManager().getUser(id);
        if (cached != null) return CompletableFuture.completedFuture(name(cached));
        CompletableFuture<User> loaded = api.getUserManager().loadUser(id);
        // Never time out LuckPerms' own shared future. Cleanup still runs if a
        // slow offline lookup finishes after this bridge's eight-second limit.
        loaded.whenComplete((user, error) -> { if (user != null && !online) api.getUserManager().cleanupUser(user); });
        return loaded.thenApply(this::name).orTimeout(8, TimeUnit.SECONDS).exceptionally(error -> null);
    }
    private String name(User user) {
        String group = user.getPrimaryGroup(), value = names == null ? group : names.getString(group.toLowerCase(Locale.ROOT), group);
        value = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return value.isEmpty() || value.length() > 64 || value.matches(".*[\\x00-\\x1f\\x7f§<>].*") ? null : value;
    }
}
