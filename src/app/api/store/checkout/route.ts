import { createOrderReceipt } from "@/lib/server/site-content";
import { isIP } from "node:net";
import { getStoreCatalog, ownsStorePackage, tebexRequest, tebexToken, tebexPrivateKey, TebexConfigurationError, TebexRequestError } from "@/lib/server/tebex";
import { parseCartItems, isCoinProduct, isRankProduct } from "@/lib/data/store-cart";
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
  let body: { packageId?: number; packageIds?: number[]; items?: unknown; username?: string };
  try { const text = await request.text(); if (text.length > 1024) throw Error(); body = JSON.parse(text); if (!body || typeof body !== "object") throw Error(); }
  catch { return Response.json({ error: "INVALID" }, { status: 400 }); }
  const items = parseCartItems(body.items ?? (Array.isArray(body.packageIds) ? body.packageIds.map(packageId => ({ packageId, quantity: 1 })) : [{ packageId: body.packageId, quantity: 1 }]));
  if (!items?.length || typeof body.username !== "string" || !/^[.a-zA-Z0-9_ ]{3,32}$/.test(body.username.trim())) return Response.json({ error: "INVALID" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!isIP(ip)) return Response.json({ error: "UNAVAILABLE" }, { status: 503 });
  const now = Date.now();
  if (attempts.size > 5000) for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
  const recent = attempts.get(ip);
  if (recent && recent.expires > now && recent.count >= 8) return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": "60" } });
  attempts.set(ip, recent && recent.expires > now ? { ...recent, count: recent.count + 1 } : { count: 1, expires: now + 60000 });
  let stage = "CATALOG";
  let activePackageId: number | undefined;
  try {
    const catalog = await getStoreCatalog();
    if (!catalog.live) return Response.json({ error: "UNAVAILABLE" }, { status: 503 });
    const products = items.map(item => catalog.products.find(p => p.id === item.packageId && p.available));
    if (products.some(product => !product)) return Response.json({ error: "INVALID" }, { status: 400 });
    if (products.filter(product => isRankProduct(product!)).length > 1) return Response.json({ error: "ONE_RANK_ONLY" }, { status: 400 });
    if (products.some((product, index) => !isCoinProduct(product!) && items[index].quantity !== 1)) return Response.json({ error: "INVALID" }, { status: 400 });
    stage = "CREATE";
    const result = await tebexRequest(`accounts/${encodeURIComponent(token)}/baskets`, { username: body.username.trim(), ip_address: ip, complete_url: `${origin}/store?checkout=complete`, cancel_url: `${origin}/store`, complete_auto_redirect: false }, true);
    const ident = result.data?.ident;
    if (typeof ident !== "string" || !/^[a-zA-Z0-9_-]+$/.test(ident)) throw Error("INVALID_BASKET");
    for (const product of products) {
      if (product!.ownershipCheck !== false && await ownsStorePackage(result.data?.username_id, product!.id)) {
        return Response.json({ error: "ALREADY_OWNED", ...((body.packageIds || body.items) ? { packageId: product!.id } : {}) }, { status: 409, headers: { "Cache-Control": "no-store" } });
      }
    }
    // Rebuild the complete cart from validated IDs. Never trust client prices.
    // Do not expose a payable basket unless every requested item was added.
    stage = "PACKAGE";
    for (const product of products) {
      activePackageId = product!.id;
      await tebexRequest(`baskets/${encodeURIComponent(ident)}/packages`, { package_id: String(product!.id), quantity: items.find(item => item.packageId === product!.id)!.quantity });
    }
    const tracking = await createOrderReceipt(ident, body.username.trim(), items, products.map(product=>({id:product!.id,name:product!.name}))).catch(() => null);
    return Response.json({ ident, ...(tracking ? {tracking} : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Never expose upstream responses, usernames, basket identifiers or credentials.
    if (error instanceof TebexConfigurationError) return Response.json({ error: "CONFIGURATION" }, { status: 503 });
    if (stage === "PACKAGE" && error instanceof TebexRequestError && error.purchaseRestricted) {
      return Response.json({ error: "PURCHASE_RESTRICTED", ...((body.packageIds || body.items) ? { packageId: activePackageId } : {}) }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    const diagnostic = error instanceof TebexRequestError ? `${stage}_${error.status}` : `${stage}_FAILED`;
    console.warn("Tebex checkout failed", { diagnostic });
    return Response.json({ error: "UNAVAILABLE", diagnostic }, { status: 502 });
  }
}
