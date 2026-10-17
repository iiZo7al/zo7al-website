"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { hasFoundFirstEasterEgg } from "@/lib/data/easter-eggs";

export default function EasterEggsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);\n  const [foundCreeper, setFoundCreeper] = useState(false);
  const isArabic = locale === "ar";

  useEffect(() => {
    const found = hasFoundFirstEasterEgg();
    setUnlocked(found);
    setChecked(true);
    if (!found) router.replace("/");
  }, [router]);

  if (!checked || !unlocked) return null;

  return (
    <main data-accent="home" className="min-h-[70dvh] px-6 pb-24 pt-36 sm:pt-44">
      <div className="mx-auto max-w-[980px]">
        <p className="text-label mb-4">ZO7AL PROJECTS · SECRET ARCHIVE</p>
        <h1 className="text-display text-5xl sm:text-7xl">
          {isArabic ? "الأسرار المخفية" : "Easter Eggs"}
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
          {isArabic ? "اكتشفت أول سر. كل ما تعثر على سر جديد بتلقاه محفوظ هنا." : "You found the first secret. Every new discovery will be collected here."}
        </p>
        <article className="card-glow mt-12 flex items-center gap-5 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-8">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ color: "var(--accent)", background: "var(--glow)" }}>
            <Sparkles size={27} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label mb-2">{isArabic ? "السر الأول" : "FIRST DISCOVERY"}</p>
            <h2 className="text-xl font-semibold">{isArabic ? "انفجار زحل" : "Saturn's explosion"}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{isArabic ? "أدخلت تسلسلًا سريًا واكتشفت أول سر." : "You entered a hidden sequence and found the first secret."}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs text-[var(--text-muted)]">1 / {foundCreeper ? 2 : 1}</span>
        </article>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
          {isArabic ? "العودة للرئيسية" : "Back to home"}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
