"use client";
import { useEffect,useId,useRef,useState } from 'react';
import { useLocale } from 'next-intl';
import { CalendarDays,Check,Vote } from 'lucide-react';
import { communityCopy } from '@/lib/data/community-copy';
import type { CommunityEntry } from '@/lib/data/community';
import { useCommunity } from './CommunityProvider';

function Poll({entry}:{entry:CommunityEntry}) {
 const locale=useLocale(),c=communityCopy(locale),{votingAvailable,refresh}=useCommunity(),id=useId(),lock=useRef(false);
 const [selected,setSelected]=useState<number|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 const options=entry.payload.options as string[],counts=entry.votes??options.map(()=>0),total=counts.reduce((sum,n)=>sum+n,0),deadline=typeof entry.payload.endsAt==='string'?entry.payload.endsAt:null;
 const savedVote=typeof entry.myVote==='number'?entry.myVote:done?selected:null,hasVoted=savedVote!==null;
 const [closed,setClosed]=useState(false);
 useEffect(()=>{let active=true;const update=()=>{if(active)setClosed(!!deadline&&Date.parse(deadline)<=Date.now());};queueMicrotask(update);const interval=setInterval(update,30000);return()=>{active=false;clearInterval(interval);};},[deadline]);
 const submit=async()=>{
  if(selected===null||lock.current||closed||hasVoted)return;lock.current=true;setBusy(true);setMessage('');
  try{
   const send=()=>fetch('/api/community/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({poll:entry.id,option:selected})});
   let response=await send(),result=await response.json();
   if(result.error==='RETRY'){response=await send();result=await response.json();}
   if(!response.ok)throw Error(result.error==='CLOSED'?'pollClosed':'unavailable');
   setDone(true);setMessage(result.added?'voted':'alreadyVoted');await refresh();
  }catch(error){setMessage(error instanceof Error&&error.message==='pollClosed'?'pollClosed':'unavailable');}
  finally{setBusy(false);lock.current=false;}
 };
 return <article className="community-card card-glow"><div className="community-card-header"><span className="community-symbol"><Vote size={21} aria-hidden="true"/></span><h3 dir="auto">{entry.title}</h3></div>{entry.body&&<p dir="auto">{entry.body}</p>}<form onSubmit={event=>{event.preventDefault();void submit();}}><fieldset disabled={busy||closed||hasVoted||!votingAvailable} className="community-poll-options"><legend className="sr-only">{entry.title}</legend>{options.map((option,index)=><label className="community-poll-option" key={index}><i style={{width:(total?counts[index]/total*100:0)+'%'}} aria-hidden="true"/><input type="radio" name={id} value={index} checked={(hasVoted?savedVote:selected)===index} onChange={()=>setSelected(index)}/><span dir="auto">{option}</span><small>{new Intl.NumberFormat(locale).format(counts[index])}</small></label>)}</fieldset><div className="community-meta"><span>{new Intl.NumberFormat(locale).format(total)} {c.votes}</span>{deadline&&<span><CalendarDays size={13} aria-hidden="true"/><time dateTime={deadline}>{new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(deadline))}</time></span>}</div><div className="hub-actions mt-5"><button type="submit" className="hub-button" disabled={selected===null||busy||closed||hasVoted||!votingAvailable} data-cursor="button">{hasVoted?<Check size={16} aria-hidden="true"/>:<Vote size={16} aria-hidden="true"/>}{busy?c.loading:hasVoted?c.voted:closed?c.pollClosed:c.vote}</button></div></form><p className="hub-muted">{c.oneVote}</p>{message&&<p role="status">{c[message as 'voted'|'alreadyVoted'|'pollClosed'|'unavailable']}</p>}</article>;
}
export default function CommunityPolls({topic='minecraft'}:{topic?:'minecraft'|'fortnite'}) {
 const {entries,loading,available}=useCommunity(),c=communityCopy(useLocale()),polls=entries.filter(e=>e.kind==='poll'&&(e.topic==='all'||e.topic===topic));
 return polls.length?<div className="community-grid">{polls.map(entry=><Poll key={entry.id} entry={entry}/>)}</div>:<p className="community-empty" role="status"><Vote size={20} aria-hidden="true"/>{loading?c.loading:available?c.empty:c.unavailable}</p>;
}
