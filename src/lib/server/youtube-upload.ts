import "server-only";
import { openYoutube, sealYoutube, youtubeAuth, youtubeJSON } from "./youtube-auth";
import { youtubeFailure, youtubeUploadMetadata } from "./youtube-studio";
import { YOUTUBE_UPLOAD_CHUNK, YOUTUBE_UPLOAD_MAX, youtubeObject, youtubeVideoId } from "../data/youtube-studio";

export function youtubeUploadURL(value: unknown): string {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.hostname !== "www.googleapis.com" || url.port || url.username || url.password || url.pathname !== "/upload/youtube/v3/videos" || !url.searchParams.get("upload_id")) throw Error();
    return url.href;
  } catch { throw Error("YT_UNAVAILABLE"); }
}
export function youtubeUploadOffset(range: string | null, total: number): number {
  if (!range) return 0;
  const match = range.match(/^bytes=0-(\d+)$/);
  const offset = match ? Number(match[1]) + 1 : NaN;
  if (!Number.isSafeInteger(offset) || offset < 1 || offset > total) throw Error("YT_UNAVAILABLE");
  return offset;
}
type Ticket = { url: string; size: number; mime: string; channelId: string; expiresAt: number };
export async function startYoutubeUpload(input: Record<string, unknown>) {
  const size = Number(input.size), mime = String(input.mime);
  if (!Number.isSafeInteger(size) || size < 1 || size > YOUTUBE_UPLOAD_MAX || !/^video\/[\w.+-]{1,80}$/.test(mime)) throw Error("INVALID");
  const metadata = youtubeUploadMetadata(input), auth = await youtubeAuth();
  const response = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST", headers: { Authorization: "Bearer " + auth.accessToken, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": mime }, body: JSON.stringify(metadata), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) youtubeFailure(response.status, await youtubeJSON(response));
  const ticket: Ticket = { url: youtubeUploadURL(response.headers.get("location")), size, mime, channelId: auth.channelId, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
  return { ticket: sealYoutube(ticket, "upload"), offset: 0, done: false };
}
async function uploadContext(input: unknown) {
  if (typeof input !== "string" || input.length > 12000) throw Error("INVALID");
  let ticket: Ticket;
  try { ticket = openYoutube(input, "upload") as Ticket; } catch { throw Error("INVALID"); }
  if (!Number.isSafeInteger(ticket.size) || ticket.size < 1 || ticket.size > YOUTUBE_UPLOAD_MAX || !Number.isFinite(ticket.expiresAt) || ticket.expiresAt < Date.now()) throw Error("INVALID");
  const url = youtubeUploadURL(ticket.url), auth = await youtubeAuth();
  if (auth.channelId !== ticket.channelId) throw Error("YT_RECONNECT");
  return { ticket, auth, url };
}
async function result(response: Response, total: number) {
  if (response.status === 308) return { offset: youtubeUploadOffset(response.headers.get("range"), total), done: false };
  const value = await youtubeJSON(response);
  if (!response.ok) youtubeFailure(response.status, value);
  const id = youtubeVideoId(youtubeObject(value).id);
  return { offset: total, done: true, id };
}
export async function checkYoutubeUpload(input: unknown) {
  const { ticket, auth, url } = await uploadContext(input);
  const response = await fetch(url, { method: "PUT", headers: { Authorization: "Bearer " + auth.accessToken, "Content-Range": "bytes */" + ticket.size, "Content-Length": "0" }, body: new Uint8Array(), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(20000) });
  return result(response, ticket.size);
}
export async function sendYoutubeChunk(input: unknown, offset: number, data: Buffer) {
  const { ticket, auth, url } = await uploadContext(input);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= ticket.size || offset % (256 * 1024) || !data.length || data.length > YOUTUBE_UPLOAD_CHUNK || offset + data.length > ticket.size || offset + data.length < ticket.size && data.length % (256 * 1024)) throw Error("INVALID");
  const response = await fetch(url, { method: "PUT", headers: { Authorization: "Bearer " + auth.accessToken, "Content-Type": ticket.mime, "Content-Length": String(data.length), "Content-Range": `bytes ${offset}-${offset + data.length - 1}/${ticket.size}` }, body: new Uint8Array(data), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(40000) });
  return result(response, ticket.size);
}
export async function youtubeBody(request: Request | Response, max: number) {
  const reader = request.body?.getReader(); if (!reader) throw Error("INVALID");
  let length = 0; const chunks: Uint8Array[] = [];
  try { while (true) { const v = await reader.read(); if (v.done) break; length += v.value.length; if (length > max) throw Error("INVALID"); chunks.push(v.value); } return Buffer.concat(chunks); }
  finally { await reader.cancel(); }
}
