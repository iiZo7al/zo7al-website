"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReceiptKind } from "@/lib/data/hub-receipts";
export default function Receipt({ kind,reference,token }: { kind: ReceiptKind; reference:string; token:string }) {
  const t=useTranslations("hub"),common=useTranslations("common");
  const [copied,setCopied]=useState(false);
  const href=kind==="order"?"/orders":kind==="application"?"/applications":`/tracking?type=${kind}`;
  return <div className="hub-receipt" role="status"><strong>{t("received")}</strong><p className="hub-muted">{t("receiptHelp")}</p><code dir="ltr">{t("reference")}: {reference}</code><code dir="ltr">{t("accessCode")}: {token}</code><div className="hub-actions"><button type="button" className="hub-button" onClick={async()=>{try{await navigator.clipboard.writeText(reference+"\n"+token);setCopied(true);}catch{}}}>{common(copied?"copied":"copy")}</button><Link href={href} className="hub-button">{t("track")}</Link></div></div>;
}
