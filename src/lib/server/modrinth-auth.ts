import "server-only";
import { randomBytes } from "node:crypto";
import { siteDatabase } from "./site-db";
import { tokenHash } from "./site-security";
import { sealYoutube, openYoutube, youtubeJSON } from "./youtube-auth";

type App = { clientId: string; clientSecret: string };
export type ModrinthAuth = { accessToken: string; expiresAt: number; userId: string; username: string };
const cookieName = process.env.NODE_ENV === "production" ? "__Host-zo7al-modrinth-oauth" : "zo7al-modrinth-oauth";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
function validApp(value: unknown): App {
  const app = object(value);
  if (typeof app.clientId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(app.clientId) || typeof app.clientSecret !== "string" || app.clientSecret.length < 16 || app.clientSecret.length > 256 || /[^\x21-\x7e]/.test(app.clientSecret)) throw Error("INVALID");
  return { clientId: app.clientId, clientSecret: app.clientSecret };
}
function environmentApp(): App | null {
  try { return validApp({ clientId: process.env.MODRINTH_OAUTH_CLIENT_ID, clientSecret: process.env.MODRINTH_OAUTH_CLIENT_SECRET }); } catch { return null; }
}
async function appCredentials(): Promise<App | null> {
  const configured = environmentApp(); if (configured) return configured;
  const row = (await (await siteDatabase()).query("SELECT sealed FROM modrinth_oauth_app WHERE id=true")).rows[0];
  try { return row ? validApp(openYoutube(row.sealed, "modrinth-app")) : null; } catch { return null; }
}
export const modrinthCallback = (request: Request) => new URL("/api/admin/modrinth/oauth/callback", request.url).href;
export async function modrinthStatus(request: Request) {
  const [app, result] = await Promise.all([appCredentials(), (await siteDatabase()).query('SELECT user_id AS "id",username,expires_at AS "expiresAt" FROM modrinth_oauth_auth WHERE id=true')]);
  const row = result.rows[0], connected = !!row && Date.parse(String(row.expiresAt)) > Date.now();
  return { connected, reconnectRequired: !!row && !connected, clientConfigured: !!app, managed: !!environmentApp(), redirectUri: modrinthCallback(request), ...(row ? { account: { id: row.id, username: row.username } } : {}) };
}
export async function saveModrinthApp(input: unknown) {
  if (environmentApp()) throw Error("MR_MANAGED");
  const app = validApp(input), client = await (await siteDatabase()).connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO modrinth_oauth_app(id,sealed) VALUES(true,$1) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,updated_at=now()", [sealYoutube(app, "modrinth-app")]);
    await client.query("DELETE FROM modrinth_oauth_auth"); await client.query("DELETE FROM modrinth_oauth_pending"); await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
}
function oauthCookie(value: string) { return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${value ? 600 : 0}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
export const clearModrinthOAuthCookie = () => oauthCookie("");
export async function startModrinthOAuth(request: Request) {
  const app = await appCredentials(); if (!app) throw Error("MR_CLIENT_MISSING");
  const state = randomBytes(32).toString("base64url"), browser = randomBytes(32).toString("base64url"), redirectUri = modrinthCallback(request), db = await siteDatabase();
  await db.query("DELETE FROM modrinth_oauth_pending WHERE expires_at<now()");
  await db.query("INSERT INTO modrinth_oauth_pending(state_hash,browser_hash,sealed,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')", [tokenHash(state), tokenHash(browser), sealYoutube({ ...app, redirectUri }, "modrinth-pending")]);
  const url = new URL("https://modrinth.com/auth/authorize");
  url.search = new URLSearchParams({ client_id: app.clientId, redirect_uri: redirectUri, response_type: "code", scope: "USER_READ PROJECT_READ", state }).toString();
  return { url: url.href, cookie: oauthCookie(browser) };
}
export async function modrinthJSON(path: string, accessToken: string) {
  if (!/^\/v2\/(?:user(?:\/[A-Za-z0-9_-]{1,128}\/projects)?)$/.test(path)) throw Error("INVALID");
  const response = await fetch("https://api.modrinth.com" + path, { headers: { Authorization: accessToken, Accept: "application/json", "User-Agent": "Zo7alProjects/1.0 (zo7al.is-a.dev)" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000) });
  if (response.status === 401 || response.status === 403) throw Error("MR_RECONNECT");
  if (!response.ok) throw Error("MR_UNAVAILABLE");
  // Project lists can be arrays, unlike the token and identity responses.
  const reader = response.body?.getReader(); if (!reader) throw Error("MR_UNAVAILABLE");
  const chunks: Uint8Array[] = []; let length = 0;
  try { while (true) { const value = await reader.read(); if (value.done) break; length += value.value.length; if (length > 2_000_000) throw Error("MR_UNAVAILABLE"); chunks.push(value.value); } return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  finally { await reader.cancel(); }
}
export async function finishModrinthOAuth(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get("state") ?? "", browser = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(cookieName + "="))?.slice(cookieName.length + 1) ?? "";
  if (!/^[\w-]{43}$/.test(state) || !/^[\w-]{43}$/.test(browser)) throw Error("INVALID");
  const db = await siteDatabase();
  const row = (await db.query("UPDATE modrinth_oauth_pending SET claimed=true WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>now() AND claimed=false RETURNING sealed", [tokenHash(state), tokenHash(browser)])).rows[0];
  if (!row) throw Error("INVALID");
  if (params.has("error")) { await db.query("DELETE FROM modrinth_oauth_pending WHERE state_hash=$1", [tokenHash(state)]); return "cancelled"; }
  const pending = object(openYoutube(row.sealed, "modrinth-pending")), app = validApp(pending), code = params.get("code");
  if (!code || code.length > 4096 || /[\x00-\x1f\x7f]/.test(code) || pending.redirectUri !== modrinthCallback(request) || (params.has("client_id") && params.get("client_id") !== app.clientId)) throw Error("INVALID");
  const response = await fetch("https://api.modrinth.com/_internal/oauth/token", { method: "POST", headers: { Authorization: app.clientSecret, "User-Agent": "Zo7alProjects/1.0 (zo7al.is-a.dev)" }, body: new URLSearchParams({ client_id: app.clientId, grant_type: "authorization_code", code, redirect_uri: String(pending.redirectUri) }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error("MR_RECONNECT");
  const token = await youtubeJSON(response);
  if (typeof token.access_token !== "string" || token.access_token.length > 8192 || !token.access_token || /[^\x21-\x7e]/.test(token.access_token) || token.token_type !== "Bearer" || typeof token.expires_in !== "number" || !Number.isFinite(token.expires_in) || token.expires_in < 60 || token.expires_in > 315360000) throw Error("MR_RECONNECT");
  const user = object(await modrinthJSON("/v2/user", token.access_token));
  if (typeof user.id !== "string" || !/^[A-Za-z0-9]{1,128}$/.test(user.id) || typeof user.username !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(user.username)) throw Error("MR_RECONNECT");
  const auth: ModrinthAuth = { accessToken: token.access_token, expiresAt: Date.now() + token.expires_in * 1000, userId: user.id, username: user.username };
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const pending = await client.query("DELETE FROM modrinth_oauth_pending WHERE state_hash=$1 AND claimed=true AND expires_at>now() RETURNING sealed", [tokenHash(state)]);
    if (!pending.rowCount) throw Error("MR_RECONNECT");
    await client.query("INSERT INTO modrinth_oauth_auth(id,sealed,user_id,username,expires_at) VALUES(true,$1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,user_id=excluded.user_id,username=excluded.username,expires_at=excluded.expires_at,updated_at=now()", [sealYoutube(auth, "modrinth-auth"), auth.userId, auth.username, new Date(auth.expiresAt).toISOString()]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
  return "connected";
}
export async function modrinthAuth(): Promise<ModrinthAuth | null> {
  const row = (await (await siteDatabase()).query("SELECT sealed FROM modrinth_oauth_auth WHERE id=true")).rows[0];
  if (!row) return null;
  try {
    const auth = openYoutube(row.sealed, "modrinth-auth") as ModrinthAuth;
    if (!auth.accessToken || !/^[A-Za-z0-9]{1,128}$/.test(auth.userId) || !Number.isFinite(auth.expiresAt) || auth.expiresAt <= Date.now() + 60000) throw Error();
    return auth;
  } catch { throw Error("MR_RECONNECT"); }
}
export async function disconnectModrinth() {
  const client = await (await siteDatabase()).connect();
  try { await client.query("BEGIN"); await client.query("DELETE FROM modrinth_oauth_pending"); await client.query("DELETE FROM modrinth_oauth_auth"); await client.query("COMMIT"); }
  catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
}
