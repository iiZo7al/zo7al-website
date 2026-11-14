"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sliders,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  CalendarClock,
} from "lucide-react";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { Skeleton } from "@/components/ui/Skeleton";
import SolarContractViewerModal from "./SolarContractViewerModal";
import SolarExcelSheet from "./SolarExcelSheet";
import SolarMembersManager from "./SolarMembersManager";
import type { DashboardData, Mutate, RequestRow } from "./types";
import type { SolarAdminSubType, SolarRole } from "@/lib/data/solar";
import { SOLAR_LEAVE_DURATION_LABELS } from "@/lib/data/solar-leave";
import type { SolarSettings } from "@/lib/server/solar-settings";

const ROLE_LABELS: Record<string, string> = {
  creator: "صانع محتوى (Content Creator)",
  streamer: "ستريمر (Streamer)",
  player: "لاعب تنافسي (Competitive Player)",
  admin: "إداري / إشراف (Staff)",
  writer: "كاتب أفكار (Idea Writer)",
  editor: "ممنتج فيديو (Video Editor)",
  designer: "مصمم جرافيك (Designer)",
};

const CONTRACT_LABELS: Record<string, string> = {
  "2_months": "شهرين",
  "3_months": "ثلاثة شهور",
  "4_months": "اربع شهور",
  "5_months": "خمسة شهور",
  "6_months": "ستة شهور",
  "1_year": "سنة",
  "2_years": "سنتين",
  other: "أخرى",
};

const SUBTYPE_LABELS: Record<string, string> = {
  president: "الرئيس",
  vice_president: "نائب الرئيس",
  exec_supervisor: "مشرف تنفيذي",
  dept_supervisor: "مشرف أقسام",
  general_admin: "إدارة عامة",
  admin_monitor: "مراقب إدارة",
  creators_supervisor: "مشرف صناع محتوى",
  creators_admin: "إداري صناع محتوى",
  designers_supervisor: "مشرف مصممين",
  players_supervisor: "مشرف لاعبين",
  players_admin: "إداري لاعبين",
  editors_supervisor: "مشرف ممنتجين",
  streamers_supervisor: "مشرف ستريمرز",
};

const GAME_LABELS: Record<string, string> = {
  fortnite: "فورتنايت (Fortnite)",
  rocket: "روكيت ليق (Rocket League)",
  minecraft: "ماينكرافت (Minecraft)",
  fifa: "فيفا / FC (FIFA)",
};

const ALL_ROLES: { id: SolarRole; label: string }[] = [
  { id: "creator", label: "صناع المحتوى" },
  { id: "streamer", label: "الستريمرز" },
  { id: "player", label: "لاعبين (الفريق التنافسي)" },
  { id: "admin", label: "الإدارة والإشراف" },
  { id: "editor", label: "المونتاج" },
  { id: "designer", label: "التصميم" },
  { id: "writer", label: "كتاب الأفكار" },
];

const ALL_ADMIN_SUBTYPES: { id: SolarAdminSubType; label: string }[] = [
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
];

export default function SolarManagement({
  data,
  busy,
  mutate,
  onExpired,
  onReload,
}: {
  data: DashboardData;
  busy: boolean;
  mutate: Mutate;
  onExpired: () => void;
  onReload: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"applicants" | "leaves" | "events" | "members" | "excel" | "settings">("applicants");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<{
    signatureUrl: string;
    name: string;
    isLeave?: boolean;
    isEvents?: boolean;
  } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SolarSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Filter solar clan join applications (excluding leave & events requests)
  const solarApplications = useMemo(() => {
    return data.requests.filter(
      (r) =>
        r.kind === "application" &&
        r.payload.platform !== "solar-leave" &&
        r.payload.platform !== "solar-events" &&
        (r.payload.platform === "solar" ||
          (r.payload.subject && String(r.payload.subject).includes("Solar")))
    );
  }, [data.requests]);

  // Filter solar leave requests
  const solarLeaveRequests = useMemo(() => {
    return data.requests.filter(
      (r) => r.kind === "application" && r.payload.platform === "solar-leave"
    );
  }, [data.requests]);

  // Filter solar Discord events staff applications
  const solarEventsRequests = useMemo(() => {
    return data.requests.filter(
      (r) => r.kind === "application" && r.payload.platform === "solar-events"
    );
  }, [data.requests]);

  // Statistics for join applications
  const stats = useMemo(() => {
    const total = solarApplications.length;
    const pending = solarApplications.filter((r) => r.status === "pending").length;
    const accepted = solarApplications.filter((r) => r.status === "accepted").length;
    const rejected = solarApplications.filter((r) => r.status === "rejected").length;
    return { total, pending, accepted, rejected };
  }, [solarApplications]);

  // Statistics for leave requests
  const leaveStats = useMemo(() => {
    const total = solarLeaveRequests.length;
    const pending = solarLeaveRequests.filter((r) => r.status === "pending").length;
    const accepted = solarLeaveRequests.filter((r) => r.status === "accepted").length;
    const rejected = solarLeaveRequests.filter((r) => r.status === "rejected").length;
    return { total, pending, accepted, rejected };
  }, [solarLeaveRequests]);

  // Statistics for Discord events applications
  const eventsStats = useMemo(() => {
    const total = solarEventsRequests.length;
    const pending = solarEventsRequests.filter((r) => r.status === "pending").length;
    const accepted = solarEventsRequests.filter((r) => r.status === "accepted").length;
    const rejected = solarEventsRequests.filter((r) => r.status === "rejected").length;
    return { total, pending, accepted, rejected };
  }, [solarEventsRequests]);

  // Load Settings
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/solar/settings", { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          onExpired();
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((res) => {
        if (res?.ok && res.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));

    return () => controller.abort();
  }, [onExpired]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || savingSettings) return;

    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res = await fetch("/api/admin/solar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.status === 401) {
        onExpired();
        return;
      }

      const resData = await res.json();
      if (!res.ok || !resData.ok) {
        throw new Error();
      }

      setSettings(resData.settings);
      setSettingsMessage("تم حفظ إعدادات التقديم بنجاح!");
    } catch {
      setSettingsMessage("تعذر حفظ الإعدادات، يرجى المحاولة مجدداً.");
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const matches = (r: RequestRow) => {
    const searchString = `${JSON.stringify(r.payload)} ${r.id} ${r.note}`.toLowerCase();
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || searchString.includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesRole = !roleFilter || String(r.payload.role) === roleFilter;
    return matchesQuery && matchesStatus && matchesRole;
  };

  const filteredRows = solarApplications.filter(matches);
  const filteredLeaveRows = solarLeaveRequests.filter(matches);
  const filteredEventsRows = solarEventsRequests.filter(matches);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Banner */}
      <section className="dash-panel card-glow p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden drop-shadow-[0_8px_16px_rgba(255,122,0,0.3)]">
              <Image
                src="/assets/site/solar-clan-logo.png"
                alt="Solar System Team Logo"
                width={64}
                height={64}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text)]">
                  إدارة كلان Solar System
                </h1>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  Solar Clan
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                مراجعة طلبات الانضمام للكلان، طلبات الإجازة، تحديث حالة المتقدمين، وتعديل إعدادات التقديم المتاحة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("applicants")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "applicants"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Users size={16} />
              طلبات التقديم ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("leaves")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "leaves"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <CalendarClock size={16} />
              طلبات الإجازة ({leaveStats.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "events"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <FileCheck size={16} />
              طلبات إدارة الفعاليات ({eventsStats.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Users size={16} />
              أعضاء الكلان
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("excel")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "excel"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <FileSpreadsheet size={16} />
              جدول Excel والأعضاء
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sliders size={16} />
              إعدادات التقديم
            </button>

            <button
              type="button"
              onClick={onReload}
              title="تحديث البيانات"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] p-2.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Tab: Clan Members */}
      {activeTab === "members" && (
        <SolarMembersManager onExpired={onExpired} />
      )}

      {/* Tab: Excel Sheet & Members */}
      {activeTab === "excel" && (
        <SolarExcelSheet rows={solarApplications} busy={busy} mutate={mutate} />
      )}

      {/* Tab: Leave Requests */}
      {activeTab === "leaves" && (
        <section className="space-y-6">
          {/* Leave Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>إجمالي طلبات الإجازة</span>
                <CalendarClock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {leaveStats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>قيد المراجعة</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {leaveStats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>تم القبول</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {leaveStats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>مرفوضة</span>
                <XCircle size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-rose-400">
                {leaveStats.rejected}
              </strong>
            </button>
          </div>

          {/* Leave Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، الديسكورد، الجوال أو سبب الإجازة..."
                className="dash-search w-full pr-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="accepted">تم القبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          {filteredLeaveRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center text-sm text-[var(--text-muted)]">
              لا توجد طلبات إجازة مطابقة للبحث حالياً.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredLeaveRows.map((row) => (
                <SolarApplicantCard
                  key={row.id + ":" + row.status + ":" + row.note}
                  row={row}
                  busy={busy}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                  onSave={(value) => mutate("review", value)}
                  onRetry={() => mutate("retryApplication", row.id)}
                  onDelete={() => mutate("deleteRequest", row.id)}
                  onViewContract={(sigUrl, appName) =>
                    setViewingContract({ signatureUrl: sigUrl, name: appName, isLeave: true })
                  }
                />
              ))}
            </div>
          )}

          {viewingContract && (
            <SolarContractViewerModal
              isOpen={Boolean(viewingContract)}
              signatureUrl={viewingContract.signatureUrl}
              applicantName={viewingContract.name}
              isLeave={viewingContract.isLeave}
              isEvents={viewingContract.isEvents}
              onClose={() => setViewingContract(null)}
            />
          )}
        </section>
      )}

      {/* Tab: Discord Events Staff Applications */}
      {activeTab === "events" && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>إجمالي طلبات الفعاليات</span>
                <FileCheck size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {eventsStats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>قيد المراجعة</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {eventsStats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>تم القبول</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {eventsStats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>مرفوض</span>
                <XCircle size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-rose-400">
                {eventsStats.rejected}
              </strong>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، العمر، أو يوزر الديسكورد..."
                className="dash-search w-full pr-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="accepted">تم القبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          {filteredEventsRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center text-sm text-[var(--text-muted)]">
              لا توجد طلبات إدارة فعاليات مطابقة للبحث حالياً.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredEventsRows.map((row) => (
                <SolarApplicantCard
                  key={row.id + ":" + row.status + ":" + row.note}
                  row={row}
                  busy={busy}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                  onSave={(value) => mutate("review", value)}
                  onRetry={() => mutate("retryApplication", row.id)}
                  onDelete={() => mutate("deleteRequest", row.id)}
                  onViewContract={(sigUrl, appName) =>
                    setViewingContract({ signatureUrl: sigUrl, name: appName, isEvents: true })
                  }
                />
              ))}
            </div>
          )}

          {viewingContract && (
            <SolarContractViewerModal
              isOpen={Boolean(viewingContract)}
              signatureUrl={viewingContract.signatureUrl}
              applicantName={viewingContract.name}
              isLeave={viewingContract.isLeave}
              isEvents={viewingContract.isEvents}
              onClose={() => setViewingContract(null)}
            />
          )}
        </section>
      )}

      {/* Tab 1: Applicants Review */}
      {activeTab === "applicants" && (
        <section className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>إجمالي الطلبات</span>
                <Users size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {stats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>قيد المراجعة</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {stats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>تم القبول</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {stats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border text-right transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>مرفوضة</span>
                <XCircle size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-rose-400">
                {stats.rejected}
              </strong>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، الديسكورد، الواتساب أو رقم الطلب..."
                className="dash-search w-full pr-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="accepted">تم القبول</option>
              <option value="rejected">مرفوض</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">جميع الأقسام</option>
              <option value="creator">صناع المحتوى</option>
              <option value="streamer">الستريمرز</option>
              <option value="player">لاعبين (الفريق التنافسي)</option>
              <option value="admin">الإدارة والإشراف</option>
              <option value="editor">المونتاج</option>
              <option value="designer">التصميم</option>
              <option value="writer">كتاب الأفكار</option>
            </select>
          </div>

          {/* Applications Grid */}
          <div className="grid gap-5 md:grid-cols-2">
            {filteredRows.map((row) => (
              <SolarApplicantCard
                key={row.id + ":" + row.status + ":" + row.note}
                row={row}
                busy={busy}
                copiedId={copiedId}
                onCopy={copyToClipboard}
                onSave={(value) => mutate("review", value)}
                onRetry={() => mutate("retryApplication", row.id)}
                onDelete={() => mutate("deleteRequest", row.id)}
                onViewContract={(sigUrl, appName) =>
                  setViewingContract({ signatureUrl: sigUrl, name: appName })
                }
              />
            ))}
          </div>

          {viewingContract && (
            <SolarContractViewerModal
              isOpen={!!viewingContract}
              onClose={() => setViewingContract(null)}
              signatureUrl={viewingContract.signatureUrl}
              applicantName={viewingContract.name}
            />
          )}

          {!filteredRows.length && (
            <div className="dash-panel card-glow rounded-2xl border border-[var(--border)] p-12 text-center">
              <Users size={36} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
              <p className="text-base font-medium text-[var(--text)]">
                لا توجد طلبات تقديم مطابقة للبحث أو الفلتر
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                طلبات الانضمام الجديدة لكلان Solar ستظهر هنا بمجرد تقديمها عبر الموقع.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Recruitment Settings ("حق التقديم") */}
      {activeTab === "settings" && (
        <section className="dash-panel card-glow rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="border-b border-[var(--border)] pb-5 mb-6">
            <h2 className="text-xl font-bold text-[var(--text)]">
              إعدادات وحالة التقديم لكلان Solar
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              تحكم في فتح وإغلاق التقديم العام، وتفعيل أو إيقاف التقديم على أقسام ورتب معينة، وإضافة إعلانات تظهر للمتقدمين.
            </p>
          </div>

          {loadingSettings ? (
            <div className="space-y-4 py-4" aria-busy="true" aria-label="جاري تحميل إعدادات التقديم...">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          ) : !settings ? (
            <div className="p-8 text-center text-red-400">
              تعذر تحميل إعدادات التقديم.
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsMessage && (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    settingsMessage.includes("بنجاح")
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {settingsMessage}
                </div>
              )}

              {/* General Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-black/20 p-5">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    حالة التقديم العامة للكلان
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    عند إغلاق التقديم، لن يتمكن أي زائر من تقديم طلب جديد وسيظهر تنبيه بأن التقديم مغلق.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isOpen}
                    onChange={(e) =>
                      setSettings({ ...settings, isOpen: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  <span className="mr-3 text-sm font-bold">
                    {settings.isOpen ? (
                      <span className="text-emerald-400">مفتوح</span>
                    ) : (
                      <span className="text-rose-400">مغلق</span>
                    )}
                  </span>
                </label>
              </div>

              {/* Per-Division Toggles */}
              <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    التقديم حسب الأقسام والرتب
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    حدد الأقسام المتاحة للتقديم حالياً، ويمكنك إغلاق أي قسم مكتمل لا يستقبل أعضاء جدد.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {ALL_ROLES.map((role) => {
                    const isClosed = settings.closedRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                          isClosed
                            ? "border-[var(--border)] bg-zinc-900/40 opacity-75"
                            : "border-[var(--accent)]/40 bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!isClosed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedClosed = checked
                                ? settings.closedRoles.filter((r) => r !== role.id)
                                : [...settings.closedRoles, role.id];
                              setSettings({
                                ...settings,
                                closedRoles: updatedClosed,
                              });
                            }}
                            className="h-4 w-4 rounded accent-[var(--accent)]"
                          />
                          <span className="text-sm font-semibold text-[var(--text)]">
                            {role.label}
                          </span>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isClosed
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {isClosed ? "مغلق" : "متاح للتقديم"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Per-Admin-Rank Toggles */}
              <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    التحكم في رتب الإدارة (تظهر للمتقدم ولكن لا تنضغط إذا كانت مغلقة)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    عند إغلاق أي رتبة إدارية مثل الرئيس أو نائب الرئيس، ستظهر في قائمة التقديم كخيار غير قابل للاختيار ومغلق مؤقتاً.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ALL_ADMIN_SUBTYPES.map((sub) => {
                    const closedSubs = settings.closedAdminSubTypes ?? [];
                    const isClosed = closedSubs.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isClosed
                            ? "border-[var(--border)] bg-zinc-900/40 opacity-75"
                            : "border-[var(--accent)]/40 bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={!isClosed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedClosed = checked
                                ? closedSubs.filter((s) => s !== sub.id)
                                : [...closedSubs, sub.id];
                              setSettings({
                                ...settings,
                                closedAdminSubTypes: updatedClosed,
                              });
                            }}
                            className="h-4 w-4 rounded accent-[var(--accent)]"
                          />
                          <span className="text-xs font-semibold text-[var(--text)]">
                            {sub.label}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                            isClosed
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {isClosed ? "مغلق (لا ينضغط)" : "متاح"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Announcement / Message to Applicants */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">
                  إعلان أو تنبيه التقديم (اختياري)
                </label>
                <p className="text-xs text-[var(--text-muted)]">
                  رسالة تظهر في أعلى نافذة التقديم (مثل: &quot;نبحث حالياً عن لاعبين تنافسيين لفريق فورتنايت ومحرري فيديو&quot;).
                </p>
                <input
                  type="text"
                  value={settings.announcement}
                  onChange={(e) =>
                    setSettings({ ...settings, announcement: e.target.value })
                  }
                  maxLength={500}
                  placeholder="اكتب إعلاناً أو تنبيهاً يظهر للمتقدمين..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              {/* Requirements & Guidelines */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">
                  شروط وملاحظات التقديم
                </label>
                <p className="text-xs text-[var(--text-muted)]">
                  تعليمات توضح شروط القبول ومتطلبات كل رتبة.
                </p>
                <textarea
                  value={settings.requirements}
                  onChange={(e) =>
                    setSettings({ ...settings, requirements: e.target.value })
                  }
                  maxLength={2000}
                  rows={4}
                  placeholder="مثال: يرجى إرفاق رابط القناة أو البث والتأكد من إمكانية التواصل عبر الديسكورد..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  style={{ background: "var(--accent)", color: "#07080b" }}
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw size={16} className="dash-spinning" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      حفظ إعدادات التقديم
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function SolarApplicantCard({
  row,
  busy,
  copiedId,
  onCopy,
  onSave,
  onRetry,
  onDelete,
  onViewContract,
}: {
  row: RequestRow;
  busy: boolean;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onSave: (value: unknown) => Promise<boolean>;
  onRetry: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onViewContract: (sigUrl: string, name: string) => void;
}) {
  const t = useTranslations("hub");
  const locale = useLocale();

  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState(row.note);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const payload = row.payload as Record<string, unknown>;
  const isLeaveRequest = payload.platform === "solar-leave";
  const isEventsRequest = payload.platform === "solar-events";
  const name = typeof payload.name === "string" ? payload.name : "متقدم بدون اسم";
  const nickname = typeof payload.nickname === "string" ? payload.nickname : null;
  const age = payload.age ? String(payload.age) : null;
  const country = typeof payload.country === "string" ? payload.country : null;
  const role = typeof payload.role === "string" ? payload.role : "creator";
  const roleName = isLeaveRequest
    ? "طلب إجازة"
    : isEventsRequest
    ? "إدارة فعاليات ديسكورد"
    : ROLE_LABELS[role] || role;
  const adminSubType =
    typeof payload.adminSubType === "string"
      ? SUBTYPE_LABELS[payload.adminSubType] || payload.adminSubType
      : null;
  const game =
    typeof payload.game === "string"
      ? GAME_LABELS[payload.game] || payload.game
      : null;
  const discord = typeof payload.discord === "string" ? payload.discord : "";
  const whatsapp =
    typeof payload.whatsapp === "string"
      ? payload.whatsapp
      : typeof payload.phone === "string"
      ? payload.phone
      : "";
  const channelUrl = typeof payload.channelUrl === "string" ? payload.channelUrl : "";
  const streamUrl = typeof payload.streamUrl === "string" ? payload.streamUrl : "";
  const portfolioUrl = typeof payload.portfolioUrl === "string" ? payload.portfolioUrl : "";
  const experienceDuration =
    typeof payload.experienceDuration === "string"
      ? payload.experienceDuration
      : null;
  const hasPreviousClans =
    typeof payload.hasPreviousClans === "boolean"
      ? payload.hasPreviousClans
      : null;
  const contractDurationRaw =
    typeof payload.contractDuration === "string"
      ? payload.contractDuration
      : "";
  const contractDurationCustom =
    typeof payload.contractDurationCustom === "string"
      ? payload.contractDurationCustom
      : "";
  const contractDuration =
    CONTRACT_LABELS[contractDurationRaw] ||
    contractDurationCustom ||
    contractDurationRaw ||
    null;
  const leaveDurationRaw =
    typeof payload.leaveDuration === "string" ? payload.leaveDuration : "";
  const leaveDurationCustom =
    typeof payload.leaveDurationCustom === "string"
      ? payload.leaveDurationCustom
      : "";
  const leaveDuration =
    leaveDurationRaw === "other" && leaveDurationCustom
      ? leaveDurationCustom
      : SOLAR_LEAVE_DURATION_LABELS[
          leaveDurationRaw as keyof typeof SOLAR_LEAVE_DURATION_LABELS
        ] ||
        leaveDurationRaw ||
        null;
  const signedContractUrl =
    typeof payload.signedContractUrl === "string"
      ? payload.signedContractUrl
      : null;
  const pledgeAgreed =
    payload.pledgeAgreed === true ||
    payload.pledgeAgreed === "true" ||
    payload.pledgeAgreed === "موافق";
  const whyJoin =
    typeof payload.whyJoin === "string"
      ? payload.whyJoin
      : typeof payload.reason === "string"
      ? payload.reason
      : typeof payload.bio === "string"
      ? payload.bio
      : "";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: row.id,
        kind: row.kind,
        status,
        note,
      });
    } finally {
      setSaving(false);
    }
  };

  const whatsappClean = whatsapp ? whatsapp.replace(/[^0-9]/g, "") : null;

  return (
    <form
      onSubmit={handleFormSubmit}
      className="dash-panel card-glow rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 text-right"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-[var(--text)]">
              {name}
              {nickname && (
                <span className="text-sm font-normal text-[var(--text-muted)] mr-1.5">
                  ({nickname})
                </span>
              )}
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                status === "accepted"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : status === "rejected"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {status === "accepted"
                ? "مقبول"
                : status === "rejected"
                ? "مرفوض"
                : "قيد المراجعة"}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-1">
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Riyadh",
            }).format(new Date(row.createdAt))}
          </p>
        </div>

        <span
          className="rounded-lg px-2.5 py-1 text-xs font-bold shrink-0"
          style={{
            background: "color-mix(in srgb, var(--accent) 15%, transparent)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          {isLeaveRequest ? "طلب إجازة" : roleName.split(" ")[0]}
        </span>
      </div>

      {/* Division, Age, Country & Contract Attributes */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
          {isLeaveRequest ? "النوع:" : "الرتبة:"}{" "}
          <strong className="text-[var(--text)]">{roleName}</strong>
        </span>
        {leaveDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            مدة الإجازة: <strong className="text-[var(--accent)]">{leaveDuration}</strong>
          </span>
        )}
        {adminSubType && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            التخصص: <strong className="text-[var(--text)]">{adminSubType}</strong>
          </span>
        )}
        {game && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            اللعبة: <strong className="text-[var(--text)]">{game}</strong>
          </span>
        )}
        {age && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            العمر: <strong className="text-[var(--text)]">{age} سنة</strong>
          </span>
        )}
        {country && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            من وين: <strong className="text-[var(--text)]">{country}</strong>
          </span>
        )}
        {experienceDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            مدة الخبرة: <strong className="text-[var(--text)]">{experienceDuration}</strong>
          </span>
        )}
        {hasPreviousClans !== null && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            كلانات سابقة: <strong className="text-[var(--text)]">{hasPreviousClans ? "نعم" : "لا"}</strong>
          </span>
        )}
        {contractDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            مدة العقد: <strong className="text-[var(--accent)]">{contractDuration}</strong>
          </span>
        )}
        <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
          التعهد: <strong className={pledgeAgreed ? "text-emerald-400" : "text-amber-400"}>
            {pledgeAgreed ? "موافق وملتزم" : "لم يؤكد"}
          </strong>
        </span>
      </div>

      {/* Contact & Links */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        {/* Discord */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
          <span className="text-[var(--text-muted)]">الديسكورد:</span>
          <div className="flex items-center gap-1.5">
            <code dir="ltr" className="font-mono font-semibold text-[var(--text)]">
              {discord || "—"}
            </code>
            {discord && (
              <button
                type="button"
                onClick={() => onCopy(discord, `disc-${row.id}`)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
                title="نسخ اسم الحساب"
              >
                {copiedId === `disc-${row.id}` ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
          <span className="text-[var(--text-muted)]">الواتساب:</span>
          {whatsappClean ? (
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
            >
              <span dir="ltr">{whatsapp}</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </div>
      </div>

      {/* External URLs & Signed Contract Image */}
      {(channelUrl || streamUrl || portfolioUrl || signedContractUrl) && (
        <div className="space-y-1.5 text-xs">
          {channelUrl && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
              <span className="text-[var(--text-muted)]">رابط القناة:</span>
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline truncate max-w-[200px]"
              >
                <span dir="ltr" className="truncate">{channelUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
          {streamUrl && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
              <span className="text-[var(--text-muted)]">رابط البث:</span>
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline truncate max-w-[200px]"
              >
                <span dir="ltr" className="truncate">{streamUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
          {portfolioUrl && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
              <span className="text-[var(--text-muted)]">معرض الأعمال:</span>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline truncate max-w-[200px]"
              >
                <span dir="ltr" className="truncate">{portfolioUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
          {signedContractUrl && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-[var(--accent)] shrink-0" />
                <span className="text-[var(--text)] font-semibold">
                  {isLeaveRequest
                    ? "وثيقة تعهّد الإجازة:"
                    : isEventsRequest
                    ? "وثيقة عقد إدارة الفعاليات:"
                    : "وثيقة العقد والتوقيع:"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewContract(signedContractUrl, name)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer bg-[var(--accent)] text-[#07080b]"
                >
                  <Eye size={13} />
                  <span>معاينة بالعقد / لحاله</span>
                </button>
                <a
                  href={signedContractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline text-xs p-1"
                  title="فتح الرابط الأصلي"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Why Join / Leave Reason */}
      {whyJoin && (
        <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3 text-xs space-y-1">
          <p className="font-semibold text-[var(--text-muted)]">
            {isLeaveRequest
              ? "لماذا ترغب باخذ اجازة في Solar System؟"
              : "لماذا ترغب بالانضمام إلى Solar System؟"}
          </p>
          <div className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
            <MarkdownContent>{whyJoin}</MarkdownContent>
          </div>
        </div>
      )}

      {/* Discord Notification Status */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]">
        <span
          className={`dash-tag ${
            row.discordReceipt ? "dash-tag-green" : ""
          }`}
        >
          {t(row.discordReceipt ? "discordDelivered" : "discordPending")}
        </span>

        {!row.discordReceipt && (
          <button
            type="button"
            className="dash-button"
            disabled={busy}
            onClick={() => void onRetry()}
          >
            <Send size={13} />
            إعادة إرسال للديسكورد
          </button>
        )}
      </div>

      {/* Review Actions */}
      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[var(--border)]">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            حالة الطلب:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]"
          >
            <option value="pending">قيد المراجعة</option>
            <option value="accepted">قبول الطلب</option>
            <option value="rejected">رفض الطلب</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            ملاحظات الإدارة للطلب (تظهر للمتقدم):
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: تم قبولك وسيتم التواصل معك بالديسكورد..."
            maxLength={2000}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={busy || saving || deleting}
          onClick={async () => {
            if (
              window.confirm(
                `هل أنت متأكد من حذف طلب "${name}" نهائياً من لوحة التحكم؟ لا يمكن التراجع عن هذا الإجراء.`
              )
            ) {
              setDeleting(true);
              try {
                await onDelete();
              } finally {
                setDeleting(false);
              }
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Trash2 size={13} />
          <span>{deleting ? "جاري الحذف..." : "حذف الطلب"}</span>
        </button>

        <button
          type="submit"
          disabled={busy || saving || deleting}
          className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          style={{ background: "var(--accent)", color: "#07080b" }}
        >
          {saving ? (
            <>
              <RefreshCw size={13} className="dash-spinning" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Check size={13} />
              حفظ حالة الطلب
            </>
          )}
        </button>
      </div>
    </form>
  );
}
