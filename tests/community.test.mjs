import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { statDataUrl } from './profile-modules.mjs';
import { hashAdminPassword,signAdminSession,ADMIN_COOKIE } from '../src/lib/server/site-security.ts';
import { validateSupport } from '../src/lib/data/hub-validation.ts';

function moduleUrl(path,replacements={}) {
 let source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replace('import "server-only";','');
 for(const [name,value] of Object.entries(replacements).sort(([a],[b])=>b.length-a.length))source=source.replaceAll(name,value);
 return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
}
const stub=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const communityDataUrl=moduleUrl('src/lib/data/community.ts',{'./player-statistics':statDataUrl});
const defaultsUrl=moduleUrl('src/lib/data/community-defaults.ts',{'./community':communityDataUrl});
const {validateCommunity,validateGallerySubmission,safeMediaLink,achievementProgress,DEFAULT_ACHIEVEMENTS}=await import(communityDataUrl);
const copy=await import(moduleUrl('src/lib/data/community-copy.ts'));
const id='a1234567-1234-1234-1234-123456789abc',bridgeId='b1234567-1234-1234-1234-123456789abc',token='a'.repeat(64);
const state={queries:[],previous:null,poll:null,voters:new Set(),limits:true,notificationFails:false,notifications:[],entries:[],found:[],bridges:[],scores:[],galleryImage:null,failInsert:false,rollbacks:0};
const database={async query(sql,args=[]){
 state.queries.push({sql,args});
 if(sql==='ROLLBACK'){state.rollbacks++;return {rows:[],rowCount:0};}
 if(state.failInsert&&sql.startsWith('INSERT INTO community_entries'))throw Error('Database failed');
 if(sql.startsWith('SELECT id FROM site_content_images'))return {rows:[{id}],rowCount:1};
 if(sql.startsWith('SELECT kind,payload'))return {rows:state.previous?[state.previous]:[]};
 if(sql.startsWith('SELECT 1 FROM community_votes'))return {rows:[...state.voters].map(()=>({})),rowCount:state.voters.size};
 if(sql.startsWith('SELECT payload FROM community_entries'))return {rows:state.poll?[{payload:state.poll}]:[]};
 if(sql.startsWith('INSERT INTO community_votes')){const duplicate=state.voters.has(args[1]);state.voters.add(args[1]);return {rows:duplicate?[]:[{option_index:args[2]}],rowCount:duplicate?0:1};}
 if(sql.startsWith('SELECT e.id'))return {rows:state.entries};
 if(sql.startsWith('SELECT poll_id'))return {rows:[]};
 if(sql.startsWith('SELECT title,body,author'))return {rows:[{title:'Gallery',body:'A real player moment',author:'Creator',contact_email:'creator@example.test',payload:{},discord_receipt:null}]};
 if(sql.startsWith('SELECT r.id AS reference'))return {rows:state.found};
 if(sql.startsWith('SELECT id,name,visible_stats'))return {rows:state.bridges};
 if(sql.startsWith('WITH selected'))return {rows:state.scores};
 return {rows:[],rowCount:1};
 },async connect(){return {query:database.query,release(){}};}};
globalThis.__communityTests={state,database};
const db=stub('export async function siteDatabase(){return globalThis.__communityTests.database;}');
const security=moduleUrl('src/lib/server/site-security.ts');
const discord=stub('export async function notifyDiscord(...args){const s=globalThis.__communityTests.state;s.notifications.push(args);if(s.notificationFails)throw Error("Delivery failed");return "discord-id";}');
const serverUrl=moduleUrl('src/lib/server/community.ts',{'./site-db':db,'./discord-notifications':discord,'../data/community-defaults':defaultsUrl,'../data/community':communityDataUrl,'./site-security':security});
const server=await import(serverUrl);
const content=stub('export async function limitAttempt(){return globalThis.__communityTests.state.limits;}export async function publicContent(){return {items:[],available:true};}');
const mediaData=moduleUrl('src/lib/data/content-media.ts');
const media=stub('export async function normalizeContentImage(){return {data:new Uint8Array([1,2,3]),width:1600,height:900};}');
const replacements={'@/lib/server/site-db':db,'@/lib/server/community':serverUrl,'@/lib/server/site-security':security,'@/lib/server/site-content':content,'@/lib/data/community':communityDataUrl,'@/lib/data/player-statistics':statDataUrl,'@/lib/data/content-media':mediaData,'@/lib/server/content-media':media};
const publicRoute=await import(moduleUrl('src/app/api/community/route.ts',replacements));
const ballotRoute=await import(moduleUrl('src/app/api/community/vote/route.ts',replacements));
const galleryRoute=await import(moduleUrl('src/app/api/community/gallery/route.ts',replacements));
const adminRoute=await import(moduleUrl('src/app/api/admin/community/route.ts',replacements));
const notificationRoute=await import(moduleUrl('src/app/api/community/notifications/route.ts',replacements));
const leaderboardRoute=await import(moduleUrl('src/app/api/minecraft/leaderboard/route.ts',replacements));
const saved={secret:process.env.ZO7AL_ADMIN_SESSION_SECRET,hash:process.env.ZO7AL_ADMIN_PASSWORD_HASH};
const secret='s'.repeat(43),hash=await hashAdminPassword('community-private-test-password-123456789');
process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;process.env.ZO7AL_ADMIN_PASSWORD_HASH=hash;
test.after(()=>{for(const [key,value] of [['ZO7AL_ADMIN_SESSION_SECRET',saved.secret],['ZO7AL_ADMIN_PASSWORD_HASH',saved.hash]])if(value===undefined)delete process.env[key];else process.env[key]=value;delete globalThis.__communityTests;});
function reset(){Object.assign(state,{queries:[],previous:null,poll:null,voters:new Set(),limits:true,notificationFails:false,notifications:[],entries:[],found:[],bridges:[],scores:[],failInsert:false,rollbacks:0});}
const request=(path,body,headers={})=>new Request('https://zo7al.test'+path,{method:'POST',headers:{origin:'https://zo7al.test','content-type':'application/json',...headers},body:JSON.stringify(body)});
const auth=()=>({cookie:ADMIN_COOKIE+'='+signAdminSession(secret,hash)});
const poll={kind:'poll',locale:'en',topic:'minecraft',title:'Next season',body:'Choose the next game mode.',projectKey:'',payload:{options:['SMP','PvP']},published:true};
const submission={title:'Our build',body:'A community creation',author:'Creator',email:'creator@example.test',locale:'ar',topic:'minecraft',consent:'on',videoUrl:'https://youtu.be/test'};
function multipart(fields=submission,file){const form=new FormData();for(const [key,value] of Object.entries(fields))form.set(key,String(value));if(file)form.set('image',new Blob([file],{type:'image/png'}),'build.png');return new Request('https://zo7al.test/api/community/gallery',{method:'POST',headers:{origin:'https://zo7al.test'},body:form});}

test('poll inputs reject duplicate, excessive, empty options and malformed dates',()=>{
 assert.deepEqual(validateCommunity(poll).payload.options,['SMP','PvP']);
 for(const payload of [{options:['SMP',' SMP ']},{options:['SMP']},{options:['','PvP']},{options:Array.from({length:9},(_,i)=>String(i))},{options:['SMP','PvP'],endsAt:'tomorrow'}])assert.equal(validateCommunity({...poll,payload}),null);
 assert.equal(validateCommunity({...poll,id:'invalid'}),null);
 assert.equal(validateCommunity({...poll,published:'true'}),null);
 assert.equal(validateCommunity({...poll,topic:'all'}),null);
 assert.ok(validateCommunity({...poll,topic:'fortnite'}));
 assert.equal(validateCommunity({...poll,payload:{options:['SMP','PvP'],contactEmail:'private'}}).payload.contactEmail,undefined);
});
test('gallery links require supported HTTPS origins and permission to publish',()=>{
 assert.ok(validateGallerySubmission(submission));
 for(const url of ['javascript:alert(1)','http://youtube.com/watch','https://youtube.com.evil.test/watch','https://user:pass@youtube.com/watch','https://youtube.com:8443/watch','https://example.test/clip']){assert.equal(safeMediaLink(url),null);assert.equal(validateGallerySubmission({...submission,videoUrl:url}),null);}
 assert.equal(validateGallerySubmission({...submission,consent:false}),null);
 assert.equal(validateGallerySubmission({...submission,website:'bot'}),null);
 assert.equal(validateGallerySubmission({...submission,topic:'all'}),null);
 assert.ok(validateGallerySubmission({...submission,topic:'fortnite'}));
 assert.equal(validateCommunity({...poll,kind:'gallery',author:'Creator',payload:{},imageId:null}),null);
});
test('project states, releases and achievement goals have strict server validation',()=>{
 assert.ok(validateCommunity({...poll,kind:'project',projectKey:'minecraft:network',payload:{status:'paused'}}));
 assert.equal(validateCommunity({...poll,kind:'project',projectKey:'',payload:{status:'available'}}),null);
 assert.equal(validateCommunity({...poll,kind:'project',payload:{status:'online'}}),null);
 assert.equal(validateCommunity({...poll,kind:'changelog',projectKey:'modrinth:project',payload:{version:''}}),null);
 for(const threshold of [-1,0,Infinity,NaN,1e13])assert.equal(validateCommunity({...poll,kind:'achievement',payload:{stat:'kills',threshold}}),null);
 assert.equal(validateCommunity({...poll,kind:'achievement',payload:{stat:'invented',threshold:5}}),null);
});
test('achievements use only synchronized enabled counters and clamp completion',()=>{
 const result=achievementProgress({streak:10,kills:0},[...DEFAULT_ACHIEVEMENTS]);
 assert.deepEqual(result.map(v=>v.stat),['streak','streak','kills']);
 assert.equal(result[0].earned,true);assert.equal(result[0].percent,100);assert.equal(result[1].percent,50);assert.equal(result[2].earned,false);
 assert.deepEqual(achievementProgress(null,[...DEFAULT_ACHIEVEMENTS]),[]);
 assert.deepEqual(achievementProgress({kills:NaN},[...DEFAULT_ACHIEVEMENTS]),[]);
});
test('all ten languages provide community labels without missing keys',()=>{
 const keys=Object.keys(copy.communityCopy('en'));
 for(const locale of ['ar','en','es','fr','de','pt','tr','ja','ko','zh']){const messages=copy.communityCopy(locale);assert.deepEqual(Object.keys(messages),keys);for(const key of keys)assert.ok(messages[key]);}
 assert.equal(copy.communityCopy('ar').gallery,'معرض المجتمع');
});
test('visitor ballots use a signed HttpOnly cookie and reject tampering',()=>{
 const minted=server.voter(new Request('https://zo7al.test'));
 assert.match(minted.cookie,/HttpOnly; SameSite=Lax/);
 const valid=server.voter(new Request('https://zo7al.test',{headers:{cookie:minted.cookie.split(';')[0]}}));
 assert.equal(valid.hash,minted.hash);assert.equal(valid.cookie,null);
 const tampered=server.voter(new Request('https://zo7al.test',{headers:{cookie:minted.cookie.split(';')[0]+'x'}}));assert.notEqual(tampered.hash,minted.hash);assert.ok(tampered.cookie);
});
test('ballot duplicates do not increment results and expired polls roll back',async()=>{
 reset();state.poll={options:['SMP','PvP'],endsAt:null};
 assert.equal(await server.vote(id,0,'visitor'),true);assert.equal(await server.vote(id,1,'visitor'),false);assert.equal(state.voters.size,1);
 state.poll.endsAt='2000-01-01T00:00:00Z';await assert.rejects(server.vote(id,0,'other'),/CLOSED/);assert.equal(state.voters.size,1);assert.equal(state.rollbacks,1);
 state.poll=null;await assert.rejects(server.vote(id,0,'third'),/CLOSED/);
});
test('admin cannot change voted options or change an existing entry kind',async()=>{
 reset();state.previous={kind:'poll',payload:{options:['SMP','PvP']}};state.voters.add('visitor');
 await assert.rejects(server.saveCommunity({...poll,id,payload:{options:['PvP','SMP']}}),/POLL_LOCKED/);
 assert.equal(state.queries.some(q=>q.sql.startsWith('INSERT INTO community_entries')),false);
 await assert.rejects(server.saveCommunity({...poll,id,kind:'achievement',payload:{stat:'streak',threshold:5}}),/INVALID/);
 assert.equal(await server.saveCommunity({...poll,id,title:'Updated wording'}),id);
});
test('public community query filters publication, moderation and private contact data',async()=>{
 reset();await server.communityEntries('ar');const sql=state.queries[0].sql;
 assert.match(sql,/e.published AND e.moderation='approved'/);assert.doesNotMatch(sql.split(' FROM community_entries')[0],/contact_email|discord_receipt/);
 assert.match(sql,/translated.payload->>'version'=e.payload->>'version'/);
 state.entries=[{...poll,id,createdAt:new Date('2026-10-06T12:00:00Z'),updatedAt:new Date('2026-10-06T13:00:00Z')}];
 const entries=await server.communityEntries('ar');assert.equal(entries[0].updatedAt,'2026-10-06T13:00:00.000Z');
 reset();await server.communityEntries('en',true);assert.match(state.queries[0].sql,/contact_email/);
});
test('public routes reject unsupported locales before accessing storage',async()=>{
 reset();assert.equal((await publicRoute.GET(new Request('https://zo7al.test/api/community?locale=unsupported'))).status,400);
 assert.equal((await notificationRoute.GET(new Request('https://zo7al.test/api/community/notifications?locale=unsupported'))).status,400);assert.equal(state.queries.length,0);
});
test('community administration authenticates and guards mutations before touching storage',async()=>{
 reset();assert.equal((await adminRoute.GET(new Request('https://zo7al.test/api/admin/community'))).status,401);
 assert.equal((await adminRoute.POST(request('/api/admin/community',{action:'archive',id}))).status,401);
 assert.equal((await adminRoute.POST(request('/api/admin/community',{action:'archive',id},{...auth(),origin:'https://evil.test'}))).status,403);
 assert.equal(state.queries.length,0);
 assert.equal((await adminRoute.POST(request('/api/admin/community',{action:'reject',id},auth()))).status,200);
 assert.match(state.queries.at(-1).sql,/published=false,moderation='rejected'/);
});
test('voting rejects CSRF, malformed options and missing configuration',async()=>{
 reset();assert.equal((await ballotRoute.POST(request('/api/community/vote',{poll:id,option:0},{origin:'https://evil.test'}))).status,403);
 for(const option of [-1,8,0.5,'0'])assert.equal((await ballotRoute.POST(request('/api/community/vote',{poll:id,option}))).status,400);
 delete process.env.ZO7AL_ADMIN_SESSION_SECRET;
 try{assert.equal((await ballotRoute.POST(request('/api/community/vote',{poll:id,option:0}))).status,503);}finally{process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;}
 assert.equal(state.queries.length,0);
});
test('new voters obtain their cookie, retry once, then respect the ballot rate limit',async()=>{
 reset();state.poll={options:['SMP','PvP']};const first=await ballotRoute.POST(request('/api/community/vote',{poll:id,option:0}));
 assert.equal(first.status,409);assert.equal((await first.json()).error,'RETRY');const cookie=first.headers.get('Set-Cookie').split(';')[0];
 const added=await ballotRoute.POST(request('/api/community/vote',{poll:id,option:0},{cookie}));assert.equal((await added.json()).added,true);
 const duplicate=await ballotRoute.POST(request('/api/community/vote',{poll:id,option:1},{cookie}));assert.equal((await duplicate.json()).added,false);
 state.limits=false;assert.equal((await ballotRoute.POST(request('/api/community/vote',{poll:id,option:1},{cookie}))).status,429);
});
test('gallery submissions remain pending and retain receipt if Discord delivery fails',async()=>{
 reset();state.notificationFails=true;const response=await galleryRoute.POST(multipart());assert.equal(response.status,202);const value=await response.json();assert.ok(value.reference);assert.equal(value.notificationPending,true);
 const insert=state.queries.find(q=>q.sql.startsWith('INSERT INTO community_entries'));
 assert.match(insert.sql,/'pending',false/);assert.equal(insert.args[7],submission.email);assert.equal(state.queries.some(q=>q.sql.startsWith('DELETE')),false);
 assert.equal(state.notifications.length,1);
});
test('gallery image and submission writes roll back together on failure',async()=>{
 reset();state.failInsert=true;assert.equal((await galleryRoute.POST(multipart({...submission,videoUrl:''},new Uint8Array([1,2,3])))).status,503);
 assert.ok(state.queries.find(q=>q.sql.startsWith('INSERT INTO site_content_images')));assert.equal(state.rollbacks,1);assert.equal(state.notifications.length,0);
});
test('gallery rejects unsupported links, missing media and spam before saving',async()=>{
 for(const fields of [{...submission,videoUrl:'https://evil.test/watch'},{...submission,videoUrl:''},{...submission,consent:''}]){reset();assert.equal((await galleryRoute.POST(multipart(fields))).status,400);assert.equal(state.queries.length,0);}
 reset();state.limits=false;assert.equal((await galleryRoute.POST(multipart())).status,429);assert.equal(state.queries.length,0);
});
test('private notifications require valid receipt tokens and do not expose codes',async()=>{
 reset();assert.equal((await notificationRoute.POST(request('/api/community/notifications',{receipts:[{reference:id,token:'bad',kind:'application'}]}))).status,400);
 assert.equal(state.queries.length,0);
 state.found=[{reference:id,kind:'application',status:'accepted',date:new Date('2026-10-06T12:00:00Z')}];
 const response=await notificationRoute.POST(request('/api/community/notifications',{receipts:[{reference:id,token,kind:'application'}]}));
 assert.equal(response.status,200);const body=await response.text();assert.ok(!body.includes(token));assert.ok(body.includes('accepted'));
 const query=state.queries[0];assert.match(query.sql,/r.token_hash=x.hash AND r.kind=x.kind/);assert.ok(!query.args[0].includes(token));
});
test('leaderboard server choices expose only enabled statistics including an empty selection',async()=>{
 reset();state.bridges=[{id:bridgeId,name:'Lobby',visibleStats:['streak','playtimeSeconds']},{id, name:'Private counters',visibleStats:[]}];state.scores=[{username:'Player',value:10}];
 const response=await leaderboardRoute.GET(new Request('https://zo7al.test/api/minecraft/leaderboard?stat=streak'));const value=await response.json();
 assert.deepEqual(value.servers[0].stats,['streak','playtimeSeconds']);assert.deepEqual(value.servers[2].stats,[]);
 const query=state.queries.find(q=>q.sql.startsWith('WITH selected'));assert.match(query.sql,/b.enabled/);assert.match(query.sql,/b.visible_stats \? \$1/);assert.match(query.sql,/max\(value\)/);assert.equal(query.args[1],null);
 reset();await leaderboardRoute.GET(new Request('https://zo7al.test/api/minecraft/leaderboard?stat=kills&server='+bridgeId));const specific=state.queries.find(q=>q.sql.startsWith('WITH selected'));assert.match(specific.sql,/sum\(value\)/);assert.equal(specific.args[1],bridgeId);
});
test('leaderboard rejects unsupported statistics and arbitrary server identifiers',async()=>{
 reset();for(const url of ['?stat=coins','?server=evil','?stat=kills;DROP TABLE'])assert.equal((await leaderboardRoute.GET(new Request('https://zo7al.test/api/minecraft/leaderboard'+url))).status,400);
 assert.equal(state.queries.length,0);
});
test('contextual reports preserve bounded project and version information',()=>{
 const report={type:'technical',email:'player@example.test',subject:'A project issue',message:'There is an issue joining this map.',consent:true,project:'fortnite:0000-0000-0000',projectTitle:'Map',version:'1.2'};
 assert.equal(validateSupport(report).project,report.project);assert.equal(validateSupport(report).version,'1.2');
 assert.equal(validateSupport({...report,project:'x'.repeat(201)}),null);assert.equal(validateSupport({...report,version:'x'.repeat(65)}),null);
});
