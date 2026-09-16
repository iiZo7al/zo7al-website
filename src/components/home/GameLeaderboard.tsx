"use client";
import { spaceApi } from "./space-api";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

export interface RunTicket { id: string; token: string }
interface RankedRun { id: string; name: string; score: number; stars: number }

export default function GameLeaderboard({ score, stars, ticket }: { score: number; stars: number; ticket: RunTicket | null }) {
  const t = useTranslations("game");
  const locale = useLocale();
  const [records, setRecords] = useState<RankedRun[]>([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(spaceApi("leaderboard"), { cache: "no-store", signal });
      if (!response.ok) throw new Error("UNAVAILABLE");
      const data = await response.json();
      if (!Array.isArray(data.records)) throw new Error("INVALID_RESPONSE");
      setRecords(data.records); setLoadError(false);
    } catch { if (!signal?.aborted) setLoadError(true); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void refresh(controller.signal); });
    const timer = setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refresh]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saved || busy || !ticket) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(spaceApi("finish"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, name: name.trim(), score, stars }),
      });
      if (!response.ok) { setError(response.status === 429 ? "rateLimit" : response.status === 400 ? "invalidRun" : "unavailable"); return; }
      setSaved(true); await refresh();
    } catch { setError("unavailable"); } finally { setBusy(false); }
  };

  return (
    <section className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-start sm:p-5" aria-labelledby="leaderboard-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h3 id="leaderboard-title" className="text-sm font-semibold">{t("lgTitle")}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{t("lgSubtitle")}</p></div>
        <button type="button" onClick={() => void refresh()} className="rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--accent)]">{t("refresh")}</button>
      </div>
      {!ticket && <p className="mb-3 text-xs text-[var(--text-muted)]">{t("globalUnavailable")}</p>}
      <form onSubmit={save} className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="pilot-name" className="sr-only">{t("pilotName")}</label>
        <input id="pilot-name" required maxLength={20} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("pilotName")} disabled={saved || !ticket} autoComplete="nickname" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50" />
        <button type="submit" disabled={saved || busy || !ticket} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-[var(--bg)] disabled:opacity-50">{t(saved ? "saved" : busy ? "saving" : "submit")}</button>
      </form>
      <p role="status" className="mb-3 text-xs text-[var(--accent)]">{error ? t(error) : saved ? t("saved") : ""}</p>
      {loadError ? <p role="status" className="py-4 text-sm text-[var(--text-muted)]">{t("unavailable")}</p> : loading ? <p role="status" className="py-4 text-sm text-[var(--text-muted)]">{t("loading")}</p> : records.length ? (
        <div className="max-h-52 overflow-y-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">{t("lgSubtitle")}</caption>
            <thead className="text-[var(--text-muted)]"><tr><th scope="col" className="pb-2 text-start">#</th><th scope="col" className="pb-2 text-start">{t("pilot")}</th><th scope="col" className="pb-2 text-end">{t("score")}</th><th scope="col" className="pb-2 text-end">{t("stars")}</th></tr></thead>
            <tbody>{records.map((row, i) => (
              <tr key={row.id} className={row.id === ticket?.id ? "text-[var(--accent)]" : "text-[var(--text)]"}>
                <td className="border-t border-[var(--border)] py-2.5 tabular-nums">{(i + 1).toLocaleString(locale)}</td>
                <th scope="row" className="max-w-32 break-words border-t border-[var(--border)] py-2.5 text-start font-medium"><bdi>{row.name}</bdi>{row.id === ticket?.id ? ` · ${t("you")}` : ""}</th>
                <td className="border-t border-[var(--border)] py-2.5 text-end tabular-nums">{row.score.toLocaleString(locale)}</td>
                <td className="border-t border-[var(--border)] py-2.5 text-end tabular-nums">{row.stars.toLocaleString(locale)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="py-4 text-center text-sm text-[var(--text-muted)]">{t("empty")}</p>}
    </section>
  );
}
