"use client";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import "./store.css";
import { useCart } from "./CartProvider";
import { isCoinProduct, isRankProduct, parseCartItems, MAX_COIN_QUANTITY, type CartItem } from "@/lib/data/store-cart";
import { cartCopy } from "@/lib/data/cart-copy";
import PlayerIdentity, { usePlayerName } from "./PlayerIdentity";
import RankComparison from "./RankComparison";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";
import CreatorRanks from "./CreatorRanks";
import { groupStoreProducts } from "@/lib/data/store-groups";
import { BOOSTER_PRODUCT, isMonthlyRank } from "@/lib/data/store-booster";
import { DISCORD_LINK } from "@/lib/data/site";
import { localizedDescription } from "@/lib/data/store-localization";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CommerceIcon from "@/components/ui/CommerceIcon";
import DetailsIcon from "@/components/ui/DetailsIcon";
import { Check, ShieldCheck, X, ArrowRight, LoaderCircle, AlertCircle, Zap, Minus, Plus, Search, Columns3 } from "lucide-react";
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
  const t = useTranslations("store"), locale = useLocale();
  const creatorT = useTranslations("creators");
  const descriptionT = useTranslations("storeDescription");
  const reduceMotion = useReducedMotion();
  const describe = (product: StoreProduct) => localizedDescription(product.description, descriptionT);
  const subscriptionLink = <a href="https://portal.tebex.io/" target="_blank" rel="noopener noreferrer" className="store-subscription-link">{t("manageSubscriptions")}</a>;
  const { items: cartItems, ready: cartReady, open: cartOpen, setOpen: setCartOpen, add, changeQuantity, remove, removePurchased } = useCart();
  const cartIds = cartItems.map(item => item.packageId);
  const rankIds = products.filter(isRankProduct).map(product => product.id);
  const hasRank = cartIds.some(id => rankIds.includes(id));
  const copy = cartCopy(locale);
  const { username, setUsername } = usePlayerName();
  const experience = storeExperienceCopy(locale);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ranks" | "coins" | "creators">("all");
  const [comparing, setComparing] = useState(false);
  const [toast, setToast] = useState<{ product: StoreProduct; key: number } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  const purchasedItems = useRef<CartItem[]>([]);
  const [details, setDetails] = useState<StoreProduct | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (details) detailsDialog.current?.showModal(); else detailsDialog.current?.close(); }, [details]);
  const [busy, setBusy] = useState(false), [error, setError] = useState<"paymentError" | "purchaseRestricted" | "alreadyOwned" | "oneRank" | null>(null), [ident, setIdent] = useState("");
  const [errorPackage, setErrorPackage] = useState<number | null>(null);
  const [sdkReady, setSdkReady] = useState(false), [sdkError, setSdkError] = useState(false);
  const [verificationIdent, setVerificationIdent] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "checking" | "paid" | "pending">("idle");
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") !== "complete") return;
    try {
      const saved = sessionStorage.getItem("zo7al-checkout");
      if (saved) {
        const items = JSON.parse(sessionStorage.getItem("zo7al-checkout-items") ?? "[]");
        purchasedItems.current = parseCartItems(items) ?? [];
        queueMicrotask(() => { setPaymentStatus("checking"); setVerificationIdent(saved); });
      }
    } catch { /* Checkout can still confirm through the embedded payment event. */ }
  }, []);
  useEffect(() => {
    if (!verificationIdent) return;
    const verifiedItems = purchasedItems.current;
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
          setPaymentStatus("paid"); setCartOpen(false); setIdent(""); setError(null);
          removePurchased(verifiedItems);
          try { sessionStorage.removeItem("zo7al-checkout"); sessionStorage.removeItem("zo7al-checkout-items"); } catch { /* Optional persistence. */ }
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
  }, [verificationIdent, removePurchased, setCartOpen]);
  useEffect(() => {
    if (paymentStatus === "paid") confirmation.current?.scrollIntoView({ block: "center" });
  }, [paymentStatus]);
  const dialog = useRef<HTMLDialogElement>(null), embed = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  useEffect(() => { if (cartOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [cartOpen]);
  useEffect(() => () => { abort.current?.abort(); setCartOpen(false); }, [setCartOpen]);
  useEffect(() => {
    if (!cartOpen && !details) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [cartOpen, details]);
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
  const close = () => { abort.current?.abort(); abort.current = null; setCartOpen(false); setIdent(""); setError(null); setErrorPackage(null); setBusy(false); };
  const pay = async (event: React.FormEvent) => {
    event.preventDefault(); if (!cartOpen || busy || abort.current || !cartIds.length || cartIds.some(id => !products.some(p => p.id === id && p.available))) return;
    const controller = new AbortController(); abort.current = controller; setBusy(true); setError(null); setErrorPackage(null);
    try {
      const response = await fetch("/api/store/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({items:cartItems,username:username.trim()}),signal:controller.signal });
      const data = await response.json();
      if (data.error === "ONE_RANK_ONLY") { if (!controller.signal.aborted) setError("oneRank"); return; }
      if (response.status === 409 && ["PURCHASE_RESTRICTED", "ALREADY_OWNED"].includes(data.error)) {
        if (!controller.signal.aborted) { setError(data.error === "ALREADY_OWNED" ? "alreadyOwned" : "purchaseRestricted"); setErrorPackage(Number.isSafeInteger(data.packageId) ? data.packageId : null); }
        return;
      }
      if (!response.ok || !data.ident) throw Error();
      if (!controller.signal.aborted) {
        purchasedItems.current = cartItems.map(item => ({ ...item }));
        try { sessionStorage.setItem("zo7al-checkout", data.ident); sessionStorage.setItem("zo7al-checkout-items", JSON.stringify(cartItems)); } catch { /* Optional return-page recovery. */ }
        setPaymentStatus("idle"); setVerificationIdent(""); setIdent(data.ident);
      }
    } catch { if (!controller.signal.aborted) setError("paymentError"); } finally { if (abort.current === controller) abort.current = null; if (!controller.signal.aborted) setBusy(false); }
  };
  const price = (product: StoreProduct) => product.id === BOOSTER_PRODUCT.id
    ? t("boosterPrice")
    : product.price === null
    ? t("pricePending")
    : <span className="store-price-value" dir="ltr"><bdi>{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency, currencyDisplay: "narrowSymbol" }).format(product.price)}</bdi>{isMonthlyRank(product) && <span className="store-price-period">/<bdi dir="auto">{t("monthly")}</bdi></span>}</span>;
  const groups = groupStoreProducts(products, BOOSTER_PRODUCT);
  const search = query.trim().toLocaleLowerCase();
  const visibleGroups = groups.map(group => ({ ...group, products: group.products.filter(product =>
    (filter === "all" || (filter === "ranks" && (isRankProduct(product) || product.id === BOOSTER_PRODUCT.id)) || (filter === "coins" && isCoinProduct(product))) &&
    (!search || [product.name, group.name, ...describe(product)].join(" ").toLocaleLowerCase().includes(search))
  ) })).filter(group => group.products.length);
  const showCreators = filter === "all" || filter === "creators";
  const categoryLabel = (name?: string) => /^(ranks?|الرتب)$/i.test(name?.trim() ?? "") ? t("ranksTitle") : /^(coins?|العملات)$/i.test(name?.trim() ?? "") ? t("coinsTitle") : name || t("productsTitle");
  const cartProducts = cartIds.map(id => products.find(product => product.id === id));
  const cartUnavailable = !live || cartProducts.some(product => !product?.available);
  const totals = new Map<string, number>();
  for (const product of cartProducts) if (product?.price != null) totals.set(product.currency, (totals.get(product.currency) ?? 0) + product.price * (cartItems.find(item => item.packageId === product.id)?.quantity ?? 1));
  const totalsKnown = cartProducts.every(product => product?.price != null);
  const currentDetails = products.find(product => product.id === details?.id) ?? details;
  return <>
    {cartOpen && <Script src="https://js.tebex.io/v/1.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setSdkError(true)} />}
    {!live && <p role="status" className="store-notice"><ShieldCheck size={18} aria-hidden="true" />{t("checkoutUnavailable")}</p>}
    {paymentStatus !== "idle" && <div ref={confirmation} role="status" aria-live="polite" className={`store-payment-status${paymentStatus === "paid" ? " store-payment-success" : ""}`}>
      <h2>{t(paymentStatus === "paid" ? "paymentSuccess" : paymentStatus === "checking" ? "paymentChecking" : "paymentPending")}</h2>
      {paymentStatus === "paid" && <><p>{t("paymentSuccessNote")}</p><p>{subscriptionLink}</p></>}
    </div>}
    {hasRank && <p className="store-notice">{copy.oneRank}</p>}
    <div className="store-tools">
      <div className="store-search-row">
        <label className="store-search"><Search size={18} aria-hidden="true"/><span className="sr-only">{experience.search}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={experience.search}/></label>
        <button type="button" className="store-action" onClick={() => setComparing(true)} disabled={products.filter(isRankProduct).length < 2} aria-haspopup="dialog"><Columns3 size={18} aria-hidden="true"/>{experience.compare}</button>
      </div>
      <div className="store-filters" role="group" aria-label={t("productsTitle")}>{(["all", "ranks", "coins", "creators"] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? experience.all : value === "ranks" ? t("ranksTitle") : value === "coins" ? t("coinsTitle") : creatorT("title")}</button>)}</div>
    </div>
    {!visibleGroups.length && !showCreators && <p role="status" className="store-notice">{experience.noResults}</p>}
    {visibleGroups.map(group => <Fragment key={group.id}><section aria-labelledby={`store-group-${group.id}`} className="mb-14">
      <div className="mb-5 flex items-center gap-4">
        {group.image && <Image unoptimized src={group.image} alt="" width={140} height={80} className="h-20 w-36 object-contain" />}
        <h2 id={`store-group-${group.id}`} dir="auto" className="text-display text-3xl">{categoryLabel(group.name)}</h2>
      </div>
      <div className="store-rank-grid">
      {group.products.map((product, index) => {
        const booster = product.id === BOOSTER_PRODUCT.id;
        const quantity = cartItems.find(item => item.packageId === product.id)?.quantity ?? 0;
        const rankBlocked = isRankProduct(product) && hasRank && !quantity;
        // Tebex package IDs: MVP+ and the 100,000 Coins package.
        const featured = product.id === 7312784 || product.id === 7692129;
        const lines = describe(product);
        const perks = lines.filter(line => line.startsWith("• ")).map(line => line.slice(2)).slice(0, 5);
        return <motion.div key={product.id} initial={reduceMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }} className="store-rank-reveal"><article className={`card-glow store-rank${featured ? " store-rank-featured" : ""}`}>
          <div className="store-rank-top">
            {featured && <span className="store-rank-badge">{t("mostPopular")}</span>}
            {product.image ? <Image unoptimized src={product.image} alt={product.name} width={160} height={120} className="store-product-image" /> : <span className="store-rank-icon">{booster ? <Zap size={24} strokeWidth={1.5} aria-hidden="true" /> : <ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" />}</span>}
          </div>
          <p className="text-label">{booster ? t("ranksTitle") : categoryLabel(product.category?.name)}</p>
          <h3 className="text-display store-rank-name"><bdi dir="ltr">{product.name}</bdi></h3>
          <p className={`store-rank-price${product.price === null ? " store-price-pending" : ""}`}>{price(product)}</p>
          {perks.length ? <ul className="store-rank-perks">{perks.map((perk, index) => <li key={index}><Check size={15} aria-hidden="true" /><span dir="auto">{perk}</span></li>)}</ul> : <p dir="auto" className="store-rank-description store-description-preview">{lines.join("\n") || t("descriptionUnavailable")}</p>}
          <div className="store-rank-actions">{booster ? <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" data-cursor="button" className="store-action"><span>{t("getRank")} <bdi dir="ltr">Booster</bdi></span><ArrowRight size={16} className="store-direction" aria-hidden="true" /></a> : isCoinProduct(product) && quantity > 0 ? <QuantityControl name={product.name} quantity={quantity} disabled={!live || !product.available || !cartReady} decrease={copy.decrease} increase={copy.increase} onChange={delta => changeQuantity(product.id, delta)} removeLabel={copy.remove} onRemove={() => remove(product.id)}/> : <button title={rankBlocked ? copy.oneRank : undefined} disabled={rankBlocked || !live || !product.available || !cartReady || (cartIds.length >= 20 && !cartIds.includes(product.id))} onClick={() => { if (cartIds.includes(product.id)) setCartOpen(true); else { add(product.id, isRankProduct(product) ? rankIds : []); setToast({ product, key: Date.now() }); } }} data-cursor="button" className={`store-action${featured ? " store-action-primary" : ""}`}>
            <span>{cartIds.includes(product.id) ? copy.added : <>{copy.add.split("{name}")[0]}<bdi dir="ltr">{product.name}</bdi>{copy.add.split("{name}")[1]}</>}</span>{cartIds.includes(product.id) ? <Check size={16} aria-hidden="true"/> : <CommerceIcon name="shopping-cart" size={16} aria-hidden="true"/>}
          </button>}
          <button type="button" className="store-action store-details-button" onClick={() => setDetails(product)} data-cursor="button" aria-haspopup="dialog" aria-label={`${t("details")} — ${product.name}`} title={t("details")}><DetailsIcon /></button></div>
        </article></motion.div>;
      })}
      </div>
    </section></Fragment>)}
    {showCreators && <CreatorRanks query={query} showEmpty={!visibleGroups.length}/>}
    {comparing && <RankComparison products={products.filter(isRankProduct)} price={price} describe={describe} onClose={() => setComparing(false)}/>}
    <AnimatePresence>{toast && !cartOpen && <motion.aside key={toast.key} className="store-cart-toast" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }} role="status" aria-live="polite" aria-atomic="true">
      {toast.product.image && <Image unoptimized src={toast.product.image} alt="" width={64} height={52}/>}
      <div><p>{experience.added}</p><strong dir="auto">{toast.product.name}</strong><button type="button" onClick={() => { setCartOpen(true); setToast(null); }}>{experience.viewCart}<ArrowRight size={15} aria-hidden="true"/></button></div>
      <button type="button" className="store-close" aria-label={t("close")} onClick={() => setToast(null)}><X size={18} aria-hidden="true"/></button>
    </motion.aside>}</AnimatePresence>
    <dialog ref={detailsDialog} onCancel={() => setDetails(null)} onClose={() => setDetails(null)} aria-labelledby="rank-details-title" className="checkout-shell store-checkout">
      <header className="store-checkout-header"><h2 id="rank-details-title">{t("details")} · <bdi dir="ltr">{currentDetails?.name}</bdi></h2><button type="button" className="store-close" onClick={() => setDetails(null)} aria-label={t("close")}><X size={20} aria-hidden="true" /></button></header>
      <div className="store-checkout-body store-full-description">{currentDetails?.image && <Image unoptimized src={currentDetails.image} alt={currentDetails.name} width={480} height={320} className="store-details-image" />}{currentDetails?.description ? describe(currentDetails).map((line, index) => line.startsWith("• ") ? <p className="store-detail-perk" key={index}><Check size={16} aria-hidden="true" /><span dir="auto">{line.slice(2)}</span></p> : <p dir="auto" key={index}>{line}</p>) : <p>{t("descriptionUnavailable")}</p>}</div>
    </dialog>
    <dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby="checkout-title" aria-describedby="checkout-description" className="checkout-shell store-checkout store-cart-dialog" onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }}>
      <header className="store-checkout-header">
        <div className="store-checkout-brand"><Image src="/assets/site/server-logo.png" alt="Zo7al Network" width={40} height={40} /><span className="text-label">{t("checkoutTitle")}</span></div>
        <button type="button" onClick={close} aria-label={t("close")} className="store-close"><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="store-checkout-body">
        <div className="store-cart-heading"><CommerceIcon name="shopping-cart" size={26} aria-hidden="true"/><h2 id="checkout-title">{copy.title} <span>({cartIds.length})</span></h2></div>
        {!ident && <>
          {!cartIds.length ? <div className="store-cart-empty"><CommerceIcon name="shopping-cart" size={44} aria-hidden="true"/><p>{copy.empty}</p></div> : <ul className="store-cart-items">{cartIds.map((id, index) => {
            const product = cartProducts[index];
            return <li key={id}>
              {product?.image ? <Image unoptimized src={product.image} alt="" width={80} height={64}/> : <CommerceIcon name="shopping-cart" size={30} aria-hidden="true"/>}
              <div><h3 dir="auto">{product?.name ?? `#${id}`}</h3><p>{product ? <>{price(product)} <span>× {cartItems[index].quantity}</span></> : t("checkoutUnavailable")}</p>{product && isCoinProduct(product) && <QuantityControl name={product.name} quantity={cartItems[index].quantity} disabled={busy} decrease={copy.decrease} increase={copy.increase} onChange={delta => { changeQuantity(id, delta); setError(null); }}/>}{product && !product.available && <small>{t("checkoutUnavailable")}</small>}</div>
              <button type="button" disabled={busy} className="store-close" aria-label={`${copy.remove} — ${product?.name ?? id}`} title={copy.remove} onClick={() => { remove(id); setError(null); }}><CommerceIcon name="trash" size={18} aria-hidden="true"/></button>
            </li>;
          })}</ul>}
          {!!cartIds.length && <div className="store-cart-total"><span>{copy.subtotal}</span><strong dir="ltr">{totalsKnown ? [...totals].map(([currency, amount]) => new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount)).join(" + ") : t("pricePending")}</strong></div>}
          {cartIds.length >= 20 && <p className="store-checkout-description">{copy.limit}</p>}
          {cartUnavailable && !!cartIds.length && <p role="status" className="store-notice">{live ? copy.unavailable : t("checkoutUnavailable")}</p>}
          <button type="button" className="store-action store-cart-browse" onClick={close}>{copy.browse}</button>
        </>}
        <p id="checkout-description" className="store-checkout-description">{copy.note}</p>
        {!ident ? <form onSubmit={pay} className="store-checkout-form">
          <PlayerIdentity id="store-username" username={username} onChange={value => { setUsername(value); setError(null); }} required active={cartOpen}/>
          <p>{t("usernameHelp")}</p>
          <button disabled={!cartIds.length || busy || !sdkReady || sdkError || cartUnavailable || !cartReady} className="store-action store-action-primary store-pay" aria-busy={busy}>
            <span>{t(busy || !sdkReady ? "preparing" : "continuePayment")}</span>
            {busy || !sdkReady ? <LoaderCircle size={18} className="store-spinner" aria-hidden="true" /> : <ArrowRight size={18} className="store-direction" aria-hidden="true" />}
          </button>
        </form> : ident ? <div ref={embed} className="store-checkout-embed" /> : null}
        {paymentStatus === "checking" && <p role="status" className="store-notice">{t("paymentChecking")}</p>}
        {paymentStatus === "pending" && <p role="status" className="store-notice">{t("paymentPending")}</p>}
        {(error || sdkError) && <p role="alert" className="store-notice store-checkout-error"><AlertCircle size={18} aria-hidden="true" /><span>{errorPackage && <><bdi>{products.find(product => product.id === errorPackage)?.name ?? `#${errorPackage}`}</bdi><br/></>}{error === "oneRank" ? copy.oneRank : t(error ?? "paymentError")}{error === "alreadyOwned" && <><br />{subscriptionLink}</>}</span></p>}
      </div>
      <footer className="store-checkout-footer"><ShieldCheck size={16} aria-hidden="true" /><p>{t("allPurchases")}</p></footer>
    </dialog>
  </>;
}

function QuantityControl({ name, quantity, disabled, decrease, increase, onChange, removeLabel, onRemove }: { name: string; quantity: number; disabled: boolean; decrease: string; increase: string; onChange: (delta: number) => void; removeLabel?: string; onRemove?: () => void }) {
  return <div className="store-quantity" dir="ltr" role="group" aria-label={name}>
    <button type="button" disabled={disabled} aria-label={`${decrease} — ${name}`} onClick={() => onChange(-1)} data-cursor="button"><Minus size={17} aria-hidden="true"/></button>
    <output aria-live="polite">{quantity}</output>
    <button type="button" disabled={disabled || quantity >= MAX_COIN_QUANTITY} aria-label={`${increase} — ${name}`} onClick={() => onChange(1)} data-cursor="button"><Plus size={17} aria-hidden="true"/></button>
    {onRemove && <button type="button" disabled={disabled} className="store-quantity-remove" aria-label={`${removeLabel} — ${name}`} title={removeLabel} onClick={onRemove} data-cursor="button"><CommerceIcon name="trash" size={17}/></button>}
  </div>;
}
