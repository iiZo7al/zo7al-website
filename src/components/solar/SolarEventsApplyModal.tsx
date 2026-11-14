"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SolidIcon from "@/components/ui/SolidIcon";
import {
  Check,
  LockKeyhole,
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

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="store-action store-action-primary px-6 py-2.5"
              >
                <LogIn size={16} />
                تسجيل الدخول أو إنشاء حساب
              </button>
            </div>

            {showLogin && (
              <div className="mt-4 text-right">
                <AccountLogin onClose={() => setShowLogin(false)} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6" dir="rtl">
            {/* Step Indicator */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs">
              {[
                { id: 1, label: "1. الشروط والقوانين" },
                { id: 2, label: "2. البيانات" },
                { id: 3, label: "3. العقد والتعهّد" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id === 1) setStep(1);
                    else if (s.id === 2) setStep(2);
                    else if (s.id === 3 && !validateStep2()) setStep(3);
                  }}
                  className={`flex-1 rounded-lg py-2 font-semibold transition-all ${
                    step === s.id
                      ? "bg-[var(--accent)] text-[#07080b]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            {/* STEP 1: Rules & Terms */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)] max-h-[52vh] overflow-y-auto">
                  <h3 className="text-base font-bold text-[var(--text)]">
                    شروط وقوانين إدارة فعاليات الديسكورد – Solar System
                  </h3>
                  <p>
                    يرجى قراءة الشروط التالية قبل تقديم طلب الانضمام إلى إدارة فعاليات الديسكورد:
                  </p>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[var(--accent)]">1. شروط الانضمام</h4>
                    <ul className="list-disc pr-5 space-y-1">
                      <li>يجب الالتزام بمهام إدارة وتنظيم فعاليات الديسكورد الخاصة بفريق Solar System.</li>
                      <li>لا يُعتبر هذا الطلب انضمامًا إلى الكلان أو الفريق كلاعب، وإنما هو مخصص لإدارة فعاليات الديسكورد فقط.</li>
                      <li>يجب الالتزام بالمدة المحددة في العقد، والتي لا تتجاوز شهرًا ونصفًا.</li>
                      <li>لا يُعتمد الانضمام إلى الإدارة إلا بعد موافقة الإدارة المسؤولة.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[var(--accent)]">2. الالتزام بالمهام</h4>
                    <ul className="list-disc pr-5 space-y-1">
                      <li>يجب الالتزام بتنظيم الفعاليات والمساهمة في إنجاحها.</li>
                      <li>يمنع استغلال الصلاحيات الممنوحة لأغراض شخصية أو مخالفة قوانين السيرفر.</li>
                      <li>يجب التعامل مع المشاركين باحترام وعدل، والالتزام بتوجيهات الإدارة.</li>
                      <li>في حال تعذّر أداء المهام أو الرغبة في الانسحاب، يجب إبلاغ الإدارة والتنسيق معها.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[var(--accent)]">3. المسؤولية والانسحاب</h4>
                    <ul className="list-disc pr-5 space-y-1">
                      <li>يتحمّل عضو إدارة الفعاليات مسؤولية تصرفاته وقراراته المتعلقة بمهامه.</li>
                      <li>لا يُسمح بالانسحاب من الإدارة قبل انتهاء مدة العقد إلا بعد التنسيق مع الإدارة والحصول على موافقتها.</li>
                      <li>يحق للإدارة اتخاذ الإجراءات المناسبة عند الإخلال بالمسؤوليات أو مخالفة القوانين المتفق عليها.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[var(--accent)]">4. ديسكورد الفريق</h4>
                    <ul className="list-disc pr-5 space-y-1">
                      <li>تتم جميع أمور إدارة الفعاليات والتنسيق بشأنها عبر سيرفر ديسكورد Solar System الرسمي.</li>
                      <li>يجب متابعة الإعلانات والتعليمات والتحديثات المتعلقة بالفعاليات.</li>
                      <li>يجب الالتزام بقوانين السيرفر والمحافظة على سمعته وتنظيمه.</li>
                    </ul>
                    <p className="pt-1">
                      رابط السيرفر الرسمي:{" "}
                      <a
                        href="https://discord.gg/bCHAGPTUm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent)] underline"
                      >
                        https://discord.gg/bCHAGPTUm
                        <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
                    <h4 className="font-bold text-[var(--text)]">الموافقة النهائية</h4>
                    <p>
                      بتقديم طلب الانضمام إلى إدارة فعاليات الديسكورد، أقرّ بأنني قرأت الشروط المذكورة أعلاه وفهمتها، وأوافق على الالتزام بها وتحمل مسؤولياتي المتعلقة بإدارة الفعاليات، وأعلم أن تقديم الطلب لا يعني الموافقة عليه تلقائيًا، وأن هذا الطلب خاص بإدارة فعاليات الديسكورد فقط ولا يُعد انضمامًا إلى الكلان.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="store-action store-action-primary px-6 py-2.5"
                  >
                    فهمت الشروط، التالي
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Questions */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    اسمك؟ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسمك..."
                    maxLength={80}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    عمرك؟ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="مثال: 19"
                    maxLength={20}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    حسابك ديسكورد؟ (اليوزر) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="مثال: username"
                    maxLength={60}
                    dir="ltr"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] text-right"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    className="store-action"
                  >
                    <ArrowRight size={16} />
                    السابق
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
                    className="store-action store-action-primary px-6 py-2.5"
                  >
                    التالي: العقد والتعهّد
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Contract Signature & Pledge */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    قم بتنزيل هذه الصورة وقم بتعديلها باي تطبيق للتعديل الصور لاضافة توقيعك ومن ثم ارفع الصورة مع التوقيع{" "}
                    <span className="text-rose-400">*</span>
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

                <div className="rounded-xl border border-[var(--border)] bg-black/20 p-4 space-y-2.5 text-xs leading-relaxed text-[var(--text-muted)] max-h-60 overflow-y-auto">
                  <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--accent)]" />
                    تعهّد إدارة فعاليات الديسكورد – Solar System
                  </h4>
                  <p>
                    أنا المقدّم أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين فريق Solar System المتعلقة بإدارة وتنظيم فعاليات الديسكورد، وأداء المهام الموكلة إليّ وفقًا للإجراءات والتعليمات المعتمدة من الإدارة.
                  </p>
                  <p className="font-semibold text-[var(--text)]">وأتعهد بالالتزام بما يلي:</p>
                  <ul className="list-disc pr-5 space-y-1">
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
                  <p>
                    وأقرّ بأن هذا التعهّد خاص بإدارة وتنظيم فعاليات الديسكورد فقط، ولا يُعتبر طلبًا للانضمام إلى الكلان أو الفريق كلاعب. كما أقرّ بأن مخالفة الشروط أو الإخلال بالمسؤوليات قد يؤدي إلى اتخاذ الإجراءات الإدارية المناسبة بحقي.
                  </p>
                  <p>
                    وبناءً عليه، أؤكد التزامي الكامل بهذا التعهّد، وأتحمّل مسؤولية تصرفاتي وقراراتي المتعلقة بإدارة فعاليات الديسكورد، وأوافق على الالتزام بجميع الشروط المذكورة أعلاه.
                  </p>
                  <p className="font-semibold text-[var(--accent)]">
                    Solar System — الالتزام، الاحترام، والمسؤولية.
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 cursor-pointer hover:border-[var(--accent)] transition-colors">
                  <input
                    type="checkbox"
                    checked={pledgeAgreed}
                    onChange={(e) => setPledgeAgreed(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)]">
                    موافق/ـة <span className="text-rose-400">*</span>
                  </span>
                </label>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="store-action"
                  >
                    <ArrowRight size={16} />
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="store-action store-action-primary px-7 py-2.5"
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
