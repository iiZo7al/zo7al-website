"use client";
import AccountSubmission from "@/components/account/AccountSubmission";
import { useAccount } from "@/components/account/AccountProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Clock3,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import type { ReceiptKind, SavedReceipt } from "@/lib/data/hub-receipts";
type Result = {
  status: string;
  note?: string;
  delivery?: string;
  username?: string;
  createdAt: string;
  platform?: string;
  eventTitle?: string;
  title?: string;
};
export default function TrackingPanel({ kind }: { kind: ReceiptKind }) {
  const t = useTranslations("hub"),
    locale = useLocale(),
    { account } = useAccount();
  const accountId = account?.id;
  const [rows, setRows] = useState<SavedReceipt[]>([]),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      setRows([]);
      setResult(null);
      setError(false);
      if (accountId) setBusy(true);
    });
    if (accountId)
      void fetch("/api/account/receipts", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw Error();
          const data = await response.json();
          if (!controller.signal.aborted)
            setRows(data.receipts.filter((r: SavedReceipt) => r.kind === kind));
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    return () => controller.abort();
  }, [accountId, kind, version]);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(value),
    );
  return (
    <AccountSubmission
      next={
        "/requests?tab=" +
        {
          order: "orders",
          application: "applications",
          gallery: "gallery",
          support: "support",
          event: "events",
        }[kind]
      }
    >
      <div className="requests-tracking">
        <div className="hub-card requests-saved">
          <div className="flex items-center justify-between gap-3">
            <h3 className="requests-card-heading">
              <Clock3 size={19} />
              {t("savedRequests")}
              <span className="requests-count">{rows.length}</span>
            </h3>
            <button
              type="button"
              className="hub-button"
              aria-label={t("refresh")}
              disabled={busy}
              onClick={() => setVersion((v) => v + 1)}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {error && (
            <p className="hub-error" role="alert">
              {t("unavailable")}
            </p>
          )}
          {rows.length ? (
            <ul className="requests-saved-list">
              {rows.map((row) => (
                <li key={row.reference}>
                  <button
                    type="button"
                    className="requests-saved-item"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(false);
                      try {
                        const response = await fetch("/api/tracking", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            kind,
                            reference: row.reference,
                            token: "",
                          }),
                        });
                        if (!response.ok) throw Error();
                        setResult(await response.json());
                      } catch {
                        setError(true);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <FileSearch size={18} />
                    <span>
                      <strong>
                        {row.title ||
                          t(
                            kind === "order"
                              ? "orders"
                              : kind === "application"
                                ? "applications"
                                : kind === "gallery"
                                  ? "submissions"
                                  : kind === "event"
                                    ? "registrations"
                                    : "support",
                          )}
                      </strong>
                      <time dateTime={row.savedAt}>{date(row.savedAt)}</time>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="requests-empty">
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <FileSearch size={34} />
              )}
              <p>{t(busy ? "loading" : "noSavedRequests")}</p>
            </div>
          )}
        </div>
        <div aria-live="polite" aria-busy={busy}>
          {result && (
            <article className="hub-card requests-result">
              <div className="requests-result-top">
                <h3>
                  {result.title ??
                    result.eventTitle ??
                    result.username ??
                    result.platform ??
                    t("status")}
                </h3>
                <span className="hub-status">
                  {t.has("status_" + result.status)
                    ? t("status_" + result.status)
                    : t("status_unknown")}
                </span>
              </div>
              <p className="hub-muted mt-4">
                <time dateTime={result.createdAt}>
                  {date(result.createdAt)}
                </time>
              </p>
              {result.note && (
                <p className="requests-result-note" dir="auto">
                  {result.note}
                </p>
              )}
              {kind === "order" && (
                <>
                  <p className="hub-muted mt-4">{t("paymentDeliveryNote")}</p>
                  <p>
                    {t("delivery")}:{" "}
                    {t.has("delivery_" + result.delivery)
                      ? t("delivery_" + result.delivery)
                      : t("delivery_unknown")}
                  </p>
                  <div className="hub-actions mt-4">
                    <Link href="/support" className="hub-button">
                      {t("orderSupport")}
                    </Link>
                    <a
                      href="https://portal.tebex.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hub-button"
                    >
                      {t("subscriptions")}
                    </a>
                  </div>
                </>
              )}
            </article>
          )}
        </div>
      </div>
    </AccountSubmission>
  );
}
