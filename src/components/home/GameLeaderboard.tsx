"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { LEADERBOARD_KEY, rankRuns, readRuns, type RunRecord } from "./space-game-rules";

const changeEvent = "zo7al-leaderboard-change";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changeEvent, callback); };
}
function snapshot() { try { return localStorage.getItem(LEADERBOARD_KEY); } catch { return null; } }
const serverSnapshot = () => null;

export default function GameLeaderboard({ score, stars, runId }: { score: number; stars: number; runId: string }) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const records = useMemo(() => readRuns(raw), [raw]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionRecords, setSessionRecords] = useState<RunRecord[] | null>(null);
  const rows = sessionRecords ?? records;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (saved) return;
    const record: RunRecord = { id: runId, name: name.trim().slice(0, 20) || "Pilot", score, stars, date: new Date().toISOString() };
    const updated = rankRuns([...readRuns(snapshot()), record]);
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(changeEvent));
      setMessage(updated.some((r) => r.id === runId) ? "Your run is saved on this device." : "Run finished. Beat the tenth-place score to enter the board!");
    } catch {
      setSessionRecords(updated);
      setMessage("Browser storage is unavailable. These scores last until you leave this screen.");
    }
    setSaved(true);
  };

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left sm:p-5" aria-labelledby="leaderboard-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h3 id="leaderboard-title" className="text-sm font-semibold text-white">Flight leaderboard</h3><p className="mt-1 text-xs text-white/45">Top 10 · This device only</p></div>
        <span aria-hidden="true" className="text-2xl text-amber-300">✦</span>
      </div>
      <form onSubmit={save} className="mb-4 flex gap-2">
        <label htmlFor="pilot-name" className="sr-only">Pilot name</label>
        <input id="pilot-name" maxLength={20} value={name} onChange={(event) => setName(event.target.value)} placeholder="Pilot name" disabled={saved} autoComplete="nickname" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-50" />
        <button type="submit" disabled={saved} className="rounded-lg bg-amber-300 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-200 disabled:opacity-50">{saved ? "Recorded" : "Save score"}</button>
      </form>
      <p role="status" className="mb-3 text-xs text-amber-200">{message}</p>
      {rows.length ? (
        <div className="max-h-52 overflow-y-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">Highest scores saved in this browser</caption>
            <thead className="text-white/40"><tr><th scope="col" className="pb-2 text-left">#</th><th scope="col" className="pb-2 text-left">Pilot</th><th scope="col" className="pb-2 text-right">Score</th><th scope="col" className="pb-2 text-right">Stars</th></tr></thead>
            <tbody>{rows.map((row, i) => (
              <tr key={row.id} className={row.id === runId ? "text-amber-200" : "text-white/75"}>
                <td className="border-t border-white/5 py-2.5 font-mono">{String(i + 1).padStart(2, "0")}</td>
                <th scope="row" className="max-w-32 break-words border-t border-white/5 py-2.5 text-left font-medium">{row.name}{row.id === runId ? " · You" : ""}</th>
                <td className="border-t border-white/5 py-2.5 text-right font-mono tabular-nums">{row.score.toLocaleString("en-US")}</td>
                <td className="border-t border-white/5 py-2.5 text-right font-mono tabular-nums">{row.stars}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="py-4 text-center text-sm text-white/45">No flights recorded. Set the first score.</p>}
    </section>
  );
}
