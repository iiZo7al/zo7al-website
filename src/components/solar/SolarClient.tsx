"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import MagneticButton from "@/components/cursor/MagneticButton";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import FaqAccordion from "@/components/faq/FaqAccordion";
import SolarRoster from "./SolarRoster";
import SolarSponsor from "./SolarSponsor";
import SolarMapCard from "./SolarMapCard";
import SolarSocials from "./SolarSocials";
import SolarClanMembers from "./SolarClanMembers";
import SolarApplyModal from "./SolarApplyModal";
import { solarCopy } from "@/lib/data/solar-copy";
import { getSolarFaq } from "@/lib/data/solar-faq";
import type { SolarAdminSubType, SolarRole } from "@/lib/data/solar";
import "@/components/fortnite/fortnite.css";
import "@/components/store/store.css";

export default function SolarClient() {
  const locale = useLocale();
  const faqT = useTranslations("faq");
  const commonT = useTranslations("common");
  const t = solarCopy(locale);
  const solarFaq = getSolarFaq(locale);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SolarRole>("creator");
  const [settings, setSettings] = useState<{
    isOpen: boolean;
    announcement: string;
    closedRoles: SolarRole[];
    closedAdminSubTypes?: SolarAdminSubType[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/solar/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  return (
    <main data-accent="solar">
      {/* Standard Site Page Hero with Clan Logo */}
      <PageHero
        eyebrow={t.heroEyebrow}
        title={t.heroTitle}
        text={t.heroText}
      >
        <div className="space-y-6">
          {/* Official Clan 3D Logo */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden drop-shadow-[0_12px_24px_rgba(255,122,0,0.35)]">
              <Image
                src="/assets/site/solar-clan-logo.png"
                alt="Solar System Team Logo"
                width={96}
                height={96}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Announcement banner if set by admin */}
          {settings?.announcement && (
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text)]"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
            >
              <SolidIcon name="trophy" size={14} className="text-[var(--accent)] shrink-0" />
              <span>{settings.announcement}</span>
            </div>
          )}

          {/* Action buttons with icons (NO emojis) */}
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("creator");
                  setApplyOpen(true);
                }}
                data-cursor="button"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#07080B" }}
              >
                <SolidIcon name="trophy" size={14} />
                {settings && !settings.isOpen ? t.applyClosedBtn : t.applyBtn}
              </button>
            </MagneticButton>

            <a
              href="#clan-map"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="map" size={14} />
              {t.mapBtn}
            </a>

            <a
              href="#sponsor"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="headset" size={14} />
              {t.sponsorBtn}
            </a>

            <a
              href="#socials"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="share" size={14} />
              {t.socialsBtn}
            </a>
          </div>
        </div>
      </PageHero>

      {/* Section 1: Divisions Section */}
      <section className="relative pb-24 sm:pb-32" id="divisions">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow={t.divisionsEyebrow}
            title={t.divisionsTitle}
          />
          <div className="mt-14">
            <SolarRoster
              onOpenApply={(role) => {
                setSelectedRole(role);
                setApplyOpen(true);
              }}
            />
          </div>
        </div>
      </section>

      {/* Section 2: Clan Sponsor Section */}
      <section className="relative pb-24 sm:pb-32" id="sponsor">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow={t.sponsorEyebrow}
            title={t.sponsorTitle}
          />
          <div className="mt-14">
            <SolarSponsor />
          </div>
        </div>
      </section>

      {/* Section 3: Featured Clan Map Section (Matching /fortnite spotlight) */}
      <section className="relative pb-24 sm:pb-32" id="clan-map">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow={t.mapEyebrow}
            title={t.mapTitle}
          />
          <div className="mt-14">
            <SolarMapCard />
          </div>
        </div>
      </section>

      {/* Section 4: Clan Socials Section (Matching /socials) */}
      <section className="relative pb-24 sm:pb-32" id="socials">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-label flex items-center gap-2">
              <SolidIcon name="share" size={16} />
              {t.socialsEyebrow}
            </p>
            <a
              href="https://linktr.ee/SolarSystemTeam"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <BrandIcon slug="linktree" size={16} />
              {t.viewOnLinktree}
              <SolidIcon name="arrow-up-right" size={12} />
            </a>
          </div>
          <SolarSocials />
        </div>
      </section>

      {/* Section 5: Solar FAQ Section (Matching /minecraft Common Errors Accordion) */}
      <section
        className="relative border-t py-24 sm:py-32"
        style={{ borderColor: "var(--border)" }}
        id="faq"
      >
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow={solarFaq.eyebrow}
            title={solarFaq.title}
            text={solarFaq.text}
          />
          <div className="mt-14">
            <FaqAccordion
              items={solarFaq.items}
              categories={solarFaq.categories}
              searchPlaceholder={faqT("searchPlaceholder")}
              noResults={faqT("noResults")}
              allLabel={commonT("all")}
              initiallyOpen={false}
              initialVisibleCount={4}
              showMoreLabel={commonT("viewMore")}
            />
          </div>
        </div>
      </section>

      {/* Section 6: Clan Members Section (Matching /minecraft Leaderboard) */}
      <section
        className="relative border-t py-24 sm:py-32"
        style={{ borderColor: "var(--border)" }}
        id="members"
      >
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow={locale === "ar" ? "فريق Solar System" : "SOLAR SYSTEM ROSTER"}
            title={locale === "ar" ? "أعضاء الكلان" : "Clan Members"}
            text={
              locale === "ar"
                ? "تعرّف على الأعضاء الموجودين حالياً في كلان Solar System ورتبهم وحساباتهم الرسمية."
                : "Meet the current members of Solar System Team, their clan ranks, and official social accounts."
            }
          />
          <div className="mt-14">
            <SolarClanMembers />
          </div>
        </div>
      </section>

      {/* Apply Modal */}
      <SolarApplyModal
        key={`${selectedRole}:${settings?.isOpen ?? true}`}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        initialRole={selectedRole}
        settings={settings}
      />
    </main>
  );
}
