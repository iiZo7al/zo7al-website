import { isIP } from "node:net";
import { randomUUID } from "node:crypto";

type Application = { platform: string; email: string; minecraft: string; discord: string; channel: string; followers: string; content: string; reason: string; consent: boolean; website?: string };
export function validateApplication(value: unknown): Application | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Application;
  const limits: Record<string, number> = { platform: 10, email: 254, minecraft: 32, discord: 40, channel: 500, followers: 10, content: 500, reason: 1000 };
  for (const [key, max] of Object.entries(limits)) {
    const v = a[key as keyof Application];
    if (typeof v !== "string" || !v.trim() || v.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)) return null;
  }
  if (a.consent !== true || a.website || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email) || !/^[.a-zA-Z0-9_ ]{3,32}$/.test(a.minecraft) || !/^\d{1,10}$/.test(a.followers) || Number(a.followers) > 1e9 || a.reason.trim().length < 20) return null;
  try {
    const u = new URL(a.channel);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    const host = u.hostname.replace(/^www\./, "");
    const valid = a.platform === "youtube" ? host === "youtube.com" && /^\/(?:@[^/]+|(?:channel|c|user)\/[^/]+)\/?$/.test(u.pathname) : a.platform === "twitch" ? host === "twitch.tv" && /^\/[a-zA-Z0-9_]+\/?$/.test(u.pathname) : a.platform === "tiktok" && host === "tiktok.com" && /^\/@[^/]+\/?$/.test(u.pathname);
    if (!valid) return null;
  } catch { return null; }
  return a;
}
export function webhookUrl(raw: string | undefined): URL | null {
  try {
    const u = new URL(raw ?? "");
    if (u.protocol !== "https:" || u.hostname !== "discord.com" || u.port || u.username || u.password || !/^\/api\/(?:v\d+\/)?webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(u.pathname)) return null;
    u.search = "?wait=true"; u.hash = ""; return u;
  } catch { return null; }
}
/** Per-instance abuse guard; configure a host/WAF rate limit for distributed deployments. */
export function createApplicationHandler(getWebhook: () => string | undefined, send: typeof fetch = fetch) {
  const attempts = new Map<string, { count: number; expires: number }>();
  return async (request: Request) => {
    const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
    const url = new URL(request.url);
    if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return reply("INVALID", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("INVALID", 415);
    const webhook = webhookUrl(getWebhook());
    if (!webhook) return reply("UNAVAILABLE", 503);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (!isIP(ip)) return reply("UNAVAILABLE", 503);
    const now = Date.now();
    for (const [key, v] of attempts) if (v.expires <= now) attempts.delete(key);
    const previous = attempts.get(ip);
    if ((previous?.count ?? 0) >= 3 || (!previous && attempts.size >= 5000)) return reply("RATE_LIMIT", 429);
    attempts.set(ip, { count: (previous?.count ?? 0) + 1, expires: previous?.expires ?? now + 900000 });
    let application: Application | null;
    try {
      const reader = request.body?.getReader(); if (!reader) return reply("INVALID", 400);
      const chunks: Uint8Array[] = []; let length = 0;
      while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 12000) { await reader.cancel(); return reply("INVALID", 413); } chunks.push(value); }
      application = validateApplication(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    } catch { return reply("INVALID", 400); }
    if (!application) return reply("INVALID", 400);
    const a = application;
    const reference = randomUUID();
    try {
      const response = await send(webhook, { method: "POST", redirect: "error", signal: AbortSignal.timeout(10000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allowed_mentions: { parse: [] }, embeds: [{ title: `${a.platform.toUpperCase()} rank application`, color: { youtube: 16711680, twitch: 9520895, tiktok: 2610154 }[a.platform], fields: [ ["Email", a.email], ["Minecraft", a.minecraft], ["Discord", a.discord], ["Channel", a.channel], ["Followers / subscribers", a.followers], ["Content & schedule", a.content], ["Why apply?", a.reason] ].map(([name, value]) => ({ name, value })), footer: { text: `Reference: ${reference} · Consent to review/contact provided` }, timestamp: new Date().toISOString() }] }) });
      if (!response.ok) return reply("DELIVERY_FAILED", 502);
      const receipt = await response.json();
      if (typeof receipt.id !== "string" || !/^\d+$/.test(receipt.id)) return reply("DELIVERY_FAILED", 502);
      return Response.json({ ok: true, reference }, { headers: { "Cache-Control": "no-store" } });
    } catch { return reply("DELIVERY_FAILED", 502); }
  };
}
