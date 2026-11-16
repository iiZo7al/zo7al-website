"use client";

import { useState, useRef, useEffect } from "react";
import SolidIcon from "@/components/ui/SolidIcon";
import {
  Check,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import SolarSignaturePad from "./SolarSignaturePad";
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
    if (!name.trim()) return "يرجى كتابة اسمك";
    if (!age.trim()) return "يرجى كتابة عمرك";
    if (!discord.trim()) return "يرجى كتابة حسابك ديسكورد (اليوزر)";
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
      setError("يرجى إرفاق أو رسم توقيعك على صورة التعهّد.");
      return;
    }
    if (!pledgeAgreed) {
      setError("يرجى الموافقة على تعهّد التحذير لإتمام الإجراء.");
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
          setError("يرجى تسجيل الدخول أولاً.");
        } else if (data.error === "RATE_LIMIT") {
          setError("تم إرسال محاولات كثيرة، يرجى الانتظار قليلاً.");
        } else if (data.error === "NOT_FOUND") {
          setError("انتهت صلاحية هذا التعهّد أو تم حذفه.");
        } else {
          setError("يرجى التأكد من تعبئة جميع الحقول وإرفاق التوقيع.");
        }
        return;
      }

      setSuccess(true);
      onSubmitted?.();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم.");
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

  return (
    <dialog
      ref={dialog}
      onClose={resetAndClose}
      onClick={(e) => {
        if (e.target === dialog.current) resetAndClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-full max-w-2xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-0 text-[var(--text)] backdrop:bg-black/80 backdrop:backdrop-blur-md shadow-2xl"
    >
      <div className="flex flex-col max-h-[90dvh] text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400"
            >
              <ShieldAlert size={18} />
            </span>
            <div>
              <h2 className="font-bold text-lg text-[var(--text)]">
                تعهّد بعد استلام تحذير – Solar System
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                اقرأ التعهّد، أكد بياناتك، ثم وقّع وأرسل التعهّد للإدارة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <SolidIcon name="cross" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">
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
                تم توقيع وإرسال التعهّد بنجاح
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                تم تسجيل توقيعك على تعهّد التحذير بنجاح. نأمل منك الالتزام التام بقوانين Solar System.
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="store-action store-action-primary w-full max-w-xs mx-auto"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reason Banner */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle size={14} />
                  <span>سبب التحذير الموجّه إليك:</span>
                </div>
                <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                  {pledge.reason}
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs font-medium">
                {[
                  { id: 1, label: "1. التعهّد والشروط" },
                  { id: 2, label: "2. بيانات العضو" },
                  { id: 3, label: "3. التوقيع والموافقة" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (s.id === 1) setStep(1);
                      else if (s.id === 2) setStep(2);
                      else if (s.id === 3 && !validateStep2()) setStep(3);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors ${
                      step === s.id
                        ? "bg-[var(--accent)] text-[#07080B] font-bold"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {s.label}
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
                        تعهّد بعد استلام تحذير – Solar System
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        يرجى قراءة التعهّد التالي بعناية بعد استلام تحذير من إدارة كلان <strong>Solar System</strong>:
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)] mb-1">1. الإقرار بالتحذير</h4>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                        <li>يقر العضو باستلام التحذير من إدارة الكلان.</li>
                        <li>يتعهد بعدم تكرار المخالفة التي أدت إلى حصوله على التحذير.</li>
                        <li>يلتزم بجميع قوانين وأنظمة الكلان دون استثناء.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)] mb-1">2. الالتزام بعد التحذير</h4>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                        <li>يجب تحسين السلوك والالتزام بتوجيهات الإدارة.</li>
                        <li>يمنع تكرار المخالفة أو ارتكاب مخالفات جديدة.</li>
                        <li>يجب احترام جميع أعضاء الكلان والإدارة.</li>
                        <li>يحق للإدارة متابعة سلوك العضو بعد إصدار التحذير.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)] mb-1">3. نظام التحذيرات والعقوبات</h4>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                        <li>
                          <strong>التحذير الأول:</strong> تنبيه رسمي للعضو بضرورة الالتزام بالقوانين.
                        </li>
                        <li>
                          <strong>التحذير الثاني:</strong> يتم طرد العضو نهائيًا من الكلان.
                        </li>
                        <li>لا يُسمح بتجاوز نظام التحذيرات أو تجاهل قرارات الإدارة.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)] mb-1">4. الموافقة والتعهّد</h4>
                      <p className="text-[var(--text-muted)]">
                        بموافقتك على هذا التعهّد، فإنك تقر باستلام التحذير وفهم أسباب صدوره، وتتعهد بعدم تكرار المخالفة والالتزام بجميع قوانين Solar System.
                      </p>
                      <p className="mt-2 font-bold text-rose-300">
                        تنبيه: حصولك على تحذيرين يؤدي إلى الطرد النهائي من الكلان دون الحاجة إلى تحذير ثالث.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="store-action store-action-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>المتابعة لتأكيد بياناتك</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                        اسمك؟ <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اكتب اسمك..."
                        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                        عمرك؟ <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="مثال: 19"
                        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      حسابك ديسكورد؟ (اليوزر) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      dir="ltr"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="username"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <ArrowRight size={14} />
                      الرجوع للتعهّد
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
                      <span>المتابعة للتوقيع والموافقة</span>
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      قم بتنزيل هذه الصورة وقم بتعديلها بأي تطبيق لإضافة توقيعك ومن ثم ارفع الصورة مع التوقيع{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <SolarSignaturePad
                      value={signedContractUrl}
                      onChange={(url) => setSignedContractUrl(url)}
                      contractImage="/assets/site/solar-warning-pledge.png"
                      contractTitle="صورة تعهّد التحذير – Solar System"
                      downloadName="تعهد_تحذير_سولار.png"
                    />
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                    <h4 className="font-bold text-xs text-[var(--accent)]">
                      تعهّد بعد استلام تحذير – Solar System
                    </h4>
                    <div className="max-h-56 overflow-y-auto space-y-2.5 text-[11px] text-[var(--text-muted)] leading-relaxed pl-1">
                      <p>
                        أنا المقدّم أدناه، أقرّ باستلام تحذير رسمي من إدارة فريق{" "}
                        <strong className="text-[var(--text)]">Solar System</strong>، وأتعهد بالالتزام بجميع أنظمة وقوانين الفريق، وعدم تكرار المخالفة التي أدت إلى إصدار هذا التحذير.
                      </p>
                      <p className="font-semibold text-[var(--text)]">وأتعهد بالالتزام بما يلي:</p>
                      <ul className="list-disc list-inside space-y-0.5 pr-1">
                        <li>عدم تكرار المخالفة التي تم تحذيري بسببها.</li>
                        <li>الالتزام بجميع قوانين وأنظمة فريق Solar System.</li>
                        <li>احترام الإدارة وجميع أعضاء الكلان والتعامل معهم بأسلوب لائق.</li>
                        <li>الالتزام بتوجيهات الإدارة وعدم مخالفتها.</li>
                        <li>عدم التسبب في أي مشاكل أو إساءة تؤثر على أعضاء الفريق أو سمعته.</li>
                        <li>تحمّل مسؤولية تصرفاتي والالتزام بالسلوك المناسب داخل الكلان.</li>
                        <li>تقبّل الإجراءات الإدارية المترتبة على أي مخالفة مستقبلية.</li>
                      </ul>
                      <p className="font-semibold text-[var(--text)]">نظام التحذيرات:</p>
                      <ul className="list-disc list-inside space-y-0.5 pr-1">
                        <li>التحذير الأول: إنذار رسمي مع إلزام العضو بعدم تكرار المخالفة.</li>
                        <li>التحذير الثاني: الطرد النهائي من الكلان.</li>
                      </ul>
                      <p>
                        وأقرّ بأنني على علم تام بأن حصولي على تحذير ثانٍ سيؤدي إلى طردي نهائيًا من فريق{" "}
                        <strong className="text-[var(--text)]">Solar System</strong>، دون الحاجة إلى توجيه تحذير إضافي.
                      </p>
                      <p>
                        وبناءً عليه، أؤكد أنني قرأت هذا التعهّد وفهمت جميع بنوده، وأوافق على الالتزام بها، وأتحمّل مسؤولية أي مخالفة مستقبلية تصدر مني.
                      </p>
                      <p className="font-bold text-[var(--accent)]">
                        Solar System — الالتزام، الاحترام، والمسؤولية.
                      </p>
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
                        موافق <span className="text-red-400">*</span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <ArrowRight size={14} />
                      الرجوع للبيانات
                    </button>

                    <button
                      type="submit"
                      disabled={busy}
                      className="store-action store-action-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {busy ? "جاري الإرسال..." : "إرسال وتوقيع التعهّد"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
