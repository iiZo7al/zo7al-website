"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import Reveal from "@/components/ui/Reveal";
import SolidIcon from "@/components/ui/SolidIcon";
import { Award, Coffee, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { solarCopy } from "@/lib/data/solar-copy";

export default function SolarSponsor() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = solarCopy(locale);

  return (
    <div className="space-y-8">
      <Reveal>
        <article
          className="store-rank overflow-hidden p-6 sm:p-10"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] items-center">
            {/* Sponsor Banner Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
              <Image
                src="/assets/site/solar-sponsor.png"
                alt={`${t.sponsorName} — ${t.sponsorRole}`}
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
                  {t.sponsorBadge}
                </span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  Official Partner
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
                  {t.sponsorName}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                  {t.sponsorDesc}
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
                  <span>{t.sponsorRole}</span>
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
                  <span>
                    {isArabic
                      ? "تمكين صناع المحتوى واللاعبين التنافسيين بأفضل الإمكانيات"
                      : "Empowering creators and competitive players with top opportunities"}
                  </span>
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
                  <span>
                    {isArabic
                      ? "شراكة استراتيجية طويلة الأمد لبناء بيئة مجتمعية احترافية"
                      : "Long-term strategic partnership building a professional community"}
                  </span>
                </div>
              </div>

              {/* Sponsor Website CTA Button */}
              <div className="pt-2">
                <a
                  href="https://rasana.com.sa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="button"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ background: "var(--accent)", color: "#07080B" }}
                >
                  <span>
                    {isArabic
                      ? "زيارة موقع راعي الكلان"
                      : t.sponsorVisitBtn || "Visit Sponsor Website"}
                  </span>
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </article>
      </Reveal>

      {/* New Sponsor: Sewan ® صــيوان */}
      <Reveal>
        <article
          className="store-rank overflow-hidden p-6 sm:p-10"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] items-center">
            {/* Sponsor Banner Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
              <Image
                src="/assets/site/sewan-sponsor.png"
                alt="Sewan ® صــيوان — Specialty Coffee"
                width={1024}
                height={576}
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
                  {t.sponsorBadge}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  <Coffee size={12} aria-hidden="true" />
                  {isArabic ? "قهوة مختصة" : "Specialty Coffee"}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
                  Sewan ® صــيوان
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                  {isArabic
                    ? "صــيوان (Sewan ®) علامة قهوة مختصة، شريك وراعٍ رسمي لكلان Solar System لدعم اللاعبين وصناع المحتوى وفعاليات المجتمع."
                    : "Sewan ® Specialty Coffee is an official partner and sponsor of Solar System Team, supporting our players, creators, and community events."}
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
                    <Coffee size={14} />
                  </span>
                  <span>
                    {isArabic
                      ? "قهوة مختصة — جودة عالية وتجربة ضيافة فريدة"
                      : "Specialty Coffee — craft quality & unique hospitality"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--accent-secondary) 15%, transparent)",
                      color: "var(--accent-secondary)",
                    }}
                  >
                    <Award size={14} />
                  </span>
                  <span>
                    {isArabic
                      ? "الشريك والراعي الرسمي لكلان Solar System"
                      : "Official Partner & Sponsor for Solar System Team"}
                  </span>
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
                  <span>
                    {isArabic
                      ? "دعم مستمر لبطولات الكلان وصناع المحتوى"
                      : "Ongoing support for clan tournaments and content creators"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </Reveal>
    </div>
  );
}
