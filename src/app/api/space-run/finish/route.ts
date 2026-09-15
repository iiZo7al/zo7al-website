import { createHash } from "node:crypto";
import { getSpaceDatabase } from "@/lib/server/space-db";
import { validResult, plausibleResult } from "@/lib/server/space-validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "ORIGIN" }, { status: 403 });
  let body: unknown;
  try { const raw = await request.text(); if (raw.length > 2048) return Response.json({ error: "INVALID" }, { status: 400 }); body = JSON.parse(raw); } catch { return Response.json({ error: "INVALID" }, { status: 400 }); }
  if (!validResult(body)) return Response.json({ error: "INVALID" }, { status: 400 });
  try {
    const client = await getSpaceDatabase().connect();
    try {
      await client.query("BEGIN");
      const found = await client.query("SELECT *, EXTRACT(EPOCH FROM now()-started_at)::float AS elapsed FROM space_runs WHERE id=$1 AND token_hash=$2 FOR UPDATE", [body.id, createHash("sha256").update(body.token).digest("hex")]);
      const run = found.rows[0];
      if (!run || (!run.completed_at && !plausibleResult(body.score, body.stars, run.elapsed))) { await client.query("ROLLBACK"); return Response.json({ error: "INVALID_RUN" }, { status: 400 }); }
      if (!run.completed_at) await client.query("UPDATE space_runs SET name=$2, score=$3, stars=$4, completed_at=now() WHERE id=$1", [body.id, body.name.trim(), body.score, body.stars]);
      await client.query("COMMIT");
      return Response.json({ saved: true, id: body.id }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch { return Response.json({ error: "UNAVAILABLE" }, { status: 503 }); }
}
