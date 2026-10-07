"use client";
import Link from 'next/link';
import { useCallback,useEffect,useRef,useState } from 'react';
import { useLocale,useTranslations } from 'next-intl';
import { Bell,CalendarDays,CheckCheck,ClipboardList,Layers,Newspaper,RefreshCw } from 'lucide-react';
import DetailsDialog from '@/components/ui/DetailsDialog';
import { RECEIPT_KEY,parseReceipts } from '@/lib/data/hub-receipts';
import { communityCopy } from '@/lib/data/community-copy';

const categories=['news','events','projects','requests'] as const;
type Category=typeof categories[number];
type Notice={id:string;kind:Category;title?:string;requestKind?:string;status?:string;delivery?:string;date:string;href:string};
const icons={news:Newspaper,events:CalendarDays,projects:Layers,requests:ClipboardList};
const preferencesKey='zo7al-notification-preferences',seenKey='zo7al-notification-seen';
function readPreferences(){try{const value=JSON.parse(localStorage.getItem(preferencesKey)??'{}');return Object.fromEntries(categories.map(key=>[key,value?.[key]!==false])) as Record<Category,boolean>;}catch{return {news:true,events:true,projects:true,requests:true};}}
export default function NotificationBell(){
 const locale=useLocale(),c=communityCopy(locale),hub=useTranslations('hub');
 const [open,setOpen]=useState(false),[items,setItems]=useState<Notice[]>([]),[seen,setSeen]=useState<string[]>([]),[preferences,setPreferences]=useState<Record<Category,boolean>>({news:true,events:true,projects:true,requests:true}),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 const inflight=useRef<AbortController|null>(null),lastLoad=useRef(0);
 const load=useCallback(async(force=false)=>{
  if(inflight.current||!force&&Date.now()-lastLoad.current<60000)return;
  const controller=new AbortController();inflight.current=controller;setBusy(true);
  let receipts:ReturnType<typeof parseReceipts>=[];try{receipts=parseReceipts(localStorage.getItem(RECEIPT_KEY));}catch{}
  const tasks=[fetch('/api/community/notifications?locale='+locale,{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return (await r.json()).items as Notice[];})];
  if(readPreferences().requests&&receipts.length){
   const requests=receipts.filter(r=>r.kind!=='order').slice(0,12),orders=receipts.filter(r=>r.kind==='order').slice(0,4);
   if(requests.length)tasks.push(fetch('/api/community/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipts:requests}),signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return (await r.json()).items as Notice[];}));
   for(const order of orders)tasks.push(fetch('/api/tracking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order),signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const value=await r.json();return [{id:order.reference+':'+value.status+':'+value.delivery,kind:'requests' as const,requestKind:'order',status:value.status,delivery:value.delivery,date:value.updatedAt??value.createdAt,href:'/requests?tab=orders'}];}));
  }
  try{const results=await Promise.allSettled(tasks);if(controller.signal.aborted)return;const next=results.flatMap(result=>result.status==='fulfilled'?result.value:[]).filter(n=>Number.isFinite(Date.parse(n.date)));setItems(next.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,50));setFailed(results.some(r=>r.status==='rejected'));lastLoad.current=Date.now();}
  finally{if(inflight.current===controller)inflight.current=null;if(!controller.signal.aborted)setBusy(false);}
 },[locale]);
 useEffect(()=>{
  let active=true;
  const read=()=>{if(!active)return;setPreferences(readPreferences());try{const saved=JSON.parse(localStorage.getItem(seenKey)??'[]');setSeen(Array.isArray(saved)?saved.filter(x=>typeof x==='string').slice(0,200):[]);}catch{setSeen([]);}};
  const refresh=()=>{read();void load(true);};
  queueMicrotask(()=>{if(active){read();void load(true);}});
  window.addEventListener('storage',read);window.addEventListener('zo7al-receipts',refresh);
  const interval=setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);
  return()=>{active=false;clearInterval(interval);inflight.current?.abort();inflight.current=null;window.removeEventListener('storage',read);window.removeEventListener('zo7al-receipts',refresh);};
 },[load]);
 const visible=items.filter(item=>preferences[item.kind]),unread=visible.filter(item=>!seen.includes(item.id));
 const mark=(ids:string[])=>{const next=[...new Set([...ids,...seen])].slice(0,200);setSeen(next);try{localStorage.setItem(seenKey,JSON.stringify(next));}catch{}};
 return <><button type="button" className="community-bell" data-cursor="button" aria-label={c.notifications+(unread.length?' ('+unread.length+')':'')} aria-haspopup="dialog" onClick={()=>{setOpen(true);void load();}}><Bell size={18} aria-hidden="true"/>{unread.length>0&&<span className="community-bell-dot" aria-hidden="true"/>}</button>{open&&<DetailsDialog title={c.notifications} onClose={()=>setOpen(false)} style={{width:'min(520px,calc(100vw - 24px))'}}><div className="community-dialog-body"><div className="hub-actions"><button className="hub-button" type="button" disabled={!unread.length} onClick={()=>mark(visible.map(n=>n.id))}><CheckCheck size={16} aria-hidden="true"/>{c.markRead}</button><button className="hub-button" type="button" aria-label={hub('refresh')} disabled={busy} onClick={()=>void load()}><RefreshCw size={16} className={busy?'dash-spinning':''} aria-hidden="true"/></button></div><details className="community-preferences"><summary>{c.preferences}</summary><fieldset>{categories.map(kind=><label key={kind}><input type="checkbox" checked={preferences[kind]} onChange={event=>{const next={...preferences,[kind]:event.target.checked};setPreferences(next);try{localStorage.setItem(preferencesKey,JSON.stringify(next));}catch{}if(kind==='requests'&&event.target.checked)void load(true);}}/>{c[kind]}</label>)}</fieldset><p className="hub-muted mt-4">{c.privateNote}</p></details>{failed&&<p className="hub-muted mt-4" role="status">{c.unavailable}</p>}{visible.length?<div className="community-notification-list">{visible.map(notice=>{const Icon=icons[notice.kind];return <Link key={notice.id} href={notice.href} onClick={()=>{mark([notice.id]);setOpen(false);}} className={'community-notification'+(!seen.includes(notice.id)?' is-unread':'')} data-cursor="link"><span className="community-symbol"><Icon size={18} aria-hidden="true"/></span><div><strong dir="auto">{notice.title??c.requestUpdate}</strong>{notice.kind==='requests'&&<small>{hub(notice.requestKind==='application'?'applications':notice.requestKind==='event'?'registrations':notice.requestKind==='order'?'orders':'support')} · {hub.has('status_'+notice.status)?hub('status_'+notice.status):hub('status_unknown')}{notice.delivery&&notice.delivery!=='unknown'?' · '+hub('delivery_'+notice.delivery):''}</small>}<small><time dateTime={notice.date}>{new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(notice.date))}</time></small></div></Link>;})}</div>:<p className="community-empty" role="status">{busy?c.loading:c.noNotifications}</p>}</div></DetailsDialog>}</>;
}
