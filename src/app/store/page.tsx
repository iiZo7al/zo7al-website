import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ShieldCheck, Sparkles, Headphones, ArrowDown } from "lucide-react";
import ServerHero from "@/components/ui/ServerHero";
import StoreRanks from "@/components/store/StoreRanks";
import { getStoreCatalog } from "@/lib/server/tebex";
export const metadata: Metadata = { title: "Store — ZO7AL Projects", description: "Support the network and explore the official Zo7al store." };
export default async function StorePage() {
  const [t, catalog] = await Promise.all([getTranslations("store"), getStoreCatalog()]);
  return <main data-accent="store">
    <ServerHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}><a href="#ranks" data-cursor="button" className="flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 font-semibold text-black">{t("browseRanks")}<ArrowDown size={16} /></a><Link href="/minecraft" data-cursor="link" className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold">{t("serverLink")}</Link></ServerHero>
    <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-16 sm:grid-cols-3">{([['secure',ShieldCheck],['support',Sparkles],['help',Headphones]] as const).map(([key,Icon])=><div key={key} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"><Icon className="mt-1 shrink-0 text-orange-400" size={23}/><div><h2 className="font-semibold">{t(key+'Title')}</h2><p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{t(key+'Text')}</p></div></div>)}</section>
    <section id="ranks" className="mx-auto max-w-[1180px] scroll-mt-28 px-6 pb-24"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="text-label text-orange-400">{t("ranksEyebrow")}</p><h2 className="mt-3 text-4xl font-bold">{t("ranksTitle")}</h2></div><p className="max-w-sm text-sm text-[var(--text-muted)]">{t("checkoutNote")}</p></div><StoreRanks products={catalog.products} live={catalog.live} /></section>
  </main>;
}
