"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plug, Plus, RefreshCw, KeyRound, Copy, Check, Eye, EyeOff, ShieldCheck, Unplug } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
type Bridge = { id: string; name: string; enabled: boolean; players: number; lastSync: string | null };
type Action = { kind: "create" | "rotate" | "revoke"; bridge?: Bridge };
export default function MinecraftBridgeSettings({ onExpired }: { onExpired: () => void }) {
  const t = useTranslations("minecraftBridge"), h = useTranslations("hub"), d = useTranslations("dashboard"), locale = useLocale();
  const [bridges, setBridges] = useState<Bridge[]>([]), [revision, setRevision] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [action, setAction] = useState<Action | null>(null), [secret, setSecret] = useState<{ token: string; name: string } | null>(null), [reveal, setReveal] = useState(false), [copied, setCopied] = useState(false);
  const mounted = useRef(false), request = useRef<AbortController | null>(null), lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/minecraft-bridge", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 401) { onExpired(); return; }
      const value = await response.json(); if (!response.ok || !Array.isArray(value.bridges)) throw Error("unavailable");
      if (!controller.signal.aborted) { setBridges(value.bridges); setError(""); }
    }).catch(() => { if (!controller.signal.aborted) setError("unavailable"); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, onExpired]);
  const run = async (name: string) => {
    if (!action || lock.current) return; lock.current = true; setBusy(true); setError(""); request.current = new AbortController();
    try {
      const response = await fetch("/api/admin/minecraft-bridge", { method: "POST", signal: request.current.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: action.kind, id: action.bridge?.id, name, confirm: true }) });
      if (response.status === 401) { onExpired(); return; }
      const value = await response.json(); if (!response.ok) throw Error(response.status === 429 ? "rateLimit" : "unavailable");
      if (!mounted.current) return;
      if (typeof value.token === "string") { setSecret({ token: value.token, name: value.bridge.name }); setReveal(false); setCopied(false); }
      setAction(null); setLoading(true); setRevision(value => value + 1);
    } catch (error) { if (mounted.current && !request.current.signal.aborted) setError(error instanceof Error ? error.message : "unavailable"); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return <section className="dash-panel card-glow dash-bridge-settings"><div className="dash-section-heading"><div><p className="dash-eyebrow">MINECRAFT · ZO7AL PROJECTS</p><h2>{t("title")}</h2></div><ShieldCheck size={22} /></div><p className="dash-help">{t("description")}</p>
    <div className="dash-actions"><button type="button" className="dash-button dash-button-primary" disabled={busy || loading || bridges.length >= 20} onClick={() => { setAction({ kind: "create" }); setError(""); }}><Plus size={16} />{t("create")}</button><button type="button" className="dash-icon-button" aria-label={d("refresh")} disabled={busy || loading} onClick={() => { setLoading(true); setRevision(value => value + 1); }}><RefreshCw size={17} className={loading ? "dash-spinning" : ""} /></button></div>
    {error && !action && <p role="alert" className="hub-error">{h(error)}</p>}
    {!loading && !bridges.length && <p className="dash-help">{t("empty")}</p>}
    <div className="dash-bridge-list">{bridges.map(bridge => <article className="dash-bridge-row" key={bridge.id}><span className="dash-item-icon"><Plug size={20} /></span><div className="dash-item-copy"><h3 dir="auto">{bridge.name}</h3><span className={"dash-tag " + (bridge.enabled ? "dash-tag-green" : "")}>{t(bridge.enabled ? "enabled" : "disabled")}</span><p className="dash-help">{t("players", { count: bridge.players })} · {t("lastSync")}: {bridge.lastSync ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(bridge.lastSync)) : t("waiting")}</p></div><div className="dash-icon-actions"><button type="button" className="dash-icon-button" disabled={busy} aria-label={t("rotate")} title={t("rotate")} onClick={() => { setAction({ kind: "rotate", bridge }); setError(""); }}><KeyRound size={17} /></button>{bridge.enabled && <button type="button" className="dash-icon-button dash-danger" disabled={busy} aria-label={t("revoke")} title={t("revoke")} onClick={() => { setAction({ kind: "revoke", bridge }); setError(""); }}><Unplug size={17} /></button>}</div></article>)}</div>
    <p className="dash-help">{t("setup")}</p>
    {action && <DetailsDialog title={t(action.kind)} onClose={() => { if (!busy) setAction(null); }}><form className="hub-form pelican-dialog-form" onSubmit={event => { event.preventDefault(); void run(String(new FormData(event.currentTarget).get("name") ?? "")); }}>{action.kind === "create" ? <label>{t("serverName")}<input name="name" required maxLength={64} placeholder="Zo7al SMP" disabled={busy} /></label> : <p dir="auto">{action.bridge?.name}</p>}<label className="hub-consent pelican-confirm"><input type="checkbox" required disabled={busy} />{t(action.kind === "revoke" ? "revokeWarning" : action.kind === "rotate" ? "rotateWarning" : "keyWarning")}</label>{error && <p className="hub-error" role="alert">{h(error)}</p>}<div className="dash-actions"><button type="submit" className={"dash-button " + (action.kind === "revoke" ? "dash-danger" : "dash-button-primary")} disabled={busy}>{h(busy ? "loading" : "save")}</button><button type="button" className="dash-button" disabled={busy} onClick={() => setAction(null)}>{d("cancel")}</button></div></form></DetailsDialog>}
    {secret && <DetailsDialog title={t("newKey")} onClose={() => setSecret(null)}><div className="pelican-dialog-form"><h3 dir="auto">{secret.name}</h3><p className="dash-help">{t("oneTime")}</p><div className="pelican-password"><input className="pelican-value" readOnly type={reveal ? "text" : "password"} value={secret.token} aria-label={t("newKey")} autoComplete="off" dir="ltr" /><button type="button" className="dash-icon-button" aria-label={t(reveal ? "hide" : "show")} onClick={() => setReveal(value => !value)}>{reveal ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><div className="dash-actions"><button type="button" className="dash-button dash-button-primary" onClick={async () => { try { await navigator.clipboard.writeText(secret.token); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{t(copied ? "copied" : "copy")}</button><button type="button" className="dash-button" onClick={() => setSecret(null)}>{t("done")}</button></div><p className="dash-help">{t("setup")}</p><code className="pelican-code">https://zo7al.is-a.dev/api/minecraft/bridge</code></div></DetailsDialog>}
  </section>;
}
