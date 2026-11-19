"use client";

import { useState } from "react";
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

  const roleKeys = Object.keys(SOLAR_ROLE_DUTIES);
  const [selectedRole, setSelectedRole] = useState<string>(userRoleId || "creator");

  const currentRoleConfig = SOLAR_ROLE_DUTIES[selectedRole] || SOLAR_ROLE_DUTIES.creator;
  const isUserCurrentRole = selectedRole === userRoleId;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)]"
            style={{
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
            }}
          >
            <ListTodo size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                مهام ومسؤوليات الرتب
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              >
                لائحة إرشادية
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              قائمة To-Do إرشادية تنظيمية توضح الواجبات والمهام المطلوبة من كل عضو حسب رتبته في الكلان.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5">
          <Info size={14} className="text-[var(--accent)] shrink-0" />
          <span>القائمة مرجعية وغير قابلة للضغط</span>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-2 pt-1 border-b border-[var(--border)] pb-4">
        {roleKeys.map((key) => {
          const cfg = SOLAR_ROLE_DUTIES[key];
          const Icon = ROLE_ICONS[key] || Sparkles;
          const isSelected = selectedRole === key;
          const isUserRole = key === userRoleId;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedRole(key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "border border-[var(--accent)] shadow-sm"
                  : "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]"
              }`}
              style={
                isSelected
                  ? {
                      background: "color-mix(in srgb, var(--accent) 18%, transparent)",
                      color: "var(--text)",
                    }
                  : undefined
              }
            >
              <Icon size={14} className={isSelected ? "text-[var(--accent)]" : ""} />
              <span>{cfg.roleLabel}</span>
              {isUserRole && (
                <span
                  className="rounded-full px-1.5 py-0.2 text-[9px] font-bold"
                  style={{
                    background: "var(--accent)",
                    color: "#07080B",
                  }}
                >
                  رتبتك
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Details & Duties Checklist */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <span>مهام رتبة:</span>
              <span className="text-[var(--accent)]">{currentRoleConfig.roleLabel}</span>
              {isUserCurrentRole && (
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  (هذه رتبتك الحالية في الكلان)
                </span>
              )}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {currentRoleConfig.description}
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {currentRoleConfig.duties.length} مهام محددة
          </span>
        </div>

        {/* Read-Only Checklist Items */}
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
