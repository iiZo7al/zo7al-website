import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { validConnection } from "@/lib/data/dashboard";
import { connectionMetadata, saveConnection } from "@/lib/server/dashboard-connections";
import { clearPlatformCache, fetchPlatform } from "@/lib/server/dashboard-platforms";
import { limitAttempt } from "@/lib/server/site-content";
import { pelicanServer } from "@/lib/server/pelican";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" },{ status: 401, headers: privateHeaders });
  try { return Response.json({ connections: await connectionMetadata() },{ headers: privateHeaders }); }
  catch { return Response.json({ error: "UNAVAILABLE" },{ status: 503, headers: privateHeaders }); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" },{ status: 401, headers: privateHeaders });
  if (!sameOrigin(request)) return Response.json({ error: "INVALID" },{ status: 403, headers: privateHeaders });
  try {
    const input = validConnection(await readJSON(request,4096));
    if (!input) return Response.json({ error: "INVALID" },{ status: 400, headers: privateHeaders });
    if (!await limitAttempt("dashboard-connect",10,60)) return Response.json({ error: "RATE_LIMIT" },{ status: 429, headers: { ...privateHeaders, "Retry-After": "60" } });
    // Verify the credential with its official provider before storing it.
    if (input.provider === "pelican") await pelicanServer(input);
    else await fetchPlatform(input.provider,input);
    await saveConnection(input);
    if (input.provider !== "pelican") clearPlatformCache(input.provider);
    return Response.json({ ok: true, connections: await connectionMetadata() },{ headers: privateHeaders });
  } catch {
    return Response.json({ error: "CONNECTION_FAILED" },{ status: 400, headers: privateHeaders });
  }
}
