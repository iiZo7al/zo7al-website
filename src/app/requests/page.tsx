import {localizedPageMetadata} from "@/lib/server/page-metadata";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import RequestActivity from "@/components/hub/RequestActivity";
export async function generateMetadata(){return localizedPageMetadata("hub.activity","hub.activityIntro",{index:false,follow:true});}
export default async function RequestsPage() {
  const t = await getTranslations("hub");
  return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL PROJECTS" title={t("activity")} text={t("activityIntro")}/><section className="relative pb-20 sm:pb-28"><div className="mx-auto max-w-[1180px] px-6"><RequestActivity/></div></section></main>;
}
