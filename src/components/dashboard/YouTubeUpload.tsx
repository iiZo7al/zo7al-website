"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Pause, Play } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { YOUTUBE_UPLOAD_CHUNK, YOUTUBE_UPLOAD_MAX, youtubeVideoId } from "@/lib/data/youtube-studio";
import { YoutubeFeedback, youtubeError, type StudioContext } from "./youtube-ui";
type Progress = { ticket: string; offset: number; done: boolean; id?: string };
export default function YouTubeUpload({ onExpired, onClose, onDone }: StudioContext & { onClose: () => void; onDone: () => void }) {
  const y = useTranslations("youtubeStudio"), [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [progress, setProgress] = useState<Progress | null>(null), [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null), running = useRef(false), active = useRef(true), current = useRef<Progress | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);
  const request = async (method: string, body: BodyInit, signal: AbortSignal, headers: Record<string, string>) => {
    const response = await fetch("/api/admin/youtube/upload", { method, body, headers, signal });
    if (response.status === 401) { onExpired(); throw Error("YT_RECONNECT"); }
    const value = await response.json(); if (!response.ok) throw Error(youtubeError(value.error)); return value as Omit<Progress, "ticket"> & { ticket?: string };
  };
  const run = async (metadata?: Record<string, unknown>) => {
    if (running.current || !file) return; running.current = true; setBusy(true); setError(""); const abort = new AbortController(); controller.current = abort;
    try {
      let value: Progress;
      if (metadata) value = await request("POST", JSON.stringify({ ...metadata, size: file.size, mime: file.type || "video/mp4" }), abort.signal, { "Content-Type": "application/json" }) as Progress;
      else { const previous = current.current; if (!previous) throw Error("INVALID"); value = { ...previous, ...await request("POST", JSON.stringify({ action: "status", ticket: previous.ticket }), abort.signal, { "Content-Type": "application/json" }) }; }
      current.current = value; if (active.current) setProgress(value);
      while (!value.done && !abort.signal.aborted) {
        const prior = value.offset;
        const chunk = file.slice(prior, Math.min(prior + YOUTUBE_UPLOAD_CHUNK, file.size));
        value = { ...value, ...await request("PUT", chunk, abort.signal, { "Content-Type": "application/octet-stream", "X-Zo7al-Upload": value.ticket, "X-Zo7al-Upload-Offset": String(prior) }) };
        if (!value.done && value.offset <= prior) throw Error("YT_UNAVAILABLE");
        current.current = value; if (active.current) setProgress(value);
      }
      if (value.done && active.current) onDone();
    } catch (error) { if (active.current && !abort.signal.aborted) setError(error instanceof Error ? error.message : "YT_UNAVAILABLE"); }
    finally { running.current = false; if (active.current) setBusy(false); }
  };
  const percent = file && progress ? Math.min(100, Math.floor(progress.offset / file.size * 100)) : 0;
  return <DetailsDialog title={y("uploadVideo")} onClose={() => { controller.current?.abort(); onClose(); }}><div className="pelican-dialog-form"><p className="dash-help">{y("uploadHint")}</p><YoutubeFeedback message={error} />{!progress ? <form className="hub-form" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!file || !file.size || file.size > YOUTUBE_UPLOAD_MAX) { setError("INVALID"); return; }
    const date = String(data.get("publishAt") ?? "");
    void run({ title: data.get("title"), description: data.get("description"), tags: data.get("tags"), privacyStatus: data.get("privacyStatus"), selfDeclaredMadeForKids: data.get("kids") === "yes", containsSyntheticMedia: data.has("synthetic"), ...(date ? { publishAt: new Date(date).toISOString() } : {}) });
  }}><label>{y("videoFile")}<input name="file" type="file" accept="video/*" required disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} /></label><label>{y("title")}<input name="title" required maxLength={100} dir="auto" disabled={busy} /></label><label>{y("description")}<textarea name="description" rows={4} maxLength={5000} dir="auto" disabled={busy} /></label><label>{y("tags")}<input name="tags" maxLength={500} disabled={busy} dir="auto" /></label><label>{y("privacyStatus")}<select name="privacyStatus" defaultValue="private" disabled={busy}>{["private", "unlisted", "public"].map(value => <option value={value} key={value}>{y(value)}</option>)}</select></label><label>{y("publishAt")}<input name="publishAt" type="datetime-local" disabled={busy} /><small className="dash-help">{y("scheduleHint")}</small></label><label>{y("selfDeclaredMadeForKids")}<select name="kids" required defaultValue="" disabled={busy}><option value="" disabled>{y("selectAudience")}</option><option value="yes">{y("yes")}</option><option value="no">{y("no")}</option></select></label><label className="hub-consent"><input name="synthetic" type="checkbox" disabled={busy} />{y("containsSyntheticMedia")}</label><label className="hub-consent"><input type="checkbox" required disabled={busy} />{y("confirmUpload")}</label><button type="submit" className="dash-button dash-button-primary" disabled={busy}><Upload size={16} />{y(busy ? "loading" : "uploadVideo")}</button></form> : <div className="yt-upload-progress"><strong dir="auto">{file?.name}</strong><progress max={100} value={percent} aria-label={y("uploadProgress")} /><p role="status">{progress.done ? y("uploadComplete") : y("uploadProgress") + " · " + percent + "%"}</p>{progress.done && progress.id ? <a className="dash-button" href={"https://studio.youtube.com/video/" + youtubeVideoId(progress.id) + "/edit"} target="_blank" rel="noopener noreferrer">{y("openStudio")}</a> : <button type="button" className="dash-button" disabled={!progress} onClick={() => busy ? controller.current?.abort() : void run()}>{busy ? <Pause size={16} /> : <Play size={16} />}{y(busy ? "pause" : "resume")}</button>}</div>}</div></DetailsDialog>;
}
export function YouTubeMediaForm({ videoId, caption, onExpired, onClose, onDone }: StudioContext & { videoId: string; caption?: boolean; onClose: () => void; onDone: () => void }) {
  const y = useTranslations("youtubeStudio"), [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <DetailsDialog title={y(caption ? "uploadCaption" : "thumbnail")} onClose={() => { if (!busy) onClose(); }}><form className="hub-form pelican-dialog-form" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); const form = new FormData(event.currentTarget); form.set("action", caption ? "caption" : "thumbnail"); form.set("videoId", videoId);
    const file = form.get("file"); if (!(file instanceof File) || file.size > (caption ? 1024 * 1024 : 2 * 1024 * 1024)) { setError("INVALID"); setBusy(false); return; }
    try { const response = await fetch("/api/admin/youtube/media", { method: "POST", body: form }); if (response.status === 401) { onExpired(); return; } const result = await response.json(); if (!response.ok) throw Error(youtubeError(result.error)); onDone(); onClose(); } catch (error) { setError(error instanceof Error ? error.message : "YT_UNAVAILABLE"); } finally { setBusy(false); }
  }}><p className="dash-help">{y(caption ? "captionHint" : "thumbnailHint")}</p><label>{y("file")}<input type="file" name="file" required accept={caption ? ".srt,.vtt" : "image/png,image/jpeg,image/webp"} /></label>{caption && <><label>{y("language")}<input name="language" required maxLength={16} placeholder="ar / en" dir="ltr" /></label><label>{y("title")}<input name="name" maxLength={150} dir="auto" /></label></>}<YoutubeFeedback message={error} /><button type="submit" className="dash-button dash-button-primary" disabled={busy}>{y(busy ? "loading" : "save")}</button></form></DetailsDialog>;
}
