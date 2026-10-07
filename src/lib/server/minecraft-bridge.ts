import "server-only";
import { siteDatabase } from "./site-db";
import type { SyncedPlayerProfile } from "../data/minecraft-bridge";
import { parsePlayerRank, parsePlayerStats } from "./player-profile";
import { NETWORK_PROFILE_ID, NETWORK_PROFILE_NAME, PLAYER_STAT_KEYS, visiblePlayerStats, type PlayerStatKey } from "../data/player-statistics";

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
    if (profiles.length) await client.query(`UPDATE site_minecraft_links l SET username=current.username,username_key=current.username_key
      FROM (SELECT DISTINCT ON (p.uuid) p.uuid,p.username,p.username_key FROM minecraft_player_profiles p
      JOIN minecraft_profile_bridges b ON b.id=p.bridge_id AND b.enabled WHERE p.uuid=ANY($1::uuid[])
      ORDER BY p.uuid,p.captured_at DESC,p.updated_at DESC) current
      WHERE l.uuid=current.uuid AND l.username_key<>current.username_key
      AND NOT EXISTS(SELECT 1 FROM site_minecraft_links other WHERE other.username_key=current.username_key AND other.user_id<>l.user_id)`, [profiles.map(p=>p.uuid)]);
    await client.query("UPDATE minecraft_profile_bridges SET last_sync=now() WHERE id=$1", [id]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
  finally { client.release(); }
}

export async function readSyncedProfile(username: string, now = Date.now(), server?: string) {
  if (!process.env.DATABASE_URL) return null;
  const rows = (await (await siteDatabase()).query(`SELECT p.uuid,p.username,p.rank,p.stats,p.online,p.last_seen AS "lastSeen",p.captured_at AS "capturedAt",p.updated_at AS "updatedAt",b.id AS "serverId",b.name AS "serverName",b.last_sync AS "lastSync",b.visible_stats AS "visibleStats"
    FROM minecraft_player_profiles p JOIN minecraft_profile_bridges b ON b.id=p.bridge_id AND b.enabled
    WHERE p.uuid=(SELECT candidate.uuid FROM minecraft_player_profiles candidate JOIN minecraft_profile_bridges source ON source.id=candidate.bridge_id AND source.enabled WHERE candidate.username_key=$1 ORDER BY candidate.captured_at DESC,candidate.updated_at DESC LIMIT 1)
    ORDER BY p.captured_at DESC,p.updated_at DESC LIMIT 20`, [username.toLowerCase()])).rows;
  const row = server && server !== NETWORK_PROFILE_ID ? rows.find(value => value.serverId === server) : rows[0];
  if (!row) return null;
  const date = (v: unknown) => v instanceof Date ? v.toISOString() : typeof v === "string" && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
  // Resolve one UUID, including older names on other backends; never merge namesakes.
  const playerRows = rows.filter(value => value.uuid === row.uuid);
  const servers = [{ id: NETWORK_PROFILE_ID, name: NETWORK_PROFILE_NAME }, ...playerRows.map(value => ({ id: value.serverId, name: value.serverName }))];
  const read = (entry: typeof row) => {
    const value = { ...entry, username, lastSeen: date(entry.lastSeen) }, profile = parsePlayerStats(value, username);
    const captured = date(entry.capturedAt), sync = date(entry.lastSync);
    const fresh = captured && sync && now - Date.parse(captured) <= 180_000 && now - Date.parse(sync) <= 180_000;
    return { ...profile, online: entry.online === true && !fresh ? null : profile.online };
  };
  const rank = parsePlayerRank({ ...row, username }, username);
  if (server === NETWORK_PROFILE_ID) {
    const profiles = playerRows.map(read), selections = playerRows.map(entry => new Set(visiblePlayerStats(entry.visibleStats)));
    const totals: Partial<Record<PlayerStatKey, number>> = {};
    const statCoverage: Partial<Record<PlayerStatKey, { available: number; total: number }>> = {};
    for (const key of PLAYER_STAT_KEYS) {
      const eligible = profiles.filter((_, index) => selections[index].has(key));
      const values = eligible.flatMap(value => typeof value.stats?.[key] === "number" ? [value.stats[key]!] : []);
      if (!values.length) continue;
      totals[key] = key === "streak" || key === "bestStreak" ? Math.max(...values) : values.reduce((sum, value) => sum + value, 0);
      statCoverage[key] = { available: values.length, total: eligible.length };
    }
    const latest = (values: (string | null)[]) => values.filter((value): value is string => value !== null).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
    return { uuid: row.uuid, rank, stats: Object.keys(totals).length ? totals : null, statCoverage,
      online: profiles.some(value => value.online === true) ? true : profiles.every(value => value.online === false) ? false : null,
      lastSeen: latest(profiles.map(value => value.lastSeen)), updatedAt: latest(playerRows.map(value => date(value.updatedAt))),
      serverId: NETWORK_PROFILE_ID, serverName: NETWORK_PROFILE_NAME, servers };
  }
  const profile = read(row), visible = new Set(visiblePlayerStats(row.visibleStats));
  const stats = profile.stats ? Object.fromEntries(Object.entries(profile.stats).filter(([key]) => visible.has(key as PlayerStatKey))) : {};
  return { uuid: row.uuid, rank, ...profile, stats: Object.keys(stats).length ? stats : null, serverId: row.serverId, serverName: row.serverName, servers, updatedAt: date(row.updatedAt) };
}
