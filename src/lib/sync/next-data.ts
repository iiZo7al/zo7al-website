/**
 * Shared helpers for the site's "live sync" data sources (Linktree, the
 * Fortnite creator page). Both are Next.js-rendered pages that embed a
 * `<script id="__NEXT_DATA__">` JSON blob in the HTML — this walks that
 * blob structurally (rather than hardcoding prop names, which break the
 * moment the source site ships a redesign) to find anything shaped like
 * a link: `{ url: "https://...", title?: "..." }`.
 *
 * Every sync source built on top of this always has a verified static
 * fallback and never fabricates data — see each source file.
 */

export type ExtractedLink = { url: string; title?: string };

export function extractNextData(html: string): unknown | null {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function findLinkObjects(
  node: unknown,
  depth = 0,
  out: ExtractedLink[] = []
): ExtractedLink[] {
  if (depth > 14 || out.length > 800) return out;
  if (Array.isArray(node)) {
    for (const item of node) findLinkObjects(item, depth + 1, out);
    return out;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.url === "string" && /^https?:\/\//.test(obj.url)) {
      const title =
        (typeof obj.title === "string" && obj.title) ||
        (typeof obj.text === "string" && obj.text) ||
        (typeof obj.label === "string" && obj.label) ||
        undefined;
      out.push({ url: obj.url, title });
    }
    for (const key of Object.keys(obj)) {
      findLinkObjects(obj[key], depth + 1, out);
    }
  }
  return out;
}

/** Fetch with a timeout, a browser-like UA (some sites block bare server fetches), and ISR-style caching. */
export async function fetchExternal(url: string, revalidateSeconds: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}
