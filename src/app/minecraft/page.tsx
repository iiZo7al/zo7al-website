import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import ServerStatus from "@/components/minecraft/ServerStatus";
import ServerConnect from "@/components/minecraft/ServerConnect";
import VersionTimeline from "@/components/minecraft/VersionTimeline";
import ModesGrid from "@/components/minecraft/ModesGrid";
import MagneticButton from "@/components/cursor/MagneticButton";
import { MINECRAFT_SERVER } from "@/lib/data/minecraft";

export const metadata: Metadata = {
  title: "Minecraft — ZO7AL Projects",
  description: "Your next Minecraft adventure starts here.",
};

export default async function MinecraftPage() {
  const t = await getTranslations("minecraft");

  return (
    <main data-accent="minecraft">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}>
        <MagneticButton>
          <a
            href={MINECRAFT_SERVER.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="button"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#07080B" }}
          >
            {t("openStore")}
          </a>
        </MagneticButton>
      </PageHero>

      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <ServerStatus />
          </Reveal>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("connectEyebrow")} title={t("connectTitle")} text={t("connectText")} />
          <div className="mt-14">
            <ServerConnect />
          </div>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("compatEyebrow")} title={t("compatTitle")} />
          <div className="mt-14">
            <VersionTimeline />
          </div>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("gameplayEyebrow")} title={t("gameplayTitle")} />
          <div className="mt-14">
            <ModesGrid />
          </div>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal className="text-center" y={20}>
            <div style={{ background: "var(--surface)", borderColor: "var(--border)" }} className="rounded-3xl border p-10 sm:p-16">
              <p className="text-label mb-4" style={{ color: "var(--accent)" }}>
                {t("supportEyebrow")}
              </p>
              <h2 className="text-display text-4xl sm:text-5xl">{t("supportTitle")}</h2>
              <p className="mt-5 mx-auto max-w-md text-lg text-[var(--text-muted)]">
                {t("supportText")}
              </p>
              <div className="mt-8">
                <MagneticButton>
                  <a
                    href={MINECRAFT_SERVER.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="button"
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                    style={{ background: "var(--accent)", color: "#07080B" }}
                  >
                    {t("openStore")} →
                  </a>
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
