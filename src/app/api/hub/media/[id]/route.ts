import { siteDatabase } from "@/lib/server/site-db";
import { hasAdminSession, privateHeaders } from "@/lib/server/site-security";
import { contentImageId } from "@/lib/data/content-media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!contentImageId(id)) return new Response(null, { status: 404, headers: privateHeaders });
  try {
    const admin = hasAdminSession(request);
    const row = (await (await siteDatabase()).query("SELECT i.bytes,i.width,i.height FROM site_content_images i WHERE i.id=$1 AND ($2::boolean OR EXISTS(SELECT 1 FROM site_content c WHERE c.image_id=i.id AND c.published))", [id, admin])).rows[0];
    if (!row || !Buffer.isBuffer(row.bytes)) return new Response(null, { status: 404, headers: privateHeaders });
    return new Response(new Uint8Array(row.bytes), { headers: { "Content-Type": "image/webp", "Content-Length": String(row.bytes.length), "X-Content-Type-Options": "nosniff", "Cache-Control": admin ? "private, no-store" : "public, max-age=300, s-maxage=300", "Cross-Origin-Resource-Policy": "same-origin" } });
  } catch { return new Response(null, { status: 503, headers: privateHeaders }); }
}
