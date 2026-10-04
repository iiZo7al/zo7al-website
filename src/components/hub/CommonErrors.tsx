"use client";
import { useTranslations } from "next-intl";
import FaqAccordion,{type FaqItem} from "@/components/faq/FaqAccordion";
export default function CommonErrors() {
  const t=useTranslations("hub"),faq=useTranslations("faq"),common=useTranslations("common");
  return <section id="common-errors" className="hub-section scroll-mt-28"><div className="hub-section-inner max-w-[820px]"><h2 className="hub-heading">{t("commonErrorsTitle")}</h2><FaqAccordion items={t.raw("commonErrors") as FaqItem[]} categories={{connection:t("connection"),store:t("store"),modpacks:t("modpacks")}} searchPlaceholder={faq("searchPlaceholder")} noResults={faq("noResults")} allLabel={common("all")}/></div></section>;
}
