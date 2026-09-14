// Central, non-fabricated configuration for the ZO7AL site.
// Every URL here was verified against the creator's real public profiles.
// If a value is unknown, it is left undefined rather than invented —
// see the fallback UI in each section instead of guessing.

export const SITE = {
  name: "ZO7AL",
  handle: "@iiZo7al",
  tagline: "Gaming creator. Minecraft builder. Fortnite creator.",
  description:
    "Zo7al is a gaming creator building Minecraft networks, modpacks, Fortnite Creative maps and experimental gaming projects.",
  year: 2026,
} as const;

export const NAV_LINKS = [
  { key: "home", label: "Home", href: "/" },
  { key: "minecraft", label: "Minecraft", href: "/minecraft" },
  { key: "modpacks", label: "Modpacks", href: "/modpacks" },
  { key: "fortnite", label: "Fortnite", href: "/fortnite" },
  { key: "socials", label: "Socials", href: "/socials" },
] as const;

export const STORE_LINK = "https://zo7al.tebex.io/";
export const DISCORD_LINK = "https://discord.gg/nxScVYrSXq";

export const SOCIALS = [
  {
    id: "youtube",
    label: "YouTube",
    handle: "@iiZo7al",
    url: "https://www.youtube.com/@iiZo7al",
    description: "Minecraft builds, modpack showcases and Fortnite map breakdowns.",
    color: "#FF3B30",
  },
  {
    id: "discord",
    label: "Discord",
    handle: "Zo7al Network",
    url: "https://discord.gg/nxScVYrSXq",
    description: "The community hub for the server, modpacks and map releases.",
    color: "#8B5CF6",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@iizo7al",
    url: "https://www.tiktok.com/@iizo7al",
    description: "Short-form clips from the network and Fortnite islands.",
    color: "#19D9FF",
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@iiZo7al",
    url: "https://www.instagram.com/iiZo7al",
    description: "Behind-the-scenes shots and announcements.",
    color: "#FF7A00",
  },
  {
    id: "x",
    label: "X",
    handle: "@iiZo7al",
    url: "https://x.com/iiZo7al",
    description: "Updates, polls and project news, first.",
    color: "#FFFFFF",
  },
  {
    id: "twitch",
    label: "Twitch",
    handle: "iiZo7al",
    url: "https://www.twitch.tv/iiZo7al",
    description: "Live builds and server events.",
    color: "#8B5CF6",
  },
  {
    id: "modrinth",
    label: "Modrinth",
    handle: "iiZo7al",
    url: "https://modrinth.com/user/iiZo7al",
    description: "Modpacks and the network server listing, open source friendly.",
    color: "#19D9FF",
  },
  {
    id: "curseforge",
    label: "CurseForge",
    handle: "iiZo7al",
    url: "https://www.curseforge.com/members/iizo7al/projects",
    description: "Mirror listings for every modpack release.",
    color: "#FF7A00",
  },
  {
    id: "fortnite",
    label: "Fortnite",
    handle: "@zo7al",
    url: "https://www.fortnite.com/@zo7al",
    description: "Every island code, all in one creator page.",
    color: "#8B5CF6",
  },
] as const;
