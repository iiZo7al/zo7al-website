import "server-only";
import { MODRINTH_API_URL, MODRINTH_FALLBACK } from "../data/modrinth";
import { changelogText, curseForgeFileUrls, parseCurseForgeFilePage, parseCurseForgeFiles, parseModrinthReleases, type ChangelogSource, type ChangelogStatus, type ModpackChangelogData, type ModpackChangelogProject } from "../data/modpack-changelog";
import type { CurseForgeProject } from "../data/curseforge";
import { getSyncedCurseForgeProjects } from "../sync/curseforge";
import { fetchExternal } from "../sync/next-data";
import { readConnections } from "./dashboard-connections";

const REFRESH_SECONDS = 600;
async function json(url: string, apiKey?: string): Promise<unknown> {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(8000), next: { revalidate: REFRESH_SECONDS },
    headers: { Accept: "application/json", "User-Agent": "Zo7alProjects/1.0 (zo7al.is-a.dev)", ...(apiKey ? { "x-api-key": apiKey } : {}) } });
  if (!response.ok || !response.body) throw Error("UPSTREAM");
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2000000) throw Error("UPSTREAM");
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { await reader.cancel(); }
}
async function mapLimited<T, U>(items: T[], work: (item: T) => Promise<U>): Promise<U[]> {
  const result: U[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
    for (let index = next++; index < items.length; index = next++) result[index] = await work(items[index]);
  }));
  return result;
}
async function modrinthProjects(projectKey?: string): Promise<ModpackChangelogProject[]> {
  let catalog: { slug: string; title: string; iconUrl: string | null; url: string; projectType: string }[], partial = false;
  try {
    const data = await json(MODRINTH_API_URL);
    if (!Array.isArray(data) || !data.length) throw Error("UPSTREAM");
    catalog = data.flatMap(project => typeof project?.slug === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(project.slug) && typeof project.title === "string" ? [{
      slug: project.slug, title: project.title.slice(0, 200), iconUrl: typeof project.icon_url === "string" && project.icon_url.startsWith("https://cdn.modrinth.com/") ? project.icon_url : null,
      url: `https://modrinth.com/modpack/${project.slug}`, projectType: project.project_type,
    }] : []);
  } catch { catalog = MODRINTH_FALLBACK; partial = true; }
  return mapLimited(catalog.filter(project => project.projectType === "modpack" && (!projectKey || projectKey === "modrinth:" + project.slug)).slice(0, 20), async project => {
    const base = { projectKey: "modrinth:" + project.slug, title: project.title, source: "Modrinth" as const, url: project.url, iconUrl: project.iconUrl };
    try {
      const releases = parseModrinthReleases(await json(`https://api.modrinth.com/v2/project/${project.slug}/version?include_changelog=true`), project.slug);
      return { ...base, releases, status: partial ? "partial" : "live" };
    } catch { return { ...base, releases: [], status: "unavailable" }; }
  });
}
async function curseForgeKey() {
  if (process.env.CURSEFORGE_API_KEY) return process.env.CURSEFORGE_API_KEY;
  if (!process.env.DATABASE_URL) return undefined;
  try { return (await readConnections()).curseforge?.apiKey; } catch { return undefined; }
}
async function publicCurseForge(project: CurseForgeProject): Promise<{ releases: ModpackChangelogProject["releases"]; status: ChangelogStatus }> {
  let urls: string[], partial = false;
  try {
    urls = curseForgeFileUrls(await fetchExternal(project.url + "/files/all?page=1&pageSize=20&showAlphaFiles=show", REFRESH_SECONDS), project.url);
    if (!urls.length) throw Error("UPSTREAM");
  } catch {
    urls = (project.releases ?? []).map(release => release.url).filter(url => url.startsWith(project.url + "/files/") && /^\d+$/.test(url.slice((project.url + "/files/").length))).slice(0, 8);
    partial = true;
  }
  if (!urls.length) return { releases: [], status: "unavailable" };
  const files = await mapLimited(urls, async url => {
    try { return parseCurseForgeFilePage(await fetchExternal(url, REFRESH_SECONDS), url); } catch { return null; }
  });
  const releases = files.filter(file => file !== null).sort((a, b) => Date.parse(b.published!) - Date.parse(a.published!));
  return { releases, status: !releases.length ? "unavailable" : partial || files.some(file => !file) ? "partial" : "live" };
}
async function curseForgeProject(project: CurseForgeProject, apiKey?: string): Promise<ModpackChangelogProject> {
  const base = { projectKey: "curseforge:" + project.id, title: project.title, source: "CurseForge" as const, url: project.url, iconUrl: project.iconUrl || null };
  if (apiKey) {
    try {
      const slug = new URL(project.url).pathname.split("/").pop()!;
      const params = new URLSearchParams({ gameId: "432", classId: "4471", slug });
      const search = await json("https://api.curseforge.com/v1/mods/search?" + params, apiKey) as { data?: { id: number; slug: string; gameId: number }[] };
      const mod = search.data?.find(item => item.slug === slug && item.gameId === 432 && Number.isSafeInteger(item.id) && item.id > 0);
      if (!mod) throw Error("UPSTREAM");
      const files = parseCurseForgeFiles(await json(`https://api.curseforge.com/v1/mods/${mod.id}/files?pageSize=8`, apiKey), project.url, mod.id);
      let partial = false;
      const releases = await mapLimited(files, async release => {
        try {
          const result = await json(`https://api.curseforge.com/v1/mods/${mod.id}/files/${release.url.split("/").pop()}/changelog`, apiKey) as { data?: unknown };
          if (typeof result.data !== "string") throw Error("UPSTREAM");
          return { ...release, changelog: changelogText(result.data.slice(0, 100000)) };
        } catch {
          const publicFile = await fetchExternal(release.url, REFRESH_SECONDS).then(html => parseCurseForgeFilePage(html, release.url)).catch(() => null);
          if (!publicFile) partial = true;
          return { ...release, ...(publicFile ? { changelog: publicFile.changelog } : {}) };
        }
      });
      return { ...base, releases, status: partial ? "partial" : "live" };
    } catch { /* Public file pages also work without an API key. */ }
  }
  return { ...base, ...await publicCurseForge(project) };
}
async function curseForgeProjects(projectKey?: string): Promise<ModpackChangelogProject[]> {
  const [{ items }, apiKey] = await Promise.all([getSyncedCurseForgeProjects(), curseForgeKey()]);
  const projects = items.filter(project => /^https:\/\/www\.curseforge\.com\/minecraft\/modpacks\/[a-z0-9-]+$/.test(project.url) && (!projectKey || projectKey === "curseforge:" + project.id)).slice(0, 20);
  return mapLimited(projects, project => curseForgeProject(project, apiKey));
}
export async function getModpackChangelogs(projectKey?: string): Promise<ModpackChangelogData> {
  const sources: ChangelogSource[] = projectKey ? [projectKey.startsWith("modrinth:") ? "Modrinth" : "CurseForge"] : ["Modrinth", "CurseForge"];
  const results = await Promise.allSettled(sources.map(source => source === "Modrinth" ? modrinthProjects(projectKey) : curseForgeProjects(projectKey)));
  return {
    projects: results.flatMap(result => result.status === "fulfilled" ? result.value : []),
    sources: results.map((result, index) => ({ source: sources[index], status: result.status === "rejected" || !result.value.length || result.value.every(project => project.status === "unavailable") ? "unavailable" : result.value.some(project => project.status !== "live") ? "partial" : "live" })),
  };
}
