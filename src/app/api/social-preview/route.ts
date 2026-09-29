import { getSocialPreview } from "@/lib/sync/previews";
import { allowedPreviewUrl } from "@/lib/sync/social-preview-data";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  if (url.length > 2048 || !allowedPreviewUrl(url)) return Response.json({ preview: null }, { status: 400 });
  const preview = await getSocialPreview(url);
  return Response.json({ preview }, { headers: { "Cache-Control": `public, max-age=${preview ? 3600 : 60}` } });
}
