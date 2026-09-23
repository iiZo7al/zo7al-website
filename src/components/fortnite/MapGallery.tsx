"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { FortniteMap, islandCodeUrl } from "@/lib/data/fortnite";
import { flashCursor } from "@/components/cursor/CustomCursor";

import DetailsIcon from "@/components/ui/DetailsIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import MapMedia from "./MapMedia";
import "@/components/store/store.css";

export default function MapGallery({ maps: providedMaps }: { maps: FortniteMap[] }) {
  const locale = useLocale();
  const store = useTranslations("store");
  const t = useTranslations("fortnite"), tc = useTranslations("common"), ui = useTranslations("ui");
  const categoryLabel = (cat: string) => cat === "All" ? tc("all") : ui.has(`cat_${cat.replace(/\W/g, "")}`) ? ui(`cat_${cat.replace(/\W/g, "")}`) : cat;
  const maps = providedMaps;
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(maps.map((m) => m.category)))],
    [maps]
  );
  const [details, setDetails] = useState<FortniteMap | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!details) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [details]);
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
              onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(map.id); }}
              onPointerLeave={() => setHovered(null)}
              className="group h-full overflow-hidden rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <a
                href={islandCodeUrl(map.code, locale)}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="image"
                className="relative block aspect-video overflow-hidden"
              >
                <MapMedia map={map} active={hovered === map.id && !details} />
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
                <p dir="auto" className="font-semibold">{map.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{t("byZo7al")}</p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <code dir="ltr" className="text-xs text-[var(--text-muted)]">{map.code}</code>
                  <div className="flex shrink-0 items-center gap-2">
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
                  <button type="button" className="store-action store-details-button" onClick={() => setDetails(map)} aria-haspopup="dialog" aria-label={`${store("details")} — ${map.title}`} title={store("details")} data-cursor="button"><DetailsIcon /></button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <dialog ref={dialog} onCancel={() => setDetails(null)} onClose={() => setDetails(null)} aria-labelledby="map-details-title" className="checkout-shell store-checkout">
        {details && <>
          <header className="store-checkout-header">
            <h2 id="map-details-title" dir="auto" className="font-semibold">{details.title}</h2>
            <button type="button" className="store-close" onClick={() => setDetails(null)} aria-label={store("close")}><span aria-hidden="true">×</span></button>
          </header>
          <div className="store-checkout-body space-y-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={details.thumbnail} alt={details.title} className="aspect-video min-w-0 flex-1 rounded-xl object-cover" />
              {details.videoUrl && <a href={details.videoUrl} target="_blank" rel="noopener noreferrer" className="store-action store-details-button" aria-label={t("watchVideo")} title={t("watchVideo")}><SolidIcon name="arrow-up-right" size={20} /></a>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4">
              <div><p className="mb-1 text-xs text-[var(--text-muted)]">{t("islandCode")}</p><code dir="ltr">{details.code}</code></div>
              <button type="button" className="store-action" onClick={() => copyCode(details.id, details.code)}>{t(copiedId === details.id ? "copied" : "copyCode")}</button>
            </div>
            <p dir="auto" className="whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]">{details.description || t("detailsUnavailable")}</p>
            {!!details.tags?.length && <ul aria-label={t("tags")} className="flex flex-wrap gap-2">{details.tags.map(tag => <li key={tag} dir="auto" className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">{tag}</li>)}</ul>}
            <a href={islandCodeUrl(details.code, locale)} target="_blank" rel="noopener noreferrer" className="store-action">{t("viewOnFortnite")}<SolidIcon name="arrow-up-right" size={16} /></a>
          </div>
        </>}
      </dialog>
    </div>
  );
}

