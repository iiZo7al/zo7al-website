import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import RequestActivity from "@/components/hub/RequestActivity";
export const metadata: Metadata = {
  title: "My requests and applications — Zo7al Projects",
  description: "Track orders, creator applications, support requests and event registrations.",
  robots: { index: false, follow: true },
};
export default async function RequestsPage() {
  const t = await getTranslations("hub");
  return <main data-accent="minecraft"><PageHero eyebrow="ZO7AL PROJECTS" title={t("activity")} text={t("activityIntro")}/><section className="relative pb-20 sm:pb-28"><div className="mx-auto max-w-[1180px] px-6"><RequestActivity/></div></section></main>;
}
