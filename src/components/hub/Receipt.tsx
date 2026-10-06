"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { copyText } from "@/lib/browser/share";
import type { ReceiptKind } from "@/lib/data/hub-receipts";
export default function Receipt({ kind,reference,token,onTrack }: { kind: ReceiptKind; reference:string; token:string; onTrack?:()=>void }) {
  const t=useTranslations("hub"),common=useTranslations("common");
  const [copied,setCopied]=useState(false);
  const href="/requests?tab="+(kind==="order"?"orders":kind==="application"?"applications":kind==="event"?"events":"support");
  return <div className="hub-receipt" role="status"><strong>{t("received")}</strong><p className="hub-muted">{t("receiptHelp")}</p><code dir="ltr">{t("reference")}: {reference}</code><code dir="ltr">{t("accessCode")}: {token}</code><div className="hub-actions"><button type="button" className="hub-button" onClick={async()=>{if(await copyText(reference+"\n"+token))setCopied(true);}}>{common(copied?"copied":"copy")}</button><Link href={href} onClick={onTrack} className="hub-button">{t("track")}</Link></div></div>;
}
