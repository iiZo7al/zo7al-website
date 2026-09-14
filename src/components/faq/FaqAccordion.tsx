"use client";

import { useId, useMemo, useState } from "react";
import { Search, ChevronDown, MessageCircleQuestion } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export type FaqItem = { category: string; q: string; a: string };

export default function FaqAccordion({
  items,
  categories,
  searchPlaceholder,
  noResults,
  allLabel,
}: {
  items: FaqItem[];
  categories: Record<string, string>;
  searchPlaceholder: string;
  noResults: string;
  allLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openKeys, setOpenKeys] = useState<Set<number>>(new Set([0]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => activeCategory === "all" || item.category === activeCategory)
      .filter(
        ({ item }) =>
          !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      );
  }, [items, query, activeCategory]);

  const toggle = (index: number) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={17}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-2xl border py-4 ps-11 pe-4 text-[15px] outline-none transition-colors focus:border-[var(--accent-secondary)]"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      </div>

      {/* Category filters */}
      <div className="mb-10 flex flex-wrap gap-2">
        <button
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
        {Object.entries(categories).map(([key, label]) => (
          <button
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
          className="flex flex-col items-center gap-3 rounded-2xl border py-16 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <MessageCircleQuestion size={28} className="text-[var(--text-muted)]" aria-hidden="true" />
          <p className="text-[var(--text-muted)]">{noResults}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ item, index }, i) => (
            <Reveal key={index} delay={Math.min(i, 8) * 0.03}>
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
      className="group overflow-hidden rounded-2xl border transition-colors"
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
          className="shrink-0 text-[var(--text-muted)] transition-transform duration-300 motion-reduce:transition-none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
        </div>
      </div>
    </div>
  );
}
