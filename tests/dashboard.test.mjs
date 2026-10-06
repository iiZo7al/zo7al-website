import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { metricNumber, validConnection, publicPanelOrigin, parseMinecraftStatus, parseModrinthProjects, parseFortniteMetrics, parseYoutubeChannel, sumMetric } from "../src/lib/data/dashboard.ts";
import { ADMIN_COOKIE, signAdminSession } from "../src/lib/server/site-security.ts";

const stub=source=>"data:text/javascript;base64,"+Buffer.from(source).toString("base64");
function moduleUrl(path,replacements={}) {
 let source=readFileSync(new URL("../"+path,import.meta.url),"utf8").replace('import "server-only";',"");
 for(const [name,value] of Object.entries(replacements).sort(([a],[b])=>b.length-a.length))source=source.replaceAll(name,value);
 return stub(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const data=moduleUrl("src/lib/data/dashboard.ts"),pelicanData=moduleUrl("src/lib/data/pelican.ts",{"./dashboard":data}),security=moduleUrl("src/lib/server/site-security.ts"),managementData=moduleUrl("src/lib/data/pelican-management.ts");
const {cleanConsoleLine,parsePelicanServer,parsePelicanStats,publicIPv4,validConsoleCommand}=await import(pelicanData);
const state={queries:[],calls:[],rows:[],limits:true,addresses:[{address:"8.8.8.8",family:4}],statusCode:200,responseBody:'{"ok":true}',upstreamError:0};globalThis.__dashboardTest=state;
const db=stub('export async function siteDatabase(){return {query:async(sql,args=[])=>{const s=globalThis.__dashboardTest;s.queries.push({sql,args});return {rows:s.rows};}};}');
const connectionModule=moduleUrl("src/lib/server/dashboard-connections.ts",{"./site-db":db,"../data/dashboard":data});
const connections=await import(connectionModule);
const server=stub('export class PelicanError extends Error{constructor(status){super("PELICAN_UNAVAILABLE");this.status=status;}}export async function pelicanOperation(connection,operation){const s=globalThis.__dashboardTest;s.calls.push({operation,server:connection.account});if(s.upstreamError)throw new PelicanError(s.upstreamError);return {data:[]};}export async function pelicanServer(){globalThis.__dashboardTest.calls.push("verify");return {name:"Test server"};}export async function pelicanWebsocket(){globalThis.__dashboardTest.calls.push("websocket");return {socket:"wss://node.example.com/api/servers/12345678-1234-1234-1234-123456789abc/ws",token:"short.lived.token"};}export async function pelicanRequest(c,suffix,body){globalThis.__dashboardTest.calls.push({suffix,body});}');
const dns=stub('export async function lookup(){return globalThis.__dashboardTest.addresses;}');
const https=stub(`import {EventEmitter} from "node:events";export function request(url,options,callback){
 const s=globalThis.__dashboardTest,req=new EventEmitter();s.calls.push({url:String(url),options});
 req.end=payload=>{s.payload=payload;queueMicrotask(()=>{options.lookup(url.hostname,{},(error,address,family)=>{s.pinned={address,family};});const response=new EventEmitter();response.statusCode=s.statusCode;response.resume=()=>queueMicrotask(()=>req.emit("close"));callback(response);if(s.statusCode>=200&&s.statusCode<300){response.emit("data",Buffer.from(s.responseBody));response.emit("end");req.emit("close");}});};
 req.destroy=error=>{req.emit("error",error);req.emit("close");};return req;
}`);
const actualPelican=await import(moduleUrl("src/lib/server/pelican.ts",{"node:dns/promises":dns,"node:https":https,"../data/dashboard":data,"../data/pelican":pelicanData,"../data/pelican-management":managementData}));
const limits=stub('export async function limitAttempt(){return globalThis.__dashboardTest.limits;}');
const pelican=await import(moduleUrl("src/app/api/admin/pelican/route.ts",{"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/pelican":pelicanData,"@/lib/data/dashboard":data,"@/lib/server/site-content":limits}));
const connectionRoute=await import(moduleUrl("src/app/api/admin/connections/route.ts",{"@/lib/data/pelican-management":managementData,"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/dashboard":data,"@/lib/server/site-content":limits,"@/lib/server/dashboard-platforms":stub('export function clearPlatformCache(){} export async function fetchPlatform(){if(globalThis.__dashboardTest.upstreamError)throw Error("UPSTREAM");return {status:"connected"};}')}));
const management=await import(managementData);
const manageRoute=await import(moduleUrl("src/app/api/admin/pelican/manage/route.ts",{"@/lib/server/site-security":security,"@/lib/server/dashboard-connections":connectionModule,"@/lib/server/pelican":server,"@/lib/data/pelican-management":managementData,"@/lib/data/dashboard":data,"@/lib/server/site-content":limits}));
const saved=Object.fromEntries(["ZO7AL_ADMIN_PASSWORD_HASH","ZO7AL_ADMIN_SESSION_SECRET","PELICAN_CLIENT_API_KEY","PELICAN_PANEL_URL","PELICAN_SERVER_ID","YOUTUBE_API_KEY","CURSEFORGE_API_KEY"].map(key=>[key,process.env[key]]));
const secret="s".repeat(43),hash="scrypt:"+"a".repeat(32)+":"+"b".repeat(128);
const credential={provider:"pelican",apiKey:"example-private-client-key",account:"12345678-1234-1234-1234-123456789abc",panelUrl:"https://panel.example.com"};
const reset=()=>{state.queries=[];state.calls=[];state.rows=[];state.limits=true;state.upstreamError=0;state.responseBody='{"ok":true}';};
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
 state.statusCode=200;await assert.rejects(actualPelican.pelicanRequest(credential,"/files/../../account"));assert.equal(state.calls.length,1);
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
 const result=await connectionRoute.POST(request(credential));assert.equal(result.status,200);assert.ok(state.calls.some(call=>call.operation?.client===true&&call.operation.endpoint===""));
 const insert=state.queries.find(q=>q.sql.startsWith("INSERT"));assert.ok(insert);assert.equal(insert.args[1].includes(credential.apiKey),false);assert.deepEqual(connections.openConnection(insert.args[1],"pelican",secret),credential);
 assert.equal(JSON.stringify(await result.json()).includes(credential.apiKey),false);
 reset();assert.equal((await connectionRoute.POST(request({...credential,panelUrl:"https://127.0.0.1"}))).status,400);assert.equal(state.calls.length,0);
});
test("CurseForge only saves a key after provider verification and never returns its credentials",async()=>{
 const input={provider:"curseforge",apiKey:"test-not-a-real-curseforge-key",account:"iiZo7al"};
 reset();state.upstreamError=403;assert.equal((await connectionRoute.POST(request(input))).status,400);assert.equal(state.queries.length,0);
 reset();const response=await connectionRoute.POST(request(input));assert.equal(response.status,200);
 const insert=state.queries.find(q=>q.sql.startsWith("INSERT"));assert.ok(insert);assert.deepEqual(connections.openConnection(insert.args[1],"curseforge",secret),input);
 assert.equal(insert.args[1].includes(input.apiKey),false);assert.equal(JSON.stringify(await response.json()).includes(input.apiKey),false);
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


test("file paths block direct, encoded and double-encoded escapes while keeping Unicode names",()=>{
 for(const path of ["../secret","/plugins/../../secret","/a/./b","/a\\b","/%2e%2e/secret","/%252e%252e/secret","/a/%2f../secret","/a%00b"]){assert.throws(()=>management.filePath(path),path);}
 assert.equal(management.filePath("/plugins/إعدادات السيرفر.yml"),"/plugins/إعدادات السيرفر.yml");
 assert.equal(management.fileName("config 2026.yml"),"config 2026.yml");
 for(const name of ["..","/absolute","../secret","%2e%2e"]){assert.throws(()=>management.fileName(name));}
});
test("Pelican file writes use a plain text body and preserve Unicode and CRLF",async()=>{
 reset();state.addresses=[{address:"8.8.8.8",family:4}];state.statusCode=204;state.responseBody="";
 const content="message: زحل\r\n";const operation=management.pelicanWrite("fileSave",{file:"/plugins/my config.yml",content});
 assert.equal(operation.body,content);assert.equal(operation.response,"text");
 assert.equal(await actualPelican.pelicanOperation(credential,operation),"");
 assert.equal(state.payload,content);assert.equal(state.calls[0].options.headers["Content-Type"],"text/plain; charset=utf-8");
 assert.equal(new URL(state.calls[0].url).searchParams.get("file"),"/plugins/my config.yml");
 state.statusCode=200;state.responseBody="hello\r\nزحل";
 assert.equal(await actualPelican.pelicanOperation(credential,management.pelicanRead("fileContents",{file:"/config.yml"})),state.responseBody);
 assert.equal(management.pelicanWrite("fileSave",{file:"/config.yml",content:"a".repeat(1000001)}),null);
 assert.equal(management.pelicanWrite("fileSave",{file:"/config.yml",content:"ز".repeat(500001)}),null);
 assert.equal(management.pelicanWrite("fileSave",{file:"/config.yml",content:"binary\0"}),null);
});
test("server and account operations use their official HTTP methods and bounded paths",()=>{
 const guid=credential.account;
 const cases=[
 ["fileRename",{root:"/",from:"/old.yml",to:"/new.yml"},"PUT","/files/rename"],
 ["backupRename",{id:guid,name:"Daily"},"PUT","/backups/"+guid+"/rename"],
 ["backupRestore",{id:guid,truncate:true,confirm:true},"POST","/backups/"+guid+"/restore"],
 ["databaseCreate",{database:"minecraft",remote:"%"},"POST","/databases"],
 ["databaseRotate",{id:1,confirm:true},"POST","/databases/1/rotate-password"],
 ["scheduleCreate",{name:"Hourly",minute:"0",hour:"*",day_of_month:"*",month:"*",day_of_week:"*"},"POST","/schedules"],
 ["taskUpdate",{scheduleId:1,id:2,taskAction:"power",payload:"restart",time_offset:5,sequence_id:1},"POST","/schedules/1/tasks/2"],
 ["userUpdate",{id:guid,permissions:["file.read"],confirm:true},"POST","/users/"+guid],
 ["networkPrimary",{id:3,confirm:true},"POST","/network/allocations/3/primary"],
 ["startupUpdate",{key:"SERVER_JARFILE",value:"server.jar"},"PUT","/startup/variable"],
 ["dockerImage",{docker_image:"ghcr.io/example/java:25"},"PUT","/settings/docker-image"],
 ["accountUsername",{username:"owner",confirm:true},"PUT","/account/username"],
 ["apiKeyCreate",{description:"Website",allowed_ips:"8.8.8.8\n2001:db8::/32",confirm:true},"POST","/account/api-keys"],
 ["sshKeyDelete",{fingerprint:"SHA256:a+b/c=",confirm:true},"DELETE","/account/ssh-keys/SHA256%3Aa%2Bb%2Fc%3D"],
 ];
 for(const [action,input,method,endpoint]of cases){const value=management.pelicanWrite(action,input);assert.ok(value,action);assert.equal(value.method,method);assert.equal(value.endpoint,endpoint);assert.equal(management.allowedPelicanEndpoint(endpoint,method,value.client),true);}
 for(const endpoint of ["/application/servers","/files/../account","//other.test","/account/password?override=1"]){assert.equal(management.allowedPelicanEndpoint(endpoint,"POST"),false);}
 assert.equal(management.pelicanWrite("unknown",{}),null);
 assert.equal(management.pelicanRead("unknown"),null);
 assert.equal(management.pelicanWrite("taskCreate",{scheduleId:1,taskAction:"command",payload:"list\nstop",time_offset:0}),null);
 assert.equal(management.pelicanWrite("taskCreate",{scheduleId:1,taskAction:"backup",time_offset:901}),null);
 assert.equal(management.pelicanWrite("userUpdate",{id:guid,permissions:["*"],confirm:true}),null);
 assert.equal(management.pelicanWrite("filePull",{url:"http://example.com/a.jar"}),null);
});
test("destructive operations require explicit confirmation before dispatch",()=>{
 for(const [action,input]of [["backupRestore",{id:credential.account}],["backupDelete",{id:credential.account}],["databaseDelete",{id:1}],["databaseRotate",{id:1}],["fileDelete",{files:["world"]}],["serverReinstall",{}],["userDelete",{id:credential.account}],["networkPrimary",{id:1}],["apiKeyDelete",{identifier:"abcdefghijklmnop"}],["accountPassword",{password:"a".repeat(16),password_confirmation:"a".repeat(16)}]]){
  assert.equal(management.pelicanWrite(action,input),null,action);
  assert.ok(management.pelicanWrite(action,{...input,confirm:true}),action);
 }
 assert.equal(management.pelicanWrite("accountPassword",{password:"a".repeat(16),password_confirmation:"b".repeat(16),confirm:true}),null);
});
test("management reads and writes enforce authentication and origin before database access",async()=>{
 reset();assert.equal((await manageRoute.GET(new Request("https://zo7al.test/api/admin/pelican/manage?resource=files"))).status,401);
 assert.equal((await manageRoute.POST(request({action:"fileDelete",input:{files:["world"],confirm:true}},false))).status,401);
 assert.equal((await manageRoute.POST(request({action:"fileDelete",input:{files:["world"],confirm:true}},true,"https://other.test"))).status,403);
 assert.equal(state.calls.length,0);assert.equal(state.queries.length,0);
});
test("server selection is validated and every mutation uses the selected server",async()=>{
 reset();state.rows=[{provider:"pelican",sealed:connections.sealConnection(credential,secret)}];
 const selected="87654321-4321-4321-4321-123456789abc";
 const response=await manageRoute.POST(request({action:"fileFolder",server:selected,input:{root:"/plugins",name:"Zo7al"}}));
 assert.equal(response.status,200);assert.equal(state.calls[0].server,selected);assert.deepEqual(state.calls[0].operation.body,{root:"/plugins",name:"Zo7al"});
 reset();const bad=await manageRoute.POST(request({action:"fileFolder",server:"../../account",input:{name:"folder"}}));assert.equal(bad.status,400);assert.equal(state.queries.length,0);assert.equal(state.calls.length,0);
 state.limits=false;assert.equal((await manageRoute.POST(request({action:"fileFolder",input:{name:"folder"}}))).status,429);assert.equal(state.calls.length,0);
 reset();assert.equal((await manageRoute.POST(request({action:"fileFolder",input:{name:"folder"}}))).status,409);
});
test("upstream permission and validation failures stay actionable without revealing secrets",async()=>{
 for(const [status,code]of [[403,"PELICAN_PERMISSION"],[422,"PELICAN_VALIDATION"],[404,"PELICAN_NOT_FOUND"],[429,"RATE_LIMIT"]]){
  reset();state.rows=[{provider:"pelican",sealed:connections.sealConnection(credential,secret)}];state.upstreamError=status;
  const response=await manageRoute.POST(request({action:"fileFolder",input:{name:"folder"}}));assert.equal((await response.json()).error,code);assert.equal(response.headers.get("cache-control"),"no-store");
 }
 reset();
});
test("signed upload/download URLs are HTTPS and public, and malformed lists never become empty data",async()=>{
 reset();state.addresses=[{address:"8.8.8.8",family:4}];state.statusCode=200;
 state.responseBody=JSON.stringify({attributes:{url:"https://node.example.com/upload/file?token=short.lived"}});
 assert.deepEqual(await actualPelican.pelicanOperation(credential,management.pelicanWrite("fileUpload",{})),{url:"https://node.example.com/upload/file?token=short.lived"});
 for(const url of ["http://node.example.com/upload/file?token=test","https://node.example.com/not-upload?token=test","https://127.0.0.1/upload/file?token=test"]){state.responseBody=JSON.stringify({attributes:{url}});await assert.rejects(actualPelican.pelicanOperation(credential,management.pelicanWrite("fileUpload",{})));}
 state.responseBody=JSON.stringify({attributes:{url:"https://node.example.com/upload/file?token=test"}});state.addresses=[{address:"10.0.0.1",family:4}];await assert.rejects(actualPelican.pelicanOperation(credential,management.pelicanWrite("fileUpload",{})));
 state.addresses=[{address:"8.8.8.8",family:4}];state.responseBody="{}";await assert.rejects(actualPelican.pelicanOperation(credential,management.pelicanRead("files")));
});
test("force-stop requests remain protected and require explicit confirmation",async()=>{
 reset();state.rows=[{provider:"pelican",sealed:connections.sealConnection(credential,secret)}];
 assert.equal((await pelican.POST(request({action:"power",signal:"kill"}))).status,400);
 assert.equal((await pelican.POST(request({action:"power",signal:"kill",confirm:true}))).status,200);assert.deepEqual(state.calls[0],{suffix:"/power",body:{signal:"kill"}});
});
test("all Pelican locales have complete messages and matching interpolation parameters",()=>{
 const base=JSON.parse(readFileSync(new URL("../messages/en.json",import.meta.url))).pelican;
 const placeholders=value=>[...value.matchAll(/\{([\w]+)(?:[,}])/g)].map(match=>match[1]).sort();
 for(const locale of ["en","ar","es","fr","de","pt","tr","ja","ko","zh"]){const value=JSON.parse(readFileSync(new URL("../messages/"+locale+".json",import.meta.url))).pelican;assert.deepEqual(Object.keys(value).sort(),Object.keys(base).sort());for(const [key,text]of Object.entries(value)){assert.ok(text.trim());assert.deepEqual(placeholders(text),placeholders(base[key]),locale+":"+key);}}
});
