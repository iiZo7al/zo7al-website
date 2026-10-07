export type FaqItem = { id?: string; category: string; q: string; a: string; href?: string; action?: string };

export function normalizeFaqSearch(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").replace(/ـ/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").toLocaleLowerCase().trim();
}

export function filterFaqItems(items: FaqItem[], query: string, category = "all") {
  const terms = normalizeFaqSearch(query).split(/\s+/).filter(Boolean);
  return items.map((item, index) => ({ item, index })).filter(({ item }) => {
    if (category !== "all" && item.category !== category) return false;
    const content = normalizeFaqSearch(item.q + " " + item.a);
    return terms.every(term => content.includes(term));
  });
}

export function faqActionHref(value: unknown): string | null {
  return typeof value === "string" && /^\/(?!\/)[a-zA-Z0-9/?=#&:._+%-]*$/.test(value) ? value : null;
}
