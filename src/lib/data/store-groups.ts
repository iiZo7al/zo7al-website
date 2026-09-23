import type { StoreProduct } from "../server/tebex";
export type StoreGroup = { id: number | string; name: string; image: string | null; products: StoreProduct[] };

/** Keep Tebex's group/package order; only the requested MVP++ placement is customized. */
export function groupStoreProducts(products: StoreProduct[], booster: StoreProduct): StoreGroup[] {
  const groups = new Map<number | string, StoreGroup>();
  for (const product of products) {
    const id = product.category?.id ?? "other";
    if (!groups.has(id)) groups.set(id, { id, name: product.category?.name ?? "", image: product.category?.image ?? null, products: [] });
    groups.get(id)!.products.push(product);
  }
  const ranks = [...groups.values()].find(group => group.products.some(product => product.id === 7312784) || /^(ranks?|الرتب)$/i.test(group.name.trim()));
  if (ranks) ranks.products.push(booster);
  else groups.set("discord", { id: "discord", name: "Discord", image: null, products: [booster] });
  for (const group of groups.values()) {
    const plusPlus = group.products.findIndex(product => product.name.trim().toUpperCase() === "MVP++");
    const plus = group.products.findIndex(product => product.id === 7312784 || product.name.trim().toUpperCase() === "MVP+");
    if (plusPlus > plus && plus >= 0) group.products.splice(plus, 0, group.products.splice(plusPlus, 1)[0]);
  }
  return [...groups.values()];
}
