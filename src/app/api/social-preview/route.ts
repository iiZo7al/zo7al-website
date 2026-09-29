import { getSyncedSocials, getSyncedGamesSocials } from "@/lib/sync/socials";
import { getSocialPreview } from "@/lib/sync/previews";
import { allowedPreviewUrl } from "@/lib/sync/social-preview-data";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  if (url.length > 2048 || !allowedPreviewUrl(url)) return Response.json({ preview: null }, { status: 400 });
  // Credential-backed APIs are only used for accounts actually listed on this site.
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (["twitch.tv", "x.com", "twitter.com"].includes(host)) {
    const groups = await Promise.all([getSyncedSocials(), getSyncedGamesSocials()]);
    const identity = (value: string) => { const item = new URL(value); return item.hostname.replace(/^www\./, "").replace(/^twitter\.com$/, "x.com") + item.pathname.replace(/\/$/, "").toLowerCase(); };
    if (!groups.some(group => group.items.some(item => identity(item.url) === identity(url)))) return Response.json({ preview: null }, { status: 400 });
  }
  const preview = await getSocialPreview(url);
  return Response.json({ preview }, { headers: { "Cache-Control": `public, max-age=${preview?.contentStatus === "live" ? 300 : 60}` } });
}
