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
