"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import QueryObserver from "./QueryObserver";
export default function StoreActivity() {
  const t = useTranslations("hub"), router = useRouter();
  const queryChanged = useCallback((value: string | null) => {
    if (value && ["orders", "applications", "support", "events"].includes(value)) router.replace(`/requests?tab=${value}`);
  }, [router]);
  return <><QueryObserver param="activity" onChange={queryChanged}/><Link href="/requests" data-cursor="link" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-7 py-3.5 text-sm font-semibold"><History size={17} aria-hidden="true"/>{t("activity")}</Link></>;
}
