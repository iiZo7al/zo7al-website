import SupportCenter from "@/components/hub/SupportCenter";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("support")} text={t("supportIntro")}/><div className="hub-page-inner"><SupportCenter/></div></main>;}
