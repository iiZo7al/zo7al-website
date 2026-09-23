import "server-only";
import { storeDescriptionText } from "./store-description";
export interface StoreProduct { id: number; name: string; price: number | null; currency: string; description: string; image: string | null; available: boolean; category?: { id: number; name: string; image: string | null }; ownershipCheck?: boolean; }
export function tebexToken() { return process.env.TEBEX_PUBLIC_TOKEN?.trim(); }
export function tebexPrivateKey() { return process.env.TEBEX_PRIVATE_KEY?.trim(); }
export class TebexConfigurationError extends Error {
  constructor() { super("TEBEX_CONFIGURATION"); }
}
export class TebexRequestError extends Error {
  constructor(public readonly status: number, public readonly purchaseRestricted = false) { super(`TEBEX_${status}`); }
}
export async function tebexRequest(path: string, body?: object, authenticated = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (authenticated) {
    const token = tebexToken(), privateKey = tebexPrivateKey();
    if (!token || !privateKey) throw new TebexConfigurationError();
    headers.Authorization = `Basic ${Buffer.from(`${token}:${privateKey}`).toString("base64")}`;
  }
  const response = await fetch(`https://headless.tebex.io/api/${path}`, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    if (authenticated && (response.status === 401 || response.status === 403)) throw new TebexConfigurationError();
    // Map only this known rejection; never forward arbitrary upstream text.
    const error = response.status === 400 ? await response.json().catch(() => null) : null;
    throw new TebexRequestError(response.status, error?.detail === "The product isn't purchasable");
  }
  return response.json();
}
function packageImage(pkg: { image?: unknown; media?: { type?: string; primary?: boolean; url?: unknown }[] }): string | null {
  const media = Array.isArray(pkg.media) ? pkg.media.filter(item => item.type === "image") : [];
  const value = media.find(item => item.primary)?.url ?? pkg.image ?? media[0]?.url;
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      (url.hostname.endsWith(".cloudfront.net") || url.hostname.endsWith(".tebex.io")) ? url.href : null;
  } catch { return null; }
}
export async function getStoreCatalog(): Promise<{ products: StoreProduct[]; live: boolean }> {
  const token = tebexToken();
  if (!token) return { products: [], live: false };
  try {
    const result = await tebexRequest(`accounts/${encodeURIComponent(token)}/categories?includePackages=1`);
    if (!Array.isArray(result.data)) throw Error("INVALID_CATALOG");
    const products: StoreProduct[] = [], seen = new Set<number>();
    const categories = [...result.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const category of categories) for (const pkg of [...(category.packages ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      if (!Number.isSafeInteger(pkg.id) || seen.has(pkg.id)) continue;
      seen.add(pkg.id);
      const rawPrice = pkg.total_price ?? pkg.base_price;
      const price = rawPrice == null ? null : Number(rawPrice);
      products.push({ id: pkg.id, name: String(pkg.name), price: price !== null && Number.isFinite(price) ? price : null,
        currency: /^[A-Z]{3}$/.test(pkg.currency) ? pkg.currency : "USD", description: storeDescriptionText(pkg.description),
        image: packageImage(pkg),
        category: { id: Number(category.id ?? pkg.category?.id ?? 0), name: String(category.name ?? pkg.category?.name ?? ""), image: packageImage({ image: category.image_url }) },
        ownershipCheck: pkg.user_limit === undefined && pkg.type === undefined ? undefined : pkg.type === "subscription" || (pkg.user_limit?.limit === 1 && pkg.user_limit?.period_length == null),
        available: !category.dynamic && !(pkg.variables?.length) });
    }
    return { products, live: true };
  } catch { return { products: [], live: false }; }
}

// Headless rejection alone does not prove ownership. Ask Tebex for active purchases.
// This is a separate game-server secret, never the Headless private key.
export async function ownsStorePackage(playerId: unknown, packageId: number): Promise<boolean | null> {
  const secret = process.env.TEBEX_PLUGIN_SECRET?.trim();
  if (!secret || typeof playerId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(playerId)) return null;
  try {
    const response = await fetch(`https://plugin.tebex.io/player/${encodeURIComponent(playerId)}/packages?package=${packageId}`, {
      headers: { "X-Tebex-Secret": secret, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const purchases = await response.json();
    if (!Array.isArray(purchases)) return null;
    return purchases.some(purchase => Number(purchase.package?.id) === packageId);
  } catch { return null; }
}
