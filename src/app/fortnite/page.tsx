import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import MapGallery from "@/components/fortnite/MapGallery";
import MagneticButton from "@/components/cursor/MagneticButton";
import { FORTNITE_PROFILE_URL } from "@/lib/data/fortnite";
import { getSyncedFortniteMaps } from "@/lib/sync/fortnite";

export const metadata: Metadata = {
  title: "Fortnite Creative — ZO7AL Projects",
  description: "Maps and experiences built by Zo7al.",
};

export const revalidate = 21600; // 6 hours

export default async function FortnitePage() {
  const [t, { items, source }] = await Promise.all([
    getTranslations("fortnite"),
    getSyncedFortniteMaps(),
  ]);

  return (
    <main data-accent="fortnite">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}>
        <MagneticButton>
          <a
            href={FORTNITE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="button"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#07080B" }}
          >
            {t("creatorPage")} ↗
          </a>
        </MagneticButton>
      </PageHero>

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("islandsEyebrow")} title={t("islandsTitle")} />
          <div className="mt-14">
            <div className="mb-8 flex items-center justify-end">
              <p className="text-label">{source === "live" ? t("islandsLiveLabel") : t("islandsLabel")}</p>
            </div>
            <MapGallery maps={items} />
          </div>
        </div>
      </section>
    </main>
  );
}
