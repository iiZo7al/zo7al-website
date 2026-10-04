export const platformIds = ["minecraft", "fortnite", "youtube", "modrinth", "curseforge"] as const;
export type PlatformId = typeof platformIds[number];
export const connectionProviders = ["youtube", "curseforge", "pelican"] as const;
export type ConnectionProvider = typeof connectionProviders[number];
export type MetricKey = "players" | "capacity" | "projects" | "downloads" | "followers" | "subscribers" | "views" | "videos" | "plays" | "minutesPlayed" | "peakPlayers";
export type PlatformItem = { id: string; title: string; url: string; metrics: Partial<Record<MetricKey, number | null>>; updatedAt?: string };
export type PlatformData = {
  id: PlatformId;
  status: "connected" | "setup" | "unavailable";
  source: "public" | "api" | "catalog" | "none";
  metrics: Partial<Record<MetricKey, number | null>>;
  items: PlatformItem[];
  updatedAt: string | null;
  online?: boolean;
  version?: string;
  address?: string;
  coverage?: { available: number; total: number };
};
export type DashboardActivity = { day: string; requests: number; orders: number };
export type DashboardSummary = {
  requests: number; pending: number; applications: number; support: number;
  registrations: number; orders: number; content: number; published: number; drafts: number;
};
export type DashboardInsights = {
  summary: DashboardSummary;
  activity: DashboardActivity[];
  platforms: PlatformData[];
  generatedAt: string;
};
export type DashboardConnection = { provider: ConnectionProvider; configured: boolean; account: string; panelUrl?: string; managedByEnvironment: boolean };
export type ConnectionInput = { provider: ConnectionProvider; apiKey: string; account: string; panelUrl?: string };

export function publicPanelOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 250) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || !/^\/[\s]*$/.test(url.pathname)) return null;
    // DNS and the resolved address are checked again, and pinned, on the server.
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(url.hostname) || /\.(local|localhost|internal|lan)$/i.test(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
export const validServerId = (value: unknown): value is string => typeof value === "string" && /^(?:[a-f0-9]{8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value);

export function metricNumber(value: unknown): number | null {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(\.\d+)?$/.test(value))) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : null;
}
export function validConnection(value: unknown): ConnectionInput | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!connectionProviders.includes(v.provider as ConnectionProvider)) return null;
  if (typeof v.apiKey !== "string" || v.apiKey.length < 20 || v.apiKey.length > 256 || /\s|[^\x21-\x7e]/.test(v.apiKey)) return null;
  if (v.provider === "pelican") {
    const account = typeof v.account === "string" ? v.account.trim() : "";
    const panelUrl = publicPanelOrigin(v.panelUrl);
    return validServerId(account) && panelUrl ? { provider: "pelican", apiKey: v.apiKey, account, panelUrl } : null;
  }
  const account = v.provider === "youtube" ? String(v.account ?? "iiZo7al").trim().replace(/^@/, "") : "iiZo7al";
  if (!/^[a-zA-Z0-9_.-]{3,60}$/.test(account)) return null;
  return { provider: v.provider as ConnectionProvider, apiKey: v.apiKey, account };
}
export function safeDate(value: unknown): string | undefined {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
}

export function parseMinecraftStatus(value: unknown): Pick<PlatformData, "metrics" | "online" | "version"> {
  const v = value as { online?: unknown; players?: { online?: unknown; max?: unknown }; version?: { name_clean?: unknown } };
  if (!v || typeof v.online !== "boolean") throw Error("INVALID_UPSTREAM");
  const version = typeof v.version?.name_clean === "string" ? v.version.name_clean.slice(0,100) : undefined;
  return { online: v.online, version, metrics: {
    players: v.online ? metricNumber(v.players?.online) : 0,
    capacity: metricNumber(v.players?.max),
  } };
}
export function parseModrinthProjects(value: unknown): PlatformItem[] {
  if (!Array.isArray(value)) throw Error("INVALID_UPSTREAM");
  const items = value.slice(0,100).flatMap(v => {
    if (!v || typeof v.id !== "string" || !/^[a-zA-Z0-9]{8}$/.test(v.id) || typeof v.title !== "string" || !/^[a-z0-9_-]+$/i.test(v.slug)) return [];
    return [{ id: v.id, title: v.title.slice(0,200), url: "https://modrinth.com/project/" + v.id,
      metrics: { downloads: metricNumber(v.downloads), followers: metricNumber(v.followers) }, updatedAt: safeDate(v.updated) }];
  });
  if (value.length && !items.length) throw Error("INVALID_UPSTREAM");
  return items;
}
export function sumMetric(items: PlatformItem[], key: MetricKey): number | null {
  if (!items.length) return 0;
  const values = items.map(item => item.metrics[key]);
  return values.every(value => typeof value === "number") ? values.reduce<number>((total, value) => total + (value as number), 0) : null;
}
export function parseYoutubeChannel(value: unknown, account: string): PlatformItem {
  const v = value as { items?: { id?: string; snippet?: { title?: string }; statistics?: Record<string,unknown> }[] };
  const channel = v?.items?.[0];
  if (!channel || typeof channel.id !== "string" || !/^UC[\w-]{22}$/.test(channel.id) || !channel.statistics) throw Error("INVALID_UPSTREAM");
  return { id: channel.id, title: channel.snippet?.title?.slice(0,200) || account,
    url: "https://www.youtube.com/channel/" + channel.id,
    metrics: { views: metricNumber(channel.statistics.viewCount), videos: metricNumber(channel.statistics.videoCount),
      subscribers: channel.statistics.hiddenSubscriberCount === true ? null : metricNumber(channel.statistics.subscriberCount) } };
}
export function parseFortniteMetrics(value: unknown): Partial<Record<MetricKey,number|null>> {
  if (!value || typeof value !== "object") throw Error("INVALID_UPSTREAM");
  const v = value as Record<string,unknown>;
  const read = (key: string, maximum = false) => {
    const rows = v[key];
    if (!Array.isArray(rows) || !rows.length) return null;
    const numbers = rows.map(row => row && safeDate(row.timestamp) ? metricNumber(row.value) : null);
    // Epic explicitly uses null for missing intervals; never turn missing data into zero.
    if (numbers.some(n => n === null)) return null;
    return maximum ? Math.max(...numbers as number[]) : (numbers as number[]).reduce((a,b) => a+b,0);
  };
  return { plays: read("plays"), minutesPlayed: read("minutesPlayed"), peakPlayers: read("peakCCU",true) };
}
