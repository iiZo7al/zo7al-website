"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import SolarLeaveModal from "@/components/solar/SolarLeaveModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SOLAR_LEAVE_DURATION_LABELS } from "@/lib/data/solar-leave";
import { solarExtraCopy } from "@/lib/data/solar-i18n";
import type { SolarUserStatus } from "@/lib/server/solar-member-status";
import "@/components/store/store.css";

export default function SolarMembersPortalPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tx = solarExtraCopy(locale);
  const { account, ready } = useAccount();

  const [status, setStatus] = useState<SolarUserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const loadStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/solar/status", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<SolarUserStatus>) : null))
      .then((data) => {
        setStatus(data);
      })
      .catch(() => {
        setStatus(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!ready || !account) return;
    let active = true;
    fetch("/api/solar/status", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<SolarUserStatus>) : null))
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        if (active) setStatus(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [account, ready]);

  const effectiveStatus = account ? status : null;
  const effectiveLoading = !ready || (Boolean(account) && loading && !effectiveStatus);

  return (
    <main data-accent="solar" className="min-h-[75dvh] px-6 pb-24 pt-36 sm:pt-44">
      <div className="mx-auto max-w-[960px]">
        <Link
          href="/solar"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] mb-6"
        >
          <ArrowLeft size={14} className={isAr ? "rotate-180" : ""} />
          {tx.backToSolar}
        </Link>

        {effectiveLoading ? (
          <div className="space-y-6" aria-busy="true">
            <Skeleton className="h-36 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        ) : !account || !effectiveStatus?.isMember ? (
          <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-8 sm:p-12 text-center space-y-4">
            <ShieldAlert size={40} className="mx-auto text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text)]">
              {tx.membersOnlyTitle}
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              {tx.membersOnlyDesc}
            </p>
            <div className="pt-2">
              <Link
                href="/solar"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#07080B" }}
              >
                {tx.goToSolar}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
            {/* Member Welcome Card */}
            <section className="card-glow rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center">
                  {account.avatar ? (
                    <Image
                      src={account.avatar}
                      alt={account.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={26} className="text-[var(--text-muted)]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-[var(--text)] truncate">
                      {effectiveStatus.memberInfo?.name || account.name}
                    </h1>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 14%, transparent)",
                        color: "var(--accent)",
                        border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                      }}
                    >
                      <Image
                        src="/assets/site/solar-clan-logo.png"
                        alt=""
                        width={14}
                        height={14}
                        className="object-contain"
                      />
                      {tx.clanMemberBadge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {effectiveStatus.memberInfo?.rank || tx.membersPortalSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLeaveOpen(true)}
                data-cursor="button"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: "var(--accent)", color: "#07080B" }}
              >
                <CalendarClock size={17} />
                {tx.requestLeaveBtn}
              </button>
            </section>

            {/* Leave Requests History */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">
                    {tx.yourLeaveRequests}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {tx.yourLeaveRequestsDesc}
                  </p>
                </div>
              </div>

              {effectiveStatus.leaveRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--text-muted)]">
                  {tx.noLeaveRequests}
                </div>
              ) : (
                <div className="space-y-3">
                  {effectiveStatus.leaveRequests.map((req) => {
                    const durText =
                      req.leaveDuration === "other" && req.leaveDurationCustom
                        ? req.leaveDurationCustom
                        : SOLAR_LEAVE_DURATION_LABELS[req.leaveDuration] ||
                          req.leaveDuration;

                    const badge =
                      req.status === "accepted"
                        ? {
                            label: tx.statusAccepted,
                            cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                            Icon: CheckCircle2,
                          }
                        : req.status === "rejected"
                          ? {
                              label: tx.statusRejected,
                              cls: "bg-red-500/15 text-red-300 border-red-500/30",
                              Icon: XCircle,
                            }
                          : {
                              label: tx.statusPending,
                              cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                              Icon: Clock,
                            };

                    return (
                      <article
                        key={req.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--text)]">
                            {`${tx.durationLabel} ${durText}`}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}
                          >
                            <badge.Icon size={13} />
                            {badge.label}
                          </span>
                        </div>
                        {req.reason && (
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {req.reason}
                          </p>
                        )}
                        {req.note && (
                          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]">
                            {`${tx.staffNoteLabel} ${req.note}`}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <SolarLeaveModal
        key={`${leaveOpen}-${effectiveStatus?.prefill?.name ?? ""}-${effectiveStatus?.prefill?.discord ?? ""}-${effectiveStatus?.prefill?.phone ?? ""}`}
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onSubmitted={loadStatus}
        prefill={effectiveStatus?.prefill}
      />
    </main>
  );
}
