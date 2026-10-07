import { readableDescription, type ModpackRelease } from "./modpack-details";

export const CHANGELOG_SOURCES = ["Modrinth", "CurseForge"] as const;
export type ChangelogSource = (typeof CHANGELOG_SOURCES)[number];
export type ChangelogStatus = "live" | "partial" | "unavailable";
export type ModpackChangelogProject = {
  projectKey: string;
  title: string;
  source: ChangelogSource;
  url: string;
  iconUrl: string | null;
  releases: ModpackRelease[];
  status: ChangelogStatus;
};
export type ModpackChangelogData = {
  projects: ModpackChangelogProject[];
  sources: { source: ChangelogSource; status: ChangelogStatus }[];
};

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, limit = 200) => typeof value === "string" ? value.slice(0, limit) : "";
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
export function changelogText(value: string): string {
  return readableDescription(value).replace(/&#(x[0-9a-f]+|\d+);/gi, (entity, code: string) => {
    const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : entity;
  });
}
export function parseModrinthReleases(value: unknown, slug: string): ModpackRelease[] {
  if (!Array.isArray(value)) throw Error("UPSTREAM");
  return value.flatMap(item => {
    const version = record(item), id = text(version.id), published = date(version.date_published);
    if (!/^[a-zA-Z0-9]+$/.test(id) || !published || !text(version.version_number) || !text(version.name) || version.status && !["listed", "archived"].includes(String(version.status))) return [];
    return [{ name: text(version.name), version: text(version.version_number), published,
      type: ["release", "beta", "alpha"].includes(String(version.version_type)) ? String(version.version_type) : undefined,
      url: `https://modrinth.com/modpack/${encodeURIComponent(slug)}/version/${id}`,
      changelog: changelogText(text(version.changelog, 50000)) }];
  }).sort((a, b) => Date.parse(b.published!) - Date.parse(a.published!)).slice(0, 12);
}
export function parseCurseForgeFiles(value: unknown, projectUrl: string, modId: number): ModpackRelease[] {
  const data = record(value).data;
  if (!Array.isArray(data)) throw Error("UPSTREAM");
  return data.flatMap(item => {
    const file = record(item), published = date(file.fileDate);
    if (!Number.isSafeInteger(file.id) || Number(file.id) <= 0 || file.modId !== modId || file.isAvailable === false || !published || !text(file.displayName)) return [];
    return [{ name: text(file.displayName), version: text(file.displayName), published,
      type: ({ 1: "release", 2: "beta", 3: "alpha" } as Record<number, string>)[Number(file.releaseType)],
      url: `${projectUrl}/files/${file.id}`, ...(typeof file.fileLength === "number" && file.fileLength > 0 ? { size: file.fileLength } : {}) }];
  }).sort((a, b) => Date.parse(b.published!) - Date.parse(a.published!)).slice(0, 8);
}
/** Only follow file links belonging to this already verified creator project. */
export function curseForgeFileUrls(html: string, projectUrl: string): string[] {
  const path = new URL(projectUrl).pathname;
  const urls = new Set<string>();
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    try {
      const url = new URL(match[1], projectUrl);
      if (url.origin === "https://www.curseforge.com" && url.pathname.startsWith(path + "/files/") && /^\d+$/.test(url.pathname.slice((path + "/files/").length))) urls.add(url.origin + url.pathname);
    } catch { /* Ignore malformed links from the source page. */ }
  }
  return [...urls].sort((a, b) => Number(b.split("/").pop()) - Number(a.split("/").pop())).slice(0, 8);
}
/** Read CurseForge's public file page when its API is not connected. */
export function parseCurseForgeFilePage(html: string, url: string): ModpackRelease | null {
  const title = html.match(/<h2\b[^>]*class=["'][^"']*\bfile-details-card-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1];
  const notes = html.match(/<section\b[^>]*class=["'][^"']*\bfile-details-changelog\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1];
  const uploaded = html.match(/<dt\b[^>]*>\s*Uploaded\s*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i)?.[1];
  const uploadedDate = uploaded ? changelogText(uploaded).trim() : "";
  // Public pages contain a calendar date, without a timezone. Keep that date in UTC.
  const published = date(/^[a-z]{3,9}\s+\d{1,2},\s+\d{4}$/i.test(uploadedDate) ? uploadedDate + " UTC" : uploadedDate);
  if (!title || notes === undefined || !published) return null;
  const body = notes.replace(/<h3\b[^>]*>[\s\S]*?<\/h3>/i, "");
  const name = changelogText(title).slice(0, 200);
  return name ? { name, version: name, published, url, changelog: changelogText(body.slice(0, 100000)) } : null;
}
