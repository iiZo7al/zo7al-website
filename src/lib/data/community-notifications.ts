export const NOTIFICATION_CATEGORIES = ["news", "events", "projects", "requests"] as const;
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[number];
export type NotificationPreferences = Record<NotificationCategory, boolean>;
export type NotificationState = { preferences: NotificationPreferences; seen: string[] };
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = { news: true, events: true, projects: true, requests: true };
export type NotificationPatch = { preferences?: Partial<NotificationPreferences>; seen?: string[] };
const validNoticeId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9:._+-]{1,180}$/.test(value);

export function validateNotificationPatch(value: unknown): NotificationPatch | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>, result: NotificationPatch = {};
  if (Object.keys(input).some(key => key !== "preferences" && key !== "seen")) return null;
  if (input.preferences !== undefined) {
    if (!input.preferences || typeof input.preferences !== "object" || Array.isArray(input.preferences)) return null;
    const preferences = input.preferences as Record<string, unknown>;
    if (!Object.keys(preferences).length || Object.entries(preferences).some(([key, value]) => !NOTIFICATION_CATEGORIES.includes(key as NotificationCategory) || typeof value !== "boolean")) return null;
    result.preferences = preferences as Partial<NotificationPreferences>;
  }
  if (input.seen !== undefined) {
    if (!Array.isArray(input.seen) || input.seen.length > 200 || !input.seen.every(validNoticeId)) return null;
    result.seen = [...new Set(input.seen)];
  }
  return Object.keys(result).length ? result : null;
}

export function normalizeNotificationState(value?: { preferences?: unknown; seen?: unknown } | null): NotificationState {
  const raw = value?.preferences && typeof value.preferences === "object" ? value.preferences as Record<string, unknown> : {};
  return { preferences: Object.fromEntries(NOTIFICATION_CATEGORIES.map(key => [key, typeof raw[key] === "boolean" ? raw[key] : true])) as NotificationPreferences, seen: Array.isArray(value?.seen) ? [...new Set(value.seen.filter(validNoticeId))].slice(0, 200) : [] };
}
