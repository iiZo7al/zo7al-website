export const SOLAR_MEMBER_SOCIAL_PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X (Twitter)" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "twitch", label: "Twitch" },
  { id: "kick", label: "Kick" },
  { id: "discord", label: "Discord" },
  { id: "snapchat", label: "Snapchat" },
  { id: "github", label: "GitHub" },
  { id: "website", label: "Website" },
] as const;

export type SolarMemberSocialPlatform =
  (typeof SOLAR_MEMBER_SOCIAL_PLATFORMS)[number]["id"];

export type SolarMemberSocial = {
  platform: SolarMemberSocialPlatform;
  label: string;
  url: string;
};

export type SolarMember = {
  id: string;
  userId?: string;
  handle?: string;
  name: string;
  rank: string;
  avatar: string;
  bio: string;
  socials: SolarMemberSocial[];
  order: number;
  updatedAt: string;
};

export const SOLAR_MEMBER_ROLES = [
  { id: "admin", label: "إداري" },
  { id: "creator", label: "صانع محتوى" },
  { id: "streamer", label: "ستريمر" },
  { id: "designer", label: "مصمم" },
  { id: "editor", label: "ممنتج" },
  { id: "player", label: "لاعب" },
  { id: "writer", label: "كاتب أفكار" },
] as const;

export const SOLAR_MEMBER_ADMIN_SUBTYPES = [
  { id: "president", label: "الرئيس" },
  { id: "vice_president", label: "نائب الرئيس" },
  { id: "exec_supervisor", label: "مشرف تنفيذي" },
  { id: "dept_supervisor", label: "مشرف أقسام" },
  { id: "general_admin", label: "إدارة عامة" },
  { id: "admin_monitor", label: "مراقب إدارة" },
  { id: "creators_supervisor", label: "مشرف صناع محتوى" },
  { id: "creators_admin", label: "إداري صناع محتوى" },
  { id: "designers_supervisor", label: "مشرف مصممين" },
  { id: "players_supervisor", label: "مشرف لاعبين" },
  { id: "players_admin", label: "إداري لاعبين" },
  { id: "editors_supervisor", label: "مشرف ممنتجين" },
  { id: "streamers_supervisor", label: "مشرف ستريمرز" },
] as const;

export const SOLAR_MEMBER_GAMES = [
  { id: "fortnite", label: "فورتنايت", optionLabel: "فورتنايت (Fortnite)" },
  { id: "rocket", label: "روكيت ليق", optionLabel: "روكيت ليق (Rocket League)" },
  { id: "minecraft", label: "ماينكرافت", optionLabel: "ماينكرافت (Minecraft)" },
  { id: "fifa", label: "فيفا", optionLabel: "فيفا / FC (FIFA)" },
  { id: "cod", label: "كود", optionLabel: "كود (Call of Duty)" },
] as const;

export function roleNeedsGame(role: string, adminSubType?: string): boolean {
  return (
    role === "player" ||
    (role === "admin" &&
      (adminSubType === "players_supervisor" || adminSubType === "players_admin"))
  );
}

export function formatSolarMemberRank(
  role: string,
  adminSubType?: string,
  game?: string,
): string {
  const roleLabel = SOLAR_MEMBER_ROLES.find((r) => r.id === role)?.label ?? "";
  if (!roleLabel) return "";
  const parts: string[] = [roleLabel];
  if (role === "admin" && adminSubType) {
    const subLabel = SOLAR_MEMBER_ADMIN_SUBTYPES.find((s) => s.id === adminSubType)?.label;
    if (subLabel) parts.push(subLabel);
  }
  if (roleNeedsGame(role, adminSubType) && game) {
    const gameLabel = SOLAR_MEMBER_GAMES.find((g) => g.id === game)?.label;
    if (gameLabel) parts.push(gameLabel);
  }
  return parts.join(" - ");
}

export function parseSolarMemberRank(rank: string): {
  role: string;
  adminSubType: string;
  game: string;
} {
  const parts = rank.split(" - ").map((p) => p.trim()).filter(Boolean);
  const role = SOLAR_MEMBER_ROLES.find((r) => r.label === parts[0])?.id ?? "";
  if (!role) return { role: "", adminSubType: "", game: "" };
  let adminSubType = "";
  let game = "";
  if (role === "admin" && parts[1]) {
    adminSubType =
      SOLAR_MEMBER_ADMIN_SUBTYPES.find((s) => s.label === parts[1])?.id ?? "";
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart && roleNeedsGame(role, adminSubType)) {
    game = SOLAR_MEMBER_GAMES.find((g) => g.label === lastPart)?.id ?? "";
  }
  return { role, adminSubType, game };
}

export const SOLAR_MEMBER_RANK_SUGGESTIONS = [
  "قائد الكلان",
  "نائب الرئيس",
  "مشرف تنفيذي",
  "إدارة عامة",
  "صانع محتوى",
  "ستريمر",
  "مصمم",
  "ممنتج",
  "لاعب",
  "إداري",
  "كاتب أفكار",
];

const VALID_PLATFORMS = new Set<string>(
  SOLAR_MEMBER_SOCIAL_PLATFORMS.map((p) => p.id),
);

export function safeMemberUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeSolarMemberSocials(input: unknown): SolarMemberSocial[] {
  if (!Array.isArray(input)) return [];
  const out: SolarMemberSocial[] = [];
  for (const item of input.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const platform =
      typeof raw.platform === "string" && VALID_PLATFORMS.has(raw.platform)
        ? (raw.platform as SolarMemberSocialPlatform)
        : "website";
    const url = safeMemberUrl(raw.url);
    if (!url) continue;
    const label =
      typeof raw.label === "string" ? raw.label.trim().slice(0, 80) : "";
    out.push({ platform, label, url });
  }
  return out;
}

export function getSolarRankOrder(rank: string): number {
  const s = (rank || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا");
  if (!s) return 999;

  // 0. الرئيس (avoid matching نائب الرئيس)
  if ((s.includes("رئيس") && !s.includes("نائب") && !s.includes("تنفيذي")) || s.includes("قائد الكلان")) return 0;
  // 1. نائب الرئيس
  if (s.includes("نائب الرئيس") || s.includes("نائب")) return 1;
  // 2. الرئيس التنفيذي / مشرف تنفيذي
  if (s.includes("تنفيذي")) return 2;
  // 3. مشرف الأقسام
  if (s.includes("مشرف الاقسام") || s.includes("مشرف اقسام")) return 3;
  // 4. الإدارة العامة
  if (s.includes("الادارة العامة") || s.includes("ادارة عامة")) return 4;
  // 5. مراقب الإدارة
  if (s.includes("مراقب الادارة") || s.includes("مراقب ادارة")) return 5;
  // 6. مشرف صناع المحتوى
  if (s.includes("مشرف صناع")) return 6;
  // 7. إداري صناع المحتوى
  if (s.includes("اداري صناع")) return 7;
  // 8. صانع محتوى
  if (s.includes("صانع محتوى") || s.includes("صناع محتوى")) return 8;
  // 9. إداري ستريمر / مشرف ستريمرز
  if ((s.includes("اداري") || s.includes("مشرف")) && s.includes("ستريمر")) return 9;
  // 10. ستريمر
  if (s.includes("ستريمر")) return 10;

  // Player / Game departments:
  // Fortnite (11-13)
  if (s.includes("فورت")) {
    if (s.includes("مشرف")) return 11;
    if (s.includes("إداري") || s.includes("اداري")) return 12;
    return 13;
  }
  // Minecraft (14-16)
  if (s.includes("ماين")) {
    if (s.includes("مشرف")) return 14;
    if (s.includes("إداري") || s.includes("اداري")) return 15;
    return 16;
  }
  // Rocket League (17-19)
  if (s.includes("روكيت")) {
    if (s.includes("مشرف")) return 17;
    if (s.includes("إداري") || s.includes("اداري")) return 18;
    return 19;
  }
  // FIFA (20-22)
  if (s.includes("فيفا") || s.includes("fifa")) {
    if (s.includes("مشرف")) return 20;
    if (s.includes("إداري") || s.includes("اداري")) return 21;
    return 22;
  }
  // Call of Duty (23-25)
  if (s.includes("كود") || s.includes("cod") || s.includes("call of duty")) {
    if (s.includes("مشرف")) return 23;
    if (s.includes("إداري") || s.includes("اداري")) return 24;
    return 25;
  }
  // Any other/new player rank (26)
  if (s.includes("لاعب")) {
    if (s.includes("مشرف")) return 26;
    if (s.includes("إداري") || s.includes("اداري")) return 27;
    return 28;
  }

  // 29. كاتب أفكار الكلان
  if (s.includes("كاتب")) return 29;
  // 30. مشرف المصممين
  if (s.includes("مشرف") && s.includes("مصمم")) return 30;
  // 31. مصمم
  if (s.includes("مصمم") || s.includes("تصميم")) return 31;
  // 32. مشرف الممنتجين
  if (s.includes("مشرف") && (s.includes("ممنتج") || s.includes("مونتاج"))) return 32;
  // 33. ممنتج
  if (s.includes("ممنتج") || s.includes("مونتاج")) return 33;

  // 34. Any other/new non-player role
  return 34;
}

