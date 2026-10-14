import { useId, type CSSProperties } from "react";
import Image from "next/image";
import {
  siGithub,
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
  siReddit,siPinterest,siSpotify,siSteam,
  type SimpleIcon,
} from "simple-icons";
import { Link2 } from "lucide-react";

export const BRAND_ICONS: Record<string, SimpleIcon> = {
  github: siGithub,
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
  reddit:siReddit,pinterest:siPinterest,spotify:siSpotify,steam:siSteam,
};

const DISPLAY_COLORS: Record<string, string> = { github: "#FFFFFF", instagram: "#E1306C", fortnite: "#87CEFA", x: "#FFFFFF", twitter: "#FFFFFF", threads: "#FFFFFF", epicgames: "#FFFFFF", tiktok: "#FFFFFF", roblox: "#FFFFFF" };

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
      [/^github\.com$/, "github"],
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
  if(slug==="linkedin")return <svg width={size} height={size} viewBox="0 0 24 24" fill={color??"#0A66C2"} className={className} aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM8 19H5V9h3v10ZM6.5 7.7A1.7 1.7 0 1 1 6.5 4a1.7 1.7 0 0 1 0 3.7ZM19 19h-3v-5.3c0-1.3-.03-2.97-1.8-2.97-1.8 0-2.08 1.4-2.08 2.88V19h-3V9H12v1.36h.04c.4-.76 1.38-1.56 2.83-1.56C17.9 8.8 19 10.8 19 13.4V19Z"/></svg>;
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

