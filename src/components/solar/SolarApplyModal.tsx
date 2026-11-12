"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type {
  SolarRole,
  SolarAdminSubType,
  SolarGame,
  SolarApplicationInput,
} from "@/lib/data/solar";

export default function SolarApplyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [discord, setDiscord] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<SolarRole>("creator");
  const [adminSubType, setAdminSubType] =
    useState<SolarAdminSubType>("general_admin");
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("يرجى كتابة الاسم واللقب");
      return;
    }
    if (!discord.trim()) {
      setError("يرجى إدخال حساب الديسكورد");
      return;
    }
    if (!whatsapp.trim()) {
      setError("يرجى إدخال رقم هاتف الواتساب للتواصل");
      return;
    }
    if (!bio.trim() || bio.trim().length < 10) {
      setError("يرجى كتابة نبذة كافية عن خبراتك وسبب رغبتك بالانضمام");
      return;
    }

    if (role === "creator" && !channelUrl.trim()) {
      setError("يرجى وضع رابط قناتك على اليوتيوب");
      return;
    }
    if (role === "streamer" && !streamUrl.trim()) {
      setError("يرجى وضع رابط حساب البث (تيك توك، تويتش، أو كيك)");
      return;
    }

    const payload: SolarApplicationInput = {
      name: name.trim(),
      discord: discord.trim(),
      whatsapp: whatsapp.trim(),
      bio: bio.trim(),
      role,
      ...(role === "admin"
        ? {
            adminSubType,
            ...(adminSubType === "players_supervisor" ||
            adminSubType === "players_admin"
              ? { game }
              : {}),
          }
        : {}),
      ...(role === "creator" ? { channelUrl: channelUrl.trim() } : {}),
      ...(role === "streamer" ? { streamUrl: streamUrl.trim() } : {}),
      ...(role === "editor" || role === "designer" || role === "writer"
        ? { portfolioUrl: portfolioUrl.trim() }
        : {}),
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
        if (data.error === "RATE_LIMIT") {
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

  return (
    <div className="solar-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="solar-modal p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="solar-badge">Solar Recruitment</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">
              تقديم طلب انضمام لكلان Solar ☀️
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
              انضم إلى عائلة ونخبة مبدعي وإداريي كلان Solar System Team.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </header>

        {success ? (
          <div className="space-y-6 text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Check size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                تم استلام طلبك بنجاح! 🚀
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto">
                شكراً لاهتمامك بالانضمام لكلان Solar. ستتم مراجعة طلبك من قبل
                الإدارة والتواصل معك عبر الديسكورد أو الواتساب.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--solar-border)] bg-black/40 p-4 max-w-sm mx-auto">
              <p className="text-xs text-[var(--text-muted)]">رقم التتبع الخاص بطلبك</p>
              <code dir="ltr" className="mt-1 block text-sm font-bold text-amber-400">
                {success.reference}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/tracking?reference=${success.reference}`}
                className="solar-btn-primary"
              >
                تتبع حالة الطلب
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="solar-btn-secondary"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  الاسم واللقب *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد (Z7_Sniper)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="solar-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  حساب الديسكورد (Discord) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: zo7al أو zo7al#0001"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  className="solar-input"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                رقم هاتف الواتساب للتواصل (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="مثال: +966 50 123 4567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="solar-input"
                dir="ltr"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                الرتبة / المجال المطلوب *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as SolarRole)}
                className="solar-select"
              >
                <option value="creator">صانع محتوى (Content Creator)</option>
                <option value="streamer">ستريمر (Streamer)</option>
                <option value="admin">إداري (Staff / Management)</option>
                <option value="editor">ممنتج (Video Editor)</option>
                <option value="designer">مصمم (Graphic Designer)</option>
                <option value="writer">كاتب أفكار وسيناريوهات (Idea Writer)</option>
              </select>
            </div>

            {/* Dynamic Admin Sub-types */}
            {role === "admin" && (
              <div className="rounded-xl border border-[var(--solar-border)] bg-amber-500/5 p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                    نوع الإشراف / الرتبة الإدارية *
                  </label>
                  <select
                    value={adminSubType}
                    onChange={(e) =>
                      setAdminSubType(e.target.value as SolarAdminSubType)
                    }
                    className="solar-select"
                  >
                    <option value="exec_supervisor">مشرف تنفيذي</option>
                    <option value="dept_supervisor">مشرف أقسام</option>
                    <option value="general_admin">إدارة عامة</option>
                    <option value="admin_monitor">مراقب إدارة</option>
                    <option value="creators_supervisor">مشرف صناع محتوى</option>
                    <option value="creators_admin">إداري صناع محتوى</option>
                    <option value="designers_supervisor">مشرف مصممين</option>
                    <option value="editors_supervisor">مشرف ممنتجين</option>
                    <option value="streamers_supervisor">مشرف ستريمرز</option>
                    <option value="players_supervisor">مشرف لاعبين</option>
                    <option value="players_admin">إداري لاعبين</option>
                  </select>
                </div>

                {(adminSubType === "players_supervisor" ||
                  adminSubType === "players_admin") && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                      حدد قسم اللعبة التنافسية *
                    </label>
                    <select
                      value={game}
                      onChange={(e) => setGame(e.target.value as SolarGame)}
                      className="solar-select"
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

            {/* Dynamic Creator / Streamer / Media Links */}
            {role === "creator" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط قناتك على اليوتيوب (YouTube Channel) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/@yourchannel"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="solar-input"
                  dir="ltr"
                />
              </div>
            )}

            {role === "streamer" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط قناة البث (تيك توك أو تويتش أو كيك) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://twitch.tv/username أو https://tiktok.com/@user"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="solar-input"
                  dir="ltr"
                />
              </div>
            )}

            {(role === "editor" || role === "designer" || role === "writer") && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  رابط معرض الأعمال أو نماذج العمل (Portfolio / Drive / Behance)
                </label>
                <input
                  type="url"
                  placeholder="https://behance.net/username أو رابط Google Drive"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="solar-input"
                  dir="ltr"
                />
              </div>
            )}

            {/* Bio & Reason */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                نبذة عنك، خبراتك السابقة، ولماذا ترغب بالانضمام لكلان Solar؟ *
              </label>
              <textarea
                required
                rows={4}
                placeholder="تحدث بإيجاز عن مهاراتك، إنجازاتك، بطولاتك أو كلانات سابقة كنت فيها، وكيف يمكنك إفادة الكلان..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="solar-input resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="solar-btn-secondary"
                disabled={busy}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="solar-btn-primary"
                disabled={busy}
              >
                {busy ? "جاري الإرسال..." : "إرسال طلب الانضمام 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
