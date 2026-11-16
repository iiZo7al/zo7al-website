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
  ExternalLink,
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
    if (!name.trim()) return "يرجى كتابة اسمك";
    if (!discord.trim()) return "يرجى كتابة حسابك ديسكورد (اليوزر)";
    if (!phone.trim()) return "يرجى كتابة رقم جوالك للتواصل";
    if (leaveDuration === "other") {
      if (!leaveStartDate || !leaveEndDate) {
        return "يرجى تحديد تاريخ بداية ونهاية الإجازة من التقويم";
      }
      if (customDays === null || customDays < 1) {
        return "تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية";
      }
      if (customDays > 14) {
        return "الحد الأقصى لمدة الإجازة هو أسبوعين (14 يوماً)";
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
      setError("يرجى إرفاق أو رسم توقيعك على صورة التعهّد.");
      return;
    }
    if (!pledgeAgreed) {
      setError("يرجى الموافقة على تعهّد إجازة Solar System لإتمام الطلب.");
      return;
    }
    if (!reason.trim()) {
      setError("يرجى الإجابة عن: لماذا ترغب باخذ اجازة في Solar System؟");
      return;
    }

    const customSummary =
      leaveDuration === "other" && customDays
        ? `من ${leaveStartDate} إلى ${leaveEndDate} (${customDays} ${customDays === 1 ? "يوم" : customDays === 2 ? "يومين" : customDays <= 10 ? "أيام" : "يوماً"})`
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
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_APPLIED") {
          setError("لديك طلب إجازة قيد المراجعة بالفعل.");
        } else if (data.error === "NOT_MEMBER") {
          setError("طلب الإجازة متاح فقط لأعضاء كلان Solar System المقبولين.");
        } else if (data.error === "RATE_LIMIT") {
          setError("لقد أرسلت طلباً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.");
        } else {
          setError("تعذر إرسال طلب الإجازة، يرجى التأكد من البيانات والمحاولة مجدداً.");
        }
        return;
      }

      setSuccess({ reference: data.reference });
      onSubmitted?.();
    } catch {
      setError("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.");
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

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="solar-leave-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir="rtl">
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-leave-dialog-title" className="font-semibold text-lg">
              اخذ اجازة لفريق Solar System
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && "الخطوة 1 من 3: شروط وقوانين طلب الإجازة"}
              {step === 2 && "الخطوة 2 من 3: البيانات الشخصية ومدة الإجازة"}
              {step === 3 && "الخطوة 3 من 3: التوقيع، التعهّد، وسبب الإجازة"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="store-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="store-checkout-body" dir={locale === "ar" ? "rtl" : "ltr"}>
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
                تم استلام طلب الإجازة بنجاح!
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                سيتم مراجعة طلب الإجازة من قِبل الإدارة وإشعارك بالنتيجة عبر حسابك أو الديسكورد.
              </p>
            </div>
            <div
              className="card-glow rounded-xl border p-4 max-w-sm mx-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-[var(--text-muted)]">رقم المرجع:</p>
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
                متابعة حالة الطلب ↗
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="store-action"
              >
                إغلاق
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
                تسجيل الدخول مطلوب
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                يرجى تسجيل الدخول بحسابك أولاً لتقديم طلب إجازة.
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
                تسجيل الدخول الآن
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {showLogin && <AccountLogin onClose={() => setShowLogin(false)} />}
          </div>
        ) : (
          <div className="space-y-5" dir="rtl">
            {/* Step Navigation Wizard */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  step === 1 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  1
                </span>
                <span>القوانين والشروط</span>
              </button>

              <span className="text-[var(--border-strong)]">──</span>

              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  step === 2 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  2
                </span>
                <span>البيانات والمدة</span>
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
                className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  step === 3 ? "text-[var(--accent)] font-bold" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[11px]">
                  3
                </span>
                <span>العقد والتعهّد</span>
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
                  <span className="text-[var(--text-muted)] text-[11px]">حسابك: </span>
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
                حساب موثّق
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border p-3 text-xs text-red-400"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
              >
                {error}
              </div>
            )}

            {/* STEP 1: LEAVE RULES & REGULATIONS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-3 text-xs sm:text-sm leading-relaxed max-h-[55vh] overflow-y-auto">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-base">
                    <ShieldCheck size={18} />
                    <span>شروط وقوانين طلب الإجازة – Solar System</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs">
                    يرجى قراءة الشروط التالية قبل تقديم طلب الإجازة:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <h4 className="font-bold text-[var(--text)]">1. شروط الإجازة</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يجب تحديد سبب الإجازة ومدتها وتاريخ بدايتها ونهايتها.</li>
                        <li>لا تُعتمد الإجازة إلا بعد موافقة الإدارة.</li>
                        <li>يجب تقديم الطلب مسبقًا، إلا في الحالات الطارئة.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">2. الالتزام</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يجب الالتزام بمدة الإجازة المعتمدة.</li>
                        <li>يمنع تمديد الإجازة دون موافقة الإدارة.</li>
                        <li>يجب إبلاغ الإدارة في حال تعذّر العودة في الموعد المحدد.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">3. العودة من الإجازة</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يجب العودة إلى المهام بعد انتهاء الإجازة.</li>
                        <li>يحق للإدارة اتخاذ الإجراءات المناسبة عند التغيب دون عذر أو مخالفة الشروط.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">4. ديسكورد الفريق</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>تتم جميع أمور الفريق وطلبات الإجازات عبر سيرفر ديسكورد Solar System الرسمي.</li>
                        <li>يجب متابعة الإعلانات والتعليمات المتعلقة بطلب الإجازة.</li>
                        <li className="flex items-center gap-1.5 flex-wrap">
                          <span>رابط السيرفر الرسمي:</span>
                          <a
                            href="https://discord.gg/bCHAGPTUm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline font-medium"
                            dir="ltr"
                          >
                            https://discord.gg/bCHAGPTUm
                            <ExternalLink size={12} />
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3 mt-2">
                      <h4 className="font-bold text-[var(--accent)]">الموافقة النهائية</h4>
                      <p className="text-[var(--text-muted)] mt-1">
                        بتقديم طلب الإجازة، أقرّ بأنني قرأت الشروط المذكورة أعلاه وفهمتها، وأوافق على الالتزام بها، وأعلم أن تقديم الطلب لا يعني الموافقة عليه تلقائيًا.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="store-action store-action-primary flex items-center gap-2"
                  >
                    <span>قرأت الشروط وأوافق — متابعة</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFO & LEAVE DURATION */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      اسمك؟ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسمك الكامل"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      حسابك ديسكورد؟ (اليوزر) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      dir="ltr"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="username"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      رقم جوالك؟ (للتواصل) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={32}
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 5XXXXXXXX"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                      كم مدة الاجازة؟ <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SOLAR_LEAVE_DURATIONS.map((dur) => {
                        const active = leaveDuration === dur.id;
                        return (
                          <button
                            key={dur.id}
                            type="button"
                            onClick={() => setLeaveDuration(dur.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                              active
                                ? "border-[var(--accent)] bg-[var(--glow)] text-[var(--text)]"
                                : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                            }`}
                          >
                            {dur.label}
                          </button>
                        );
                      })}
                    </div>

                    {leaveDuration === "other" && (
                      <div className="mt-3 rounded-xl border border-[var(--border)] bg-black/20 p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)]">
                            <CalendarDays size={15} />
                            تحديد مدة الإجازة من التقويم
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            الحد الأقصى: أسبوعين (14 يوماً)
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                              تاريخ بداية الإجازة <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              min={todayIso}
                              value={leaveStartDate}
                              onChange={(e) => {
                                const nextStart = e.target.value;
                                setLeaveStartDate(nextStart);
                                if (leaveEndDate) {
                                  const d = diffDaysInclusive(nextStart, leaveEndDate);
                                  if (d === null || d < 1 || d > 14) {
                                    setLeaveEndDate("");
                                  }
                                }
                              }}
                              dir="ltr"
                              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                              تاريخ نهاية الإجازة <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              min={leaveStartDate || todayIso}
                              max={maxEndIso}
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              dir="ltr"
                              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                        </div>
                        {customDays !== null && customDays >= 1 && customDays <= 14 && (
                          <p className="text-[11px] font-semibold text-emerald-400">
                            المدة المحددة: {customDays}{" "}
                            {customDays === 1
                              ? "يوم"
                              : customDays === 2
                              ? "يومين"
                              : customDays <= 10
                              ? "أيام"
                              : "يوماً"}{" "}
                            (من {leaveStartDate} إلى {leaveEndDate})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <ArrowRight size={14} />
                    الرجوع للشروط
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
                    <span>المتابعة للتوقيع والتعهّد</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SIGNATURE, PLEDGE & REASON */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    قم بتنزيل هذه الصورة وقم بتعديلها باي تطبيق للتعديل الصور لاضافة توقيعك ومن ثم ارفع الصورة مع التوقيع{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => setSignedContractUrl(url)}
                    contractImage="/assets/site/solar-leave-pledge.png"
                    contractTitle="صورة تعهّد إجازة Solar System"
                    downloadName="عقد_اجازة_كلان_سولار.png"
                  />
                </div>

                {/* Written Pledge Card */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                    <ShieldCheck size={16} />
                    <span>تعهّد إجازة Solar System</span>
                  </div>
                  <p className="text-[var(--text)]">
                    أنا المقدّم أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين كلان Solar System المتعلقة بالإجازات، وتقديم طلب الإجازة وفقًا للإجراءات المعتمدة من الإدارة.
                  </p>
                  <p className="font-semibold text-[var(--text)]">وأتعهد بالالتزام بما يلي:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                    <li>تقديم معلومات صحيحة ودقيقة عند طلب الإجازة.</li>
                    <li>تحديد مدة الإجازة وموعد بدايتها ونهايتها بوضوح.</li>
                    <li>عدم اعتبار الإجازة معتمدة إلا بعد موافقة الإدارة.</li>
                    <li>الالتزام بمدة الإجازة المعتمدة وعدم تمديدها دون موافقة الإدارة.</li>
                    <li>إبلاغ الإدارة في حال حدوث ظروف طارئة تمنعني من العودة في الموعد المحدد.</li>
                    <li>عدم استغلال الإجازة للتهرب من المسؤوليات أو مخالفة قوانين الكلان.</li>
                    <li>الالتزام بتعليمات الإدارة المتعلقة بطلب الإجازة ومتابعتها.</li>
                    <li>متابعة الإعلانات والتعليمات الرسمية الخاصة بالفريق عبر سيرفر ديسكورد.</li>
                    <li>العودة إلى مهامي بعد انتهاء الإجازة المعتمدة، ما لم تتم الموافقة على تمديدها.</li>
                  </ul>
                  <p className="text-[var(--text-muted)]">
                    وأقرّ بأن تقديم طلب الإجازة لا يعني الموافقة عليه تلقائيًا، وأن مخالفة الشروط أو التغيب دون موافقة قد يؤدي إلى اتخاذ الإجراءات الإدارية المناسبة بحقي.
                  </p>
                  <p className="text-[var(--text-muted)]">
                    وبناءً عليه، أؤكد التزامي الكامل بهذا التعهّد، وأتحمّل مسؤولية صحة المعلومات المقدمة والالتزام بمدة الإجازة المعتمدة.
                  </p>
                  <p className="font-bold text-[var(--accent)] pt-1 text-[11px]">
                    Solar System — الالتزام، الاحترام، والمسؤولية.
                  </p>

                  <label className="flex items-center gap-2 pt-2 border-t border-[var(--border)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pledgeAgreed}
                      onChange={(e) => setPledgeAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-semibold text-xs text-[var(--text)]">
                      موافق <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    لماذا ترغب باخذ اجازة في Solar System؟{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="اشرح سبب الإجازة وتاريخ بدايتها ونهايتها بوضوح..."
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] leading-relaxed"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <ArrowRight size={14} />
                    تعديل البيانات
                  </button>

                  <button
                    type="submit"
                    disabled={busy || !pledgeAgreed}
                    className="store-action store-action-primary px-8"
                  >
                    {busy ? "جاري الإرسال..." : "إرسال طلب الإجازة الآن"}
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
