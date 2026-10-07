export const studioTabs = ["overview", "content", "analytics", "comments", "playlists", "live", "subtitles", "channel", "tools"] as const;
export type StudioTab = typeof studioTabs[number];
export type StudioStatus = { connected: boolean; clientConfigured: boolean; managed: boolean; redirectUri: string; channel?: { id: string; title: string } };
export const youtubeOAuthErrors = ["YT_CLIENT_INVALID", "YT_REDIRECT", "YT_AUTH_EXPIRED", "YT_NO_CHANNEL", "YT_API_DISABLED", "YT_PERMISSION", "YT_QUOTA", "YT_RECONNECT", "YT_UNAVAILABLE"] as const;
export const youtubeObject = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const youtubeString = (value: unknown) => typeof value === "string" ? value : "";
export const youtubeItems = (value: unknown) => Array.isArray(youtubeObject(value).items) ? (youtubeObject(value).items as unknown[]).map(youtubeObject) : [];
export function youtubeVideoId(value: unknown): string {
  if (typeof value !== "string" || value.length > 250) throw Error("INVALID");
  let id = value.trim();
  if (!/^[\w-]{11}$/.test(id)) {
    let url: URL;
    try { url = new URL(id); } catch { throw Error("INVALID"); }
    const host = url.hostname.replace(/^www\./, "");
    if (url.protocol !== "https:" || url.username || url.password || !["youtube.com", "youtu.be"].includes(host)) throw Error("INVALID");
    id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|live)\/([\w-]{11})\/?$/)?.[1] ?? "";
  }
  if (!/^[\w-]{11}$/.test(id)) throw Error("INVALID"); return id;
}
export function youtubeId(value: unknown): string {
  if (typeof value !== "string" || !/^[\w.-]{5,256}$/.test(value)) throw Error("INVALID"); return value;
}
export function youtubeText(value: unknown, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || required && !value.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw Error("INVALID");
  return value;
}
export function youtubePrivacy(value: unknown): "private" | "unlisted" | "public" {
  if (!["private", "unlisted", "public"].includes(String(value))) throw Error("INVALID"); return value as "private" | "unlisted" | "public";
}
export function youtubeDate(value: unknown): string {
  if (typeof value !== "string" || value.length > 40 || !Number.isFinite(Date.parse(value))) throw Error("INVALID"); return new Date(value).toISOString();
}
export function youtubeThumbnail(value: unknown): string | null {
  const thumbs = youtubeObject(value), image = youtubeObject(thumbs.medium ?? thumbs.default ?? thumbs.high), raw = image.url;
  try { const url = new URL(String(raw)); return url.protocol === "https:" && /^(?:i[0-9]?\.ytimg\.com|yt3\.(?:ggpht\.com|googleusercontent\.com))$/.test(url.hostname) ? url.href : null; } catch { return null; }
}
export const YOUTUBE_UPLOAD_CHUNK = 2 * 1024 * 1024;
export const YOUTUBE_UPLOAD_MAX = 32 * 1024 ** 3;
