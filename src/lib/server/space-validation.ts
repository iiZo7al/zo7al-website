export function validResult(body: unknown): body is { id: string; token: string; name: string; score: number; stars: number } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id) &&
    typeof b.token === "string" && /^[0-9a-f]{64}$/i.test(b.token) &&
    typeof b.name === "string" && b.name.trim().length > 0 && b.name.trim().length <= 20 &&
    !/[\p{Cc}\p{Cf}]/u.test(b.name) && Number.isSafeInteger(b.score) && Number(b.score) >= 0 &&
    Number(b.score) <= 10000000 && Number.isSafeInteger(b.stars) && Number(b.stars) >= 0 && Number(b.stars) <= 6000;
}
export function plausibleResult(score: number, stars: number, elapsed: number) {
  // A conservative ceiling, not a claim of cheat-proof server-authoritative play.
  return elapsed >= 0 && elapsed <= 7200 && stars <= Math.ceil(elapsed / 1.35) + 1 &&
    score <= Math.ceil(elapsed * 58 * 8 + stars * 2500 + 100);
}
