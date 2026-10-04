import ContentFeed from "@/components/hub/ContentFeed";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("events")} text={t("eventsIntro")}/><div className="hub-page-inner"><ContentFeed kind="event"/></div></main>;}
