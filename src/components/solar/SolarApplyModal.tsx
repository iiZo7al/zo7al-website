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
import { solarCopy } from "@/lib/data/solar-copy";
import type {
  SolarRole,
  SolarAdminSubType,
  SolarGame,
  SolarApplicationInput,
} from "@/lib/data/solar";
import { SOLAR_CONTRACT_DURATIONS } from "@/lib/data/solar";

export default function SolarApplyModal({
  isOpen,
  onClose,
  initialRole = "creator",
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: SolarRole;
  settings?: {
    isOpen: boolean;
    announcement: string;
    closedRoles: SolarRole[];
    closedAdminSubTypes?: SolarAdminSubType[];
  } | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const t = solarCopy(locale);
  const { account } = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [discord, setDiscord] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<SolarRole>(initialRole);
  const [adminSubType, setAdminSubType] =
    useState<SolarAdminSubType>("dept_supervisor");
  const [game, setGame] = useState<SolarGame>("fortnite");
  const [channelUrl, setChannelUrl] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experienceDuration, setExperienceDuration] = useState("");
  const [hasPreviousClans, setHasPreviousClans] = useState<boolean>(false);
  const [contractDuration, setContractDuration] = useState("3_months");
  const [contractDurationCustom, setContractDurationCustom] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [whyJoin, setWhyJoin] = useState("");

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
    if (!nickname.trim()) return "يرجى كتابة لقبك";
    if (!age.trim()) return "يرجى كتابة عمرك";
    if (!country.trim()) return "يرجى كتابة دولتك أو مدينتك";
    if (!discord.trim()) return "يرجى كتابة حسابك الديسكورد";
    if (!whatsapp.trim()) return "يرجى كتابة رقم جوالك للتواصل";
    if (!experienceDuration.trim()) return "يرجى تحديد مدة خبرتك في التخصص";
    if (role === "creator" && !channelUrl.trim())
      return "يرجى وضع رابط قناتك أو حسابك";
    if (role === "streamer" && !streamUrl.trim())
      return "يرجى وضع رابط منصة البث الخاصة بك";
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

    if (!contractDuration) {
      setError("يرجى اختيار مدة العقد المطلوبة");
      return;
    }
    if (!pledgeAgreed) {
      setError("يرجى الموافقة على تعهد مقدّم Solar System لإتمام التقديم");
      return;
    }
    if (!whyJoin.trim()) {
      setError("يرجى الإجابة عن: لماذا ترغب بالانضمام إلى Solar System؟");
      return;
    }

    const payload: SolarApplicationInput = {
      name: name.trim(),
      nickname: nickname.trim(),
      age: age.trim(),
      country: country.trim(),
      discord: discord.trim(),
      whatsapp: whatsapp.trim(),
      role,
      adminSubType: role === "admin" ? adminSubType : undefined,
      game:
        role === "player" ||
        (role === "admin" &&
          (adminSubType === "players_supervisor" ||
            adminSubType === "players_admin"))
          ? game
          : undefined,
      channelUrl: role === "creator" ? channelUrl.trim() : undefined,
      streamUrl: role === "streamer" ? streamUrl.trim() : undefined,
      portfolioUrl:
        role === "writer" || role === "editor" || role === "designer"
          ? portfolioUrl.trim()
          : undefined,
      experienceDuration: experienceDuration.trim(),
      hasPreviousClans,
      contractDuration,
      contractDurationCustom:
        contractDuration === "other" ? contractDurationCustom.trim() : undefined,
      signedContractUrl: signedContractUrl ? signedContractUrl.trim() : undefined,
      pledgeAgreed,
      whyJoin: whyJoin.trim(),
      bio: whyJoin.trim(),
    };

    setBusy(true);
    try {
      const res = await fetch("/api/solar/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "AUTH_REQUIRED") {
          setError("يجب تسجيل الدخول بحسابك أولاً لإتمام التقديم.");
        } else if (data.error === "RECRUITMENT_CLOSED") {
          setError("التقديم على كلان Solar مغلق حالياً من قِبل الإدارة.");
        } else if (data.error === "ROLE_CLOSED") {
          setError("التقديم على هذا القسم مغلق مؤقتاً.");
        } else if (data.error === "RATE_LIMIT") {
          setError("لقد أرسلت طلباً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.");
        } else if (data.error === "ALREADY_APPLIED") {
          setError("لديك طلب انضمام قيد المراجعة بالفعل.");
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
    setNickname("");
    setAge("");
    setCountry("");
    setDiscord("");
    setWhatsapp("");
    setWhyJoin("");
    setChannelUrl("");
    setStreamUrl("");
    setPortfolioUrl("");
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
      aria-labelledby="solar-apply-dialog-title"
      className="checkout-shell store-checkout max-w-2xl"
    >
      <header className="store-checkout-header" dir="rtl">
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-apply-dialog-title" className="font-semibold text-lg">
              تقديم لفريق Solar System
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 1 && "الخطوة 1 من 3: قوانين وشروط مقدّمي الكلان"}
              {step === 2 && "الخطوة 2 من 3: البيانات الشخصية والتخصص"}
              {step === 3 && "الخطوة 3 من 3: العقد، التعهد، وتأكيد التقديم"}
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
                {t.applicationReceived}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {t.applicationReceivedDesc}
              </p>
            </div>
            <div
              className="card-glow rounded-xl border p-4 max-w-sm mx-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-[var(--text-muted)]">{t.trackingReference}</p>
              <code dir="ltr" className="mt-1 block text-sm font-bold text-[var(--accent)]">
                {success.reference}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/tracking?reference=${encodeURIComponent(success.reference)}`}
                className="store-action store-action-primary"
              >
                {t.trackRequest} ↗
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="store-action"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : settings && !settings.isOpen ? (
          <div className="space-y-6 text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <LockKeyhole size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                {locale === "ar" ? "التقديم مغلق حالياً" : "Applications Closed"}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {settings.announcement ||
                  (locale === "ar"
                    ? "باب الانضمام لكلان Solar System مغلق مؤقتاً في الوقت الحالي. تابع حسابات الكلان للإعلان عن فتح التقديم مجدداً."
                    : "Solar System clan applications are temporarily closed at this time. Follow official clan channels for announcements.")}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-7 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {t.close}
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

            {showLogin && (
              <AccountLogin
                next="/solar"
                onClose={() => setShowLogin(false)}
              />
            )}
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
                <span>القوانين والشروط</span>
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
                <span>البيانات والتخصص</span>
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
                <span>العقد والتعهد</span>
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

            {/* STEP 1: RULES & GUIDELINES */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 max-h-[380px] overflow-y-auto space-y-4 text-xs leading-relaxed text-[var(--text)]">
                  <div className="border-b border-[var(--border)] pb-2">
                    <h3 className="font-bold text-sm text-[var(--accent)]">
                      قوانين وشروط مقدّمي Solar System
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      يرجى قراءة جميع القوانين والشروط التالية بعناية قبل الموافقة على الانضمام إلى طاقم التقديم في كلان Solar System.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">1. الالتزام بالقوانين</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>الالتزام بجميع قوانين وأنظمة كلان Solar System.</li>
                      <li>احترام الإدارة العليا وتنفيذ توجيهاتها.</li>
                      <li>عدم استغلال منصب التقديم لتحقيق مصالح شخصية.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">2. شروط التقديم</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>التعامل مع جميع المتقدمين باحترام وعدالة.</li>
                      <li>عدم قبول أو رفض أي متقدم بناءً على الصداقة أو الخلافات الشخصية.</li>
                      <li>الالتزام بمعايير الاختبارات المعتمدة من الإدارة.</li>
                      <li>عدم تسريب أسئلة الاختبارات أو إجاباتها أو تفاصيلها.</li>
                      <li>عدم التلاعب بنتائج الاختبارات أو تغييرها دون إذن الإدارة.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">3. السلوك والانضباط</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>التحلي بالأخلاق والاحترام أثناء التعامل مع الأعضاء والمتقدمين.</li>
                      <li>يمنع افتعال المشاكل أو إثارة الفتن بين أعضاء الكلان.</li>
                      <li>يمنع الإساءة إلى أي عضو أو متقدم أو التقليل من شأنه.</li>
                      <li>يمنع استخدام الصلاحيات للتهديد أو الظلم أو الانتقام الشخصي.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">4. السرية والأمانة</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>المحافظة على سرية بيانات المتقدمين ومعلومات الكلان الداخلية.</li>
                      <li>يمنع نشر المعلومات الداخلية أو مشاركتها مع أشخاص غير مخوّلين.</li>
                      <li>الالتزام بالأمانة والمصداقية في جميع أعمال التقديم.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">5. المسؤوليات والصلاحيات</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>الالتزام بالمهام الموكلة إليك وعدم تجاوز حدود صلاحياتك.</li>
                      <li>يمنع تغيير القوانين أو إجراءات التقديم دون موافقة الإدارة.</li>
                      <li>يجب إبلاغ الإدارة عن أي مخالفة أو محاولة تلاعب يتم اكتشافها.</li>
                      <li>يتحمل المقدّم مسؤولية تصرفاته والقرارات الصادرة عنه ضمن مهامه.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">6. مدة العقد وإنهاء الصلاحيات</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                      <li>تكون مدة العقد لا تقل عن شهرين ولا تزيد على سنتين، أو حسب المدة الأخرى التي يتم الاتفاق عليها مع الإدارة.</li>
                      <li>يخضع تجديد العقد لموافقة الإدارة وتقييم أداء المقدّم.</li>
                      <li>يحق للإدارة سحب صلاحيات المقدّم أو إنهاء عقده عند مخالفة القوانين والشروط.</li>
                      <li>يحق للإدارة اتخاذ الإجراءات المناسبة وفقًا لطبيعة المخالفة ومدى خطورتها.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">7. الموافقة النهائية</h4>
                    <p className="text-[var(--text-muted)]">
                      بتقديم طلب الانضمام إلى طاقم التقديم في Solar System، أقرّ بأنني قرأت جميع القوانين والشروط المذكورة أعلاه، وفهمتها، وأوافق على الالتزام بها طوال مدة العقد. كما أقرّ بأن مخالفة هذه القوانين قد تؤدي إلى سحب صلاحياتي أو إنهاء عقدي بقرار من الإدارة.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] mb-1">8. ديسكورد الفريق</h4>
                    <p className="text-[var(--text-muted)]">
                      يُعدّ سيرفر ديسكورد الفريق المنصة الرسمية والأساسية لجميع أمور فريق Solar System. تتم جميع أمور الفريق داخل السيرفر (إعلانات، اجتماعات، فعاليات، تقديمات).
                    </p>
                    <a
                      href="https://discord.gg/bCHAGPTUm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
                    >
                      <span>الانضمام إلى سيرفر ديسكورد الفريق الرسمي</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="store-action store-action-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>المتابعة لتعبئة البيانات الشخصية</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFO & ROLE */}
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
                      maxLength={64}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: أحمد"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      لقبك؟ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="اسم الشهرة / الـ Nickname"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                      placeholder="مثال: 18"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      من وين؟ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="الدولة / المدينة (مثال: السعودية - الرياض)"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      حسابك ديسكورد؟ (اليوزر) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      dir="ltr"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="zo7al أو user#0000"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      رقم جوالك؟ (للتواصل) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+966 5x xxx xxxx"
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] text-right"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    وش تقدم؟ <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as SolarRole)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="creator" disabled={settings?.closedRoles.includes("creator")}>
                      صانع محتوى {settings?.closedRoles.includes("creator") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="streamer" disabled={settings?.closedRoles.includes("streamer")}>
                      ستريمر {settings?.closedRoles.includes("streamer") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="designer" disabled={settings?.closedRoles.includes("designer")}>
                      مصمم {settings?.closedRoles.includes("designer") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="editor" disabled={settings?.closedRoles.includes("editor")}>
                      ممنتج {settings?.closedRoles.includes("editor") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="player" disabled={settings?.closedRoles.includes("player")}>
                      لاعب (روكيت او فورت او ماين او فيفا) {settings?.closedRoles.includes("player") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="admin" disabled={settings?.closedRoles.includes("admin")}>
                      اداري {settings?.closedRoles.includes("admin") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                    <option value="writer" disabled={settings?.closedRoles.includes("writer")}>
                      كاتب افكار {settings?.closedRoles.includes("writer") ? "— (مغلق مؤقتاً)" : ""}
                    </option>
                  </select>
                </div>

                {/* Subfield if player */}
                {role === "player" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)]">
                      اللعبة التنافسية <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={game}
                      onChange={(e) => setGame(e.target.value as SolarGame)}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="fortnite">فورتنايت (Fortnite)</option>
                      <option value="rocket">روكيت ليق (Rocket League)</option>
                      <option value="minecraft">ماينكرافت (Minecraft)</option>
                      <option value="fifa">فيفا / FC (FIFA)</option>
                    </select>
                  </div>
                )}

                {/* Subfield if admin */}
                {role === "admin" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                        نوع الإشراف / الرتبة الإدارية <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={adminSubType}
                        onChange={(e) =>
                          setAdminSubType(e.target.value as SolarAdminSubType)
                        }
                        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      >
                        {(
                          [
                            { id: "president", label: "الرئيس" },
                            { id: "vice_president", label: "نائب الرئيس" },
                            { id: "exec_supervisor", label: "مشرف تنفيذي" },
                            { id: "dept_supervisor", label: "مشرف أقسام" },
                            { id: "general_admin", label: "إدارة عامة" },
                            { id: "admin_monitor", label: "مراقب إدارة" },
                            { id: "creators_supervisor", label: "مشرف صناع محتوى" },
                            { id: "creators_admin", label: "إداري صناع محتوى" },
                            { id: "designers_supervisor", label: "مشرف مصممين" },
                            { id: "players_supervisor", label: "مشرف لاعبين" },
                            { id: "players_admin", label: "إداري لاعبين" },
                            { id: "editors_supervisor", label: "مشرف ممنتجين" },
                            { id: "streamers_supervisor", label: "مشرف ستريمرز" },
                          ] as { id: SolarAdminSubType; label: string }[]
                        ).map((sub) => {
                          const isClosed = settings?.closedAdminSubTypes?.includes(sub.id);
                          return (
                            <option key={sub.id} value={sub.id} disabled={isClosed}>
                              {sub.label} {isClosed ? "— (مغلق مؤقتاً)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {(adminSubType === "players_supervisor" ||
                      adminSubType === "players_admin") && (
                      <div className="pt-2 border-t border-[var(--border)]">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                          اللعبة (فيفا، فورت، أو روكيت) <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={game}
                          onChange={(e) => setGame(e.target.value as SolarGame)}
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        >
                          <option value="fifa">فيفا / FC (FIFA)</option>
                          <option value="fortnite">فورتنايت (Fortnite)</option>
                          <option value="rocket">روكيت ليق (Rocket League)</option>
                          <option value="minecraft">ماينكرافت (Minecraft)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Channel / Stream URL */}
                {(role === "creator" || role === "streamer") && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      لو اخترت صانع محتوى او ستريمر (حط رابط قناتك أو حسابك) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      dir="ltr"
                      value={role === "creator" ? channelUrl : streamUrl}
                      onChange={(e) =>
                        role === "creator"
                          ? setChannelUrl(e.target.value)
                          : setStreamUrl(e.target.value)
                      }
                      placeholder={
                        role === "creator"
                          ? "https://youtube.com/@... أو https://tiktok.com/@..."
                          : "https://twitch.tv/... أو https://kick.com/..."
                      }
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] text-right"
                    />
                  </div>
                )}


                {/* Portfolio URL */}
                {(role === "writer" || role === "editor" || role === "designer") && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      رابط معرض الأعمال / النماذج (اختياري)
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="Drive, Behance, YouTube, etc."
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] text-right"
                    />
                  </div>
                )}

                {/* Experience & Previous Clans */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      كم مدة خبرتك في الي بتقدم فيه؟ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={experienceDuration}
                      onChange={(e) => setExperienceDuration(e.target.value)}
                      placeholder="مثال: سنتين، 6 أشهر..."
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      هل عندك خبرة سابقة في الكلانات؟ <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={hasPreviousClans ? "yes" : "no"}
                      onChange={(e) => setHasPreviousClans(e.target.value === "yes")}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="yes">نعم</option>
                      <option value="no">لا</option>
                    </select>
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
                    <span>المتابعة للعقد والتعهد</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTRACT, PLEDGE & WHY JOIN */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Contract Duration */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    مدة العقد؟ تقدر تجدده! (كم مدة العقد في الكلان) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={contractDuration}
                    onChange={(e) => setContractDuration(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  >
                    {SOLAR_CONTRACT_DURATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  {contractDuration === "other" && (
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={contractDurationCustom}
                      onChange={(e) => setContractDurationCustom(e.target.value)}
                      placeholder="حدد مدة العقد الأخرى..."
                      className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Contract Signature / Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    صورة العقد والتوقيع <span className="text-red-400">*</span>
                  </label>
                  <SolarSignaturePad
                    value={signedContractUrl}
                    onChange={(url) => setSignedContractUrl(url)}
                  />
                </div>

                {/* Written Pledge Card */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                    <ShieldCheck size={16} />
                    <span>تعهّد مقدّم Solar System</span>
                  </div>
                  <p className="text-[var(--text)]">
                    أنا الموقّع أدناه، أتعهد بالالتزام بجميع أنظمة وقوانين كلان Solar System، والمحافظة على سمعته ومكانته، وعدم القيام بأي تصرّف يسيء إلى الكلان أو أعضائه.
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)] pr-2">
                    <li>عدم تخريب القيم أو التدريبات أو الفعاليات أو تعطيل سيرها.</li>
                    <li>الالتزام بالاحترام والأخلاق، وعدم افتعال المشاكل أو إثارة الفتن بين الأعضاء.</li>
                    <li>عدم استغلال صلاحياتي كمقدّم لتحقيق مصالح شخصية أو الإضرار بالآخرين.</li>
                    <li>عدم التلاعب بالاختبارات أو النتائج أو المعلومات بأي شكل من الأشكال.</li>
                    <li>التعامل مع جميع المتقدمين بعدل ومساواة، دون محاباة أو تمييز.</li>
                    <li>المحافظة على سرية معلومات المتقدمين وأعضاء الكلان، وعدم إفشائها لأي جهة غير مخوّلة.</li>
                    <li>الالتزام بتوجيهات الإدارة وعدم تجاوز حدود الصلاحيات الممنوحة لي.</li>
                    <li>تحمّل المسؤولية الكاملة عن أي مخالفة أو تصرّف يصدر مني أثناء أداء مهامي.</li>
                  </ul>
                  <p className="font-bold text-[var(--accent)] pt-1 text-[11px]">
                    Solar System — الالتزام، الاحترام، والعدالة.
                  </p>

                  <label className="flex items-center gap-2 pt-2 border-t border-[var(--border)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pledgeAgreed}
                      onChange={(e) => setPledgeAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-semibold text-xs text-[var(--text)]">
                      موافق على التعهد والشروط كاملة <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* Why Join */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    لماذا ترغب بالانضمام إلى Solar System؟ <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    placeholder="تحدث عن دافعك، ما يميزك، وما الذي تطمح لتقديمه للكلان..."
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
                    {busy ? "جاري الإرسال..." : "إرسال طلب الانضمام الآن"}
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
