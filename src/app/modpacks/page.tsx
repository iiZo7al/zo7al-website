import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import ModpackGallery from "@/components/modpacks/ModpackGallery";
import CurseForgeGallery from "@/components/modpacks/CurseForgeGallery";
import { getSyncedCurseForgeProjects } from "@/lib/sync/curseforge";

export const metadata: Metadata = {
  title: "Modpacks — ZO7AL Projects",
  description: "Explore Minecraft projects created by Zo7al.",
};

export const revalidate = 21600; // 6 hours

export default async function ModpacksPage() {
  const [t, { items, source }] = await Promise.all([
    getTranslations("modpacks"),
    getSyncedCurseForgeProjects(),
  ]);

  return (
    <main data-accent="modpacks">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")} />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("modrinthEyebrow")} title={t("modrinthTitle")} />
          <div className="mt-14">
            <ModpackGallery />
          </div>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("curseforgeEyebrow")} title={t("curseforgeTitle")} />
          <div className="mt-14">
            <CurseForgeGallery projects={items} source={source} />
          </div>
        </div>
      </section>
    </main>
  );
}
