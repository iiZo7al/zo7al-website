import "server-only";
import { youtubeAuth, youtubeJSON, type YoutubeAuth } from "./youtube-auth";
import { youtubeObject as object, youtubeItems as items, youtubeString as string, youtubeId, youtubeVideoId, youtubeText as text, youtubePrivacy, youtubeDate } from "../data/youtube-studio";

export class YoutubeError extends Error {
  constructor(public code: string, public status = 502) { super(code); }
}
export async function youtubeRequest(auth: YoutubeAuth, resource: string, query: Record<string, string>, method = "GET", body?: unknown) {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + resource); url.search = new URLSearchParams(query).toString();
  const response = await fetch(url, { method, headers: { Authorization: "Bearer " + auth.accessToken, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (response.status === 204) return {};
  const value = await youtubeJSON(response);
  if (!response.ok) youtubeFailure(response.status, value);
  return value;
}
export function youtubeFailure(status: number, value?: unknown): never {
  const reason = string(object((object(object(value).error).errors as unknown[])?.[0]).reason);
  if (status === 401) throw new YoutubeError("YT_RECONNECT", 409);
  if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded", "userRateLimitExceeded"].includes(reason) || status === 429) throw new YoutubeError("YT_QUOTA", 429);
  throw new YoutubeError(status === 403 ? "YT_PERMISSION" : status === 404 ? "YT_NOT_FOUND" : status === 400 ? "INVALID" : "YT_UNAVAILABLE", status === 403 ? 403 : status === 404 ? 404 : status === 400 ? 400 : 502);
}
async function channel(auth: YoutubeAuth) {
  const value = items(await youtubeRequest(auth, "channels", { part: "snippet,statistics,contentDetails,brandingSettings,status", mine: "true" }))[0];
  if (!value || value.id !== auth.channelId) throw Error("YT_RECONNECT"); return value;
}
async function video(auth: YoutubeAuth, input: unknown) {
  const id = youtubeVideoId(input), value = items(await youtubeRequest(auth, "videos", { part: "snippet,status,statistics,contentDetails", id }))[0];
  if (!value) throw new YoutubeError("YT_NOT_FOUND", 404);
  if (object(value.snippet).channelId !== auth.channelId) throw new YoutubeError("YT_PERMISSION", 403); return value;
}
async function playlist(auth: YoutubeAuth, input: unknown) {
  const id = youtubeId(input), value = items(await youtubeRequest(auth, "playlists", { part: "snippet,status,contentDetails", id }))[0];
  if (!value) throw new YoutubeError("YT_NOT_FOUND", 404);
  if (object(value.snippet).channelId !== auth.channelId) throw new YoutubeError("YT_PERMISSION", 403); return value;
}
async function broadcast(auth: YoutubeAuth, input: unknown) {
  const id = youtubeVideoId(input), value = items(await youtubeRequest(auth, "liveBroadcasts", { part: "snippet,status,contentDetails", id }))[0];
  if (!value) throw new YoutubeError("YT_NOT_FOUND", 404);
  if (object(value.snippet).channelId !== auth.channelId) throw new YoutubeError("YT_PERMISSION", 403); return value;
}
const pageToken = (value: unknown): Record<string, string> => value === undefined || value === "" ? {} : { pageToken: text(value, 1000, true) };
const confirmed = (value: unknown) => { if (value !== true) throw Error("INVALID"); };
async function videos(auth: YoutubeAuth, params: Record<string, unknown>) {
  const search = string(params.search).trim(); let list: Record<string, unknown>, ids: string[];
  if (search) {
    list = await youtubeRequest(auth, "search", { part: "snippet", type: "video", forMine: "true", q: text(search, 100), maxResults: "25", order: "date", ...pageToken(params.pageToken) });
    ids = items(list).filter(v => object(v.snippet).channelId === auth.channelId).map(v => string(object(v.id).videoId));
  } else {
    const uploads = string(object(object((await channel(auth)).contentDetails).relatedPlaylists).uploads); if (!uploads) throw Error("YT_UNAVAILABLE");
    list = await youtubeRequest(auth, "playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "25", ...pageToken(params.pageToken) });
    ids = items(list).map(v => string(object(v.contentDetails).videoId));
  }
  const results = ids.length ? items(await youtubeRequest(auth, "videos", { part: "snippet,status,statistics,contentDetails", id: ids.map(youtubeVideoId).join(",") })).filter(v => object(v.snippet).channelId === auth.channelId) : [];
  const byId = new Map(results.map(value => [value.id, value]));
  return { items: ids.map(id => byId.get(id)).filter(Boolean), nextPageToken: list.nextPageToken ?? null, pageInfo: list.pageInfo };
}
async function analytics(auth: YoutubeAuth, input: unknown) {
  const days = Number(input ?? 28); if (![7, 28, 90, 365].includes(days)) throw Error("INVALID");
  const end = new Date(); end.setUTCDate(end.getUTCDate() - 1); const start = new Date(end); start.setUTCDate(start.getUTCDate() - days + 1);
  const from = start.toISOString().slice(0, 10), to = end.toISOString().slice(0, 10);
  const definitions = [
    { id: "summary", metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes" },
    { id: "daily", metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost", dimensions: "day", sort: "day" },
    { id: "topVideos", metrics: "views,estimatedMinutesWatched,averageViewDuration", dimensions: "video", sort: "-views", maxResults: "10" },
    { id: "countries", metrics: "views,estimatedMinutesWatched", dimensions: "country", sort: "-views", maxResults: "10" },
    { id: "traffic", metrics: "views,estimatedMinutesWatched", dimensions: "insightTrafficSourceType", sort: "-views", maxResults: "10" },
    { id: "revenue", metrics: "estimatedRevenue,estimatedAdRevenue", currency: "USD" },
  ];
  const reports = await Promise.all(definitions.map(async ({ id, ...query }) => {
    try {
      const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports"); url.search = new URLSearchParams({ ids: "channel==" + auth.channelId, startDate: from, endDate: to, ...Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) } as Record<string, string>).toString();
      const response = await fetch(url, { headers: { Authorization: "Bearer " + auth.accessToken }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
      const result = await youtubeJSON(response); if (!response.ok) youtubeFailure(response.status, result);
      if (!Array.isArray(result.columnHeaders)) throw Error("YT_UNAVAILABLE"); return { id, data: result };
    } catch (error) { return { id, error: error instanceof YoutubeError ? error.code : "YT_UNAVAILABLE" }; }
  }));
  return { days, from, to, reports };
}
export async function readYoutubeStudio(resource: string, params: Record<string, unknown>) {
  const auth = await youtubeAuth();
  switch (resource) {
    case "channel": return { channel: await channel(auth) };
    case "overview": { const [info, content] = await Promise.all([channel(auth), videos(auth, {})]); return { channel: info, ...content }; }
    case "videos": return videos(auth, params);
    case "video": return { video: await video(auth, params.id) };
    case "analytics": return analytics(auth, params.days);
    case "comments": {
      const moderationStatus = string(params.moderationStatus) || "published";
      if (!["published", "heldForReview", "likelySpam"].includes(moderationStatus)) throw Error("INVALID");
      return youtubeRequest(auth, "commentThreads", { part: "snippet,replies", allThreadsRelatedToChannelId: auth.channelId, moderationStatus, textFormat: "plainText", maxResults: "25", ...pageToken(params.pageToken), ...(params.search ? { searchTerms: text(params.search, 100) } : {}) });
    }
    case "playlists": return youtubeRequest(auth, "playlists", { part: "snippet,status,contentDetails", mine: "true", maxResults: "25", ...pageToken(params.pageToken) });
    case "playlistItems": await playlist(auth, params.id); return youtubeRequest(auth, "playlistItems", { part: "snippet,contentDetails", playlistId: youtubeId(params.id), maxResults: "25", ...pageToken(params.pageToken) });
    case "live": { const [broadcasts, streams] = await Promise.all([youtubeRequest(auth, "liveBroadcasts", { part: "snippet,status,contentDetails", broadcastStatus: "all", broadcastType: "all", maxResults: "25", ...pageToken(params.pageToken) }), youtubeRequest(auth, "liveStreams", { part: "id,snippet,status", mine: "true", maxResults: "50", fields: "items(id,snippet(title,channelId),status),nextPageToken" })]); return { ...broadcasts, streams: items(streams) }; }
    case "captions": await video(auth, params.videoId); return youtubeRequest(auth, "captions", { part: "snippet", videoId: youtubeVideoId(params.videoId) });
    default: throw Error("INVALID");
  }
}
function videoMetadata(input: Record<string, unknown>, previous?: Record<string, unknown>) {
  const oldSnippet = object(previous?.snippet), oldStatus = object(previous?.status), snippet: Record<string, unknown> = {}, status: Record<string, unknown> = {};
  for (const key of ["title", "description", "tags", "categoryId", "defaultLanguage", "defaultAudioLanguage"]) if (oldSnippet[key] !== undefined) snippet[key] = oldSnippet[key];
  for (const key of ["privacyStatus", "license", "embeddable", "publicStatsViewable", "selfDeclaredMadeForKids", "containsSyntheticMedia", "publishAt"]) if (oldStatus[key] !== undefined) status[key] = oldStatus[key];
  if (input.title !== undefined || !previous) { const title = text(input.title, 100, true); if (/[<>]/.test(title)) throw Error("INVALID"); snippet.title = title; }
  if (input.description !== undefined || !previous) snippet.description = text(input.description ?? "", 5000);
  if (input.tags !== undefined) { const tags = text(input.tags, 500).split(",").map(v => v.trim()).filter(Boolean); if (tags.length > 50) throw Error("INVALID"); snippet.tags = [...new Set(tags)]; }
  if (input.categoryId !== undefined || !previous) { if (!/^\d{1,3}$/.test(String(input.categoryId ?? 20))) throw Error("INVALID"); snippet.categoryId = String(input.categoryId ?? 20); }
  if (input.privacyStatus !== undefined || !previous) status.privacyStatus = youtubePrivacy(input.privacyStatus ?? "private");
  for (const key of ["selfDeclaredMadeForKids", "containsSyntheticMedia"]) if (input[key] !== undefined) { if (typeof input[key] !== "boolean") throw Error("INVALID"); status[key] = input[key]; }
  if (!previous && input.selfDeclaredMadeForKids === undefined) throw Error("INVALID");
  if (input.publishAt !== undefined) {
    delete status.publishAt;
    if (input.publishAt) { const date = youtubeDate(input.publishAt); if (status.privacyStatus !== "private" || Date.parse(date) <= Date.now()) throw Error("INVALID"); status.publishAt = date; }
  }
  return { snippet, status };
}
export const youtubeUploadMetadata = (input: Record<string, unknown>) => videoMetadata(input);
export async function writeYoutubeStudio(action: string, input: Record<string, unknown>) {
  const auth = await youtubeAuth();
  switch (action) {
    case "videoUpdate": { const original = await video(auth, input.id); return youtubeRequest(auth, "videos", { part: "snippet,status" }, "PUT", { id: original.id, ...videoMetadata(input, original) }); }
    case "videoDelete": confirmed(input.confirm); await video(auth, input.id); return youtubeRequest(auth, "videos", { id: youtubeVideoId(input.id) }, "DELETE");
    case "playlistCreate": return youtubeRequest(auth, "playlists", { part: "snippet,status" }, "POST", { snippet: { title: text(input.title, 150, true), description: text(input.description ?? "", 5000) }, status: { privacyStatus: youtubePrivacy(input.privacyStatus ?? "private") } });
    case "playlistUpdate": { const previous = await playlist(auth, input.id), old = object(previous.snippet); return youtubeRequest(auth, "playlists", { part: "snippet,status" }, "PUT", { id: previous.id, snippet: { ...(typeof old.defaultLanguage === "string" ? { defaultLanguage: old.defaultLanguage } : {}), title: text(input.title, 150, true), description: text(input.description ?? "", 5000) }, status: { privacyStatus: youtubePrivacy(input.privacyStatus) } }); }
    case "playlistDelete": confirmed(input.confirm); await playlist(auth, input.id); return youtubeRequest(auth, "playlists", { id: youtubeId(input.id) }, "DELETE");
    case "playlistAdd": await playlist(auth, input.id); return youtubeRequest(auth, "playlistItems", { part: "snippet" }, "POST", { snippet: { playlistId: youtubeId(input.id), resourceId: { kind: "youtube#video", videoId: youtubeVideoId(input.videoId) } } });
    case "playlistRemove": { confirmed(input.confirm); const entry = items(await youtubeRequest(auth, "playlistItems", { part: "snippet", id: youtubeId(input.itemId) }))[0]; await playlist(auth, object(entry?.snippet).playlistId); return youtubeRequest(auth, "playlistItems", { id: youtubeId(input.itemId) }, "DELETE"); }
    case "commentReply": case "commentModerate": {
      const id = youtubeId(input.id), comment = items(await youtubeRequest(auth, "comments", { part: "snippet", id, textFormat: "plainText" }))[0];
      if (!comment) throw new YoutubeError("YT_NOT_FOUND", 404);
      const snippet = object(comment.snippet); if (snippet.videoId) await video(auth, snippet.videoId); else if (snippet.channelId !== auth.channelId) throw new YoutubeError("YT_PERMISSION", 403);
      if (action === "commentReply") { confirmed(input.confirm); return youtubeRequest(auth, "comments", { part: "snippet" }, "POST", { snippet: { parentId: id, textOriginal: text(input.text, 10000, true) } }); }
      confirmed(input.confirm); if (!["published", "heldForReview", "rejected"].includes(String(input.moderationStatus))) throw Error("INVALID");
      return youtubeRequest(auth, "comments/setModerationStatus", { id, moderationStatus: String(input.moderationStatus) }, "POST");
    }
    case "channelUpdate": { const previous = await channel(auth), branding = object(previous.brandingSettings), info = object(branding.channel); return youtubeRequest(auth, "channels", { part: "brandingSettings" }, "PUT", { id: auth.channelId, brandingSettings: { ...branding, channel: { ...info, description: text(input.description ?? "", 1000), keywords: text(input.keywords ?? "", 500), ...(input.trailer ? { unsubscribedTrailer: youtubeVideoId(input.trailer) } : { unsubscribedTrailer: "" }) } } }); }
    case "liveCreate": { const date = youtubeDate(input.scheduledStartTime); if (Date.parse(date) < Date.now()) throw Error("INVALID"); return youtubeRequest(auth, "liveBroadcasts", { part: "snippet,status,contentDetails" }, "POST", { snippet: { title: text(input.title, 100, true), description: text(input.description ?? "", 5000), scheduledStartTime: date }, status: { privacyStatus: youtubePrivacy(input.privacyStatus ?? "private"), selfDeclaredMadeForKids: input.selfDeclaredMadeForKids === true }, contentDetails: { enableAutoStart: false, enableAutoStop: false } }); }
    case "liveTransition": { confirmed(input.confirm); await broadcast(auth, input.id); if (!["testing", "live", "complete"].includes(String(input.broadcastStatus))) throw Error("INVALID"); return youtubeRequest(auth, "liveBroadcasts/transition", { part: "snippet,status,contentDetails", id: youtubeVideoId(input.id), broadcastStatus: String(input.broadcastStatus) }, "POST"); }
    case "liveBind": { await broadcast(auth, input.id); const stream = items(await youtubeRequest(auth, "liveStreams", { part: "snippet", id: youtubeId(input.streamId) }))[0]; if (object(stream?.snippet).channelId !== auth.channelId) throw new YoutubeError("YT_PERMISSION", 403); return youtubeRequest(auth, "liveBroadcasts/bind", { part: "snippet,contentDetails", id: youtubeVideoId(input.id), streamId: youtubeId(input.streamId) }, "POST"); }
    case "liveDelete": confirmed(input.confirm); await broadcast(auth, input.id); return youtubeRequest(auth, "liveBroadcasts", { id: youtubeVideoId(input.id) }, "DELETE");
    case "captionDelete": { confirmed(input.confirm); const captions = await ownedCaptions(auth, input.videoId); if (!items(captions).some(v => v.id === youtubeId(input.id))) throw new YoutubeError("YT_NOT_FOUND", 404); return youtubeRequest(auth, "captions", { id: youtubeId(input.id) }, "DELETE"); }
    default: throw Error("INVALID");
  }
}
export async function ownedYoutubeVideo(auth: YoutubeAuth, id: unknown) { return video(auth, id); }
async function ownedCaptions(auth: YoutubeAuth, id: unknown) { await video(auth, id); return youtubeRequest(auth, "captions", { part: "snippet", videoId: youtubeVideoId(id) }); }
