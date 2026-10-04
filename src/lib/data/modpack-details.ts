export type ModpackRelease = {
  name: string;
  version: string;
  type?: string;
  published?: string;
  url: string;
  size?: number;
  changelog?: string;
};

export type ModpackDetails = {
  body?: string;
  gameVersions?: string[];
  loaders?: string[];
  updated?: string;
  license?: string;
  releases?: ModpackRelease[];
};

/** Render external Markdown/HTML as text, never as executable markup. */
export function readableDescription(body: string): string {
  return body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

type ModrinthVersion = { changelog?: string; id: string; name: string; version_number: string; version_type: string; date_published: string; files?: { primary: boolean; size: number }[] };
export function modrinthDetails(project: { body?: string; game_versions?: string[]; loaders?: string[]; updated?: string; license?: { name?: string; id?: string } }, versions: ModrinthVersion[], slug: string): ModpackDetails {
  return {
    body: project.body,
    gameVersions: project.game_versions ?? [], loaders: project.loaders ?? [],
    updated: project.updated, license: project.license?.name || project.license?.id,
    releases: [...versions].sort((a, b) => Date.parse(b.date_published) - Date.parse(a.date_published)).map(version => ({
      name: version.name, version: version.version_number, type: version.version_type,
      published: version.date_published, ...(typeof version.changelog === "string" ? {changelog:version.changelog} : {}),
      url: `https://modrinth.com/modpack/${encodeURIComponent(slug)}/version/${encodeURIComponent(version.id)}`,
      size: version.files?.find(file => file.primary)?.size,
    })),
  };
}
