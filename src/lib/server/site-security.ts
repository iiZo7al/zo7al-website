import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
export const ADMIN_COOKIE = process.env.NODE_ENV === "production" ? "__Host-zo7al-admin" : "zo7al-admin";
const SESSION_SECONDS = 8 * 60 * 60;
export const privateHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
export function configuredAdmin() {
  return !!process.env.ZO7AL_ADMIN_PASSWORD_HASH?.match(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/) && (process.env.ZO7AL_ADMIN_SESSION_SECRET?.length ?? 0) >= 43;
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashAdminPassword(password: string, salt = randomBytes(16).toString("hex")) {
  if (password.length < 16 || password.length > 128) throw new Error("PASSWORD_LENGTH");
  return `scrypt:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyAdminPassword(password: unknown, encoded: string) {
  if (typeof password !== "string" || password.length < 16 || password.length > 128 || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, hash] = encoded.split(":");
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, "hex"));
}
const signature = (payload: string, secret: string, passwordHash: string) => createHmac("sha256", secret).update("admin:" + passwordHash + ":" + payload).digest("base64url");
export function signAdminSession(secret: string, passwordHash: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_SECONDS * 1000, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return payload + "." + signature(payload, secret, passwordHash);
}
export function verifyAdminSession(token: string, secret: string, passwordHash: string, now = Date.now()) {
  if (token.length > 512 || secret.length < 43) return false;
  try {
    const [payload, mac, extra] = token.split(".");
    if (!payload || !mac || extra) return false;
    const expected = Buffer.from(signature(payload, secret, passwordHash));
    const supplied = Buffer.from(mac);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isSafeInteger(data.exp) && data.exp > now && data.exp <= now + SESSION_SECONDS * 1000 && /^[a-f0-9]{32}$/.test(data.nonce);
  } catch { return false; }
}
export function hasAdminSession(request: Request) {
  if (!configuredAdmin()) return false;
  const token = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(ADMIN_COOKIE + "="))?.slice(ADMIN_COOKIE.length + 1) ?? "";
  return verifyAdminSession(token, process.env.ZO7AL_ADMIN_SESSION_SECRET!, process.env.ZO7AL_ADMIN_PASSWORD_HASH!);
}
export function adminCookie(value: string, clear = false) {
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function sameOrigin(request: Request) {
  const url = new URL(request.url);
  return request.headers.get("origin") === `${url.protocol}//${request.headers.get("host") ?? url.host}`;
}
export async function readJSON(request: Request, maxBytes = 24000): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("INVALID");
  const reader = request.body?.getReader(); if (!reader) throw new Error("INVALID");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > maxBytes) throw new Error("INVALID"); chunks.push(value); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { await reader.cancel(); }
}
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function validReceipt(value: unknown): value is { reference: string; token: string } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.reference === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.reference) && typeof v.token === "string" && /^[a-f0-9]{64}$/.test(v.token);
}
