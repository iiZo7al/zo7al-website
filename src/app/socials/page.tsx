import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import PageHero from "@/components/ui/PageHero";
import SocialGrid from "@/components/socials/SocialGrid";
import { getSyncedSocials, getSyncedGamesSocials } from "@/lib/sync/socials";
import { getSocialPreviews } from "@/lib/sync/previews";

export const metadata: Metadata = {
  title: "Socials — ZO7AL Projects",
  description: "Follow the journey.",
};

export const revalidate = 21600; // 6 hours

export default async function SocialsPage() {
  const [t, { items, source }, previews, games] = await Promise.all([
    getTranslations("socials"),
    getSyncedSocials(),
    getSocialPreviews(),
    getSyncedGamesSocials(),
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
      <section className="border-t border-[var(--border)] py-20 sm:py-28" aria-labelledby="games-socials-title">
        <div className="mx-auto max-w-[1180px] px-6">
          <p className="text-label text-[var(--accent)]">{t("gamesEyebrow")}</p>
          <h2 id="games-socials-title" className="mt-3 text-4xl font-bold">Zo7al Games</h2>
          <p className="mt-4 max-w-xl text-[var(--text-muted)]">{t("gamesText")}</p>
          <div className="my-8 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--text-muted)]"><span className="text-label flex items-center gap-2"><SolidIcon name="share" size={16} />{games.source === "live" ? t("liveLabel") : t("label")}</span><a href="https://linktr.ee/Zo7alGames" target="_blank" rel="noopener noreferrer" data-cursor="link" className="flex items-center gap-2"><BrandIcon slug="linktree" size={16} />{t("viewOnLinktree")}<SolidIcon name="arrow-up-right" size={12} /></a></div>
          <SocialGrid socials={games.items} previews={{}} games />
        </div>
      </section>
    </main>
  );
}

