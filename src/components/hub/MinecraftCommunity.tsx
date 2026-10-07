"use client";
import { useLocale,useTranslations } from "next-intl";
import SectionHeader from "@/components/ui/SectionHeader";
import ContentFeed from "./ContentFeed";
import PlayerProfile from "./PlayerProfile";
import MinecraftLeaderboard from "@/components/community/MinecraftLeaderboard";
import CommunitySections from "@/components/community/CommunitySections";
import { communityCopy } from "@/lib/data/community-copy";
import CommunityNews from "@/components/community/CommunityNews";
export default function MinecraftCommunity() {
  const t = useTranslations("hub");
  const c = communityCopy(useLocale());
  return <>
    <section id="player" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("player")} text={t("playerIntro")} /><div className="mt-14"><PlayerProfile /></div></div></section>
    <section id="news" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("news")} text={t("newsIntro")} /><div className="mt-14"><CommunityNews topic="minecraft" /></div></div></section>
    <section id="events" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("events")} text={t("eventsIntro")} /><div className="mt-14"><ContentFeed kind="event" topic="minecraft" limit={3} moreHref="/events" /></div></div></section>
    <CommunitySections topic="minecraft" />
    <section id="leaderboard" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={c.leaderboard} text={c.leadersIntro}/><div className="mt-14"><MinecraftLeaderboard/></div></div></section>
  </>;
}
