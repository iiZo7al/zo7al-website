"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles, Stars } from "lucide-react";
import { motion } from "framer-motion";
import { EASTER_EGG_CHANGE_EVENT, hasFoundFirstEasterEgg } from "@/lib/data/easter-eggs";

export default function EasterEggsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const isArabic = locale === "ar";

  useEffect(() => {
    const update = () => {
      const found = hasFoundFirstEasterEgg();
      setUnlocked(found);
      setChecked(true);
      if (!found) router.replace("/");
    };
    update();
    window.addEventListener(EASTER_EGG_CHANGE_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EASTER_EGG_CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [router]);

  if (!checked || !unlocked) return null;

  return (
    <main data-accent="home" className="relative isolate min-h-[75dvh] overflow-hidden px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-5xl opacity-50" style={{ background: "radial-gradient(ellipse at 50% 0%, var(--glow), transparent 68%)" }} />
      <div className="mx-auto max-w-[980px]">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-[var(--accent)]">
            <Stars size={14} aria-hidden="true" />
            <span>ZO7AL PROJECTS · {isArabic ? "أرشيف الأسرار" : "SECRET ARCHIVE"}</span>
          </div>
          <h1 className="text-display text-5xl sm:text-7xl">
            {isArabic ? "الأسرار المخفية" : "Easter Eggs"}
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
            {isArabic ? "مكان يجمع الأسرار التي تكتشفها في الموقع. استمر بالاستكشاف، فقد يكون هناك المزيد." : "A collection of the secrets you discover across the site. Keep exploring; there may be more."}
          </p>
        </motion.header>

        <section aria-label={isArabic ? "الأسرار المكتشفة" : "Discovered secrets"} className="mt-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-label">{isArabic ? "مكتشفاتك" : "YOUR DISCOVERIES"}</p>
            <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
              01 <span className="mx-1 text-[var(--accent)]">/</span> 01
            </span>
          </div>

          <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }} className="card-glow group relative overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50" style={{ background: "var(--glow)" }} />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[var(--border-strong)]" style={{ color: "var(--accent)", background: "var(--glow)" }}>
                <Sparkles size={29} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="text-label">{isArabic ? "السر الأول" : "FIRST DISCOVERY"}</p>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)", background: "var(--glow)" }}>{isArabic ? "تم الاكتشاف" : "Discovered"}</span>
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">{isArabic ? "انفجار زحل" : "Saturn's explosion"}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                  {isArabic ? "أدخلت التسلسل السري واكتشفت ما يخفيه زحل." : "You entered the hidden sequence and uncovered Saturn's secret."}
                </p>
              </div>
              <div className="hidden h-24 w-px shrink-0 bg-[var(--border-strong)] sm:block" />
              <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-strong)] text-[var(--accent)]">01</span>
                <span>{isArabic ? "سر مكتشف" : "Secret found"}</span>
              </div>
            </div>
          </motion.article>
        </section>

        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]">
          {isArabic ? "العودة للرئيسية" : "Back to home"}
          {isArabic ? <ArrowLeft size={15} aria-hidden="true" /> : <ArrowUpRight size={15} aria-hidden="true" />}
        </Link>
      </div>
    </main>
  );
}
