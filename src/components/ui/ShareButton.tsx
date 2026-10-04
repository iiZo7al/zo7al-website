"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Share2 } from "lucide-react";
import { shareLink } from "@/lib/browser/share";

export default function ShareButton({ path }: { path: string }) {
  const t = useTranslations("hub"), common = useTranslations("common");
  const [copied, setCopied] = useState(false), [manual, setManual] = useState("");
  const lock = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <span className="hub-share">
    <button type="button" className="store-action store-details-button hub-share-button" data-cursor="button" aria-label={copied ? common("copied") : t("share")} title={copied ? common("copied") : t("share")} onClick={async () => {
      if (lock.current) return; lock.current = true;
      try {
        const url = new URL(path, window.location.origin).href, result = await shareLink(url, document.title);
        if (result === "manual") setManual(url);
        if (result === "copied") { setManual(""); setCopied(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2400); }
      } finally { lock.current = false; }
    }}>{copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}</button>
    {copied && <span className="sr-only" role="status">{common("copied")}</span>}
    {manual && <label className="hub-share-fallback">{t("copyLink")}<input value={manual} readOnly dir="ltr" aria-label={t("copyLink")} onFocus={event => event.currentTarget.select()} /></label>}
  </span>;
}
