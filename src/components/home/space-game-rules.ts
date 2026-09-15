export const STAR_BONUS = 500;
export const MAX_SHIELDS = 3;
export const LEADERBOARD_KEY = "zo7al.space-run.leaderboard.v1";
export const LEADERBOARD_LIMIT = 10;

export interface RunRecord {
  id: string;
  name: string;
  score: number;
  stars: number;
  date: string;
}

/** Distance from the origin to a relative-motion segment: catches fast crossings. */
export function sweptHit(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  radius: number,
): boolean {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const lengthSq = dx * dx + dy * dy + dz * dz;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, -(from.x * dx + from.y * dy + from.z * dz) / lengthSq));
  return Math.hypot(from.x + t * dx, from.y + t * dy, from.z + t * dz) <= radius;
}

export function rankRuns(value: unknown): RunRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((run): run is RunRecord => {
    if (!run || typeof run !== "object" || typeof run.id !== "string" || !run.id ||
      typeof run.name !== "string" || !run.name.trim() || run.name.length > 20 ||
      !Number.isSafeInteger(run.score) || run.score < 0 ||
      !Number.isSafeInteger(run.stars) || run.stars < 0 ||
      typeof run.date !== "string" || !Number.isFinite(Date.parse(run.date)) || seen.has(run.id)) return false;
    seen.add(run.id);
    return true;
  }).sort((a, b) => b.score - a.score || b.stars - a.stars || Date.parse(a.date) - Date.parse(b.date))
    .slice(0, LEADERBOARD_LIMIT);
}

export function readRuns(raw: string | null): RunRecord[] {
  try { return rankRuns(JSON.parse(raw ?? "[]")); } catch { return []; }
}
