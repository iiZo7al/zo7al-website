import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import ts from 'typescript';
import { statDataUrl } from './profile-modules.mjs';
import { SITE_SCHEMA } from '../src/lib/server/site-schema.ts';
import { COMMUNITY_SCHEMA } from '../src/lib/server/community-schema.ts';

function moduleUrl(path,replacements={}) {
 let source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replace('import "server-only";','');
 for(const [name,value] of Object.entries(replacements).sort(([a],[b])=>b.length-a.length))source=source.replaceAll(name,value);
 return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
}
const stub=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const dataUrl=moduleUrl('src/lib/data/community.ts',{'./player-statistics':statDataUrl});
const defaultsUrl=moduleUrl('src/lib/data/community-defaults.ts',{'./community':dataUrl});
const {COMMUNITY_STARTER_ENTRIES,FORTNITE_STARTER_POLL,localizeCommunityEntry}=await import(defaultsUrl);
const noticeDataUrl=moduleUrl('src/lib/data/community-notifications.ts');
const {validateNotificationPatch}=await import(noticeDataUrl);
const {initializeCommunity}=await import(moduleUrl('src/lib/server/community-setup.ts',{'../data/community-defaults':defaultsUrl}));
function poolFor(engine) {
 const query=async(sql,args=[])=>{const result=await engine.query(sql,args);return {...result,rowCount:result.affectedRows||result.rows.length};};
 return {query,connect:async()=>({query,release(){}})};
}
const folder=await mkdtemp(join(tmpdir(),'zo7al-community-pg-'));
let engine=new PGlite(folder),pool=poolFor(engine);
await engine.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);
globalThis.__zo7alPersistentPool=pool;
const dbUrl=stub('export async function siteDatabase(){return globalThis.__zo7alPersistentPool;}');
const securityUrl=moduleUrl('src/lib/server/site-security.ts');
const discordUrl=stub('export async function notifyDiscord(){throw Error("Simulated Discord outage");}');
const serverUrl=moduleUrl('src/lib/server/community.ts',{'./site-db':dbUrl,'./discord-notifications':discordUrl,'../data/community-defaults':defaultsUrl,'../data/community':dataUrl,'./site-security':securityUrl});
const server=await import(serverUrl);
const hubValidationUrl=moduleUrl('src/lib/data/hub-validation.ts');
const siteContentUrl=moduleUrl('src/lib/server/site-content.ts',{'./site-db':dbUrl,'./site-security':securityUrl,'../data/hub-validation':hubValidationUrl,'./discord-notifications':discordUrl,'./creator-applications':stub('export function validateApplication(){return null;}export async function sendApplicationNotification(){}')});
const siteContent=await import(siteContentUrl);
const hubRoute=await import(moduleUrl('src/app/api/hub/content/route.ts',{'@/lib/server/site-content':siteContentUrl,'@/lib/data/hub-validation':hubValidationUrl}));
const noticeServerUrl=moduleUrl('src/lib/server/community-notifications.ts',{'./site-db':dbUrl,'../data/community-notifications':noticeDataUrl});
const noticeServer=await import(noticeServerUrl);
const rateUrl=stub('export async function limitAttempt(){return true;}');
const replacements={'@/lib/server/site-db':dbUrl,'@/lib/server/community-notifications':noticeServerUrl,'@/lib/server/community':serverUrl,'@/lib/server/site-security':securityUrl,'@/lib/data/community-notifications':noticeDataUrl,'@/lib/data/community':dataUrl,'@/lib/server/site-content':rateUrl};
const publicRoute=await import(moduleUrl('src/app/api/community/route.ts',replacements));
const preferencesRoute=await import(moduleUrl('src/app/api/community/preferences/route.ts',replacements));
const ballotRoute=await import(moduleUrl('src/app/api/community/vote/route.ts',replacements));
const previousSecret=process.env.ZO7AL_ADMIN_SESSION_SECRET;
process.env.ZO7AL_ADMIN_SESSION_SECRET='persistence-test-secret-'.repeat(3);
test.after(async()=>{await engine.close();await rm(folder,{recursive:true,force:true});delete globalThis.__zo7alPersistentPool;if(previousSecret===undefined)delete process.env.ZO7AL_ADMIN_SESSION_SECRET;else process.env.ZO7AL_ADMIN_SESSION_SECRET=previousSecret;});
const request=(path,body,cookie,origin='https://zo7al.test')=>new Request('https://zo7al.test'+path,{method:'POST',headers:{'content-type':'application/json',origin,...(cookie?{cookie}:{})},body:JSON.stringify(body)});
let pollId,cookie,visitorHash;

test('first activation installs separate multilingual game polls and six editable goals only once',async()=>{
 await initializeCommunity(pool);await initializeCommunity(pool);
 const entries=await server.communityEntries('ar');
 assert.equal(entries.filter(entry=>entry.kind==='poll').length,2);assert.equal(entries.filter(entry=>entry.kind==='achievement').length,6);
 const poll=entries.find(entry=>entry.kind==='poll'&&entry.topic==='minecraft');pollId=poll.id;
 assert.equal(poll.title,'وش تبغى نركز عليه في تحديثات زحل القادمة؟');assert.equal(poll.payload.endsAt,null);
 for(const locale of ['en','ar','es','fr','de','pt','tr','ja','ko','zh']){
  const translated=(await server.communityEntries(locale)).find(entry=>entry.kind==='poll'&&entry.topic==='minecraft');
  assert.equal(translated.id,pollId);assert.equal(translated.payload.options.length,4);assert.equal(translated.payload.translations,undefined);
 }
 assert.equal((await pool.query('SELECT count(*)::int AS count FROM community_installations')).rows[0].count,2);
});
test('real ballot constraints retain selection across reloads and language changes',async()=>{
 const first=await publicRoute.GET(new Request('https://zo7al.test/api/community?locale=ar'));
 cookie=first.headers.get('Set-Cookie').split(';')[0];visitorHash=server.voter(new Request('https://zo7al.test',{headers:{cookie}})).hash;
 assert.match(first.headers.get('Set-Cookie'),/Max-Age=31536000/);
 const added=await ballotRoute.POST(request('/api/community/vote',{poll:pollId,option:2},cookie));assert.equal((await added.json()).added,true);
 for(const locale of ['ar','en','ja']){
  const response=await publicRoute.GET(new Request('https://zo7al.test/api/community?locale='+locale,{headers:{cookie}}));
  const result=await response.json(),poll=result.entries.find(entry=>entry.id===pollId);
  assert.equal(poll.myVote,2);assert.deepEqual(poll.votes,[0,0,1,0]);assert.ok(!JSON.stringify(result).includes(visitorHash));
 }
 const duplicate=await ballotRoute.POST(request('/api/community/vote',{poll:pollId,option:0},cookie));assert.equal((await duplicate.json()).added,false);
 const other=(await server.communityEntries('en',false,'a'.repeat(64))).find(entry=>entry.id===pollId);assert.equal(other.myVote,null);
});
test('the same visitor can vote independently in Fortnite without changing the Minecraft ballot',async()=>{
 const fortnite=(await server.communityEntries('ar')).find(entry=>entry.kind==='poll'&&entry.topic==='fortnite');
 assert.notEqual(fortnite.id,pollId);assert.equal(fortnite.title,'وش تبغى نضيف في فورتنايت زحل؟');
 assert.equal(await server.vote(fortnite.id,1,visitorHash),true);
 const entries=await server.communityEntries('en',false,visitorHash);
 assert.deepEqual(entries.find(entry=>entry.id===pollId).votes,[0,0,1,0]);
 const ballot=entries.find(entry=>entry.id===fortnite.id);assert.deepEqual(ballot.votes,[0,1,0,0]);assert.equal(ballot.myVote,1);
 for(const locale of ['en','ar','es','fr','de','pt','tr','ja','ko','zh'])assert.equal((await server.communityEntries(locale)).find(entry=>entry.id===fortnite.id).payload.options.length,4);
 await server.saveCommunity({...ballot,published:false,imageId:null});await initializeCommunity(pool);
 assert.equal((await server.communityEntries('en')).some(entry=>entry.id===fortnite.id),false);
 await server.saveCommunity({...ballot,published:true,imageId:null});
});
test('real content APIs isolate news and events by game and preserve owner edits',async()=>{
 const ids={};
 for(const kind of ['news','event'])for(const topic of ['minecraft','fortnite']){
  const title=topic+' '+kind;
  ids[title]=await siteContent.saveContent({kind,topic,locale:'en',title,body:'Published game content',published:true,startsAt:kind==='event'?'2099-01-01T12:00:00+03:00':null});
 }
 for(const kind of ['news','event'])for(const topic of ['minecraft','fortnite']){
  const response=await hubRoute.GET(new Request('https://zo7al.test/api/hub/content?kind='+kind+'&locale=en&topic='+topic));
  assert.equal(response.status,200);const body=await response.json();assert.equal(body.available,true);assert.deepEqual(body.items.map(row=>row.title),[topic+' '+kind]);assert.equal(body.items[0].topic,topic);
 }
 assert.equal((await hubRoute.GET(new Request('https://zo7al.test/api/hub/content?topic=invalid'))).status,400);
 const combined=await siteContent.publicContent('news','en','all');assert.equal(combined.items.length,2);
 await siteContent.saveContent({id:ids['fortnite news'],kind:'news',topic:'fortnite',locale:'en',title:'Edited Fortnite news',body:'The owner updated this announcement',published:false});
 assert.equal((await siteContent.publicContent('news','en','fortnite')).items.length,0);
 await siteContent.saveContent({id:ids['fortnite news'],kind:'news',topic:'fortnite',locale:'en',title:'Edited Fortnite news',body:'The owner updated this announcement',published:true});
 assert.equal((await siteContent.publicContent('news','en','fortnite')).items[0].title,'Edited Fortnite news');
});
test('server notification settings support partial updates and keep browser identities private',async()=>{
 const initial=await preferencesRoute.GET(new Request('https://zo7al.test/api/community/preferences',{headers:{cookie}}));assert.equal((await initial.json()).stored,false);
 const response=await preferencesRoute.POST(request('/api/community/preferences',{preferences:{events:false},seen:['news:one']},cookie));assert.equal(response.status,200);
 const state=(await response.json()).state;assert.equal(state.preferences.events,false);assert.equal(state.preferences.news,true);assert.deepEqual(state.seen,['news:one']);
 await Promise.all([noticeServer.saveNotificationState(visitorHash,{preferences:{news:false},seen:['notice:two']}),noticeServer.saveNotificationState(visitorHash,{preferences:{projects:false},seen:['notice:three']})]);
 const saved=await noticeServer.notificationState(visitorHash);assert.equal(saved.stored,true);assert.equal(saved.state.preferences.news,false);assert.equal(saved.state.preferences.projects,false);assert.equal(saved.state.preferences.events,false);assert.deepEqual(new Set(saved.state.seen),new Set(['news:one','notice:two','notice:three']));
 const stranger=await noticeServer.notificationState('b'.repeat(64));assert.equal(stranger.stored,false);assert.deepEqual(stranger.state.seen,[]);assert.equal(stranger.state.preferences.events,true);
});
test('notification state bounds input and atomically preserves the most recent 200 read markers',async()=>{
 for(const patch of [{},{preferences:{events:'false'}},{preferences:{admin:true}},{seen:['<script>']},{seen:Array(201).fill('notice')},{visitorHash:'other',preferences:{news:false}}])assert.equal(validateNotificationPatch(patch),null);
 assert.equal((await preferencesRoute.POST(request('/api/community/preferences',{preferences:{events:true}},cookie,'https://evil.test'))).status,403);
 assert.equal((await preferencesRoute.POST(request('/api/community/preferences',{preferences:{admin:true}},cookie))).status,400);
 const newIds=Array.from({length:200},(_,i)=>'new:'+i);
 const saved=await noticeServer.saveNotificationState(visitorHash,{seen:newIds});assert.deepEqual(saved.seen,newIds);
 await noticeServer.saveNotificationState(visitorHash,{seen:['latest']});assert.equal((await noticeServer.notificationState(visitorHash)).state.seen[0],'latest');assert.equal((await noticeServer.notificationState(visitorHash)).state.seen.length,200);
});
test('ballots, preferences and owner publication choices survive closing and reopening Postgres',async()=>{
 const goal=(await server.communityEntries('en',true)).find(entry=>entry.kind==='achievement');
 await server.saveCommunity({...goal,title:'Owner-edited goal',published:false,imageId:null});
 await pool.query('UPDATE community_entries SET published=false WHERE kind=\'achievement\'');
 await engine.close();engine=new PGlite(folder);pool=poolFor(engine);globalThis.__zo7alPersistentPool=pool;
 await engine.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);await initializeCommunity(pool);
 const entries=await server.communityEntries('en',false,visitorHash),poll=entries.find(entry=>entry.id===pollId);
 assert.equal(poll.title,'What should Zo7al focus on next?');assert.equal(poll.myVote,2);assert.deepEqual(poll.votes,[0,0,1,0]);assert.equal(entries.some(entry=>entry.kind==='achievement'),false);
 assert.equal((await server.communityEntries('en',true)).find(entry=>entry.id===goal.id).title,'Owner-edited goal');
 const settings=await noticeServer.notificationState(visitorHash);assert.equal(settings.state.preferences.events,false);assert.equal(settings.state.seen[0],'latest');
 assert.equal(await server.vote(pollId,1,visitorHash),false);
 assert.equal((await pool.query('SELECT count(*)::int AS count FROM community_entries')).rows[0].count,8);
 assert.equal((await siteContent.publicContent('news','en','fortnite')).items[0].title,'Edited Fortnite news');
 assert.equal((await siteContent.publicContent('event','en','minecraft')).items.length,1);
});
test('starter publication toggles retain translations, while owner edits replace starter text',async()=>{
 const original=(await server.communityEntries('en',true)).find(entry=>entry.id===pollId);
 await server.saveCommunity({...original,published:false,imageId:null});
 assert.ok((await pool.query('SELECT payload FROM community_entries WHERE id=$1',[pollId])).rows[0].payload.translations);
 await initializeCommunity(pool);assert.equal((await server.communityEntries('ar')).some(entry=>entry.id===pollId),false);
 await server.saveCommunity({...original,title:'A new owner-written poll',published:true,imageId:null});
 const changed=(await server.communityEntries('ar')).find(entry=>entry.id===pollId);assert.equal(changed.title,'A new owner-written poll');assert.equal(changed.myVote,null);
});
test('pre-existing unpublished owner entries are respected during first activation',async()=>{
 const other=new PGlite();await other.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);const target=poolFor(other);
 try{
  for(const kind of ['poll','achievement'])await target.query("INSERT INTO community_entries(id,kind,locale,title,payload,published,moderation) VALUES(gen_random_uuid(),$1,'en','Owner entry',$2::jsonb,false,'approved')",[kind,JSON.stringify(kind==='poll'?{options:['One','Two']}:{stat:'kills',threshold:500})]);
  await initializeCommunity(target);assert.equal((await target.query('SELECT count(*)::int AS count FROM community_entries')).rows[0].count,3);assert.equal((await target.query("SELECT count(*)::int AS count FROM community_entries WHERE title='Owner entry' AND published")).rows[0].count,0);
 }finally{await other.close();}
});
test('failed first activation rolls back its marker and can retry without partial defaults',async()=>{
 const other=new PGlite();await other.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);const target=poolFor(other);
 try{
  const failing={connect:async()=>{const client=await target.connect();return {...client,query:(sql,args)=>sql.startsWith('INSERT INTO community_entries')?Promise.reject(Error('Injected failure')):client.query(sql,args)};}};
  await assert.rejects(initializeCommunity(failing),/Injected failure/);assert.equal((await target.query('SELECT count(*)::int AS count FROM community_installations')).rows[0].count,0);assert.equal((await target.query('SELECT count(*)::int AS count FROM community_entries')).rows[0].count,0);
  await initializeCommunity(target);assert.equal((await target.query('SELECT count(*)::int AS count FROM community_entries')).rows[0].count,8);
 }finally{await other.close();}
});
test('starter translation labels retain shared option ordering and real-stat achievement thresholds',()=>{
 const sample={...COMMUNITY_STARTER_ENTRIES[0],id:'sample',locale:'en',projectKey:'',published:true,moderation:'approved',author:'',createdAt:'',updatedAt:''};
 assert.equal(localizeCommunityEntry(sample,'ar').payload.options[2],'المودباكات');
 assert.deepEqual(COMMUNITY_STARTER_ENTRIES.filter(entry=>entry.kind==='achievement').map(entry=>entry.payload.threshold),[36000,360000,5,20,100,25]);
 assert.equal(localizeCommunityEntry({...sample,...FORTNITE_STARTER_POLL},'ar').payload.options[1],'تحسين المابات الحالية');
});
test('the schema upgrades legacy news without changing content or publication',async()=>{
 const other=new PGlite();
 try{
  await other.exec("CREATE TABLE site_content (id uuid PRIMARY KEY,kind text NOT NULL,locale text NOT NULL,title varchar(160) NOT NULL,body text NOT NULL,published boolean NOT NULL DEFAULT false,starts_at timestamptz,registration_url text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());INSERT INTO site_content(id,kind,locale,title,body,published) VALUES(gen_random_uuid(),'news','en','Existing news','Keep this announcement',true);");
  await other.exec(SITE_SCHEMA);await other.exec(SITE_SCHEMA);
  assert.deepEqual((await other.query('SELECT title,topic,published FROM site_content')).rows,[{title:'Existing news',topic:'minecraft',published:true}]);
  await assert.rejects(other.query("UPDATE site_content SET topic='all'"),/check constraint/);
 }finally{await other.close();}
});
test('legacy shared community content moves once without losing votes or moderation',async()=>{
 const other=new PGlite();await other.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);const target=poolFor(other);
 try{
  await target.query("INSERT INTO community_installations(id) VALUES('community-starter-v1')");
  const original=(await target.query("INSERT INTO community_entries(id,kind,locale,topic,title,payload,published,moderation) VALUES(gen_random_uuid(),'poll','en','all','Owner poll','{\"options\":[\"One\",\"Two\"]}',false,'approved') RETURNING id")).rows[0].id;
  await target.query('INSERT INTO community_votes(poll_id,visitor_hash,option_index) VALUES($1,$2,1)',[original,'c'.repeat(64)]);
  const gallery=(await target.query("INSERT INTO community_entries(id,kind,locale,topic,title,payload,published,moderation) VALUES(gen_random_uuid(),'gallery','en','all','Private submission','{}',false,'pending') RETURNING id")).rows[0].id;
  await initializeCommunity(target);await initializeCommunity(target);
  const poll=(await target.query('SELECT topic,title,published FROM community_entries WHERE id=$1',[original])).rows[0];assert.deepEqual(poll,{topic:'minecraft',title:'Owner poll',published:false});
  assert.equal((await target.query('SELECT option_index FROM community_votes WHERE poll_id=$1',[original])).rows[0].option_index,1);
  const submission=(await target.query('SELECT topic,moderation,published FROM community_entries WHERE id=$1',[gallery])).rows[0];assert.deepEqual(submission,{topic:'minecraft',moderation:'pending',published:false});
  assert.equal((await target.query("SELECT count(*)::int AS count FROM community_entries WHERE kind='poll' AND topic='fortnite'")).rows[0].count,1);
 }finally{await other.close();}
});
test('an existing Fortnite poll, including a draft, prevents duplicate starter creation',async()=>{
 const other=new PGlite();await other.exec(SITE_SCHEMA+COMMUNITY_SCHEMA);const target=poolFor(other);
 try{
  await target.query("INSERT INTO community_installations(id) VALUES('community-starter-v1')");
  await target.query("INSERT INTO community_entries(id,kind,locale,topic,title,payload,published,moderation) VALUES(gen_random_uuid(),'poll','en','fortnite','Owner Fortnite draft','{\"options\":[\"One\",\"Two\"]}',false,'approved')");
  await initializeCommunity(target);
  const rows=(await target.query("SELECT title,published FROM community_entries WHERE topic='fortnite'")).rows;assert.deepEqual(rows,[{title:'Owner Fortnite draft',published:false}]);
 }finally{await other.close();}
});
