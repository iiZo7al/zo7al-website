"use client";
import Link from 'next/link';
import { useCallback,useRef,useState } from 'react';
import { useLocale,useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import QueryObserver from './QueryObserver';
import FaqAccordion,{type FaqItem} from '@/components/faq/FaqAccordion';
import ContentFeed from './ContentFeed';
import Receipt from './Receipt';
import { saveReceipt } from '@/lib/data/hub-receipts';
import { DISCORD_LINK } from '@/lib/data/site';
import { communityCopy } from '@/lib/data/community-copy';

export default function SupportCenter(){
 const t=useTranslations('hub'),faq=useTranslations('faq'),common=useTranslations('common'),creator=useTranslations('creators'),c=communityCopy(useLocale());
 const [tab,setTab]=useState('faq'),[order,setOrder]=useState(''),[type,setType]=useState('technical'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState<{reference:string;token:string}|null>(null);
 const [project,setProject]=useState(''),[projectTitle,setProjectTitle]=useState(''),[version,setVersion]=useState(''),[subject,setSubject]=useState(''),lock=useRef(false);
 const orderChanged=useCallback((value:string|null)=>{if(value){setOrder(value.slice(0,128));setType('order');setTab('report');}},[]);
 const projectChanged=useCallback((value:string|null)=>{setProject(value?.slice(0,200)??'');if(value){setType('technical');setTab('report');}},[]);
 const titleChanged=useCallback((value:string|null)=>{setProjectTitle(value?.slice(0,160)??'');if(value)setSubject(previous=>previous||value.slice(0,160));},[]);
 const versionChanged=useCallback((value:string|null)=>setVersion(value?.slice(0,64)??''),[]);
 const tabChanged=useCallback((value:string|null)=>{if(value&&['faq','rules','report'].includes(value))setTab(value);},[]);
 return <><QueryObserver param="tab" onChange={tabChanged}/><QueryObserver param="order" onChange={orderChanged}/><QueryObserver param="project" onChange={projectChanged}/><QueryObserver param="projectTitle" onChange={titleChanged}/><QueryObserver param="version" onChange={versionChanged}/>
  <div className="hub-actions mb-8" role="group" aria-label={t('support')}>{['faq','rules','report'].map(value=><button key={value} type="button" className="hub-button" aria-pressed={tab===value} onClick={()=>setTab(value)}>{value==='faq'?faq('title'):t(value)}</button>)}<Link href="/support#common-errors" className="hub-button">{t('commonErrorsTitle')}</Link><Link href="/requests?tab=support" className="hub-button">{t('track')}</Link><a href={DISCORD_LINK} className="hub-button" target="_blank" rel="noopener noreferrer">Discord</a></div>
  {tab==='faq'?<div id="faq"><FaqAccordion items={faq.raw('items') as FaqItem[]} categories={faq.raw('categories') as Record<string,string>} searchPlaceholder={faq('searchPlaceholder')} noResults={faq('noResults')} allLabel={common('all')}/></div>:tab==='rules'?<ContentFeed kind="rule"/>:<div className="hub-card max-w-[760px]">{receipt?<Receipt kind="support" {...receipt}/>:<form className="hub-form" onSubmit={async event=>{
   event.preventDefault();if(lock.current)return;const data=new FormData(event.currentTarget);lock.current=true;setBusy(true);setError('');
   try{const response=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(data),consent:data.get('consent')==='on'})}),result=await response.json();if(!response.ok)throw Error(result.error);saveReceipt('support',result);setReceipt(result);}
   catch(error){setError(error instanceof Error&&error.message==='RATE_LIMIT'?'rateLimit':'unavailable');}finally{lock.current=false;setBusy(false);}
  }}>
   {project&&<><div className="community-meta"><Flag size={17} aria-hidden="true"/><strong dir="auto">{projectTitle||project}</strong></div><label>{c.project}<input name="project" value={project} readOnly dir="ltr"/><input name="projectTitle" value={projectTitle} type="hidden" readOnly/></label><label>{c.version}<input name="version" value={version} onChange={event=>setVersion(event.target.value)} maxLength={64} dir="auto"/></label></>}
   <label>{t('reportType')}<select name="type" value={type} onChange={event=>setType(event.target.value)}>{['technical','player','order'].map(value=><option key={value} value={value}>{t('report_'+value)}</option>)}</select></label>
   <label>{creator('email')}<input name="email" type="email" required maxLength={254}/></label><label>{creator('minecraft')}<input name="username" dir="ltr" maxLength={32}/></label><label>{t('orderReference')}<input name="order" dir="ltr" value={order} onChange={event=>setOrder(event.target.value)} maxLength={128}/></label>
   <label>{t('subject')}<input name="subject" required minLength={3} maxLength={160} value={subject} onChange={event=>setSubject(event.target.value)}/></label><label>{t('message')}<textarea name="message" required minLength={20} maxLength={3000} rows={6}/></label>
   <label className="hub-honey" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><label className="hub-consent"><input type="checkbox" name="consent" required/>{t('consent')}</label><p className="hub-muted">{t('webhookNote')}</p>{error&&<p role="alert" className="hub-error">{t(error)}</p>}<button className="hub-button" disabled={busy}>{t(busy?'sending':'send')}</button>
  </form>}</div>}</>;
}
