"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
export default function OAuthResult({ provider }: { provider: "youtube" | "modrinth" }) {
  const t = useTranslations("oauth"), [result, setResult] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href), status = url.searchParams.get("oauth");
    if (url.searchParams.get("view") !== provider || !status || !["connected", "cancelled", "failed"].includes(status)) return;
    queueMicrotask(() => setResult(status));
    url.searchParams.delete("oauth"); window.history.replaceState(null, "", url.href);
  }, [provider]);
  return result ? <p className={"dash-notice " + (result === "connected" ? "dash-success" : "hub-error")} role="status">{result === "connected" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{t("result_" + result)}</span></p> : null;
}
