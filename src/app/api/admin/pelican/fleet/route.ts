import { hasAdminSession, privateHeaders } from "@/lib/server/site-security";
import { readConnections } from "@/lib/server/dashboard-connections";
import { pelicanFleet } from "@/lib/server/pelican-fleet";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  const params = new URL(request.url).searchParams, page = Number(params.get("page") ?? 1), scope = params.get("scope") ?? "all", search = params.get("search")?.trim() ?? "";
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !["all", "owner", "other"].includes(scope) || search.length > 100 || /[\x00-\x1f\x7f]/.test(search)) return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
  try {
    if (!await limitAttempt("pelican-fleet", 30, 60)) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    const connection = (await readConnections()).pelican;
    if (!connection) return Response.json({ status: "setup" }, { headers: privateHeaders });
    return Response.json({ status: "connected", ...await pelicanFleet(connection, page, search, scope as "all" | "owner" | "other") }, { headers: privateHeaders });
  } catch { return Response.json({ error: "PELICAN_UNAVAILABLE" }, { status: 502, headers: privateHeaders }); }
}
