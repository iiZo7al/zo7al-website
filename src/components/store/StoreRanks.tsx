"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import "./store.css";
import { Check, ShieldCheck, Crown, Gem, X, ArrowRight, LoaderCircle, AlertCircle } from "lucide-react";
import type { StoreProduct } from "@/lib/server/tebex";
import { STORE_RANKS } from "@/lib/data/store";

type CheckoutSdk = { init: (options: { ident: string; theme: string; locale: string; colors: {name: string; color: string}[] }) => void; render: (element: HTMLElement, width: number, height: number, newTab: boolean) => void; };
declare global { interface Window { Tebex?: { checkout: CheckoutSdk } } }
const locales: Record<string,string> = { en:"en_US", ar:"ar_SA", es:"es_ES", fr:"fr_FR", de:"de_DE", pt:"pt_BR", tr:"tr_TR", ja:"ja_JP", ko:"ko_KR", zh:"zh_CN" };
export default function StoreRanks({ products, live }: { products: StoreProduct[]; live: boolean }) {
  const t = useTranslations("store"), ui = useTranslations("ui"), locale = useLocale();
  const [selected, setSelected] = useState<StoreProduct | null>(null), [username, setUsername] = useState("");
  const [details, setDetails] = useState<StoreProduct | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (details) detailsDialog.current?.showModal(); else detailsDialog.current?.close(); }, [details]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false), [ident, setIdent] = useState("");
  const [sdkReady, setSdkReady] = useState(false), [sdkError, setSdkError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), embed = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!selected && !details) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected, details]);
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
  const price = (product: StoreProduct) => product.price === null
    ? t("pricePending")
    : new Intl.NumberFormat(locale, { style: "currency", currency: product.currency }).format(product.price);
  const orderedProducts = [...products].sort((a, b) => {
    const order = (p: StoreProduct) => { const i = STORE_RANKS.findIndex(r => r.id === p.rankId); return i < 0 ? STORE_RANKS.length : i; };
    return order(a) - order(b);
  });
  return <>
    {selected && <Script src="https://js.tebex.io/v/1.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setSdkError(true)} />}
    {!live && <p role="status" className="store-notice"><ShieldCheck size={18} aria-hidden="true" />{t("checkoutUnavailable")}</p>}
    <div className="store-rank-grid">
      {orderedProducts.map(product => {
        const rank = STORE_RANKS.find(r => r.id === product.rankId);
        const Icon = rank?.id === "mvp-plus" ? Crown : rank?.id === "mvp" ? Gem : ShieldCheck;
        return <article key={product.id} className={`store-rank${rank?.featured ? " store-rank-featured" : ""}`}>
          <div className="store-rank-top">
            <span className="store-rank-icon"><Icon size={24} strokeWidth={1.5} aria-hidden="true" /></span>
            {rank?.featured && <span className="store-rank-badge">{t("mostPopular")}</span>}
          </div>
          <p className="text-label">{ui("rank")}</p>
          <h3 className="text-display store-rank-name"><bdi dir="ltr">{product.name}</bdi></h3>
          <p className={`store-rank-price${product.price === null ? " store-price-pending" : ""}`}>{price(product)}</p>
          {rank ? <ul className="store-rank-perks">{rank.perks.map((_, i) =>
            <li key={i}><Check size={15} aria-hidden="true" /><span>{ui(`perk_${rank.id}_${i}`)}</span></li>
          )}</ul> : <p className="store-rank-description">{product.description}</p>}
          <div className="store-rank-actions"><button disabled={!live || !product.available} onClick={() => setSelected(product)} data-cursor="button" className={`store-action${rank?.featured ? " store-action-primary" : ""}`}>
            <span>{t("getRank")} <bdi dir="ltr">{product.name}</bdi></span><ArrowRight size={16} className="store-direction" aria-hidden="true" />
          </button>
          <button type="button" className="store-action store-details-button" onClick={() => setDetails(product)} data-cursor="button" aria-haspopup="dialog">{t("details")}</button></div>
        </article>;
      })}
    </div>
    <dialog ref={detailsDialog} onCancel={() => setDetails(null)} onClose={() => setDetails(null)} aria-labelledby="rank-details-title" className="checkout-shell store-checkout">
      <header className="store-checkout-header"><h2 id="rank-details-title">{t("details")} · <bdi dir="ltr">{details?.name}</bdi></h2><button type="button" className="store-close" onClick={() => setDetails(null)} aria-label={t("close")}><X size={20} aria-hidden="true" /></button></header>
      <div className="store-checkout-body store-full-description">{details?.description ? details.description.split(/\n+/).map((line, index) => <p dir="auto" key={index}>{line}</p>) : <p>{t("descriptionUnavailable")}</p>}</div>
    </dialog>
    <dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby="checkout-title" aria-describedby="checkout-description" className="checkout-shell store-checkout">
      <header className="store-checkout-header">
        <div className="store-checkout-brand"><Image src="/assets/site/server-logo.png" alt="Zo7al Network" width={40} height={40} /><span className="text-label">{t("checkoutTitle")}</span></div>
        <button type="button" onClick={close} aria-label={t("close")} className="store-close"><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="store-checkout-body">
        <div className="store-order-summary">
          <div><p className="text-label">{ui("rank")}</p><h2 id="checkout-title" className="text-display"><bdi dir="ltr">{selected?.name}</bdi></h2></div>
          <p className="store-order-price">{selected && price(selected)}</p>
        </div>
        <p id="checkout-description" className="store-checkout-description">{t("checkoutNote")}</p>
        {!ident ? <form onSubmit={pay} className="store-checkout-form">
          <label htmlFor="store-username">{t("username")}</label>
          <input id="store-username" required autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" aria-describedby="store-username-help" minLength={3} maxLength={32} pattern="[.a-zA-Z0-9_ ]{3,32}" value={username} onChange={e => setUsername(e.target.value)} />
          <p id="store-username-help">{t("usernameHelp")}</p>
          <button disabled={busy || !sdkReady || sdkError} className="store-action store-action-primary store-pay" aria-busy={busy}>
            <span>{t(busy || !sdkReady ? "preparing" : "continuePayment")}</span>
            {busy || !sdkReady ? <LoaderCircle size={18} className="store-spinner" aria-hidden="true" /> : <ArrowRight size={18} className="store-direction" aria-hidden="true" />}
          </button>
        </form> : <div ref={embed} className="store-checkout-embed" />}
        {(error || sdkError) && <p role="alert" className="store-notice store-checkout-error"><AlertCircle size={18} aria-hidden="true" /><span>{t("paymentError")}</span></p>}
      </div>
      <footer className="store-checkout-footer"><ShieldCheck size={16} aria-hidden="true" /><p>{t("allPurchases")}</p></footer>
    </dialog>
  </>;
}
