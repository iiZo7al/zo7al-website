"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CalendarDays, CheckCheck, ClipboardList, Layers, Newspaper, RefreshCw } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { RECEIPT_KEY, parseReceipts } from "@/lib/data/hub-receipts";
import { communityCopy } from "@/lib/data/community-copy";
import { NOTIFICATION_CATEGORIES, normalizeNotificationState, validateNotificationPatch, type NotificationCategory, type NotificationPatch, type NotificationState } from "@/lib/data/community-notifications";

type Notice = { id: string; kind: NotificationCategory; title?: string; requestKind?: string; status?: string; delivery?: string; date: string; href: string };
const icons = { news: Newspaper, events: CalendarDays, projects: Layers, requests: ClipboardList };
const preferencesKey = "zo7al-notification-preferences", seenKey = "zo7al-notification-seen", pendingKey = "zo7al-notification-pending";
function cachedState() {
  try { return normalizeNotificationState({ preferences: JSON.parse(localStorage.getItem(preferencesKey) ?? "{}"), seen: JSON.parse(localStorage.getItem(seenKey) ?? "[]") }); }
  catch { return normalizeNotificationState(); }
}
function mergePatch(older: NotificationPatch | null, newer: NotificationPatch): NotificationPatch {
  return { ...((older?.preferences || newer.preferences) ? { preferences: { ...older?.preferences, ...newer.preferences } } : {}), ...((older?.seen || newer.seen) ? { seen: [...new Set([...(newer.seen ?? []), ...(older?.seen ?? [])])].slice(0, 200) } : {}) };
}

export default function NotificationBell() {
  const locale = useLocale(), c = communityCopy(locale), hub = useTranslations("hub");
  const [open, setOpen] = useState(false), [items, setItems] = useState<Notice[]>([]), [settings, setSettings] = useState<NotificationState>(normalizeNotificationState);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false), [syncStatus, setSyncStatus] = useState<"" | "saving" | "saved" | "error">("");
  const settingsRef = useRef(settings), mounted = useRef(false), initialized = useRef(false), inflight = useRef<AbortController | null>(null), lastLoad = useRef(0);
  const pending = useRef<NotificationPatch | null>(null), queue = useRef<Promise<void>>(Promise.resolve()), jobs = useRef(0);
  const cache = useCallback((next: NotificationState) => {
    settingsRef.current = next;
    if (mounted.current) setSettings(next);
    try { localStorage.setItem(preferencesKey, JSON.stringify(next.preferences)); localStorage.setItem(seenKey, JSON.stringify(next.seen)); } catch {}
  }, []);
  const cachePending = useCallback(() => {
    try { if (pending.current) localStorage.setItem(pendingKey, JSON.stringify(pending.current)); else localStorage.removeItem(pendingKey); } catch {}
  }, []);
  const save = useCallback((patch?: NotificationPatch) => {
    if (patch) pending.current = mergePatch(pending.current, patch);
    if (!pending.current) return;
    cachePending(); jobs.current++;
    if (mounted.current) setSyncStatus("saving");
    queue.current = queue.current.catch(() => {}).then(async () => {
      const next = pending.current;
      if (!next) return;
      pending.current = null;
      try {
        const send = () => fetch("/api/community/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
        let response = await send(), result = await response.json();
        if (result.error === "RETRY") { response = await send(); result = await response.json(); }
        if (!response.ok) throw Error("UNAVAILABLE");
      } catch { pending.current = mergePatch(next, pending.current ?? {}); }
      finally { cachePending(); }
    }).finally(() => {
      jobs.current--;
      if (mounted.current && !jobs.current) setSyncStatus(pending.current ? "error" : "saved");
    });
  }, [cachePending]);
  const load = useCallback(async (force = false) => {
    if (!initialized.current || inflight.current || !force && Date.now() - lastLoad.current < 60000) return;
    if (pending.current) save();
    const controller = new AbortController(); inflight.current = controller; setBusy(true);
    let receipts: ReturnType<typeof parseReceipts> = [];
    try { receipts = parseReceipts(localStorage.getItem(RECEIPT_KEY)); } catch {}
    const tasks = [fetch("/api/community/notifications?locale=" + locale, { cache: "no-store", signal: controller.signal }).then(async response => { if (!response.ok) throw Error(); return (await response.json()).items as Notice[]; })];
    if (settingsRef.current.preferences.requests && receipts.length) {
      const requests = receipts.filter(receipt => receipt.kind !== "order").slice(0, 12), orders = receipts.filter(receipt => receipt.kind === "order").slice(0, 4);
      if (requests.length) tasks.push(fetch("/api/community/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipts: requests }), signal: controller.signal }).then(async response => { if (!response.ok) throw Error(); return (await response.json()).items as Notice[]; }));
      for (const order of orders) tasks.push(fetch("/api/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order), signal: controller.signal }).then(async response => {
        if (!response.ok) throw Error(); const value = await response.json();
        return [{ id: order.reference + ":" + value.status + ":" + value.delivery, kind: "requests" as const, requestKind: "order", status: value.status, delivery: value.delivery, date: value.updatedAt ?? value.createdAt, href: "/requests?tab=orders" }];
      }));
    }
    try {
      const results = await Promise.allSettled(tasks);
      if (controller.signal.aborted || !mounted.current) return;
      const next = results.flatMap(result => result.status === "fulfilled" ? result.value : []).filter(notice => Number.isFinite(Date.parse(notice.date)));
      setItems(next.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 50)); setFailed(results.some(result => result.status === "rejected")); lastLoad.current = Date.now();
    } finally { if (inflight.current === controller) inflight.current = null; if (!controller.signal.aborted && mounted.current) setBusy(false); }
  }, [locale, save]);

  useEffect(() => {
    mounted.current = true; initialized.current = false;
    const controller = new AbortController();
    const start = async () => {
      if (controller.signal.aborted) return;
      setReady(false);
      const local = cachedState(); let hasLegacy = false;
      try { hasLegacy = localStorage.getItem(preferencesKey) !== null || !!local.seen.length; pending.current = validateNotificationPatch(JSON.parse(localStorage.getItem(pendingKey) ?? "null")); } catch {}
      cache(local);
      try {
        const response = await fetch("/api/community/preferences", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw Error(); const result = await response.json();
        if (controller.signal.aborted) return;
        const remote = normalizeNotificationState(result.state), seen = [...new Set([...local.seen, ...remote.seen])].slice(0, 200);
        const preferences = { ...(result.stored ? remote.preferences : local.preferences), ...pending.current?.preferences };
        cache({ preferences, seen });
        if (!result.stored && hasLegacy) save({ preferences, seen });
        else if (seen.some(id => !remote.seen.includes(id))) save({ seen });
        else if (pending.current) save();
      } catch { if (!controller.signal.aborted && mounted.current) setSyncStatus("error"); }
      if (!controller.signal.aborted && mounted.current) { initialized.current = true; setReady(true); await load(true); }
    };
    queueMicrotask(() => void start());
    const storage = (event: StorageEvent) => { if (initialized.current && [preferencesKey, seenKey].includes(event.key ?? "")) cache(cachedState()); };
    const receiptsChanged = () => { void load(true); };
    window.addEventListener("storage", storage); window.addEventListener("zo7al-receipts", receiptsChanged);
    const interval = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60000);
    return () => { mounted.current = false; initialized.current = false; controller.abort(); clearInterval(interval); inflight.current?.abort(); inflight.current = null; window.removeEventListener("storage", storage); window.removeEventListener("zo7al-receipts", receiptsChanged); };
  }, [cache, load, save]);

  const visible = items.filter(item => settings.preferences[item.kind]), unread = visible.filter(item => !settings.seen.includes(item.id));
  const mark = (ids: string[]) => { cache({ ...settingsRef.current, seen: [...new Set([...ids, ...settingsRef.current.seen])].slice(0, 200) }); save({ seen: ids }); };
  return <>
    <button type="button" className="community-bell" data-cursor="button" aria-label={c.notifications + (unread.length ? " (" + unread.length + ")" : "")} aria-haspopup="dialog" onClick={() => { setOpen(true); void load(); }}><Bell size={18} aria-hidden="true" />{unread.length > 0 && <span className="community-bell-dot" aria-hidden="true" />}</button>
    {open && <DetailsDialog title={c.notifications} onClose={() => setOpen(false)} style={{ width: "min(520px,calc(100vw - 24px))" }}><div className="community-dialog-body">
      <div className="hub-actions"><button className="hub-button" type="button" disabled={!ready || !unread.length} onClick={() => mark(visible.map(notice => notice.id))}><CheckCheck size={16} aria-hidden="true" />{c.markRead}</button><button className="hub-button" type="button" aria-label={hub("refresh")} disabled={busy || !ready} onClick={() => void load(true)}><RefreshCw size={16} className={busy ? "dash-spinning" : ""} aria-hidden="true" /></button></div>
      <details className="community-preferences"><summary>{c.preferences}</summary><fieldset disabled={!ready}>{NOTIFICATION_CATEGORIES.map(kind => <label key={kind}><input type="checkbox" checked={settings.preferences[kind]} onChange={event => { const checked = event.target.checked; cache({ ...settingsRef.current, preferences: { ...settingsRef.current.preferences, [kind]: checked } }); save({ preferences: { [kind]: checked } }); if (kind === "requests" && checked) void load(true); }} />{c[kind]}</label>)}</fieldset><p className="hub-muted mt-4">{c.privateNote}</p>{syncStatus && <p className="hub-muted mt-3" role="status">{syncStatus === "saving" ? c.preferencesSaving : syncStatus === "error" ? c.preferencesError : c.preferencesSaved}</p>}</details>
      {failed && <p className="hub-muted mt-4" role="status">{c.unavailable}</p>}
      {visible.length ? <div className="community-notification-list">{visible.map(notice => {
        const Icon = icons[notice.kind];
        return <Link key={notice.id} href={notice.href} onClick={() => { mark([notice.id]); setOpen(false); }} className={"community-notification" + (!settings.seen.includes(notice.id) ? " is-unread" : "")} data-cursor="link"><span className="community-symbol"><Icon size={18} aria-hidden="true" /></span><div><strong dir="auto">{notice.title ?? c.requestUpdate}</strong>{notice.kind === "requests" && <small>{hub(notice.requestKind === "application" ? "applications" : notice.requestKind === "event" ? "registrations" : notice.requestKind === "order" ? "orders" : "support")} · {hub.has("status_" + notice.status) ? hub("status_" + notice.status) : hub("status_unknown")}{notice.delivery && notice.delivery !== "unknown" ? " · " + hub("delivery_" + notice.delivery) : ""}</small>}<small><time dateTime={notice.date}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(notice.date))}</time></small></div></Link>;
      })}</div> : <p className="community-empty" role="status">{busy || !ready ? c.loading : c.noNotifications}</p>}
    </div></DetailsDialog>}
  </>;
}
