"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Check,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import SolarSignaturePad from "./SolarSignaturePad";
import { solarModalsCopy } from "@/lib/data/solar-modals-i18n";
import type { SolarLeavePrefill } from "@/lib/server/solar-member-status";
import type { SolarWarningPledge } from "@/lib/data/solar-warnings";

export default function SolarWarningPledgeModal({
  open,
  pledge,
  onClose,
  onSubmitted,
  prefill,
}: {
  open: boolean;
  pledge: SolarWarningPledge | null;
  onClose: () => void;
  onSubmitted?: () => void;
  prefill?: SolarLeavePrefill | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const m = solarModalsCopy(locale);
  const w = m.warning;
  const s = m.shared;

  const { account } = useAccount();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState(() => prefill?.name || account?.name || "");
  const [age, setAge] = useState(() => prefill?.age || "");
  const [discord, setDiscord] = useState(() => prefill?.discord || "");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const validateStep2 = () => {
    if (!name.trim()) return w.errName;
    if (!age.trim()) return w.errAge;
    if (!discord.trim()) return w.errDiscord;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledge) return;
    setError(null);

    const step2Err = validateStep2();
    if (step2Err) {
      setStep(2);
      setError(step2Err);
      return;
    }
    if (!signedContractUrl) {
      setError(w.errSignature);
      return;
    }
    if (!pledgeAgreed) {
      setError(w.errPledge);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/solar/warnings/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeId: pledge.id,
          name: name.trim(),
          age: age.trim(),
          discord: discord.trim(),
          signedContractUrl,
          pledgeAgreed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setError(s.errAuth);
        } else if (data.error === "RATE_LIMIT") {
          setError(s.errRateLimit);
        } else if (data.error === "NOT_FOUND") {
          setError(w.errNotFound);
        } else {
          setError(w.errGeneric);
        }
        return;
      }

      setSuccess(true);
      onSubmitted?.();
    } catch {
      setError(s.errNetwork);
    } finally {
      setBusy(false);
    }
  };

  const resetAndClose = () => {
    setSuccess(false);
    setError(null);
    setStep(1);
    onClose();
  };

  if (!open || !pledge) return null;

  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const NextIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <dialog
      ref={dialog}
      onCancel={resetAndClose}
      onClose={resetAndClose}
      onClick={(e) => {
        if (e.target === dialog.current) resetAndClose();
      }}
      aria-labelledby="solar-warning-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir={dir}>
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <ShieldAlert size={20} />
          </span>
          <div>
            <h2 id="solar-warning-dialog-title" className="font-semibold text-lg">
              {w.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && w.step1Sub}
              {step === 2 && w.step2Sub}
              {step === 3 && w.step3Sub}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="store-close"
          onClick={resetAndClose}
          aria-label={s.closeAria}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="store-checkout-body" dir={dir}>
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, #22c55e 15%, transparent)",
                color: "#22c55e",
              }}
            >
              <Check size={28} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)]">
              {w.successTitle}
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              {w.successDesc}
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="store-action store-action-primary w-full max-w-xs mx-auto"
            >
              {w.doneBtn}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reason Banner */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertTriangle size={14} />
                <span>{w.reasonBannerLabel}</span>
              </div>
              <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {pledge.reason}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs font-medium">
              {[
                { id: 1, label: `1. ${w.step1Tab}` },
                { id: 2, label: `2. ${w.step2Tab}` },
                { id: 3, label: `3. ${w.step3Tab}` },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    if (st.id === 1) setStep(1);
                    else if (st.id === 2) setStep(2);
                    else if (st.id === 3 && !validateStep2()) setStep(3);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors ${
                    step === st.id
                      ? "bg-[var(--accent)] text-[#07080B] font-bold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
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
                      {w.rulesHeading}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {w.rulesIntro}
                    </p>
                  </div>

                  {w.ruleSections.map((sec) => (
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

                  <p className="font-bold text-rose-300">{w.noticeBanner}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="store-action store-action-primary w-full flex items-center justify-center gap-2"
                >
                  <span>{w.continueToStep2}</span>
                  <NextIcon size={16} />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {w.nameLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={w.namePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {w.ageLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={w.agePlaceholder}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    {w.discordLabel} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    dir="ltr"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder={w.discordPlaceholder}
                    className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] ${isAr ? "text-right" : "text-left"}`}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {w.backToRules}
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
                    <span>{w.continueToStep3}</span>
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
                    {w.contractImageLabel} <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => setSignedContractUrl(url)}
                    contractImage="/assets/site/solar-warning-pledge.png"
                    contractTitle={w.contractTitle}
                    downloadName="solar-warning-pledge.png"
                  />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                  <h4 className="font-bold text-xs text-[var(--accent)]">
                    {w.pledgeTitle}
                  </h4>
                  <div className="max-h-56 overflow-y-auto space-y-2.5 text-[11px] text-[var(--text-muted)] leading-relaxed pe-1">
                    <p>{w.pledgeIntro}</p>
                    <ul className="list-disc list-inside space-y-0.5 ps-1">
                      {w.pledgeItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="font-semibold text-[var(--text)]">
                      {w.warningsSystemTitle}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ps-1">
                      {w.warningsSystemItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p>{w.pledgeAck}</p>
                    <p>{w.pledgeConfirm}</p>
                    <p className="font-bold text-[var(--accent)]">{w.pledgeMotto}</p>
                  </div>

                  <label className="flex items-center gap-2.5 pt-2 border-t border-[var(--border)] cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={pledgeAgreed}
                      onChange={(e) => setPledgeAgreed(e.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <span className="text-xs font-bold text-[var(--text)]">
                      {w.pledgeAgree} <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <BackIcon size={14} />
                    {w.editInfo}
                  </button>

                  <button
                    type="submit"
                    disabled={busy}
                    className="store-action store-action-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy ? w.submitting : w.submitBtn}
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
