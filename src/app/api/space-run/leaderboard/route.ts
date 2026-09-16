import { getSpaceDatabase } from "@/lib/server/space-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const result = await getSpaceDatabase().query("SELECT id, name, score, stars, completed_at AS date FROM (SELECT DISTINCT ON (COALESCE(player_hash, id::text)) id, name, score, stars, completed_at FROM space_runs WHERE completed_at IS NOT NULL ORDER BY COALESCE(player_hash, id::text), score DESC, stars DESC, completed_at ASC, id) best ORDER BY score DESC, stars DESC, completed_at ASC, id LIMIT 50");
    return Response.json({ records: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
