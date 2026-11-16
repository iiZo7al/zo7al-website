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
  Plus,
  Pencil,
  X,
  ShieldAlert,
} from "lucide-react";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { Skeleton } from "@/components/ui/Skeleton";
import SolarContractViewerModal from "./SolarContractViewerModal";
import SolarExcelSheet from "./SolarExcelSheet";
import SolarMembersManager from "./SolarMembersManager";
import SolarWarningsManager from "./SolarWarningsManager";
import type { DashboardData, Mutate, RequestRow } from "./types";
import type { SolarAdminSubType, SolarRole } from "@/lib/data/solar";
import { roleNeedsGame } from "@/lib/data/solar-members";
import { SOLAR_LEAVE_DURATION_LABELS } from "@/lib/data/solar-leave";
import { buildSolarPlanRows, matchesPlanRow } from "@/lib/data/solar-plan";
import type { CustomSolarOption, SolarSettings } from "@/lib/server/solar-settings";
import { solarDashboardCopy } from "@/lib/data/solar-dashboard-i18n";
import { solarModalsCopy } from "@/lib/data/solar-modals-i18n";
import { translateSolarRank } from "@/lib/data/solar-i18n";

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
  cod: "كود (Call of Duty)",
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
  const locale = useLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const m = solarDashboardCopy(locale).management;

  const [activeTab, setActiveTab] = useState<"applicants" | "leaves" | "events" | "members" | "excel" | "warnings" | "settings">("applicants");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<{
    signatureUrl: string;
    name: string;
    isLeave?: boolean;
    isEvents?: boolean;
    isWarning?: boolean;
  } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SolarSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newSubTypeLabel, setNewSubTypeLabel] = useState("");
  const [newGameLabel, setNewGameLabel] = useState("");
  const [editingItem, setEditingItem] = useState<{
    kind: "role" | "sub" | "game";
    id: string;
    custom: boolean;
    draft: string;
  } | null>(null);

  const makeCustomId = (prefix: string) =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const handleSaveItemName = () => {
    if (!settings || !editingItem) return;
    const trimmed = editingItem.draft.trim();
    if (!trimmed) return;
    if (editingItem.custom) {
      if (editingItem.kind === "role") {
        setSettings({
          ...settings,
          customRoles: (settings.customRoles ?? []).map((r) =>
            r.id === editingItem.id ? { ...r, label: trimmed } : r
          ),
        });
      } else if (editingItem.kind === "sub") {
        setSettings({
          ...settings,
          customAdminSubTypes: (settings.customAdminSubTypes ?? []).map((s) =>
            s.id === editingItem.id ? { ...s, label: trimmed } : s
          ),
        });
      } else {
        setSettings({
          ...settings,
          customGames: (settings.customGames ?? []).map((g) =>
            g.id === editingItem.id ? { ...g, label: trimmed } : g
          ),
        });
      }
    } else {
      const key = `${editingItem.kind}:${editingItem.id}`;
      setSettings({
        ...settings,
        labelOverrides: {
          ...(settings.labelOverrides ?? {}),
          [key]: trimmed,
        },
      });
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (kind: "role" | "sub" | "game", id: string, custom: boolean) => {
    if (!settings) return;
    if (editingItem?.kind === kind && editingItem.id === id) {
      setEditingItem(null);
    }
    if (custom) {
      if (kind === "role") {
        setSettings({
          ...settings,
          customRoles: (settings.customRoles ?? []).filter((r) => r.id !== id),
          closedRoles: settings.closedRoles.filter((r) => r !== id),
        });
      } else if (kind === "sub") {
        setSettings({
          ...settings,
          customAdminSubTypes: (settings.customAdminSubTypes ?? []).filter((s) => s.id !== id),
          closedAdminSubTypes: (settings.closedAdminSubTypes ?? []).filter((s) => s !== id),
        });
      } else {
        setSettings({
          ...settings,
          customGames: (settings.customGames ?? []).filter((g) => g.id !== id),
          closedGames: (settings.closedGames ?? []).filter((g) => g !== id),
        });
      }
    } else {
      if (kind === "role") {
        const hidden = settings.hiddenRoles ?? [];
        setSettings({
          ...settings,
          hiddenRoles: hidden.includes(id) ? hidden : [...hidden, id],
        });
      } else if (kind === "sub") {
        const hidden = settings.hiddenAdminSubTypes ?? [];
        setSettings({
          ...settings,
          hiddenAdminSubTypes: hidden.includes(id) ? hidden : [...hidden, id],
        });
      } else {
        const hidden = settings.hiddenGames ?? [];
        setSettings({
          ...settings,
          hiddenGames: hidden.includes(id) ? hidden : [...hidden, id],
        });
      }
    }
  };

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

  const autoClosedFromExcel = useMemo(() => {
    const roles = new Set<string>();
    const subTypes = new Set<string>();
    const games = new Set<string>();
    if (!settings) return { roles, subTypes, games };

    const acceptedPayloads = solarApplications
      .filter((r) => r.status === "accepted")
      .map((r) => r.payload as Record<string, unknown>);

    const planRows = buildSolarPlanRows({
      customGames: settings.customGames,
      customAdminSubTypes: settings.customAdminSubTypes,
      customRoles: settings.customRoles,
      hiddenRoles: settings.hiddenRoles,
      hiddenAdminSubTypes: settings.hiddenAdminSubTypes,
      hiddenGames: settings.hiddenGames,
      labelOverrides: settings.labelOverrides,
    });

    let playerTotal = 0;
    let playerFull = 0;
    let supTotal = 0;
    let supFull = 0;
    let paTotal = 0;
    let paFull = 0;
    const gameStats = new Map<string, { total: number; full: number }>();

    for (const def of planRows) {
      const required =
        typeof settings.roleQuotas?.[def.key] === "number"
          ? settings.roleQuotas[def.key]
          : def.defaultCount;
      const occupied = acceptedPayloads.filter((p) => matchesPlanRow(p, def)).length;
      const isFull = occupied >= required;

      if (def.game) {
        const cur = gameStats.get(def.game) ?? { total: 0, full: 0 };
        cur.total++;
        if (isFull) cur.full++;
        gameStats.set(def.game, cur);
      }

      if (def.role === "player" && def.game) {
        playerTotal++;
        if (isFull) playerFull++;
      } else if (def.role === "admin" && def.adminSubType === "players_supervisor" && def.game) {
        supTotal++;
        if (isFull) supFull++;
      } else if (def.role === "admin" && def.adminSubType === "players_admin" && def.game) {
        paTotal++;
        if (isFull) paFull++;
      } else if (def.role === "admin" && def.adminSubType && isFull) {
        subTypes.add(def.adminSubType);
      } else if (def.role !== "admin" && isFull) {
        roles.add(def.role);
      }
    }

    if (playerTotal > 0 && playerFull === playerTotal) roles.add("player");
    if (supTotal > 0 && supFull === supTotal) subTypes.add("players_supervisor");
    if (paTotal > 0 && paFull === paTotal) subTypes.add("players_admin");
    for (const [gameId, st] of gameStats.entries()) {
      if (st.total > 0 && st.full === st.total) {
        games.add(gameId);
      }
    }

    return { roles, subTypes, games };
  }, [settings, solarApplications]);

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
      setSettingsSuccess(true);
      setSettingsMessage(m.settingsSaved);
    } catch {
      setSettingsSuccess(false);
      setSettingsMessage(m.settingsSaveError);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveQuotas = async (nextQuotas: Record<string, number>): Promise<boolean> => {
    if (!settings) return false;
    try {
      const res = await fetch("/api/admin/solar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, roleQuotas: nextQuotas }),
      });
      if (res.status === 401) {
        onExpired();
        return false;
      }
      const resData = await res.json();
      if (!res.ok || !resData.ok) return false;
      setSettings(resData.settings);
      return true;
    } catch {
      return false;
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
    <div className="space-y-8" dir={dir}>
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
                  {m.headerTitle}
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
                {m.headerSubtitle}
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
              {m.tabApplications} ({stats.total})
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
              {m.tabLeaves} ({leaveStats.total})
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
              {m.tabEvents} ({eventsStats.total})
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
              {m.tabMembers}
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
              {m.tabExcel}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("warnings")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "warnings"
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <ShieldAlert size={16} />
              {m.tabWarnings}
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
              {m.tabSettings}
            </button>

            <button
              type="button"
              onClick={onReload}
              title={m.refreshDataTitle}
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
        <SolarExcelSheet
          rows={solarApplications}
          busy={busy}
          mutate={mutate}
          settings={settings}
          onSaveQuotas={handleSaveQuotas}
        />
      )}

      {/* Tab: Leave Requests */}
      {activeTab === "leaves" && (
        <section className="space-y-6">
          {/* Leave Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{m.leaveStatTotal}</span>
                <CalendarClock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {leaveStats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>{m.statPending}</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {leaveStats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>{m.statAccepted}</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {leaveStats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>{m.statRejected}</span>
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
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={m.leaveSearchPlaceholder}
                className="dash-search w-full ps-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">{m.allStatuses}</option>
              <option value="pending">{m.statusPending}</option>
              <option value="accepted">{m.statusAccepted}</option>
              <option value="rejected">{m.statusRejected}</option>
            </select>
          </div>

          {filteredLeaveRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center text-sm text-[var(--text-muted)]">
              {m.noMatchingLeaves}
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
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{m.eventsStatTotal}</span>
                <FileCheck size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {eventsStats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>{m.statPending}</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {eventsStats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>{m.statAccepted}</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {eventsStats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>{m.statRejected}</span>
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
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={m.eventsSearchPlaceholder}
                className="dash-search w-full ps-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">{m.allStatuses}</option>
              <option value="pending">{m.statusPending}</option>
              <option value="accepted">{m.statusAccepted}</option>
              <option value="rejected">{m.statusRejected}</option>
            </select>
          </div>

          {filteredEventsRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center text-sm text-[var(--text-muted)]">
              {m.noMatchingEvents}
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
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "" ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{m.statTotal}</span>
                <Users size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-[var(--text)]">
                {stats.total}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>{m.statPending}</span>
                <Clock size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-amber-400">
                {stats.pending}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("accepted")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "accepted"
                  ? "border-emerald-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>{m.statAccepted}</span>
                <CheckCircle2 size={16} />
              </div>
              <strong className="mt-2 block text-2xl font-bold text-emerald-400">
                {stats.accepted}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`dash-panel card-glow p-4 rounded-xl border ${isAr ? "text-right" : "text-left"} transition-all ${
                statusFilter === "rejected"
                  ? "border-rose-500"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400">
                <span>{m.statRejected}</span>
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
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={m.searchPlaceholder}
                className="dash-search w-full ps-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">{m.allStatuses}</option>
              <option value="pending">{m.statusPending}</option>
              <option value="accepted">{m.statusAccepted}</option>
              <option value="rejected">{m.statusRejected}</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              <option value="">{m.allRoles}</option>
              {ALL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {translateSolarRank(r.label, locale)}
                </option>
              ))}
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
                customRoles={settings?.customRoles ?? []}
                customAdminSubTypes={settings?.customAdminSubTypes ?? []}
                customGames={settings?.customGames ?? []}
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
                {m.noMatchingApps}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {m.noAppsHint}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab: Warning Pledges ("التعهدات والإنذارات") */}
      {activeTab === "warnings" && (
        <>
          <SolarWarningsManager
            onExpired={onExpired}
            onViewContract={(sigUrl, appName) =>
              setViewingContract({ signatureUrl: sigUrl, name: appName, isWarning: true })
            }
          />
          {viewingContract && (
            <SolarContractViewerModal
              isOpen={!!viewingContract}
              onClose={() => setViewingContract(null)}
              signatureUrl={viewingContract.signatureUrl}
              applicantName={viewingContract.name}
              isWarning={viewingContract.isWarning}
            />
          )}
        </>
      )}

      {/* Tab 2: Recruitment Settings */}
      {activeTab === "settings" && (
        <section className="dash-panel card-glow rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="border-b border-[var(--border)] pb-5 mb-6">
            <h2 className="text-xl font-bold text-[var(--text)]">
              {m.settingsTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {m.settingsDesc}
            </p>
          </div>

          {loadingSettings ? (
            <div className="space-y-4 py-4" aria-busy="true" aria-label={m.loadingSettingsAria}>
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          ) : !settings ? (
            <div className="p-8 text-center text-red-400">
              {m.settingsLoadError}
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsMessage && (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    settingsSuccess
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
                    {m.globalStatusTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {m.globalStatusDesc}
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
                  <span className="ms-3 text-sm font-bold">
                    {settings.isOpen ? (
                      <span className="text-emerald-400">{m.statusOpen}</span>
                    ) : (
                      <span className="text-rose-400">{m.statusClosed}</span>
                    )}
                  </span>
                </label>
              </div>

              {/* Per-Division Toggles */}
              <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    {m.rolesSectionTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {m.rolesSectionDesc}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ...ALL_ROLES.map((r) => ({
                      id: r.id,
                      label: settings.labelOverrides?.[`role:${r.id}`] || r.label,
                      custom: false,
                    })),
                    ...(settings.customRoles ?? []).map((r) => ({ ...r, custom: true })),
                  ]
                    .filter((role) => !(settings.hiddenRoles ?? []).includes(role.id))
                    .map((role) => {
                      const isManualClosed = settings.closedRoles.includes(role.id);
                      const isAutoClosed = autoClosedFromExcel.roles.has(role.id);
                      const isClosed = isManualClosed || isAutoClosed;
                      const isEditing =
                        editingItem?.kind === "role" && editingItem.id === role.id;
                      const displayLabel = translateSolarRank(role.label, locale);
                      return (
                        <div
                          key={role.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-4 transition-all ${
                            isClosed
                              ? "border-[var(--border)] bg-zinc-900/40 opacity-75"
                              : "border-[var(--accent)]/40 bg-[var(--surface)]"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <input
                                type="text"
                                value={editingItem.draft}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, draft: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveItemName();
                                  } else if (e.key === "Escape") {
                                    setEditingItem(null);
                                  }
                                }}
                                maxLength={60}
                                autoFocus
                                className="flex-1 min-w-0 rounded-lg border border-[var(--accent)] bg-black/30 px-2.5 py-1 text-xs text-[var(--text)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveItemName}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                title={m.saveNameTitle}
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="p-1.5 rounded-lg bg-zinc-500/20 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                                title={m.cancelTitle}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={!isClosed}
                                disabled={isAutoClosed}
                                title={
                                  isAutoClosed
                                    ? m.excelFullTooltip
                                    : undefined
                                }
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
                                className="h-4 w-4 rounded accent-[var(--accent)] shrink-0 disabled:opacity-60"
                              />
                              <span className="text-sm font-semibold text-[var(--text)] truncate">
                                {displayLabel}
                              </span>
                            </label>
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                isClosed
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {isAutoClosed
                                ? m.badgeFull
                                : isManualClosed
                                ? m.badgeClosed
                                : m.badgeOpenRole}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  kind: "role",
                                  id: role.id,
                                  custom: role.custom,
                                  draft: role.label,
                                })
                              }
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/5 rounded-lg cursor-pointer"
                              title={m.editNameTitle}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem("role", role.id, role.custom)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title={m.deleteItemTitle}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                  <input
                    type="text"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    maxLength={60}
                    placeholder={m.newRolePlaceholder}
                    className="flex-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const label = newRoleLabel.trim();
                      if (!label) return;
                      const id = makeCustomId("role");
                      setSettings({
                        ...settings,
                        customRoles: [...(settings.customRoles ?? []), { id, label }],
                      });
                      setNewRoleLabel("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-[var(--accent)] text-[#07080b] cursor-pointer"
                  >
                    <Plus size={14} />
                    {m.addRoleBtn}
                  </button>
                </div>
              </div>

              {/* Per-Admin-Rank Toggles */}
              <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    {m.adminSubsSectionTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {m.adminSubsSectionDesc}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ...ALL_ADMIN_SUBTYPES.map((s) => ({
                      id: s.id,
                      label: settings.labelOverrides?.[`sub:${s.id}`] || s.label,
                      custom: false,
                    })),
                    ...(settings.customAdminSubTypes ?? []).map((s) => ({ ...s, custom: true })),
                  ]
                    .filter((sub) => !(settings.hiddenAdminSubTypes ?? []).includes(sub.id))
                    .map((sub) => {
                      const closedSubs = settings.closedAdminSubTypes ?? [];
                      const isManualClosed = closedSubs.includes(sub.id);
                      const isAutoClosed = autoClosedFromExcel.subTypes.has(sub.id);
                      const isClosed = isManualClosed || isAutoClosed;
                      const isEditing =
                        editingItem?.kind === "sub" && editingItem.id === sub.id;
                      const displayLabel = translateSolarRank(sub.label, locale);
                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-3.5 transition-all ${
                            isClosed
                              ? "border-[var(--border)] bg-zinc-900/40 opacity-75"
                              : "border-[var(--accent)]/40 bg-[var(--surface)]"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <input
                                type="text"
                                value={editingItem.draft}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, draft: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveItemName();
                                  } else if (e.key === "Escape") {
                                    setEditingItem(null);
                                  }
                                }}
                                maxLength={60}
                                autoFocus
                                className="flex-1 min-w-0 rounded-lg border border-[var(--accent)] bg-black/30 px-2 py-1 text-xs text-[var(--text)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveItemName}
                                className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                title={m.saveNameTitle}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="p-1 rounded-lg bg-zinc-500/20 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                                title={m.cancelTitle}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={!isClosed}
                                disabled={isAutoClosed}
                                title={
                                  isAutoClosed
                                    ? m.excelFullTooltip
                                    : undefined
                                }
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
                                className="h-4 w-4 rounded accent-[var(--accent)] shrink-0 disabled:opacity-60"
                              />
                              <span className="text-xs font-semibold text-[var(--text)] truncate">
                                {displayLabel}
                              </span>
                            </label>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                isClosed
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {isAutoClosed
                                ? m.badgeFull
                                : isManualClosed
                                ? m.badgeClosed
                                : m.badgeAvailable}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  kind: "sub",
                                  id: sub.id,
                                  custom: sub.custom,
                                  draft: sub.label,
                                })
                              }
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/5 rounded-lg cursor-pointer"
                              title={m.editNameTitle}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem("sub", sub.id, sub.custom)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title={m.deleteItemTitle}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                  <input
                    type="text"
                    value={newSubTypeLabel}
                    onChange={(e) => setNewSubTypeLabel(e.target.value)}
                    maxLength={60}
                    placeholder={m.newAdminSubPlaceholder}
                    className="flex-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const label = newSubTypeLabel.trim();
                      if (!label) return;
                      const id = makeCustomId("sub");
                      setSettings({
                        ...settings,
                        customAdminSubTypes: [...(settings.customAdminSubTypes ?? []), { id, label }],
                      });
                      setNewSubTypeLabel("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-[var(--accent)] text-[#07080b] cursor-pointer"
                  >
                    <Plus size={14} />
                    {m.addAdminSubBtn}
                  </button>
                </div>
              </div>

              {/* Per-Game Toggles */}
              <div className="rounded-xl border border-[var(--border)] bg-black/20 p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text)]">
                    {m.gamesSectionTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {m.gamesSectionDesc}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ...Object.entries(GAME_LABELS).map(([id, label]) => ({
                      id,
                      label: settings.labelOverrides?.[`game:${id}`] || label,
                      custom: false,
                    })),
                    ...(settings.customGames ?? []).map((g) => ({ ...g, custom: true })),
                  ]
                    .filter((g) => !(settings.hiddenGames ?? []).includes(g.id))
                    .map((g) => {
                      const closedGames = settings.closedGames ?? [];
                      const isManualClosed = closedGames.includes(g.id);
                      const isAutoClosed = autoClosedFromExcel.games.has(g.id);
                      const isClosed = isManualClosed || isAutoClosed;
                      const isEditing =
                        editingItem?.kind === "game" && editingItem.id === g.id;
                      const displayLabel = translateSolarRank(g.label, locale);
                      return (
                        <div
                          key={g.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-3.5 transition-all ${
                            isClosed
                              ? "border-[var(--border)] bg-zinc-900/40 opacity-75"
                              : "border-[var(--accent)]/40 bg-[var(--surface)]"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <input
                                type="text"
                                value={editingItem.draft}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, draft: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveItemName();
                                  } else if (e.key === "Escape") {
                                    setEditingItem(null);
                                  }
                                }}
                                maxLength={60}
                                autoFocus
                                className="flex-1 min-w-0 rounded-lg border border-[var(--accent)] bg-black/30 px-2 py-1 text-xs text-[var(--text)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveItemName}
                                className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                title={m.saveNameTitle}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="p-1 rounded-lg bg-zinc-500/20 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                                title={m.cancelTitle}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={!isClosed}
                                disabled={isAutoClosed}
                                title={
                                  isAutoClosed
                                    ? m.excelFullTooltip
                                    : undefined
                                }
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updatedClosed = checked
                                    ? closedGames.filter((id) => id !== g.id)
                                    : [...closedGames, g.id];
                                  setSettings({
                                    ...settings,
                                    closedGames: updatedClosed,
                                  });
                                }}
                                className="h-4 w-4 rounded accent-[var(--accent)] shrink-0 disabled:opacity-60"
                              />
                              <span className="text-xs font-semibold text-[var(--text)] truncate">
                                {displayLabel}
                              </span>
                            </label>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                isClosed
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {isAutoClosed
                                ? m.badgeFull
                                : isManualClosed
                                ? m.badgeClosed
                                : m.badgeAvailable}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  kind: "game",
                                  id: g.id,
                                  custom: g.custom,
                                  draft: g.label,
                                })
                              }
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/5 rounded-lg cursor-pointer"
                              title={m.editNameTitle}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem("game", g.id, g.custom)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title={m.deleteItemTitle}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                  <input
                    type="text"
                    value={newGameLabel}
                    onChange={(e) => setNewGameLabel(e.target.value)}
                    maxLength={60}
                    placeholder={m.newGamePlaceholder}
                    className="flex-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const label = newGameLabel.trim();
                      if (!label) return;
                      const id = makeCustomId("game");
                      setSettings({
                        ...settings,
                        customGames: [...(settings.customGames ?? []), { id, label }],
                      });
                      setNewGameLabel("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-[var(--accent)] text-[#07080b] cursor-pointer"
                  >
                    <Plus size={14} />
                    {m.addGameBtn}
                  </button>
                </div>
              </div>

              {/* Announcement / Message to Applicants */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">
                  {m.announcementLabel}
                </label>
                <p className="text-xs text-[var(--text-muted)]">
                  {m.announcementHint}
                </p>
                <input
                  type="text"
                  value={settings.announcement}
                  onChange={(e) =>
                    setSettings({ ...settings, announcement: e.target.value })
                  }
                  maxLength={500}
                  placeholder={m.announcementPlaceholder}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              {/* Requirements & Guidelines */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">
                  {m.guidelinesLabel}
                </label>
                <p className="text-xs text-[var(--text-muted)]">
                  {m.guidelinesHint}
                </p>
                <textarea
                  value={settings.requirements}
                  onChange={(e) =>
                    setSettings({ ...settings, requirements: e.target.value })
                  }
                  maxLength={2000}
                  rows={4}
                  placeholder={m.guidelinesPlaceholder}
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
                      {m.savingSettings}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {m.saveSettingsBtn}
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
  customRoles = [],
  customAdminSubTypes = [],
  customGames = [],
  onCopy,
  onSave,
  onRetry,
  onDelete,
  onViewContract,
}: {
  row: RequestRow;
  busy: boolean;
  copiedId: string | null;
  customRoles?: CustomSolarOption[];
  customAdminSubTypes?: CustomSolarOption[];
  customGames?: CustomSolarOption[];
  onCopy: (text: string, id: string) => void;
  onSave: (value: unknown) => Promise<boolean>;
  onRetry: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onViewContract: (sigUrl: string, name: string) => void;
}) {
  const t = useTranslations("hub");
  const locale = useLocale();
  const isAr = locale === "ar";
  const m = solarDashboardCopy(locale).management;
  const modals = solarModalsCopy(locale);

  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState(row.note);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const payload = row.payload as Record<string, unknown>;
  const isLeaveRequest = payload.platform === "solar-leave";
  const isEventsRequest = payload.platform === "solar-events";
  const name = typeof payload.name === "string" ? payload.name : m.unnamedApplicant;
  const nickname = typeof payload.nickname === "string" ? payload.nickname : null;
  const age = payload.age ? String(payload.age) : null;
  const country = typeof payload.country === "string" ? payload.country : null;
  const initialRole = typeof payload.role === "string" ? payload.role : "creator";
  const initialAdminSubType = typeof payload.adminSubType === "string" ? payload.adminSubType : "";
  const initialGame = typeof payload.game === "string" ? payload.game : "";

  const [editedRole, setEditedRole] = useState(initialRole);
  const [editedAdminSubType, setEditedAdminSubType] = useState(initialAdminSubType);
  const [editedGame, setEditedGame] = useState(initialGame);
  const canEditGame = roleNeedsGame(editedRole, editedAdminSubType);

  const role = !isLeaveRequest && !isEventsRequest ? editedRole : initialRole;
  const roleName = isLeaveRequest
    ? m.leaveRequestType
    : isEventsRequest
    ? m.eventsRequestType
    : translateSolarRank(ROLE_LABELS[role] || customRoles.find((r) => r.id === role)?.label || role, locale);
  const adminSubType =
    !isLeaveRequest && !isEventsRequest
      ? editedRole === "admin" && editedAdminSubType
        ? translateSolarRank(
            SUBTYPE_LABELS[editedAdminSubType] ||
              customAdminSubTypes.find((s) => s.id === editedAdminSubType)?.label ||
              editedAdminSubType,
            locale
          )
        : null
      : typeof payload.adminSubType === "string"
      ? translateSolarRank(
          SUBTYPE_LABELS[payload.adminSubType] ||
            customAdminSubTypes.find((s) => s.id === payload.adminSubType)?.label ||
            payload.adminSubType,
          locale
        )
      : null;
  const game =
    !isLeaveRequest && !isEventsRequest
      ? canEditGame && editedGame
        ? translateSolarRank(
            GAME_LABELS[editedGame] || customGames.find((g) => g.id === editedGame)?.label || editedGame,
            locale
          )
        : null
      : typeof payload.game === "string"
      ? translateSolarRank(
          GAME_LABELS[payload.game] || customGames.find((g) => g.id === payload.game)?.label || payload.game,
          locale
        )
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
    modals.apply.contractDurations?.[contractDurationRaw] ||
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
      : modals.leave.durations?.[leaveDurationRaw] ||
        SOLAR_LEAVE_DURATION_LABELS[
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
        ...(!isLeaveRequest && !isEventsRequest
          ? {
              role: editedRole,
              adminSubType: editedRole === "admin" ? editedAdminSubType : "",
              game: canEditGame ? editedGame : "",
            }
          : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  const whatsappClean = whatsapp ? whatsapp.replace(/[^0-9]/g, "") : null;

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`dash-panel card-glow rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 ${isAr ? "text-right" : "text-left"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-[var(--text)]">
              {name}
              {nickname && (
                <span className="text-sm font-normal text-[var(--text-muted)] ms-1.5">
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
                ? m.statusAccepted
                : status === "rejected"
                ? m.statusRejected
                : m.statusPending}
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
          {isLeaveRequest ? m.leaveRequestType : roleName.split(" ")[0]}
        </span>
      </div>

      {/* Division, Age, Country & Contract Attributes */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
          {isLeaveRequest ? m.typePrefix : m.rankPrefix}{" "}
          <strong className="text-[var(--text)]">{roleName}</strong>
        </span>
        {leaveDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.leaveDurationPrefix} <strong className="text-[var(--accent)]">{leaveDuration}</strong>
          </span>
        )}
        {adminSubType && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.adminSubPrefix} <strong className="text-[var(--text)]">{adminSubType}</strong>
          </span>
        )}
        {game && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.gamePrefix} <strong className="text-[var(--text)]">{game}</strong>
          </span>
        )}
        {age && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.agePrefix} <strong className="text-[var(--text)]">{age} {m.yearsSuffix}</strong>
          </span>
        )}
        {country && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.countryPrefix} <strong className="text-[var(--text)]">{country}</strong>
          </span>
        )}
        {experienceDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.experiencePrefix} <strong className="text-[var(--text)]">{experienceDuration}</strong>
          </span>
        )}
        {hasPreviousClans !== null && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.prevClansPrefix} <strong className="text-[var(--text)]">{hasPreviousClans ? m.yes : m.no}</strong>
          </span>
        )}
        {contractDuration && (
          <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
            {m.contractPrefix} <strong className="text-[var(--accent)]">{contractDuration}</strong>
          </span>
        )}
        <span className="rounded-md border border-[var(--border)] bg-black/20 px-2 py-1 text-[var(--text-muted)]">
          {m.pledgePrefix} <strong className={pledgeAgreed ? "text-emerald-400" : "text-amber-400"}>
            {pledgeAgreed ? m.pledgeAgreed : m.pledgeUnconfirmed}
          </strong>
        </span>
      </div>

      {/* Contact & Links */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        {/* Discord */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/20 p-2">
          <span className="text-[var(--text-muted)]">{m.discordPrefix}</span>
          <div className="flex items-center gap-1.5">
            <code dir="ltr" className="font-mono font-semibold text-[var(--text)]">
              {discord || "—"}
            </code>
            {discord && (
              <button
                type="button"
                onClick={() => onCopy(discord, `disc-${row.id}`)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
                title={m.copyDiscordTitle}
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
          <span className="text-[var(--text-muted)]">{m.whatsappPrefix}</span>
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
              <span className="text-[var(--text-muted)]">{m.channelPrefix}</span>
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
              <span className="text-[var(--text-muted)]">{m.streamPrefix}</span>
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
              <span className="text-[var(--text-muted)]">{m.portfolioPrefix}</span>
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
                    ? m.docLeave
                    : isEventsRequest
                    ? m.docEvents
                    : m.docDefault}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewContract(signedContractUrl, name)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer bg-[var(--accent)] text-[#07080b]"
                >
                  <Eye size={13} />
                  <span>{m.previewContractBtn}</span>
                </button>
                <a
                  href={signedContractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline text-xs p-1"
                  title={m.openOriginalTitle}
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
              ? m.reasonLeaveLabel
              : m.reasonApplyLabel}
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
            {m.resendDiscordBtn}
          </button>
        )}
      </div>

      {/* Edit Role, Specialty & Game */}
      {!isLeaveRequest && !isEventsRequest && (
        <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-[var(--border)]">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {m.editRoleLabel}
            </label>
            <select
              value={editedRole}
              onChange={(e) => {
                const nextRole = e.target.value;
                const nextSub = nextRole === "admin" ? editedAdminSubType : "";
                setEditedRole(nextRole);
                if (nextRole !== "admin") setEditedAdminSubType("");
                if (!roleNeedsGame(nextRole, nextSub)) setEditedGame("");
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]"
            >
              {ALL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {translateSolarRank(ROLE_LABELS[r.id] || r.label, locale)}
                </option>
              ))}
              {customRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {m.editAdminSubLabel}
            </label>
            <select
              value={editedRole === "admin" ? editedAdminSubType : ""}
              disabled={editedRole !== "admin"}
              onChange={(e) => {
                const nextSub = e.target.value;
                setEditedAdminSubType(nextSub);
                if (!roleNeedsGame(editedRole, nextSub)) setEditedGame("");
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)] disabled:opacity-50"
            >
              <option value="">
                {editedRole === "admin" ? m.chooseSubOption : m.adminOnlyOption}
              </option>
              {ALL_ADMIN_SUBTYPES.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {translateSolarRank(sub.label, locale)}
                </option>
              ))}
              {customAdminSubTypes.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {m.editGameLabel}
            </label>
            <select
              value={canEditGame ? editedGame : ""}
              disabled={!canEditGame}
              onChange={(e) => setEditedGame(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)] disabled:opacity-50"
            >
              <option value="">
                {canEditGame ? m.unspecifiedOption : m.playersOnlyOption}
              </option>
              {Object.entries(GAME_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {translateSolarRank(label, locale)}
                </option>
              ))}
              {customGames.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Review Actions */}
      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[var(--border)]">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {m.appStatusLabel}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text)]"
          >
            <option value="pending">{m.statusPending}</option>
            <option value="accepted">{m.acceptOption}</option>
            <option value="rejected">{m.rejectOption}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {m.staffNoteLabel}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={m.staffNotePlaceholder}
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
                m.confirmDeleteApp.replace("{name}", name)
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
          <span>{deleting ? m.deleting : m.deleteAppBtn}</span>
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
              {m.savingApp}
            </>
          ) : (
            <>
              <Check size={13} />
              {m.saveAppBtn}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
