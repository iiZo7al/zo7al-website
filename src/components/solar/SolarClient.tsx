"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/cursor/MagneticButton";
import SectionHeader from "@/components/ui/SectionHeader";
import SolarMapCard from "./SolarMapCard";
import SolarRoster from "./SolarRoster";
import SolarSocials from "./SolarSocials";
import SolarApplyModal from "./SolarApplyModal";
import "./solar.css";

export default function SolarClient() {
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <div className="relative overflow-hidden" data-accent="solar">
      {/* Ambient background glow */}
      <div className="solar-hero-glow" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-[1180px] px-6 text-center" dir="rtl">
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="solar-badge">Solar System Team ☀️</span>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
              كلان <span className="text-amber-400">Solar</span> الرسمي
              <br />
              نخبة المبدعين والمحترفين
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              المجتمع التنافسي والترفيهي التابع لشبكة زحل Zo7al. نجمع صناع المحتوى،
              الستريمرز، واللاعبين التنافسيين في فورتنايت وروكيت ليق وفيفا وماينكرافت.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton>
                <button
                  type="button"
                  onClick={() => setApplyOpen(true)}
                  data-cursor="button"
                  className="solar-btn-primary py-3.5 px-8 text-sm"
                >
                  قدّم للانضمام للكلان 🚀
                </button>
              </MagneticButton>

              <MagneticButton>
                <a
                  href="#clan-map"
                  data-cursor="link"
                  className="solar-btn-secondary py-3.5 px-7 text-sm"
                >
                  ماب الكلان 🎮
                </a>
              </MagneticButton>

              <MagneticButton>
                <a
                  href="#socials"
                  data-cursor="link"
                  className="solar-btn-secondary py-3.5 px-7 text-sm"
                >
                  حسابات الكلان 🌐
                </a>
              </MagneticButton>
            </div>
          </Reveal>

          {/* Quick Stats Grid */}
          <Reveal delay={0.2}>
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
              <div className="solar-stat-box">
                <span className="solar-stat-num">50+</span>
                <span className="solar-stat-label">أعضاء ومبدعين</span>
              </div>
              <div className="solar-stat-box">
                <span className="solar-stat-num">4</span>
                <span className="solar-stat-label">فرق تنافسية معتمدة</span>
              </div>
              <div className="solar-stat-box">
                <span className="solar-stat-num">9</span>
                <span className="solar-stat-label">منصات تواصل نشطة</span>
              </div>
              <div className="solar-stat-box">
                <span className="solar-stat-num">100%</span>
                <span className="solar-stat-label">مجتمع عربي متفاعل</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Clan Map Section */}
      <section className="relative border-t border-[var(--border)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-12">
            <SectionHeader
              eyebrow="FORTNITE CLAN MAP"
              title="ماب كلان Solar الرسمي"
              text="تدرّب وتحدّ الكلانات في جزيرة فورتنايت الرسمية المصنوعة بـ UEFN خصيصاً لمجتمعنا."
            />
          </div>
          <SolarMapCard />
        </div>
      </section>

      {/* Roster & Divisions */}
      <section className="relative border-t border-[var(--border)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-12">
            <SectionHeader
              eyebrow="SOLAR DIVISIONS"
              title="قيادة وأقسام الكلان"
              text="تعرف على أقسام الكلان وفرقنا، واختر المجال المناسب لمهاراتك للتقديم عليه."
            />
          </div>
          <SolarRoster onOpenApply={() => setApplyOpen(true)} />
        </div>
      </section>

      {/* Social Accounts Section */}
      <section id="socials" className="relative border-t border-[var(--border)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-12">
            <SectionHeader
              eyebrow="OFFICIAL CHANNELS"
              title="حسابات كلان Solar الرسمية"
              text="تابع آخر أخبارنا وبثوثنا ومقاطعنا عبر كافة المنصات الرسمية لكلان Solar System Team."
            />
          </div>
          <SolarSocials />
        </div>
      </section>

      {/* CTA Join Section */}
      <section className="relative border-t border-[var(--border)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-6" dir="rtl">
          <div className="solar-card text-center p-8 sm:p-14 border-[var(--solar-border)] bg-gradient-to-b from-amber-950/20 to-black">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <span className="text-2xl">☀️</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              جاهز لتكون جزءاً من Solar؟
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto">
              سواء كنت صانع محتوى، ستريمر، لاعباً تنافسياً، مصمماً، ممنتجاً أو إدارياً،
              مكانك معنا في Solar System Team.
            </p>
            <div className="mt-8 flex justify-center">
              <MagneticButton>
                <button
                  type="button"
                  onClick={() => setApplyOpen(true)}
                  className="solar-btn-primary py-4 px-9 text-base"
                >
                  قدّم طلبك الآن 🚀
                </button>
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Modal */}
      <SolarApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </div>
  );
}
