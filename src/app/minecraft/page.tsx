import CommonErrors from "@/components/hub/CommonErrors";
import MinecraftCommunity from "@/components/hub/MinecraftCommunity";
import ProjectExtras,{ProjectStatus} from "@/components/community/ProjectExtras";
import LinkHub from "@/components/hub/MinecraftHubLinks";
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
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Minecraft",
  description: "Your next Minecraft adventure starts here.",
};

export default async function MinecraftPage() {
  const t = await getTranslations("minecraft");

  return (
    <main data-accent="minecraft">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}>
        <div className="flex flex-wrap items-center gap-6">
        <Image src="/assets/site/server-logo.png" width={208} height={198} alt="Z7" className="h-14 w-auto" priority />
        <ProjectStatus projectKey="minecraft:network"/>
        <MagneticButton>
          <Link
            href="/store"
            data-cursor="button"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#07080B" }}
          >
            {t("openStore")}
          </Link>
        </MagneticButton>
        </div>
        <LinkHub />
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
            <ProjectExtras projectKey="minecraft:network" title="Zo7al Network"/>
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

      <CommonErrors />
      <MinecraftCommunity />
    </main>
  );
}
