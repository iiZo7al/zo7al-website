import {
  hasAdminSession,
  sameOrigin,
  readJSON,
  privateHeaders,
} from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { bridgeId } from "@/lib/data/minecraft-bridge";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request))
    return Response.json(
      { error: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders },
    );
  try {
    const query =
      new URL(request.url).searchParams.get("q")?.slice(0, 64) ?? "";
    const rows = (
      await (
        await siteDatabase()
      ).query(
        `SELECT id,name,username,avatar,banned_until AS "bannedUntil",ban_reason AS "banReason",deleted_at AS "deletedAt" FROM site_accounts WHERE name ILIKE $1 OR username ILIKE $1 ORDER BY updated_at DESC LIMIT 100`,
        ["%" + query.replace(/[\\%_]/g, "\\$&") + "%"],
      )
    ).rows;
    return Response.json({ profiles: rows }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: privateHeaders },
    );
  }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request))
    return Response.json(
      { error: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders },
    );
  if (!sameOrigin(request))
    return Response.json(
      { error: "INVALID" },
      { status: 403, headers: privateHeaders },
    );
  try {
    const body = (await readJSON(request, 4096)) as {
      id?: unknown;
      action?: string;
      reason?: unknown;
      until?: unknown;
    };
    if (
      !bridgeId(body.id) ||
      !["ban", "unban", "delete"].includes(body.action ?? "")
    )
      throw Error("INVALID");
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length > 500) throw Error("INVALID");
    let until: string | null = null;
    if (body.action === "ban") {
      if (body.until === null) until = "9999-12-31T00:00:00Z";
      else if (
        typeof body.until === "string" &&
        Number.isFinite(Date.parse(body.until)) &&
        Date.parse(body.until) > Date.now()
      )
        until = new Date(body.until).toISOString();
      else throw Error("INVALID");
    }
    const db = await siteDatabase(),
      client = await db.connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(
          "SELECT id FROM site_accounts WHERE id=$1 AND deleted_at IS NULL FOR UPDATE",
          [body.id],
        )
      ).rows[0];
      if (!row) throw Error("NOT_FOUND");
      if (body.action === "delete") {
        await client.query(
          "UPDATE site_accounts SET name='Deleted',username=NULL,avatar=NULL,banner=NULL,bio='',socials='{}',deleted_at=now(),updated_at=now() WHERE id=$1",
          [body.id],
        );
        await client.query("DELETE FROM site_profile_images WHERE user_id=$1", [
          body.id,
        ]);
        await client.query(
          "UPDATE community_entries SET published=false WHERE user_id=$1",
          [body.id],
        );
        await client.query(
          "DELETE FROM site_minecraft_link_codes WHERE user_id=$1",
          [body.id],
        );
        await client.query(
          "DELETE FROM site_minecraft_links WHERE user_id=$1",
          [body.id],
        );
      } else
        await client.query(
          "UPDATE site_accounts SET banned_until=$2,ban_reason=$3,updated_at=now() WHERE id=$1",
          [body.id, until, body.action === "unban" ? "" : reason],
        );
      await client.query(
        "INSERT INTO site_account_moderation_log(user_id,action,reason) VALUES($1,$2,$3)",
        [body.id, body.action, reason],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error &&
          ["INVALID", "NOT_FOUND"].includes(error.message)
            ? error.message
            : "UNAVAILABLE",
      },
      {
        status:
          error instanceof Error && error.message === "INVALID"
            ? 400
            : error instanceof Error && error.message === "NOT_FOUND"
              ? 404
              : 503,
        headers: privateHeaders,
      },
    );
  }
}
