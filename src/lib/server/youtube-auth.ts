import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { siteDatabase } from "./site-db";
import { tokenHash } from "./site-security";
import { youtubeObject, youtubeItems, youtubeString } from "../data/youtube-studio";

type App = { clientId: string; clientSecret: string };
export type YoutubeAuth = App & { accessToken: string; refreshToken: string; expiresAt: number; channelId: string; title: string };
const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl", "https://www.googleapis.com/auth/yt-analytics.readonly", "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"];
const cookieName = process.env.NODE_ENV === "production" ? "__Host-zo7al-youtube-oauth" : "zo7al-youtube-oauth";
function secret() {
  const secret = process.env.ZO7AL_ADMIN_SESSION_SECRET ?? "";
  if (secret.length < 43) throw Error("YT_UNAVAILABLE");
  return createHash("sha256").update("zo7al-youtube-studio:" + secret).digest();
}
export function sealYoutube(value: unknown, purpose: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", secret(), iv); cipher.setAAD(Buffer.from(purpose));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}
export function openYoutube(value: string, purpose: string): unknown {
  const [iv, tag, data, extra] = value.split(".");
  if (!iv || !tag || !data || extra || value.length > 32000) throw Error("INVALID");
  const decipher = createDecipheriv("aes-256-gcm", secret(), Buffer.from(iv, "base64url")); decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"));
}
function validApp(value: unknown): App {
  const app = youtubeObject(value);
  if (typeof app.clientId !== "string" || app.clientId.length > 256 || !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(app.clientId) || typeof app.clientSecret !== "string" || app.clientSecret.length < 16 || app.clientSecret.length > 256 || /[^\x21-\x7e]/.test(app.clientSecret)) throw Error("INVALID");
  return { clientId: app.clientId, clientSecret: app.clientSecret };
}
function environmentApp(): App | null {
  try { return validApp({ clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID?.trim(), clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim() }); } catch { return null; }
}
async function appCredentials(): Promise<App | null> {
  const configured = environmentApp(); if (configured) return configured;
  const row = (await (await siteDatabase()).query("SELECT sealed FROM youtube_studio_app WHERE id=true")).rows[0];
  try { return row ? validApp(openYoutube(row.sealed, "app")) : null; } catch { return null; }
}
export function youtubeCallback(request: Request) {
  const origin = new URL(request.url), host = request.headers.get("host");
  if (host) {
    if (/[\s/\\?#@]/.test(host)) throw Error("INVALID");
    const publicUrl = new URL(origin.protocol + "//" + host);
    origin.host = publicUrl.host;
  }
  if (request.headers.get("x-forwarded-proto") === "https") origin.protocol = "https:";
  return new URL("/api/admin/youtube/oauth/callback", origin.origin).href;
}
export async function youtubeStatus(request: Request) {
  const [app, result] = await Promise.all([appCredentials(), (await siteDatabase()).query("SELECT channel_id,title FROM youtube_studio_auth WHERE id=true")]);
  const row = result.rows[0];
  return { connected: !!row, clientConfigured: !!app, managed: !!environmentApp(), redirectUri: youtubeCallback(request), ...(row ? { channel: { id: row.channel_id, title: row.title } } : {}) };
}
export async function saveYoutubeApp(input: unknown) {
  if (environmentApp()) throw Error("YT_MANAGED");
  const app = validApp(input), db = await siteDatabase(), client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO youtube_studio_app(id,sealed) VALUES(true,$1) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,updated_at=now()", [sealYoutube(app, "app")]);
    await client.query("DELETE FROM youtube_studio_auth"); await client.query("DELETE FROM youtube_studio_oauth"); await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
}
export async function youtubeJSON(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader(); if (!reader) throw Error("YT_UNAVAILABLE");
  const chunks: Uint8Array[] = []; let length = 0;
  try { while (true) { const value = await reader.read(); if (value.done) break; length += value.value.length; if (length > 2_000_000) throw Error("YT_UNAVAILABLE"); chunks.push(value.value); } return youtubeObject(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  finally { await reader.cancel(); }
}
async function tokenRequest(body: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  const value = await youtubeJSON(response);
  if (!response.ok) {
    const error = youtubeString(value.error);
    throw Error(error === "invalid_client" || error === "unauthorized_client" ? "YT_CLIENT_INVALID" : error === "redirect_uri_mismatch" ? "YT_REDIRECT" : error === "access_denied" ? "YT_PERMISSION" : response.status === 429 ? "YT_QUOTA" : response.status >= 500 ? "YT_UNAVAILABLE" : "YT_RECONNECT");
  }
  if (typeof value.access_token !== "string" || value.access_token.length > 8192 || typeof value.expires_in !== "number" || value.expires_in < 60 || value.expires_in > 86400) throw Error("YT_RECONNECT");
  return value;
}
export async function startYoutubeOAuth(request: Request) {
  const app = await appCredentials(); if (!app) throw Error("YT_CLIENT_MISSING");
  const state = randomBytes(32).toString("base64url"), browser = randomBytes(32).toString("base64url"), verifier = randomBytes(48).toString("base64url"), redirectUri = youtubeCallback(request), db = await siteDatabase();
  await db.query("DELETE FROM youtube_studio_oauth WHERE expires_at<now()");
  await db.query("INSERT INTO youtube_studio_oauth(state_hash,browser_hash,sealed,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')", [tokenHash(state), tokenHash(browser), sealYoutube({ ...app, verifier, redirectUri }, "oauth")]);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: app.clientId, redirect_uri: redirectUri, response_type: "code", scope: scopes.join(" "), access_type: "offline", prompt: "consent", state, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
  return { url: url.href, cookie: oauthCookie(browser) };
}
function oauthCookie(value: string) { return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${value ? 600 : 0}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
export const clearYoutubeOAuthCookie = () => oauthCookie("");
export async function finishYoutubeOAuth(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get("state") ?? "", browser = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(cookieName + "="))?.slice(cookieName.length + 1) ?? "";
  if (!/^[\w-]{43}$/.test(state) || !/^[\w-]{43}$/.test(browser)) throw Error("INVALID");
  // Consume once, binding the callback to the browser that initiated admin consent.
  const row = (await (await siteDatabase()).query("UPDATE youtube_studio_oauth SET claimed=true WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>now() AND claimed=false RETURNING sealed", [tokenHash(state), tokenHash(browser)])).rows[0];
  if (!row) throw Error("INVALID");
  if (params.has("error")) { await (await siteDatabase()).query("DELETE FROM youtube_studio_oauth WHERE state_hash=$1", [tokenHash(state)]); return "cancelled"; }
  const pending = youtubeObject(openYoutube(row.sealed, "oauth")), app = validApp(pending), code = params.get("code");
  if (pending.redirectUri !== youtubeCallback(request)) throw Error("YT_REDIRECT");
  if (!code || code.length > 4096) throw Error("INVALID");
  const value = await tokenRequest(new URLSearchParams({ client_id: app.clientId, client_secret: app.clientSecret, grant_type: "authorization_code", code, code_verifier: String(pending.verifier), redirect_uri: String(pending.redirectUri) }));
  const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", { headers: { Authorization: "Bearer " + value.access_token }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000) });
  const channels = await youtubeJSON(response);
  if (!response.ok) {
    const error = youtubeObject(channels.error), reasons = Array.isArray(error.errors) ? error.errors.map(item => youtubeString(youtubeObject(item).reason)) : [];
    throw Error(reasons.some(reason => ["accessNotConfigured", "serviceDisabled"].includes(reason)) ? "YT_API_DISABLED" : response.status === 401 ? "YT_RECONNECT" : response.status === 429 || reasons.some(reason => ["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"].includes(reason)) ? "YT_QUOTA" : response.status === 403 ? "YT_PERMISSION" : "YT_UNAVAILABLE");
  }
  const channel = youtubeItems(channels)[0];
  if (!channel || !/^UC[\w-]{22}$/.test(youtubeString(channel.id))) throw Error("YT_NO_CHANNEL");
  let refreshToken = youtubeString(value.refresh_token);
  if (!refreshToken) {
    // Google may omit a new refresh token when the same channel reconnects.
    const previous = (await (await siteDatabase()).query("SELECT sealed FROM youtube_studio_auth WHERE id=true")).rows[0];
    if (previous) try {
      const saved = youtubeObject(openYoutube(previous.sealed, "auth"));
      if (saved.clientId === app.clientId && saved.clientSecret === app.clientSecret && saved.channelId === channel.id) refreshToken = youtubeString(saved.refreshToken);
    } catch { /* A different or unreadable identity must obtain fresh consent. */ }
  }
  if (!refreshToken || refreshToken.length > 8192) throw Error("YT_RECONNECT");
  const auth: YoutubeAuth = { ...app, accessToken: String(value.access_token), refreshToken, expiresAt: Date.now() + Number(value.expires_in) * 1000, channelId: String(channel.id), title: youtubeString(youtubeObject(channel.snippet).title).slice(0, 200) };
  const client = await (await siteDatabase()).connect();
  try {
    await client.query("BEGIN");
    // Disconnecting or replacing app credentials cancels even an in-flight callback.
    const pending = await client.query("DELETE FROM youtube_studio_oauth WHERE state_hash=$1 AND claimed=true AND expires_at>now() RETURNING sealed", [tokenHash(state)]);
    if (!pending.rowCount) throw Error("YT_RECONNECT");
    await client.query("INSERT INTO youtube_studio_auth(id,sealed,channel_id,title) VALUES(true,$1,$2,$3) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,channel_id=excluded.channel_id,title=excluded.title,updated_at=now()", [sealYoutube(auth, "auth"), auth.channelId, auth.title]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
  return "connected";
}
const refreshing = new Map<string, Promise<YoutubeAuth>>();
export async function youtubeAuth(): Promise<YoutubeAuth> {
  const row = (await (await siteDatabase()).query("SELECT sealed FROM youtube_studio_auth WHERE id=true")).rows[0];
  if (!row) throw Error("YT_SETUP");
  let auth: YoutubeAuth;
  try { auth = openYoutube(row.sealed, "auth") as YoutubeAuth; if (!auth.accessToken || !auth.refreshToken || !/^UC[\w-]{22}$/.test(auth.channelId)) throw Error(); } catch { throw Error("YT_RECONNECT"); }
  if (auth.expiresAt > Date.now() + 60000) return auth;
  const previous = refreshing.get(row.sealed); if (previous) return previous;
  const work = (async () => {
    const value = await tokenRequest(new URLSearchParams({ client_id: auth.clientId, client_secret: auth.clientSecret, grant_type: "refresh_token", refresh_token: auth.refreshToken }));
    const next = { ...auth, accessToken: String(value.access_token), expiresAt: Date.now() + Number(value.expires_in) * 1000, refreshToken: typeof value.refresh_token === "string" ? value.refresh_token : auth.refreshToken };
    const result = await (await siteDatabase()).query("UPDATE youtube_studio_auth SET sealed=$1 WHERE id=true AND sealed=$2", [sealYoutube(next, "auth"), row.sealed]);
    if (!result.rowCount) {
      const fresh = (await (await siteDatabase()).query("SELECT sealed FROM youtube_studio_auth WHERE id=true")).rows[0];
      if (!fresh) throw Error("YT_RECONNECT");
      const latest = openYoutube(fresh.sealed, "auth") as YoutubeAuth;
      if (latest.channelId !== auth.channelId || latest.expiresAt <= Date.now() + 60000) throw Error("YT_RECONNECT");
      return latest;
    }
    return next;
  })().finally(() => refreshing.delete(row.sealed)); refreshing.set(row.sealed, work); return work;
}
export async function disconnectYoutube() {
  const db = await siteDatabase(), client = await db.connect(); let row;
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM youtube_studio_oauth");
    row = (await client.query("DELETE FROM youtube_studio_auth WHERE id=true RETURNING sealed")).rows[0];
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
  if (row) try { const value = youtubeObject(openYoutube(row.sealed, "auth")); await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", body: new URLSearchParams({ token: String(value.refreshToken) }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) }); } catch { /* Local access is removed even if Google's revoke service is unavailable. */ }
}
