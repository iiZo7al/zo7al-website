"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE } from "@/i18n/config";
import { setLocaleCookie } from "@/lib/set-cookie";

export default function LanguageSwitcher({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectLocale = (next: string) => {
    setLocaleCookie(LOCALE_COOKIE, next);
    setOpen(false);
    router.refresh();
  };

  if (variant === "mobile") {
    return (
      <div className="px-4 py-3">
        <p className="text-label mb-3">{t("label")}</p>
        <div className="grid grid-cols-2 gap-2">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => selectLocale(loc)}
              data-cursor="link"
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: loc === locale ? "var(--accent)" : "var(--border)",
                color: loc === locale ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {LOCALE_LABELS[loc].native}
              {loc === locale && <Check size={14} strokeWidth={2.5} style={{ color: "var(--accent)" }} />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-cursor="link"
        aria-label={t("label")}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <Globe size={16} strokeWidth={2.5} />
        <span className="hidden lg:inline">{LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS]?.native}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute end-0 top-full mt-2 max-h-80 w-48 overflow-y-auto rounded-2xl border p-1.5"
            style={{
              background: "rgba(11,13,18,0.98)",
              borderColor: "var(--border)",
              backdropFilter: "blur(18px)",
            }}
          >
            {LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => selectLocale(loc)}
                data-cursor="link"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors"
                style={{
                  background: loc === locale ? "var(--surface-elevated)" : "transparent",
                  color: loc === locale ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {LOCALE_LABELS[loc].native}
                {loc === locale && <Check size={14} strokeWidth={2.5} style={{ color: "var(--accent)" }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
