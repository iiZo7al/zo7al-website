"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Pencil, Plus, Trash2, Send, Inbox, ShoppingBag, CalendarDays } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import type { HubContent } from "@/components/hub/ContentFeed";
import { hubLocales } from "@/lib/data/hub-validation";
import type { DashboardData, ManagementTab, Mutate, RequestRow } from "./types";

export default function DashboardManagement({ data,tab,busy,mutate }: { data:DashboardData; tab:ManagementTab; busy:boolean; mutate:Mutate }) {
  const t = useTranslations("hub"), d = useTranslations("dashboard"), locale = useLocale();
  const [editing,setEditing] = useState<HubContent|null>(null);
  const [deleting,setDeleting] = useState<HubContent|null>(null);
  const [query,setQuery] = useState("");
  const label = tab === "event" ? "events" : tab === "rule" ? "rules" : tab === "application" ? "applications" : tab;
  const matches = (text:string) => text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  if (tab === "news" || tab === "event" || tab === "rule") {
    const content = data.content.filter(item => item.kind === tab && matches(item.title));
    return <section className="dash-management">
      <div className="dash-section-heading"><div><p className="dash-eyebrow">{d("manage")}</p><h2>{t(label)}</h2></div><button className="dash-button" type="button" onClick={() => setEditing(null)}><Plus size={16}/>{t("create")}</button></div>
      <div className="dash-editor-grid">
        <div className="dash-panel card-glow dash-content-list">
          <input className="dash-search" aria-label={d("filter")} placeholder={d("filter")} value={query} onChange={e => setQuery(e.target.value)}/>
          {content.length ? content.map(item => <article className="dash-content-item" key={item.id}>
            <span className="dash-item-icon"><FileText size={20}/></span><div className="dash-item-copy"><h3 dir="auto">{item.title}</h3><p><span>{item.locale.toUpperCase()}</span><span className={"dash-tag "+(item.published?"dash-tag-green":"")}>{t(item.published?"published":"draft")}</span></p><p dir="auto" className="dash-excerpt">{item.body}</p></div>
            <div className="dash-icon-actions"><button className="dash-icon-button" type="button" aria-label={t("edit")} disabled={busy} onClick={() => setEditing(item)}><Pencil size={16}/></button><button className="dash-icon-button dash-danger" type="button" aria-label={t("delete")} disabled={busy} onClick={() => setDeleting(item)}><Trash2 size={16}/></button></div>
          </article>) : <Empty icon={<FileText size={30}/>} text={t("empty")}/>}
        </div>
        <form key={editing?.id??tab} className="dash-panel card-glow hub-form dash-editor" onSubmit={async e => {
          e.preventDefault(); const element = e.currentTarget; const form = new FormData(element); const date = String(form.get("startsAt")??"");
          if (await mutate("content",{ id:editing?.id,kind:tab,locale:form.get("locale"),title:form.get("title"),body:form.get("body"),
            published:form.get("published")==="on",startsAt:date?new Date(date+":00+03:00").toISOString():null,registrationUrl:form.get("registrationUrl") })) { setEditing(null); if (!editing) element.reset(); }
        }}>
          <div className="dash-section-heading"><h3>{t(editing?"edit":"create")}</h3><span className="dash-tag">CMS</span></div>
          <label>{t("language")}<select name="locale" defaultValue={editing?.locale??locale}>{hubLocales.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select></label>
          <label>{t("title")}<input name="title" required maxLength={160} defaultValue={editing?.title??""}/></label>
          <label>{t("body")}<textarea name="body" required maxLength={10000} rows={8} defaultValue={editing?.body??""}/></label>
          {tab==="event" && <><label>{t("startsAt")} · {t("riyadhTime")}<input name="startsAt" type="datetime-local" required defaultValue={editing?.startsAt?new Date(Date.parse(editing.startsAt)+3*3600000).toISOString().slice(0,16):""}/></label><label>{t("eventLink")}<input type="url" name="registrationUrl" defaultValue={editing?.registrationUrl??""} maxLength={1000} placeholder="https://" dir="ltr"/></label></>}
          <label className="hub-consent"><input type="checkbox" name="published" defaultChecked={editing?.published??false}/>{t("published")}</label>
          <button className="dash-button dash-button-primary" disabled={busy} type="submit">{t(busy?"loading":"save")}</button>
        </form>
      </div>
      {deleting && <DetailsDialog title={t("delete")} onClose={() => setDeleting(null)}><div className="dash-delete-dialog"><p dir="auto">{deleting.title}</p><div className="dash-actions"><button className="dash-button dash-danger" type="button" disabled={busy} onClick={async () => { if (await mutate("delete",deleting.id)) setDeleting(null); }}><Trash2 size={16}/>{t("delete")}</button><button className="dash-button" type="button" onClick={() => setDeleting(null)}>{d("cancel")}</button></div></div></DetailsDialog>}
    </section>;
  }
  if (tab === "orders") return <section>
    <div className="dash-section-heading"><div><p className="dash-eyebrow">TEBEX</p><h2>{t("orders")}</h2></div><span className="dash-tag">{data.orders.length}</span></div>
    <p className="dash-help">{d("cartHint")}</p>
    <div className="dash-panel card-glow"><input className="dash-search" aria-label={d("filter")} placeholder={d("filter")} value={query} onChange={e => setQuery(e.target.value)}/>
      {data.orders.filter(order => matches(order.username+" "+order.id)).map(order => <article className="dash-order" key={order.id}><span className="dash-avatar">{order.username.slice(0,1).toUpperCase()}</span><div className="dash-item-copy"><h3 dir="auto">{order.username}</h3><p><bdi>{order.id}</bdi></p><p>{order.items.map(item => "#"+item.packageId+" × "+item.quantity).join(" · ")}</p></div><div className="dash-order-meta"><time dateTime={order.createdAt}>{new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeZone:"Asia/Riyadh"}).format(new Date(order.createdAt))}</time><span className={"dash-tag "+(order.discordReceipt?"dash-tag-green":"")}>{t(order.discordReceipt?"discordDelivered":"discordPending")}</span>{!order.discordReceipt && <button className="dash-button" type="button" disabled={busy} onClick={() => void mutate("retryDiscord",order.id)}><Send size={14}/>{t("retryDiscord")}</button>}</div></article>)}
      {!data.orders.length && <Empty icon={<ShoppingBag size={30}/>} text={t("empty")}/>}
    </div>
  </section>;
  const kind = tab === "registrations" ? "event" : tab;
  const rows = data.requests.filter(row => row.kind === kind && matches(JSON.stringify(row.payload)+" "+row.id));
  return <section><div className="dash-section-heading"><div><p className="dash-eyebrow">{d("manage")}</p><h2>{t(label)}</h2></div><span className="dash-tag">{rows.length}</span></div>
    <input className="dash-search" aria-label={d("filter")} placeholder={d("filter")} value={query} onChange={e => setQuery(e.target.value)}/>
    <div className="dash-review-grid">{rows.map(row => <ReviewCard key={row.id} row={row} busy={busy} onSave={value => mutate("review",value)}/>)}</div>
    {!rows.length && <div className="dash-panel card-glow"><Empty icon={tab==="registrations"?<CalendarDays size={30}/>:<Inbox size={30}/>} text={t("empty")}/></div>}
  </section>;
}
function Empty({ icon,text }: { icon:React.ReactNode; text:string }) { return <div className="dash-empty"><span>{icon}</span><p>{text}</p></div>; }
function ReviewCard({ row,busy,onSave }: { row:RequestRow; busy:boolean; onSave:(value:unknown)=>Promise<boolean> }) {
  const t = useTranslations("hub"), locale = useLocale();
  const [status,setStatus] = useState(row.status), [note,setNote] = useState(row.note);
  const statuses = row.kind==="support"?["open","reviewing","closed"]:["pending","accepted","rejected"];
  return <form className="dash-panel card-glow hub-form dash-review" onSubmit={e => { e.preventDefault(); void onSave({id:row.id,kind:row.kind,status,note}); }}>
    <div className="dash-section-heading"><h3 dir="auto">{String(row.payload.minecraft??row.payload.subject??row.payload.eventTitle??row.id)}</h3><span className="dash-tag">{t("status_"+row.status)}</span></div>
    <p className="dash-help"><time dateTime={row.createdAt}>{new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Riyadh"}).format(new Date(row.createdAt))}</time></p><bdi className="dash-reference">{row.id}</bdi>
    <dl className="dash-review-fields">{Object.entries(row.payload).filter(([key]) => !["consent","website"].includes(key)).map(([key,value]) => <div key={key}><dt>{t.has(key)?t(key):key}</dt><dd dir="auto">{String(value)}</dd></div>)}</dl>
    <span className={"dash-tag "+(row.discordReceipt?"dash-tag-green":"")}>{t(row.discordReceipt?"discordDelivered":"discordPending")}</span>
    <label>{t("status")}<select value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s} value={s}>{t("status_"+s)}</option>)}</select></label>
    <label>{t("publicNote")}<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3}/></label>
    <button className="dash-button dash-button-primary" type="submit" disabled={busy}>{t(busy?"loading":"save")}</button>
  </form>;
}
