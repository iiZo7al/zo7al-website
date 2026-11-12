"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import Reveal from "@/components/ui/Reveal";
import SolidIcon from "@/components/ui/SolidIcon";
import {
  ArrowUpRight,
  Check,
  Crown,
  Film,
  Gamepad2,
  Lightbulb,
  Palette,
  Radio,
  ShieldCheck,
  Trophy,
  Video,
} from "lucide-react";
import type { SolarRole } from "@/lib/data/solar";
import { solarCopy } from "@/lib/data/solar-copy";

export default function SolarRoster({
  onOpenApply,
}: {
  onOpenApply: (role: SolarRole) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = solarCopy(locale);

  const divisions: {
    role: SolarRole;
    title: string;
    tag: string;
    desc: string;
    perks: string[];
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    {
      role: "creator",
      title: isAr ? "صانع محتوى" : "Content Creator",
      tag: "Creator",
      desc: isAr
        ? "صناعة فيديوهات ومقاطع إبداعية على يوتيوب وتيك توك ومنصات التواصل باسم الكلان."
        : "Create gaming videos and short-form content on YouTube, TikTok, and social platforms.",
      perks: isAr
        ? ["دعم ونشر المحتوى", "تعاونات جماعية", "رتبة خاصة بالديسكورد"]
        : ["Channel shoutouts", "Group collaborations", "Special Discord rank"],
      icon: Video,
    },
    {
      role: "streamer",
      title: isAr ? "ستريمر" : "Streamer",
      tag: "Streamer",
      desc: isAr
        ? "تقديم بثوث مباشرة تفاعلية على تويتش أو كيك أو تيك توك بمحتوى ممتع ومنتظم."
        : "Host engaging live streams on Twitch, Kick, or TikTok representing Solar.",
      perks: isAr
        ? ["ترويج البثوث المباشرة", "فعاليات مع المجتمع", "رتبة ستريمر رسمية"]
        : ["Stream promotion", "Community events", "Official streamer rank"],
      icon: Radio,
    },
    {
      role: "designer",
      title: isAr ? "مصمم" : "Designer",
      tag: "Designer",
      desc: isAr
        ? "تصميم الصور المصغرة، الشعارات، البانرات والهوية البصرية الخاصة بالكلان وأعضائه."
        : "Design thumbnails, banners, logos, and visual assets for the clan.",
      perks: isAr
        ? ["إبراز أعمالك باسمك", "تطوير الهوية البصرية", "عمل جماعي إبداعي"]
        : ["Portfolio credit", "Clan visual identity", "Creative teamwork"],
      icon: Palette,
    },
    {
      role: "editor",
      title: isAr ? "ممنتج" : "Video Editor",
      tag: "Editor",
      desc: isAr
        ? "مونتاج فيديوهات اليوتيوب واللقطات القصيرة بأسلوب احترافي وجذاب."
        : "Edit YouTube videos, montages, and short clips with clean pacing.",
      perks: isAr
        ? ["توثيق اسمك في الأعمال", "مشاريع مستمرة", "تطوير مهارات المونتاج"]
        : ["Credited edits", "Ongoing clan projects", "Skill growth"],
      icon: Film,
    },
    {
      role: "player",
      title: isAr ? "لاعب (روكيت أو فورت أو ماين أو فيفا)" : "Player (Rocket, Fortnite, Minecraft, FIFA)",
      tag: "Competitive",
      desc: isAr
        ? "تمثيل الكلان في البطولات والسكرمز والتحديات في الألعاب المعتمدة."
        : "Represent Solar in scrims, challenges, and tournaments across supported games.",
      perks: isAr
        ? ["مشاركة في البطولات", "تدريبات وسكرمز", "تشكيلة تنافسية"]
        : ["Clan tournaments", "Team scrims", "Competitive roster"],
      icon: Gamepad2,
    },
    {
      role: "admin",
      title: isAr ? "إداري" : "Staff & Admin",
      tag: "Staff",
      desc: isAr
        ? "تنظيم الأقسام، متابعة الأعضاء، إدارة التقديمات، وتنسيق الفعاليات داخل الديسكورد."
        : "Manage divisions, review applications, and organize Discord events.",
      perks: isAr
        ? ["صلاحيات إشرافية", "تنسيق وإدارة الفريق", "خبرة قيادية"]
        : ["Staff permissions", "Team coordination", "Leadership experience"],
      icon: ShieldCheck,
    },
    {
      role: "writer",
      title: isAr ? "كاتب أفكار" : "Idea Writer",
      tag: "Ideas",
      desc: isAr
        ? "ابتكار أفكار فيديوهات، تحديات، وفعاليات إبداعية لصناع المحتوى والكلان."
        : "Brainstorm creative video concepts, challenges, and clan event ideas.",
      perks: isAr
        ? ["تنفيذ أفكارك بالمحتوى", "العمل مع صناع المحتوى", "بيئة إبداعية"]
        : ["See ideas produced", "Work with creators", "Creative environment"],
      icon: Lightbulb,
    },
  ];

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* Founder / Leader Card */}
      <Reveal>
        <div
          className="card-glow rounded-2xl border p-6 sm:p-8"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--border-strong)] p-2 bg-[var(--surface-elevated)]">
              <Image
                src="/assets/site/server-logo.png"
                alt={t.founderName}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <SolidIcon name="trophy" size={12} />
                  {t.founderTag}
                </span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  {t.founderRole}
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text)]">{t.founderName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] max-w-2xl">
                {t.founderBio}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--accent-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Crown size={13} />
                  {isAr ? "قائد الكلان" : "Clan Leader"}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Gamepad2 size={13} />
                  {isAr ? "لاعب وصانع محتوى" : "Player & Creator"}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy size={13} />
                  {isAr ? "إشراف مباشر على الفرق التنافسية" : "Direct Competitive Oversight"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Divisions Grid — 7 Available Clan Divisions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((div, idx) => {
          const DivIcon = div.icon;
          const isLastBanner = idx === divisions.length - 1;
          return (
            <Reveal
              key={div.role}
              delay={idx * 0.04}
              className={isLastBanner ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <div
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/50 ${
                  isLastBanner ? "lg:flex-row lg:items-center lg:gap-6" : ""
                }`}
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className={isLastBanner ? "flex-1" : ""}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                          color: "var(--accent)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <DivIcon size={19} />
                      </div>
                      <h4 className="text-base font-bold text-[var(--text)] leading-snug">
                        {div.title}
                      </h4>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-black/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {div.tag}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
                    {div.desc}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {div.perks.map((perk) => (
                      <span
                        key={perk}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-black/20 px-2.5 py-1 text-[11px] text-[var(--text-muted)]"
                      >
                        <Check size={11} style={{ color: "var(--accent)" }} />
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenApply(div.role)}
                  data-cursor="button"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#07080b] ${
                    isLastBanner ? "mt-5 w-full lg:mt-0 lg:w-auto lg:shrink-0 lg:px-6" : "mt-5 w-full"
                  }`}
                >
                  <span>{isAr ? "التقديم على هذا القسم" : "Apply to this Division"}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
