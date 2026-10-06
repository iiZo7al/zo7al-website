"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight, Clock3, FileSearch, KeyRound, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { RECEIPT_KEY, parseReceipts, type SavedReceipt, type ReceiptKind } from "@/lib/data/hub-receipts";

type Result = {
  reference: string; status: string; note?: string; delivery?: string; username?: string;
  createdAt: string; platform?: string; eventTitle?: string;
};

export default function TrackingPanel({ kind }: { kind: ReceiptKind }) {
  const t = useTranslations("hub");
  const locale = useLocale();
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active) return;
      try { setReceipts(parseReceipts(localStorage.getItem(RECEIPT_KEY)).filter(row => row.kind === kind)); } catch { setReceipts([]); }
    };
    queueMicrotask(load);
    window.addEventListener("storage", load);
    window.addEventListener("zo7al-receipts", load);
    return () => {
      active = false;
      request.current?.abort();
      window.removeEventListener("storage", load);
      window.removeEventListener("zo7al-receipts", load);
    };
  }, [kind]);

  async function track(id = reference, code = token) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/tracking", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ kind, reference: id.trim(), token: code.trim() }),
      });
      if (!response.ok) throw Error(response.status === 404 ? "notFound" : response.status === 429 ? "rateLimit" : "unavailable");
      const data: Result = await response.json();
      if (!controller.signal.aborted) setResult(data);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error && ["notFound", "rateLimit"].includes(failure.message) ? failure.message : "unavailable");
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const formatDate = (value: string, withTime = false) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}) }).format(new Date(value));
  return <div className="requests-tracking">
    <div className="requests-tracking-grid">
      <div className="hub-card requests-lookup">
        <h3 className="requests-card-heading"><Search size={19} aria-hidden="true"/>{t("track")}</h3>
        <p className="hub-muted mb-6">{t("trackingHelp")}</p>
        <form className="hub-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void track(); }}>
          <label>{t("reference")}<input dir="ltr" required value={reference} onChange={event => setReference(event.target.value)} minLength={36} maxLength={36} spellCheck={false} autoCapitalize="none" autoComplete="off" disabled={busy}/></label>
          <label><span className="requests-field-label"><KeyRound size={14} aria-hidden="true"/>{t("accessCode")}</span><input type="password" dir="ltr" required value={token} onChange={event => setToken(event.target.value)} minLength={64} maxLength={64} spellCheck={false} autoComplete="off" disabled={busy}/></label>
          <button type="submit" className="hub-button requests-track-button" data-cursor="button" disabled={busy}>{busy ? <LoaderCircle size={17} className="requests-spinner" aria-hidden="true"/> : <Search size={17} aria-hidden="true"/>}{t(busy ? "loading" : "track")}</button>
        </form>
        {error && <p role="alert" className="hub-error mt-4">{t(error)}</p>}
      </div>
      <aside className="hub-card requests-saved" aria-label={t("savedRequests")}>
        <h3 className="requests-card-heading"><Clock3 size={19} aria-hidden="true"/>{t("savedRequests")}<span className="requests-count">{receipts.length}</span></h3>
        {receipts.length ? <ul className="requests-saved-list">{receipts.map(receipt => <li key={receipt.reference}>
          <button className="requests-saved-item" type="button" data-cursor="button" disabled={busy} aria-pressed={reference === receipt.reference} onClick={() => { setReference(receipt.reference); setToken(receipt.token); void track(receipt.reference, receipt.token); }}>
            <FileSearch size={18} aria-hidden="true"/><span><bdi className="requests-reference">{receipt.reference}</bdi><time dateTime={receipt.savedAt}>{formatDate(receipt.savedAt)}</time></span><ArrowUpRight size={15} aria-hidden="true"/>
          </button>
        </li>)}</ul> : <div className="requests-empty"><FileSearch size={34} aria-hidden="true"/><p>{t("noSavedRequests")}</p></div>}
        <p className="requests-saved-note"><ShieldCheck size={16} aria-hidden="true"/><span>{t("receiptHelp")}</span></p>
      </aside>
    </div>
    <div aria-live="polite" aria-busy={busy}>
      {result && <article className="hub-card requests-result">
        <div className="requests-result-top"><div><p className="text-label">{t("status")}</p><h3>{result.eventTitle ?? result.username ?? result.platform ?? t("reference")}</h3></div><span className="hub-status">{t.has("status_" + result.status) ? t("status_" + result.status) : t("status_unknown")}</span></div>
        <dl className="requests-result-meta"><div><dt>{t("reference")}</dt><dd><bdi>{result.reference}</bdi></dd></div><div><dt><Clock3 size={14} aria-hidden="true"/></dt><dd><time dateTime={result.createdAt}>{formatDate(result.createdAt, true)}</time></dd></div></dl>
        {kind === "order" && <><p className="hub-muted">{t("paymentDeliveryNote")}</p><p>{t("delivery")}: {t.has("delivery_" + result.delivery) ? t("delivery_" + result.delivery) : t("delivery_unknown")}</p><div className="hub-actions"><Link href={`/support?order=${encodeURIComponent(result.reference)}`} className="hub-button" data-cursor="link">{t("orderSupport")}</Link><a href="https://portal.tebex.io/" className="hub-button" target="_blank" rel="noopener noreferrer" data-cursor="link">{t("subscriptions")}<ArrowUpRight size={15} aria-hidden="true"/></a></div></>}
        {result.note && <p dir="auto" className="requests-result-note">{result.note}</p>}
      </article>}
    </div>
  </div>;
}
