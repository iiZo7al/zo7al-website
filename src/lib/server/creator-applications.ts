import { isIP } from "node:net";
import { randomUUID } from "node:crypto";

export type Application = { platform: string; email: string; minecraft: string; discord: string; channel: string; followers: string; content: string; reason: string; consent: boolean; website?: string };
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
export type ApplicationStore = { save: (application: Application, reference: string) => Promise<{ token: string }>; delivered: (reference: string, receipt: string) => Promise<void>; discard: (reference: string) => Promise<void> };
export function createApplicationHandler(getWebhook: () => string | undefined, send: typeof fetch = fetch, storage?: ApplicationStore) {
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
    let token: string | undefined;
    try {
      if (storage) token = (await storage.save(a, reference)).token;
      const response = await send(webhook, { method: "POST", redirect: "error", signal: AbortSignal.timeout(10000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        username: "Zo7al Network • Applications",
        allowed_mentions: { parse: [] },
        embeds: [{
          author: { name: "Zo7al Network · Creator Applications", url: "https://zo7al.is-a.dev/store" },
          title: `${{ youtube: "🎥 YouTube", twitch: "🟣 Twitch", tiktok: "🎵 TikTok" }[a.platform]} Rank Application`,
          description: "**🕓 Pending review**\nA new creator has applied. Review their channel and application below.",
          color: { youtube: 0xff4545, twitch: 0xa970ff, tiktok: 0x25f4ee }[a.platform],
          thumbnail: { url: "https://zo7al.is-a.dev/assets/site/server-logo.png" },
          image: { url: `https://zo7al.is-a.dev/assets/site/rank-${a.platform}.png` },
          fields: [
            { name: "🎮 Minecraft", value: a.minecraft, inline: true },
            { name: "💬 Discord", value: a.discord, inline: true },
            { name: "👥 Followers / Subscribers", value: Number(a.followers).toLocaleString("en-US"), inline: true },
            { name: "✉️ Contact Email", value: a.email },
            { name: "🔗 Creator Channel", value: a.channel },
            { name: "🎬 Content & Schedule", value: a.content },
            { name: "📝 Why They Want to Join", value: a.reason },
            { name: "📋 Review Information", value: "Free rank · Manual review required\nApplicant consented to review and contact. Acceptance is not guaranteed." },
          ],
          footer: { text: `Zo7al Network • Reference: ${reference}` },
          timestamp: new Date().toISOString(),
        }],
      }) });
      if (!response.ok) throw new Error("DELIVERY_FAILED");
      const receipt = await response.json();
      if (typeof receipt.id !== "string" || !/^\d+$/.test(receipt.id)) throw new Error("DELIVERY_FAILED");
      if (storage) await storage.delivered(reference, receipt.id).catch(() => {});
      return Response.json({ ok: true, reference, ...(token ? { token } : {}) }, { headers: { "Cache-Control": "no-store" } });
    } catch { if (storage) await storage.discard(reference).catch(() => {}); return reply("DELIVERY_FAILED", 502); }
  };
}
