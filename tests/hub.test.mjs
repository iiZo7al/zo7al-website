
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import {hashAdminPassword,verifyAdminPassword,signAdminSession,verifyAdminSession,hasAdminSession,configuredAdmin,adminCookie,ADMIN_COOKIE,readJSON,sameOrigin,tokenHash} from "../src/lib/server/site-security.ts";
import {validateContent,validateSupport,validReview} from "../src/lib/data/hub-validation.ts";
import {parseReceipts} from "../src/lib/data/hub-receipts.ts";
import {parseFavorites} from "../src/lib/data/favorites.ts";
import {runMilestones,dailyChallenge} from "../src/lib/data/space-progress.ts";
import { playerParser } from './profile-modules.mjs';
const { parsePlayerStats } = playerParser;

function moduleUrl(path,replacements={}) {
 let source=readFileSync(new URL("../"+path,import.meta.url),"utf8").replace('import "server-only";',"");
 for(const [name,value] of Object.entries(replacements))source=source.replaceAll(name,value);
 return "data:text/javascript;base64,"+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString("base64");
}
const stub=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const state={queries:[],notify:[],notificationFails:false,updateFails:false,found:null,limits:true};
const database={query:async(sql,args=[])=>{
 state.queries.push({sql,args});
 if(sql.startsWith("SELECT title"))return {rows:[{title:"Community event"}]};
 if(sql.startsWith("DELETE"))return {rows:[]};
 if(sql.startsWith("UPDATE")&&state.updateFails)throw Error("DB unavailable after Discord confirmation");
 return {rows:state.found?[state.found]:[],rowCount:1};
}};
globalThis.__zo7alHubTest={state,database};
const db=stub('export async function siteDatabase(){return globalThis.__zo7alHubTest.database;}');
const security=moduleUrl("src/lib/server/site-security.ts");
const validation=moduleUrl("src/lib/data/hub-validation.ts");
const content=stub(`const s=globalThis.__zo7alHubTest;export async function limitAttempt(){return s.state.limits;}export async function createTrackedRequest(kind,payload){s.state.queries.push({sql:"reserve",kind,payload});return {reference:"a1234567-1234-1234-1234-123456789abc",token:"a".repeat(64)};}export async function saveContent(){}export async function retryOrderNotification(){}`);
const discord=stub(`export async function notifyDiscord(...args){const s=globalThis.__zo7alHubTest.state;s.notify.push(args);if(s.notificationFails)throw Error("Delivery failed");return "12345";}`);
const replacements={"@/lib/server/site-db":db,"@/lib/server/site-content":content,"@/lib/server/site-security":security,"@/lib/data/hub-validation":validation,"@/lib/server/discord-notifications":discord};
const support=await import(moduleUrl("src/app/api/support/route.ts",replacements));
const events=await import(moduleUrl("src/app/api/events/register/route.ts",replacements));
const admin=await import(moduleUrl("src/app/api/admin/hub/route.ts",replacements));
const tracking=await import(moduleUrl("src/app/api/tracking/route.ts",{...replacements,"@/lib/server/tebex":stub('export function tebexToken(){return "test";}export async function tebexRequest(){return {data:globalThis.__zo7alHubTest.state.basket};}')}));
const reference="a1234567-1234-1234-1234-123456789abc",token="a".repeat(64);
const req=(path,body,headers={})=>new Request("https://zo7al.test"+path,{method:"POST",headers:{origin:"https://zo7al.test","content-type":"application/json","x-forwarded-for":"192.0.2.10",...headers},body:JSON.stringify(body)});
const reset=()=>{state.queries=[];state.notify=[];state.found=null;state.notificationFails=false;state.updateFails=false;state.limits=true;};
const validSupport={type:"technical",email:"person@example.com",subject:"Connection issue",message:"The game disconnects when I join the server.",consent:true};
const saveEnv=keys=>Object.fromEntries(keys.map(key=>[key,process.env[key]]));
const restoreEnv=saved=>{for(const [k,v] of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;};

test("admin password, expiring session and rotation reject tampering",async()=>{
 const password="random-private-password-123456789";
 const hash=await hashAdminPassword(password);
 assert.equal(await verifyAdminPassword(password,hash),true);
 assert.equal(await verifyAdminPassword(password+"x",hash),false);
 assert.equal(await verifyAdminPassword("short",hash),false);
 const secret="s".repeat(43),now=1700000000000,session=signAdminSession(secret,hash,now);
 assert.equal(verifyAdminSession(session,secret,hash,now),true);
 assert.equal(verifyAdminSession(session+"x",secret,hash,now),false);
 assert.equal(verifyAdminSession(session,secret,hash,now+8*3600000),false);
 assert.equal(verifyAdminSession(session,secret,hash+"changed",now),false);
 assert.equal(verifyAdminSession(session,"short",hash,now),false);
 assert.match(adminCookie(session),/HttpOnly; SameSite=Strict/);
 assert.match(adminCookie("",true),/Max-Age=0/);
 const saved=saveEnv(["ZO7AL_ADMIN_PASSWORD_HASH","ZO7AL_ADMIN_SESSION_SECRET"]);
 try {
  delete process.env.ZO7AL_ADMIN_PASSWORD_HASH;assert.equal(configuredAdmin(),false);assert.equal(hasAdminSession(req("/api/admin/hub",{})),false);
  process.env.ZO7AL_ADMIN_PASSWORD_HASH=hash;process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;
  assert.equal(hasAdminSession(req("/api/admin/hub",{},{cookie:ADMIN_COOKIE+"="+signAdminSession(secret,hash)})),true);
 } finally{restoreEnv(saved);}
});
test("body bytes and origin validation are bounded behind a proxy",async()=>{
 assert.equal(sameOrigin(req("/api/support",{})),true);
 assert.equal(sameOrigin(req("/api/support",{},{origin:"https://other.test"})),false);
 const proxied=new Request("https://internal.test/api/support",{method:"POST",headers:{host:"zo7al.test",origin:"https://zo7al.test"}});
 assert.equal(sameOrigin(proxied),true);
 await assert.rejects(readJSON(req("/api/support",{message:"界".repeat(100)}),100));
 await assert.rejects(readJSON(req("/api/support",{},{ "content-type":"text/plain"})));
 assert.deepEqual(await readJSON(req("/api/support",{ok:true}),100),{ok:true});
});
test("admin APIs protect reads and writes on the server",async()=>{
 reset();
 assert.equal((await admin.GET(new Request("https://zo7al.test/api/admin/hub"))).status,401);
 assert.equal((await admin.POST(req("/api/admin/hub",{action:"delete",id:reference}))).status,401);
 assert.equal(state.queries.length,0);
});
test("content and review validation keep drafts, supported locales and safe event links",()=>{
 const value={kind:"event",locale:"ar",title:"Community event",body:"Join our next tournament.",published:false,startsAt:"2027-01-01T12:00:00+03:00"};
 assert.equal(validateContent(value).published,false);
 assert.equal(validateContent({...value,registrationUrl:"javascript:alert(1)"}),null);
 assert.equal(validateContent({...value,registrationUrl:"https://name:password@example.com"}),null);
 assert.equal(validateContent({...value,startsAt:"not a date"}),null);
 assert.equal(validateContent({...value,locale:"unknown"}),null);
 assert.equal(validReview({id:reference,kind:"application",status:"closed",note:""}),null);
 assert.equal(validReview({id:reference,kind:"support",status:"closed",note:"Handled"}).status,"closed");
 assert.equal(validateSupport({...validSupport,consent:false}),null);
 assert.equal(validateSupport({...validSupport,website:"spam"}),null);
});
test("support success requires a Discord receipt; confirmed submissions survive a later DB outage",async()=>{
 reset();const response=await support.POST(req("/api/support",validSupport));
 assert.equal(response.status,200);assert.equal((await response.json()).token,token);
 assert.equal(state.notify[0][0],"support");assert.equal(state.notify[0][2].Message,validSupport.message);
 assert.equal(response.headers.get("cache-control"),"no-store");
 reset();state.notificationFails=true;
 assert.equal((await support.POST(req("/api/support",validSupport))).status,503);
 assert.ok(state.queries.some(q=>q.sql.startsWith("DELETE")));
 reset();state.updateFails=true;
 assert.equal((await support.POST(req("/api/support",validSupport))).status,200);
 assert.equal(state.queries.some(q=>q.sql.startsWith("DELETE")),false);
 reset();state.limits=false;
 assert.equal((await support.POST(req("/api/support",validSupport))).status,429);
 assert.equal(state.notify.length,0);
});
test("event registration only accepts published future events and sends to Discord",async()=>{
 reset();const payload={eventId:reference,minecraft:"Player",email:"person@example.com",discord:"person",consent:true};
 assert.equal((await events.POST(req("/api/events/register",payload))).status,200);
 assert.equal(state.notify[0][0],"event");
 assert.match(state.queries[0].sql,/published AND starts_at>now\(\)/);
 reset();assert.equal((await events.POST(req("/api/events/register",{...payload,eventId:"-".repeat(36)}))).status,400);assert.equal(state.notify.length,0);
});
test("tracking requires the private code and never exposes payloads or token hashes",async()=>{
 reset();state.found={reference,kind:"application",status:"pending",note:"Review queued",payload:{platform:"youtube",email:"private@example.com",reason:"Private content"},createdAt:"2026-10-03T00:00:00Z",updatedAt:"2026-10-03T00:00:00Z"};
 const response=await tracking.POST(req("/api/tracking",{reference,token,kind:"application"}));
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.platform,"youtube");
 for(const field of ["token","token_hash","payload","email","reason"])assert.equal(field in result,false);
 const query=state.queries.find(q=>q.sql.startsWith("SELECT"));assert.equal(query.args[1],tokenHash(token));assert.notEqual(query.args[1],token);
 assert.match(query.sql,/token_hash=\$2 AND kind=\$3/);
 reset();assert.equal((await tracking.POST(req("/api/tracking",{reference,token:"b".repeat(64),kind:"application"}))).status,404);
 reset();assert.equal((await tracking.POST(req("/api/tracking",{reference,token:"short",kind:"application"}))).status,400);assert.equal(state.queries.length,0);
});
test("a paid order does not imply in-game delivery or expose the basket",async()=>{
 const saved=saveEnv(["MINECRAFT_ORDER_STATUS_URL"]);delete process.env.MINECRAFT_ORDER_STATUS_URL;
 try {
 reset();state.found={id:reference,username:"Player",items:[{packageId:42,quantity:1}],basket_ident:"basket_123",created_at:"2026-10-03T00:00:00Z"};state.basket={ident:"basket_123",complete:true};
 const result=await (await tracking.POST(req("/api/tracking",{reference,token,kind:"order"}))).json();
 assert.equal(result.status,"paid");assert.equal(result.delivery,"unknown");assert.equal("basket_ident" in result,false);
 state.basket={ident:"basket_123"};
 assert.equal((await (await tracking.POST(req("/api/tracking",{reference,token,kind:"order"}))).json()).status,"unknown");
 state.basket={ident:"other_basket",complete:true};
 assert.equal((await (await tracking.POST(req("/api/tracking",{reference,token,kind:"order"}))).json()).status,"unknown");
 }finally{restoreEnv(saved);}
});
test("stored receipts and favorites reject malformed local data",()=>{
 assert.deepEqual(parseReceipts("{broken"),[]);
 assert.deepEqual(parseReceipts(JSON.stringify([{kind:"order",reference:"-".repeat(36),token,savedAt:"today"}])),[]);
 const row={kind:"order",reference,token,savedAt:"2026-10-03T00:00:00Z"};
 assert.equal(parseReceipts(JSON.stringify(Array(40).fill(row))).length,30);
 assert.deepEqual(parseFavorites(JSON.stringify(["map:1234-5678-9012","javascript:x","map:1234-5678-9012"])),["map:1234-5678-9012"]);
});
test("profile statistics accept only the matching player's allowlisted finite values",()=>{
 const data={username:"Player",stats:{kills:10,wins:2,deaths:-1,playtimeSeconds:Infinity,privateBalance:999},online:true,lastSeen:"2026-10-03T00:00:00Z"};
 assert.deepEqual(parsePlayerStats(data,"player").stats,{kills:10,wins:2});
 assert.equal(parsePlayerStats(data,"someone").stats,null);
 assert.equal(parsePlayerStats({...data,stats:{},online:"yes",lastSeen:"invalid"},"Player").online,null);
});
test("daily challenges reset at Riyadh midnight and milestones reject invalid runs",()=>{
 assert.equal(dailyChallenge(new Date("2026-10-03T20:59:59Z")).day,"2026-10-03");
 assert.equal(dailyChallenge(new Date("2026-10-03T21:00:00Z")).day,"2026-10-04");
 assert.deepEqual(runMilestones(-1,0),[]);assert.deepEqual(runMilestones(1.1,0),[]);
 assert.deepEqual(runMilestones(100000,10),["firstFlight","score10000","stars10","score100000"]);
});
test("weekly leaderboard validates its period and filters before selecting each player's best run",async()=>{
 let query="";
 const spaceDB=stub('export function getSpaceDatabase(){return {query:async(sql)=>{globalThis.__zo7alWeeklySQL=sql;return {rows:[]};}};}');
 const {GET}=await import(moduleUrl("src/app/api/space-run/leaderboard/route.ts",{"@/lib/server/space-db":spaceDB}));
 const weekly=await GET(new Request("https://zo7al.test/api/space-run/leaderboard?period=weekly"));
 assert.deepEqual(await weekly.json(),{records:[],period:"weekly"});query=globalThis.__zo7alWeeklySQL;
 assert.match(query,/completed_at >= .*date_trunc\('week'.*Asia\/Riyadh/);
 assert.ok(query.indexOf("completed_at >=")<query.indexOf("ORDER BY COALESCE"));
 assert.deepEqual(await (await GET(new Request("https://zo7al.test/api/space-run/leaderboard?period=weekly%27%3BDROP"))).json(),{records:[],period:"all"});
 assert.equal(globalThis.__zo7alWeeklySQL.includes("completed_at >="),false);
});
test("all ten hub and game translations have matching keys, categories and placeholders",()=>{
 const locales=["en","ar","es","fr","de","pt","tr","ja","ko","zh"];
 const catalogs=locales.map(locale=>JSON.parse(readFileSync(new URL("../messages/"+locale+".json",import.meta.url))));
 const placeholders=s=>[...s.matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort();
 for(const data of catalogs) {
  assert.deepEqual(Object.keys(data.hub).sort(),Object.keys(catalogs[0].hub).sort());
  assert.deepEqual(Object.keys(data.game).sort(),Object.keys(catalogs[0].game).sort());
  for(const namespace of ["hub","game"])for(const [key,value] of Object.entries(catalogs[0][namespace]))if(typeof value==="string")assert.deepEqual(placeholders(data[namespace][key]),placeholders(value),namespace+"."+key);
  assert.deepEqual(data.hub.commonErrors.map(row=>row.category),["connection","connection","connection","connection","store","modpacks"]);
  assert.ok(data.hub.commonErrors.every(row=>row.q&&row.a));
 }
});

test("admin login rate limits and rejects cross-origin requests before password work",async()=>{
 const login=await import(moduleUrl("src/app/api/admin/login/route.ts",replacements));
 const saved=saveEnv(["ZO7AL_ADMIN_PASSWORD_HASH","ZO7AL_ADMIN_SESSION_SECRET"]);
 try {
 reset();delete process.env.ZO7AL_ADMIN_PASSWORD_HASH;
 assert.equal((await login.POST(req("/api/admin/login",{password:"bad"}))).status,503);
 process.env.ZO7AL_ADMIN_PASSWORD_HASH=await hashAdminPassword("private-login-password-123456789");process.env.ZO7AL_ADMIN_SESSION_SECRET="s".repeat(43);
 assert.equal((await login.POST(req("/api/admin/login",{password:"bad"},{origin:"https://other.test"}))).status,403);
 assert.equal((await login.POST(req("/api/admin/login",{password:"bad"}))).status,401);
 const success=await login.POST(req("/api/admin/login",{password:"private-login-password-123456789"}));
 assert.equal(success.status,200);assert.match(success.headers.get("set-cookie"),/HttpOnly/);
 const cookie=success.headers.get("set-cookie").split(";")[0];
 assert.equal((await admin.POST(req("/api/admin/hub",{action:"delete",id:reference},{cookie,origin:"https://other.test"}))).status,403);
 assert.equal(state.notify.length,0);
 state.limits=false;
 assert.equal((await login.POST(req("/api/admin/login",{password:"private-login-password-123456789"}))).status,429);
 }finally{restoreEnv(saved);reset();}
});
test("order notifications persist for retry and exclude private basket identifiers and access codes",async()=>{
 const actualContent=await import(moduleUrl("src/lib/server/site-content.ts",{"./site-db":db,"./site-security":security,"../data/hub-validation":validation,"./discord-notifications":discord}));
 const saved=saveEnv(["DATABASE_URL"]);
 try {
 process.env.DATABASE_URL="postgresql://test";
 reset();
 const result=await actualContent.createOrderReceipt("private_basket","Player",[{packageId:42,quantity:2}],[{id:42,name:"Coins"}]);
 assert.ok(result.reference);assert.equal(result.token.length,64);
 assert.equal(state.notify[0][0],"order");assert.match(state.notify[0][2].Items,/Coins × 2/);
 assert.match(state.notify[0][2].Status,/Awaiting payment/);
 assert.equal(JSON.stringify(state.notify).includes("private_basket"),false);
 assert.equal(JSON.stringify(state.notify).includes(result.token),false);
 const insert=state.queries.find(q=>q.sql.startsWith("INSERT"));
 assert.equal(insert.args[1],tokenHash(result.token));assert.ok(insert.sql.includes("discord_payload"));
 reset();state.notificationFails=true;
 assert.ok(await actualContent.createOrderReceipt("other_basket","Player",[{packageId:42,quantity:1}]));
 assert.equal(state.queries.some(q=>q.sql.startsWith("DELETE")),false);
 }finally{restoreEnv(saved);reset();}
});
test("Discord fallback uses the existing hook, square logo and all report text without pings",async()=>{
 const notification=await import(moduleUrl("src/lib/server/discord-notifications.ts",{"./creator-applications":moduleUrl("src/lib/server/creator-applications.ts")}));
 const saved=saveEnv(["DISCORD_APPLICATION_WEBHOOK_URL","DISCORD_SUPPORT_WEBHOOK_URL","DISCORD_EVENT_WEBHOOK_URL"]),savedFetch=globalThis.fetch;
 try {
 process.env.DISCORD_APPLICATION_WEBHOOK_URL="https://discord.com/api/webhooks/123/abc";delete process.env.DISCORD_SUPPORT_WEBHOOK_URL;delete process.env.DISCORD_EVENT_WEBHOOK_URL;
 let sent,where;
 globalThis.fetch=async(url,options)=>{where=url;sent=JSON.parse(options.body);return Response.json({id:"12345"});};
 const message="A".repeat(3000);
 assert.equal(await notification.notifyDiscord("support",reference,{Message:message}),"12345");
 assert.equal(new URL(where).search,"?wait=true");assert.deepEqual(sent.allowed_mentions,{parse:[]});
 assert.ok(sent.embeds[0].thumbnail.url.endsWith("/server-logo.png"));
 assert.equal(sent.embeds[0].fields.map(field=>field.value).join(""),message);
 assert.ok(sent.embeds[0].fields.every(field=>field.value.length<=1024));
 globalThis.fetch=async()=>Response.json({});
 await assert.rejects(notification.notifyDiscord("event",reference,{Event:"Tournament"}));
 }finally{restoreEnv(saved);globalThis.fetch=savedFetch;}
});
