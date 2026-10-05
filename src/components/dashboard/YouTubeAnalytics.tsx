"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { youtubeObject as object, youtubeString as string } from "@/lib/data/youtube-studio";
import { useYoutubeResource, useYoutubeFormat, YoutubeSection, YoutubeFeedback, type StudioContext } from "./youtube-ui";
type Report = { id: string; data: Record<string, unknown>; error?: string; columns: string[]; rows: unknown[][] };
function reports(value: unknown): Report[] {
  return (Array.isArray(value) ? value : []).map(raw => { const item = object(raw), data = object(item.data); return { id: string(item.id), data, error: string(item.error), columns: (Array.isArray(data.columnHeaders) ? data.columnHeaders : []).map(v => string(object(v).name)), rows: (Array.isArray(data.rows) ? data.rows : []).filter(Array.isArray) }; });
}
function exportCSV(report: Report) {
  const cell = (value: unknown) => { const s = typeof value === "number" ? String(value) : String(value ?? ""); return '"' + (typeof value !== "number" && /^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'; };
  const url = URL.createObjectURL(new Blob(["\uFEFF" + [report.columns, ...report.rows].map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "youtube-" + report.id + ".csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function YouTubeAnalytics({ onExpired }: StudioContext) {
  const y = useTranslations("youtubeStudio"), [days, setDays] = useState("28"), state = useYoutubeResource("analytics", { onExpired }, { days }), format = useYoutubeFormat();
  const data = reports(state.data?.reports), summary = data.find(r => r.id === "summary"), daily = data.find(r => r.id === "daily");
  const values = daily?.rows.map(row => typeof row[1] === "number" ? row[1] : 0) ?? [], maximum = Math.max(1, ...values);
  const points = values.map((value, index) => `${values.length <= 1 ? 500 : index / (values.length - 1) * 1000},${180 - value / maximum * 160}`).join(" ");
  return <YoutubeSection title="analytics" state={state} actions={<select className="yt-range" value={days} aria-label={y("dateRange")} onChange={e => setDays(e.target.value)}>{[7, 28, 90, 365].map(n => <option key={n} value={n}>{y("lastDays", { days: n })}</option>)}</select>}>
    <p className="dash-help">{string(state.data?.from)} — {string(state.data?.to)} · {y("analyticsHint")}</p>
    {summary?.error ? <YoutubeFeedback message={summary.error} /> : <div className="dash-platform-metrics">{summary?.columns.map((name, index) => <div className="dash-panel card-glow dash-stat" key={name}><span className="dash-help">{y.has(name) ? y(name) : name}</span><strong>{format.number(summary.rows[0]?.[index])}</strong></div>)}</div>}
    {daily && !daily.error && values.length > 0 && <div className="dash-panel card-glow yt-chart"><h3>{y("daily")}</h3><svg viewBox="0 0 1000 200" role="img" aria-label={y("views")} preserveAspectRatio="none"><path d="M0 180H1000 M0 100H1000 M0 20H1000" stroke="var(--border)" strokeWidth="1" /><polyline points={points} stroke="var(--accent)" fill="none" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div className="dash-section-heading dash-help"><span>{String(daily.rows[0]?.[0] ?? "")}</span><span>{String(daily.rows.at(-1)?.[0] ?? "")}</span></div></div>}
    <div className="yt-report-grid">{data.filter(r => r.id !== "summary").map(report => <section className="dash-panel card-glow yt-report" key={report.id}><div className="dash-section-heading"><h3>{y.has(report.id) ? y(report.id) : report.id}</h3><button type="button" className="dash-icon-button" disabled={!report.rows.length} aria-label={y("exportCSV") + " · " + report.id} onClick={() => exportCSV(report)}><Download size={17} /></button></div>{report.error ? <YoutubeFeedback message={report.error} /> : report.rows.length ? <div className="yt-table-scroll" tabIndex={0}><table className="yt-table"><thead><tr>{report.columns.map(name => <th key={name}>{y.has(name) ? y(name) : name}</th>)}</tr></thead><tbody>{report.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{typeof cell === "number" ? format.number(cell) : String(cell ?? "—")}</td>)}</tr>)}</tbody></table></div> : <p className="dash-help">{y("empty")}</p>}</section>)}</div>
  </YoutubeSection>;
}
