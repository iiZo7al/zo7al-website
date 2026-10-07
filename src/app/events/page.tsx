import ContentFeed from "@/components/hub/ContentFeed";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
export default async function Page({searchParams}:{searchParams:Promise<{topic?:string}>}) {
  const [t,params]=await Promise.all([getTranslations("hub"),searchParams]);
  const topic=params.topic==="fortnite"?"fortnite":"minecraft",fortnite=topic==="fortnite";
  return <main data-accent={topic}><PageHero eyebrow={fortnite?"FORTNITE CREATIVE":"ZO7AL NETWORK"} title={t(fortnite?"fortniteEvents":"events")} text={t(fortnite?"fortniteEventsIntro":"eventsIntro")}/><div className="hub-page-inner"><ContentFeed kind="event" topic={topic}/></div></main>;
}
