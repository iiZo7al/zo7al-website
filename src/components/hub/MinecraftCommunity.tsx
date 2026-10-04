"use client";
import { useTranslations } from "next-intl";
import SectionHeader from "@/components/ui/SectionHeader";
import ContentFeed from "./ContentFeed";
import PlayerProfile from "./PlayerProfile";
import SupportCenter from "./SupportCenter";
export default function MinecraftCommunity() {
  const t = useTranslations("hub");
  return <>
    <section id="events" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("events")} text={t("eventsIntro")} /><div className="mt-14"><ContentFeed kind="event" limit={3} moreHref="/events" /></div></div></section>
    <section id="player" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("player")} text={t("playerIntro")} /><div className="mt-14"><PlayerProfile /></div></div></section>
    <section id="support" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL NETWORK" title={t("support")} text={t("supportIntro")} /><div className="mt-14"><SupportCenter /></div></div></section>
  </>;
}
