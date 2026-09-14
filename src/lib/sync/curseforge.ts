import { CURSEFORGE_PROJECTS, type CurseForgeProject } from "@/lib/data/curseforge";
import { fetchExternal } from "./next-data";

const PROFILE_URL = "https://www.curseforge.com/members/iizo7al/projects";
const PROJECT_HREF_RE =
  /href="(?:https:\/\/www\.curseforge\.com)?(\/minecraft\/(?:modpacks|mc-mods|texture-packs|worlds|bukkit-plugins|customization|shaders)\/([a-z0-9-]+))"[^>]*>([\s\S]{0,400}?)<\/a>/g;

export async function getSyncedCurseForgeProjects(): Promise<{
  items: CurseForgeProject[];
  source: "live" | "fallback";
}> {
  try {
    const html = await fetchExternal(PROFILE_URL, 21600); // refresh every 6h

    const found = new Map<string, CurseForgeProject>();
    let m: RegExpExecArray | null;
    while ((m = PROJECT_HREF_RE.exec(html))) {
      const [, path, slug, inner] = m;
      if (found.has(slug)) continue;

      const imgSrc = inner.match(/src="([^"]*avatars[^"]*)"/)?.[1] ?? inner.match(/src="([^"]*)"/)?.[1] ?? "";
      const altTitle = inner.match(/alt="([^"]*)"/)?.[1];
      const textTitle = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const title = (altTitle || textTitle || slug).trim();

      // Skip obvious non-project nav anchors (empty title, too short/long).
      if (!title || title.length < 2 || title.length > 80) continue;

      const known = CURSEFORGE_PROJECTS.find((p) => p.url.endsWith(slug));
      found.set(slug, {
        id: known?.id ?? slug,
        title: known?.title ?? title,
        description: known?.description ?? "",
        iconUrl: imgSrc || known?.iconUrl || "",
        downloads: known?.downloads ?? 0,
        categories: known?.categories ?? [],
        url: `https://www.curseforge.com${path}`,
      });
    }

    if (found.size === 0) throw new Error("no projects parsed");
    return { items: Array.from(found.values()), source: "live" };
  } catch {
    return { items: CURSEFORGE_PROJECTS, source: "fallback" };
  }
}
