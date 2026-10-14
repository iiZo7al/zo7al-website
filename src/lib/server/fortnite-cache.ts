import 'server-only';
import {fortniteGGSnapshot} from '../data/fortnite-gg-snapshot';
import {sumMetric,type PlatformData,type PlatformItem} from '../data/dashboard';
import {siteDatabase} from './site-db';
export function verifiedFortniteSnapshot(value:unknown):PlatformData|null{
 if(!value||typeof value!=='object')return null;const data=value as PlatformData;
 if(data.id!=='fortnite'||data.sourceName!=='Fortnite.GG'||!data.updatedAt||!Number.isFinite(Date.parse(data.updatedAt))||Date.parse(data.updatedAt)>Date.now()+60000||!Array.isArray(data.items)||!data.items.length||data.items.length>100)return null;
 const keys=['players','plays','minutesPlayed','peakPlayers','uniquePlayers','averagePlaytime'] as const;
 const items:PlatformItem[]=[];
 for(const row of data.items){if(!/^\d{4}-\d{4}-\d{4}$/.test(row.id)||typeof row.title!=='string'||row.title.length>200||!row.metrics)return null;const metrics:PlatformItem['metrics']={};for(const key of keys){const n=row.metrics[key];if(n!==undefined&&n!==null&&(!Number.isFinite(n)||n<0))return null;if(n!==undefined)metrics[key]=n;}items.push({id:row.id,title:row.title,url:'https://fortnite.gg/island/'+row.id,metrics});}
 return {id:'fortnite',source:'public',sourceName:'Fortnite.GG',status:'connected',period:'mixed',updatedAt:data.updatedAt,items,metrics:{projects:items.length,players:sumMetric(items,'players'),plays:sumMetric(items,'plays'),minutesPlayed:sumMetric(items,'minutesPlayed')},coverage:{available:items.filter(i=>i.metrics.plays!==undefined&&i.metrics.plays!==null).length,total:items.length}};
}
export async function resilientFortniteStats(live:PlatformData):Promise<PlatformData>{
 const verified=live.status==='connected'?verifiedFortniteSnapshot(live):null;
 if(verified){try{await(await siteDatabase()).query("INSERT INTO site_platform_cache(platform,payload,updated_at) VALUES('fortnite',$1,$2) ON CONFLICT(platform) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE site_platform_cache.updated_at<excluded.updated_at",[JSON.stringify(verified),verified.updatedAt]);}catch{/* An unavailable cache must not hide valid live source data. */}return verified;}
 let cached=verifiedFortniteSnapshot(fortniteGGSnapshot);
 try{const row=(await(await siteDatabase()).query("SELECT payload FROM site_platform_cache WHERE platform='fortnite'")).rows[0],saved=verifiedFortniteSnapshot(row?.payload);if(saved&&(!cached||Date.parse(saved.updatedAt!)>Date.parse(cached.updatedAt!)))cached=saved;}catch{/* The verified bundled observation remains available on a cache outage. */}
 if(!cached)return live;
 const age=Date.now()-Date.parse(cached.updatedAt!);
 // Never describe old player counts as live or yesterday's daily counts as today's.
 const items=cached.items.map(item=>({...item,metrics:{...item.metrics,...(age>300000?{players:null}:{}),...(age>86400000?{plays:null,uniquePlayers:null,averagePlaytime:null}:{})}}));
 return {...cached,status:'cached',items,metrics:{...cached.metrics,players:sumMetric(items,'players'),plays:sumMetric(items,'plays')},coverage:{available:items.filter(i=>i.metrics.plays!==undefined&&i.metrics.plays!==null).length,total:items.length}};
}
