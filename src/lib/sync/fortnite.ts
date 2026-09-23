import { FORTNITE_MAPS, islandCodeUrl, type FortniteMap } from "@/lib/data/fortnite";
import { fetchExternal } from "./next-data";
import { fortniteLocale, parseCreatorIslands, parseIslandDetails } from "./fortnite-parser";

/** Each locale has a separate upstream/cache URL; preserve Epic's exact localized copy. */
export async function getSyncedFortniteMaps(locale = "en"): Promise<{
  items: FortniteMap[];
  source: "live" | "fallback";
}> {
  let items: FortniteMap[] = FORTNITE_MAPS.map(map => ({ ...map }));
  let source: "live" | "fallback" = "fallback";
  try {
    const html = await fetchExternal(`https://www.fortnite.com/@zo7al?lang=${fortniteLocale(locale)}`, 21600);
    const found = parseCreatorIslands(html);
    if (found.length) {
      const known = new Map(FORTNITE_MAPS.map(map => [map.code, map]));
      items = found.map(info => ({ ...known.get(info.code), ...info, id: known.get(info.code)?.id ?? info.code, category: known.get(info.code)?.category ?? "Featured", thumbnail: info.thumbnail ?? known.get(info.code)?.thumbnail ?? "" }));
      source = "live";
    }
  } catch { /* Verified names and artwork remain usable during upstream outages. */ }
  // Bound concurrency so a creator with many islands cannot fan out unlimited requests.
  const queue = [...items];
  const hydrated = new Map<string, FortniteMap>();
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    for (let map = queue.shift(); map; map = queue.shift()) {
      try {
        const html = await fetchExternal(islandCodeUrl(map.code, locale), 21600);
        const details = parseIslandDetails(html, map.code);
        if (details) hydrated.set(map.code, { ...map, ...details, thumbnail: details.thumbnail ?? map.thumbnail });
      } catch { /* A missing detail page never removes a valid island. */ }
    }
  }));
  return { items: items.map(map => hydrated.get(map.code) ?? map), source };
}
