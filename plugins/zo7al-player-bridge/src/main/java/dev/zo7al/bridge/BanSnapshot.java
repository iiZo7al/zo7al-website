package dev.zo7al.bridge;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.BanList;
import org.bukkit.BanEntry;
final class BanSnapshot {
 static JsonObject read(OfflinePlayer player) {
  JsonObject value=new JsonObject(); boolean banned=player.isBanned();
  BanEntry<?> entry=((org.bukkit.ban.ProfileBanList)Bukkit.getBanList(BanList.Type.PROFILE)).getBanEntry(player.getPlayerProfile());
  value.addProperty("banned",banned);value.addProperty("durationKnown",!banned||entry!=null);
  String reason=entry==null?null:entry.getReason();if(reason!=null&&reason.length()>500)reason=reason.substring(0,500);
  value.addProperty("reason",reason);value.addProperty("expiresAt",entry==null||entry.getExpiration()==null?null:entry.getExpiration().toInstant().toString());
  return value;
 }
}
