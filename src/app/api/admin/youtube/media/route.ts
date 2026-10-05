import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { hasAdminSession, privateHeaders, sameOrigin } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
import { youtubeAuth, youtubeJSON } from "@/lib/server/youtube-auth";
import { YoutubeError, ownedYoutubeVideo, youtubeFailure, youtubeRequest } from "@/lib/server/youtube-studio";
import { youtubeBody } from "@/lib/server/youtube-upload";
import { youtubeItems, youtubeVideoId, youtubeId, youtubeText } from "@/lib/data/youtube-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });
function failed(error: unknown) {
  if (error instanceof YoutubeError) return json({ error: error.code }, error.status);
  const code = error instanceof Error && ["INVALID", "YT_RECONNECT", "YT_SETUP"].includes(error.message) ? error.message : "YT_UNAVAILABLE";
  return json({ error: code }, code === "INVALID" ? 400 : code === "YT_UNAVAILABLE" ? 503 : 409);
}
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  try {
    if (!await limitAttempt("youtube-media-read", 30, 60)) return json({ error: "YT_QUOTA" }, 429);
    const params = new URL(request.url).searchParams, videoId = youtubeVideoId(params.get("videoId")), id = youtubeId(params.get("id"));
    const auth = await youtubeAuth(); await ownedYoutubeVideo(auth, videoId);
    const captions = await youtubeRequest(auth, "captions", { part: "snippet", videoId });
    if (!youtubeItems(captions).some(v => v.id === id)) throw new YoutubeError("YT_NOT_FOUND", 404);
    const response = await fetch("https://www.googleapis.com/youtube/v3/captions/" + encodeURIComponent(id) + "?tfmt=srt", { headers: { Authorization: "Bearer " + auth.accessToken }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) youtubeFailure(response.status, await youtubeJSON(response));
    return new Response(new Uint8Array(await youtubeBody(response, 2 * 1024 * 1024)), { headers: { ...privateHeaders, "Content-Type": "application/x-subrip; charset=utf-8", "Content-Disposition": `attachment; filename="${videoId}.srt"`, "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return failed(error); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return json({ error: "UNAUTHORIZED" }, 401);
  if (!sameOrigin(request)) return json({ error: "INVALID" }, 403);
  try {
    if (!await limitAttempt("youtube-media-write", 20, 60)) return json({ error: "YT_QUOTA" }, 429);
    const type = request.headers.get("content-type") ?? ""; if (!type.startsWith("multipart/form-data;")) throw Error("INVALID");
    const data = await youtubeBody(request, 2 * 1024 * 1024 + 65536);
    const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": type }, body: new Uint8Array(data) }).formData();
    if (form.getAll("file").length !== 1) throw Error("INVALID");
    const file = form.get("file"), action = form.get("action"), videoId = youtubeVideoId(form.get("videoId"));
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) throw Error("INVALID");
    const auth = await youtubeAuth(); await ownedYoutubeVideo(auth, videoId);
    let url: string, body: Uint8Array, contentType: string;
    if (action === "thumbnail") {
      const bytes = Buffer.from(await file.arrayBuffer());
      try {
        const image = sharp(bytes, { limitInputPixels: 32_000_000, animated: false }), metadata = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1) throw Error();
        body = new Uint8Array(await image.rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer());
      } catch { throw Error("INVALID"); }
      url = "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=" + videoId + "&uploadType=media"; contentType = "image/jpeg";
    } else if (action === "caption") {
      if (file.size > 1024 * 1024) throw Error("INVALID");
      const language = String(form.get("language")), name = youtubeText(form.get("name") ?? "", 150), bytes = Buffer.from(await file.arrayBuffer());
      let text: string; try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw Error("INVALID"); }
      if (!/^[a-z]{2,3}(?:-[A-Za-z]{2,8})?$/.test(language) || text.includes("\0") || !/(?:\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+(?:\d{2}:)?\d{2}:\d{2}[.,]\d{3}/.test(text)) throw Error("INVALID");
      const boundary = "zo7al_" + randomBytes(24).toString("hex"), metadata = { snippet: { videoId, language, name, isDraft: form.get("draft") === "true" } };
      body = new Uint8Array(Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`), bytes, Buffer.from(`\r\n--${boundary}--\r\n`)]));
      url = "https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet"; contentType = "multipart/related; boundary=" + boundary;
    } else throw Error("INVALID");
    const response = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + auth.accessToken, "Content-Type": contentType }, body: new Uint8Array(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000) });
    const value = await youtubeJSON(response); if (!response.ok) youtubeFailure(response.status, value);
    return json({ ok: true, data: value });
  } catch (error) { return failed(error); }
}
