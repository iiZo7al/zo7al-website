import { randomBytes } from "node:crypto";
import {
  AccountError,
  accountPasskeysEnabled,
  accountHeaders,
  accountOrigin,
  accountRequiresMFA,
  accountView,
  authRequest,
  requireAccountSession,
  setAccountTokens,
  setAccountCookie,
  requestCookie,
  type AuthUser,
} from "@/lib/server/account-auth";
import { readJSON, tokenHash } from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const FLOW =
  process.env.NODE_ENV === "production"
    ? "__Host-zo7al-passkey"
    : "zo7al-passkey";
const enabled = accountPasskeysEnabled;
function failed(error: unknown, headers: Headers) {
  return Response.json(
    { error: error instanceof AccountError ? error.code : "UNAVAILABLE" },
    { status: error instanceof AccountError ? error.status : 503, headers },
  );
}
async function session(request: Request, headers: Headers) {
  const s = await requireAccountSession(request, headers);
  if (accountRequiresMFA(s.user, s.access))
    throw new AccountError("MFA_REQUIRED", 403);
  return s;
}
export async function GET(request: Request) {
  const headers = accountHeaders();
  try {
    if (!(await enabled()))
      return Response.json({ enabled: false, passkeys: [] }, { headers });
    const s = await session(request, headers);
    const data = await authRequest("/passkeys", "GET", undefined, s.access);
    return Response.json({ enabled: true, passkeys: data }, { headers });
  } catch (error) {
    return failed(error, headers);
  }
}
export async function POST(request: Request) {
  const headers = accountHeaders();
  try {
    if (!accountOrigin(request)) throw new AccountError("INVALID", 403);
    if (!(await enabled())) throw new AccountError("PASSKEY_UNAVAILABLE", 503);
    const body = (await readJSON(request, 16000)) as Record<string, unknown>;
    if (
      ![
        "signin-start",
        "signin-verify",
        "register-start",
        "register-verify",
        "delete",
      ].includes(String(body.action))
    )
      throw new AccountError("INVALID");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (!(await limitAttempt("passkey:" + ip, 20, 900)))
      throw new AccountError("RATE_LIMIT", 429);
    const registering = String(body.action).startsWith("register");
    const s =
      registering || body.action === "delete"
        ? await session(request, headers)
        : null;
    if (body.action === "delete") {
      if (typeof body.id !== "string" || !/^[a-f0-9-]{36}$/i.test(body.id))
        throw new AccountError("INVALID");
      await authRequest("/passkeys/" + body.id, "DELETE", undefined, s!.access);
      return Response.json({ ok: true }, { headers });
    }
    const ceremony = registering ? "registration" : "authentication";
    if (String(body.action).endsWith("-start")) {
      const data = (await authRequest(
        "/passkeys/" + ceremony + "/options",
        "POST",
        {},
        s?.access,
      )) as unknown as { challenge_id: string; options: unknown };
      if (
        typeof data.challenge_id !== "string" ||
        data.challenge_id.length > 128 ||
        !data.options
      )
        throw new AccountError("UNAVAILABLE", 503);
      const browser = randomBytes(32).toString("hex"),
        db = await siteDatabase();
      await db.query("DELETE FROM site_passkey_flows WHERE expires_at<now()");
      await db.query(
        "INSERT INTO site_passkey_flows(browser_hash,challenge_id,purpose,user_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '5 minutes')",
        [tokenHash(browser), data.challenge_id, ceremony, s?.user.id ?? null],
      );
      setAccountCookie(headers, FLOW, browser, 300);
      return Response.json(data, { headers });
    }
    const browser = requestCookie(request, FLOW);
    setAccountCookie(headers, FLOW, "", 0);
    if (
      !/^[a-f0-9]{64}$/.test(browser) ||
      typeof body.challengeId !== "string" ||
      !body.credential ||
      typeof body.credential !== "object"
    )
      throw new AccountError("INVALID");
    const flow = (
      await (
        await siteDatabase()
      ).query(
        "DELETE FROM site_passkey_flows WHERE browser_hash=$1 AND expires_at>now() RETURNING challenge_id,purpose,user_id",
        [tokenHash(browser)],
      )
    ).rows[0];
    if (
      !flow ||
      flow.challenge_id !== body.challengeId ||
      flow.purpose !== ceremony ||
      (registering && flow.user_id !== s?.user.id)
    )
      throw new AccountError("AUTH_EXPIRED", 401);
    const result = await authRequest(
      "/passkeys/" + ceremony + "/verify",
      "POST",
      { challenge_id: body.challengeId, credential: body.credential },
      s?.access,
    );
    if (registering) return Response.json({ ok: true }, { headers });
    if (!result.access_token || !result.refresh_token)
      throw new AccountError("AUTH_EXPIRED", 401);
    const user = (await authRequest(
      "/user",
      "GET",
      undefined,
      result.access_token,
    )) as AuthUser;
    await accountView(user);
    setAccountTokens(result, headers);
    return Response.json(
      { ok: true, mfaRequired: accountRequiresMFA(user, result.access_token) },
      { headers },
    );
  } catch (error) {
    return failed(error, headers);
  }
}
