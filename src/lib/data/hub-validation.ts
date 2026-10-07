export const hubLocales = ["en","ar","es","fr","de","pt","tr","ja","ko","zh"];
export const hubTopics = ["minecraft", "fortnite"] as const;
export type HubTopic = typeof hubTopics[number];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (value: unknown, min: number, max: number): value is string => typeof value === "string" && value.trim().length >= min && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
export function validateContent(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!["news","event","rule"].includes(String(v.kind)) || !hubLocales.includes(String(v.locale)) || !clean(v.title,1,160) || !clean(v.body,1,10000) || typeof v.published !== "boolean" || (v.id != null && (typeof v.id !== "string" || !uuid.test(v.id)))) return null;
  const topic = v.topic ?? "minecraft";
  if (!hubTopics.includes(topic as HubTopic)) return null;
  if (v.kind === "event" && (typeof v.startsAt !== "string" || !Number.isFinite(Date.parse(v.startsAt)))) return null;
  const imageId = v.imageId === undefined || v.imageId === null || v.imageId === "" ? null : v.imageId;
  if (imageId !== null && (v.kind === "rule" || typeof imageId !== "string" || !uuid.test(imageId))) return null;
  let registrationUrl: string | null = null;
  if (v.registrationUrl) { try { const u = new URL(String(v.registrationUrl)); if (u.protocol !== "https:" || u.username || u.password || u.href.length > 1000) return null; registrationUrl = u.href; } catch { return null; } }
  return { id: v.id as string | undefined, kind: v.kind as "news" | "event" | "rule", topic: topic as HubTopic, locale: String(v.locale), title: v.title.trim(), body: v.body.trim(), published: v.published, startsAt: v.kind === "event" ? new Date(String(v.startsAt)).toISOString() : null, registrationUrl, imageId };
}
export function eventPlayer(value: Record<string, unknown>, topic: HubTopic) {
  if (topic === "fortnite") return clean(value.epic, 3, 32) ? { epic: value.epic.trim() } : null;
  return typeof value.minecraft === "string" && /^[.a-zA-Z0-9_ ]{3,32}$/.test(value.minecraft) ? { minecraft: value.minecraft.trim() } : null;
}
export function validateSupport(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!["technical","player","order"].includes(String(v.type)) || !clean(v.email,3,254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) || !clean(v.subject,3,160) || !clean(v.message,20,3000) || v.consent !== true || v.website) return null;
  if (v.username && (typeof v.username !== "string" || !/^[.a-zA-Z0-9_ ]{3,32}$/.test(v.username))) return null;
  if (v.order && !clean(v.order,1,128)) return null;
  if (v.project && !clean(v.project,1,200) || v.projectTitle && !clean(v.projectTitle,1,160) || v.version && !clean(v.version,1,64)) return null;
  return { type: String(v.type), email: v.email.trim(), subject: v.subject.trim(), message: v.message.trim(), username: String(v.username ?? "").trim(), order: String(v.order ?? "").trim(), ...(v.project?{project:String(v.project).trim()}:{}), ...(v.projectTitle?{projectTitle:String(v.projectTitle).trim()}:{}), ...(v.version?{version:String(v.version).trim()}: {}) };
}
export function validReview(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || !uuid.test(v.id) || !["application","support","event"].includes(String(v.kind)) || !clean(v.note,0,2000)) return null;
  const allowed = v.kind === "application" ? ["pending","accepted","rejected"] : v.kind === "event" ? ["pending","accepted","rejected"] : ["open","reviewing","closed"];
  return allowed.includes(String(v.status)) ? { id:v.id,kind:String(v.kind),status:String(v.status),note:v.note.trim() } : null;
}
