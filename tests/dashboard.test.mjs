import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { metricNumber, validConnection, publicPanelOrigin, parseMinecraftStatus, parseModrinthProjects, parseFortniteMetrics, parseYoutubeChannel, sumMetric } from "../src/lib/data/dashboard.ts";
import { ADMIN_COOKIE, signAdminSession } from "../src/lib/server/site-security.ts";

const stub=source=>"data:text/javascript;base64,"+Buffer.from(source).toString("base64");
function moduleUrl(path,replacements={}) {
 let source=readFileSync(new URL("../"+path,import.meta.url),"utf8").replace('import "server-only";',"");
 for(const [name,value] of Object.entries(replacements))source=source.replaceAll(name,value);
 return stub(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const data=moduleUrl("src/lib/data/dashboard.ts"),pelicanData=moduleUrl("src/lib/data/pelican.ts",{"./dashboard":data}),security=moduleUrl("src/lib/server/site-security.ts");
const {cleanConsoleLine,parsePelicanServer,parsePelicanStats,publicIPv4,validConsoleCommand}=await import(pelicanData);
const state={queries:[],calls:[],rows:[],limits:true,addresses:[{address:"8.8.8.8",family:4}],statusCode:200};globalThis.__dashboardTest=state;
const db=stub('export async function siteDatabase(){return {query:async(sql,args=[])=>{const s=globalThis.__dashboardTest;s.queries.push({sql,args});return {rows:s.rows};}};}');
const connectionModule=moduleUrl("src/lib/server/dashboard-connections.ts",{"./site-db":db,"../data/dashboard":data});
const connections=await import(connectionModule);
const server=stub('export async function pelicanServer(){globalThis.__dashboardTest.calls.push("verify");return {name:"Test server"};}export async function pelicanWebsocket(){globalThis.__dashboardTest.calls.push("websocket");return {socket:"wss://node.example.com/api/servers/12345678-1234-1234-1234-123456789abc/ws",token:"short.lived.token"};}export async function pelicanRequest(c,suffix,body){globalThis.__dashboardTest.calls.push({suffix,body});}');
const dns=stub('export async function lookup(){return globalThis.__dashboardTest.addresses;}');
const https=stub(`import {EventEmitter} from "node:events";export function request(url,options,callback){
 const s=globalThis.__dashboardTest,req=new EventEmitter();s.calls.push({url:String(url),options});
 req.end=()=>queueMicrotask(()=>{options.lookup(url.hostname,{},(error,address,family)=>{s.pinned={address,family};});const response=new EventEmitter();response.statusCode=s.statusCode;response.resume=()=>queueMicrotask(()=>req.emit("close"));callback(response);if(s.statusCode>=200&&s.statusCode<300){response.emit("data",Buffer.from('{"ok":true}'));response.emit("end");req.emit("close");}});
 req.destroy=error=>{req.emit("error",error);req.emit("close");};return req;
}`);
const actualPelican=await import(moduleUrl("src/lib/server/pelican.ts",{"node:dns/promises":dns,"node:https":https,"../data/dashboard":data,"../data/pelican":pelicanData}));
const limits=stub('export async function limitAttempt(){return globalThis.__dashboardTest.limits;}');
const pelican=await import(moduleUrl("src/app/api/admin/pelican/route.ts",{"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/pelican":pelicanData,"@/lib/server/site-content":limits}));
const connectionRoute=await import(moduleUrl("src/app/api/admin/connections/route.ts",{"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/dashboard":data,"@/lib/server/site-content":limits,"@/lib/server/dashboard-platforms":stub('export function clearPlatformCache(){} export async function fetchPlatform(){return {status:"connected"};}')}));
const saved=Object.fromEntries(["ZO7AL_ADMIN_PASSWORD_HASH","ZO7AL_ADMIN_SESSION_SECRET","PELICAN_CLIENT_API_KEY","PELICAN_PANEL_URL","PELICAN_SERVER_ID","YOUTUBE_API_KEY","CURSEFORGE_API_KEY"].map(key=>[key,process.env[key]]));
const secret="s".repeat(43),hash="scrypt:"+"a".repeat(32)+":"+"b".repeat(128);
const credential={provider:"pelican",apiKey:"example-private-client-key",account:"12345678-1234-1234-1234-123456789abc",panelUrl:"https://panel.example.com"};
const reset=()=>{state.queries=[];state.calls=[];state.rows=[];state.limits=true;};
const request=(body,auth=true,origin="https://zo7al.test")=>new Request("https://zo7al.test/api/admin/pelican",{method:"POST",headers:{"Content-Type":"application/json",origin,...(auth?{cookie:ADMIN_COOKIE+"="+signAdminSession(secret,hash)}:{})},body:JSON.stringify(body)});
test.after(()=>{for(const [key,value] of Object.entries(saved))if(value===undefined)delete process.env[key];else process.env[key]=value;});

test("missing statistics stay unknown, and live zeroes remain zero",()=>{
 for(const v of [null,undefined,"",-1,"invalid",Infinity,NaN])assert.equal(metricNumber(v),null);
 assert.equal(metricNumber("0"),0);assert.equal(metricNumber(0),0);
 assert.deepEqual(parseMinecraftStatus({online:true,players:{online:0,max:1000}}).metrics,{players:0,capacity:1000});
 assert.equal(parseMinecraftStatus({online:true}).metrics.players,null);
 assert.equal(parseMinecraftStatus({online:false}).metrics.players,0);
 assert.throws(()=>parseMinecraftStatus({online:"true"}));
 const rows=parseModrinthProjects([{id:"abcd1234",slug:"project",title:"Project",downloads:12,followers:null}]);
 assert.equal(sumMetric(rows,"downloads"),12);assert.equal(sumMetric(rows,"followers"),null);
 assert.throws(()=>parseModrinthProjects([{invalid:true}]));
 const date="2026-10-01T00:00:00Z";
 assert.deepEqual(parseFortniteMetrics({plays:[{value:0,timestamp:date}],minutesPlayed:[{value:null,timestamp:date}],peakCCU:[{value:8,timestamp:date}]}),{plays:0,minutesPlayed:null,peakPlayers:8});
 assert.equal(parseFortniteMetrics({plays:[{value:20,timestamp:date},{value:null,timestamp:date}]}).plays,null);
 assert.equal(parseYoutubeChannel({items:[{id:"UC"+"a".repeat(22),statistics:{viewCount:"200",hiddenSubscriberCount:true,subscriberCount:"0"}}]},"creator").metrics.subscribers,null);
});
test("panel settings reject internal URLs, credentials in URLs, and unsafe server paths",()=>{
 assert.equal(publicPanelOrigin("https://panel.example.com/"),"https://panel.example.com");
 for(const url of ["http://panel.example.com","https://127.0.0.1","https://[::1]","https://panel.local","https://user:pass@panel.example.com","https://panel.example.com/path","https://panel.example.com?key=secret","https://panel.example.com:8080"]){assert.equal(publicPanelOrigin(url),null,url);}
 assert.deepEqual(validConnection(credential),credential);
 assert.equal(validConnection({...credential,account:"../../resources"}),null);
 assert.equal(validConnection({...credential,apiKey:"secret\n"+"a".repeat(30)}),null);
 for(const address of ["127.0.0.1","10.1.2.3","172.16.0.1","172.31.255.255","192.168.0.1","169.254.169.254","100.100.100.100","0.0.0.0","198.18.0.1","198.51.100.1","203.0.113.1","224.1.2.3","999.2.3.4","::1"]){assert.equal(publicIPv4(address),false,address);}
 assert.equal(publicIPv4("8.8.8.8"),true);
});
test("connection secrets are authenticated encrypted data and are never returned in metadata",async()=>{
 process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;for(const key of ["PELICAN_CLIENT_API_KEY","YOUTUBE_API_KEY","CURSEFORGE_API_KEY"])delete process.env[key];
 const sealed=connections.sealConnection(credential,secret);
 assert.equal(sealed.includes(credential.apiKey),false);assert.equal(sealed.includes(credential.panelUrl),false);
 assert.deepEqual(connections.openConnection(sealed,"pelican",secret),credential);
 assert.throws(()=>connections.openConnection(sealed,"youtube",secret));assert.throws(()=>connections.openConnection(sealed,"pelican","x".repeat(43)));
 const pieces=sealed.split(".");pieces[2]=(pieces[2][0]==="a"?"b":"a")+pieces[2].slice(1);assert.throws(()=>connections.openConnection(pieces.join("."),"pelican",secret));
 reset();state.rows=[{provider:"pelican",sealed}];
 const metadata=await connections.connectionMetadata();assert.equal(metadata.find(x=>x.provider==="pelican").configured,true);
 for(const forbidden of ["apiKey","sealed",credential.apiKey,sealed])assert.equal(JSON.stringify(metadata).includes(forbidden),false);
});
test("console parsers preserve unknown usage and strip terminal control sequences",()=>{
 const info=parsePelicanServer({attributes:{uuid:credential.account,name:"Minecraft",limits:{cpu:200,memory:4096,disk:0}}});assert.equal(info.limits.memory,4096);
 const stats=parsePelicanStats({attributes:{current_state:"running",resources:{cpu_absolute:0,memory_bytes:512}}});assert.equal(stats.cpu,0);assert.equal(stats.disk,null);
 assert.throws(()=>parsePelicanStats({attributes:{current_state:"invalid"}}));
 assert.equal(cleanConsoleLine("\x1b[31mWARN\x1b[0m\x00"),"WARN");
 assert.equal(validConsoleCommand("say Hello everyone"),true);
 for(const cmd of ["", "  ", "say hi\nstop", "stop\x00", "a".repeat(1001)])assert.equal(validConsoleCommand(cmd),false);
});
test("Pelican rejects private DNS resolutions, pins public addresses, and never follows redirects",async()=>{
 reset();state.addresses=[{address:"169.254.169.254",family:4}];await assert.rejects(actualPelican.pelicanRequest(credential),/INVALID_HOST/);assert.equal(state.calls.length,0);
 state.addresses=[{address:"8.8.8.8",family:4},{address:"10.0.0.1",family:4}];await assert.rejects(actualPelican.pelicanRequest(credential));assert.equal(state.calls.length,0);
 state.addresses=[{address:"8.8.8.8",family:4}];state.statusCode=200;assert.deepEqual(await actualPelican.pelicanRequest(credential,"/resources"),{ok:true});assert.deepEqual(state.pinned,{address:"8.8.8.8",family:4});assert.equal(state.calls[0].url.includes(credential.apiKey),false);
 assert.equal(state.calls[0].options.headers.Authorization,"Bearer "+credential.apiKey);
 reset();state.statusCode=302;await assert.rejects(actualPelican.pelicanRequest(credential),/PELICAN_UNAVAILABLE/);assert.equal(state.calls.length,1);
 state.statusCode=200;await assert.rejects(actualPelican.pelicanRequest(credential,"/files/contents"));assert.equal(state.calls.length,1);
});
test("console routes authenticate and reject cross-origin writes before any upstream call",async()=>{
 process.env.ZO7AL_ADMIN_PASSWORD_HASH=hash;process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;
 reset();assert.equal((await pelican.POST(request({action:"command",command:"list"},false))).status,401);
 assert.equal((await pelican.GET(new Request("https://zo7al.test/api/admin/pelican"))).status,401);
 assert.equal((await pelican.POST(request({action:"power",signal:"stop"},true,"https://other.test"))).status,403);
 assert.equal(state.queries.length,0);assert.equal(state.calls.length,0);
});
test("console commands and tokens require configured credentials and obey rate limits",async()=>{
 reset();state.rows=[{provider:"pelican",sealed:connections.sealConnection(credential,secret)}];
 assert.equal((await pelican.POST(request({action:"power",signal:"kill"}))).status,400);
 assert.equal((await pelican.POST(request({action:"command",command:"list\nstop"}))).status,400);assert.equal(state.calls.length,0);
 state.limits=false;assert.equal((await pelican.POST(request({action:"command",command:"list"}))).status,429);assert.equal(state.calls.length,0);
 state.limits=true;const result=await pelican.POST(request({action:"command",command:"list"}));assert.equal(result.status,200);assert.equal(result.headers.get("cache-control"),"no-store");assert.deepEqual(state.calls[0],{suffix:"/command",body:{command:"list"}});
 const token=await pelican.POST(request({action:"websocket"}));assert.equal(token.status,200);assert.equal(JSON.stringify(await token.json()).includes(credential.apiKey),false);
 reset();assert.equal((await pelican.POST(request({action:"websocket"}))).status,409);assert.equal(state.calls.length,0);
});
test("saving a connection requires owner authentication and persists only encrypted credentials",async()=>{
 reset();assert.equal((await connectionRoute.POST(request(credential,false))).status,401);assert.equal((await connectionRoute.GET(new Request("https://zo7al.test/api/admin/connections"))).status,401);
 assert.equal((await connectionRoute.POST(request(credential,true,"https://other.test"))).status,403);assert.equal(state.calls.length,0);assert.equal(state.queries.length,0);
 const result=await connectionRoute.POST(request(credential));assert.equal(result.status,200);assert.ok(state.calls.includes("verify"));
 const insert=state.queries.find(q=>q.sql.startsWith("INSERT"));assert.ok(insert);assert.equal(insert.args[1].includes(credential.apiKey),false);assert.deepEqual(connections.openConnection(insert.args[1],"pelican",secret),credential);
 assert.equal(JSON.stringify(await result.json()).includes(credential.apiKey),false);
 reset();assert.equal((await connectionRoute.POST(request({...credential,panelUrl:"https://127.0.0.1"}))).status,400);assert.equal(state.calls.length,0);
});
test("all dashboard locales retain the same keys and interpolation parameters",()=>{
 const baseline=JSON.parse(readFileSync(new URL("../messages/en.json",import.meta.url))).dashboard;
 const placeholders=value=>[...value.matchAll(/\{([\w]+)(?:[,}])/g)].map(m=>m[1]).sort();
 for(const locale of ["en","ar","es","fr","de","pt","tr","ja","ko","zh"]){
  const messages=JSON.parse(readFileSync(new URL("../messages/"+locale+".json",import.meta.url)));assert.deepEqual(Object.keys(messages.dashboard).sort(),Object.keys(baseline).sort(),locale);
  for(const [key,value] of Object.entries(messages.dashboard)){assert.ok(value.trim(),locale+":"+key);assert.deepEqual(placeholders(value),placeholders(baseline[key]),locale+":"+key);}
  assert.equal(messages.hub.supportIntro.includes("Network"),false,locale);
 }
});
