export const BRIDGE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const PLAYER_NAME_PATTERN = /^[.a-zA-Z0-9_ ]{3,32}$/;
export const BRIDGE_BATCH_LIMIT = 100;
export type SyncedPlayerProfile = {
  uuid: string; username: string; rank: string | null; stats: Record<string, number>;
  online: boolean; lastSeen: string | null; capturedAt: string;
};
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export const bridgeId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
export function bridgeName(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 64 && !/[\x00-\x1f\x7f<>§]/.test(value) ? value.trim() : null;
}
export function validateProfileBatch(value: unknown, now = Date.now()): SyncedPlayerProfile[] | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1 || !Array.isArray(v.profiles) || v.profiles.length > BRIDGE_BATCH_LIMIT) return null;
  const seen = new Set<string>(), profiles: SyncedPlayerProfile[] = [];
  const date = (value: unknown) => typeof value === "string" && value.length <= 50 && Number.isFinite(Date.parse(value)) && Date.parse(value) >= Date.UTC(2009,0,1) && Date.parse(value) <= now + 120_000 ? new Date(value).toISOString() : null;
  for (const item of v.profiles) {
    if (!item || typeof item !== "object") return null;
    const p = item as Record<string, unknown>, capturedAt = date(p.capturedAt);
    if (!bridgeId(p.uuid) || seen.has(p.uuid.toLowerCase()) || typeof p.username !== "string" || !PLAYER_NAME_PATTERN.test(p.username) || !p.username.trim() || typeof p.online !== "boolean" || !capturedAt) return null;
    if (p.rank !== null && p.rank !== undefined && (typeof p.rank !== "string" || !p.rank.trim() || p.rank.length > 64 || /[\x00-\x1f\x7f§<>]/.test(p.rank))) return null;
    const stats: Record<string, number> = {};
    if (p.stats !== undefined && (p.stats === null || typeof p.stats !== "object" || Array.isArray(p.stats))) return null;
    for (const key of ["kills", "deaths", "wins", "playtimeSeconds"]) {
      const n = (p.stats as Record<string, unknown> | undefined)?.[key];
      if (n === undefined || n === null) continue;
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e12) return null;
      stats[key] = n;
    }
    const lastSeen = p.lastSeen === null || p.lastSeen === undefined ? null : date(p.lastSeen);
    if (p.lastSeen !== null && p.lastSeen !== undefined && !lastSeen) return null;
    seen.add(p.uuid.toLowerCase());
    profiles.push({ uuid: p.uuid.toLowerCase(), username: p.username.trim(), rank: typeof p.rank === "string" ? p.rank.trim() : null, stats, online: p.online, lastSeen, capturedAt });
  }
  return profiles;
}
