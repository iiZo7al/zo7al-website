"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plug, Settings2, ShieldCheck, Unplug, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { PlatformMark } from "./DashboardOverview";
import OAuthResult from "./OAuthResult";
type Status = { connected: boolean; reconnectRequired: boolean; clientConfigured: boolean; managed: boolean; redirectUri: string; account?: { id: string; username: string } };
export default function ModrinthConnection({ onExpired }: { onExpired: () => void }) {
  const t = useTranslations("oauth"), d = useTranslations("dashboard"), h = useTranslations("hub");
  const [status, setStatus] = useState<Status | null>(null), [settings, setSettings] = useState(false), [confirm, setConfirm] = useState(false), [copied, setCopied] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const active = useRef(false), controller = useRef<AbortController | null>(null), lock = useRef(false);
  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/modrinth", { cache: "no-store", signal });
      if (response.status === 401) { onExpired(); return; }
      if (!response.ok) throw Error();
      const data = await response.json();
      if (active.current && !signal?.aborted) { setStatus(data); setError(""); }
    } catch { if (active.current && !signal?.aborted) setError("unavailable"); }
  }, [onExpired]);
  useEffect(() => { active.current = true; const request = new AbortController(); queueMicrotask(() => { if (!request.signal.aborted) void reload(request.signal); }); return () => { active.current = false; request.abort(); controller.current?.abort(); }; }, [reload]);
  const run = async (action: string, input: Record<string, unknown> = {}) => {
    if (lock.current) return false; lock.current = true; setBusy(true); setError(""); const request = new AbortController(); controller.current = request;
    try {
      const response = await fetch("/api/admin/modrinth", { method: "POST", headers: { "Content-Type": "application/json" }, signal: request.signal, body: JSON.stringify({ action, input }) });
      if (response.status === 401) { onExpired(); return false; }
      const value = await response.json();
      if (!response.ok) throw Error(value.error === "MR_CLIENT_MISSING" ? "setupRequired" : value.error === "RATE_LIMIT" ? "rateLimit" : "unavailable");
      if (!active.current) return false;
      if (action === "connect") {
        const url = new URL(String(value.url));
        if (url.protocol !== "https:" || url.hostname !== "modrinth.com" || url.pathname !== "/auth/authorize") throw Error();
        window.location.assign(url.href);
      } else await reload(request.signal);
      return true;
    } catch (error) { if (active.current && !request.signal.aborted) setError(error instanceof Error && ["setupRequired", "rateLimit"].includes(error.message) ? error.message : "unavailable"); return false; }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return <section className="dash-panel card-glow oauth-connection">
    <div className="dash-section-heading"><div className="oauth-provider"><span className="dash-platform-logo dash-logo-modrinth"><PlatformMark id="modrinth" size={26}/></span><div><p className="dash-eyebrow">ZO7AL PROJECTS</p><h2>{t("modrinthTitle")}</h2></div></div><span className={"dash-tag " + (status?.connected ? "dash-tag-green" : "")}>{d("connection_" + (status?.connected ? "connected" : "setup"))}</span></div>
    <OAuthResult provider="modrinth"/><p className="dash-help">{t("modrinthHint")}</p>
    {status?.account && <div className="oauth-account"><ShieldCheck size={20}/><div><strong dir="ltr">{status.account.username}</strong><bdi className="dash-reference">{status.account.id}</bdi></div></div>}
    {status?.reconnectRequired && <p className="hub-error" role="status">{t("reconnectHint")}</p>}
    {error && !settings && <p className="hub-error" role="alert">{t.has(error) ? t(error) : h.has(error) ? h(error) : h("unavailable")}</p>}
    {error && !settings && <button type="button" className="dash-button" disabled={busy} onClick={() => void reload()}><RefreshCw size={16}/>{d("refresh")}</button>}
    <div className="dash-actions oauth-actions"><button type="button" className="dash-button dash-button-primary" disabled={busy || !status} onClick={() => { if (!status?.clientConfigured) setSettings(true); else void run("connect"); }}><Plug size={16}/>{t(status?.connected ? "reconnect" : "connectModrinth")}</button><button type="button" className="dash-icon-button" aria-label={t("appSettings")} title={t("appSettings")} disabled={busy || !status} onClick={() => setSettings(true)}><Settings2 size={18}/></button>{status?.account && <button type="button" className="dash-button" disabled={busy} onClick={() => setConfirm(true)}><Unplug size={16}/>{t("disconnect")}</button>}</div>
    <small className="dash-help"><ShieldCheck size={14}/>{d("encrypted")}</small>
    {settings && <DetailsDialog title={t("appSettings")} onClose={() => { if (!busy) setSettings(false); }}><form className="hub-form pelican-dialog-form" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget, values = new FormData(form); if (await run("configure", { clientId: values.get("clientId"), clientSecret: values.get("clientSecret") })) { form.reset(); setSettings(false); } }}>
      <p className="dash-help">{t("modrinthSetup")}</p><a className="dash-text-button" href="https://modrinth.com/settings/applications" target="_blank" rel="noopener noreferrer">{t("registerApp")}<ExternalLink size={15}/></a>
      <div className="yt-callback"><span className="dash-help">{t("redirectUri")}</span><code dir="ltr">{status?.redirectUri}</code><button type="button" className="dash-icon-button" aria-label={t("copy")} onClick={async () => { try { await navigator.clipboard.writeText(status?.redirectUri ?? ""); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div>
      {status?.managed ? <p className="dash-help">{d("managedEnvironment")}</p> : <><label>{t("clientId")}<input name="clientId" required maxLength={128} autoComplete="off" dir="ltr" disabled={busy}/></label><label>{t("clientSecret")}<input name="clientSecret" type="password" required minLength={16} maxLength={256} autoComplete="off" dir="ltr" disabled={busy}/></label><button className="dash-button dash-button-primary" type="submit" disabled={busy}>{h(busy ? "loading" : "save")}</button></>}
      {error && <p className="hub-error" role="alert">{t.has(error) ? t(error) : h.has(error) ? h(error) : h("unavailable")}</p>}
    </form></DetailsDialog>}
    {confirm && <DetailsDialog title={t("disconnect")} onClose={() => { if (!busy) setConfirm(false); }}><div className="pelican-dialog-form"><p>{t("disconnectHint")}</p><div className="dash-actions"><button type="button" className="dash-button dash-danger" disabled={busy} onClick={async () => { if (await run("disconnect", { confirm: true })) setConfirm(false); }}>{t("disconnect")}</button><button type="button" className="dash-button" disabled={busy} onClick={() => setConfirm(false)}>{d("cancel")}</button></div></div></DetailsDialog>}
  </section>;
}
