export type SocialPreview = { title: string; image?: string; video?: { title: string; image: string; url: string } };

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
  return { title: title.slice(0, 300), image };
}
