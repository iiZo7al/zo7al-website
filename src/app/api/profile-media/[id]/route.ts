import { siteDatabase } from "@/lib/server/site-db";
import { bridgeId } from "@/lib/data/minecraft-bridge";
import { accountUser } from "@/lib/server/account-auth";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!bridgeId(id)) return new Response(null, { status: 404 });
  try {
    const row = (
      await (
        await siteDatabase()
      ).query(
        `SELECT i.bytes,i.user_id,a.avatar,a.banner,a.username,a.deleted_at,a.banned_until,a.deletion_due_at FROM site_profile_images i JOIN site_accounts a ON a.id=i.user_id WHERE i.id=$1`,
        [id],
      )
    ).rows[0];
    if (
      !row ||
      row.deleted_at || row.deletion_due_at ||
      (row.banned_until && new Date(row.banned_until).getTime() > Date.now())
    )
      return new Response(null, { status: 404 });
    const published =
      row.username &&
      (row.avatar === "/api/profile-media/" + id ||
        row.banner === "/api/profile-media/" + id);
    if (!published && (await accountUser(request))?.id !== row.user_id)
      return new Response(null, { status: 404 });
    return new Response(new Uint8Array(row.bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
