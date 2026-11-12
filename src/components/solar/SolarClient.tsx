"use client";

import { useState } from "react";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import MagneticButton from "@/components/cursor/MagneticButton";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import SolarRoster from "./SolarRoster";
import SolarMapCard from "./SolarMapCard";
import SolarSocials from "./SolarSocials";
import SolarApplyModal from "./SolarApplyModal";
import type { SolarRole } from "@/lib/data/solar";
import "@/components/fortnite/fortnite.css";
import "@/components/store/store.css";

export default function SolarClient() {
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SolarRole>("creator");

  return (
    <main data-accent="solar">
      {/* Standard Site Page Hero */}
      <PageHero
        eyebrow="كلان سولار • SOLAR SYSTEM TEAM"
        title="Solar Clan"
        text="الصفحة الرسمية لكلان Solar System Team بقيادة زحل Zo7al. انضم لنخبة صناع المحتوى واللاعبين التنافسيين والطاقم الإداري، وتحدّ في ماب الكلان الرسمي."
      >
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
              قدّم للانضمام للكلان ⚡
            </button>
          </MagneticButton>

          <a
            href="#clan-map"
            data-cursor="link"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            ماب الكلان 🎮
          </a>

          <a
            href="#socials"
            data-cursor="link"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            حسابات الكلان
          </a>
        </div>
      </PageHero>

      {/* Divisions Section */}
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

      {/* Featured Clan Map Section (Spotlight layout matching /fortnite) */}
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

      {/* Clan Socials Section (Matching /socials) */}
      <section className="relative pb-24 sm:pb-32" id="socials">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-label flex items-center gap-2">
              <SolidIcon name="share" size={16} />
              حسابات وقنوات الكلان الرسمية
            </p>
            <a
              href="https://linktr.ee/SolarClan"
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

      {/* CTA Join Section */}
      <section className="border-t border-[var(--border)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6 text-center">
          <p className="text-label text-[var(--accent)]">انضم إلى الفريق</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            مستعد لتكون جزءاً من Solar؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-muted)]">
            نفتح باب الانضمام لصناع المحتوى، الستريمرز، اللاعبين التنافسيين، المصممين، الممنتجين، والإداريين.
          </p>
          <div className="mt-8 flex justify-center">
            <MagneticButton>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("creator");
                  setApplyOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
                style={{ background: "var(--accent)", color: "#07080B" }}
              >
                فتح استمارة التقديم ⚡
              </button>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* Apply Modal */}
      <SolarApplyModal
        key={selectedRole}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        initialRole={selectedRole}
      />
    </main>
  );
}
