"use client";
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Flag,History,Layers } from 'lucide-react';
import { communityCopy } from '@/lib/data/community-copy';
import { useCommunity } from './CommunityProvider';
export function ProjectStatus({projectKey}:{projectKey:string}){
 const {entries}=useCommunity(),c=communityCopy(useLocale()),entry=entries.find(e=>e.kind==='project'&&e.projectKey===projectKey),status=entry?.payload.status;
 return typeof status==='string'&&['development','available','paused'].includes(status)?<span className={'community-project-status status-'+status}><i/>{c[status as 'available'|'paused'|'development']}</span>:null;
}
export default function ProjectExtras({projectKey,title,version}:{projectKey:string;title:string;version?:string}){
 const c=communityCopy(useLocale()),locale=useLocale(),{entries}=useCommunity(),updates=entries.filter(e=>e.kind==='changelog'&&e.projectKey===projectKey).slice(0,10);
 const query=new URLSearchParams({project:projectKey,projectTitle:title,...(version?{version}:{})});
 return <div className="community-project-extras"><div className="hub-actions"><ProjectStatus projectKey={projectKey}/><Link href={'/support?'+query} className="hub-button" data-cursor="button"><Flag size={16} aria-hidden="true"/>{c.reportProject}</Link></div>{updates.length>0&&<section className="community-changelog"><h3><History size={18} aria-hidden="true"/>{c.updates}</h3><ol>{updates.map(e=><li key={e.id}><span className="community-timeline-dot"/><div><div className="community-update-meta"><span><Layers size={14} aria-hidden="true"/>{String(e.payload.version)}</span><time dateTime={e.createdAt}>{new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(e.createdAt))}</time></div><h4 dir="auto">{e.title}</h4><p dir="auto">{e.body}</p></div></li>)}</ol></section>}</div>;
}
