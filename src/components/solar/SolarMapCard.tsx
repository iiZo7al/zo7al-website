"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import MarkdownContent from "@/components/ui/MarkdownContent";
import DetailsIcon from "@/components/ui/DetailsIcon";
import ShareButton from "@/components/ui/ShareButton";
import SolidIcon from "@/components/ui/SolidIcon";
import { flashCursor } from "@/components/cursor/CustomCursor";
import { SOLAR_CLAN_MAP } from "@/lib/data/solar";
import { solarCopy } from "@/lib/data/solar-copy";
import { solarExtraCopy } from "@/lib/data/solar-i18n";

export default function SolarMapCard() {
  const locale = useLocale();
  const t = solarCopy(locale);
  const tx = solarExtraCopy(locale);
  const map = SOLAR_CLAN_MAP;
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!detailsOpen) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [detailsOpen]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(map.code);
      setCopied(true);
      flashCursor(t.mapCopied, 1200);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op
    }
  };

  return (
    <>
      <div
        className="fortnite-map-card card-glow group h-full overflow-hidden rounded-[20px] border fortnite-map-spotlight"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <a
          href={map.url}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="image"
          className="fortnite-map-media relative block aspect-video overflow-hidden"
        >
          <Image
            src={map.thumbnail}
            alt={map.title}
            width={1280}
            height={720}
            priority
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(7,8,11,0.8), transparent 60%)",
            }}
          />
          <span className="fortnite-new-badge">{t.mapTitle}</span>
        </a>

        <div className="fortnite-map-content p-5">
          <p dir="auto" className="fortnite-map-title font-semibold">
            {map.title}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {tx.byZo7al}
          </p>
          <MarkdownContent className="fortnite-map-summary">
            {map.description}
          </MarkdownContent>
          <ul className="fortnite-map-tags" aria-label={tx.tagsLabel}>
            {map.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <code dir="ltr" className="text-xs text-[var(--text-muted)]">
              {map.code}
            </code>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyCode}
                data-cursor="copy"
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: copied ? "transparent" : "var(--border-strong)",
                  background: copied ? "var(--accent)" : "transparent",
                  color: copied ? "#07080B" : "var(--text)",
                }}
              >
                {copied ? t.mapCopied : tx.copyCode}
              </button>
              <button
                type="button"
                className="store-action store-details-button"
                onClick={() => setDetailsOpen(true)}
                aria-haspopup="dialog"
                aria-label={`${t.details} — ${map.title}`}
                title={t.details}
                data-cursor="button"
              >
                <DetailsIcon />
              </button>
              <ShareButton path="/fortnite?map=6387-4453-1682" />
            </div>
          </div>
        </div>
      </div>

      {/* Details Dialog identical to /fortnite */}
      <dialog
        ref={dialog}
        onCancel={() => setDetailsOpen(false)}
        onClose={() => setDetailsOpen(false)}
        aria-labelledby="clan-map-details-title"
        className="checkout-shell store-checkout"
      >
        <header className="store-checkout-header">
          <h2 id="clan-map-details-title" dir="auto" className="font-semibold">
            {map.title}
          </h2>
          <button
            type="button"
            className="store-close"
            onClick={() => setDetailsOpen(false)}
            aria-label={t.close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="store-checkout-body space-y-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={map.thumbnail}
              alt={map.title}
              className="aspect-video min-w-0 flex-1 rounded-xl object-cover"
            />
          </div>
          <div className="card-glow flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4">
            <div>
              <p className="mb-1 text-xs text-[var(--text-muted)]">
                {tx.islandCode}
              </p>
              <code dir="ltr">{map.code}</code>
            </div>
            <button
              type="button"
              className="store-action"
              onClick={copyCode}
            >
              {copied ? t.mapCopied : tx.copyCode}
            </button>
          </div>
          <MarkdownContent className="text-sm leading-7 text-[var(--text-muted)]">
            {map.description}
          </MarkdownContent>
          <div className="hub-actions">
            <ShareButton path="/fortnite?map=6387-4453-1682" />
            <span className="hub-muted">
              {tx.modeZoneWars}
            </span>
          </div>
          <ul aria-label={tx.tagsLabel} className="flex flex-wrap gap-2">
            {map.tags.map((tag) => (
              <li
                key={tag}
                dir="auto"
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
              >
                {tag}
              </li>
            ))}
          </ul>
          <a
            href={map.url}
            target="_blank"
            rel="noopener noreferrer"
            className="store-action"
          >
            {tx.playInFortnite}
            <SolidIcon name="arrow-up-right" size={16} />
          </a>
        </div>
      </dialog>
    </>
  );
}
