import { randomBytes, randomUUID } from "node:crypto";
import { siteDatabase } from "@/lib/server/site-db";
import { limitAttempt } from "@/lib/server/site-content";
import { hasAdminSession, privateHeaders, readJSON, sameOrigin, tokenHash } from "@/lib/server/site-security";
import { bridgeId, bridgeName } from "@/lib/data/minecraft-bridge";
import { validateVisibleStats, visiblePlayerStats } from "@/lib/data/player-statistics";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  try {
    const rows = (await (await siteDatabase()).query('SELECT b.id,b.name,b.enabled,b.visible_stats AS "visibleStats",b.created_at AS "createdAt",b.last_sync AS "lastSync",count(p.uuid)::int AS players FROM minecraft_profile_bridges b LEFT JOIN minecraft_player_profiles p ON p.bridge_id=b.id GROUP BY b.id ORDER BY b.created_at DESC LIMIT 20')).rows;
    const bridges = rows.map(row => ({ ...row, visibleStats: visiblePlayerStats(row.visibleStats) }));
    return Response.json({ bridges }, { headers: privateHeaders });
  } catch { return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders }); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  if (!sameOrigin(request)) return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  try {
    const v = await readJSON(request, 4000) as { action?: string; id?: unknown; name?: unknown; confirm?: unknown; visibleStats?: unknown };
    if (v?.confirm !== true || !["create", "rotate", "revoke", "rename", "settings"].includes(v.action ?? "")) throw Error("INVALID");
    if ((v.action !== "create" && !bridgeId(v.id)) || (["create", "rename"].includes(v.action!) && !bridgeName(v.name))) throw Error("INVALID");
    const visibleStats = v.action === "settings" ? validateVisibleStats(v.visibleStats) : undefined;
    if (visibleStats === null) throw Error("INVALID");
    if (!(await limitAttempt("admin:mc-bridge", 10, 60))) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    const db = await siteDatabase();
    if (v.action === "settings") {
      const bridge = (await db.query('UPDATE minecraft_profile_bridges SET visible_stats=$2::jsonb WHERE id=$1 RETURNING id,name,visible_stats AS "visibleStats"', [v.id, JSON.stringify(visibleStats)])).rows[0];
      if (!bridge) throw Error("INVALID");
      return Response.json({ ok: true, bridge }, { headers: privateHeaders });
    }
    if (v.action === "rename") {
      const bridge = (await db.query("UPDATE minecraft_profile_bridges SET name=$2 WHERE id=$1 RETURNING id,name", [v.id, bridgeName(v.name)])).rows[0];
      if (!bridge) throw Error("INVALID");
      return Response.json({ ok: true, bridge }, { headers: privateHeaders });
    }
    if (v.action === "revoke") {
      const result = await db.query("UPDATE minecraft_profile_bridges SET enabled=false,token_hash=NULL WHERE id=$1 RETURNING id", [v.id]);
      if (!result.rowCount) throw Error("INVALID");
      return Response.json({ ok: true }, { headers: privateHeaders });
    }
    const token = randomBytes(32).toString("base64url"), hash = tokenHash(token);
    const bridge = v.action === "create"
      ? (await db.query("INSERT INTO minecraft_profile_bridges(id,name,token_hash) SELECT $1,$2,$3 WHERE (SELECT count(*) FROM minecraft_profile_bridges)<20 RETURNING id,name", [randomUUID(), bridgeName(v.name), hash])).rows[0]
      : (await db.query("UPDATE minecraft_profile_bridges SET token_hash=$2,enabled=true WHERE id=$1 RETURNING id,name", [v.id, hash])).rows[0];
    if (!bridge) throw Error("INVALID");
    return Response.json({ bridge, token }, { headers: privateHeaders });
  } catch (error) {
    const invalid = error instanceof SyntaxError || error instanceof Error && error.message === "INVALID";
    return Response.json({ error: invalid ? "INVALID" : "UNAVAILABLE" }, { status: invalid ? 400 : 503, headers: privateHeaders });
  }
}
