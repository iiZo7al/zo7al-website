import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import PageHero from "@/components/ui/PageHero";
import SocialGrid from "@/components/socials/SocialGrid";
import { getSyncedSocials } from "@/lib/sync/socials";
import { getSocialPreviews } from "@/lib/sync/previews";

export const metadata: Metadata = {
  title: "Socials — ZO7AL Projects",
  description: "Follow the journey.",
};

export const revalidate = 21600; // 6 hours

export default async function SocialsPage() {
  const [t, { items, source }, previews] = await Promise.all([
    getTranslations("socials"),
    getSyncedSocials(),
    getSocialPreviews(),
  ]);

  return (
    <main data-accent="socials">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")} />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-label flex items-center gap-2"><SolidIcon name="share" size={16} />{source === "live" ? t("liveLabel") : t("label")}</p>
            <a
              href="https://linktr.ee/Zo7al"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <BrandIcon slug="linktree" size={16} />{t("viewOnLinktree")}<SolidIcon name="arrow-up-right" size={12} />
            </a>
          </div>
          <SocialGrid socials={items} previews={previews} />
        </div>
      </section>
    </main>
  );
}

