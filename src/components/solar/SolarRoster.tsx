"use client";

import { useLocale } from "next-intl";
import Reveal from "@/components/ui/Reveal";
import {
  ArrowUpRight,
  Check,
  Film,
  Gamepad2,
  Lightbulb,
  Palette,
  Radio,
  ShieldCheck,
  Video,
} from "lucide-react";
import type { SolarRole } from "@/lib/data/solar";

export default function SolarRoster({
  onOpenApply,
}: {
  onOpenApply: (role: SolarRole) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";

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
    <div dir={isAr ? "rtl" : "ltr"}>
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
              <article
                className={`store-rank h-full ${
                  isLastBanner ? "lg:flex-row lg:items-center lg:gap-8" : ""
                }`}
              >
                <div className={isLastBanner ? "flex-1" : ""}>
                  <span className="store-rank-badge">{div.tag}</span>

                  <div className="flex items-center gap-3.5 pe-20">
                    <span className="store-rank-icon shrink-0">
                      <DivIcon size={20} />
                    </span>
                    <h4 className="text-lg font-bold text-[var(--text)] leading-snug">
                      {div.title}
                    </h4>
                  </div>

                  <p className="mt-4 text-sm text-[var(--text-muted)] leading-relaxed">
                    {div.desc}
                  </p>

                  <ul className="store-rank-perks">
                    {div.perks.map((perk) => (
                      <li key={perk}>
                        <Check size={16} aria-hidden="true" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenApply(div.role)}
                  data-cursor="button"
                  className={`store-action store-action-primary ${
                    isLastBanner ? "w-full lg:w-auto lg:shrink-0" : "w-full mt-auto"
                  }`}
                >
                  <span>{isAr ? "التقديم على هذا القسم" : "Apply to this Division"}</span>
                  <ArrowUpRight size={16} />
                </button>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
