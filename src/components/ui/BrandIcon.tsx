import { useId, type CSSProperties } from "react";
import Image from "next/image";
import {
  siYoutube,
  siDiscord,
  siGoogle,
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
  google: siGoogle,
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

const DISPLAY_COLORS: Record<string, string> = { instagram: "#E1306C", fortnite: "#87CEFA", x: "#FFFFFF", twitter: "#FFFFFF", threads: "#FFFFFF", epicgames: "#FFFFFF", tiktok: "#FFFFFF", roblox: "#FFFFFF" };

export const INSTAGRAM_GRADIENT = "linear-gradient(135deg, #833AB4 0%, #C13584 35%, #E1306C 60%, #F77737 82%, #FCAF45 100%)";

/** Keep platform labels and icons in the same readable brand color. */
export function brandDisplayColor(slug: string): string {
  return DISPLAY_COLORS[slug] ?? (BRAND_ICONS[slug] ? `#${BRAND_ICONS[slug].hex}` : "var(--text)");
}

/** Instagram labels share its multicolor mark; other platforms retain solid colors. */
export function brandLabelStyle(slug: string): CSSProperties {
  return slug === "instagram" ? {
    backgroundImage: INSTAGRAM_GRADIENT,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
  } : { color: brandDisplayColor(slug) };
}

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
  const gradientId = useId();
  const gradient = slug === "instagram" && !color;
  const icon = BRAND_ICONS[slug];
  if (slug === "google") {
    return <Image src="/assets/site/google-g.png" alt="" width={size} height={size} className={className} aria-hidden="true" />;
  }
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
      fill={gradient ? `url(#${gradientId})` : color ?? brandDisplayColor(slug)}
      className={className}
      aria-hidden="true"
    >
      {gradient && <defs><linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#833AB4"/><stop offset="35%" stopColor="#C13584"/>
        <stop offset="60%" stopColor="#E1306C"/><stop offset="82%" stopColor="#F77737"/>
        <stop offset="100%" stopColor="#FCAF45"/>
      </linearGradient></defs>}
      <path d={icon.path} />
    </svg>
  );
}

