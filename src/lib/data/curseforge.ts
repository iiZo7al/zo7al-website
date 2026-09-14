export const CURSEFORGE_PROFILE_URL =
  "https://www.curseforge.com/members/iizo7al/projects";

export type CurseForgeProject = {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  downloads: number;
  categories: string[];
  url: string;
};

// CurseForge's public REST API requires an authenticated API key issued to
// the project owner — it can't be called anonymously from the browser, so
// this list is manually configured from the verified public profile rather
// than fabricated. Swap in a live fetch once a key is available server-side.
export const CURSEFORGE_PROJECTS: CurseForgeProject[] = [
  {
    id: "cinema-edition",
    title: "Cinema Edition",
    description:
      "A ready-to-play Minecraft cinema experience featuring a fully built theater, screens, tickets, food and drinks — no building or setup required.",
    iconUrl:
      "https://media.forgecdn.net/avatars/thumbnails/1996/7/256/256/639228264818466172.png",
    downloads: 0,
    categories: ["Small / Light", "Multiplayer"],
    url: "https://www.curseforge.com/minecraft/modpacks/minecraft-cinema-edition",
  },
  {
    id: "iizo7al",
    title: "iiZo7al",
    description:
      "The official Minecraft modpack created by YouTuber Zo7al, featuring carefully selected mods for performance, visuals, and an enhanced gameplay experience.",
    iconUrl:
      "https://media.forgecdn.net/avatars/thumbnails/1917/573/256/256/639195492761750872.png",
    downloads: 30,
    categories: ["Exploration", "Vanilla+"],
    url: "https://www.curseforge.com/minecraft/modpacks/iizo7al",
  },
];
