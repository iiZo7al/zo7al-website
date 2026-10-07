import { publicContent,limitAttempt } from '@/lib/server/site-content';
import { communityEntries } from '@/lib/server/community';
import { siteDatabase } from '@/lib/server/site-db';
import { COMMUNITY_LOCALES } from '@/lib/data/community';
import { sameOrigin,privateHeaders,readJSON,validReceipt,tokenHash } from '@/lib/server/site-security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noticeReceipt=(value:unknown):value is {reference:string;token:string;kind:string}=>validReceipt(value)&&'kind' in value&&['application','support','event','order'].includes(String(value.kind));
export async function GET(request:Request){
 const locale=new URL(request.url).searchParams.get('locale')??'en';
 if(!COMMUNITY_LOCALES.includes(locale))return Response.json({error:'INVALID'},{status:400});
 try{const[news,events,entries]=await Promise.all([publicContent('news',locale,'all'),publicContent('event',locale,'all'),communityEntries(locale)]);
  const items=[...news.items.map(row=>({id:'news:'+row.id,kind:'news',title:row.title,date:row.createdAt,href:(row.topic==='fortnite'?'/fortnite':'/')+'?news='+encodeURIComponent(row.id)+'#news'})),...events.items.map(row=>({id:'event:'+row.id,kind:'events',title:row.title,date:row.createdAt,href:'/events?topic='+(row.topic==='fortnite'?'fortnite':'minecraft')+'#'+row.id})),...entries.filter(e=>['project','changelog','poll','gallery'].includes(e.kind)).map(e=>({id:e.id+':'+e.updatedAt,kind:'projects',title:e.title,date:e.updatedAt,href:e.kind==='poll'?'/'+(e.topic==='fortnite'?'fortnite':'minecraft')+'#community-polls':e.kind==='gallery'?'/'+(e.topic==='fortnite'?'fortnite':'minecraft')+'#community-gallery':e.projectKey.startsWith('fortnite:')?'/fortnite?map='+encodeURIComponent(e.projectKey.slice(9)):e.projectKey.startsWith('modrinth:')||e.projectKey.startsWith('curseforge:')?'/modpacks?project='+encodeURIComponent(e.projectKey):'/minecraft'}))].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,30);
  return Response.json({items,available:news.available&&events.available},{headers:privateHeaders});
 }catch{return Response.json({items:[],available:false},{status:503,headers:privateHeaders});}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'INVALID'},{status:403,headers:privateHeaders});
 try{
  const body=await readJSON(request,14000) as {receipts?:unknown};
  if(!Array.isArray(body.receipts)||body.receipts.length>12||!body.receipts.every(noticeReceipt))return Response.json({error:'INVALID'},{status:400,headers:privateHeaders});
  if(!await limitAttempt('notifications:'+(request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown'),30,60))return Response.json({error:'RATE_LIMIT'},{status:429,headers:privateHeaders});
  const keys=body.receipts.map(r=>({id:r.reference,hash:tokenHash(r.token),kind:r.kind}));
  const result=await(await siteDatabase()).query(`SELECT r.id AS reference,r.kind,r.status,r.updated_at AS date FROM site_requests r JOIN jsonb_to_recordset($1::jsonb) AS x(id uuid,hash text,kind text) ON r.id=x.id AND r.token_hash=x.hash AND r.kind=x.kind`,[JSON.stringify(keys)]);
  return Response.json({items:result.rows.map(r=>({id:r.reference+':'+new Date(r.date).toISOString(),kind:'requests',requestKind:r.kind,status:r.status,date:r.date,href:'/requests?tab='+(r.kind==='application'?'applications':r.kind==='event'?'events':'support')}))},{headers:privateHeaders});
 }catch{return Response.json({error:'UNAVAILABLE'},{status:503,headers:privateHeaders});}
}
