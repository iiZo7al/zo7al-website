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
} from "lucide-react";
import { useLocale } from "next-intl";
import { useAccount } from "@/components/account/AccountProvider";
import AccountLogin from "@/components/account/AccountLogin";
import SolarSignaturePad from "./SolarSignaturePad";

export default function SolarEventsApplyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const { account } = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [discord, setDiscord] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const validateStep2 = () => {
    if (!name.trim()) return "يرجى كتابة اسمك";
    if (!age.trim()) return "يرجى كتابة عمرك";
    if (!discord.trim()) return "يرجى كتابة حسابك ديسكورد (اليوزر)";
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
      setError("يرجى حفظ التوقيع أو رفع صورة العقد الموقّعة لإتمام التقديم.");
      return;
    }

    if (!pledgeAgreed) {
      setError("يرجى الموافقة على تعهّد إدارة فعاليات الديسكورد لإتمام التقديم.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/solar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: age.trim(),
          discord: discord.trim(),
          signedContractUrl: signedContractUrl.trim(),
          pledgeAgreed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setError("يجب تسجيل الدخول بحسابك أولاً لإتمام التقديم.");
        } else if (data.error === "RATE_LIMIT") {
          setError("لقد أرسلت طلباً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.");
        } else if (data.error === "ALREADY_APPLIED") {
          setError("لديك طلب تقديم لإدارة فعاليات الديسكورد قيد المراجعة أو مقبول بالفعل.");
        } else {
          setError("حدث خطأ أثناء إرسال الطلب، يرجى التحقق من صحة البيانات والمحاولة مجدداً.");
        }
        return;
      }
      setSuccess({ reference: data.reference, token: data.token });
    } catch {
      setError("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setName("");
    setAge("");
    setDiscord("");
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
      aria-labelledby="solar-events-apply-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir="rtl">
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-events-apply-dialog-title" className="font-semibold text-lg">
              تقديم إدارة فعاليات لسيرفر Solar System
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && "الخطوة 1 من 3: شروط وقوانين إدارة فعاليات الديسكورد"}
              {step === 2 && "الخطوة 2 من 3: البيانات الأساسية"}
              {step === 3 && "الخطوة 3 من 3: التوقيع، التعهّد، وتأكيد التقديم"}
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
                تم استلام طلب تقديم إدارة الفعاليات بنجاح!
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                سيتم مراجعة طلبك من قِبل الإدارة المسؤولة والتواصل معك عبر الديسكورد أو حالة الطلب.
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
                يرجى تسجيل الدخول بحسابك أولاً للتقديم على إدارة فعاليات الديسكورد في Solar System.
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
                <span>البيانات الأساسية</span>
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

            {/* STEP 1: Rules & Terms */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-3 text-xs sm:text-sm leading-relaxed max-h-[55vh] overflow-y-auto">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-base">
                    <ShieldCheck size={18} />
                    <span>شروط وقوانين إدارة فعاليات الديسكورد – Solar System</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs">
                    يرجى قراءة الشروط التالية قبل تقديم طلب الانضمام إلى إدارة فعاليات الديسكورد:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <h4 className="font-bold text-[var(--text)]">1. شروط الانضمام</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يجب الالتزام بمهام إدارة وتنظيم فعاليات الديسكورد الخاصة بفريق Solar System.</li>
                        <li>لا يُعتبر هذا الطلب انضمامًا إلى الكلان أو الفريق كلاعب، وإنما هو مخصص لإدارة فعاليات الديسكورد فقط.</li>
                        <li>يجب الالتزام بالمدة المحددة في العقد، والتي لا تتجاوز شهرًا ونصفًا.</li>
                        <li>لا يُعتمد الانضمام إلى الإدارة إلا بعد موافقة الإدارة المسؤولة.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">2. الالتزام بالمهام</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يجب الالتزام بتنظيم الفعاليات والمساهمة في إنجاحها.</li>
                        <li>يمنع استغلال الصلاحيات الممنوحة لأغراض شخصية أو مخالفة قوانين السيرفر.</li>
                        <li>يجب التعامل مع المشاركين باحترام وعدل، والالتزام بتوجيهات الإدارة.</li>
                        <li>في حال تعذّر أداء المهام أو الرغبة في الانسحاب، يجب إبلاغ الإدارة والتنسيق معها.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">3. المسؤولية والانسحاب</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>يتحمّل عضو إدارة الفعاليات مسؤولية تصرفاته وقراراته المتعلقة بمهامه.</li>
                        <li>لا يُسمح بالانسحاب من الإدارة قبل انتهاء مدة العقد إلا بعد التنسيق مع الإدارة والحصول على موافقتها.</li>
                        <li>يحق للإدارة اتخاذ الإجراءات المناسبة عند الإخلال بالمسؤوليات أو مخالفة القوانين المتفق عليها.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-[var(--text)]">4. ديسكورد الفريق</h4>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] mt-1 pr-1">
                        <li>تتم جميع أمور إدارة الفعاليات والتنسيق بشأنها عبر سيرفر ديسكورد Solar System الرسمي.</li>
                        <li>يجب متابعة الإعلانات والتعليمات والتحديثات المتعلقة بالفعاليات.</li>
                        <li>يجب الالتزام بقوانين السيرفر والمحافظة على سمعته وتنظيمه.</li>
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
                        بتقديم طلب الانضمام إلى إدارة فعاليات الديسكورد، أقرّ بأنني قرأت الشروط المذكورة أعلاه وفهمتها، وأوافق على الالتزام بها وتحمل مسؤولياتي المتعلقة بإدارة الفعاليات، وأعلم أن تقديم الطلب لا يعني الموافقة عليه تلقائيًا، وأن هذا الطلب خاص بإدارة فعاليات الديسكورد فقط ولا يُعد انضمامًا إلى الكلان.
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

            {/* STEP 2: Questions */}
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اكتب اسمك..."
                      maxLength={80}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      عمرك؟ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="مثال: 19"
                      maxLength={20}
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
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="username"
                      maxLength={60}
                      dir="ltr"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
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

            {/* STEP 3: Contract Signature & Pledge */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    قم بتنزيل هذه الصورة وقم بتعديلها باي تطبيق للتعديل الصور لاضافة توقيعك ومن ثم ارفع الصورة مع التوقيع{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => {
                      setSignedContractUrl(url);
                      setError(null);
                    }}
                    contractImage="/assets/site/solar-events-pledge.png"
                    contractTitle="صورة عقد وتعهّد إدارة فعاليات الديسكورد – Solar System"
                    downloadName="عقد_ادارة_فعاليات_سولار.png"
                  />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                    <ShieldCheck size={16} />
                    <span>تعهّد إدارة فعاليات الديسكورد – Solar System</span>
                  </div>
                  <p className="text-[var(--text)]">
                    أنا المقدّم أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين فريق Solar System المتعلقة بإدارة وتنظيم فعاليات الديسكورد، وأداء المهام الموكلة إليّ وفقًا للإجراءات والتعليمات المعتمدة من الإدارة.
                  </p>
                  <p className="font-semibold text-[var(--text)]">وأتعهد بالالتزام بما يلي:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                    <li>الالتزام بمهام إدارة وتنظيم فعاليات الديسكورد والعمل على إنجاحها.</li>
                    <li>التحلي بالصدق والأمانة وتحمل المسؤولية في جميع المهام والقرارات المتعلقة بإدارة الفعاليات.</li>
                    <li>الالتزام بقوانين السيرفر واحترام جميع الأعضاء والمشاركين في الفعاليات.</li>
                    <li>عدم إساءة استخدام الصلاحيات الممنوحة لي أو استغلالها لأغراض شخصية.</li>
                    <li>الالتزام بتوجيهات الإدارة والتعليمات المتعلقة بتنظيم الفعاليات وإدارتها.</li>
                    <li>متابعة الإعلانات والتعليمات الرسمية الخاصة بإدارة الفعاليات عبر سيرفر ديسكورد Solar System.</li>
                    <li>عدم اتخاذ أي قرارات تتجاوز صلاحياتي أو تخالف أنظمة الفريق دون الرجوع إلى الإدارة.</li>
                    <li>الالتزام بمدة العقد المعتمدة، والتي لا تتجاوز شهرًا ونصفًا، وعدم الانسحاب من إدارة الفعاليات قبل انتهاء المدة إلا بعد موافقة الإدارة.</li>
                    <li>إبلاغ الإدارة في حال تعذّر أداء المهام الموكلة إليّ أو وجود ظروف تمنعني من الاستمرار في إدارة الفعاليات.</li>
                  </ul>
                  <p className="text-[var(--text-muted)]">
                    وأقرّ بأن هذا التعهّد خاص بإدارة وتنظيم فعاليات الديسكورد فقط، ولا يُعتبر طلبًا للانضمام إلى الكلان أو الفريق كلاعب. كما أقرّ بأن مخالفة الشروط أو الإخلال بالمسؤوليات قد يؤدي إلى اتخاذ الإجراءات الإدارية المناسبة بحقي.
                  </p>
                  <p className="text-[var(--text-muted)]">
                    وبناءً عليه، أؤكد التزامي الكامل بهذا التعهّد، وأتحمّل مسؤولية تصرفاتي وقراراتي المتعلقة بإدارة فعاليات الديسكورد، وأوافق على الالتزام بجميع الشروط المذكورة أعلاه.
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
                      موافق/ـة <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    <ArrowRight size={14} />
                    تعديل البيانات
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !pledgeAgreed}
                    className="store-action store-action-primary px-8"
                  >
                    {busy ? "جاري الإرسال..." : "إرسال طلب إدارة الفعاليات"}
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
