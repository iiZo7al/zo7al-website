"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function SolarRoster({ onOpenApply }: { onOpenApply: () => void }) {
  const divisions = [
    {
      title: "صناع المحتوى والستريمرز",
      icon: "🎥",
      tag: "Creators",
      desc: "نخبة من صناع المحتوى في اليوتيوب وبثوث التيك توك وتويتش وكيك، يقدمون محتوى ترفيهي وتنافسي يومي.",
      perks: ["دعم القنوات والترويج", "مشاركات وفيديوهات جماعية", "رتب وسيرفر ديسكورد خاص"],
    },
    {
      title: "الفريق التنافسي (Esports)",
      icon: "⚔️",
      tag: "Competitive",
      desc: "لاعبون محترفون يمثلون كلان Solar في بطولات وسكرمز فورتنايت، روكيت ليق، فيفا وماينكرافت.",
      perks: ["مشاركة في بطولات رسمية", "تدريب وتطوير مستمر", "سكرمز ومباريات تحدي"],
    },
    {
      title: "فريق الميديا والتصميم",
      icon: "🎨",
      tag: "Media",
      desc: "مبدعو المونتاج الاحترافي، مصممو الجرافيك، وصناع الأفكار والسيناريوهات الذين يبتكرون هوية الكلان.",
      perks: ["معرض أعمال رسمي", "مكافآت على المشاريع", "تطوير المهارات الاحترافية"],
    },
    {
      title: "الإدارة والإشراف العام",
      icon: "🛡️",
      tag: "Staff",
      desc: "هيكل إداري منظم يشرف على الأقسام، اللاعبين، تنظيم البطولات، ومتابعة انضباط مجتمع الكلان.",
      perks: ["صلاحيات إدارية متقدمة", "متابعة وتقييم دوري", "بيئة عمل وتنسيق احترافية"],
    },
  ];

  return (
    <div className="space-y-12" dir="rtl">
      {/* Founder / Leader Card */}
      <Reveal>
        <div className="solar-card p-6 sm:p-8 border-[var(--solar-border)] bg-gradient-to-r from-amber-950/20 via-black to-black">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-500/40 p-2 bg-black/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              <Image
                src="/assets/site/server-logo.png"
                alt="زحل Zo7al"
                width={96}
                height={96}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="solar-badge">Founder & Leader</span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-xs text-[var(--text-muted)]">
                  القيادة العامة
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">زحل Zo7al</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] max-w-2xl">
                مؤسس وقائد كلان Solar وشبكة زحل. نهدف لبناء أفضل مجتمع عربي يجمع
                المحترفين، صناع المحتوى، والمواهب الصاعدة في بيئة تنافسية وترفيهية
                متكاملة.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-amber-400">
                <span>⭐ قائد الكلان</span>
                <span>•</span>
                <span>🎮 لاعب وصانع محتوى</span>
                <span>•</span>
                <span>🏆 إشراف مباشر على الفرق التنافسية</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Divisions Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {divisions.map((div, idx) => (
          <Reveal key={div.title} delay={idx * 0.05}>
            <div className="solar-card h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{div.icon}</span>
                  <span className="solar-badge">{div.tag}</span>
                </div>
                <h4 className="mt-4 text-lg font-bold text-white">{div.title}</h4>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  {div.desc}
                </p>

                <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-semibold text-amber-300">مميزات الانضمام:</p>
                  <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
                    {div.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <span className="text-amber-400">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={onOpenApply}
                  className="w-full rounded-full border border-[var(--solar-border)] bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500 hover:text-black"
                >
                  قدّم لهذا القسم الآن ←
                </button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
