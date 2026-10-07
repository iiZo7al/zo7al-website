import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import SupportCenter from "@/components/hub/SupportCenter";
import CommonErrors from "@/components/hub/CommonErrors";

export const metadata: Metadata = {
  title: "Support",
  description: "Find answers or contact the Zo7al Projects support team.",
};

export default async function SupportPage() {
  const t = await getTranslations("hub");
  return (
    <main data-accent="minecraft">
      <PageHero eyebrow="ZO7AL PROJECTS" title={t("support")} text={t("supportIntro")} />
      <section id="support" className="relative pb-20 sm:pb-28 scroll-mt-24">
        <div className="mx-auto max-w-[1180px] px-6">
          <SupportCenter />
        </div>
      </section>
      <CommonErrors />
    </main>
  );
}
