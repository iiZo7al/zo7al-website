import {
  AccountError,
  accountHeaders,
  requireAccount,
  accountView,
} from "@/lib/server/account-auth";
import { siteDatabase } from "@/lib/server/site-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = accountHeaders();
  try {
    const user = await requireAccount(request, headers),
      member = await accountView(user);
    if (!member.minecraft) return Response.json({ servers: [] }, { headers });
    const rows = (
      await (
        await siteDatabase()
      ).query(
        `SELECT b.id,b.name,p.ban,p.captured_at AS "capturedAt",b.last_sync AS "lastSync" FROM minecraft_profile_bridges b LEFT JOIN minecraft_player_profiles p ON p.bridge_id=b.id AND p.uuid=$1 WHERE b.enabled ORDER BY b.created_at`,
        [member.minecraft.uuid],
      )
    ).rows;
    return Response.json(
      {
        servers: rows.map((r) => ({
          id: r.id,
          name: r.name,
          ban: r.ban,
          capturedAt: r.capturedAt,
          stale:
            !r.capturedAt ||
            !r.lastSync ||
            Date.now() - new Date(r.lastSync).getTime() > 180000 ||
            Date.now() - new Date(r.capturedAt).getTime() > 86400000,
        })),
      },
      { headers },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof AccountError ? error.code : "UNAVAILABLE" },
      { status: error instanceof AccountError ? error.status : 503, headers },
    );
  }
}
