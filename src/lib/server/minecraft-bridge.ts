import "server-only";
import { siteDatabase } from "./site-db";
import type { SyncedPlayerProfile } from "../data/minecraft-bridge";
import { parsePlayerRank, parsePlayerStats } from "./player-profile";

export async function receiveProfiles(id: string, hash: string, profiles: SyncedPlayerProfile[]) {
  const client = await (await siteDatabase()).connect();
  try {
    await client.query("BEGIN");
    // Revocation and writes share this row lock: a revoked key cannot finish an old write.
    const bridge = (await client.query("SELECT id FROM minecraft_profile_bridges WHERE id=$1 AND token_hash=$2 AND enabled FOR UPDATE", [id, hash])).rows[0];
    if (!bridge) throw Error("UNAUTHORIZED");
    if (profiles.length) await client.query(`INSERT INTO minecraft_player_profiles(bridge_id,uuid,username,username_key,rank,stats,online,last_seen,captured_at)
      SELECT $1,p.uuid::uuid,p.username,lower(p.username),p.rank,p.stats,p.online,p."lastSeen"::timestamptz,p."capturedAt"::timestamptz
      FROM jsonb_to_recordset($2::jsonb) AS p(uuid text,username text,rank text,stats jsonb,online boolean,"lastSeen" text,"capturedAt" text)
      ON CONFLICT(bridge_id,uuid) DO UPDATE SET username=excluded.username,username_key=excluded.username_key,rank=excluded.rank,stats=excluded.stats,online=excluded.online,last_seen=GREATEST(minecraft_player_profiles.last_seen,excluded.last_seen),captured_at=excluded.captured_at,updated_at=now()
      WHERE excluded.captured_at>=minecraft_player_profiles.captured_at`, [id, JSON.stringify(profiles)]);
    await client.query("UPDATE minecraft_profile_bridges SET last_sync=now() WHERE id=$1", [id]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
  finally { client.release(); }
}

export async function readSyncedProfile(username: string, now = Date.now(), server?: string) {
  if (!process.env.DATABASE_URL) return null;
  const rows = (await (await siteDatabase()).query(`SELECT p.uuid,p.username,p.rank,p.stats,p.online,p.last_seen AS "lastSeen",p.captured_at AS "capturedAt",p.updated_at AS "updatedAt",b.id AS "serverId",b.name AS "serverName",b.last_sync AS "lastSync"
    FROM minecraft_player_profiles p JOIN minecraft_profile_bridges b ON b.id=p.bridge_id AND b.enabled WHERE p.username_key=$1 ORDER BY p.captured_at DESC,p.updated_at DESC LIMIT 20`, [username.toLowerCase()])).rows;
  const row = server ? rows.find(value => value.serverId === server) : rows[0];
  if (!row) return null;
  const date = (v: unknown) => v instanceof Date ? v.toISOString() : typeof v === "string" && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
  const value = { ...row, lastSeen: date(row.lastSeen) }, stats = parsePlayerStats(value, username);
  const captured = date(row.capturedAt), sync = date(row.lastSync);
  const fresh = captured && sync && now - Date.parse(captured) <= 180_000 && now - Date.parse(sync) <= 180_000;
  return { uuid: row.uuid, rank: parsePlayerRank(value, username), ...stats, online: row.online === true && !fresh ? null : stats.online, serverId: row.serverId, serverName: row.serverName, servers: rows.map(value => ({ id: value.serverId, name: value.serverName })), updatedAt: date(row.updatedAt) };
}
