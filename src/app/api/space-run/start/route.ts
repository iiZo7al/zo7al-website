import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { getSpaceDatabase } from "@/lib/server/space-db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "ORIGIN" }, { status: 403 });
  try {
    const identity = request.headers.get("x-space-player");
    if (identity && !/^[a-f0-9]{64}$/.test(identity)) return Response.json({ error: "INVALID" }, { status: 400 });
    const playerHash = identity ? createHmac("sha256", process.env.SPACE_RUN_SECRET!).update("player:" + identity).digest("hex") : null;
    const db = getSpaceDatabase();
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const hash = createHmac("sha256", process.env.SPACE_RUN_SECRET!).update(address).digest("hex");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [hash]);
      const recent = await client.query("SELECT count(*)::int AS count FROM space_runs WHERE client_hash=$1 AND started_at > now() - interval '1 minute'", [hash]);
      if (recent.rows[0].count >= 10) { await client.query("ROLLBACK"); return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": "60" } }); }
      const id = randomUUID(), token = randomBytes(32).toString("hex");
      await client.query("INSERT INTO space_runs (id, token_hash, client_hash, player_hash) VALUES ($1,$2,$3,$4)", [id, createHash("sha256").update(token).digest("hex"), hash, playerHash]);
      await client.query("COMMIT");
      return Response.json({ id, token }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch { return Response.json({ error: "UNAVAILABLE" }, { status: 503 }); }
}
