"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plug, KeyRound, ExternalLink, Copy, ShieldCheck } from "lucide-react";
import { useYoutubeResource, useYoutubeActions, YoutubeFeedback, YoutubeForm, type StudioContext } from "./youtube-ui";
import { youtubeObject, youtubeString } from "@/lib/data/youtube-studio";
export default function YouTubeConnection({ onExpired, onChanged }: StudioContext & { onChanged?: () => void }) {
  const y = useTranslations("youtubeStudio"), state = useYoutubeResource("status", { onExpired });
  const actions = useYoutubeActions({ onExpired }, async () => { await state.reload(); onChanged?.(); });
  const [edit, setEdit] = useState(false), [confirm, setConfirm] = useState(false), [copied, setCopied] = useState(false);
  const status = state.data, channel = youtubeObject(status?.channel);
  return <section className="dash-panel card-glow yt-connection"><div className="dash-section-heading"><div><p className="dash-eyebrow">YOUTUBE · ZO7AL PROJECTS</p><h2>{y("connection")}</h2></div><span className={"dash-tag " + (status?.connected ? "dash-tag-green" : "")}>{y(status?.connected ? "connected" : "disconnected")}</span></div><p className="dash-help">{y("connectionHint")}</p><YoutubeFeedback message={state.error || actions.message} />
    {state.loading && !status ? <p className="dash-help">{y("loading")}</p> : status && <>
      {status.connected === true && <p className="yt-channel-name" dir="auto">{youtubeString(channel.title)}<bdi className="dash-reference">{youtubeString(channel.id)}</bdi></p>}
      <div className="yt-callback"><span className="dash-help">{y("redirectUri")}</span><code dir="ltr">{youtubeString(status.redirectUri)}</code><button type="button" className="dash-icon-button" aria-label={y("copy")} onClick={async () => { try { await navigator.clipboard.writeText(youtubeString(status.redirectUri)); setCopied(true); } catch { setCopied(false); } }}><Copy size={16} /></button>{copied && <small className="dash-success">{y("copied")}</small>}</div>
      <p className="dash-help">{y("setupInstructions")}</p><a className="dash-text-button" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud<ExternalLink size={15} /></a>
      {!status.managed && (!status.clientConfigured || edit) && <form className="hub-form yt-app-form" onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget, values = new FormData(form);
        if (await actions.run("configure", { clientId: values.get("clientId"), clientSecret: values.get("clientSecret") })) { form.reset(); setEdit(false); }
      }}><label>{y("clientId")}<input name="clientId" required maxLength={256} autoComplete="off" dir="ltr" placeholder="…apps.googleusercontent.com" /></label><label>{y("clientSecret")}<input name="clientSecret" type="password" required minLength={16} maxLength={256} autoComplete="off" dir="ltr" /></label><button className="dash-button dash-button-primary" type="submit" disabled={actions.busy}><KeyRound size={16} />{y("save")}</button></form>}
      <div className="dash-actions yt-connection-actions">{status.clientConfigured === true && <button type="button" className="dash-button dash-button-primary" disabled={actions.busy} onClick={async () => { const result = await actions.run("connect"); if (!result) return; try { const url = new URL(String(result.url)); if (url.protocol === "https:" && url.hostname === "accounts.google.com") window.location.assign(url.href); } catch { /* Invalid upstream URL is never opened. */ } }}><Plug size={16} />{y(status.connected ? "reconnect" : "connectGoogle")}</button>}{status.clientConfigured === true && !status.managed && <button type="button" className="dash-button" disabled={actions.busy} onClick={() => setEdit(!edit)}>{y("changeApp")}</button>}{status.connected === true && <button type="button" className="dash-button dash-danger" onClick={() => setConfirm(true)} disabled={actions.busy}>{y("disconnect")}</button>}</div>
      <small className="dash-help"><ShieldCheck size={14} />{y("encrypted")}</small>
    </>}
    {confirm && <YoutubeForm form={{ title: "disconnect", action: "disconnect", fields: [], confirm: true }} busy={actions.busy} run={actions.run} onClose={() => setConfirm(false)} />}
  </section>;
}
