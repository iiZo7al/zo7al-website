import "server-only";
import { STORE_RANKS } from "@/lib/data/store";
export interface StoreProduct { id: number; name: string; price: number | null; currency: string; description: string; rankId?: string; available: boolean; }
export function tebexToken() { return process.env.TEBEX_PUBLIC_TOKEN?.trim(); }
export function tebexPrivateKey() { return process.env.TEBEX_PRIVATE_KEY?.trim(); }
export class TebexConfigurationError extends Error {
  constructor() { super("TEBEX_CONFIGURATION"); }
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
    throw new Error(`TEBEX_${response.status}`);
  }
  return response.json();
}
export async function getStoreCatalog(): Promise<{ products: StoreProduct[]; live: boolean }> {
  const fallback = STORE_RANKS.map(rank => ({ id: Number(rank.url.split('/').pop()), name: rank.name, price: null, currency: "USD", description: "", rankId: rank.id, available: false }));
  const token = tebexToken();
  if (!token) return { products: fallback, live: false };
  try {
    const result = await tebexRequest(`accounts/${encodeURIComponent(token)}/categories?includePackages=1`);
    const products: StoreProduct[] = [], seen = new Set<number>();
    for (const category of result.data ?? []) for (const pkg of category.packages ?? []) {
      if (!Number.isSafeInteger(pkg.id) || seen.has(pkg.id)) continue;
      seen.add(pkg.id);
      const known = fallback.find(p => p.id === pkg.id);
      const price = Number(pkg.total_price ?? pkg.base_price);
      products.push({ id: pkg.id, name: String(pkg.name), price: Number.isFinite(price) ? price : null, currency: /^[A-Z]{3}$/.test(pkg.currency) ? pkg.currency : "USD", description: String(pkg.description ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").slice(0, 1200), rankId: known?.rankId, available: !category.dynamic && !(pkg.variables?.length) });
    }
    return { products, live: true };
  } catch { return { products: fallback, live: false }; }
}
