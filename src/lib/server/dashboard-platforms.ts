import "server-only";
import { MINECRAFT_SERVER } from "../data/minecraft";
import { FORTNITE_MAPS } from "../data/fortnite";
import { CURSEFORGE_PROJECTS } from "../data/curseforge";
import { MODRINTH_API_URL } from "../data/modrinth";
import { metricNumber, parseMinecraftStatus, parseModrinthProjects, parseYoutubeChannel, parseFortniteMetrics, sumMetric, safeDate, type ConnectionInput, type PlatformData, type PlatformId, type PlatformItem } from "../data/dashboard";
import { youtubeAuth } from "./youtube-auth";
import { modrinthAuth, modrinthJSON } from "./modrinth-auth";

async function json(url: string, headers: Record<string,string> = {}): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
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
  if (id === "youtube" && !connection) {
    let auth;
    try { auth = await youtubeAuth(); } catch (error) {
      return { ...base(id,"none"), status: error instanceof Error && error.message === "YT_SETUP" ? "setup" : "unavailable", updatedAt: null };
    }
    const item = parseYoutubeChannel(await json("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", { Authorization: "Bearer " + auth.accessToken }), auth.channelId);
    item.url = "https://www.youtube.com/channel/" + auth.channelId;
    return { ...base(id,"api"), items: [item], metrics: item.metrics };
  }
  if (id === "curseforge" && !connection) return { ...base(id,"none"), status: "setup", updatedAt: null };
  if (id === "minecraft") {
    const status = parseMinecraftStatus(await json("https://api.mcstatus.io/v2/status/java/" + MINECRAFT_SERVER.javaAddress));
    return { ...base(id,"public"), ...status, address: MINECRAFT_SERVER.javaAddress };
  }
  if (id === "modrinth") {
    const auth = process.env.DATABASE_URL ? await modrinthAuth() : null;
    const items = parseModrinthProjects(auth ? await modrinthJSON("/v2/user/" + auth.userId + "/projects", auth.accessToken) : await json(MODRINTH_API_URL));
    return { ...base(id,auth ? "api" : "public"), items, metrics: { projects: items.length, downloads: sumMetric(items,"downloads"), followers: sumMetric(items,"followers") } };
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
  const items: PlatformItem[] = [];
  let responses = 0;
  const queue = [...FORTNITE_MAPS];
  await Promise.all(Array.from({ length: Math.min(4,queue.length) }, async () => {
    for (let island = queue.shift(); island; island = queue.shift()) {
      let metrics: PlatformItem["metrics"] = { plays: null, minutesPlayed: null, peakPlayers: null };
      try {
        // Use Epic's default seven-day window and complete daily response. Avoid
        // undocumented date/filter encodings that make the entire request fail.
        metrics = parseFortniteMetrics(await json("https://api.fortnite.com/ecosystem/v1/islands/" + island.code + "/metrics/day"));
        responses++;
      } catch { /* Ineligible islands and missing intervals stay unavailable, not zero. */ }
      items.push({ id: island.code, title: island.title, url: "https://www.fortnite.com/@zo7al/" + island.code, metrics });
    }
  }));
  const available = items.filter(item => typeof item.metrics.plays === "number");
  // Valid privacy-suppressed intervals are a working API connection, not an outage.
  return { ...base(id,"public"), status: responses ? "connected" : "unavailable",
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
