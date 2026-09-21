"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Check, ShieldCheck, Crown, Gem, X, ArrowRight } from "lucide-react";
import type { StoreProduct } from "@/lib/server/tebex";
import { STORE_RANKS } from "@/lib/data/store";

type CheckoutSdk = { init: (options: { ident: string; theme: string; locale: string; colors: {name: string; color: string}[] }) => void; render: (element: HTMLElement, width: number, height: number, newTab: boolean) => void; };
declare global { interface Window { Tebex?: { checkout: CheckoutSdk } } }
const locales: Record<string,string> = { en:"en_US", ar:"ar_SA", es:"es_ES", fr:"fr_FR", de:"de_DE", pt:"pt_BR", tr:"tr_TR", ja:"ja_JP", ko:"ko_KR", zh:"zh_CN" };
export default function StoreRanks({ products, live }: { products: StoreProduct[]; live: boolean }) {
  const t = useTranslations("store"), ui = useTranslations("ui"), locale = useLocale();
  const [selected, setSelected] = useState<StoreProduct | null>(null), [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(false), [ident, setIdent] = useState("");
  const [sdkReady, setSdkReady] = useState(false), [sdkError, setSdkError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), embed = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!ident || !sdkReady || !embed.current || !window.Tebex) return;
    const element = embed.current;
    try {
      window.Tebex.checkout.init({ ident, theme: "dark", locale: locales[locale] ?? "en_US", colors: [{name:"primary",color:"#ff7a00"}] });
      window.Tebex.checkout.render(element, element.clientWidth, Math.max(480, Math.min(700, innerHeight - 140)), false);
    } catch { queueMicrotask(() => setError(true)); }
    return () => { element.replaceChildren(); };
  }, [ident, sdkReady, locale]);
  const close = () => { abort.current?.abort(); setSelected(null); setIdent(""); setError(false); setBusy(false); };
  const pay = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || busy) return;
    const controller = new AbortController(); abort.current = controller; setBusy(true); setError(false);
    try {
      const response = await fetch("/api/store/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({packageId:selected.id,username:username.trim()}),signal:controller.signal });
      if (!response.ok) throw Error(); const data = await response.json(); if (!data.ident) throw Error(); if (!controller.signal.aborted) setIdent(data.ident);
    } catch { if (!controller.signal.aborted) setError(true); } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  return <>
    {selected && <Script src="https://js.tebex.io/v/1.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setSdkError(true)} />}
    {!live && <p role="status" className="mb-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-[var(--text-muted)]">{t("checkoutUnavailable")}</p>}
    <div className="grid gap-6 md:grid-cols-3">{products.map((product, index) => {
      const rank = STORE_RANKS.find(r => r.id === product.rankId), Icon = index % 3 === 0 ? ShieldCheck : index % 3 === 1 ? Gem : Crown;
      return <article key={product.id} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-colors hover:border-orange-500/50">
        <div aria-hidden="true" className="absolute -end-12 -top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="mb-8 flex items-center justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-400"><Icon size={28} /></span><span className="font-mono text-xs text-[var(--text-muted)]">0{index+1}</span></div>
        <p className="text-label text-orange-400">{ui("rank")}</p><h3 className="mt-2 text-4xl font-black tracking-tight"><bdi>{product.name}</bdi></h3>
        <p className="mt-5 min-h-10 text-3xl font-bold">{product.price === null ? <span className="text-sm font-normal text-[var(--text-muted)]">{t("pricePending")}</span> : new Intl.NumberFormat(locale,{style:"currency",currency:product.currency}).format(product.price)}</p>
        {rank ? <ul className="my-7 flex-1 space-y-3 border-t border-white/5 pt-6">{rank.perks.map((_,i)=><li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--text-muted)]"><Check size={16} className="mt-1 shrink-0 text-orange-400" />{ui(`perk_${rank.id}_${i}`)}</li>)}</ul> : <p className="my-7 flex-1 whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{product.description}</p>}
        <button disabled={!live || !product.available} onClick={()=>setSelected(product)} data-cursor="button" className="mt-auto flex w-full items-center justify-between rounded-2xl bg-orange-500 px-5 py-4 text-sm font-bold text-black transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"><span>{t("getRank")} <bdi>{product.name}</bdi></span><ArrowRight size={17} className="rtl:rotate-180" /></button>
      </article>;
    })}</div>
    <dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby="checkout-title" className="checkout-shell fixed inset-0 m-auto max-h-[94dvh] w-[min(640px,calc(100%_-_24px))] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0d12] p-5 text-white backdrop:bg-black/80 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><h2 id="checkout-title" className="text-xl font-bold">{selected?.name} · {t("checkoutTitle")}</h2><button type="button" onClick={close} aria-label={t("close")} className="rounded-full border border-white/15 p-2"><X size={18} /></button></div>
      {!ident ? <form onSubmit={pay}><label htmlFor="store-username" className="text-sm text-zinc-300">{t("username")}</label><input id="store-username" required autoComplete="username" minLength={3} maxLength={32} pattern="[.a-zA-Z0-9_ ]{3,32}" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 outline-none focus:border-orange-500" /><p className="mt-3 text-xs leading-relaxed text-zinc-400">{t("usernameHelp")}</p><button disabled={busy || !sdkReady || sdkError} className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-black disabled:opacity-40">{t(busy || !sdkReady ? "preparing" : "continuePayment")}</button></form> : <div ref={embed} className="min-h-[480px] w-full [&_iframe]:max-w-full" />}
      {(error || sdkError) && <p role="alert" className="mt-4 text-sm text-orange-300">{t("paymentError")}</p>}
      <p className="mt-5 flex items-center gap-2 text-xs text-zinc-400"><ShieldCheck size={15} className="shrink-0 text-orange-400" />{t("allPurchases")}</p>
    </dialog>
  </>;
}
