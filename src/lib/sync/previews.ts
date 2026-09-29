import { getSyncedCurseForgeProjects } from "./curseforge";
import { parseCreatorIslands } from "./fortnite-parser";
import { FORTNITE_MAPS } from "@/lib/data/fortnite";
import { extractNextData, findLinkObjects } from "./next-data";
import { allowedPreviewUrl, parseSocialMetadata, latestYoutubeVideo, structuredPosts, type SocialPreview } from "./social-preview-data";
export type { SocialPreview } from "./social-preview-data";

// Only public social origins; validate every redirect, not just the initial URL.
async function publicPage(url: string): Promise<string> {
  for (let hop = 0; hop < 4; hop++) {
    if (!allowedPreviewUrl(url)) throw new Error("Unsupported preview origin");
    const response = await fetch(url, {
      redirect: "manual", signal: AbortSignal.timeout(5000), next: { revalidate: 900 },
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

const imageUrl = (value: unknown): string | undefined => typeof value === "string" && value.startsWith("https://") ? value : undefined;
const string = (value: unknown): string | undefined => typeof value === "string" ? value.slice(0, 2000) : undefined;
const json = async (url: string) => JSON.parse(await publicPage(url));

// App-owned credentials stay on the server; public-page fallback works without them.
async function twitchArchive(login: string): Promise<SocialPreview | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  let token = process.env.TWITCH_ACCESS_TOKEN;
  if (!clientId) return null;
  if (!token && process.env.TWITCH_CLIENT_SECRET) {
    const auth = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000), body: new URLSearchParams({ client_id: clientId, client_secret: process.env.TWITCH_CLIENT_SECRET, grant_type: "client_credentials" }) });
    if (!auth.ok) return null;
    token = (await auth.json()).access_token;
  }
  if (!token) return null;
  const get = async (path: string) => {
    const response = await fetch(`https://api.twitch.tv/helix/${path}`, { headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000), next: { revalidate: 900 } });
    if (!response.ok) throw new Error("Twitch unavailable");
    return response.json();
  };
  const user = (await get(`users?login=${encodeURIComponent(login)}`)).data?.[0];
  if (!user) return null;
  const videos = (await get(`videos?user_id=${encodeURIComponent(user.id)}&type=archive&sort=time&first=1`)).data;
  const video = videos?.[0];
  return { title: user.display_name, description: string(user.description), image: imageUrl(user.profile_image_url), contentStatus: video ? "live" : "empty", items: video ? [{ kind: "broadcast", title: video.title, url: video.url, image: imageUrl(video.thumbnail_url?.replace("%{width}", "640").replace("%{height}", "360")), detail: video.duration, publishedAt: video.created_at }] : [] };
}

async function xLatest(login: string): Promise<SocialPreview | null> {
  if (!process.env.X_BEARER_TOKEN) return null;
  const get = async (path: string) => {
    const response = await fetch(`https://api.x.com/2/${path}`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` }, signal: AbortSignal.timeout(5000), next: { revalidate: 900 } });
    if (!response.ok) throw new Error("X unavailable");
    return response.json();
  };
  const user = (await get(`users/by/username/${encodeURIComponent(login)}?user.fields=description,profile_image_url`)).data;
  if (!user?.id) return null;
  const feed = await get(`users/${encodeURIComponent(user.id)}/tweets?max_results=5&exclude=retweets,replies&tweet.fields=created_at&expansions=attachments.media_keys&media.fields=url,preview_image_url`);
  const tweet = feed.data?.[0];
  const mediaKey = tweet?.attachments?.media_keys?.[0];
  const media = feed.includes?.media?.find((item: { media_key: string }) => item.media_key === mediaKey);
  return { title: user.name, description: string(user.description), image: imageUrl(user.profile_image_url), contentStatus: tweet ? "live" : "empty", items: tweet ? [{ kind: "post", title: tweet.text, url: `https://x.com/${login}/status/${tweet.id}`, image: imageUrl(media?.url || media?.preview_image_url), publishedAt: tweet.created_at }] : [] };
}

export async function getSocialPreview(url: string): Promise<SocialPreview | null> {
  if (!allowedPreviewUrl(url)) return null;
  const page = new URL(url), host = page.hostname.replace(/^www\./, "");
  const segments = page.pathname.split("/").filter(Boolean);
  try {
    if (host === "twitch.tv" && /^[\w]+$/.test(segments[0] ?? "")) {
      const archive = await twitchArchive(segments[0]).catch(() => null);
      if (archive) return archive;
    }
    if (["x.com", "twitter.com"].includes(host) && segments.length === 1 && /^[\w]+$/.test(segments[0])) {
      const latest = await xLatest(segments[0]).catch(() => null);
      if (latest) return latest;
    }
    if (host === "discord.gg" || (host === "discord.com" && segments[0] === "invite")) {
      const code = segments[host === "discord.gg" ? 0 : 1];
      if (code && /^[\w-]+$/.test(code)) {
        const data = await json(`https://discord.com/api/v10/invites/${code}?with_counts=true`), guild = data?.guild;
        if (typeof guild?.name === "string") return { title: guild.name, description: string(guild.description), image: /^\d+$/.test(guild.id) && /^[\w]+$/.test(guild.icon) ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : undefined, contentStatus: "live", stats: [
          { key: "members", value: data.approximate_member_count }, { key: "online", value: data.approximate_presence_count },
        ].filter(stat => Number.isFinite(stat.value)) as SocialPreview["stats"] };
      }
    }
    if (host === "bsky.app" && segments[0] === "profile" && segments[1]) {
      const actor = encodeURIComponent(segments[1]);
      const data = await json(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${actor}`);
      const result: SocialPreview = { title: data.displayName || data.handle, description: string(data.description), image: imageUrl(data.avatar), contentStatus: "unavailable" };
      try {
        const feed = await json(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${actor}&filter=posts_no_replies&includePins=false&limit=10`);
        const post = feed.feed?.find((entry: { reason?: unknown; post?: { author?: { did?: string } } }) => !entry.reason && entry.post?.author?.did === data.did)?.post;
        result.contentStatus = post ? "live" : "empty";
        result.items = post ? [{ kind: "post", title: post.record.text, url: `https://bsky.app/profile/${data.handle}/post/${post.uri.split("/").at(-1)}`, image: imageUrl(post.embed?.images?.[0]?.fullsize), publishedAt: post.record.createdAt }] : [];
      } catch { /* Keep the bio when the feed is unavailable. */ }
      return result;
    }
    if (host === "modrinth.com" && segments[0] === "user" && segments[1]) {
      const actor = encodeURIComponent(segments[1]), data = await json(`https://api.modrinth.com/v2/user/${actor}`);
      const result: SocialPreview = { title: data.name || data.username, description: string(data.bio), image: imageUrl(data.avatar_url), contentStatus: "unavailable" };
      try {
        const projects = await json(`https://api.modrinth.com/v2/user/${actor}/projects`);
        result.items = Array.isArray(projects) ? projects.sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated)).slice(0, 3).map(project => ({ kind: "project", title: project.title, detail: project.description, url: `https://modrinth.com/${project.project_type}/${project.slug}`, image: imageUrl(project.icon_url), publishedAt: project.updated })) : [];
        result.contentStatus = result.items?.length ? "live" : "empty";
      } catch { /* Keep profile info. */ }
      return result;
    }
    if (host === "curseforge.com" && segments[0] === "members" && segments[1]?.toLowerCase() === "iizo7al") {
      const { items, source } = await getSyncedCurseForgeProjects();
      return { title: "iiZo7al", contentStatus: items.length ? "live" : "empty", saved: source !== "live", items: [...items].sort((a, b) => Date.parse(b.updated ?? "0") - Date.parse(a.updated ?? "0")).slice(0, 3).map(project => ({ kind: "project", title: project.title, url: project.url, image: imageUrl(project.iconUrl), detail: project.description, publishedAt: project.updated })) };
    }
    if (host === "roblox.com" && ["groups", "communities"].includes(segments[0]) && /^\d+$/.test(segments[1] ?? "")) {
      const id = segments[1], data = await json(`https://groups.roblox.com/v1/groups/${id}`);
      const result: SocialPreview = { title: data.name, description: string(data.description), contentStatus: "unavailable", stats: Number.isFinite(data.memberCount) ? [{ key: "members", value: data.memberCount }] : [] };
      try {
        const games = await json(`https://games.roblox.com/v2/groups/${id}/games?accessFilter=Public&sortOrder=Desc&limit=10`);
        result.items = games.data?.filter((game: { rootPlace?: { id?: number } }) => game.rootPlace?.id).slice(0, 3).map((game: { name: string; description?: string; rootPlace: { id: number } }) => ({ kind: "game", title: game.name, detail: game.description, url: `https://www.roblox.com/games/${game.rootPlace.id}` }));
        result.contentStatus = result.items?.length ? "live" : "empty";
      } catch { /* Keep community details. */ }
      return result;
    }
    const isYoutube = host === "youtube.com";
    const contentUrl = isYoutube ? `${page.origin}/${segments.slice(0, segments[0]?.startsWith("@") ? 1 : 2).join("/")}/videos` : host === "twitch.tv" ? `${page.origin}/${segments[0]}/videos?filter=archives&sort=time` : url;
    const html = await publicPage(contentUrl).catch(() => "");
    const preview = parseSocialMetadata(html, url) ?? { title: segments.at(-1)?.replace(/^@/, "") || host };
    preview.contentStatus = "unavailable";
    if (isYoutube) {
      preview.items = latestYoutubeVideo(html);
    } else if (host === "fortnite.com") {
      const maps = parseCreatorIslands(html, segments[0]?.replace(/^@/, "") || "zo7al");
      preview.items = maps.slice(0, 3).map(map => ({ kind: "island", title: map.title, detail: map.code, image: map.thumbnail, url: `https://www.fortnite.com/creative/island-codes/${map.code}` }));
      if (!preview.items.length && page.pathname.toLowerCase().replace(/\/$/, "") === "/@zo7al") {
        preview.items = FORTNITE_MAPS.slice(0, 3).map(map => ({ kind: "island", title: map.title, detail: map.code, image: map.thumbnail, url: `https://www.fortnite.com/creative/island-codes/${map.code}` }));
        preview.saved = true;
      }
    } else if (host === "linktr.ee") {
      preview.items = findLinkObjects(extractNextData(html)).filter(link => allowedPreviewUrl(link.url) && new URL(link.url).hostname !== "linktr.ee").slice(0, 6).map(link => ({ kind: "link", title: link.title || new URL(link.url).hostname, url: link.url }));
    } else {
      preview.items = structuredPosts(html, url, host === "twitch.tv" ? "broadcast" : "post");
    }
    if (preview.items?.length) preview.contentStatus = "live";
    return preview;
  } catch { return null; }
}
