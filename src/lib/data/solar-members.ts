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
