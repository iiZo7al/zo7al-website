"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { X, CheckCircle2, ShieldAlert, LogIn, ArrowUpRight, CalendarClock } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import SolarSignaturePad from "./SolarSignaturePad";
import {
  SOLAR_LEAVE_DURATIONS,
  type SolarLeaveDuration,
} from "@/lib/data/solar-leave";

import type { SolarLeavePrefill } from "@/lib/server/solar-member-status";

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
  const locale = useLocale();
  const isAr = locale === "ar";
  const { account } = useAccount();

  const [name, setName] = useState(() => prefill?.name || account?.name || "");
  const [discord, setDiscord] = useState(() => prefill?.discord || "");
  const [phone, setPhone] = useState(() => prefill?.phone || "");
  const [leaveDuration, setLeaveDuration] = useState<SolarLeaveDuration>("2_days");
  const [leaveDurationCustom, setLeaveDurationCustom] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ reference: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !discord.trim() || !phone.trim() || !reason.trim()) {
      setError("يرجى تعبئة جميع الحقول المطلوبة (*).");
      return;
    }
    if (leaveDuration === "other" && !leaveDurationCustom.trim()) {
      setError("يرجى كتابة مدة الإجازة في خانة أخرى.");
      return;
    }
    if (!signedContractUrl) {
      setError("يرجى إرفاق أو رسم توقيعك على عقد الإجازة.");
      return;
    }
    if (!pledgeAgreed) {
      setError("يجب الموافقة على تعهّد إجازة Solar System لإكمال الطلب.");
      return;
    }

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
          leaveDurationCustom: leaveDuration === "other" ? leaveDurationCustom.trim() : undefined,
          signedContractUrl,
          pledgeAgreed,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_APPLIED") {
          setError("لديك طلب إجازة قيد المراجعة حالياً.");
        } else if (data.error === "NOT_MEMBER") {
          setError("طلب الإجازة متاح فقط لأعضاء كلان Solar System المقبولين.");
        } else if (data.error === "RATE_LIMIT") {
          setError("تم إرسال عدة طلبات مؤخراً، يرجى الانتظار قليلاً ثم المحاولة.");
        } else {
          setError("تعذر إرسال طلب الإجازة، يرجى التأكد من البيانات والمحاولة مجدداً.");
        }
        return;
      }

      setSuccess({ reference: data.reference });
      onSubmitted?.();
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solar-leave-title"
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-6 sm:p-8 shadow-2xl"
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
              }}
            >
              <CalendarClock size={20} />
            </span>
            <div>
              <h2 id="solar-leave-title" className="text-xl font-bold text-[var(--text)]">
                اخذ اجازة لفريق Solar System
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                بوابة أعضاء كلان Solar System — تقديم طلب إجازة رسمي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        {!account ? (
          <div className="py-10 text-center space-y-4">
            <LogIn size={36} className="mx-auto text-[var(--accent)]" />
            <h3 className="text-lg font-bold text-[var(--text)]">تسجيل الدخول مطلوب</h3>
            <p className="text-sm text-[var(--text-muted)]">
              يرجى تسجيل الدخول بحسابك أولاً لتقديم طلب إجازة.
            </p>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#07080b" }}
            >
              تسجيل الدخول الآن
            </Link>
          </div>
        ) : success ? (
          <div className="py-10 text-center space-y-5">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
            <h3 className="text-2xl font-bold text-[var(--text)]">
              تم إرسال طلب الإجازة بنجاح!
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              سيتم مراجعة طلب الإجازة من قبل الإدارة وإشعارك بالنتيجة عبر حسابك أو الديسكورد.
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs">
              <p className="text-[var(--text-muted)]">رقم المرجع:</p>
              <p className="mt-1 font-mono text-sm font-bold text-[var(--accent)]" dir="ltr">
                {success.reference}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/requests?tab=applications"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#07080b" }}
              >
                متابعة حالة الطلب
                <ArrowUpRight size={15} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            {/* Rules Box */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 text-xs leading-relaxed text-[var(--text-muted)]">
              <p className="text-sm font-bold text-[var(--text)]">
                شروط وقوانين طلب الإجازة – Solar System
              </p>
              <p>يرجى قراءة الشروط التالية قبل تقديم طلب الإجازة:</p>

              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--text)]">1. شروط الإجازة</p>
                <ul className="list-disc ps-5 space-y-1">
                  <li>يجب تحديد سبب الإجازة ومدتها وتاريخ بدايتها ونهايتها.</li>
                  <li>لا تُعتمد الإجازة إلا بعد موافقة الإدارة.</li>
                  <li>يجب تقديم الطلب مسبقًا، إلا في الحالات الطارئة.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--text)]">2. الالتزام</p>
                <ul className="list-disc ps-5 space-y-1">
                  <li>يجب الالتزام بمدة الإجازة المعتمدة.</li>
                  <li>يمنع تمديد الإجازة دون موافقة الإدارة.</li>
                  <li>يجب إبلاغ الإدارة في حال تعذّر العودة في الموعد المحدد.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--text)]">3. العودة من الإجازة</p>
                <ul className="list-disc ps-5 space-y-1">
                  <li>يجب العودة إلى المهام بعد انتهاء الإجازة.</li>
                  <li>يحق للإدارة اتخاذ الإجراءات المناسبة عند التغيب دون عذر أو مخالفة الشروط.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--text)]">4. ديسكورد الفريق</p>
                <ul className="list-disc ps-5 space-y-1">
                  <li>تتم جميع أمور الفريق وطلبات الإجازات عبر سيرفر ديسكورد Solar System الرسمي.</li>
                  <li>يجب متابعة الإعلانات والتعليمات المتعلقة بطلب الإجازة.</li>
                  <li>
                    رابط السيرفر الرسمي:{" "}
                    <a
                      href="https://discord.gg/bCHAGPTUm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] underline underline-offset-4"
                      dir="ltr"
                    >
                      https://discord.gg/bCHAGPTUm
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-1 border-t border-[var(--border)] pt-3">
                <p className="font-semibold text-[var(--text)]">الموافقة النهائية</p>
                <p>
                  بتقديم طلب الإجازة، أقرّ بأنني قرأت الشروط المذكورة أعلاه وفهمتها، وأوافق على الالتزام بها، وأعلم أن تقديم الطلب لا يعني الموافقة عليه تلقائيًا.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
              >
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  اسمك؟ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    حسابك ديسكورد؟ (اليوزر) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="username"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    رقم جوالك؟ (للتواصل) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-2">
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
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "border-[var(--accent)] bg-[var(--glow)] text-[var(--text)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </div>
                {leaveDuration === "other" && (
                  <input
                    type="text"
                    required
                    value={leaveDurationCustom}
                    onChange={(e) => setLeaveDurationCustom(e.target.value)}
                    placeholder="اكتب مدة الإجازة المطلوبة وتاريخها..."
                    className="mt-2.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-2">
                  قم بتنزيل هذه الصورة وقم بتعديلها باي تطبيق للتعديل الصور لاضافة توقيعك ومن ثم ارفع الصورة مع التوقيع{" "}
                  <span className="text-red-400">*</span>
                </label>
                <SolarSignaturePad
                  value={signedContractUrl}
                  onChange={setSignedContractUrl}
                  contractImage="/assets/site/solar-leave-pledge.png"
                  contractTitle="عقد إجازة كلان Solar System"
                  downloadName="عقد_اجازة_كلان_سولار.png"
                />
              </div>

              {/* Leave Pledge */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 text-xs leading-relaxed text-[var(--text-muted)]">
                <p className="text-sm font-bold text-[var(--text)]">
                  تعهّد إجازة Solar System
                </p>
                <p>
                  أنا المقدّم أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين كلان Solar System المتعلقة بالإجازات، وتقديم طلب الإجازة وفقًا للإجراءات المعتمدة من الإدارة.
                </p>
                <p className="font-semibold text-[var(--text)]">وأتعهد بالالتزام بما يلي:</p>
                <ul className="list-disc ps-5 space-y-1">
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
                <p>
                  وأقرّ بأن تقديم طلب الإجازة لا يعني الموافقة عليه تلقائيًا، وأن مخالفة الشروط أو التغيب دون موافقة قد يؤدي إلى اتخاذ الإجراءات الإدارية المناسبة بحقي.
                </p>
                <p>
                  وبناءً عليه، أؤكد التزامي الكامل بهذا التعهّد، وأتحمّل مسؤولية صحة المعلومات المقدمة والالتزام بمدة الإجازة المعتمدة.
                </p>
                <p className="font-semibold text-[var(--accent)]">
                  Solar System — الالتزام، الاحترام، والمسؤولية.
                </p>

                <label className="mt-3 flex items-center gap-2.5 pt-2 border-t border-[var(--border)] cursor-pointer text-sm font-semibold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={pledgeAgreed}
                    onChange={(e) => setPledgeAgreed(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    موافق <span className="text-red-400">*</span>
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  لماذا ترغب باخذ اجازة في Solar System؟{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اشرح سبب الإجازة وتاريخ البداية والنهاية بوضوح..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full px-7 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#07080b" }}
              >
                {busy ? "جاري الإرسال..." : "إرسال طلب الإجازة"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
