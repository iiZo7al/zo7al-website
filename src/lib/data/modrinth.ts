export const MODRINTH_USER = "iiZo7al";
export const MODRINTH_PROFILE_URL = "https://modrinth.com/user/iiZo7al";
export const MODRINTH_API_URL = `https://api.modrinth.com/v2/user/${MODRINTH_USER}/projects`;

export type ModrinthProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl: string | null;
  downloads: number;
  projectType: string;
  categories: string[];
  url: string;
};

// Verified snapshot, used only if the live Modrinth API request fails or is
// unavailable (e.g. offline preview). The live client component always
// tries api.modrinth.com first.
export const MODRINTH_FALLBACK: ModrinthProject[] = [
  {
    id: "iizo7al-pvp",
    slug: "iizo7al-pvp",
    title: "iiZo7al PvP",
    description:
      "A lightweight PvP-focused Fabric modpack designed for maximum FPS, smooth gameplay, and competitive Minecraft combat.",
    iconUrl:
      "https://cdn.modrinth.com/data/u5G2mNqd/98fceb529621668894000d08a439497763f62f44_96.webp",
    downloads: 172,
    projectType: "modpack",
    categories: ["Fabric", "Optimization", "Combat"],
    url: "https://modrinth.com/modpack/iizo7al-pvp",
  },
  {
    id: "iizo7al-survival",
    slug: "iizo7al-survival",
    title: "iiZo7al Survival",
    description:
      "The official Minecraft modpack created by YouTuber Zo7al, featuring carefully selected mods for performance, visuals, and an enhanced gameplay experience.",
    iconUrl:
      "https://cdn.modrinth.com/data/n2yDSphR/63a86cc513be4a3c8ae5f3bf4d5b7fc2061e6793_96.webp",
    downloads: 63,
    projectType: "modpack",
    categories: ["Fabric", "Adventure"],
    url: "https://modrinth.com/modpack/iizo7al-survival",
  },
  {
    id: "zo7al-network",
    slug: "zo7al-network",
    title: "Zo7al Network",
    description:
      "A premium Minecraft Survival experience with custom features, an active community, and exciting new game modes coming soon.",
    iconUrl:
      "https://cdn.modrinth.com/data/wWEI5sZn/b49a2db87d7ccc0c6db63c3947eb5ea3680760d1_96.webp",
    downloads: 0,
    projectType: "server",
    categories: ["PvP", "SMP", "Survival"],
    url: "https://modrinth.com/server/zo7al-network",
  },
];
