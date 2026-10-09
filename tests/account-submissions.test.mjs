import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {SITE_SCHEMA} from '../src/lib/server/site-schema.ts';
import {COMMUNITY_SCHEMA} from '../src/lib/server/community-schema.ts';
import {ACCOUNT_SCHEMA} from '../src/lib/server/account-schema.ts';
import {requestLink,requestTab} from '../src/lib/data/request-tabs.ts';
const stub=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function moduleURL(path,replacements={}) {
 let s=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll("import 'server-only';",'').replaceAll('import "server-only";','');
 for(const [a,b] of Object.entries(replacements).sort(([a],[b])=>b.length-a.length))s=s.replaceAll(a,b);
 return stub(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const engine=new PGlite();await engine.exec(SITE_SCHEMA+COMMUNITY_SCHEMA+ACCOUNT_SCHEMA);
const pool={query:async(sql,args=[])=>{const r=await engine.query(sql,args);return {...r,rowCount:r.affectedRows??r.rows.length};},connect:async()=>({query:pool.query,release(){}})};
globalThis.__submissionTests={pool,notifications:0,outage:false};
const state=globalThis.__submissionTests;
const db=stub('export async function siteDatabase(){return globalThis.__submissionTests.pool;}');
const security=moduleURL('src/lib/server/site-security.ts');
const data=moduleURL('src/lib/data/account.ts');
const authURL=moduleURL('src/lib/server/account-auth.ts',{'./site-db':db,'./site-security':security,'../data/account':data});
const auth=await import(authURL);
const discord=stub('export async function notifyDiscord(){const s=globalThis.__submissionTests;s.notifications++;if(s.outage)throw Error("Discord offline");return "12345";}');
const applicationURL=moduleURL('src/lib/server/creator-applications.ts');
const validation=moduleURL('src/lib/data/hub-validation.ts');
const content=moduleURL('src/lib/server/site-content.ts',{'./site-db':db,'./site-security':security,'./discord-notifications':discord,'./creator-applications':applicationURL,'../data/hub-validation':validation});
const replacements={'@/lib/server/account-auth':authURL,'@/lib/server/site-db':db,'@/lib/server/site-security':security,'@/lib/server/site-content':content,'@/lib/server/discord-notifications':discord,'@/lib/server/creator-applications':applicationURL,'@/lib/data/hub-validation':validation};
const support=await import(moduleURL('src/app/api/support/route.ts',replacements));
const applications=await import(moduleURL('src/app/api/creator-applications/route.ts',replacements));
const gallery=await import(moduleURL('src/app/api/community/gallery/route.ts',{...replacements,'@/lib/server/community':stub('export async function notifyCommunity(){globalThis.__submissionTests.notifications++;}'),'@/lib/server/content-media':stub('export async function normalizeContentImage(){throw Error("unexpected image");}'),'@/lib/data/content-media':moduleURL('src/lib/data/content-media.ts'),'@/lib/data/community':moduleURL('src/lib/data/community.ts',{'./player-statistics':moduleURL('src/lib/data/player-statistics.ts')})}));
const receipts=await import(moduleURL('src/app/api/account/receipts/route.ts',replacements));
const tracking=await import(moduleURL('src/app/api/tracking/route.ts',{...replacements,'@/lib/server/tebex':stub('export function tebexToken(){return null;}export async function tebexRequest(){throw Error();}')}));
const owner='a1234567-1234-1234-1234-123456789abc',stranger='b1234567-1234-1234-1234-123456789abc';
let current={id:owner,email:'owner@example.com',factors:[]};
const savedEnv=Object.fromEntries(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','DATABASE_URL','ZO7AL_SITE_URL','DISCORD_APPLICATION_WEBHOOK_URL'].map(k=>[k,process.env[k]]));
process.env.SUPABASE_URL='https://auth.zo7al.test';process.env.SUPABASE_PUBLISHABLE_KEY='test';process.env.DATABASE_URL='test';delete process.env.ZO7AL_SITE_URL;
process.env.DISCORD_APPLICATION_WEBHOOK_URL='https://discord.com/api/webhooks/123456789/'+ 'a'.repeat(64);
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>String(url).includes('discord.com')?(state.notifications++,Response.json({id:'12345'})):Response.json(current);
const token=(aal='aal1')=>'header.'+Buffer.from(JSON.stringify({sub:current.id,aal})).toString('base64url')+'.signature';
const req=(path,body,{logged=true,aal='aal1',origin='https://zo7al.test'}={})=>new Request('https://zo7al.test'+path,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json','x-forwarded-for':'192.0.2.10',...(logged?{cookie:auth.ACCOUNT_ACCESS+'='+token(aal)}:{})},...(body?{body:JSON.stringify(body)}:{})});
const submission={title:'Private build',body:'A community screenshot',author:'Creator',email:'contact@example.com',topic:'minecraft',locale:'en',consent:'on',videoUrl:'https://youtu.be/clip',userId:stranger};
function multipart(options={}) {const form=new FormData();for(const [k,v] of Object.entries(submission))form.set(k,String(v));const r=req('/api/community/gallery',undefined,options);return new Request(r.url,{method:'POST',headers:{origin:r.headers.get('origin'),...(r.headers.get('cookie')?{cookie:r.headers.get('cookie')}:{})},body:form});}
const supportBody={type:'technical',email:'contact@example.com',subject:'My request',message:'I need help connecting to this Minecraft server.',consent:true,userId:stranger};
const appBody={platform:'youtube',email:'contact@example.com',minecraft:'Player',discord:'creator',channel:'https://www.youtube.com/@creator',followers:'50',content:'Minecraft videos',reason:'I want to record and share Minecraft videos on the server.',consent:true,userId:stranger};
test.after(async()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(savedEnv))if(v===undefined)delete process.env[k];else process.env[k]=v;await engine.close();delete globalThis.__submissionTests;});

test('guest and first-factor-only sessions cannot submit or send notifications',async()=>{
 for(const [route,path,body] of [[support,'/api/support',supportBody],[applications,'/api/creator-applications',appBody]])assert.equal((await route.POST(req(path,body,{logged:false}))).status,401);
 assert.equal((await gallery.POST(multipart({logged:false}))).status,401);
 current={...current,factors:[{id:'verified-app',factor_type:'totp',status:'verified'}]};
 for(const [route,path,body] of [[support,'/api/support',supportBody],[applications,'/api/creator-applications',appBody]])assert.equal((await route.POST(req(path,body))).status,403);
 assert.equal((await gallery.POST(multipart())).status,403);
 assert.equal(state.notifications,0);assert.equal((await pool.query('SELECT count(*)::int AS n FROM site_requests')).rows[0].n,0);
 current={...current,factors:[]};
});
let galleryId,supportId,applicationId;
test('submissions belong to the validated account even when a different owner is supplied',async()=>{
 const g=await gallery.POST(multipart());assert.equal(g.status,202);galleryId=(await g.json()).reference;
 const s=await support.POST(req('/api/support',supportBody));assert.equal(s.status,200);supportId=(await s.json()).reference;
 const a=await applications.POST(req('/api/creator-applications',appBody));assert.equal(a.status,200);applicationId=(await a.json()).reference;
 assert.equal((await pool.query('SELECT user_id FROM community_entries WHERE id=$1',[galleryId])).rows[0].user_id,owner);
 assert.deepEqual((await pool.query('SELECT user_id FROM site_requests ORDER BY created_at')).rows.map(r=>r.user_id),[owner,owner]);
 const list=await receipts.GET(req('/api/account/receipts'));assert.equal(list.headers.get('cache-control'),'private, no-store');
 const rows=(await list.json()).receipts;assert.equal(rows.length,3);assert.ok(rows.some(r=>r.kind==='gallery'&&r.title==='Private build'));assert.ok(!JSON.stringify(rows).includes('contact@example.com'));
});
test('pending and rejected gallery submissions can only be tracked by their account',async()=>{
 let response=await tracking.POST(req('/api/tracking',{reference:galleryId,kind:'gallery'}));assert.equal(response.status,200);assert.equal((await response.json()).status,'pending');
 await pool.query("UPDATE community_entries SET moderation='rejected' WHERE id=$1",[galleryId]);
 response=await tracking.POST(req('/api/tracking',{reference:galleryId,kind:'gallery'}));assert.equal((await response.json()).status,'rejected');
 assert.equal((await tracking.POST(req('/api/tracking',{reference:galleryId,kind:'gallery'},{logged:false}))).status,401);
 current={...current,id:stranger};
 assert.deepEqual((await(await receipts.GET(req('/api/account/receipts'))).json()).receipts,[]);
 for(const [reference,kind] of [[galleryId,'gallery'],[supportId,'support'],[applicationId,'application']])assert.equal((await tracking.POST(req('/api/tracking',{reference,kind}))).status,404);
 current={...current,id:owner,factors:[{factor_type:'totp',status:'verified'}]};
 assert.equal((await receipts.GET(req('/api/account/receipts'))).status,403);assert.equal((await tracking.POST(req('/api/tracking',{reference:galleryId,kind:'gallery'}))).status,403);
 assert.equal((await tracking.POST(req('/api/tracking',{reference:galleryId,kind:'gallery'},{aal:'aal2'}))).status,200);
 current={...current,factors:[]};
});
test('saved support requests survive Discord failures and remain visible on another browser session',async()=>{
 state.outage=true;const response=await support.POST(req('/api/support',supportBody));assert.equal(response.status,202);const result=await response.json();assert.equal(result.notificationPending,true);
 const list=(await(await receipts.GET(req('/api/account/receipts'))).json()).receipts;assert.ok(list.some(r=>r.reference===result.reference));
 const tracked=await tracking.POST(req('/api/tracking',{reference:result.reference,kind:'support'}));assert.equal(tracked.status,200);assert.equal((await tracked.json()).status,'open');state.outage=false;
});
test('origin checks and persistent per-account submission limits run before delivery',async()=>{
 const before=state.notifications;
 for(const [route,path,body] of [[support,'/api/support',supportBody],[applications,'/api/creator-applications',appBody]])assert.equal((await route.POST(req(path,body,{origin:'https://evil.test'}))).status,403);
 assert.equal((await gallery.POST(multipart({origin:'https://evil.test'}))).status,403);assert.equal(state.notifications,before);
 await applications.POST(req('/api/creator-applications',appBody));await applications.POST(req('/api/creator-applications',appBody));
 assert.equal((await applications.POST(req('/api/creator-applications',appBody))).status,429);
 assert.equal(requestLink('gallery'),'/requests?tab=gallery');assert.equal(requestTab('gallery'),'gallery');
 for(const locale of ['en','ar','de','es','fr','pt','tr','ja','ko','zh']){const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));assert.ok(messages.account.submissionLogin);assert.ok(messages.hub.mySubmissions);assert.ok(messages.hub.submissionsIntro);assert.ok(messages.hub.status_approved);}
});
