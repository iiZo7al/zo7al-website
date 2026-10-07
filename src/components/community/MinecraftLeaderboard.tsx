"use client";
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { useLocale,useTranslations } from 'next-intl';
import { ChevronRight,Trophy } from 'lucide-react';
import PlayerStatIcon from '@/components/hub/PlayerStatIcon';
import { communityCopy } from '@/lib/data/community-copy';
import { NETWORK_PROFILE_ID,NETWORK_PROFILE_NAME } from '@/lib/data/player-statistics';
type LeaderStat='streak'|'kills'|'playtimeSeconds';
type Server={id:string;name:string;stats:string[]};
const stats:LeaderStat[]=['streak','kills','playtimeSeconds'];
export default function MinecraftLeaderboard(){
 const locale=useLocale(),c=communityCopy(locale),hub=useTranslations('hub');
 const [server,setServer]=useState<string>(NETWORK_PROFILE_ID),[stat,setStat]=useState<LeaderStat>('streak');
 const [data,setData]=useState({rows:[] as {username:string;value:number}[],servers:[{id:NETWORK_PROFILE_ID,name:NETWORK_PROFILE_NAME,stats}] as Server[],loading:true,available:true});
 useEffect(()=>{const controller=new AbortController();void fetch('/api/minecraft/leaderboard?'+new URLSearchParams({server,stat}),{signal:controller.signal}).then(async response=>({response,value:await response.json()})).then(({response,value})=>{if(!controller.signal.aborted)setData({rows:value.rows??[],servers:value.servers?.length?value.servers:[{id:NETWORK_PROFILE_ID,name:NETWORK_PROFILE_NAME,stats}],available:response.ok&&value.available,loading:false});}).catch(()=>{if(!controller.signal.aborted)setData(s=>({...s,available:false,loading:false,rows:[]}));});return()=>controller.abort();},[server,stat]);
 const availableStats=data.servers.find(s=>s.id===server)?.stats??[],number=new Intl.NumberFormat(locale,{maximumFractionDigits:stat==='playtimeSeconds'?1:0});
 return <><div className="community-filters"><label>{hub('profileServer')}<select value={server} className="hub-button" disabled={data.loading} onChange={event=>{const next=data.servers.find(s=>s.id===event.target.value);setServer(event.target.value);const first=stats.find(key=>next?.stats.includes(key));if(first&&!next?.stats.includes(stat))setStat(first);setData(s=>({...s,loading:true,rows:[]}));}}>{data.servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>{c.stat}<select value={stat} className="hub-button" disabled={data.loading} onChange={event=>{setStat(event.target.value as LeaderStat);setData(s=>({...s,loading:true,rows:[]}));}}>{stats.filter(s=>availableStats.includes(s)||s===stat).map(s=><option key={s} value={s} disabled={!availableStats.includes(s)}>{hub('stat_'+s)}</option>)}</select></label></div>{data.loading||!data.available||!data.rows.length?<p className="community-empty" role="status"><Trophy size={20} aria-hidden="true"/>{data.loading?c.loading:!data.available?c.unavailable:c.noLeaders}</p>:<ol className="community-leader-list">{data.rows.map((row,index)=><li key={row.username}><Link href={'/minecraft?'+new URLSearchParams({player:row.username,server})+'#player'} className="community-leader-row" data-cursor="link"><span className="community-leader-place">{index<3?<Trophy size={19} aria-label={String(index+1)}/>:number.format(index+1)}</span><span className="community-leader-name" dir="ltr">{row.username}</span><span className="community-leader-value"><PlayerStatIcon stat={stat}/>{number.format(stat==='playtimeSeconds'?row.value/3600:row.value)}</span><ChevronRight size={16} aria-hidden="true"/></Link></li>)}</ol>}</>;
}
