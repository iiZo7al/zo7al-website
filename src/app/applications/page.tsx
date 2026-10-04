import TrackingPanel from "@/components/hub/TrackingPanel";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("applications")} text={t("applicationsIntro")}/><div className="hub-page-inner"><TrackingPanel kind="application"/></div></main>;}
