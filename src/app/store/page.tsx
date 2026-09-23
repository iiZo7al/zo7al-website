import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ShieldCheck, Sparkles, Headphones, ArrowDown } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import PageHero from "@/components/ui/PageHero";
import Image from "next/image";
import StoreRanks from "@/components/store/StoreRanks";
import { getStoreCatalog } from "@/lib/server/tebex";
export const metadata: Metadata = { title: "Store — ZO7AL Projects", description: "Support the network and explore the official Zo7al store." };
export default async function StorePage() {
  const [t, catalog] = await Promise.all([getTranslations("store"), getStoreCatalog()]);
  return <main data-accent="store">
    <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}><div className="flex flex-wrap items-center gap-4"><Image src="/assets/site/server-logo.png" alt="Zo7al Network" width={56} height={56} className="me-2 object-contain" /><a href="#ranks" data-cursor="button" className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--bg)]">{t("browseRanks")}<ArrowDown size={16} /></a><Link href="/minecraft" data-cursor="link" className="rounded-full border border-[var(--border-strong)] px-7 py-3.5 text-sm font-semibold">{t("serverLink")}</Link></div></PageHero>
    <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-16 sm:grid-cols-3">{([['secure',ShieldCheck],['support',Sparkles],['help',Headphones]] as const).map(([key,Icon])=><Reveal key={key} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><Icon className="mt-1 shrink-0 text-[var(--accent)]" size={23}/><div><h2 className="font-semibold">{t(key+'Title')}</h2><p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{t(key+'Text')}</p></div></Reveal>)}</section>
    <section id="ranks" className="mx-auto max-w-[1600px] scroll-mt-28 px-6 pb-24"><Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="text-label text-[var(--accent)]">{t("ranksEyebrow")}</p><h2 className="mt-3 text-display text-4xl">{t("ranksTitle")}</h2></div><p className="max-w-sm text-sm text-[var(--text-muted)]">{t("checkoutNote")}</p></Reveal><StoreRanks products={catalog.products} live={catalog.live} /></section>
  </main>;
}
