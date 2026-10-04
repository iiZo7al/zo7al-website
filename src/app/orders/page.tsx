import TrackingPanel from "@/components/hub/TrackingPanel";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("orders")} text={t("ordersIntro")}/><div className="hub-page-inner"><TrackingPanel kind="order"/></div></main>;}
