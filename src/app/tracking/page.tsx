import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import TrackingPanel from "@/components/hub/TrackingPanel";
export const metadata={robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){const t=await getTranslations("hub");const {type}=await searchParams;const kind=type==="event"?"event":type==="application"?"application":type==="order"?"order":"support";return <main><PageHero eyebrow="ZO7AL NETWORK" title={t("track")} text={t("trackingHelp")}/><div className="hub-page-inner"><TrackingPanel kind={kind}/></div></main>;}
