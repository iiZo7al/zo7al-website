"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import "./store.css";
import { groupStoreProducts } from "@/lib/data/store-groups";
import { BOOSTER_PRODUCT, isMonthlyRank } from "@/lib/data/store-booster";
import { DISCORD_LINK } from "@/lib/data/site";
import { localizedDescription } from "@/lib/data/store-localization";
import { motion, useReducedMotion } from "framer-motion";
import DetailsIcon from "@/components/ui/DetailsIcon";
import { Check, ShieldCheck, X, ArrowRight, LoaderCircle, AlertCircle, Zap } from "lucide-react";
import type { StoreProduct } from "@/lib/server/tebex";

type CheckoutSdk = { on: (event: "payment:complete", handler: () => void) => void; init: (options: { ident: string; theme: string; locale: string; colors: {name: string; color: string}[] }) => void; render: (element: HTMLElement, width: number, height: number, newTab: boolean) => void; };
declare global { interface Window { Tebex?: { checkout: CheckoutSdk } } }
const locales: Record<string,string> = { en:"en_US", ar:"ar_SA", es:"es_ES", fr:"fr_FR", de:"de_DE", pt:"pt_BR", tr:"tr_TR", ja:"ja_JP", ko:"ko_KR", zh:"zh_CN" };
export default function StoreRanks({ products: initialProducts, live: initialLive }: { products: StoreProduct[]; live: boolean }) {
  const [catalog, setCatalog] = useState({ products: initialProducts, live: initialLive });
  const { products, live } = catalog;
  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    const refresh = async () => {
      if (fetching || document.visibilityState === "hidden") return;
      fetching = true;
      try {
        const response = await fetch("/api/store/catalog", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return; // Retain the last successful catalog during a temporary outage.
        const next = await response.json();
        if (!controller.signal.aborted && next.live && Array.isArray(next.products)) setCatalog(next);
      } catch { /* Retry at the next refresh; checkout still validates the current catalog. */ }
      finally { fetching = false; }
    };
    if (!initialLive) void refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [initialLive]);
  const t = useTranslations("store"), ui = useTranslations("ui"), locale = useLocale();
  const descriptionT = useTranslations("storeDescription");
  const reduceMotion = useReducedMotion();
  const describe = (product: StoreProduct) => localizedDescription(product.description, descriptionT);
  const subscriptionLink = <a href="https://portal.tebex.io/" target="_blank" rel="noopener noreferrer" className="store-subscription-link">{t("manageSubscriptions")}</a>;
  const [selected, setSelected] = useState<StoreProduct | null>(null), [username, setUsername] = useState("");
  const [details, setDetails] = useState<StoreProduct | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (details) detailsDialog.current?.showModal(); else detailsDialog.current?.close(); }, [details]);
  const [busy, setBusy] = useState(false), [error, setError] = useState<"paymentError" | "purchaseRestricted" | "alreadyOwned" | null>(null), [ident, setIdent] = useState("");
  const [sdkReady, setSdkReady] = useState(false), [sdkError, setSdkError] = useState(false);
  const [verificationIdent, setVerificationIdent] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "checking" | "paid" | "pending">("idle");
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") !== "complete") return;
    try {
      const saved = sessionStorage.getItem("zo7al-checkout");
      if (saved) queueMicrotask(() => { setPaymentStatus("checking"); setVerificationIdent(saved); });
    } catch { /* Checkout can still confirm through the embedded payment event. */ }
  }, []);
  useEffect(() => {
    if (!verificationIdent) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const verify = async () => {
      attempts++;
      try {
        const response = await fetch(`/api/store/status?ident=${encodeURIComponent(verificationIdent)}`, { cache: "no-store", signal: controller.signal });
        const result = response.ok ? await response.json() : null;
        if (controller.signal.aborted) return;
        if (result?.paid === true) {
          setPaymentStatus("paid"); setSelected(null); setIdent(""); setError(null);
          try { sessionStorage.removeItem("zo7al-checkout"); } catch { /* Optional persistence. */ }
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout"); window.history.replaceState(null, "", url);
          return;
        }
      } catch { if (controller.signal.aborted) return; }
      if (attempts < 8) timer = setTimeout(verify, 2500);
      else setPaymentStatus("pending");
    };
    void verify();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [verificationIdent]);
  useEffect(() => {
    if (paymentStatus === "paid") confirmation.current?.scrollIntoView({ block: "center" });
  }, [paymentStatus]);
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
    let active = true;
    try {
      window.Tebex.checkout.init({ ident, theme: "dark", locale: locales[locale] ?? "en_US", colors: [{name:"primary",color:"#ff7a00"}] });
      window.Tebex.checkout.on("payment:complete", () => {
        if (active) { setPaymentStatus("checking"); setVerificationIdent(ident); }
      });
      window.Tebex.checkout.render(element, element.clientWidth, Math.max(480, Math.min(700, innerHeight - 140)), false);
    } catch { queueMicrotask(() => setError("paymentError")); }
    return () => { active = false; element.replaceChildren(); };
  }, [ident, sdkReady, locale]);
  const close = () => { abort.current?.abort(); setSelected(null); setIdent(""); setError(null); setBusy(false); };
  const pay = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || busy) return;
    const controller = new AbortController(); abort.current = controller; setBusy(true); setError(null);
    try {
      const response = await fetch("/api/store/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({packageId:selected.id,username:username.trim()}),signal:controller.signal });
      const data = await response.json();
      if (response.status === 409 && ["PURCHASE_RESTRICTED", "ALREADY_OWNED"].includes(data.error)) {
        if (!controller.signal.aborted) setError(data.error === "ALREADY_OWNED" ? "alreadyOwned" : "purchaseRestricted");
        return;
      }
      if (!response.ok || !data.ident) throw Error();
      if (!controller.signal.aborted) {
        try { sessionStorage.setItem("zo7al-checkout", data.ident); } catch { /* Optional return-page recovery. */ }
        setPaymentStatus("idle"); setVerificationIdent(""); setIdent(data.ident);
      }
    } catch { if (!controller.signal.aborted) setError("paymentError"); } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const price = (product: StoreProduct) => product.id === BOOSTER_PRODUCT.id
    ? t("boosterPrice")
    : product.price === null
    ? t("pricePending")
    : <span className="store-price-value" dir="ltr"><bdi>{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency, currencyDisplay: "narrowSymbol" }).format(product.price)}</bdi>{isMonthlyRank(product) && <span className="store-price-period">/<bdi dir="auto">{t("monthly")}</bdi></span>}</span>;
  const groups = groupStoreProducts(products, BOOSTER_PRODUCT);
  const categoryLabel = (name?: string) => /^(ranks?|الرتب)$/i.test(name?.trim() ?? "") ? t("ranksTitle") : /^(coins?|العملات)$/i.test(name?.trim() ?? "") ? t("coinsTitle") : name || t("productsTitle");
  const currentSelected = products.find(product => product.id === selected?.id) ?? selected;
  const currentDetails = products.find(product => product.id === details?.id) ?? details;
  return <>
    {selected && <Script src="https://js.tebex.io/v/1.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setSdkError(true)} />}
    {!live && <p role="status" className="store-notice"><ShieldCheck size={18} aria-hidden="true" />{t("checkoutUnavailable")}</p>}
    {paymentStatus !== "idle" && <div ref={confirmation} role="status" aria-live="polite" className={`store-payment-status${paymentStatus === "paid" ? " store-payment-success" : ""}`}>
      <h2>{t(paymentStatus === "paid" ? "paymentSuccess" : paymentStatus === "checking" ? "paymentChecking" : "paymentPending")}</h2>
      {paymentStatus === "paid" && <><p>{t("paymentSuccessNote")}</p><p>{subscriptionLink}</p></>}
    </div>}
    {groups.map(group => <section key={group.id} aria-labelledby={`store-group-${group.id}`} className="mb-14">
      <div className="mb-5 flex items-center gap-4">
        {group.image && <Image unoptimized src={group.image} alt="" width={140} height={80} className="h-20 w-36 object-contain" />}
        <h2 id={`store-group-${group.id}`} dir="auto" className="text-display text-3xl">{categoryLabel(group.name)}</h2>
      </div>
      <div className="store-rank-grid">
      {group.products.map((product, index) => {
        const booster = product.id === BOOSTER_PRODUCT.id;
        const featured = product.id === 7312784;
        const lines = describe(product);
        const perks = lines.filter(line => line.startsWith("• ")).map(line => line.slice(2)).slice(0, 5);
        return <motion.div key={product.id} initial={reduceMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }} className="store-rank-reveal"><article className={`store-rank${featured ? " store-rank-featured" : ""}`}>
          <div className="store-rank-top">
            {featured && <span className="store-rank-badge">{t("mostPopular")}</span>}
            {product.image ? <Image unoptimized src={product.image} alt={product.name} width={160} height={120} className="store-product-image" /> : <span className="store-rank-icon">{booster ? <Zap size={24} strokeWidth={1.5} aria-hidden="true" /> : <ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" />}</span>}
          </div>
          <p className="text-label">{booster ? ui("rank") : categoryLabel(product.category?.name)}</p>
          <h3 className="text-display store-rank-name"><bdi dir="ltr">{product.name}</bdi></h3>
          <p className={`store-rank-price${product.price === null ? " store-price-pending" : ""}`}>{price(product)}</p>
          {perks.length ? <ul className="store-rank-perks">{perks.map((perk, index) => <li key={index}><Check size={15} aria-hidden="true" /><span dir="auto">{perk}</span></li>)}</ul> : <p dir="auto" className="store-rank-description store-description-preview">{lines.join("\n") || t("descriptionUnavailable")}</p>}
          <div className="store-rank-actions">{booster ? <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" data-cursor="button" className="store-action"><span>{t("getRank")} <bdi dir="ltr">Booster</bdi></span><ArrowRight size={16} className="store-direction" aria-hidden="true" /></a> : <button disabled={!live || !product.available} onClick={() => setSelected(product)} data-cursor="button" className={`store-action${featured ? " store-action-primary" : ""}`}>
            <span>{t("getRank")} <bdi dir="ltr">{product.name}</bdi></span><ArrowRight size={16} className="store-direction" aria-hidden="true" />
          </button>}
          <button type="button" className="store-action store-details-button" onClick={() => setDetails(product)} data-cursor="button" aria-haspopup="dialog" aria-label={`${t("details")} — ${product.name}`} title={t("details")}><DetailsIcon /></button></div>
        </article></motion.div>;
      })}
      </div>
    </section>)}
    <dialog ref={detailsDialog} onCancel={() => setDetails(null)} onClose={() => setDetails(null)} aria-labelledby="rank-details-title" className="checkout-shell store-checkout">
      <header className="store-checkout-header"><h2 id="rank-details-title">{t("details")} · <bdi dir="ltr">{currentDetails?.name}</bdi></h2><button type="button" className="store-close" onClick={() => setDetails(null)} aria-label={t("close")}><X size={20} aria-hidden="true" /></button></header>
      <div className="store-checkout-body store-full-description">{currentDetails?.image && <Image unoptimized src={currentDetails.image} alt={currentDetails.name} width={480} height={320} className="store-details-image" />}{currentDetails?.description ? describe(currentDetails).map((line, index) => line.startsWith("• ") ? <p className="store-detail-perk" key={index}><Check size={16} aria-hidden="true" /><span dir="auto">{line.slice(2)}</span></p> : <p dir="auto" key={index}>{line}</p>) : <p>{t("descriptionUnavailable")}</p>}</div>
    </dialog>
    <dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby="checkout-title" aria-describedby="checkout-description" className="checkout-shell store-checkout">
      <header className="store-checkout-header">
        <div className="store-checkout-brand"><Image src="/assets/site/server-logo.png" alt="Zo7al Network" width={40} height={40} /><span className="text-label">{t("checkoutTitle")}</span></div>
        <button type="button" onClick={close} aria-label={t("close")} className="store-close"><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="store-checkout-body">
        <div className="store-order-summary">
          <div><p className="text-label">{categoryLabel(currentSelected?.category?.name)}</p><h2 id="checkout-title" className="text-display"><bdi dir="ltr">{currentSelected?.name}</bdi></h2></div>
          <p className="store-order-price">{currentSelected && price(currentSelected)}</p>
        </div>
        <p id="checkout-description" className="store-checkout-description">{t("checkoutNote")}</p>
        {!ident ? <form onSubmit={pay} className="store-checkout-form">
          <label htmlFor="store-username">{t("username")}</label>
          <input id="store-username" required autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" aria-describedby="store-username-help" minLength={3} maxLength={32} pattern="[.a-zA-Z0-9_ ]{3,32}" value={username} onChange={e => { setUsername(e.target.value); setError(null); }} />
          <p id="store-username-help">{t("usernameHelp")}</p>
          <button disabled={busy || !sdkReady || sdkError} className="store-action store-action-primary store-pay" aria-busy={busy}>
            <span>{t(busy || !sdkReady ? "preparing" : "continuePayment")}</span>
            {busy || !sdkReady ? <LoaderCircle size={18} className="store-spinner" aria-hidden="true" /> : <ArrowRight size={18} className="store-direction" aria-hidden="true" />}
          </button>
        </form> : <div ref={embed} className="store-checkout-embed" />}
        {paymentStatus === "checking" && <p role="status" className="store-notice">{t("paymentChecking")}</p>}
        {paymentStatus === "pending" && <p role="status" className="store-notice">{t("paymentPending")}</p>}
        {(error || sdkError) && <p role="alert" className="store-notice store-checkout-error"><AlertCircle size={18} aria-hidden="true" /><span>{t(error ?? "paymentError")}{error === "alreadyOwned" && <><br />{subscriptionLink}</>}</span></p>}
      </div>
      <footer className="store-checkout-footer"><ShieldCheck size={16} aria-hidden="true" /><p>{t("allPurchases")}</p></footer>
    </dialog>
  </>;
}
