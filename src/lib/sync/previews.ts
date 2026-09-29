import { allowedPreviewUrl, decodeMetadata, parseSocialMetadata, type SocialPreview } from "./social-preview-data";
export type { SocialPreview } from "./social-preview-data";

// Only public social origins; validate every redirect, not just the initial URL.
async function publicPage(url: string): Promise<string> {
  for (let hop = 0; hop < 4; hop++) {
    if (!allowedPreviewUrl(url)) throw new Error("Unsupported preview origin");
    const response = await fetch(url, {
      redirect: "manual", signal: AbortSignal.timeout(5000), next: { revalidate: 21600 },
      headers: { Accept: "text/html,application/xml", "User-Agent": "Mozilla/5.0 (compatible; Zo7alPreview/1.0)" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing redirect");
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok) throw new Error("Preview unavailable");
    const reader = response.body?.getReader();
    if (!reader) return "";
    let length = 0;
    const decoder = new TextDecoder();
    let html = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 2_000_000) break;
        html += decoder.decode(value, { stream: true });
      }
      return html + decoder.decode();
    } finally { await reader.cancel(); }
  }
  throw new Error("Too many redirects");
}

export async function getSocialPreview(url: string): Promise<SocialPreview | null> {
  try {
    // Resolve the exact URL, never reuse previews by platform across accounts.
    const page = new URL(url);
    const host = page.hostname.replace(/^www\./, "");
    const segments = page.pathname.split("/").filter(Boolean);
    if (host === "discord.gg" || (host === "discord.com" && segments[0] === "invite")) {
      const code = segments[host === "discord.gg" ? 0 : 1];
      if (code && /^[\w-]+$/.test(code)) {
        const data = JSON.parse(await publicPage(`https://discord.com/api/v10/invites/${code}`));
        const guild = data?.guild;
        if (typeof guild?.name === "string") return { title: guild.name, image: /^\d+$/.test(guild.id) && /^[\w]+$/.test(guild.icon) ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : undefined };
      }
    }
    if (host === "bsky.app" && segments[0] === "profile" && segments[1]) {
      const data = JSON.parse(await publicPage(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(segments[1])}`));
      if (typeof data?.handle === "string") return { title: data.displayName || data.handle, image: typeof data.avatar === "string" && data.avatar.startsWith("https://") ? data.avatar : undefined };
    }
    if (host === "modrinth.com" && segments[0] === "user" && segments[1]) {
      const data = JSON.parse(await publicPage(`https://api.modrinth.com/v2/user/${encodeURIComponent(segments[1])}`));
      if (typeof data?.username === "string") return { title: data.name || data.username, image: typeof data.avatar_url === "string" && data.avatar_url.startsWith("https://") ? data.avatar_url : undefined };
    }
    const html = await publicPage(url);
    const preview = parseSocialMetadata(html, url);
    if (!preview) return null;
    if (/(^|\.)youtube\.com$/.test(new URL(url).hostname)) {
      const id = html.match(/"(?:channelId|externalId)":"(UC[a-zA-Z0-9_-]{22})"/)?.[1];
      if (id) {
        try {
          const feed = await publicPage(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
          const entry = feed.split("<entry>")[1];
          const videoId = entry?.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
          const title = entry?.match(/<media:title>([^<]+)<\/media:title>/)?.[1];
          const image = entry?.match(/<media:thumbnail\s+url="(https:\/\/[^"]+)"/)?.[1];
          if (videoId && title && image) preview.video = { title: decodeMetadata(title), image: decodeMetadata(image), url: `https://www.youtube.com/watch?v=${videoId}` };
        } catch { /* Profile preview remains available if the feed is blocked. */ }
      }
    }
    return preview;
  } catch { return null; }
}
