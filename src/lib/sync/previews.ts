import { fetchExternal } from "./next-data";
import { MODRINTH_API_URL, MODRINTH_FALLBACK } from "@/lib/data/modrinth";
import { getSyncedCurseForgeProjects } from "./curseforge";
import { getSyncedFortniteMaps } from "./fortnite";

export type SocialPreview =
  | { kind: "media"; title: string; image: string; meta?: string }
  | { kind: "stats"; title: string; stats: string; image?: string };

const DISCORD_INVITE_CODE = "nxScVYrSXq";
const YOUTUBE_HANDLE = "iiZo7al";

async function getDiscordPreview(): Promise<SocialPreview | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
      { signal: controller.signal, next: { revalidate: 900 } } // 15 min — counts change often
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const guildName: string | undefined = data?.guild?.name;
    const online: number | undefined = data?.approximate_presence_count;
    const total: number | undefined = data?.approximate_member_count;
    if (!guildName) throw new Error("no guild data");
    const icon =
      data?.guild?.icon && data?.guild?.id
        ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.webp?size=96`
        : undefined;
    return {
      kind: "stats",
      title: guildName,
      stats:
        online != null && total != null
          ? `${online} online · ${total} members`
          : total != null
          ? `${total} members`
          : "Open server",
      image: icon,
    };
  } catch {
    return null;
  }
}

async function getYoutubePreview(): Promise<SocialPreview | null> {
  try {
    // Resolve the handle to a channel ID from the public channel page, then
    // read the channel's public RSS feed — both work without any API key.
    const channelHtml = await fetchExternal(`https://www.youtube.com/@${YOUTUBE_HANDLE}`, 86400);
    const channelId = channelHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)?.[1];
    if (!channelId) throw new Error("channel id not found");

    const feedXml = await fetchExternal(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      3600
    );
    const firstEntry = feedXml.split("<entry>")[1];
    if (!firstEntry) throw new Error("no videos in feed");
    const title = firstEntry.match(/<media:title>([^<]*)<\/media:title>/)?.[1] ?? firstEntry.match(/<title>([^<]*)<\/title>/)?.[1];
    const thumbnail = firstEntry.match(/<media:thumbnail url="([^"]*)"/)?.[1];
    if (!title || !thumbnail) throw new Error("could not parse entry");
    return { kind: "media", title, image: thumbnail, meta: "Latest video" };
  } catch {
    return null;
  }
}

async function getModrinthPreview(): Promise<SocialPreview | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(MODRINTH_API_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    const project = first ?? MODRINTH_FALLBACK[0];
    if (!project) return null;
    return {
      kind: "media",
      title: project.title,
      image: project.icon_url ?? project.iconUrl ?? "",
      meta: "Latest on Modrinth",
    };
  } catch {
    const project = MODRINTH_FALLBACK[0];
    return project
      ? { kind: "media", title: project.title, image: project.iconUrl ?? "", meta: "Latest on Modrinth" }
      : null;
  }
}

async function getCurseForgePreview(): Promise<SocialPreview | null> {
  try {
    const { items } = await getSyncedCurseForgeProjects();
    const first = items[0];
    if (!first) return null;
    return { kind: "media", title: first.title, image: first.iconUrl, meta: "Latest on CurseForge" };
  } catch {
    return null;
  }
}

async function getFortnitePreview(): Promise<SocialPreview | null> {
  try {
    const { items } = await getSyncedFortniteMaps();
    const first = items[0];
    if (!first || !first.thumbnail) return null;
    return { kind: "media", title: first.title, image: first.thumbnail, meta: "Latest island" };
  } catch {
    return null;
  }
}

/**
 * Real, live preview content per platform — shown in a hover card on the
 * Socials page instead of sending people straight to the external site.
 * Platforms with no reliable public/keyless preview source (Instagram,
 * TikTok, X, Twitch, etc.) simply have no entry here — the card falls back
 * to its normal hover state rather than showing anything fabricated.
 */
export async function getSocialPreviews(): Promise<Record<string, SocialPreview | null>> {
  const [discord, youtube, modrinth, curseforge, fortnite] = await Promise.allSettled([
    getDiscordPreview(),
    getYoutubePreview(),
    getModrinthPreview(),
    getCurseForgePreview(),
    getFortnitePreview(),
  ]);

  const value = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);

  return {
    discord: value(discord),
    youtube: value(youtube),
    modrinth: value(modrinth),
    curseforge: value(curseforge),
    fortnite: value(fortnite),
  };
}
