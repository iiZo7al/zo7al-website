import { FORTNITE_MAPS, type FortniteMap } from "@/lib/data/fortnite";
import { fetchExternal } from "./next-data";

const CREATOR_URL = "https://www.fortnite.com/@zo7al";
const CODE_RE = /^\d{4}-\d{4}-\d{4}$/;

function slugify(title: string, code: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join("-");
  return base ? `${base}-${code.slice(0, 4)}` : code;
}

/**
 * The creator page renders island cards as `<a href="/creative/island-codes/CODE">`
 * with the map title in the image alt text right beside it. Regex over the raw
 * HTML is more resilient here than chasing the page's JSON shape, since Epic's
 * creator-page bundle changes often.
 */
export async function getSyncedFortniteMaps(): Promise<{
  items: FortniteMap[];
  source: "live" | "fallback";
}> {
  try {
    const html = await fetchExternal(CREATOR_URL, 21600); // refresh every 6h

    const found = new Map<string, { title: string; thumbnail?: string }>();
    const anchorRe = /<a[^>]*href="[^"]*\/creative\/island-codes\/(\d{4}-\d{4}-\d{4})"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(html))) {
      const code = m[1];
      if (!CODE_RE.test(code)) continue;
      const inner = m[2];
      const imgAlt = inner.match(/alt="([^"]*)"/)?.[1];
      const imgSrc = inner.match(/src="([^"]*)"/)?.[1];
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const title = (imgAlt || text || code).trim();
      if (!found.has(code)) {
        found.set(code, { title, thumbnail: imgSrc });
      } else if (imgSrc && !found.get(code)!.thumbnail) {
        found.get(code)!.thumbnail = imgSrc;
      }
    }

    if (found.size === 0) throw new Error("no island codes parsed");

    // Preserve category/featured metadata from the verified list when a
    // code matches; new codes not seen before get a generic category.
    const knownByCode = new Map(FORTNITE_MAPS.map((m) => [m.code, m]));
    const items: FortniteMap[] = Array.from(found.entries()).map(([code, info]) => {
      const known = knownByCode.get(code);
      return {
        id: known?.id ?? slugify(info.title, code),
        title: info.title,
        code,
        category: known?.category ?? "Featured",
        thumbnail: info.thumbnail ?? known?.thumbnail ?? "",
        featured: known?.featured,
      };
    });

    return { items, source: "live" };
  } catch {
    return { items: FORTNITE_MAPS as unknown as FortniteMap[], source: "fallback" };
  }
}
