"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HandHelping,
  Loader2,
  Palette,
  PenTool,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  UserRound,
  Video,
  X,
  XCircle,
} from "lucide-react";
import {
  SOLAR_TARGET_ROLE_CONFIG,
  type SolarCollaborationRequest,
  type SolarRequestTargetRole,
} from "@/lib/data/solar-requests";
import { resolveDutiesRoleId } from "@/lib/data/solar-duties";

interface SolarCollaborationRequestsProps {
  userRank?: string | null;
  userName?: string;
  userAvatar?: string | null;
}

const ROLE_BADGE_ICONS: Record<SolarRequestTargetRole, LucideIcon> = {
  writer: PenTool,
  editor: Video,
  designer: Palette,
};

export default function SolarCollaborationRequests({
  userRank,
  userName,
  userAvatar,
}: SolarCollaborationRequestsProps) {
  const userRoleId = resolveDutiesRoleId(userRank);
  const isCreatorOrAdmin = userRoleId === "creator" || userRoleId === "admin";
  const isWorkerOrAdmin =
    userRoleId === "writer" ||
    userRoleId === "editor" ||
    userRoleId === "designer" ||
    userRoleId === "admin";

  const [requests, setRequests] = useState<SolarCollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<SolarRequestTargetRole>("editor");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [deadline, setDeadline] = useState("");

  // Worker view filter
  const [workerFilter, setWorkerFilter] = useState<"pending" | "my_tasks" | "all">("pending");

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/solar/requests", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !details.trim()) {
      setErrorMsg("يرجى كتابة عنوان وتفاصيل الطلب.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/solar/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          title: title.trim(),
          details: details.trim(),
          materialsUrl: materialsUrl.trim() || undefined,
          deadline: deadline.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "فشل إرسال الطلب");
      }

      setSuccessMsg("تم إرسال طلبك بنجاح! سيظهر الآن لأعضاء القسم المختار.");
      setTitle("");
      setDetails("");
      setMaterialsUrl("");
      setDeadline("");
      setFormOpen(false);
      await loadRequests();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (requestId: string, action: "accept" | "complete" | "cancel") => {
    setActionLoadingId(requestId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/solar/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "فشل الإجراء");
      }

      if (action === "accept") {
        setSuccessMsg("تم قبول واستلام الطلب بنجاح! يمكنك البدء بالعمل عليه.");
      } else if (action === "complete") {
        setSuccessMsg("تهانينا! تم وسم الطلب كمكتمل.");
      } else if (action === "cancel") {
        setSuccessMsg("تم إلغاء الطلب بنجاح.");
      }

      await loadRequests();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء تنفيذ الإجراء");
    } finally {
      setActionLoadingId(null);
    }
  };

  // If user is neither creator nor worker, return null
  if (!isCreatorOrAdmin && !isWorkerOrAdmin) {
    return null;
  }

  // Requests created by the current creator
  const myCreatedRequests = requests.filter((r) => r.creatorName === userName);

  // Requests directed to the worker's department
  const departmentRequests = requests.filter((r) => {
    if (userRoleId === "admin") return true;
    return r.targetRole === userRoleId;
  });

  const filteredDepartmentRequests = departmentRequests.filter((r) => {
    if (workerFilter === "pending") return r.status === "pending";
    if (workerFilter === "my_tasks") return r.acceptedByName === userName;
    return true;
  });

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)]"
            style={{
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
            }}
          >
            <HandHelping size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                {isCreatorOrAdmin ? "طلبات التعاون مع الفريق" : "الطلبات الواردة لقسمك"}
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              >
                تنسيق العمل
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {isCreatorOrAdmin
                ? "يمكنك كصانع محتوى طلب أفكار وسيناريوهات، مونتاج مقاطع، أو صور مصغرة وتصاميم من أعضاء الكلان."
                : "الطلبات والمشاريع المحولة لقسمك من صناع المحتوى في كلان Solar."}
            </p>
          </div>
        </div>

        {/* Creator New Request Button */}
        {isCreatorOrAdmin && (
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            style={{ background: "var(--accent)", color: "#07080B" }}
          >
            {formOpen ? <X size={15} /> : <Plus size={15} />}
            <span>{formOpen ? "إغلاق النموذج" : "إنشاء طلب جديد"}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* New Request Form (Collapsible) */}
      {formOpen && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreateRequest}
          className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4"
        >
          <div className="border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              <span>إرسال طلب عمل جديد لأعضاء الفريق</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              حدد القسم المستهدف واشرح ما تحتاجه بدقة لتسهيل استلام الطلب والعمل عليه.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Target Role selection */}
            {(["writer", "editor", "designer"] as SolarRequestTargetRole[]).map((role) => {
              const cfg = SOLAR_TARGET_ROLE_CONFIG[role];
              const Icon = ROLE_BADGE_ICONS[role];
              const isSelected = targetRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-right transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--accent)] shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                  }`}
                  style={
                    isSelected
                      ? {
                          background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                          color: "var(--text)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={isSelected ? "text-[var(--accent)]" : ""} />
                    <span className="text-xs font-bold text-[var(--text)]">{cfg.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text)]">عنوان الطلب *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={SOLAR_TARGET_ROLE_CONFIG[targetRole].placeholder}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text)]">
              تفاصيل ومتطلبات الطلب *
            </label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اكتب الأفكار، المدة المقترحة، الستايل المطلوب، وملاحظاتك بالتفصيل..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Materials Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text)]">
                رابط ملفات العمل / المواد الخام (اختياري)
              </label>
              <input
                type="url"
                value={materialsUrl}
                onChange={(e) => setMaterialsUrl(e.target.value)}
                placeholder="رابط درايف، مجلد أو ملفات العمل..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text)]">
                الموعد المتوقع للتسليم (اختياري)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="مثال: خلال يومين، قبل يوم الجمعة..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)", color: "#07080B" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{submitting ? "جاري الإرسال..." : "إرسال الطلب للقسم"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Content for Workers (Writers, Editors, Designers) */}
      {isWorkerOrAdmin && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text)]">
                الطلبات المحولة للقسم ({departmentRequests.length})
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWorkerFilter("pending")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  workerFilter === "pending"
                    ? "bg-[var(--accent)] text-[#07080B]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                بانتظار الاستلام
              </button>
              <button
                type="button"
                onClick={() => setWorkerFilter("my_tasks")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  workerFilter === "my_tasks"
                    ? "bg-[var(--accent)] text-[#07080B]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                طلبات استلمتها
              </button>
              <button
                type="button"
                onClick={() => setWorkerFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  workerFilter === "all"
                    ? "bg-[var(--accent)] text-[#07080B]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                الكل
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-muted)]">
              جاري تحميل الطلبات...
            </div>
          ) : filteredDepartmentRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-muted)]">
              لا توجد طلبات حالياً في هذا القسم.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredDepartmentRequests.map((req) => {
                const RoleIcon = ROLE_BADGE_ICONS[req.targetRole] || Video;
                const isMyTask = req.acceptedByName === userName;
                const isActionLoading = actionLoadingId === req.id;

                return (
                  <article
                    key={req.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-5 space-y-3.5 transition-colors hover:border-[var(--border-strong)]"
                  >
                    {/* Top Row: Creator Info & Role Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
                          {req.creatorAvatar ? (
                            <Image
                              src={req.creatorAvatar}
                              alt={req.creatorName}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound size={16} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-[var(--text)] truncate">
                            {req.creatorName}
                          </span>
                          <span className="block text-[10px] text-[var(--text-muted)]">
                            صانع محتوى
                          </span>
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                          color: "var(--accent)",
                        }}
                      >
                        <RoleIcon size={12} />
                        <span>{SOLAR_TARGET_ROLE_CONFIG[req.targetRole].label.split(" ")[0]}</span>
                      </span>
                    </div>

                    {/* Title & Details */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-[var(--text)] leading-snug">
                        {req.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                        {req.details}
                      </p>
                    </div>

                    {/* Materials & Deadline */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-[var(--text-muted)]">
                      {req.materialsUrl && (
                        <a
                          href={req.materialsUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--accent)] hover:underline"
                        >
                          <ExternalLink size={11} />
                          <span>ملفات العمل المرفقة</span>
                        </a>
                      )}
                      {req.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-black/20 px-2 py-1">
                          <Calendar size={11} />
                          <span>الموعد: {req.deadline}</span>
                        </span>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                      {/* Status */}
                      <div>
                        {req.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                            <Clock size={12} />
                            <span>بانتظار الاستلام</span>
                          </span>
                        ) : req.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-semibold">
                            <UserCheck size={12} />
                            <span>مستلم من: {req.acceptedByName}</span>
                          </span>
                        ) : req.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 size={12} />
                            <span>مكتمل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                            <XCircle size={12} />
                            <span>ملغي</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {req.status === "pending" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleAction(req.id, "accept")}
                            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                            style={{ background: "var(--accent)", color: "#07080B" }}
                          >
                            {isActionLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            <span>قبول واستلام الطلب</span>
                          </button>
                        )}

                        {req.status === "in_progress" && (isMyTask || userRoleId === "admin") && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleAction(req.id, "complete")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 px-4 py-1.5 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            <span>تعليم كمكتمل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Creator My Requests History */}
      {isCreatorOrAdmin && myCreatedRequests.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text)]">
              طلباتك المرسلة ({myCreatedRequests.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {myCreatedRequests.map((req) => {
              const RoleIcon = ROLE_BADGE_ICONS[req.targetRole] || Video;
              const isActionLoading = actionLoadingId === req.id;

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      <RoleIcon size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text)] truncate">{req.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ({SOLAR_TARGET_ROLE_CONFIG[req.targetRole].label.split(" ")[0]})
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate max-w-md mt-0.5">
                        {req.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        req.status === "pending"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : req.status === "in_progress"
                            ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                            : req.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {req.status === "pending" && <Clock size={12} />}
                      {req.status === "in_progress" && <UserCheck size={12} />}
                      {req.status === "completed" && <CheckCircle2 size={12} />}
                      {req.status === "cancelled" && <XCircle size={12} />}
                      <span>
                        {req.status === "pending"
                          ? "بانتظار الاستلام"
                          : req.status === "in_progress"
                            ? `استلمه: ${req.acceptedByName || "عضو"}`
                            : req.status === "completed"
                              ? "مكتمل"
                              : "ملغي"}
                      </span>
                    </span>

                    {/* Cancel action if still pending */}
                    {req.status === "pending" && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAction(req.id, "cancel")}
                        className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        إلغاء الطلب
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
