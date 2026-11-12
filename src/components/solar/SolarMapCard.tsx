"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import MarkdownContent from "@/components/ui/MarkdownContent";
import DetailsIcon from "@/components/ui/DetailsIcon";
import ShareButton from "@/components/ui/ShareButton";
import SolidIcon from "@/components/ui/SolidIcon";
import { flashCursor } from "@/components/cursor/CustomCursor";
import { SOLAR_CLAN_MAP } from "@/lib/data/solar";
import "@/components/fortnite/fortnite.css";

export default function SolarMapCard() {
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
      flashCursor("تم نسخ الكود!", 1200);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  };

  return (
    <div id="clan-map" className="relative">
      <div
        className="fortnite-map-card card-glow group h-full overflow-hidden rounded-2xl border fortnite-map-spotlight"
        style={{
          background: "var(--solar-card)",
          borderColor: "var(--solar-border)",
        }}
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
              background:
                "linear-gradient(to top, rgba(7,8,11,0.85) 0%, transparent 60%)",
            }}
          />
          <span
            className="absolute start-4 top-4 rounded-full px-3.5 py-1 text-xs font-bold"
            style={{
              background: "rgba(15,14,12,0.8)",
              color: "#fbbf24",
              border: "1px solid var(--solar-border)",
            }}
          >
            {map.category}
          </span>
          <span
            className="absolute end-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: "var(--solar-accent)",
              color: "#07080b",
            }}
          >
            ماب الكلان الرسمي 🏆
          </span>
        </a>

        <div className="fortnite-map-content p-6 sm:p-8" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="fortnite-map-title text-xl sm:text-2xl font-bold text-white">
                {map.title}
              </h3>
              <p className="mt-1 text-xs text-amber-400 font-medium">
                صُنع خصيصاً لكلان Solar بواسطة زحل Zo7al 🚀
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code
                dir="ltr"
                className="rounded-lg bg-black/40 border border-[var(--solar-border)] px-3 py-1 text-sm font-bold text-amber-300"
              >
                {map.code}
              </code>
            </div>
          </div>

          <div className="mt-4">
            <MarkdownContent className="text-sm leading-relaxed text-[var(--text-muted)] line-clamp-3">
              {map.description}
            </MarkdownContent>
          </div>

          <ul
            aria-label="وسوم الماب"
            className="mt-5 flex flex-wrap gap-2"
          >
            {map.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--border)] bg-black/30 px-3 py-1 text-xs font-medium text-[var(--text-muted)]"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={copyCode}
                data-cursor="copy"
                className="rounded-full border px-4 py-2 text-xs sm:text-sm font-bold transition-all"
                style={{
                  borderColor: copied
                    ? "transparent"
                    : "var(--solar-border)",
                  background: copied ? "var(--solar-accent)" : "rgba(245,158,11,0.1)",
                  color: copied ? "#07080B" : "#fbbf24",
                }}
              >
                {copied ? "تم نسخ كود الماب! ✓" : "نسخ كود الماب 📋"}
              </button>

              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="store-action store-details-button"
                aria-haspopup="dialog"
                aria-label={`تفاصيل ${map.title}`}
                title="عرض تفاصيل الماب"
                data-cursor="button"
              >
                <DetailsIcon />
              </button>

              <ShareButton path="/solar#clan-map" />
            </div>

            <a
              href={map.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-bold text-[#07080B] transition-transform hover:scale-105"
              style={{ background: "var(--solar-accent)" }}
            >
              العب الآن في فورتنايت
              <SolidIcon name="arrow-up-right" size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Details Dialog Modal */}
      <dialog
        ref={dialog}
        onCancel={() => setDetailsOpen(false)}
        onClose={() => setDetailsOpen(false)}
        aria-labelledby="clan-map-details-title"
        className="checkout-shell store-checkout"
        dir="rtl"
      >
        {detailsOpen && (
          <>
            <header className="store-checkout-header">
              <h2
                id="clan-map-details-title"
                className="text-lg font-bold text-white"
              >
                {map.title}
              </h2>
              <button
                type="button"
                className="store-close"
                onClick={() => setDetailsOpen(false)}
                aria-label="إغلاق"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className="store-checkout-body space-y-6 text-right">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border)]">
                <Image
                  src={map.thumbnail}
                  alt={map.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="card-glow flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--solar-border)] bg-black/40 p-4">
                <div>
                  <p className="mb-1 text-xs text-[var(--text-muted)]">
                    كود الجزيرة في فورتنايت (Island Code)
                  </p>
                  <code dir="ltr" className="text-base font-bold text-amber-300">
                    {map.code}
                  </code>
                </div>
                <button
                  type="button"
                  className="solar-btn-primary py-2 px-4 text-xs"
                  onClick={copyCode}
                >
                  {copied ? "تم النسخ ✓" : "نسخ الكود"}
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">وصف الماب:</h4>
                <MarkdownContent className="text-sm leading-7 text-[var(--text-muted)]">
                  {map.description}
                </MarkdownContent>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">الوسوم:</h4>
                <ul className="flex flex-wrap gap-2">
                  {map.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-[var(--solar-border)] bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
                <ShareButton path="/solar#clan-map" />
                <a
                  href={map.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="solar-btn-primary"
                >
                  فتح صفحة الماب على Epic Games
                  <SolidIcon name="arrow-up-right" size={16} />
                </a>
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
