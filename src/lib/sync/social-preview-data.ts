export type SocialItem = { kind: "video" | "post" | "broadcast" | "project" | "island" | "game" | "link"; title: string; url: string; image?: string; detail?: string; publishedAt?: string };
export type SocialPreview = { title: string; image?: string; description?: string; items?: SocialItem[]; stats?: { key: "members" | "online" | "followers" | "downloads"; value: number }[]; contentStatus?: "live" | "empty" | "unavailable"; saved?: boolean };

const hosts = ["youtube.com", "youtu.be", "discord.com", "discord.gg", "tiktok.com", "instagram.com", "x.com", "twitter.com", "twitch.tv", "modrinth.com", "curseforge.com", "fortnite.com", "epicgames.com", "kick.com", "snapchat.com", "t.me", "telegram.me", "whatsapp.com", "wa.me", "roblox.com", "bsky.app", "playstation.com", "linktr.ee", "facebook.com", "threads.com", "threads.net", "patreon.com"];
export function allowedPreviewUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}
export function decodeMetadata(value: string): string {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#x[\da-f]+|#\d+);/gi, entity => {
    const named: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity.toLowerCase().startsWith("&#x") ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  }).trim();
}
export function parseSocialMetadata(html: string, pageUrl: string): SocialPreview | null {
  const meta: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[match[1].toLowerCase()] = decodeMetadata(match[2] ?? match[3]);
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content) meta[key.toLowerCase()] ??= attrs.content;
  }
  const title = meta["og:title"] || meta["twitter:title"];
  if (!title || /^(?:log in|login|sign in|access denied|just a moment|security check|consent required)/i.test(title)) return null;
  let image: string | undefined;
  try {
    const value = meta["og:image:secure_url"] || meta["og:image"] || meta["twitter:image"];
    if (value) { const url = new URL(value, pageUrl); if (url.protocol === "https:" && !url.username && !url.password) image = url.href; }
  } catch { /* Keep the readable profile when its image URL is invalid. */ }
  return { title: title.slice(0, 300), image, description: (meta["og:description"] || meta["twitter:description"] || meta.description || "").slice(0, 2000) || undefined };
}

/** Parse JSON assignments without truncating nested objects or braces in strings. */
export function readAssignedJson(html: string, marker: string): unknown {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf("{", at + marker.length);
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i >= 0 && i < html.length; i++) {
    const char = html[i];
    if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; continue; }
    if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; } }
  }
  return null;
}

type JsonObject = Record<string, unknown>;
export function objectsIn(value: unknown, depth = 0): JsonObject[] {
  if (depth > 24 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(item => objectsIn(item, depth + 1));
  const obj = value as JsonObject;
  return [obj, ...Object.values(obj).flatMap(item => objectsIn(item, depth + 1))];
}
const textValue = (value: unknown): string => {
  const obj = value as { simpleText?: string; runs?: { text: string }[] } | undefined;
  return obj?.simpleText || obj?.runs?.map(run => run.text).join("") || "";
};

/** Called only on /videos, never a mixed uploads RSS feed or the channel home tab. */
export function latestYoutubeVideo(html: string): SocialPreview["items"] {
  const data = readAssignedJson(html, "var ytInitialData =") ?? readAssignedJson(html, 'window["ytInitialData"] =');
  const tab = objectsIn(data).find(obj => obj.tabRenderer && (obj.tabRenderer as JsonObject).selected === true)?.tabRenderer as JsonObject | undefined;
  if (!tab?.content) return [];
  for (const obj of objectsIn(tab.content)) {
    const video = (obj.videoRenderer ?? obj.gridVideoRenderer) as JsonObject | undefined;
    if (!video || typeof video.videoId !== "string" || !/^[\w-]{11}$/.test(video.videoId)) continue;
    // Explicit duration + Videos tab exclude Shorts, upcoming and live streams.
    const duration = textValue(video.lengthText);
    if (!duration || video.upcomingEventData || /LIVE|UPCOMING|SHORTS|\/shorts\//.test(JSON.stringify([video.badges, video.thumbnailOverlays, video.navigationEndpoint]))) continue;
    const title = textValue(video.title);
    if (title) return [{ kind: "video", title, url: `https://www.youtube.com/watch?v=${video.videoId}`, image: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`, detail: duration }];
  }
  return [];
}

/** Public structured posts only, sorted by publication time rather than pinned order. */
export function structuredPosts(html: string, pageUrl: string, kind: SocialItem["kind"]): SocialItem[] {
  const candidates: SocialItem[] = [];
  const host = new URL(pageUrl).hostname.replace(/^www\./, "");
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      for (const obj of objectsIn(JSON.parse(match[1]))) {
        if (!["VideoObject", "SocialMediaPosting", "ImageObject", "BlogPosting"].includes(String(obj["@type"]))) continue;
        const url = typeof obj.url === "string" ? obj.url : typeof obj.mainEntityOfPage === "string" ? obj.mainEntityOfPage : "";
        if (!allowedPreviewUrl(url) || new URL(url).hostname.replace(/^www\./, "") !== host) continue;
        if (kind === "broadcast" && !/^https:\/\/(?:www\.)?twitch\.tv\/videos\/\d+/.test(url)) continue;
        const title = String(obj.headline || obj.name || obj.description || "").slice(0, 1500);
        const date = typeof obj.datePublished === "string" ? obj.datePublished : typeof obj.uploadDate === "string" ? obj.uploadDate : undefined;
        const thumb = Array.isArray(obj.thumbnailUrl) ? obj.thumbnailUrl[0] : obj.thumbnailUrl || obj.image;
        if (title && date && Number.isFinite(Date.parse(date))) candidates.push({ kind, title, url, publishedAt: date, image: typeof thumb === "string" && thumb.startsWith("https://") ? thumb : undefined });
      }
    } catch { /* Ignore malformed unrelated schema blocks. */ }
  }
  return candidates.sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!)).slice(0, 1);
}
