import { isPlayerStatKey, type PlayerStatKey } from "./player-statistics";

export const COMMUNITY_KINDS = ["poll", "gallery", "project", "changelog", "achievement"] as const;
export type CommunityKind = typeof COMMUNITY_KINDS[number];
export const PROJECT_STATES = ["development", "available", "paused"] as const;
export const COMMUNITY_LOCALES = ["en","ar","es","fr","de","pt","tr","ja","ko","zh"];
export type CommunityEntry = {
  id: string; kind: CommunityKind; locale: string; topic: "all" | "minecraft" | "fortnite";
  projectKey: string; title: string; body: string; payload: Record<string, unknown>;
  published: boolean; moderation: "draft" | "pending" | "approved" | "rejected";
  author: string; image?: { id: string; width: number; height: number } | null;
  createdAt: string; updatedAt: string; votes?: number[]; contactEmail?: string; discordReceipt?: string | null;
};
export const isUUID = (v: unknown): v is string => typeof v === "string" && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v);
const text = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
export function safeMediaLink(value: unknown): string | null {
  if (!value) return null;
  if (typeof value !== "string" || value.length > 1000) return null;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.port && ["youtube.com","youtu.be","twitch.tv","clips.twitch.tv","tiktok.com"].includes(u.hostname.replace(/^www\./,"")) ? u.href : null; } catch { return null; }
}
export function validateCommunity(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>, p = v.payload as Record<string, unknown>;
  if (!COMMUNITY_KINDS.includes(v.kind as CommunityKind) || !COMMUNITY_LOCALES.includes(String(v.locale)) || !["all","minecraft","fortnite"].includes(String(v.topic)) || !text(v.title,1,160) || !text(v.body,0,10000) || !text(v.projectKey,0,200) || typeof v.published !== "boolean" || !p || typeof p !== "object" || Array.isArray(p) || v.id !== undefined && !isUUID(v.id)) return null;
  const payload: Record<string, unknown> = {};
  if (v.kind === "poll") {
    if (!Array.isArray(p.options) || p.options.length < 2 || p.options.length > 8 || !p.options.every(x => text(x,1,120)) || new Set(p.options.map(x=>String(x).trim())).size !== p.options.length) return null;
    payload.options = p.options.map(x=>String(x).trim());
    if (p.endsAt && (typeof p.endsAt !== "string" || !Number.isFinite(Date.parse(p.endsAt)))) return null;
    payload.endsAt = p.endsAt ? new Date(String(p.endsAt)).toISOString() : null;
  }
  if (v.kind === "gallery") {
    if (!text(v.author,1,64) || p.videoUrl && !safeMediaLink(p.videoUrl)) return null;
    payload.videoUrl = safeMediaLink(p.videoUrl);
  }
  if (v.kind === "project") { if (!v.projectKey || !PROJECT_STATES.includes(p.status as typeof PROJECT_STATES[number])) return null; payload.status = p.status; }
  if (v.kind === "changelog") { if (!v.projectKey || !text(p.version,1,64)) return null; payload.version = p.version.trim(); }
  if (v.kind === "achievement") { if (!isPlayerStatKey(p.stat) || typeof p.threshold !== "number" || !Number.isFinite(p.threshold) || p.threshold <= 0 || p.threshold > 1e12) return null; payload.stat = p.stat; payload.threshold = p.threshold; }
  const imageId = v.imageId || null;
  if (imageId !== null && (!isUUID(imageId) || v.kind !== "gallery")) return null;
  if (v.kind === "gallery" && !imageId && !payload.videoUrl) return null;
  return { id: v.id as string | undefined, kind: v.kind as CommunityKind, locale: String(v.locale), topic: String(v.topic), title:v.title.trim(), body:v.body.trim(), projectKey:v.projectKey.trim(), payload, published:v.published, author:v.kind === "gallery" && typeof v.author === "string" ? v.author.trim() : "", imageId };
}
export function validateGallerySubmission(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!text(v.title,1,160) || !text(v.body,0,2000) || !text(v.author,1,64) || !text(v.email,3,254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) || !["all","minecraft","fortnite"].includes(String(v.topic)) || !COMMUNITY_LOCALES.includes(String(v.locale)) || v.consent !== "on" && v.consent !== true || v.website || v.videoUrl && !safeMediaLink(v.videoUrl)) return null;
  return { title:v.title.trim(), body:v.body.trim(), author:v.author.trim(), email:v.email.trim(), topic:String(v.topic), locale:String(v.locale), videoUrl:safeMediaLink(v.videoUrl) };
}
export const DEFAULT_ACHIEVEMENTS = [
  { id:"play-10", stat:"playtimeSeconds", threshold:36000 },
  { id:"play-100", stat:"playtimeSeconds", threshold:360000 },
  { id:"streak-5", stat:"streak", threshold:5 },
  { id:"streak-20", stat:"streak", threshold:20 },
  { id:"kills-100", stat:"kills", threshold:100 },
  { id:"wins-25", stat:"wins", threshold:25 },
] as const;
export function achievementProgress(stats: Record<string, number> | null, rules: {id:string;stat:PlayerStatKey;threshold:number}[]) {
  return rules.flatMap(rule => {
    const value = stats?.[rule.stat];
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? [{...rule,value,earned:value >= rule.threshold,percent:Math.min(100,value / rule.threshold * 100)}] : [];
  });
}
