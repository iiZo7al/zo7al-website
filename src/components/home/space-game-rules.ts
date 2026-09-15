export const STAR_BONUS = 500;
export const MAX_SHIELDS = 3;
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
