import { isIP } from "node:net";
import { getStoreCatalog, tebexRequest, tebexToken, tebexPrivateKey, TebexConfigurationError, TebexRequestError } from "@/lib/server/tebex";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; expires: number }>();
export async function POST(request: Request) {
  // Next may use its internal hostname in request.url behind a reverse proxy.
  // Host is the public authority; browsers cannot override it for a cross-site POST.
  const url = new URL(request.url);
  const origin = `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "ORIGIN" }, { status: 403 });
  const token = tebexToken();
  if (!token || !tebexPrivateKey()) return Response.json({ error: "CONFIGURATION" }, { status: 503 });
  let body: { packageId?: number; username?: string };
  try { const text = await request.text(); if (text.length > 1024) throw Error(); body = JSON.parse(text); if (!body || typeof body !== "object") throw Error(); }
  catch { return Response.json({ error: "INVALID" }, { status: 400 }); }
  if (!Number.isSafeInteger(body.packageId) || typeof body.username !== "string" || !/^[.a-zA-Z0-9_ ]{3,32}$/.test(body.username.trim())) return Response.json({ error: "INVALID" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!isIP(ip)) return Response.json({ error: "UNAVAILABLE" }, { status: 503 });
  const now = Date.now();
  if (attempts.size > 5000) for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
  const recent = attempts.get(ip);
  if (recent && recent.expires > now && recent.count >= 8) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": "60" } });
  attempts.set(ip, recent && recent.expires > now ? { ...recent, count: recent.count + 1 } : { count: 1, expires: now + 60000 });
  let stage = "CATALOG";
  try {
    const catalog = await getStoreCatalog();
    if (!catalog.live) return Response.json({ error: "UNAVAILABLE" }, { status: 503 });
    if (!catalog.products.some(p => p.id === body.packageId && p.available)) return Response.json({ error: "INVALID" }, { status: 400 });
    stage = "CREATE";
    const result = await tebexRequest(`accounts/${encodeURIComponent(token)}/baskets`, { username: body.username.trim(), ip_address: ip, complete_url: `${origin}/store`, cancel_url: `${origin}/store`, complete_auto_redirect: false }, true);
    const ident = result.data?.ident;
    if (typeof ident !== "string" || !/^[a-zA-Z0-9_-]+$/.test(ident)) throw Error("INVALID_BASKET");
    // Only package ID and quantity are sent. Price and fulfillment belong to Tebex.
    stage = "PACKAGE";
    await tebexRequest(`baskets/${encodeURIComponent(ident)}/packages`, { package_id: String(body.packageId), quantity: 1 });
    return Response.json({ ident }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Never expose upstream responses, usernames, basket identifiers or credentials.
    if (error instanceof TebexConfigurationError) return Response.json({ error: "CONFIGURATION" }, { status: 503 });
    const diagnostic = error instanceof TebexRequestError ? `${stage}_${error.status}` : `${stage}_FAILED`;
    console.warn("Tebex checkout failed", { diagnostic });
    return Response.json({ error: "UNAVAILABLE", diagnostic }, { status: 502 });
  }
}
