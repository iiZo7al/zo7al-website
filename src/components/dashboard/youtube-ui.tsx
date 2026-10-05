"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw, Check, ChevronLeft, ChevronRight } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { youtubeObject as object, youtubeString as string, youtubeThumbnail } from "@/lib/data/youtube-studio";

export type StudioContext = { onExpired: () => void };
export function youtubeError(error: unknown) {
  return typeof error === "string" && ["INVALID", "YT_RECONNECT", "YT_SETUP", "YT_CLIENT_MISSING", "YT_MANAGED", "YT_QUOTA", "YT_PERMISSION", "YT_NOT_FOUND"].includes(error) ? error : "YT_UNAVAILABLE";
}
export function useYoutubeResource(resource: string, context: StudioContext, params: Record<string, string> = {}) {
  const { onExpired } = context, query = JSON.stringify(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    controller.current?.abort(); const current = new AbortController(); controller.current = current; setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/youtube?" + new URLSearchParams({ resource, ...JSON.parse(query) }), { cache: "no-store", signal: current.signal });
      if (response.status === 401) { onExpired(); return; }
      const value = await response.json(); if (!response.ok) throw Error(youtubeError(value.error));
      if (!current.signal.aborted) setData(object(resource === "status" ? value : value.data));
    } catch (error) { if (!current.signal.aborted) setError(error instanceof Error ? error.message : "YT_UNAVAILABLE"); }
    finally { if (!current.signal.aborted) setLoading(false); }
  }, [resource, query, onExpired]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) void reload(); }); return () => { active = false; controller.current?.abort(); }; }, [reload]);
  return { data, loading, error, reload };
}
export function useYoutubeActions(context: StudioContext, reload: () => Promise<void>) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const lock = useRef(false), active = useRef(false), controller = useRef<AbortController | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);
  const run = async (action: string, input: Record<string, unknown> = {}) => {
    if (lock.current) return null; lock.current = true; setBusy(true); setMessage(""); controller.current = new AbortController();
    try {
      const response = await fetch("/api/admin/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.current.signal, body: JSON.stringify({ action, input }) });
      if (response.status === 401) { context.onExpired(); return null; }
      const result = await response.json(); if (!response.ok) throw Error(youtubeError(result.error));
      if (!active.current) return null;
      if (action !== "connect") { setMessage("saved"); await reload(); }
      return result as Record<string, unknown>;
    } catch (error) { if (active.current && !controller.current.signal.aborted) setMessage(error instanceof Error ? error.message : "YT_UNAVAILABLE"); return null; }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return { busy, message, run };
}
export function YoutubeFeedback({ message }: { message: string }) {
  const y = useTranslations("youtubeStudio");
  return message ? <div className={"dash-notice " + (message === "saved" ? "dash-success" : "hub-error")} role="status">{message === "saved" && <Check size={16} />}<span>{y.has(message) ? y(message) : y("YT_UNAVAILABLE")}</span></div> : null;
}
export type StudioField = { name: string; label?: string; type?: "text" | "textarea" | "select" | "checkbox" | "datetime-local"; required?: boolean; max?: number; options?: { value: string; label: string }[] };
export type StudioForm = { title: string; action: string; fields: StudioField[]; initial?: Record<string, unknown>; confirm?: boolean; detail?: string };
export const privacyField: StudioField = { name: "privacyStatus", required: true, type: "select", options: ["private", "unlisted", "public"].map(value => ({ value, label: value })) };
export function YoutubeForm({ form, busy, run, onClose }: { form: StudioForm; busy: boolean; run: (action: string, input: Record<string, unknown>) => Promise<unknown>; onClose: () => void }) {
  const y = useTranslations("youtubeStudio"), [failed, setFailed] = useState(false);
  return <DetailsDialog title={y(form.title)} onClose={() => { if (!busy) onClose(); }}><form className="hub-form pelican-dialog-form" onSubmit={async event => {
    event.preventDefault(); const data = new FormData(event.currentTarget), input = { ...form.initial };
    for (const field of form.fields) { const raw = data.get(field.name); input[field.name] = field.type === "checkbox" ? data.has(field.name) : field.type === "datetime-local" ? raw ? new Date(String(raw)).toISOString() : "" : raw; }
    if (form.confirm) input.confirm = true;
    setFailed(false); if (await run(form.action, input)) onClose(); else setFailed(true);
  }}>
    {form.detail && <p className="dash-help" dir="auto">{form.detail}</p>}
    {form.fields.map(field => field.type === "checkbox" ? <label className="hub-consent" key={field.name}><input type="checkbox" name={field.name} defaultChecked={form.initial?.[field.name] === true} />{y(field.label ?? field.name)}</label> : <label key={field.name}>{y(field.label ?? field.name)}{field.type === "textarea" ? <textarea name={field.name} rows={4} maxLength={field.max ?? 5000} required={field.required} defaultValue={string(form.initial?.[field.name])} dir="auto" /> : field.type === "select" ? <select name={field.name} required={field.required} defaultValue={string(form.initial?.[field.name])}>{field.options?.map(option => <option key={option.value} value={option.value}>{y.has(option.label) ? y(option.label) : option.label}</option>)}</select> : <input name={field.name} type={field.type ?? "text"} maxLength={field.max ?? 255} required={field.required} defaultValue={string(form.initial?.[field.name])} dir={field.type === "datetime-local" ? "ltr" : "auto"} />}</label>)}
    {form.confirm && <label className="hub-consent pelican-confirm"><input type="checkbox" required />{y("confirmAction")}</label>}
    {failed && <p className="hub-error" role="alert">{y("actionFailed")}</p>}
    <div className="dash-actions"><button type="submit" className="dash-button dash-button-primary" disabled={busy}>{y(busy ? "loading" : "save")}</button><button type="button" className="dash-button" disabled={busy} onClick={onClose}>{y("cancel")}</button></div>
  </form></DetailsDialog>;
}
export function YoutubeSection({ title, state, children, actions }: { title: string; state: ReturnType<typeof useYoutubeResource>; children: ReactNode; actions?: ReactNode }) {
  const y = useTranslations("youtubeStudio");
  return <section className="yt-section"><div className="dash-section-heading"><h2>{y(title)}</h2><div className="dash-actions">{actions}<button type="button" className="dash-icon-button" aria-label={y("refresh")} onClick={() => void state.reload()} disabled={state.loading}><RefreshCw size={18} className={state.loading ? "dash-spinning" : ""} /></button></div></div><YoutubeFeedback message={state.error} />{state.loading && !state.data ? <div className="dash-panel card-glow dash-empty" aria-busy="true">{y("loading")}</div> : state.data ? children : null}</section>;
}
export function YoutubeImage({ snippet }: { snippet: unknown }) {
  const value = object(snippet), url = youtubeThumbnail(value.thumbnails);
  return url ? <Image className="yt-thumbnail" src={url} width={320} height={180} unoptimized alt={string(value.title)} /> : <span className="yt-thumbnail yt-placeholder" aria-hidden="true">▶</span>;
}
export function useYoutubeFormat() {
  const locale = useLocale();
  return { number: (value: unknown) => typeof value === "number" && Number.isFinite(value) || typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value)) : "—", date: (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—" };
}
export function useYoutubePages() {
  const [tokens, setTokens] = useState<string[]>([""]), [page, setPage] = useState(0);
  return { token: tokens[page], page, reset: () => { setTokens([""]); setPage(0); }, next: (token: string) => { setTokens(value => [...value.slice(0, page + 1), token]); setPage(page + 1); }, back: () => setPage(Math.max(0, page - 1)) };
}
export function YoutubePages({ state, pages }: { state: ReturnType<typeof useYoutubeResource>; pages: ReturnType<typeof useYoutubePages> }) {
  const y = useTranslations("youtubeStudio"), next = string(state.data?.nextPageToken);
  return <div className="dash-actions yt-pagination"><button type="button" className="dash-button" disabled={!pages.page || state.loading} onClick={pages.back}><ChevronLeft size={16} />{y("previous")}</button><span className="dash-help">{pages.page + 1}</span><button type="button" className="dash-button" disabled={!next || state.loading} onClick={() => pages.next(next)}>{y("next")}<ChevronRight size={16} /></button></div>;
}
