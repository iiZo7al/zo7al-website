"use client";

import { useState, useMemo, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Plus,
  Minus,
  Check,
  Trash2,
  Search,
  FileDown,
  Save,
  UserCheck,
  CircleDashed,
  Copy,
} from "lucide-react";
import type { Mutate, RequestRow } from "./types";
import type { SolarSettings } from "@/lib/server/solar-settings";

interface PlanRowDef {
  key: string;
  department: string;
  rankLabel: string;
  defaultCount: number;
  role: string;
  adminSubType?: string;
  game?: string;
  isCustom?: boolean;
}

const BUILTIN_PLAN_ROWS: PlanRowDef[] = [
  // الإدارة العليا
  { key: "admin:president", department: "الإدارة العليا", rankLabel: "الرئيس", defaultCount: 1, role: "admin", adminSubType: "president" },
  { key: "admin:vice_president", department: "الإدارة العليا", rankLabel: "نائب الرئيس", defaultCount: 1, role: "admin", adminSubType: "vice_president" },
  { key: "admin:exec_supervisor", department: "الإدارة العليا", rankLabel: "الرئيس التنفيذي", defaultCount: 1, role: "admin", adminSubType: "exec_supervisor" },
  { key: "admin:dept_supervisor", department: "الإدارة العليا", rankLabel: "مشرف الأقسام", defaultCount: 1, role: "admin", adminSubType: "dept_supervisor" },
  { key: "admin:general_admin", department: "الإدارة العليا", rankLabel: "الإدارة العامة", defaultCount: 2, role: "admin", adminSubType: "general_admin" },
  { key: "admin:admin_monitor", department: "الإدارة العليا", rankLabel: "مراقب الإدارة", defaultCount: 1, role: "admin", adminSubType: "admin_monitor" },

  // صناع المحتوى
  { key: "admin:creators_supervisor", department: "صناع المحتوى", rankLabel: "مشرف صناع المحتوى", defaultCount: 1, role: "admin", adminSubType: "creators_supervisor" },
  { key: "admin:creators_admin", department: "صناع المحتوى", rankLabel: "إداري صناع المحتوى", defaultCount: 2, role: "admin", adminSubType: "creators_admin" },
  { key: "role:creator", department: "صناع المحتوى", rankLabel: "صانع محتوى", defaultCount: 10, role: "creator" },
  { key: "admin:streamers_supervisor", department: "صناع المحتوى", rankLabel: "إداري ستريمر", defaultCount: 1, role: "admin", adminSubType: "streamers_supervisor" },
  { key: "role:streamer", department: "صناع المحتوى", rankLabel: "ستريمر", defaultCount: 3, role: "streamer" },

  // فورتنايت
  { key: "admin:players_supervisor:fortnite", department: "فورتنايت", rankLabel: "مشرف لاعبين فورتنايت", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "fortnite" },
  { key: "admin:players_admin:fortnite", department: "فورتنايت", rankLabel: "إداري لاعبين فورتنايت", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "fortnite" },
  { key: "player:fortnite", department: "فورتنايت", rankLabel: "لاعب فورتنايت", defaultCount: 5, role: "player", game: "fortnite" },

  // ماينكرافت
  { key: "admin:players_supervisor:minecraft", department: "ماينكرافت", rankLabel: "مشرف لاعبين ماينكرافت", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "minecraft" },
  { key: "admin:players_admin:minecraft", department: "ماينكرافت", rankLabel: "إداري لاعبين ماينكرافت", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "minecraft" },
  { key: "player:minecraft", department: "ماينكرافت", rankLabel: "لاعب ماينكرافت", defaultCount: 3, role: "player", game: "minecraft" },

  // روكيت ليق
  { key: "admin:players_supervisor:rocket", department: "روكيت ليق", rankLabel: "مشرف لاعبين روكيت ليق", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "rocket" },
  { key: "admin:players_admin:rocket", department: "روكيت ليق", rankLabel: "إداري لاعبين روكيت ليق", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "rocket" },
  { key: "player:rocket", department: "روكيت ليق", rankLabel: "لاعب روكيت ليق", defaultCount: 5, role: "player", game: "rocket" },

  // فيفا
  { key: "admin:players_supervisor:fifa", department: "فيفا", rankLabel: "مشرف لاعبين فيفا", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "fifa" },
  { key: "admin:players_admin:fifa", department: "فيفا", rankLabel: "إداري لاعبين فيفا", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "fifa" },
  { key: "player:fifa", department: "فيفا", rankLabel: "لاعب فيفا", defaultCount: 5, role: "player", game: "fifa" },

  // كود (Call of Duty)
  { key: "admin:players_supervisor:cod", department: "كود", rankLabel: "مشرف لاعبين كود", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "cod" },
  { key: "admin:players_admin:cod", department: "كود", rankLabel: "إداري لاعبين كود", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "cod" },
  { key: "player:cod", department: "كود", rankLabel: "لاعب كود", defaultCount: 5, role: "player", game: "cod" },

  // الأفكار والتصميم والمونتاج
  { key: "role:writer", department: "الأفكار والتصميم والمونتاج", rankLabel: "كاتب أفكار الكلان", defaultCount: 3, role: "writer" },
  { key: "admin:designers_supervisor", department: "الأفكار والتصميم والمونتاج", rankLabel: "مشرف المصممين", defaultCount: 1, role: "admin", adminSubType: "designers_supervisor" },
  { key: "role:designer", department: "الأفكار والتصميم والمونتاج", rankLabel: "مصمم", defaultCount: 3, role: "designer" },
  { key: "admin:editors_supervisor", department: "الأفكار والتصميم والمونتاج", rankLabel: "مشرف الممنتجين", defaultCount: 1, role: "admin", adminSubType: "editors_supervisor" },
  { key: "role:editor", department: "الأفكار والتصميم والمونتاج", rankLabel: "ممنتج", defaultCount: 3, role: "editor" },
];

const ROLE_LABELS: Record<string, string> = {
  creator: "صانع محتوى",
  streamer: "ستريمر",
  player: "لاعب تنافسي",
  admin: "إداري",
  writer: "كاتب أفكار",
  editor: "ممنتج",
  designer: "مصمم",
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

const STATUS_LABELS: Record<string, string> = {
  accepted: "مقبول (عضو)",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

function escapeCsvCell(val: unknown): string {
  const s = val == null ? "" : String(val).replace(/\r?\n/g, " ");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && next === "\n") i++;
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

function mapRoleFromText(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v in ROLE_LABELS) return v;
  if (v.includes("محتوى") || v.includes("creator")) return "creator";
  if (v.includes("ستريمر") || v.includes("stream")) return "streamer";
  if (v.includes("لاعب") || v.includes("player")) return "player";
  if (v.includes("إداري") || v.includes("اداري") || v.includes("admin")) return "admin";
  if (v.includes("كاتب") || v.includes("writer")) return "writer";
  if (v.includes("ممنتج") || v.includes("مونتاج") || v.includes("editor")) return "editor";
  if (v.includes("مصمم") || v.includes("design")) return "designer";
  return "creator";
}

function mapStatusFromText(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "accepted" || v.includes("مقبول") || v.includes("عضو") || v.includes("موافق")) return "accepted";
  if (v === "rejected" || v.includes("مرفوض")) return "rejected";
  if (v === "pending" || v.includes("مراجعة") || v.includes("انتظار")) return "pending";
  return "accepted";
}

export default function SolarExcelSheet({
  rows,
  busy,
  mutate,
  settings,
  onSaveQuotas,
}: {
  rows: RequestRow[];
  busy: boolean;
  mutate: Mutate;
  settings?: SolarSettings | null;
  onSaveQuotas?: (quotas: Record<string, number>) => Promise<boolean>;
}) {
  const [excelView, setExcelView] = useState<"plan" | "members">("plan");
  const [sheetFilter, setSheetFilter] = useState<"all" | "accepted" | "pending" | "rejected">("all");
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, string>>({});
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftQuotasOverride, setDraftQuotasOverride] = useState<Record<string, number> | null>(null);
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [quotaMsg, setQuotaMsg] = useState<string | null>(null);

  const draftQuotas = useMemo(
    () => draftQuotasOverride ?? settings?.roleQuotas ?? {},
    [draftQuotasOverride, settings?.roleQuotas]
  );

  // Quick Add Row State
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newDiscord, setNewDiscord] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newRole, setNewRole] = useState("creator");
  const [newStatus, setNewStatus] = useState("accepted");
  const [newNote, setNewNote] = useState("");

  const planRows = useMemo(() => {
    const list: PlanRowDef[] = [...BUILTIN_PLAN_ROWS];
    if (settings?.customGames?.length) {
      for (const g of settings.customGames) {
        list.push(
          { key: `admin:players_supervisor:${g.id}`, department: g.label, rankLabel: `مشرف لاعبين ${g.label}`, defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: g.id, isCustom: true },
          { key: `admin:players_admin:${g.id}`, department: g.label, rankLabel: `إداري لاعبين ${g.label}`, defaultCount: 1, role: "admin", adminSubType: "players_admin", game: g.id, isCustom: true },
          { key: `player:${g.id}`, department: g.label, rankLabel: `لاعب ${g.label}`, defaultCount: 5, role: "player", game: g.id, isCustom: true }
        );
      }
    }
    if (settings?.customAdminSubTypes?.length) {
      for (const s of settings.customAdminSubTypes) {
        list.push({
          key: `admin:${s.id}`,
          department: "تخصصات إدارية مخصصة",
          rankLabel: s.label,
          defaultCount: 1,
          role: "admin",
          adminSubType: s.id,
          isCustom: true,
        });
      }
    }
    if (settings?.customRoles?.length) {
      for (const r of settings.customRoles) {
        list.push({
          key: `role:${r.id}`,
          department: "رتب مخصصة",
          rankLabel: r.label,
          defaultCount: 1,
          role: r.id,
          isCustom: true,
        });
      }
    }
    return list;
  }, [settings]);

  const acceptedRows = useMemo(
    () => rows.filter((r) => r.status === "accepted"),
    [rows]
  );

  const planWithSlots = useMemo(() => {
    return planRows.map((def) => {
      const required =
        typeof draftQuotas[def.key] === "number" ? draftQuotas[def.key] : def.defaultCount;
      const matchedMembers = acceptedRows.filter((r) => {
        const p = r.payload as Record<string, unknown>;
        const rRole = String(p.role || "");
        const rSub = String(p.adminSubType || "");
        const rGame = String(p.game || "");
        if (rRole !== def.role) return false;
        if (def.adminSubType && rSub !== def.adminSubType) return false;
        if (def.game && rGame !== def.game) return false;
        return true;
      });
      const emptyCount = Math.max(0, required - matchedMembers.length);
      return { def, required, matchedMembers, emptyCount };
    });
  }, [planRows, draftQuotas, acceptedRows]);

  const departments = useMemo(
    () => Array.from(new Set(planRows.map((r) => r.department))),
    [planRows]
  );

  const filteredPlan = useMemo(() => {
    const q = query.trim().toLowerCase();
    return planWithSlots.filter(({ def, matchedMembers }) => {
      if (deptFilter !== "all" && def.department !== deptFilter) return false;
      if (!q) return true;
      const memberText = matchedMembers
        .map((m) => `${m.payload.name ?? ""} ${m.payload.nickname ?? ""} ${m.payload.discord ?? ""}`)
        .join(" ");
      return `${def.department} ${def.rankLabel} ${memberText}`.toLowerCase().includes(q);
    });
  }, [planWithSlots, deptFilter, query]);

  const planTotals = useMemo(() => {
    let required = 0;
    let occupied = 0;
    let empty = 0;
    for (const item of filteredPlan) {
      required += item.required;
      occupied += item.matchedMembers.length;
      empty += item.emptyCount;
    }
    return { required, occupied, empty };
  }, [filteredPlan]);

  const quotasDirty = useMemo(() => {
    if (!draftQuotasOverride) return false;
    const saved = settings?.roleQuotas ?? {};
    const keys = new Set([...Object.keys(saved), ...Object.keys(draftQuotasOverride)]);
    for (const k of keys) {
      if ((saved[k] ?? undefined) !== (draftQuotasOverride[k] ?? undefined)) return true;
    }
    return false;
  }, [settings?.roleQuotas, draftQuotasOverride]);

  const handleSaveQuotasClick = async () => {
    if (!onSaveQuotas || savingQuotas || !draftQuotasOverride) return;
    setSavingQuotas(true);
    setQuotaMsg(null);
    const ok = await onSaveQuotas(draftQuotasOverride);
    setSavingQuotas(false);
    if (ok) {
      setDraftQuotasOverride(null);
      setQuotaMsg("تم حفظ أعداد الرتب والأماكن الفاضية بنجاح!");
    } else {
      setQuotaMsg("تعذر حفظ الأعداد، يرجى المحاولة مجدداً.");
    }
  };

  const handleDownloadPlanCsv = () => {
    const headers = ["القسم", "الرتبة", "العدد المطلوب", "المشغول", "الأماكن الفاضية", "الأعضاء الحاليين"];
    const csvRows = [headers.map(escapeCsvCell).join(",")];
    for (const item of filteredPlan) {
      const names = item.matchedMembers
        .map((m) => {
          const p = m.payload as Record<string, unknown>;
          return String(p.nickname || p.name || p.discord || "عضو");
        })
        .join(" | ");
      csvRows.push(
        [
          item.def.department,
          item.def.rankLabel,
          item.required,
          item.matchedMembers.length,
          item.emptyCount,
          names,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
    }
    csvRows.push(
      ["الإجمالي", "", planTotals.required, planTotals.occupied, planTotals.empty, ""]
        .map(escapeCsvCell)
        .join(",")
    );
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solar-rank-distribution-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const handleCopyWhatsapp = async () => {
    const DEPT_ICONS: Record<string, string> = {
      "الإدارة العليا": "👑",
      "صناع المحتوى": "🎥",
      "فورتنايت": "🎮",
      "ماينكرافت": "⛏️",
      "روكيت ليق": "🚗",
      "فيفا": "⚽",
      "كود": "🔫",
      "الأفكار والتصميم والمونتاج": "🎨",
    };

    const grouped = new Map<string, { label: string; count: number }[]>();
    let totalEmpty = 0;

    for (const item of filteredPlan) {
      if (item.emptyCount <= 0) continue;
      totalEmpty += item.emptyCount;
      const list = grouped.get(item.def.department) ?? [];
      list.push({ label: item.def.rankLabel, count: item.emptyCount });
      grouped.set(item.def.department, list);
    }

    const lines: string[] = ["**📋 الرتب التي تحتاج إلى أعضاء:**", ""];
    if (grouped.size === 0) {
      lines.push("جميع المقاعد مكتملة حالياً ✅", "");
    } else {
      for (const [dept, items] of grouped.entries()) {
        const icon = DEPT_ICONS[dept] || "✨";
        lines.push(`**${icon} ${dept}**`);
        for (const it of items) {
          lines.push(`- ${it.label}: ${it.count}`);
        }
        lines.push("");
      }
    }

    lines.push("━━━━━━━━━━━━━━");
    lines.push(`**📊 إجمالي المقاعد الشاغرة: ${totalEmpty}**`);
    lines.push("");
    lines.push("رابط التقديم : https://zo7al.is-a.dev/solar");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (sheetFilter !== "all" && r.status !== sheetFilter) return false;
      if (!q) return true;
      return `${JSON.stringify(r.payload)} ${r.note} ${r.status}`.toLowerCase().includes(q);
    });
  }, [rows, sheetFilter, query]);

  const handleDownloadCsv = () => {
    const headers = [
      "الاسم",
      "اللقب",
      "العمر",
      "الدولة",
      "الديسكورد",
      "الجوال",
      "الرتبة",
      "التخصص",
      "اللعبة",
      "الرابط",
      "مدة الخبرة",
      "مدة العقد",
      "الحالة",
      "ملاحظات الإدارة",
      "التاريخ",
    ];
    const csvRows = [headers.map(escapeCsvCell).join(",")];
    for (const r of filtered) {
      const p = r.payload as Record<string, unknown>;
      const url = p.channelUrl || p.streamUrl || p.portfolioUrl || "";
      csvRows.push(
        [
          p.name ?? "",
          p.nickname ?? "",
          p.age ?? "",
          p.country ?? "",
          p.discord ?? "",
          p.whatsapp ?? "",
          ROLE_LABELS[String(p.role)] || String(p.role ?? ""),
          SUBTYPE_LABELS[String(p.adminSubType)] || String(p.adminSubType ?? ""),
          p.game ?? "",
          url,
          p.experienceDuration ?? "",
          p.contractDuration ?? "",
          STATUS_LABELS[r.status] || r.status,
          r.note ?? "",
          r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar-SA") : "",
        ]
          .map(escapeCsvCell)
          .join(",")
      );
    }
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solar-clan-${sheetFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "الاسم",
      "اللقب",
      "العمر",
      "الدولة",
      "الديسكورد",
      "الجوال",
      "الرتبة",
      "التخصص",
      "اللعبة",
      "الرابط",
      "مدة الخبرة",
      "مدة العقد",
      "الحالة",
      "ملاحظات",
    ];
    const sample = [
      "محمد",
      "Zo7al_Member",
      "20",
      "السعودية",
      "member#0000",
      "+966500000000",
      "صانع محتوى",
      "",
      "fortnite",
      "https://youtube.com/@channel",
      "سنتين",
      "6_months",
      "مقبول",
      "عضو معتمد",
    ];
    const blob = new Blob(
      ["\uFEFF" + [headers.map(escapeCsvCell).join(","), sample.map(escapeCsvCell).join(",")].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solar-clan-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(null);
    try {
      const text = await file.text();
      const parsed = parseCsvLines(text);
      if (parsed.length < 2) {
        setUploadMsg("الملف فارغ أو لا يحتوي على صفوف بيانات.");
        return;
      }
      const header = parsed[0].map((h) => h.toLowerCase());
      const findIdx = (keys: string[], fallback: number) => {
        const idx = header.findIndex((h) => keys.some((k) => h.includes(k)));
        return idx >= 0 ? idx : fallback;
      };
      const iName = findIdx(["الاسم", "name"], 0);
      const iNick = findIdx(["اللقب", "nick"], 1);
      const iAge = findIdx(["العمر", "age"], 2);
      const iCountry = findIdx(["الدولة", "من وين", "country"], 3);
      const iDiscord = findIdx(["ديسكورد", "discord"], 4);
      const iWhatsapp = findIdx(["الجوال", "واتساب", "phone", "whatsapp"], 5);
      const iRole = findIdx(["الرتبة", "القسم", "role"], 6);
      const iSub = findIdx(["التخصص", "sub"], 7);
      const iGame = findIdx(["اللعبة", "game"], 8);
      const iUrl = findIdx(["الرابط", "url", "link"], 9);
      const iExp = findIdx(["الخبرة", "exp"], 10);
      const iContract = findIdx(["العقد", "contract"], 11);
      const iStatus = findIdx(["الحالة", "status"], 12);
      const iNote = findIdx(["ملاحظ", "note"], 13);

      const items = parsed.slice(1).map((cols) => ({
        name: cols[iName] || "",
        nickname: cols[iNick] || "",
        age: cols[iAge] || "",
        country: cols[iCountry] || "",
        discord: cols[iDiscord] || "",
        whatsapp: cols[iWhatsapp] || "",
        role: mapRoleFromText(cols[iRole] || ""),
        adminSubType: cols[iSub] || "",
        game: cols[iGame] || "",
        url: cols[iUrl] || "",
        experienceDuration: cols[iExp] || "",
        contractDuration: cols[iContract] || "3_months",
        status: mapStatusFromText(cols[iStatus] || "accepted"),
        note: cols[iNote] || "",
      })).filter((x) => x.name.trim().length > 0);

      if (!items.length) {
        setUploadMsg("لم يتم العثور على صفوف صالحة تحتوي على الاسم.");
        return;
      }
      const ok = await mutate("importSolar", items.slice(0, 200));
      setUploadMsg(
        ok
          ? `تم رفع واستيراد ${Math.min(items.length, 200)} سجل بنجاح في الجدول!`
          : "حدث خطأ أثناء رفع البيانات، يرجى المحاولة مجدداً."
      );
    } catch {
      setUploadMsg("تعذر قراءة الملف. تأكد أنه بصيغة CSV صحيحة.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || busy) return;
    const ok = await mutate("importSolar", [
      {
        name: newName.trim(),
        nickname: newNickname.trim() || newName.trim(),
        discord: newDiscord.trim(),
        whatsapp: newWhatsapp.trim(),
        role: newRole,
        status: newStatus,
        note: newNote.trim(),
      },
    ]);
    if (ok) {
      setNewName("");
      setNewNickname("");
      setNewDiscord("");
      setNewWhatsapp("");
      setNewNote("");
      setShowAddRow(false);
    }
  };

  return (
    <section className="dash-panel card-glow rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-5" dir="rtl">
      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExcelView("plan")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              excelView === "plan"
                ? "bg-[var(--accent)] text-[#07080b]"
                : "border border-[var(--border)] bg-black/20 text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <FileSpreadsheet size={15} />
            سجل أعضاء الكلان | خطة توزيع الرتب
          </button>
          <button
            type="button"
            onClick={() => setExcelView("members")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              excelView === "members"
                ? "bg-[var(--accent)] text-[#07080b]"
                : "border border-[var(--border)] bg-black/20 text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            سجل المتقدمين الكامل ({rows.length})
          </button>
        </div>

        {excelView === "plan" && (
          <div className="flex flex-wrap items-center gap-2">
            {onSaveQuotas && (
              <button
                type="button"
                disabled={savingQuotas || !quotasDirty}
                onClick={handleSaveQuotasClick}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#07080b" }}
              >
                <Save size={14} />
                {savingQuotas ? "جاري الحفظ..." : "حفظ الأعداد"}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              {copiedWhatsapp ? <Check size={14} /> : <Copy size={14} />}
              {copiedWhatsapp ? "تم نسخ رسالة الواتساب!" : "نسخ كرسالة واتساب"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPlanCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-black/20 px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <Download size={14} />
              تحميل خطة التوزيع (CSV)
            </button>
          </div>
        )}
      </div>

      {excelView === "plan" ? (
        <div className="space-y-4">
          {quotaMsg && (
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-xs font-semibold text-[var(--text)]">
              {quotaMsg}
            </div>
          )}

          {/* Filter by Department & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDeptFilter("all")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                  deptFilter === "all"
                    ? "bg-[var(--accent)] text-[#07080b]"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                كل الأقسام
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDeptFilter(dept)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                    deptFilter === dept
                      ? "bg-[var(--accent)] text-[#07080b]"
                      : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px] flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث بالقسم أو الرتبة أو العضو..."
                className="dash-search w-full pr-9 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Excel Distribution Table matching image.png */}
          <div className="overflow-x-auto rounded-xl border border-[#243b55] shadow-lg">
            <div className="bg-[#162d47] px-4 py-3 text-center text-base font-extrabold text-white tracking-wide border-b border-[#243b55]">
              سجل أعضاء الكلان | خطة توزيع الرتب
            </div>
            <table className="w-full border-collapse text-xs text-right">
              <thead>
                <tr className="bg-[#ed7d31] text-white font-bold">
                  <th className="border-l border-white/25 px-3 py-2.5 whitespace-nowrap">القسم</th>
                  <th className="border-l border-white/25 px-3 py-2.5 whitespace-nowrap">الرتبة</th>
                  <th className="border-l border-white/25 px-3 py-2.5 text-center whitespace-nowrap">العدد المطلوب</th>
                  <th className="border-l border-white/25 px-3 py-2.5 text-center whitespace-nowrap">المشغول / الفاضي</th>
                  <th className="px-3 py-2.5 min-w-[260px]">الأعضاء والأماكن الفاضية</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlan.map(({ def, required, matchedMembers, emptyCount }, idx) => (
                  <tr
                    key={def.key}
                    className={
                      idx % 2 === 0
                        ? "bg-[#e9eef5] text-[#111827] border-b border-[#cbd5e1]"
                        : "bg-[#f8fafc] text-[#111827] border-b border-[#cbd5e1]"
                    }
                  >
                    <td className="border-l border-[#cbd5e1] px-3 py-2 font-semibold whitespace-nowrap">
                      {def.department}
                      {def.isCustom && (
                        <span className="mr-1.5 rounded bg-[#162d47]/10 px-1.5 py-0.5 text-[10px] text-[#162d47]">
                          مضاف
                        </span>
                      )}
                    </td>
                    <td className="border-l border-[#cbd5e1] px-3 py-2 font-bold whitespace-nowrap">
                      {def.rankLabel}
                    </td>
                    <td className="border-l border-[#cbd5e1] px-2 py-1.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#cbd5e1] px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftQuotasOverride((prev) => ({
                              ...(prev ?? settings?.roleQuotas ?? {}),
                              [def.key]: Math.max(0, required - 1),
                            }))
                          }
                          className="p-0.5 text-[#334155] hover:text-[#ed7d31] cursor-pointer"
                          title="إنقاص العدد"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={required}
                          onChange={(e) => {
                            const n = Math.max(0, Math.min(500, Number(e.target.value) || 0));
                            setDraftQuotasOverride((prev) => ({
                              ...(prev ?? settings?.roleQuotas ?? {}),
                              [def.key]: n,
                            }));
                          }}
                          className="w-11 text-center font-bold text-[#0f172a] bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraftQuotasOverride((prev) => ({
                              ...(prev ?? settings?.roleQuotas ?? {}),
                              [def.key]: Math.min(500, required + 1),
                            }))
                          }
                          className="p-0.5 text-[#334155] hover:text-[#ed7d31] cursor-pointer"
                          title="زيادة العدد"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="border-l border-[#cbd5e1] px-3 py-2 text-center font-bold whitespace-nowrap">
                      <span className="text-emerald-700">{matchedMembers.length}</span>
                      <span className="mx-1 text-[#64748b]">/</span>
                      <span className={emptyCount > 0 ? "text-amber-700" : "text-slate-400"}>
                        {emptyCount} فاضي
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {matchedMembers.map((m) => {
                          const p = m.payload as Record<string, unknown>;
                          const label = String(p.nickname || p.name || p.discord || "عضو");
                          return (
                            <span
                              key={m.id}
                              title={`${String(p.name ?? "")} (${String(p.discord ?? "")})`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600/15 border border-emerald-600/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-900"
                            >
                              <UserCheck size={11} />
                              {label}
                            </span>
                          );
                        })}
                        {Array.from({ length: emptyCount }).map((_, slotIdx) => (
                          <span
                            key={`empty-${def.key}-${slotIdx}`}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#94a3b8] bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#64748b]"
                          >
                            <CircleDashed size={11} />
                            مكان فاضي
                          </span>
                        ))}
                        {required === 0 && matchedMembers.length === 0 && (
                          <span className="text-[11px] text-[#94a3b8]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#162d47] text-white font-extrabold">
                  <td className="border-l border-white/20 px-3 py-2.5" colSpan={2}>
                    الإجمالي
                  </td>
                  <td className="border-l border-white/20 px-3 py-2.5 text-center text-sm">
                    {planTotals.required}
                  </td>
                  <td className="border-l border-white/20 px-3 py-2.5 text-center">
                    {planTotals.occupied} مشغول · {planTotals.empty} فاضي
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-normal text-white/80">
                    أي عضو يتم قبوله في التقديم ينزل تلقائياً في مكانه المخصص هنا، وأي رتبة تضاف في إعدادات التقديم تظهر تلقائياً.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <>
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              جدول Excel للأعضاء والمتقدمين ({filtered.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              استعراض، تعديل، رفع (استيراد CSV/Excel) وتحميل قائمة أعضاء الكلان والموافق عليهم والمتقدمين.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddRow((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-black/20 px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            إضافة صف سريع
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-black/20 px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <FileDown size={14} />
            نموذج فارغ
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors cursor-pointer">
            <Upload size={14} />
            <span>رفع ملف Excel (CSV)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleUploadCsv}
              disabled={busy}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
            style={{ background: "var(--accent)", color: "#07080b" }}
          >
            <Download size={14} />
            <span>تحميل Excel (CSV)</span>
          </button>
        </div>
      </div>

      {uploadMsg && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-xs font-semibold text-[var(--text)]">
          {uploadMsg}
        </div>
      )}

      {/* Quick Add Form */}
      {showAddRow && (
        <form
          onSubmit={handleQuickAdd}
          className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8 items-end rounded-xl border border-[var(--accent)]/30 bg-black/25 p-3"
        >
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">الاسم *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="الاسم"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">اللقب</label>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="اللقب"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">الديسكورد</label>
            <input
              type="text"
              dir="ltr"
              value={newDiscord}
              onChange={(e) => setNewDiscord(e.target.value)}
              placeholder="user"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">الجوال</label>
            <input
              type="text"
              dir="ltr"
              value={newWhatsapp}
              onChange={(e) => setNewWhatsapp(e.target.value)}
              placeholder="+966..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">الرتبة</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]"
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">الحالة</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]"
            >
              <option value="accepted">مقبول (عضو)</option>
              <option value="pending">قيد المراجعة</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">ملاحظة</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="ملاحظة"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)]"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
            style={{ background: "var(--accent)", color: "#07080b" }}
          >
            <Check size={13} />
            حفظ الصف
          </button>
        </form>
      )}

      {/* Filter Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(
            [
              { id: "all", label: "الكل" },
              { id: "accepted", label: "الأعضاء الموافق عليهم" },
              { id: "pending", label: "قيد المراجعة" },
              { id: "rejected", label: "المرفوضين" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSheetFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                sheetFilter === tab.id
                  ? "bg-[var(--accent)] text-[#07080b]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في الجدول..."
            className="dash-search w-full pr-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Excel-style Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-black/30">
        <table className="w-full border-collapse text-xs text-right whitespace-nowrap">
          <thead>
            <tr className="bg-[var(--surface-elevated)] text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">#</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">الاسم</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">اللقب</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">الديسكورد</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">الجوال</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">الرتبة</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">التخصص / اللعبة</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">مدة العقد</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold">الحالة</th>
              <th className="border-l border-[var(--border)] px-3 py-2.5 font-bold min-w-[180px]">ملاحظات</th>
              <th className="px-3 py-2.5 font-bold text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => {
              const p = row.payload as Record<string, unknown>;
              const rowStatus = editingStatuses[row.id] ?? row.status;
              const rowNote = editingNotes[row.id] ?? row.note;
              const changed = rowStatus !== row.status || rowNote !== row.note;
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="border-l border-[var(--border)] px-3 py-2 text-[var(--text-muted)] font-mono">
                    {index + 1}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 font-semibold text-[var(--text)]">
                    {String(p.name ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 text-[var(--text-muted)]">
                    {String(p.nickname ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 font-mono text-[var(--text)]" dir="ltr">
                    {String(p.discord ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 font-mono text-emerald-400" dir="ltr">
                    {String(p.whatsapp ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 text-[var(--accent)] font-medium">
                    {ROLE_LABELS[String(p.role)] || String(p.role ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 text-[var(--text-muted)]">
                    {[
                      SUBTYPE_LABELS[String(p.adminSubType)] || p.adminSubType,
                      p.game,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="border-l border-[var(--border)] px-3 py-2 text-[var(--text-muted)]">
                    {String(p.contractDuration ?? "—")}
                  </td>
                  <td className="border-l border-[var(--border)] px-2 py-1.5">
                    <select
                      value={rowStatus}
                      onChange={(e) =>
                        setEditingStatuses((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold ${
                        rowStatus === "accepted"
                          ? "text-emerald-400"
                          : rowStatus === "rejected"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      <option value="accepted">مقبول (عضو)</option>
                      <option value="pending">قيد المراجعة</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </td>
                  <td className="border-l border-[var(--border)] px-2 py-1.5">
                    <input
                      type="text"
                      value={rowNote}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      placeholder="أضف ملاحظة..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {changed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void mutate("review", {
                              id: row.id,
                              kind: row.kind,
                              status: rowStatus,
                              note: rowNote,
                            })
                          }
                          title="حفظ التعديل"
                          className="rounded-lg bg-[var(--accent)] px-2 py-1 text-[#07080b] font-bold hover:opacity-90 cursor-pointer"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`حذف "${String(p.name ?? "")}" من الجدول؟`)) {
                            void mutate("deleteRequest", row.id);
                          }
                        }}
                        title="حذف السجل"
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  لا توجد سجلات مطابقة حالياً. يمكنك رفع ملف CSV أو إضافة صف جديد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </section>
  );
}
