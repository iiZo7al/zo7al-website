export const PLAYER_STAT_KEYS = [
  "streak", "bestStreak", "playtimeSeconds", "kills", "deaths", "wins", "losses",
  "mobKills", "blocksBroken", "blocksPlaced", "jumps", "fishCaught", "animalsBred",
  "itemsEnchanted", "damageDealt", "damageTaken", "distanceMeters",
] as const;
export type PlayerStatKey = typeof PLAYER_STAT_KEYS[number];
export const NETWORK_PROFILE_ID = "network";
export const NETWORK_PROFILE_NAME = "Zo7al Network";

export function isPlayerStatKey(value: unknown): value is PlayerStatKey {
  return typeof value === "string" && PLAYER_STAT_KEYS.includes(value as PlayerStatKey);
}
export function validateVisibleStats(value: unknown): PlayerStatKey[] | null {
  if (!Array.isArray(value) || value.length > PLAYER_STAT_KEYS.length || !value.every(isPlayerStatKey) || new Set(value).size !== value.length) return null;
  return PLAYER_STAT_KEYS.filter(key => value.includes(key));
}
export function visiblePlayerStats(value: unknown): PlayerStatKey[] {
  // Existing connections keep all supported counters until the owner saves a selection.
  return value === undefined || value === null ? [...PLAYER_STAT_KEYS] : validateVisibleStats(value) ?? [];
}
export function parseStatNumbers(value: unknown): Partial<Record<PlayerStatKey, number>> {
  const stats: Partial<Record<PlayerStatKey, number>> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return stats;
  for (const key of PLAYER_STAT_KEYS) {
    const number = (value as Record<string, unknown>)[key];
    if (typeof number === "number" && Number.isFinite(number) && number >= 0 && number <= 1e12) stats[key] = number;
  }
  return stats;
}
