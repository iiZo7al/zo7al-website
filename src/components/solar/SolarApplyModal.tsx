"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SolidIcon from "@/components/ui/SolidIcon";
import { Check, LockKeyhole, UserCheck, LogIn } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import AccountLogin from "@/components/account/AccountLogin";
import type {
  SolarRole,
  SolarAdminSubType,
  SolarGame,
  SolarApplicationInput,
} from "@/lib/data/solar";

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
  } | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { account } = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState(account?.name ?? "");
  const [discord, setDiscord] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<SolarRole>(initialRole);
  const [adminSubType, setAdminSubType] =
    useState<SolarAdminSubType>("dept_supervisor");
  const [game, setGame] = useState<SolarGame>("fortnite");
  const [channelUrl, setChannelUrl] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: SolarApplicationInput = {
      name: name.trim(),
      discord: discord.trim(),
      whatsapp: whatsapp.trim(),
      bio: bio.trim(),
      role,
      adminSubType: role === "admin" ? adminSubType : undefined,
      game:
        role === "admin" &&
        (adminSubType === "players_supervisor" ||
          adminSubType === "players_admin")
          ? game
          : undefined,
      channelUrl: role === "creator" ? channelUrl.trim() : undefined,
      streamUrl: role === "streamer" ? streamUrl.trim() : undefined,
      portfolioUrl:
        role === "writer" || role === "editor" || role === "designer"
          ? portfolioUrl.trim()
          : undefined,
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
    setName("");
    setDiscord("");
    setWhatsapp("");
    setBio("");
    setChannelUrl("");
    setStreamUrl("");
    setPortfolioUrl("");
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
      className="checkout-shell store-checkout"
    >
      <header className="store-checkout-header" dir="rtl">
        <div className="store-checkout-brand">
          <span className="store-rank-icon">
            <SolidIcon name="trophy" size={20} />
          </span>
          <div>
            <h2 id="solar-apply-dialog-title" className="font-semibold text-lg">
              طلب انضمام • كلان Solar
            </h2>
            <p className="text-xs text-[var(--text-muted)]">Solar System Team</p>
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

      <div className="store-checkout-body" dir="rtl">
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
                تم استلام طلبك بنجاح!
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                شكراً لاهتمامك بالانضمام لكلان Solar. ستتم مراجعة طلبك من قبل
                الإدارة والتواصل معك عبر الديسكورد أو الواتساب.
              </p>
            </div>
            <div
              className="card-glow rounded-xl border p-4 max-w-sm mx-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-[var(--text-muted)]">رقم التتبع الخاص بطلبك</p>
              <code dir="ltr" className="mt-1 block text-sm font-bold text-[var(--accent)]">
                {success.reference}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/tracking?reference=${encodeURIComponent(success.reference)}`}
                className="store-action store-action-primary"
              >
                تتبع حالة الطلب ↗
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
        ) : settings && !settings.isOpen ? (
          <div className="space-y-6 text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <LockKeyhole size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                التقديم مغلق حالياً
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {settings.announcement ||
                  "باب الانضمام لكلان Solar System مغلق مؤقتاً في الوقت الحالي. تابع حسابات الكلان للإعلان عن فتح التقديم مجدداً."}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-7 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
                تسجيل الدخول مطلوب للتقديم
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                للتقديم على الانضمام لكلان Solar ومتابعة حالة طلبك بشكل مباشر عبر حسابك، يرجى تسجيل الدخول أولاً.
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
                إلغاء
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Announcement if set */}
            {settings?.announcement && (
              <div
                className="rounded-xl border p-3 text-xs leading-relaxed"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                <strong className="text-[var(--accent)] block mb-0.5">تنبيه من إدارة الكلان:</strong>
                {settings.announcement}
              </div>
            )}

            {/* Account Info Badge */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/20 p-3 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <UserCheck size={15} />
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">مقدّم بحساب</p>
                  <p className="font-semibold text-[var(--text)]">
                    {account.name || account.username || account.email}
                  </p>
                </div>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                }}
              >
                حساب موثق
              </span>
            </div>

            {error && (
              <div
                className="rounded-xl border p-3 text-sm text-red-400"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                }}
              >
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  الاسم واللقب <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={64}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد (Zo7al)"
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  حساب الديسكورد <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  dir="ltr"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="username أو username#0000"
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] text-right"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رقم الواتساب للتواصل <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={24}
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+966 5x xxx xxxx"
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  الرتبة / التخصص المطلوب <span className="text-red-400">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as SolarRole)}
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                >
                  <option value="creator" disabled={settings?.closedRoles.includes("creator")}>
                    صانع محتوى (Content Creator) {settings?.closedRoles.includes("creator") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                  <option value="streamer" disabled={settings?.closedRoles.includes("streamer")}>
                    ستريمر (Streamer) {settings?.closedRoles.includes("streamer") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                  <option value="admin" disabled={settings?.closedRoles.includes("admin")}>
                    إداري / مشرف (Staff) {settings?.closedRoles.includes("admin") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                  <option value="writer" disabled={settings?.closedRoles.includes("writer")}>
                    كاتب أفكار (Idea Writer) {settings?.closedRoles.includes("writer") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                  <option value="editor" disabled={settings?.closedRoles.includes("editor")}>
                    ممنتج (Video Editor) {settings?.closedRoles.includes("editor") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                  <option value="designer" disabled={settings?.closedRoles.includes("designer")}>
                    مصمم (Graphic Designer) {settings?.closedRoles.includes("designer") ? "— (مغلق مؤقتاً)" : ""}
                  </option>
                </select>
              </div>
            </div>

            {/* Dynamic Role Subfields */}
            {role === "admin" && (
              <div
                className="space-y-4 rounded-xl border p-4"
                style={{
                  background: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    نوع الإشراف / الرتبة الإدارية <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={adminSubType}
                    onChange={(e) =>
                      setAdminSubType(e.target.value as SolarAdminSubType)
                    }
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  >
                    <option value="exec_supervisor">مشرف تنفيذي</option>
                    <option value="dept_supervisor">مشرف أقسام</option>
                    <option value="general_admin">إدارة عامة</option>
                    <option value="admin_monitor">مراقب إدارة</option>
                    <option value="creators_supervisor">مشرف صناع محتوى</option>
                    <option value="creators_admin">إداري صناع محتوى</option>
                    <option value="designers_supervisor">مشرف مصممين</option>
                    <option value="players_supervisor">مشرف لاعبين</option>
                    <option value="players_admin">إداري لاعبين</option>
                    <option value="editors_supervisor">مشرف ممنتجين</option>
                    <option value="streamers_supervisor">مشرف ستريمرز</option>
                  </select>
                </div>

                {(adminSubType === "players_supervisor" ||
                  adminSubType === "players_admin") && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                      اختيار اللعبة التنافسية <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={game}
                      onChange={(e) => setGame(e.target.value as SolarGame)}
                      className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                    >
                      <option value="fortnite">فورتنايت (Fortnite)</option>
                      <option value="rocket">روكيت ليق (Rocket League)</option>
                      <option value="minecraft">ماينكرافت (Minecraft)</option>
                      <option value="fifa">فيفا / FC (FIFA)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {role === "creator" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط قناة اليوتيوب <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] text-right"
                />
              </div>
            )}

            {role === "streamer" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط منصة البث (تيك توك / تويتش / كيك) <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://twitch.tv/... أو tiktok.com/@..."
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] text-right"
                />
              </div>
            )}

            {(role === "writer" || role === "editor" || role === "designer") && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط معرض الأعمال / البورتفوليو <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="Drive, Behance, YouTube, etc."
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] text-right"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                نبذة، خبرات سابقة، وسبب الرغبة في الانضمام <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="تحدث عن نفسك، أهدافك، وماذا ستقدم للكلان..."
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)] leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="store-action store-action-primary w-full"
              >
                {busy ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
