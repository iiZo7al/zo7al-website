"use client";

import { useLocale } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  ListTodo,
  Sparkles,
  Video,
  PenTool,
  Palette,
  Radio,
  Gamepad2,
  Shield,
  Info,
} from "lucide-react";
import {
  SOLAR_ROLE_DUTIES,
  resolveDutiesRoleId,
  type SolarRoleDuty,
} from "@/lib/data/solar-duties";

interface SolarRankDutiesProps {
  userRank?: string | null;
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  creator: Sparkles,
  writer: PenTool,
  editor: Video,
  designer: Palette,
  streamer: Radio,
  player: Gamepad2,
  admin: Shield,
};

export default function SolarRankDuties({ userRank }: SolarRankDutiesProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const userRoleId = resolveDutiesRoleId(userRank);

  // If user role is not recognized or not a member of defined roles, don't display
  if (!userRoleId || !SOLAR_ROLE_DUTIES[userRoleId]) {
    return null;
  }

  const currentRoleConfig = SOLAR_ROLE_DUTIES[userRoleId];
  const Icon = ROLE_ICONS[userRoleId] || Sparkles;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)]"
            style={{
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
            }}
          >
            <Icon size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                مهام ومسؤوليات رتبتك ({currentRoleConfig.roleLabel})
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                خاص برتبتك
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {currentRoleConfig.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5">
          <Info size={14} className="text-[var(--accent)] shrink-0" />
          <span>قائمة إرشادية غير قابلة للضغط</span>
        </div>
      </div>

      {/* Duties Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text)]">
            قائمة المهام والواجبات المطلوبة منك:
          </span>
          <span>{currentRoleConfig.duties.length} مهام محددة</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {currentRoleConfig.duties.map((duty: SolarRoleDuty, index: number) => (
            <div
              key={duty.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-2 transition-colors hover:border-[var(--border-strong)] select-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className="mt-0.5 shrink-0 text-[var(--accent)] opacity-85"
                    aria-hidden="true"
                  >
                    <CheckSquare size={17} />
                  </span>
                  <span className="text-xs font-bold text-[var(--text)] leading-snug">
                    {duty.title}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-md border border-[var(--border)] bg-black/20 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                  dir="ltr"
                >
                  #{index + 1} • {duty.frequencyLabel}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6 pr-6">
                {duty.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
