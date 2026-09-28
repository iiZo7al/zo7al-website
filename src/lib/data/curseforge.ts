import type { ModpackDetails } from "./modpack-details";
export const CURSEFORGE_PROFILE_URL =
  "https://www.curseforge.com/members/iizo7al/projects";

export type CurseForgeProject = ModpackDetails & {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  downloads: number;
  categories: string[];
  url: string;
};

// Details verified against public CurseForge project/file pages on 2026-09-28.
// The profile sync preserves these snapshots; the dialog labels them as saved
// source details because direct project fetching can return 403.
export const CURSEFORGE_PROJECTS: CurseForgeProject[] = [
  {
    id: "cinema-edition",
    body: "Minecraft: Cinema Edition is a ready-to-play cinema by Zo7al. Join the pre-built theater, collect your ticket and watch with friends.\n\n- WebDisplays screens\n- Cinema tickets\n- Food and drinks\n- Immersive theater atmosphere\n\nتجربة سينما جاهزة داخل ماينكرافت من زحل. ادخل السينما المبنية مسبقًا، خذ تذكرتك واستمتع بالمشاهدة مع الأصدقاء.\n\n- شاشات WebDisplays\n- تذاكر السينما\n- أطعمة ومشروبات\n- أجواء سينمائية",
    updated: "2026-08-20",
    license: "All Rights Reserved",
    releases: [],
    title: "Cinema Edition",
    description:
      "A ready-to-play Minecraft cinema experience featuring a fully built theater, screens, tickets, food and drinks — no building or setup required.",
    iconUrl:
      "https://media.forgecdn.net/avatars/thumbnails/1996/7/256/256/639228264818466172.png",
    downloads: 0,
    categories: ["Tech", "Small / Light", "Multiplayer"],
    url: "https://www.curseforge.com/minecraft/modpacks/minecraft-cinema-edition",
  },
  {
    id: "iizo7al",
    body: "Zo7al’s official Minecraft modpack combines performance, stable mod compatibility, improved visuals and quality-of-life features.\n\n- Smoother gameplay\n- Visual enhancements\n- Configured and tested mods\n- Expanded gameplay with a vanilla feel\n\nRequirements: Minecraft 1.21.11, Fabric Loader, 4–6 GB allocated RAM (6 GB recommended).\n\nالمودباك الرسمي من زحل يجمع تحسين الأداء والرسوم مع مودات مجرّبة ومتوافقة وإضافات تسهّل اللعب.\n\n- تجربة لعب أكثر سلاسة\n- تحسينات بصرية\n- مودات مضبوطة ومختبرة\n- إضافات تحافظ على طابع اللعبة الأصلي\n\nالمتطلبات: Minecraft 1.21.11 وFabric Loader وتخصيص 4–6 جيجابايت رام (يُفضّل 6).",
    gameVersions: ["1.21.11"],
    loaders: ["Fabric"],
    updated: "2026-07-13",
    license: "All Rights Reserved",
    releases: [{ name: "0.5.0 (Beta)", version: "0.5.0", type: "beta", published: "2026-07-13", url: "https://www.curseforge.com/minecraft/modpacks/iizo7al/files/8425373" }, { name: "0.7.0 (Alpha)", version: "0.7.0", type: "alpha", published: "2026-07-13", url: "https://www.curseforge.com/minecraft/modpacks/iizo7al/files/8425184" }],
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

