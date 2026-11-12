"use client";

import { useState, useMemo, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Plus,
  Check,
  Trash2,
  Search,
  FileDown,
} from "lucide-react";
import type { Mutate, RequestRow } from "./types";

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
}: {
  rows: RequestRow[];
  busy: boolean;
  mutate: Mutate;
}) {
  const [sheetFilter, setSheetFilter] = useState<"all" | "accepted" | "pending" | "rejected">("all");
  const [query, setQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, string>>({});
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Add Row State
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newDiscord, setNewDiscord] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newRole, setNewRole] = useState("creator");
  const [newStatus, setNewStatus] = useState("accepted");
  const [newNote, setNewNote] = useState("");

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
    </section>
  );
}
