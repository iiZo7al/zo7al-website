"use client";
import { useEffect,useState } from "react";
import { useLocale,useTranslations } from "next-intl";
import Link from "next/link";
import DetailsDialog from "@/components/ui/DetailsDialog";
import Receipt from "./Receipt";
import { saveReceipt } from "@/lib/data/hub-receipts";
export type HubContent = { id:string; kind:"news"|"event"|"rule";locale:string;title:string;body:string;startsAt:string|null;registrationUrl:string|null;createdAt?:string;published?:boolean };
function Countdown({date}:{date:string}) {
  const t=useTranslations("hub");const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{const update=()=>setNow(Date.now());queueMicrotask(update);const timer=setInterval(update,1000);return()=>clearInterval(timer);},[]);
  const seconds=now===null?null:Math.max(0,Math.floor((Date.parse(date)-now)/1000));
  return <p className="hub-countdown">{seconds===null?"…":seconds===0?t("eventStarted"):t("countdown",{days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60})}</p>;
}
export default function ContentFeed({kind,limit}:{kind:"news"|"event"|"rule";limit?:number}) {
  const t=useTranslations("hub"),locale=useLocale(),game=useTranslations("game");
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{if(kind!=="event")return;const update=()=>setNow(Date.now());queueMicrotask(update);const timer=setInterval(update,1000);return()=>clearInterval(timer);},[kind]);
  const [items,setItems]=useState<HubContent[]>([]),[loaded,setLoaded]=useState(false),[selected,setSelected]=useState<HubContent|null>(null);
  useEffect(()=>{const c=new AbortController();void fetch(`/api/hub/content?kind=${kind}&locale=${locale}`,{signal:c.signal,cache:"no-store"}).then(r=>r.json()).then(data=>{if(!c.signal.aborted)setItems(Array.isArray(data.items)?data.items:[]);}).catch(()=>{}).finally(()=>{if(!c.signal.aborted)setLoaded(true);});return()=>c.abort();},[kind,locale]);
  return <>{!loaded?<p role="status" className="hub-muted">{game("loading")}</p>:!items.length?<div className="hub-card"><p>{t(kind==="event"?"eventsEmpty":kind==="rule"?"rulesEmpty":"newsEmpty")}</p></div>:<div className="hub-grid">{items.slice(0,limit??40).map(item=><article key={item.id} id={item.id} className="card-glow hub-card scroll-mt-28"><p className="text-label">{t(kind==="event"?"events":kind==="rule"?"rules":"news")}</p><h3 dir="auto">{item.title}</h3><p dir="auto" className={limit?"whitespace-pre-line line-clamp-4":"whitespace-pre-line"}>{item.body}</p>{limit&&<Link href={`/news#${item.id}`} className="hub-button mt-3">{t("news")}</Link>}{item.startsAt&&<><p><time dateTime={item.startsAt}>{new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Riyadh"}).format(new Date(item.startsAt))} · {t("riyadhTime")}</time></p><Countdown date={item.startsAt}/></>}{kind==="event"&&item.startsAt&&now!==null&&Date.parse(item.startsAt)>now&&<div className="hub-actions"><button type="button" className="hub-button" onClick={()=>setSelected(item)}>{t("register")}</button>{item.registrationUrl&&<a href={item.registrationUrl} target="_blank" rel="noopener noreferrer" className="hub-button">{t("eventLink")}</a>}</div>}</article>)}</div>}{selected&&<EventRegistration event={selected} onClose={()=>setSelected(null)}/>}</>;
}
function EventRegistration({event,onClose}:{event:HubContent;onClose:()=>void}) {
  const t=useTranslations("hub"),creator=useTranslations("creators");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState<{reference:string;token:string}|null>(null);
  return <DetailsDialog title={t("register")+" · "+event.title} onClose={onClose}><div className="hub-command">{receipt?<Receipt kind="event" {...receipt}/>:<form className="hub-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);setError("");try{const r=await fetch("/api/events/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...Object.fromEntries(data),eventId:event.id,consent:data.get("consent")==="on"})});const result=await r.json();if(!r.ok)throw Error(result.error);saveReceipt("event",result);setReceipt(result);}catch(e){setError(e instanceof Error&&e.message==="RATE_LIMIT"?"rateLimit":"unavailable");}finally{setBusy(false);}}}>{(["minecraft","email","discord"] as const).map(name=><label key={name}>{creator(name)}<input name={name} type={name==="email"?"email":"text"} required maxLength={name==="email"?254:name==="minecraft"?32:40} dir="ltr"/></label>)}<label className="hub-honey" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><label className="hub-consent"><input name="consent" type="checkbox" required/>{t("consent")}</label>{error&&<p role="alert" className="hub-error">{t(error)}</p>}<button className="hub-button" disabled={busy}>{t(busy?"sending":"register")}</button></form>}</div></DetailsDialog>;
}
export function HomeUpdates() {
  const t=useTranslations("hub");
  return <section className="hub-section"><div className="hub-section-inner"><h2 className="hub-heading">{t("latest")}</h2><ContentFeed kind="news" limit={3}/><div className="hub-actions"><Link href="/news" className="hub-button">{t("news")}</Link><Link href="/events" className="hub-button">{t("events")}</Link></div><LatestVideo/></div></section>;
}
function LatestVideo() {
  const t=useTranslations("hub");
  const [item,setItem]=useState<{title:string;url:string}|null>(null);
  useEffect(()=>{const c=new AbortController();void fetch("/api/hub/latest-video",{signal:c.signal}).then(r=>r.json()).then(data=>{if(!c.signal.aborted&&data.item)setItem(data.item);}).catch(()=>{});return()=>c.abort();},[]);
  return item?<article className="hub-card mt-6"><p className="text-label">{t("latestVideo")}</p><h3 dir="auto">{item.title}</h3><div className="hub-actions"><a href={item.url} className="hub-button" target="_blank" rel="noopener noreferrer">{t("watch")}</a></div></article>:null;
}
