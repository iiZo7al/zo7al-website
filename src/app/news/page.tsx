import ContentFeed from "@/components/hub/ContentFeed";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("news")} text={t("newsIntro")}/><div className="hub-page-inner"><ContentFeed kind="news"/></div></main>;}
