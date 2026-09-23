/** Parse public Fortnite markup without executing scripts or translating creator text. */
export function decodeText(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, key: string) => {
    const names: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
    if (!key.startsWith("#")) return names[key.toLowerCase()] ?? entity;
    const n = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "�";
  });
}
function text(html: string) {
  return decodeText(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(?:p|div|li|span|a|button)>/gi, "\n").replace(/<[^>]*>/g, "")).trim();
}
function attributes(tag: string): Record<string, string> {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g), m => [m[1].toLowerCase(), decodeText(m[2] ?? m[3])]));
}
export function safeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try { const url = new URL(decodeText(value)); if (url.protocol === "https:") return url.href; } catch { /* invalid source */ }
}
export function fortniteLocale(locale: string) {
  return ({ en: "en-US", ar: "ar", es: "es-ES", fr: "fr", de: "de", pt: "pt-BR", tr: "tr", ja: "ja", ko: "ko", zh: "zh-CN" } as Record<string, string>)[locale] ?? "en-US";
}
export function parseCreatorIslands(html: string) {
  const found = new Map<string, { code: string; title: string; thumbnail?: string }>();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attributes(match[1]).href ?? "";
    const code = href.match(/\/(?:creative\/island-codes|@zo7al)\/(\d{4}-\d{4}-\d{4})(?:[/?#]|$)/)?.[1];
    if (!code) continue;
    const img = attributes(match[2].match(/<img\b[^>]*>/i)?.[0] ?? "");
    const title = img.alt?.trim() || text(match[2]);
    if (!title || title === code) continue;
    if (!found.has(code)) found.set(code, { code, title, thumbnail: safeMediaUrl(img.src) });
  }
  return [...found.values()];
}
function islandMetadata(html: string, code: string): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;
  const walk = (node: unknown, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 20) return;
    const obj = node as Record<string, unknown>;
    if ([obj.code, obj.linkCode, obj.mnemonic, obj.islandCode].includes(code)) {
      const metadata = obj.metadata && typeof obj.metadata === "object" ? obj.metadata as Record<string, unknown> : obj;
      if (typeof metadata.title === "string") result = metadata;
    }
    for (const value of Object.values(obj)) walk(value, depth + 1);
  };
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const a = attributes(script[1]);
    if (a.id !== "__NEXT_DATA__" && a.type !== "application/json") continue;
    try { walk(JSON.parse(script[2])); } catch { /* Ignore malformed or executable scripts. */ }
  }
  return result;
}
function metadataVideo(node: unknown, depth = 0): string | undefined {
  if (!node || typeof node !== "object" || depth > 8) return;
  for (const [key, value] of Object.entries(node)) {
    if (/video|trailer|contentUrl|\bsrc\b|\burl\b/i.test(key) && typeof value === "string" && /\.(?:mp4|webm|m3u8)(?:[?#]|$)/i.test(value)) {
      const url = safeMediaUrl(value); if (url) return url;
    }
    if (value && typeof value === "object") { const nested = metadataVideo(value, depth + 1); if (nested) return nested; }
  }
}
export type IslandDetails = { title: string; description?: string; thumbnail?: string; tags: string[]; videoUrl?: string };
export function parseIslandDetails(html: string, code: string): IslandDetails | null {
  const meta: Record<string, string> = {};
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(match[0]); if (a.property || a.name) meta[a.property || a.name] = a.content;
  }
  const data = islandMetadata(html, code);
  const canonical = Array.from(html.matchAll(/<link\b[^>]*>/gi)).map(match => attributes(match[0])).find(link => link.rel === "canonical")?.href;
  const documentTitle = text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  // Reject error/challenge pages, and do not confuse recommendations with the requested island.
  if (!data && !(meta["og:title"]?.includes(code) || meta["og:url"]?.includes(code) || meta["twitter:title"]?.includes(code) || canonical?.includes(code) || documentTitle.includes(code))) return null;
  const title = text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? (typeof data?.title === "string" ? data.title : ""));
  if (!title) return null;
  const pre = /<pre\b[^>]*>([\s\S]*?)<\/pre>/i.exec(html);
  const description = pre ? text(pre[1]) : typeof data?.description === "string" ? data.description : meta.description || meta["og:description"];
  const tags = new Set<string>();
  if (Array.isArray(data?.tags)) for (const tag of data.tags) if (typeof tag === "string") tags.add(tag);
  // Fortnite places its island tags between the description and the island-code control.
  if (!tags.size && pre) {
    const after = html.slice(pre.index + pre[0].length);
    const end = after.indexOf(code);
    if (end >= 0) {
      for (const part of text(after.slice(0, end)).split(/\n/)) {
        const tag = part.trim(); if (tag && tag.length <= 60 && !/[<>="{}]/.test(tag)) tags.add(tag);
      }
    }
  }
  const videoTag = html.match(/<video\b[^>]*>[\s\S]*?<\/video>/i)?.[0];
  const videoSrc = videoTag && (attributes(videoTag.match(/<video\b[^>]*>/i)![0]).src || attributes(videoTag.match(/<source\b[^>]*>/i)?.[0] ?? "").src);
  const videoUrl = metadataVideo(data) || safeMediaUrl(videoSrc || meta["og:video:secure_url"] || meta["og:video:url"] || meta["og:video"]);
  return { title, description, thumbnail: safeMediaUrl(meta["og:image"]), tags: [...tags].slice(0, 12), videoUrl };
}
