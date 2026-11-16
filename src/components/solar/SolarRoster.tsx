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
import { solarExtraCopy } from "@/lib/data/solar-i18n";

export default function SolarRoster({
  onOpenApply,
}: {
  onOpenApply: (role: SolarRole) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tx = solarExtraCopy(locale);

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
      title: tx.divisions.creator.title,
      tag: "Creator",
      desc: tx.divisions.creator.desc,
      perks: tx.divisions.creator.perks,
      icon: Video,
    },
    {
      role: "streamer",
      title: tx.divisions.streamer.title,
      tag: "Streamer",
      desc: tx.divisions.streamer.desc,
      perks: tx.divisions.streamer.perks,
      icon: Radio,
    },
    {
      role: "designer",
      title: tx.divisions.designer.title,
      tag: "Designer",
      desc: tx.divisions.designer.desc,
      perks: tx.divisions.designer.perks,
      icon: Palette,
    },
    {
      role: "editor",
      title: tx.divisions.editor.title,
      tag: "Editor",
      desc: tx.divisions.editor.desc,
      perks: tx.divisions.editor.perks,
      icon: Film,
    },
    {
      role: "player",
      title: tx.divisions.player.title,
      tag: "Competitive",
      desc: tx.divisions.player.desc,
      perks: tx.divisions.player.perks,
      icon: Gamepad2,
    },
    {
      role: "admin",
      title: tx.divisions.admin.title,
      tag: "Staff",
      desc: tx.divisions.admin.desc,
      perks: tx.divisions.admin.perks,
      icon: ShieldCheck,
    },
    {
      role: "writer",
      title: tx.divisions.writer.title,
      tag: "Ideas",
      desc: tx.divisions.writer.desc,
      perks: tx.divisions.writer.perks,
      icon: Lightbulb,
    },
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Divisions Grid — 7 Available Clan Divisions */}
      <div className="store-rank-grid">
        {divisions.map((div, idx) => {
          const DivIcon = div.icon;
          return (
            <Reveal
              key={div.role}
              delay={idx * 0.04}
              className="store-rank-reveal"
            >
              <article className="store-rank h-full">
                <div>
                  <span className="store-rank-badge">{div.tag}</span>

                  <div className="flex items-center gap-3.5 pe-20">
                    <span className="store-rank-icon shrink-0">
                      <DivIcon size={20} />
                    </span>
                    <h4 className="text-base font-bold text-[var(--text)] leading-snug">
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
                  className="store-action store-action-primary w-full mt-auto"
                >
                  <span>{tx.applyToDivision}</span>
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
