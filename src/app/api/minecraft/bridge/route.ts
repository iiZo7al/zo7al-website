import { siteDatabase } from "@/lib/server/site-db";
import { limitAttempt } from "@/lib/server/site-content";
import { privateHeaders, readJSON, tokenHash } from "@/lib/server/site-security";
import { receiveProfiles } from "@/lib/server/minecraft-bridge";
import { BRIDGE_TOKEN_PATTERN, validateProfileBatch } from "@/lib/data/minecraft-bridge";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!token || !BRIDGE_TOKEN_PATTERN.test(token)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!(await limitAttempt("mc-bridge:ip:" + ip, 120, 60))) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    const hash = tokenHash(token);
    const bridge = (await (await siteDatabase()).query("SELECT id FROM minecraft_profile_bridges WHERE token_hash=$1 AND enabled", [hash])).rows[0];
    if (!bridge) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
    if (!(await limitAttempt("mc-bridge:" + bridge.id, 120, 60))) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    const profiles = validateProfileBatch(await readJSON(request, 200_000));
    if (!profiles) return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    await receiveProfiles(bridge.id, hash, profiles);
    return Response.json({ ok: true, accepted: profiles.length }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof SyntaxError || error instanceof Error && error.message === "INVALID" ? "INVALID" : error instanceof Error && error.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "UNAVAILABLE";
    return Response.json({ error: code }, { status: code === "INVALID" ? 400 : code === "UNAUTHORIZED" ? 401 : 503, headers: privateHeaders });
  }
}
