"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { youtubeOAuthErrors } from "@/lib/data/youtube-studio";
export default function OAuthResult({ provider }: { provider: "youtube" | "modrinth" }) {
  const t = useTranslations("oauth"), y = useTranslations("youtubeStudio"), [result, setResult] = useState(""), [reason, setReason] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href), status = url.searchParams.get("oauth");
    if (url.searchParams.get("view") !== provider || !status || !["connected", "cancelled", "failed"].includes(status)) return;
    const code = provider === "youtube" && status === "failed" ? youtubeOAuthErrors.find(value => value === url.searchParams.get("reason")) ?? "" : "";
    queueMicrotask(() => { setResult(status); setReason(code); });
    url.searchParams.delete("oauth"); url.searchParams.delete("reason"); window.history.replaceState(null, "", url.href);
  }, [provider]);
  return result ? <p className={"dash-notice " + (result === "connected" ? "dash-success" : "hub-error")} role="status">{result === "connected" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{reason ? y(reason) : t("result_" + result)}</span></p> : null;
}
