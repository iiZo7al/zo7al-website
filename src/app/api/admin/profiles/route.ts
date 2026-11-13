import { AccountError } from "@/lib/server/account-auth";
import { permanentlyDeleteAccount } from "@/lib/server/account-deletion";
import { hasAdminSession, isOwnerAccount } from "@/lib/server/admin-account";
import { normalizeDashboardPermissions } from "@/lib/data/dashboard-permissions";
import {
  sameOrigin,
  readJSON,
  privateHeaders,
} from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { bridgeId } from "@/lib/data/minecraft-bridge";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await hasAdminSession(request, "profiles"))
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
        `SELECT a.id,a.name,a.username,a.avatar,a.banned_until AS "bannedUntil",a.ban_reason AS "banReason",a.deleted_at AS "deletedAt",COALESCE(p.permissions,'[]'::jsonb) AS permissions FROM site_accounts a LEFT JOIN site_dashboard_permissions p ON p.user_id = a.id WHERE a.auth_purged_at IS NULL AND (a.name ILIKE $1 OR a.username ILIKE $1) ORDER BY a.updated_at DESC LIMIT 100`,
        ["%" + query.replace(/[\\%_]/g, "\\$&") + "%"],
      )
    ).rows.map((row) => ({
      ...row,
      permissions: isOwnerAccount(row.id)
        ? ["all"]
        : normalizeDashboardPermissions(row.permissions),
      isOwner: isOwnerAccount(row.id),
    }));
    return Response.json({ profiles: rows }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: privateHeaders },
    );
  }
}
export async function POST(request: Request) {
  if (!await hasAdminSession(request, "profiles"))
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
      permissions?: unknown;
    };
    if (
      !bridgeId(body.id) ||
      !["ban", "unban", "delete", "permissions"].includes(body.action ?? "")
    )
      throw Error("INVALID");
    if (body.action === "permissions") {
      if (isOwnerAccount(body.id)) throw Error("INVALID");
      const perms = normalizeDashboardPermissions(body.permissions);
      const db = await siteDatabase();
      const exists = (
        await db.query(
          "SELECT id FROM site_accounts WHERE id=$1 AND deleted_at IS NULL",
          [body.id],
        )
      ).rows[0];
      if (!exists) throw Error("NOT_FOUND");
      if (perms.length === 0) {
        await db.query("DELETE FROM site_dashboard_permissions WHERE user_id=$1", [
          body.id,
        ]);
      } else {
        await db.query(
          `INSERT INTO site_dashboard_permissions (user_id, permissions, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (user_id) DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = now()`,
          [body.id, JSON.stringify(perms)],
        );
      }
      return Response.json({ ok: true, permissions: perms }, { headers: privateHeaders });
    }
    if(body.action === "delete") {await permanentlyDeleteAccount(body.id);return Response.json({ok:true},{headers:privateHeaders});}
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
          error instanceof AccountError ? error.code : error instanceof Error &&
          ["INVALID", "NOT_FOUND"].includes(error.message)
            ? error.message
            : "UNAVAILABLE",
      },
      {
        status:
          error instanceof AccountError ? error.status : error instanceof Error && error.message === "INVALID"
            ? 400
            : error instanceof Error && error.message === "NOT_FOUND"
              ? 404
              : 503,
        headers: privateHeaders,
      },
    );
  }
}
