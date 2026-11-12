"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import SolidIcon from "@/components/ui/SolidIcon";
import { Award, ShieldCheck, Zap } from "lucide-react";

export default function SolarSponsor() {
  return (
    <Reveal>
      <article
        className="card-glow overflow-hidden rounded-2xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        dir="rtl"
      >
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] items-center p-6 sm:p-10">
          {/* Sponsor Banner Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
            <Image
              src="/assets/site/solar-sponsor.png"
              alt="رصانة الخدمات — راعي كلان Solar System Team"
              width={1024}
              height={576}
              priority
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Sponsor Details */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                <SolidIcon name="trophy" size={13} />
                الراعي الرسمي للكلان
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                Official Partner
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
                رصانة الخدمات X Solar System
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                الشريك والراعي الرسمي لكلان Solar System Team. الداعم الأساسي لمسيرة
                الفريق في تنظيم البطولات التنافسية، دعم المبدعين، ورعاية الفعاليات الكبرى.
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-2.5 border-t border-[var(--border)] pt-4">
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <Award size={14} />
                </span>
                <span>رعاية ودعم البطولات والسكرمز الدورية للكلان</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent-secondary) 15%, transparent)",
                    color: "var(--accent-secondary)",
                  }}
                >
                  <Zap size={14} />
                </span>
                <span>تمكين صناع المحتوى واللاعبين التنافسيين بأفضل الإمكانيات</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <ShieldCheck size={14} />
                </span>
                <span>شراكة استراتيجية طويلة الأمد لبناء بيئة مجتمعية احترافية</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
