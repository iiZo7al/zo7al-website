"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SolidIcon from "@/components/ui/SolidIcon";
import {
  Check,
  LockKeyhole,
  UserCheck,
  LogIn,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useAccount } from "@/components/account/AccountProvider";
import AccountLogin from "@/components/account/AccountLogin";
import SolarSignaturePad from "./SolarSignaturePad";
import {
  SOLAR_LEAVE_DURATIONS,
  type SolarLeaveDuration,
} from "@/lib/data/solar-leave";
import type { SolarLeavePrefill } from "@/lib/server/solar-member-status";
import { solarCopy } from "@/lib/data/solar-copy";
import { solarModalsCopy } from "@/lib/data/solar-modals-i18n";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function diffDaysInclusive(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(`${startIso}T00:00:00`).getTime();
  const end = new Date(`${endIso}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86400000) + 1;
}

export default function SolarLeaveModal({
  open,
  onClose,
  onSubmitted,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  prefill?: SolarLeavePrefill | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const t = solarCopy(locale);
  const m = solarModalsCopy(locale);
  const lv = m.leave;
  const s = m.shared;

  const { account } = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const todayIso = toIsoDate(new Date());

  const [name, setName] = useState(() => prefill?.name || account?.name || "");
  const [discord, setDiscord] = useState(() => prefill?.discord || "");
  const [phone, setPhone] = useState(() => prefill?.phone || "");
  const [leaveDuration, setLeaveDuration] = useState<SolarLeaveDuration>("2_days");
  const [leaveStartDate, setLeaveStartDate] = useState(todayIso);
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);

  useEffect(() => {
    if (!open) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const maxEndIso = leaveStartDate ? addDaysIso(leaveStartDate, 13) : addDaysIso(todayIso, 13);
  const customDays = diffDaysInclusive(leaveStartDate, leaveEndDate);

  const validateStep2 = () => {
    if (!name.trim()) return lv.errName;
    if (!discord.trim()) return lv.errDiscord;
    if (!phone.trim()) return lv.errPhone;
    if (leaveDuration === "other") {
      if (!leaveStartDate || !leaveEndDate) {
        return lv.errCalendarEmpty;
      }
      if (customDays === null || customDays < 1) {
        return lv.errCalendarOrder;
      }
      if (customDays > 14) {
        return lv.errCalendarMax;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const step2Err = validateStep2();
    if (step2Err) {
      setStep(2);
      setError(step2Err);
      return;
    }
    if (!signedContractUrl) {
      setError(lv.errSignature);
      return;
    }
    if (!pledgeAgreed) {
      setError(lv.errPledge);
      return;
    }

    const customSummary =
      leaveDuration === "other" && customDays
        ? `${leaveStartDate} → ${leaveEndDate} (${customDays} ${lv.daysSuffix})`
        : undefined;

    setBusy(true);
    try {
      const res = await fetch("/api/solar/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          discord: discord.trim(),
          phone: phone.trim(),
          leaveDuration,
          leaveDurationCustom: customSummary,
          leaveStartDate: leaveDuration === "other" ? leaveStartDate : undefined,
          leaveEndDate: leaveDuration === "other" ? leaveEndDate : undefined,
          signedContractUrl,
          pledgeAgreed,
          reason: reason.trim() || "—",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_APPLIED") {
          setError(m.apply.errAlreadyApplied);
        } else if (data.error === "NOT_MEMBER") {
          setError(lv.errNotMember);
        } else if (data.error === "RATE_LIMIT") {
          setError(s.errRateLimit);
        } else {
          setError(s.errServer);
        }
        return;
      }

      setSuccess({ reference: data.reference });
      onSubmitted?.();
    } catch {
      setError(s.errNetwork);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setReason("");
    setSignedContractUrl("");
    setPledgeAgreed(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const NextIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="solar-leave-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir={dir}>
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-leave-dialog-title" className="font-semibold text-lg">
              {lv.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && lv.step1Sub}
              {step === 2 && lv.step2Sub}
              {step === 3 && lv.step3Sub}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="store-close"
          onClick={onClose}
          aria-label={s.closeAria}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="store-checkout-body" dir={dir}>
        {success ? (
          <div className="space-y-6 text-center py-4">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              <Check size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text)]">
                {lv.successTitle}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {lv.successDesc}
              </p>
            </div>
            <div
              className="card-glow rounded-xl border p-4 max-w-sm mx-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-[var(--text-muted)]">{lv.referenceLabel}</p>
              <code dir="ltr" className="mt-1 block text-sm font-bold text-[var(--accent)]">
                {success.reference}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/requests?tab=applications"
                onClick={onClose}
                className="store-action store-action-primary"
              >
                {m.events.trackBtn} ↗
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="store-action"
              >
                {lv.doneBtn}
              </button>
            </div>
          </div>
        ) : !account ? (
          <div className="space-y-6 text-center py-6">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                color: "var(--accent)",
              }}
            >
              <LockKeyhole size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                {t.loginRequiredTitle}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {t.loginRequiredDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                style={{ background: "var(--accent)", color: "#07080b" }}
              >
                <LogIn size={15} />
                {t.loginNow}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>

            {showLogin && <AccountLogin onClose={() => setShowLogin(false)} />}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step Navigation Wizard */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 1 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  1
                </span>
                <span>{lv.step1Tab}</span>
              </button>

              <span className="text-[var(--border-strong)]">──</span>

              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 2 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  2
                </span>
                <span>{lv.step2Tab}</span>
              </button>

              <span className="text-[var(--border-strong)]">──</span>

              <button
                type="button"
                onClick={() => {
                  const err = validateStep2();
                  if (err) {
                    setError(err);
                  } else {
                    setError(null);
                    setStep(3);
                  }
                }}
                className={`flex items-center gap-1.5 font-medium transition-colors ${
                  step === 3 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  3
                </span>
                <span>{lv.step3Tab}</span>
              </button>
            </div>

            {/* Account Info Badge */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/20 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <UserCheck size={14} />
                </div>
                <div className="leading-tight">
                  <span className="text-[var(--text-muted)] text-[11px]">{s.yourAccount} </span>
                  <strong className="text-[var(--text)]">
                    {account.name || account.username || account.email}
                  </strong>
                </div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                }}
              >
                {t.verifiedAccount}
              </span>
            </div>

            {error && (
              <div
                className="rounded-xl border p-3 text-xs text-red-400"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                }}
              >
                {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 max-h-[380px] overflow-y-auto space-y-4 text-xs leading-relaxed text-[var(--text)]">
                  <div className="border-b border-[var(--border)] pb-2">
                    <h3 className="font-bold text-sm text-[var(--accent)]">
                      {lv.rulesHeading}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {lv.rulesIntro}
                    </p>
                  </div>

                  {lv.ruleSections.map((sec) => (
                    <div key={sec.title}>
                      <h4 className="font-bold text-[var(--text)] mb-1">{sec.title}</h4>
                      {sec.items && (
                        <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] ps-2">
                          {sec.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {sec.text && (
                        <p className="text-[var(--text-muted)]">{sec.text}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="store-action store-action-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>{lv.continueToStep2}</span>
                    <NextIcon size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {lv.nameLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lv.namePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {lv.discordLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      dir="ltr"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder={lv.discordPlaceholder}
                      className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {lv.phoneLabel} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={24}
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 5x xxx xxxx"
                    className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {lv.durationLabel} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={leaveDuration}
                    onChange={(e) => setLeaveDuration(e.target.value as SolarLeaveDuration)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  >
                    {SOLAR_LEAVE_DURATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lv.durations[d.id] || d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {leaveDuration === "other" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3.5 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1">
                          <CalendarDays size={13} />
                          <span>{lv.startDateLabel}</span>
                        </label>
                        <input
                          type="date"
                          min={todayIso}
                          value={leaveStartDate}
                          onChange={(e) => {
                            setLeaveStartDate(e.target.value);
                            if (leaveEndDate && e.target.value > leaveEndDate) {
                              setLeaveEndDate("");
                            }
                          }}
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1">
                          <CalendarDays size={13} />
                          <span>{lv.endDateLabel}</span>
                        </label>
                        <input
                          type="date"
                          min={leaveStartDate || todayIso}
                          max={maxEndIso}
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>

                    {customDays !== null && (
                      <p
                        className={`text-xs font-medium ${
                          customDays > 14 ? "text-red-400" : "text-[var(--accent)]"
                        }`}
                      >
                        {lv.selectedDurationPrefix} {customDays} {lv.daysSuffix}{" "}
                        {customDays > 14 ? lv.maxDaysExceeded : ""}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {lv.backToRules}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const err = validateStep2();
                      if (err) {
                        setError(err);
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                    className="store-action store-action-primary flex items-center gap-2"
                  >
                    <span>{lv.continueToStep3}</span>
                    <NextIcon size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {lv.contractImageLabel} <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => setSignedContractUrl(url)}
                    contractImage="/assets/site/solar-leave-contract.png"
                    contractTitle={lv.contractTitle}
                    downloadName="solar-leave-contract.png"
                  />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                    <ShieldCheck size={16} />
                    <span>{lv.pledgeTitle}</span>
                  </div>
                  <p className="text-[var(--text)]">{lv.pledgeIntro}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] ps-2">
                    {lv.pledgeItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="font-bold text-[var(--accent)] pt-1 text-[11px]">
                    {lv.pledgeMotto}
                  </p>

                  <label className="flex items-center gap-2 pt-2 border-t border-[var(--border)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pledgeAgreed}
                      onChange={(e) => setPledgeAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-semibold text-xs text-[var(--text)]">
                      {lv.pledgeAgree} <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {lv.reasonLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={lv.reasonPlaceholder}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {lv.editInfo}
                  </button>

                  <button
                    type="submit"
                    disabled={busy || !pledgeAgreed}
                    className="store-action store-action-primary px-8"
                  >
                    {busy ? lv.submitting : lv.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
