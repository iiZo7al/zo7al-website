"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import Reveal from "@/components/ui/Reveal";
import SolidIcon from "@/components/ui/SolidIcon";
import { Check, Crown, Gamepad2, Trophy, Video, Users, Palette } from "lucide-react";
import type { SolarRole } from "@/lib/data/solar";
import { solarCopy } from "@/lib/data/solar-copy";

export default function SolarRoster({
  onOpenApply,
}: {
  onOpenApply: (role: SolarRole) => void;
}) {
  const locale = useLocale();
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
      title: locale === "ar" ? "صناع المحتوى والستريمرز" : "Creators & Streamers",
      tag: "Creators & Streamers",
      desc:
        locale === "ar"
          ? "نخبة من صناع المحتوى في اليوتيوب وبثوث التيك توك وتويتش وكيك، يقدمون محتوى ترفيهي وتنافسي."
          : "Elite creators and streamers on YouTube, TikTok, Twitch, and Kick sharing top gaming moments.",
      perks:
        locale === "ar"
          ? ["دعم القنوات والترويج", "مشاركات وفيديوهات جماعية", "رتب وسيرفر ديسكورد خاص"]
          : ["Channel promotion & backing", "Group collaborations & videos", "Special Discord ranks"],
      icon: Video,
    },
    {
      role: "player",
      title: locale === "ar" ? "الفريق التنافسي" : "Competitive Squad",
      tag: "Competitive Players",
      desc:
        locale === "ar"
          ? "لاعبون محترفون يمثلون كلان Solar في بطولات وسكرمز فورتنايت، روكيت ليق، فيفا وماينكرافت."
          : "Pro players representing Solar in tournaments and scrims across Fortnite, Rocket League, FIFA, and Minecraft.",
      perks:
        locale === "ar"
          ? ["مشاركة في بطولات رسمية", "تدريب وتطوير مستمر", "سكرمز ومباريات تحدي"]
          : ["Official tournament entries", "Continuous coaching & skill growth", "Competitive scrims"],
      icon: Trophy,
    },
    {
      role: "admin",
      title: locale === "ar" ? "الإدارة والإشراف العام" : "Staff & Management",
      tag: "Staff & Management",
      desc:
        locale === "ar"
          ? "هيكل إداري منظم يشرف على الأقسام، اللاعبين، تنظيم البطولات، ومتابعة انضباط مجتمع الكلان."
          : "Organized leadership overseeing clan divisions, tournaments, community events, and discipline.",
      perks:
        locale === "ar"
          ? ["صلاحيات إدارية متقدمة", "متابعة وتقييم دوري", "بيئة عمل وتنسيق احترافية"]
          : ["Staff permissions & tools", "Regular performance reviews", "Professional team environment"],
      icon: Users,
    },
    {
      role: "editor",
      title: locale === "ar" ? "المونتاج والتصميم" : "Editing & Design",
      tag: "Editing & Design",
      desc:
        locale === "ar"
          ? "مبدعو المونتاج الاحترافي، مصممو الجرافيك، وصناع الأفكار والسيناريوهات الذين يبتكرون هوية الكلان."
          : "Creative video editors, graphic designers, and idea writers shaping the clan visual identity.",
      perks:
        locale === "ar"
          ? ["معرض أعمال رسمي", "مكافآت على المشاريع", "تطوير المهارات الاحترافية"]
          : ["Official portfolio exposure", "Project-based rewards", "Skill enhancement workflows"],
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
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
                  {locale === "ar" ? "قائد الكلان" : "Clan Leader"}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Gamepad2 size={13} />
                  {locale === "ar" ? "لاعب وصانع محتوى" : "Player & Creator"}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy size={13} />
                  {locale === "ar" ? "إشراف مباشر على الفرق التنافسية" : "Direct Competitive Oversight"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Divisions Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {divisions.map((div, idx) => {
          const DivIcon = div.icon;
          return (
            <Reveal key={div.title} delay={idx * 0.05}>
              <div
                className="card-glow group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <DivIcon size={20} />
                    </div>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                      {div.tag}
                    </span>
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-[var(--text)]">{div.title}</h4>
                  <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                    {div.desc}
                  </p>

                  <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
                    <p className="text-xs font-semibold text-[var(--text)]">
                      {locale === "ar" ? "مميزات الانضمام:" : "Perks & Benefits:"}
                    </p>
                    <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
                      {div.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2">
                          <Check size={13} style={{ color: "var(--accent)" }} />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenApply(div.role)}
                  data-cursor="button"
                  className="store-action w-full mt-6 text-xs"
                >
                  {locale === "ar" ? "تقديم على هذا القسم" : "Apply to this Division"}
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
