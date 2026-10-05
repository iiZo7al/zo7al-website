"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Server, RefreshCw, Cpu, MemoryStick, HardDrive, ChevronLeft, ChevronRight, ArrowUpRight, Plug, Clock } from "lucide-react";
import SearchIcon from "@/components/ui/SearchIcon";
import type { PelicanServer } from "@/lib/data/pelican";
type FleetServer = Omit<PelicanServer, "stats" | "updatedAt"> & { stats: PelicanServer["stats"] | null; description: string; node: string; owned: boolean; suspended: boolean; installing: boolean };
type Fleet = { status: string; servers: FleetServer[]; page: number; pages: number; total: number; updatedAt: string };
export default function PelicanFleet({ onSelect, onConnections, onExpired }: { onSelect: (id: string) => void; onConnections: () => void; onExpired: () => void }) {
  const p = useTranslations("pelican"), d = useTranslations("dashboard"), h = useTranslations("hub"), locale = useLocale();
  const [fleet, setFleet] = useState<Fleet | null>(null), [page, setPage] = useState(1), [scope, setScope] = useState("all"), [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null), inflight = useRef(false);
  const reload = useCallback(async () => {
    if (inflight.current) return; inflight.current = true; const controller = new AbortController(); request.current = controller; setLoading(true);
    try {
      const response = await fetch("/api/admin/pelican/fleet?" + new URLSearchParams({ page: String(page), scope, search }), { cache: "no-store", signal: controller.signal });
      if (response.status === 401) { onExpired(); return; }
      if (!response.ok) throw Error(response.status === 429 ? "rateLimit" : "unavailable");
      const value = await response.json(); if (!controller.signal.aborted) { setFleet(value); setError(""); if (value.pages && page > value.pages) setPage(value.pages); }
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "unavailable"); }
    finally { if (request.current === controller) { inflight.current = false; if (!controller.signal.aborted) setLoading(false); } }
  }, [page, scope, search, onExpired]);
  useEffect(() => {
    let cancelled = false; queueMicrotask(() => { if (!cancelled) void reload(); });
    const timer = setInterval(() => { if (document.visibilityState === "visible") void reload(); }, 30000);
    const visible = () => { if (document.visibilityState === "visible") void reload(); };
    document.addEventListener("visibilitychange", visible);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener("visibilitychange", visible); request.current?.abort(); inflight.current = false; };
  }, [reload]);
  const number = (value: number | null | undefined, digits = 1) => typeof value === "number" ? new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value) : "—";
  const bytes = (value: number | null | undefined) => typeof value === "number" ? number(value / 1024 ** 3, 2) + " GiB" : "—";
  if (fleet?.status === "setup") return <div className="dash-panel card-glow dash-setup"><Plug size={32} /><h2>{p("setupTitle")}</h2><p>{p("fleetSetup")}</p><button className="dash-button dash-button-primary" onClick={onConnections}>{p("connect")}</button></div>;
  return <section className="pelican-fleet">
    <div className="dash-section-heading"><div><h2>{p("servers")}</h2><p className="dash-help">{p("autoDiscovery")}</p></div><button type="button" className="dash-icon-button" aria-label={p("refresh")} disabled={loading} onClick={() => void reload()}><RefreshCw size={18} className={loading ? "dash-spinning" : ""} /></button></div>
    <div className="pelican-fleet-toolbar"><div className="dash-actions">{(["owner", "other", "all"] as const).map(id => <button type="button" key={id} className={"dash-button " + (scope === id ? "dash-button-primary" : "")} aria-pressed={scope === id} onClick={() => { setScope(id); setPage(1); }}>{p("fleet_" + id)}</button>)}</div><form className="pelican-fleet-search" role="search" onSubmit={event => { event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get("search") ?? "").trim()); setPage(1); }}><input name="search" maxLength={100} aria-label={h("search")} placeholder={h("search")} /><button type="submit" className="dash-icon-button" aria-label={h("search")}><SearchIcon size={18} /></button></form></div>
    {error && <p className="hub-error" role="alert">{p(error)}</p>}
    {loading && !fleet && <div className="dash-panel dash-empty" aria-busy="true">{p("loading")}</div>}
    <div className="pelican-fleet-grid">{fleet?.servers?.map(server => {
      const state = server.suspended ? "suspended" : server.installing ? "installing" : server.stats?.state ?? "unknown";
      const resources = [{ key: "cpu", icon: Cpu, value: typeof server.stats?.cpu === "number" ? number(server.stats.cpu) + "%" : "—", limit: server.limits.cpu, raw: server.stats?.cpu, scale: 1 }, { key: "memory", icon: MemoryStick, value: bytes(server.stats?.memory), limit: server.limits.memory, raw: server.stats?.memory, scale: 1024 ** 2 }, { key: "disk", icon: HardDrive, value: bytes(server.stats?.disk), limit: server.limits.disk, raw: server.stats?.disk, scale: 1024 ** 2 }];
      return <button type="button" className={"dash-panel card-glow pelican-fleet-card is-" + state} key={server.uuid} onClick={() => onSelect(server.uuid)}>
        <div className="pelican-fleet-heading"><span className="pelican-fleet-icon"><Server size={25} /></span><div><h3 dir="auto">{server.name}</h3><p dir="auto">{server.description || server.node}</p></div><ArrowUpRight size={18} /></div>
        <div className="pelican-fleet-meta"><span className={"dash-connection-state " + (state === "running" ? "is-connected" : "")}><i />{["suspended", "installing", "unknown"].includes(state) ? p("fleetState_" + state) : d("state_" + state)}</span>{typeof server.stats?.uptime === "number" && <span><Clock size={13} />{number(server.stats.uptime / 3600000)}h</span>}</div>
        <div className="pelican-fleet-resources">{resources.map(resource => { const percentage = resource.limit && typeof resource.raw === "number" ? Math.min(100, resource.raw / resource.scale / resource.limit * 100) : 0; return <div key={resource.key}><span><resource.icon size={14} />{d(resource.key)}</span><div className="pelican-fleet-meter"><i style={{ width: percentage + "%" }} /></div><bdi>{resource.value} / {resource.limit === 0 ? "∞" : resource.key === "cpu" ? number(resource.limit) + "%" : typeof resource.limit === "number" ? bytes(resource.limit * 1024 ** 2) : "—"}</bdi></div>; })}</div>
      </button>;
    })}</div>
    {!loading && fleet?.servers?.length === 0 && <div className="dash-panel dash-empty"><Server size={28} />{p("empty")}</div>}
    {fleet && <footer className="pelican-fleet-footer"><span className="dash-help">{p("fleetCount", { count: scope === "other" ? fleet.servers?.length ?? 0 : fleet.total ?? 0 })}</span><div className="dash-icon-actions"><button className="dash-icon-button" type="button" aria-label={p("previous")} disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}><ChevronLeft size={18} /></button><span>{page} / {fleet.pages ?? 1}</span><button className="dash-icon-button" type="button" aria-label={p("next")} disabled={page >= (fleet.pages ?? 1) || loading} onClick={() => setPage(value => value + 1)}><ChevronRight size={18} /></button></div></footer>}
  </section>;
}
