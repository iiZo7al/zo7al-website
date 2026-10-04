"use client";
import { useTranslations } from "next-intl";
import FaqAccordion,{type FaqItem} from "@/components/faq/FaqAccordion";
import SectionHeader from "@/components/ui/SectionHeader";
export default function CommonErrors() {
  const t=useTranslations("hub"),faq=useTranslations("faq"),common=useTranslations("common");
  return <section id="common-errors" className="relative overflow-hidden border-t py-28 sm:py-36 scroll-mt-24" style={{borderColor:"var(--border)"}}><div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]" style={{background:"var(--glow)"}}/></div><div className="relative mx-auto max-w-[820px] px-6"><SectionHeader align="center" eyebrow="ZO7AL NETWORK" title={t("commonErrorsTitle")} text={t("commonErrorsIntro")}/><div className="mt-14"><FaqAccordion items={t.raw("commonErrors") as FaqItem[]} categories={{connection:t("connection"),store:t("store"),modpacks:t("modpacks")}} searchPlaceholder={faq("searchPlaceholder")} noResults={faq("noResults")} allLabel={common("all")}/></div></div></section>;
}
