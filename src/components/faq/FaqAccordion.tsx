"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, ChevronDown, MessageCircleQuestion, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { filterFaqItems, faqActionHref, type FaqItem } from "@/lib/data/faq";
import Reveal from "@/components/ui/Reveal";

export type { FaqItem } from "@/lib/data/faq";

export default function FaqAccordion({
  items,
  categories,
  searchPlaceholder,
  noResults,
  allLabel,
  initiallyOpen = true,
}: {
  items: FaqItem[];
  categories: Record<string, string>;
  searchPlaceholder: string;
  noResults: string;
  allLabel: string;
  initiallyOpen?: boolean;
}) {
  const t = useTranslations("faq");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openKeys, setOpenKeys] = useState<Set<number>>(new Set(initiallyOpen ? [0] : []));

  const filtered = useMemo(() => filterFaqItems(items, query, activeCategory), [items, query, activeCategory]);
  const visibleCategories = Object.entries(categories).filter(([key]) => items.some(item => item.category === key));

  const toggle = (index: number) => {
    setOpenKeys((prev) => {
      if (prev.has(index)) return new Set();
      return new Set([index]);
    });
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={17}
          strokeWidth={2.5}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-2xl border py-4 ps-11 pe-12 text-[15px] outline-none transition-colors focus:border-[var(--accent-secondary)]"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        />
        {query && <button type="button" className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--accent)]" aria-label={t("clearSearch")} data-cursor="button" onClick={() => setQuery("")}><X size={16} aria-hidden="true" /></button>}
      </div>

      {/* Category filters */}
      <div className="mb-10 flex flex-wrap justify-center gap-2" role="group" aria-label={t("filterLabel")}>
        <button
          type="button"
          aria-pressed={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          data-cursor="link"
          className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
          style={{
            borderColor: activeCategory === "all" ? "transparent" : "var(--border)",
            background: activeCategory === "all" ? "var(--accent)" : "transparent",
            color: activeCategory === "all" ? "#07080B" : "var(--text-muted)",
          }}
        >
          {allLabel}
        </button>
        {visibleCategories.map(([key, label]) => (
          <button
            type="button"
            aria-pressed={activeCategory === key}
            key={key}
            onClick={() => setActiveCategory(key)}
            data-cursor="link"
            className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: activeCategory === key ? "transparent" : "var(--border)",
              background: activeCategory === key ? "var(--accent)" : "transparent",
              color: activeCategory === key ? "#07080B" : "var(--text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div
          className="card-glow flex flex-col items-center gap-3 rounded-2xl border py-16 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <MessageCircleQuestion size={28} strokeWidth={2.5} className="text-[var(--text-muted)]" aria-hidden="true" />
          <p className="text-[var(--text-muted)]">{noResults}</p>
          <button type="button" className="mt-2 rounded-full border px-5 py-2 text-sm text-[var(--accent)]" style={{ borderColor: "var(--border)" }} data-cursor="button" onClick={() => { setQuery(""); setActiveCategory("all"); }}>{t("resetFilters")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ item, index }, i) => (
            <Reveal key={item.id ?? index} delay={Math.min(i, 8) * 0.03}>
              <FaqRow
                item={item}
                open={openKeys.has(index)}
                onToggle={() => toggle(index)}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();

  return (
    <div
      className="card-glow group overflow-hidden rounded-2xl border transition-colors"
      style={{
        background: "var(--surface)",
        borderColor: open ? "var(--accent)" : "var(--border)",
        boxShadow: open ? "0 0 30px var(--glow)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-button`}
        data-cursor="link"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className="font-semibold" style={{ color: open ? "var(--accent)" : "var(--text)" }}>
          {item.q}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className="shrink-0 text-[var(--text-muted)] transition-transform duration-300 motion-reduce:transition-none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-hidden={!open}
        aria-labelledby={`${id}-button`}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5"><p className="text-sm leading-relaxed text-[var(--text-muted)]" dir="auto">{item.a}</p>{faqActionHref(item.href) && item.action && <Link href={faqActionHref(item.href)!} tabIndex={open ? 0 : -1} className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--accent)]" style={{ borderColor: "var(--border)" }} data-cursor="link">{item.action}<ArrowUpRight size={15} className="shrink-0 rtl:-scale-x-100" aria-hidden="true" /></Link>}</div>
        </div>
      </div>
    </div>
  );
}
