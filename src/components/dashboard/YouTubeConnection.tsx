"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plug, KeyRound, ExternalLink, Copy, ShieldCheck, Settings2, Check } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { PlatformMark } from "./DashboardOverview";
import { useYoutubeResource, useYoutubeActions, YoutubeFeedback, YoutubeForm, type StudioContext } from "./youtube-ui";
import { youtubeObject, youtubeString } from "@/lib/data/youtube-studio";
export default function YouTubeConnection({ onExpired, onChanged }: StudioContext & { onChanged?: () => void }) {
  const y = useTranslations("youtubeStudio"), o = useTranslations("oauth"), d = useTranslations("dashboard"), state = useYoutubeResource("status", { onExpired });
  const actions = useYoutubeActions({ onExpired }, async () => { await state.reload(); onChanged?.(); });
  const [settings, setSettings] = useState(false), [confirm, setConfirm] = useState(false), [copied, setCopied] = useState(false);
  const status = state.data, channel = youtubeObject(status?.channel);
  const connect = async () => {
    if (!status?.clientConfigured) { setSettings(true); return; }
    const result = await actions.run("connect"); if (!result) return;
    try { const url = new URL(String(result.url)); if (url.protocol === "https:" && url.hostname === "accounts.google.com" && url.pathname === "/o/oauth2/v2/auth") window.location.assign(url.href); } catch { /* Invalid upstream URL is never opened. */ }
  };
  return <section className="dash-panel card-glow yt-connection oauth-connection">
    <div className="dash-section-heading"><div className="oauth-provider"><span className="dash-platform-logo dash-logo-youtube"><PlatformMark id="youtube" size={26}/></span><div><p className="dash-eyebrow">ZO7AL PROJECTS</p><h2>{y("connection")}</h2></div></div><span className={"dash-tag " + (status?.connected ? "dash-tag-green" : "")}>{y(status?.connected ? "connected" : "disconnected")}</span></div>
    <p className="dash-help">{y("connectionHint")}</p><YoutubeFeedback message={state.error || (!settings ? actions.message : "")} />
    {state.loading && !status ? <p className="dash-help">{y("loading")}</p> : status && <>
      {status.connected === true && <div className="oauth-account"><ShieldCheck size={20}/><div><strong dir="auto">{youtubeString(channel.title)}</strong><bdi className="dash-reference">{youtubeString(channel.id)}</bdi></div></div>}
      <div className="dash-actions oauth-actions"><button type="button" className="dash-button dash-button-primary" disabled={actions.busy} onClick={() => void connect()}><Plug size={16}/>{y(status.connected ? "reconnect" : "connectGoogle")}</button><button type="button" className="dash-icon-button" aria-label={o("appSettings")} title={o("appSettings")} disabled={actions.busy} onClick={() => setSettings(true)}><Settings2 size={18}/></button>{status.connected === true && <button type="button" className="dash-button" onClick={() => setConfirm(true)} disabled={actions.busy}>{y("disconnect")}</button>}</div>
      <small className="dash-help"><ShieldCheck size={14}/>{y("encrypted")}</small>
    </>}
    {settings && <DetailsDialog title={o("appSettings")} onClose={() => { if (!actions.busy) setSettings(false); }}><div className="pelican-dialog-form hub-form">
      <p className="dash-help">{y("setupInstructions")}</p><a className="dash-text-button" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud<ExternalLink size={15}/></a>
      <div className="yt-callback"><span className="dash-help">{y("redirectUri")}</span><code dir="ltr">{youtubeString(status?.redirectUri)}</code><button type="button" className="dash-icon-button" aria-label={y("copy")} onClick={async () => { try { await navigator.clipboard.writeText(youtubeString(status?.redirectUri)); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div>
      {status?.managed ? <p className="dash-help">{d("managedEnvironment")}</p> : <form className="hub-form" onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget, values = new FormData(form);
        if (await actions.run("configure", { clientId: String(values.get("clientId") ?? "").trim(), clientSecret: String(values.get("clientSecret") ?? "").trim() })) { form.reset(); setSettings(false); }
      }}><label>{y("clientId")}<input name="clientId" required maxLength={256} autoComplete="off" dir="ltr" placeholder="…apps.googleusercontent.com" disabled={actions.busy}/></label><label>{y("clientSecret")}<input name="clientSecret" type="password" required minLength={16} maxLength={256} autoComplete="off" dir="ltr" disabled={actions.busy}/></label><button className="dash-button dash-button-primary" type="submit" disabled={actions.busy}><KeyRound size={16}/>{y("save")}</button></form>}
      <YoutubeFeedback message={actions.message}/>
    </div></DetailsDialog>}
    {confirm && <YoutubeForm form={{ title: "disconnect", action: "disconnect", fields: [], confirm: true }} busy={actions.busy} run={actions.run} onClose={() => setConfirm(false)}/>}
  </section>;
}
