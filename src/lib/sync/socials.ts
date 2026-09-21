import { detectPlatform } from "@/components/ui/BrandIcon";
import { SOCIALS as SOCIALS_FALLBACK } from "@/lib/data/site";
import { extractNextData, findLinkObjects, fetchExternal } from "./next-data";

export type SyncedSocial = {
  id: string;
  platform: string;
  label: string;
  url: string;
  description?: string;
  handle?: string;
  color?: string;
};

const LINKTREE_URL = "https://linktr.ee/Zo7al";
const OWN_SLUG = "zo7al";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  discord: "Discord",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  twitch: "Twitch",
  modrinth: "Modrinth",
  curseforge: "CurseForge",
  fortnite: "Fortnite",
  epicgames: "Epic Games",
  kick: "Kick",
  snapchat: "Snapchat",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  roblox: "Roblox",
  bluesky: "Bluesky",
  playstation: "PlayStation",
  linktree: "Linktree",
  facebook: "Facebook",
  threads: "Threads",
  patreon: "Patreon",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  discord: "#5865F2",
  tiktok: "#000000",
  instagram: "#E4405F",
  x: "#000000",
  twitch: "#9146FF",
  modrinth: "#32B16D",
  curseforge: "#F47B20",
  fortnite: "#00BFFF",
  epicgames: "#333333",
  kick: "#53FC18",
  snapchat: "#FFFC00",
  telegram: "#0088cc",
  whatsapp: "#25D366",
  roblox: "#E2231A",
  bluesky: "#0085ff",
  playstation: "#003087",
  linktree: "#44E58D",
  facebook: "#1877F2",
  threads: "#000000",
  patreon: "#F96854",
};

function isNoiseLinktreeUrl(url: URL): boolean {
  if (url.hostname !== "linktr.ee") return false;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return true; // marketing/blog/help pages are multi-segment
  const slug = segments[0].toLowerCase();
  const reserved = ["blog", "help", "pricing", "templates", "marketplace", "discover", "privacy", "s", "features", "solutions", "link-in-bio"];
  if (reserved.includes(slug)) return true;
  if (slug === OWN_SLUG) return true; // skip self-link
  return false;
}

export async function getSyncedSocials(): Promise<{
  items: SyncedSocial[];
  source: "live" | "fallback";
}> {
  try {
    const html = await fetchExternal(LINKTREE_URL, 21600); // refresh every 6h
    const data = extractNextData(html);
    if (!data) throw new Error("no __NEXT_DATA__ found");

    const raw = findLinkObjects(data);
    const seen = new Set<string>();
    const items: SyncedSocial[] = [];

    for (const link of raw) {
      let parsed: URL;
      try {
        parsed = new URL(link.url);
      } catch {
        continue;
      }
      if (isNoiseLinktreeUrl(parsed) || (parsed.hostname === "linktr.ee" && parsed.pathname.toLowerCase().replace(/\/$/, "") === "/zo7algames")) continue;

      const platform = detectPlatform(link.url) ?? (parsed.hostname === "linktr.ee" ? "linktree" : null);
      if (!platform) continue;

      const dedupeKey = `${platform}:${parsed.hostname}${parsed.pathname}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      items.push({
        id: dedupeKey,
        platform,
        label: platform === "linktree" && parsed.pathname.toLowerCase().replace(/\/$/, "") === "/zo7algames" ? "Zo7al Games" : PLATFORM_LABELS[platform] ?? link.title ?? platform,
        url: link.url,
        description: link.title,
        color: PLATFORM_COLORS[platform],
      });
    }

    if (items.length === 0) throw new Error("no recognizable links parsed");
    for (const account of SOCIALS_FALLBACK) {
      if (!items.some((item) => item.platform === account.id)) items.push({ ...account, platform: account.id });
    }
    return { items, source: "live" };
  } catch {
    return {
      items: SOCIALS_FALLBACK.map((s) => ({
        id: s.id,
        platform: s.id,
        label: s.label,
        url: s.url,
        description: s.description,
        color: PLATFORM_COLORS[s.id],
      })),
      source: "fallback",
    };
  }
}


const GAMES_FALLBACK = [
  ["fortnite", "https://www.fortnite.com/@zo7algames"],
  ["roblox", "https://www.roblox.com/communities/35871241/Zo7al-Games"],
  ["instagram", "https://instagram.com/zo7algames"],
  ["tiktok", "https://tiktok.com/@zo7algemes"],
  ["youtube", "https://youtube.com/@Zo7alGames"],
  ["snapchat", "https://www.snapchat.com/add/Zo7algames"],
  ["threads", "https://www.threads.com/@zo7algemes"],
  ["x", "https://x.com/Zo7alGames"],
  ["bluesky", "https://bsky.app/profile/zo7algames.bsky.social"],
] as const;

export async function getSyncedGamesSocials(): Promise<{ items: SyncedSocial[]; source: "live" | "fallback" }> {
  try {
    const html = await fetchExternal("https://linktr.ee/Zo7alGames", 3600);
    const data = extractNextData(html);
    if (!data) throw new Error("missing source");
    const items: SyncedSocial[] = [], seen = new Set<string>();
    for (const link of findLinkObjects(data)) {
      const url = new URL(link.url), platform = detectPlatform(link.url);
      if (url.protocol !== "https:" || !platform || platform === "linktree") continue;
      const key = platform + ":" + url.pathname.replace(/\/$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ id: "games:" + key, platform, label: PLATFORM_LABELS[platform] ?? platform, url: link.url, color: PLATFORM_COLORS[platform] });
    }
    if (!items.length) throw new Error("empty source");
    return { items, source: "live" };
  } catch {
    return { items: GAMES_FALLBACK.map(([platform, url]) => ({ id: "games:" + platform, platform, label: PLATFORM_LABELS[platform], url, color: PLATFORM_COLORS[platform] })), source: "fallback" };
  }
}
