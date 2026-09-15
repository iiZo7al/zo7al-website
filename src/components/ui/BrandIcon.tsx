import {
  siYoutube,
  siDiscord,
  siTiktok,
  siInstagram,
  siX,
  siTwitch,
  siModrinth,
  siCurseforge,
  siFortnite,
  siKick,
  siSnapchat,
  siTelegram,
  siWhatsapp,
  siRoblox,
  siBluesky,
  siPlaystation,
  siEpicgames,
  siLinktree,
  siFacebook,
  siThreads,
  siPatreon,
  type SimpleIcon,
} from "simple-icons";
import { Link2 } from "lucide-react";

export const BRAND_ICONS: Record<string, SimpleIcon> = {
  youtube: siYoutube,
  discord: siDiscord,
  tiktok: siTiktok,
  instagram: siInstagram,
  x: siX,
  twitter: siX,
  twitch: siTwitch,
  modrinth: siModrinth,
  curseforge: siCurseforge,
  fortnite: siFortnite,
  epicgames: siEpicgames,
  kick: siKick,
  snapchat: siSnapchat,
  telegram: siTelegram,
  whatsapp: siWhatsapp,
  roblox: siRoblox,
  bluesky: siBluesky,
  playstation: siPlaystation,
  linktree: siLinktree,
  facebook: siFacebook,
  threads: siThreads,
  patreon: siPatreon,
};

/** Best-effort platform detection from any URL, used by the live-synced link lists. */
export function detectPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const rules: [RegExp, string][] = [
      [/youtube\.com|youtu\.be/, "youtube"],
      [/discord\.(gg|com)/, "discord"],
      [/tiktok\.com/, "tiktok"],
      [/instagram\.com/, "instagram"],
      [/(^|\.)x\.com/, "x"],
      [/twitter\.com/, "x"],
      [/twitch\.tv/, "twitch"],
      [/modrinth\.com/, "modrinth"],
      [/curseforge\.com/, "curseforge"],
      [/fortnite\.com/, "fortnite"],
      [/epicgames\.com/, "epicgames"],
      [/kick\.com/, "kick"],
      [/snapchat\.com/, "snapchat"],
      [/t\.me|telegram\.org/, "telegram"],
      [/whatsapp\.com/, "whatsapp"],
      [/roblox\.com/, "roblox"],
      [/bsky\.app/, "bluesky"],
      [/playstation\.com/, "playstation"],
      [/linktr\.ee/, "linktree"],
      [/facebook\.com/, "facebook"],
      [/threads\.net|threads\.com/, "threads"],
      [/patreon\.com/, "patreon"],
    ];
    for (const [pattern, key] of rules) {
      if (pattern.test(host)) return key;
    }
    return null;
  } catch {
    return null;
  }
}

export default function BrandIcon({
  slug,
  size = 20,
  color,
  className,
}: {
  slug: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const icon = BRAND_ICONS[slug];
  if (!icon) {
    // Graceful fallback for a platform we don't have a brand mark for yet.
    return <Link2 size={size} className={className} aria-hidden="true" />;
  }
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color ?? ({ fortnite: "#87CEFA", x: "#FFFFFF", twitter: "#FFFFFF", threads: "#FFFFFF", epicgames: "#FFFFFF", tiktok: "#FFFFFF", roblox: "#FFFFFF" } as Record<string, string>)[slug] ?? `#${icon.hex}`}
      className={className}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}

