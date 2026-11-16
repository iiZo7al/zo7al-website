"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SolarMember } from "@/lib/data/solar-members";
import {
  SOLAR_WARNING_DURATIONS,
  type SolarWarningDurationKey,
  type SolarWarningPledge,
} from "@/lib/data/solar-warnings";
import { solarDashboardCopy } from "@/lib/data/solar-dashboard-i18n";
import { translateSolarRank } from "@/lib/data/solar-i18n";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDaysInclusive(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86400000) + 1;
}

export default function SolarWarningsManager({
  onExpired,
  onViewContract,
}: {
  onExpired: () => void;
  onViewContract: (signatureUrl: string, name: string) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const w = solarDashboardCopy(locale).warnings;

  const todayIso = toIsoDate(new Date());
  const [members, setMembers] = useState<SolarMember[]>([]);
  const [pledges, setPledges] = useState<SolarWarningPledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [reason, setReason] = useState("");
  const [durationKey, setDurationKey] = useState<SolarWarningDurationKey>("7_days");
  const [customStartDate, setCustomStartDate] = useState(todayIso);
  const [customEndDate, setCustomEndDate] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, wRes] = await Promise.all([
        fetch("/api/admin/solar/members", { cache: "no-store" }),
        fetch("/api/admin/solar/warnings", { cache: "no-store" }),
      ]);
      if (mRes.status === 401 || wRes.status === 401) {
        onExpired();
        return;
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        const list = Array.isArray(mData.members) ? (mData.members as SolarMember[]) : [];
        setMembers(list);
        setSelectedMemberId((prev) => prev || list[0]?.id || "");
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setPledges(Array.isArray(wData.pledges) ? wData.pledges : []);
      }
    } catch {
      setError(w.loadError);
    } finally {
      setLoading(false);
    }
  }, [onExpired, w.loadError]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/solar/members", { cache: "no-store" }),
      fetch("/api/admin/solar/warnings", { cache: "no-store" }),
    ])
      .then(async ([mRes, wRes]) => {
        if (!active) return;
        if (mRes.status === 401 || wRes.status === 401) {
          onExpired();
          return;
        }
        if (mRes.ok) {
          const mData = await mRes.json();
          const list = Array.isArray(mData.members) ? (mData.members as SolarMember[]) : [];
          if (active) {
            setMembers(list);
            setSelectedMemberId((prev) => prev || list[0]?.id || "");
          }
        }
        if (wRes.ok) {
          const wData = await wRes.json();
          if (active) {
            setPledges(Array.isArray(wData.pledges) ? wData.pledges : []);
          }
        }
      })
      .catch(() => {
        if (active) setError(w.loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onExpired, w.loadError]);

  const handleSendPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!selectedMemberId) {
      setError(w.selectMemberError);
      return;
    }
    if (!reason.trim()) {
      setError(w.reasonError);
      return;
    }
    const customDays = diffDaysInclusive(customStartDate, customEndDate);
    if (durationKey === "custom") {
      if (!customStartDate || !customEndDate) {
        setError(w.dateRequiredError);
        return;
      }
      if (customDays === null || customDays < 1) {
        setError(w.dateOrderError);
        return;
      }
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/solar/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          reason: reason.trim(),
          durationKey,
          ...(durationKey === "custom"
            ? { customStartDate, customEndDate }
            : {}),
        }),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok || !data.pledge) {
        setError(w.sendError);
        return;
      }
      setPledges((prev) => [data.pledge, ...prev]);
      setReason("");
      setMessage(w.sendSuccess);
    } catch {
      setError(w.sendNetworkError);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/solar/warnings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      if (res.ok) {
        setPledges((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6" dir={dir}>
      {/* Send New Warning Pledge */}
      <form
        onSubmit={handleSendPledge}
        className={`dash-panel rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-4 ${isAr ? "text-right" : "text-left"}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <ShieldAlert size={18} />
            </span>
            <div>
              <h3 className="font-bold text-base text-[var(--text)]">
                {w.heading}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {w.subheadingPrefix}{" "}
                <code dir="ltr" className="text-[var(--accent)]">/solar/members</code>{" "}
                {w.subheadingSuffix}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="dash-button"
          >
            <RefreshCw size={13} className={loading ? "dash-spinning" : ""} />
            {w.refresh}
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {w.selectMemberLabel} <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              {members.length === 0 && <option value="">{w.noMembersOption}</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {translateSolarRank(m.rank, locale)} {m.userId ? "" : w.unlinkedSuffix}
                </option>
              ))}
            </select>
            {selectedMember && !selectedMember.userId && (
              <p className="mt-1 text-[11px] text-amber-400">
                {w.unlinkedWarning}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {w.durationLabel} <span className="text-red-400">*</span>
            </label>
            <select
              value={durationKey}
              onChange={(e) => setDurationKey(e.target.value as SolarWarningDurationKey)}
              className="w-full rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              {SOLAR_WARNING_DURATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {w.durations[d.id] || d.label}
                </option>
              ))}
              <option value="custom">{w.customCalendarOption}</option>
            </select>

            {durationKey === "custom" && (() => {
              const daysCount = diffDaysInclusive(customStartDate, customEndDate);
              return (
                <div className="mt-3 rounded-xl border border-[var(--border)] bg-black/25 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                    <CalendarDays size={14} />
                    <span>{w.customCalendarOption}</span>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        {w.startDateLabel} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={todayIso}
                        value={customStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomStartDate(val);
                          if (customEndDate && val && customEndDate < val) {
                            setCustomEndDate("");
                          }
                        }}
                        dir="ltr"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        {w.endDateLabel} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={customStartDate || todayIso}
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                  {daysCount !== null && daysCount >= 1 && (
                    <p className="text-[11px] font-semibold text-emerald-400">
                      {w.selectedDuration} {daysCount}{" "}
                      {daysCount === 1 ? w.daySingular : w.dayPlural}{" "}
                      ({w.fromToPrefix} {customStartDate} {w.toWord} {customEndDate})
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
            {w.reasonLabel} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={w.reasonPlaceholder}
            className="w-full rounded-xl border border-[var(--border)] bg-black/20 p-3 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || members.length === 0}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#07080b" }}
          >
            {sending ? (
              <>
                <RefreshCw size={14} className="dash-spinning" />
                {w.sending}
              </>
            ) : (
              <>
                <Send size={14} />
                {w.sendBtn}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active / Signed Pledges List */}
      <section className={`dash-panel rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-4 ${isAr ? "text-right" : "text-left"}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base text-[var(--text)]">
            {w.activeListTitle} ({pledges.length})
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : pledges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-muted)]">
            {w.noActivePledges}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pledges.map((pledge) => {
              const isSigned = pledge.status === "signed";
              const expiresFormatted = new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Riyadh",
              }).format(new Date(pledge.expiresAt));

              return (
                <article
                  key={pledge.id}
                  className="rounded-xl border border-[var(--border)] bg-black/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)]">
                        {pledge.memberName}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {translateSolarRank(pledge.memberRank, locale)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        isSigned
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                      }`}
                    >
                      {isSigned ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {isSigned ? w.signedBadge : w.pendingBadge}
                    </span>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-black/20 p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-rose-300 font-semibold">
                      <AlertTriangle size={12} />
                      <span>{w.reasonPrefix}</span>
                    </div>
                    <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                      {pledge.reason}
                    </p>
                  </div>

                  {isSigned && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] space-y-1 text-[var(--text-muted)]">
                      <div>
                        {w.nameLabel} <strong className="text-[var(--text)]">{pledge.signerName}</strong>{" "}
                        | {w.ageLabel} <strong className="text-[var(--text)]">{pledge.signerAge}</strong>{" "}
                        | {w.discordLabel}{" "}
                        <code dir="ltr" className="text-[var(--text)]">
                          {pledge.signerDiscord}
                        </code>
                      </div>
                      {pledge.signedContractUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewContract(
                              pledge.signedContractUrl!,
                              pledge.signerName || pledge.memberName,
                            )
                          }
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-[var(--accent)] text-[#07080b] cursor-pointer"
                        >
                          <Eye size={13} />
                          {w.viewSignature}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                    <span>
                      {w.durationPrefix} <strong className="text-[var(--text)]">{pledge.durationLabel}</strong> — {w.expiresPrefix}{" "}
                      <span dir="ltr">{expiresFormatted}</span>
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === pledge.id}
                      onClick={() => void handleDelete(pledge.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {w.deleteBtn}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
