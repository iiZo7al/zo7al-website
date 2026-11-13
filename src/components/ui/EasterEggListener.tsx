"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Blocks,
  Crown,
  Gamepad2,
  Gem,
  MoonStar,
  Orbit,
  Sparkles,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import {
  discoverEasterEgg,
  EASTER_EGG_DISCOVERED_EVENT,
  EASTER_EGGS,
  getDiscoveredEasterEggs,
  type EasterEggDefinition,
  type EasterEggId,
  type EasterEggRarity,
} from "@/lib/data/easter-eggs";

const KONAMI_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

function EggIcon({ id, size = 20 }: { id: EasterEggId; size?: number }) {
  switch (id) {
    case "saturn_nova":
      return <Orbit size={size} aria-hidden="true" />;
    case "creeper_boom":
      return <Blocks size={size} aria-hidden="true" />;
    case "diamond_ore":
      return <Gem size={size} aria-hidden="true" />;
    case "night_owl":
      return <MoonStar size={size} aria-hidden="true" />;
    case "solar_eclipse":
      return <Sun size={size} aria-hidden="true" />;
    case "footer_relic":
      return <Terminal size={size} aria-hidden="true" />;
    case "konami_code":
      return <Gamepad2 size={size} aria-hidden="true" />;
    case "master_collector":
      return <Crown size={size} aria-hidden="true" />;
    default:
      return <Sparkles size={size} aria-hidden="true" />;
  }
}

const RARITY_STYLES: Record<
  EasterEggRarity,
  { border: string; badgeBg: string; badgeText: string; labelAr: string; labelEn: string }
> = {
  common: {
    border: "rgba(148,163,184,0.35)",
    badgeBg: "rgba(148,163,184,0.14)",
    badgeText: "#cbd5e1",
    labelAr: "عادي",
    labelEn: "Common",
  },
  rare: {
    border: "rgba(56,189,248,0.45)",
    badgeBg: "rgba(56,189,248,0.14)",
    badgeText: "#7dd3fc",
    labelAr: "نادر",
    labelEn: "Rare",
  },
  epic: {
    border: "rgba(192,132,252,0.48)",
    badgeBg: "rgba(192,132,252,0.16)",
    badgeText: "#e9d5ff",
    labelAr: "ملحمي",
    labelEn: "Epic",
  },
  legendary: {
    border: "rgba(251,191,36,0.55)",
    badgeBg: "rgba(251,191,36,0.16)",
    badgeText: "#fde68a",
    labelAr: "أسطوري",
    labelEn: "Legendary",
  },
};

export default function EasterEggListener() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [toast, setToast] = useState<{
    egg: EasterEggDefinition;
    count: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const konamiIndexRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const expected = KONAMI_SEQUENCE[konamiIndexRef.current];
      if (key === expected) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current === KONAMI_SEQUENCE.length) {
          konamiIndexRef.current = 0;
          discoverEasterEgg("konami_code");
        }
      } else {
        konamiIndexRef.current = key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    };

    const handleDiscovered = (event: Event) => {
      const custom = event as CustomEvent<{ id?: EasterEggId }>;
      const id = custom.detail?.id;
      if (!id) return;
      const egg = EASTER_EGGS.find((e) => e.id === id);
      if (!egg) return;

      const count = Object.keys(getDiscoveredEasterEggs()).length;
      setToast({ egg, count });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, 6500);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(EASTER_EGG_DISCOVERED_EVENT, handleDiscovered);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(EASTER_EGG_DISCOVERED_EVENT, handleDiscovered);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const rarity = toast ? RARITY_STYLES[toast.egg.rarity] : null;

  return (
    <AnimatePresence>
      {toast && rarity && (
        <motion.aside
          key={toast.egg.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 end-5 z-[90] w-[min(370px,calc(100vw-2.5rem))] rounded-2xl border bg-[#0d1017]/95 p-4 shadow-2xl backdrop-blur-xl"
          style={{ borderColor: rarity.border }}
        >
          <div className="flex items-start gap-3.5">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ background: rarity.badgeBg, color: rarity.badgeText }}
            >
              <EggIcon id={toast.egg.id} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: rarity.badgeBg, color: rarity.badgeText }}
                >
                  {isArabic ? rarity.labelAr : rarity.labelEn}
                </span>
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  {toast.count} / {EASTER_EGGS.length}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                {isArabic
                  ? `تم اكتشاف سر: ${toast.egg.titleAr}`
                  : `Secret Unlocked: ${toast.egg.titleEn}`}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                {isArabic ? toast.egg.secretAr : toast.egg.secretEn}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href="/easter-eggs"
                  onClick={() => setToast(null)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: rarity.badgeBg, color: rarity.badgeText }}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  {isArabic ? "فتح خزنة الأسرار" : "Open Secret Vault"}
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label={isArabic ? "إغلاق الإشعار" : "Dismiss notification"}
              className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
