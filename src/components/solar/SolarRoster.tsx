"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import SolidIcon from "@/components/ui/SolidIcon";
import { Check, Crown, Gamepad2, Trophy, Video, Users, Palette } from "lucide-react";
import type { SolarRole } from "@/lib/data/solar";

export default function SolarRoster({
  onOpenApply,
}: {
  onOpenApply: (role: SolarRole) => void;
}) {
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
      title: "صناع المحتوى والستريمرز",
      tag: "Creators & Streamers",
      desc: "نخبة من صناع المحتوى في اليوتيوب وبثوث التيك توك وتويتش وكيك، يقدمون محتوى ترفيهي وتنافسي.",
      perks: ["دعم القنوات والترويج", "مشاركات وفيديوهات جماعية", "رتب وسيرفر ديسكورد خاص"],
      icon: Video,
    },
    {
      role: "admin",
      title: "الفريق التنافسي",
      tag: "Competitive Players",
      desc: "لاعبون محترفون يمثلون كلان Solar في بطولات وسكرمز فورتنايت، روكيت ليق، فيفا وماينكرافت.",
      perks: ["مشاركة في بطولات رسمية", "تدريب وتطوير مستمر", "سكرمز ومباريات تحدي"],
      icon: Trophy,
    },
    {
      role: "admin",
      title: "الإدارة والإشراف العام",
      tag: "Staff & Management",
      desc: "هيكل إداري منظم يشرف على الأقسام، اللاعبين، تنظيم البطولات، ومتابعة انضباط مجتمع الكلان.",
      perks: ["صلاحيات إدارية متقدمة", "متابعة وتقييم دوري", "بيئة عمل وتنسيق احترافية"],
      icon: Users,
    },
    {
      role: "editor",
      title: "المونتاج والتصميم",
      tag: "Editing & Design",
      desc: "مبدعو المونتاج الاحترافي، مصممو الجرافيك، وصناع الأفكار والسيناريوهات الذين يبتكرون هوية الكلان.",
      perks: ["معرض أعمال رسمي", "مكافآت على المشاريع", "تطوير المهارات الاحترافية"],
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Founder / Leader Card */}
      <Reveal>
        <div
          className="card-glow rounded-2xl border p-6 sm:p-8"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--border-strong)] p-2 bg-[var(--surface-elevated)]">
              <Image
                src="/assets/site/server-logo.png"
                alt="زحل Zo7al"
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
                  Founder & Leader
                </span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  القيادة العامة
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text)]">زحل Zo7al</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] max-w-2xl">
                مؤسس وقائد كلان Solar وشبكة زحل. نهدف لبناء أفضل مجتمع عربي يجمع
                المحترفين، صناع المحتوى، والمواهب الصاعدة في بيئة تنافسية وترفيهية متكاملة.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--accent-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Crown size={13} />
                  قائد الكلان
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Gamepad2 size={13} />
                  لاعب وصانع محتوى
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy size={13} />
                  إشراف مباشر على الفرق التنافسية
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
                    <p className="text-xs font-semibold text-[var(--text)]">مميزات الانضمام:</p>
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
                  تقديم على هذا القسم
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
