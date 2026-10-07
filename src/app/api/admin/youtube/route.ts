import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { youtubeStatus, saveYoutubeApp, startYoutubeOAuth, disconnectYoutube } from "@/lib/server/youtube-auth";
import { readYoutubeStudio, writeYoutubeStudio, YoutubeError } from "@/lib/server/youtube-studio";
import { youtubeObject, youtubeOAuthErrors } from "@/lib/data/youtube-studio";
import { clearPlatformCache } from "@/lib/server/dashboard-platforms";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });
function failed(error: unknown) {
  if (error instanceof YoutubeError) return json({ error: error.code }, error.status);
  const code = error instanceof Error && ["INVALID", "YT_SETUP", "YT_CLIENT_MISSING", "YT_MANAGED", ...youtubeOAuthErrors].includes(error.message) ? error.message : error instanceof SyntaxError ? "INVALID" : "YT_UNAVAILABLE";
  return json({ error: code }, code === "INVALID" ? 400 : code === "YT_UNAVAILABLE" ? 503 : 409);
}
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams), resource = params.resource ?? "status";
    if (!await limitAttempt("youtube-studio-read", 90, 60)) return json({ error: "YT_QUOTA" }, 429);
    return json(resource === "status" ? await youtubeStatus(request) : { data: await readYoutubeStudio(resource, params) });
  } catch (error) { return failed(error); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  if (!sameOrigin(request)) return json({ error: "INVALID" }, 403);
  try {
    const body = youtubeObject(await readJSON(request, 24000)), input = youtubeObject(body.input), action = String(body.action);
    if (!await limitAttempt("youtube-studio-write", 40, 60)) return json({ error: "YT_QUOTA" }, 429);
    if (action === "configure") { await saveYoutubeApp(input); clearPlatformCache("youtube"); return json({ ok: true }); }
    if (action === "connect") { const value = await startYoutubeOAuth(request); return Response.json({ url: value.url }, { headers: { ...privateHeaders, "Set-Cookie": value.cookie } }); }
    if (action === "disconnect") { if (input.confirm !== true) throw Error("INVALID"); await disconnectYoutube(); clearPlatformCache("youtube"); return json({ ok: true }); }
    return json({ ok: true, data: await writeYoutubeStudio(action, input) });
  } catch (error) { return failed(error); }
}
