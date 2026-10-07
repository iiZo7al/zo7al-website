"use client";
import { useTranslations } from "next-intl";
import FaqAccordion,{type FaqItem} from "@/components/faq/FaqAccordion";
export default function CommonErrors() {
  const t=useTranslations("hub"),faq=useTranslations("faq"),common=useTranslations("common");
  return <div id="common-errors" className="scroll-mt-24"><FaqAccordion items={t.raw("commonErrors") as FaqItem[]} categories={{connection:t("connection"),store:t("store"),modpacks:t("modpacks")}} searchPlaceholder={faq("searchPlaceholder")} noResults={faq("noResults")} allLabel={common("all")} initiallyOpen={false}/></div>;
}
