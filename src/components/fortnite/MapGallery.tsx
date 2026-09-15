"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { FortniteMap, islandCodeUrl } from "@/lib/data/fortnite";
import { flashCursor } from "@/components/cursor/CustomCursor";

export default function MapGallery({ maps: providedMaps }: { maps: FortniteMap[] }) {
  const t = useTranslations("fortnite"), tc = useTranslations("common"), ui = useTranslations("ui");
  const categoryLabel = (cat: string) => cat === "All" ? tc("all") : ui.has(`cat_${cat.replace(/\W/g, "")}`) ? ui(`cat_${cat.replace(/\W/g, "")}`) : cat;
  const maps = providedMaps;
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(maps.map((m) => m.category)))],
    [maps]
  );
  const [active, setActive] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMaps = active === "All" ? maps : maps.filter((m) => m.category === active);

  const copyCode = async (id: string, code: string) => {

    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      flashCursor(t("copied"), 1100);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1400);
    } catch {
      // no-op — code remains visible to copy manually
    }
  };

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={categoryLabel(cat)}
            onClick={() => setActive(cat)}
            data-cursor="link"
            className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: active === cat ? "transparent" : "var(--border)",
              background: active === cat ? "var(--accent)" : "transparent",
              color: active === cat ? "#07080B" : "var(--text-muted)",
            }}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaps.map((map, i) => (
          <Reveal key={map.id} delay={i * 0.04}>
            <div
              className="group overflow-hidden rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <a
                href={islandCodeUrl(map.code)}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="image"
                className="relative block aspect-video overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={map.thumbnail}
                  alt={map.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(7,8,11,0.8), transparent 60%)" }}
                />
                <span
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(7,8,11,0.6)", color: "var(--accent-secondary)" }}
                >
                  {categoryLabel(map.category)}
                </span>
              </a>

              <div className="p-5">
                <p className="font-semibold">{map.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{t("byZo7al")}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <code className="text-xs text-[var(--text-muted)]">{map.code}</code>
                  <button
                    type="button"
                    onClick={() => copyCode(map.id, map.code)}
                    data-cursor="copy"
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: copiedId === map.id ? "transparent" : "var(--border-strong)",
                      background: copiedId === map.id ? "var(--accent)" : "transparent",
                      color: copiedId === map.id ? "#07080B" : "var(--text)",
                    }}
                  >
                    {t(copiedId === map.id ? "copied" : "copyCode")}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

