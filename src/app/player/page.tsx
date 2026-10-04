import PlayerProfile from "@/components/hub/PlayerProfile";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page(){const t=await getTranslations("hub");return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL NETWORK" title={t("player")} text={t("playerIntro")}/><div className="hub-page-inner"><PlayerProfile/></div></main>;}
