// The profile bridge must read the server's current permissions, not cart items or purchase history.
export function parsePlayerRank(data: unknown, username: string): string | null {
  if (!data || typeof data !== "object") return null;
  const profile = data as Record<string, unknown>;
  if (typeof profile.username !== "string" || profile.username.toLowerCase() !== username.toLowerCase()) return null;
  if (typeof profile.rank !== "string") return null;
  const rank = profile.rank.trim();
  return rank.length > 0 && rank.length <= 64 && !/[\x00-\x1f\x7f§<>]/.test(rank) ? rank : null;
}
