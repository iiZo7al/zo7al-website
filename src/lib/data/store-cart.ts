import type { StoreProduct } from "../server/tebex";
export type CartItem = { packageId: number; quantity: number };
export const MAX_CART_ITEMS = 20;
export const MAX_COIN_QUANTITY = 99;
export function parseCartItems(value: unknown): CartItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_CART_ITEMS) return null;
  const result: CartItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !Number.isSafeInteger(item.packageId) || item.packageId <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_COIN_QUANTITY || result.some(entry => entry.packageId === item.packageId)) return null;
    result.push({ packageId: item.packageId, quantity: item.quantity });
  }
  return result;
}
export function isCoinProduct(product: StoreProduct) {
  return /coins?|عملات/i.test(product.category?.name ?? "") || /coins?|عملات/i.test(product.name);
}
export function isRankProduct(product: StoreProduct) {
  return !isCoinProduct(product) && (/ranks?|رتب/i.test(product.category?.name ?? "") || /^(?:VIP|MVP)(?:\+)*$/i.test(product.name.trim()) || /\brank\b|رتبة/i.test(product.name));
}
