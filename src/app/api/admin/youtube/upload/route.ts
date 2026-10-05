import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { startYoutubeUpload, checkYoutubeUpload, sendYoutubeChunk, youtubeBody } from "@/lib/server/youtube-upload";
import { youtubeObject, YOUTUBE_UPLOAD_CHUNK } from "@/lib/data/youtube-studio";
import { YoutubeError } from "@/lib/server/youtube-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });
function failure(error: unknown) {
  if (error instanceof YoutubeError) return json({ error: error.code }, error.status);
  const code = error instanceof Error && ["INVALID", "YT_RECONNECT", "YT_SETUP"].includes(error.message) ? error.message : "YT_UNAVAILABLE";
  return json({ error: code }, code === "INVALID" ? 400 : code === "YT_UNAVAILABLE" ? 503 : 409);
}
async function guard(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  if (!sameOrigin(request)) return json({ error: "INVALID" }, 403);
  if (!await limitAttempt("youtube-studio-upload", 240, 60)) return json({ error: "YT_QUOTA" }, 429);
}
export async function POST(request: Request) {
  try {
    const blocked = await guard(request); if (blocked) return blocked;
    const body = youtubeObject(await readJSON(request, 16000));
    return json(body.action === "status" ? await checkYoutubeUpload(body.ticket) : await startYoutubeUpload(body));
  } catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  try {
    const blocked = await guard(request); if (blocked) return blocked;
    const offset = request.headers.get("x-zo7al-upload-offset"); if (offset === null || !/^\d+$/.test(offset)) throw Error("INVALID");
    return json(await sendYoutubeChunk(request.headers.get("x-zo7al-upload"), Number(offset), await youtubeBody(request, YOUTUBE_UPLOAD_CHUNK)));
  } catch (error) { return failure(error); }
}
