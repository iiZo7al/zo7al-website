import { hasAdminSession } from "@/lib/server/admin-account";
import { siteDatabase } from "@/lib/server/site-db";
import { privateHeaders } from "@/lib/server/site-security";
import { contentImageId } from "@/lib/data/content-media";
import { accountUser } from "@/lib/server/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!contentImageId(id)) {
    return new Response(null, { status: 404, headers: privateHeaders });
  }

  try {
    const admin = await hasAdminSession(request);
    const user = await accountUser(request);
    if (!admin && !user) {
      return new Response(null, { status: 401, headers: privateHeaders });
    }

    const db = await siteDatabase();
    const row = (
      await db.query("SELECT bytes FROM site_content_images WHERE id=$1", [id])
    ).rows[0];

    if (!row || !Buffer.isBuffer(row.bytes)) {
      return new Response(null, { status: 404, headers: privateHeaders });
    }

    return new Response(new Uint8Array(row.bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(row.bytes.length),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: privateHeaders });
  }
}
