import "server-only";
import { MINECRAFT_SERVER } from "../data/minecraft";
import { FORTNITE_MAPS } from "../data/fortnite";
import { CURSEFORGE_PROJECTS } from "../data/curseforge";
import { MODRINTH_API_URL } from "../data/modrinth";
import { metricNumber, parseMinecraftStatus, parseModrinthProjects, parseYoutubeChannel, parseFortniteMetrics, sumMetric, safeDate, type ConnectionInput, type PlatformData, type PlatformId, type PlatformItem } from "../data/dashboard";

async function json(url: string, headers: Record<string,string> = {}): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(7000),
    headers: { Accept: "application/json", "User-Agent": "Zo7alProjects/1.0 (zo7al.is-a.dev)", ...headers } });
  if (!response.ok) throw Error("UPSTREAM");
  const reader = response.body?.getReader();
  if (!reader) throw Error("UPSTREAM");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length; if (length > 2000000) throw Error("UPSTREAM");
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { await reader.cancel(); }
}
const base = (id: PlatformId, source: PlatformData["source"]): PlatformData => ({
  id, source, status: "connected", metrics: {}, items: [], updatedAt: new Date().toISOString(),
});
export async function fetchPlatform(id: PlatformId, connection?: ConnectionInput): Promise<PlatformData> {
  if ((id === "youtube" || id === "curseforge") && !connection) return { ...base(id,"none"), status: "setup", updatedAt: null };
  if (id === "minecraft") {
    const status = parseMinecraftStatus(await json("https://api.mcstatus.io/v2/status/java/" + MINECRAFT_SERVER.javaAddress));
    return { ...base(id,"public"), ...status, address: MINECRAFT_SERVER.javaAddress };
  }
  if (id === "modrinth") {
    const items = parseModrinthProjects(await json(MODRINTH_API_URL));
    return { ...base(id,"public"), items, metrics: { projects: items.length, downloads: sumMetric(items,"downloads"), followers: sumMetric(items,"followers") } };
  }
  if (id === "youtube") {
    const params = new URLSearchParams({ part: "snippet,statistics", forHandle: connection!.account });
    // Keep credentials in a server-only header, outside URLs and browser payloads.
    const item = parseYoutubeChannel(await json("https://www.googleapis.com/youtube/v3/channels?" + params, { "X-Goog-Api-Key": connection!.apiKey }), connection!.account);
    return { ...base(id,"api"), items: [item], metrics: item.metrics };
  }
  if (id === "curseforge") {
    const items = await Promise.all(CURSEFORGE_PROJECTS.map(async project => {
      const slug = project.url.split("/").pop()!;
      const params = new URLSearchParams({ gameId: "432", slug });
      const result = await json("https://api.curseforge.com/v1/mods/search?" + params, { "x-api-key": connection!.apiKey }) as { data?: Record<string,unknown>[] };
      const mod = result.data?.find(item => item.slug === slug);
      if (!mod || !Number.isSafeInteger(mod.id)) throw Error("INVALID_UPSTREAM");
      return { id: String(mod.id), title: String(mod.name || project.title).slice(0,200), url: project.url,
        metrics: { downloads: metricNumber(mod.downloadCount) }, updatedAt: safeDate(mod.dateModified) };
    }));
    return { ...base(id,"api"), items, metrics: { projects: items.length, downloads: sumMetric(items,"downloads") } };
  }
  const from = new Date(); from.setUTCHours(0,0,0,0); from.setUTCDate(from.getUTCDate()-6);
  const to = new Date().toISOString();
  const items: PlatformItem[] = [];
  const queue = [...FORTNITE_MAPS];
  await Promise.all(Array.from({ length: Math.min(4,queue.length) }, async () => {
    for (let island = queue.shift(); island; island = queue.shift()) {
      let metrics: PlatformItem["metrics"] = { plays: null, minutesPlayed: null, peakPlayers: null };
      try {
        const params = new URLSearchParams({ from: from.toISOString(), to });
        for (const key of ["plays","minutesPlayed","peakCCU"]) params.append("metrics",key);
        metrics = parseFortniteMetrics(await json("https://api.fortnite.com/ecosystem/v1/islands/" + island.code + "/metrics/day?" + params));
      } catch { /* Ineligible islands and missing intervals stay unavailable, not zero. */ }
      items.push({ id: island.code, title: island.title, url: "https://www.fortnite.com/@zo7al/" + island.code, metrics });
    }
  }));
  const available = items.filter(item => typeof item.metrics.plays === "number");
  return { ...base(id,"public"), status: available.length ? "connected" : "unavailable",
    items: items.sort((a,b) => (b.metrics.plays ?? -1) - (a.metrics.plays ?? -1)),
    metrics: { projects: items.length, plays: available.length ? sumMetric(available,"plays") : null,
      minutesPlayed: available.length ? sumMetric(available,"minutesPlayed") : null },
    coverage: { available: available.length, total: items.length } };
}

const cache = new Map<PlatformId,{ expires: number; promise: Promise<PlatformData> }>();
export function clearPlatformCache(id: PlatformId) { cache.delete(id); }
export function cachedPlatform(id: PlatformId, connection?: ConnectionInput): Promise<PlatformData> {
  const existing = cache.get(id);
  if (existing && existing.expires > Date.now()) return existing.promise;
  const promise = fetchPlatform(id,connection).catch((): PlatformData => ({
    ...base(id,"none"), status: "unavailable", updatedAt: null,
  }));
  cache.set(id,{ expires: Date.now()+60000, promise });
  return promise;
}
