"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import MagneticButton from "@/components/cursor/MagneticButton";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import SolarRoster from "./SolarRoster";
import SolarSponsor from "./SolarSponsor";
import SolarMapCard from "./SolarMapCard";
import SolarSocials from "./SolarSocials";
import SolarApplyModal from "./SolarApplyModal";
import type { SolarRole } from "@/lib/data/solar";
import "@/components/fortnite/fortnite.css";
import "@/components/store/store.css";

export default function SolarClient() {
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SolarRole>("creator");
  const [settings, setSettings] = useState<{
    isOpen: boolean;
    announcement: string;
    closedRoles: SolarRole[];
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
        eyebrow="كلان سولار • CLAN RECRUITMENT & COMMUNITY"
        title="Solar System Team"
        text="الصفحة الرسمية لكلان Solar System Team بقيادة زحل Zo7al. انضم لنخبة صناع المحتوى واللاعبين التنافسيين وطاقم الإشراف والمونتاج، وتحدّ في ماب الكلان الرسمي."
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
                {settings && !settings.isOpen ? "التقديم مغلق حالياً" : "قدّم للانضمام للكلان"}
              </button>
            </MagneticButton>

            <a
              href="#clan-map"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="map" size={14} />
              ماب الكلان
            </a>

            <a
              href="#sponsor"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="headset" size={14} />
              راعي الكلان
            </a>

            <a
              href="#socials"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              <SolidIcon name="share" size={14} />
              حسابات الكلان
            </a>
          </div>
        </div>
      </PageHero>

      {/* Section 1: Divisions Section */}
      <section className="relative pb-24 sm:pb-32" id="divisions">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader
            eyebrow="الهيكل الإداري والتنافسي"
            title="أقسام الكلان"
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
            eyebrow="الشريك والراعي الرسمي"
            title="راعي الكلان"
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
            eyebrow="الماب الرسمي • UEFN"
            title="ماب حرب الكلانات"
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
              حسابات وقنوات الكلان الرسمية
            </p>
            <a
              href="https://linktr.ee/SolarSystemTeam"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <BrandIcon slug="linktree" size={16} />
              عرض على Linktree
              <SolidIcon name="arrow-up-right" size={12} />
            </a>
          </div>
          <SolarSocials />
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
