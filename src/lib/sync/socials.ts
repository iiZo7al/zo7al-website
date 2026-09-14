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
  fortnite: "#8B5CF6",
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
      if (isNoiseLinktreeUrl(parsed)) continue;

      const platform = detectPlatform(link.url) ?? (parsed.hostname === "linktr.ee" ? "linktree" : null);
      if (!platform) continue;

      const dedupeKey = `${platform}:${parsed.hostname}${parsed.pathname}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      items.push({
        id: dedupeKey,
        platform,
        label: PLATFORM_LABELS[platform] ?? link.title ?? platform,
        url: link.url,
        description: link.title,
        color: PLATFORM_COLORS[platform],
      });
    }

    if (items.length === 0) throw new Error("no recognizable links parsed");
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
