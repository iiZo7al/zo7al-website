import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { modrinthStatus, saveModrinthApp, startModrinthOAuth, disconnectModrinth } from "@/lib/server/modrinth-auth";
import { clearPlatformCache } from "@/lib/server/dashboard-platforms";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });
function failed(error: unknown) {
  const code = error instanceof Error && ["INVALID", "MR_RECONNECT", "MR_CLIENT_MISSING", "MR_MANAGED"].includes(error.message) ? error.message : error instanceof SyntaxError ? "INVALID" : "MR_UNAVAILABLE";
  return json({ error: code }, code === "INVALID" ? 400 : code === "MR_UNAVAILABLE" ? 503 : 409);
}
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  try {
    if (!await limitAttempt("modrinth-oauth-read", 60, 60)) return json({ error: "RATE_LIMIT" }, 429);
    return json(await modrinthStatus(request));
  } catch (error) { return failed(error); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  if (!sameOrigin(request)) return json({ error: "INVALID" }, 403);
  try {
    const body = await readJSON(request, 4000) as { action?: string; input?: unknown };
    if (!await limitAttempt("modrinth-oauth-write", 20, 60)) return json({ error: "RATE_LIMIT" }, 429);
    if (body?.action === "configure") { await saveModrinthApp(body.input); clearPlatformCache("modrinth"); return json({ ok: true }); }
    if (body?.action === "connect") { const value = await startModrinthOAuth(request); return Response.json({ url: value.url }, { headers: { ...privateHeaders, "Set-Cookie": value.cookie } }); }
    if (body?.action === "disconnect") {
      if (!body.input || typeof body.input !== "object" || (body.input as { confirm?: boolean }).confirm !== true) throw Error("INVALID");
      await disconnectModrinth(); clearPlatformCache("modrinth"); return json({ ok: true });
    }
    throw Error("INVALID");
  } catch (error) { return failed(error); }
}
