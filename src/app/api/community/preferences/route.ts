import { voter } from "@/lib/server/community";
import { notificationState, saveNotificationState } from "@/lib/server/community-notifications";
import { validateNotificationPatch } from "@/lib/data/community-notifications";
import { limitAttempt } from "@/lib/server/site-content";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const visitor = voter(request, true);
  if (!visitor) return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  try {
    return Response.json(await notificationState(visitor.hash), { headers: { ...privateHeaders, ...(visitor.cookie ? { "Set-Cookie": visitor.cookie } : {}) } });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  try {
    const patch = validateNotificationPatch(await readJSON(request, 40000));
    if (!patch) return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    const visitor = voter(request);
    if (!visitor) return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
    if (visitor.cookie) return Response.json({ error: "RETRY" }, { status: 409, headers: { ...privateHeaders, "Set-Cookie": visitor.cookie } });
    if (!await limitAttempt("community-preferences:" + visitor.hash, 60, 900)) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    return Response.json({ state: await saveNotificationState(visitor.hash, patch) }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
