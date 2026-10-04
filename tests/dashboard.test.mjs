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
const state={queries:[],calls:[],rows:[],limits:true};globalThis.__dashboardTest=state;
const db=stub('export async function siteDatabase(){return {query:async(sql,args=[])=>{const s=globalThis.__dashboardTest;s.queries.push({sql,args});return {rows:s.rows};}};}');
const connectionModule=moduleUrl("src/lib/server/dashboard-connections.ts",{"./site-db":db,"../data/dashboard":data});
const connections=await import(connectionModule);
const server=stub('export async function pelicanServer(){globalThis.__dashboardTest.calls.push("verify");return {name:"Test server"};}export async function pelicanWebsocket(){globalThis.__dashboardTest.calls.push("websocket");return {socket:"wss://node.example.com/api/servers/12345678-1234-1234-1234-123456789abc/ws",token:"short.lived.token"};}export async function pelicanRequest(c,suffix,body){globalThis.__dashboardTest.calls.push({suffix,body});}');
const limits=stub('export async function limitAttempt(){return globalThis.__dashboardTest.limits;}');
const pelican=await import(moduleUrl("src/app/api/admin/pelican/route.ts",{"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/pelican":pelicanData,"@/lib/server/site-content":limits}));
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
