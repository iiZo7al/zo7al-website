"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, Images, Newspaper, Vote } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ContentFeed from "@/components/hub/ContentFeed";
import CommunitySections from "@/components/community/CommunitySections";
import CommunityNews from "@/components/community/CommunityNews";

export function FortniteCommunityLinks() {
  const t = useTranslations("hub");
  const links = [
    { id: "news", label: "fortniteNews", icon: Newspaper },
    { id: "events", label: "fortniteEvents", icon: CalendarDays },
    { id: "community-gallery", label: "fortniteCommunity", icon: Images },
    { id: "community-polls", label: "fortnitePolls", icon: Vote },
  ] as const;
  return <nav className="hub-actions mt-6" aria-label={t("fortniteCommunity")}>
      {links.map(({ id, label, icon: Icon }) => <a key={id} href={"#" + id} className="hub-button" data-cursor="button"><Icon size={17} aria-hidden="true"/>{t(label)}</a>)}
    </nav>;
}

export default function FortniteCommunity() {
  const t = useTranslations("hub");
  return <>
    <section id="news" className="hub-section scroll-mt-24">
      <div className="hub-section-inner">
        <SectionHeader eyebrow="FORTNITE CREATIVE" title={t("fortniteNews")} text={t("fortniteNewsIntro")}/>
        <div className="mt-14"><CommunityNews topic="fortnite"/></div>
      </div>
    </section>
    <section id="events" className="hub-section scroll-mt-24">
      <div className="hub-section-inner">
        <SectionHeader eyebrow="FORTNITE CREATIVE" title={t("fortniteEvents")} text={t("fortniteEventsIntro")}/>
        <div className="mt-14"><ContentFeed kind="event" topic="fortnite" limit={3} moreHref="/events?topic=fortnite"/></div>
      </div>
    </section>
    <CommunitySections topic="fortnite"/>
  </>;
}
