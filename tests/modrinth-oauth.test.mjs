import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { ADMIN_COOKIE, signAdminSession } from '../src/lib/server/site-security.ts';
const stub = s => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
function moduleUrl(path, replacements = {}) {
 let s = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
 for (const [name, value] of Object.entries(replacements).sort(([a],[b])=>b.length-a.length)) s = s.replaceAll(name, value);
 return stub(ts.transpileModule(s, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const state={app:null,auth:null,pending:new Map(),queries:[],limits:true,cacheCleared:[]};
const db={async query(sql,args=[]){
 state.queries.push({sql,args});
 if(sql.startsWith('SELECT sealed FROM modrinth_oauth_app'))return {rows:state.app?[{sealed:state.app}]:[]};
 if(sql.startsWith('SELECT sealed FROM modrinth_oauth_auth'))return {rows:state.auth?[{sealed:state.auth}]:[]};
 if(sql.startsWith('SELECT user_id'))return {rows:state.auth?[{id:'abc12345',username:'Zo7al',expiresAt:new Date(state.expiresAt)}]:[]};
 if(sql.startsWith('INSERT INTO modrinth_oauth_app'))state.app=args[0];
 if(sql.startsWith('INSERT INTO modrinth_oauth_auth')){state.auth=args[0];state.expiresAt=Date.parse(args[3]);}
 if(sql.startsWith('INSERT INTO modrinth_oauth_pending'))state.pending.set(args[0],{sealed:args[2],browser:args[1],claimed:false});
 if(sql.startsWith('UPDATE modrinth_oauth_pending')){const row=state.pending.get(args[0]);if(!row||row.browser!==args[1]||row.claimed)return {rows:[],rowCount:0};row.claimed=true;return {rows:[row],rowCount:1};}
 if(sql==='DELETE FROM modrinth_oauth_auth')state.auth=null;
 if(sql==='DELETE FROM modrinth_oauth_pending')state.pending.clear();
 if(sql.startsWith('DELETE FROM modrinth_oauth_pending WHERE state_hash')){const row=state.pending.get(args[0]);state.pending.delete(args[0]);return {rows:row?[row]:[],rowCount:row?1:0};}
 return {rows:[],rowCount:1};
},async connect(){return {query:db.query,release(){}};}};
globalThis.__modrinthTests={state,db};
const dbUrl=stub('export async function siteDatabase(){return globalThis.__modrinthTests.db;}');
const security=moduleUrl('src/lib/server/site-security.ts'), data=moduleUrl('src/lib/data/youtube-studio.ts');
const youtubeUrl=moduleUrl('src/lib/server/youtube-auth.ts',{'./site-db':dbUrl,'./site-security':security,'../data/youtube-studio':data});
const vault=await import(youtubeUrl);
const authUrl=moduleUrl('src/lib/server/modrinth-auth.ts',{'./site-db':dbUrl,'./site-security':security,'./youtube-auth':youtubeUrl});
const auth=await import(authUrl);
const replacements={'@/lib/server/modrinth-auth':authUrl,'@/lib/server/site-security':security,'@/lib/server/site-content':stub('export async function limitAttempt(){return globalThis.__modrinthTests.state.limits;}'),'@/lib/server/dashboard-platforms':stub('export function clearPlatformCache(id){globalThis.__modrinthTests.state.cacheCleared.push(id);}')};
const route=await import(moduleUrl('src/app/api/admin/modrinth/route.ts',replacements));
const callback=await import(moduleUrl('src/app/api/admin/modrinth/oauth/callback/route.ts',replacements));
const app={clientId:'abc12345',clientSecret:'test-not-a-real-client-secret'};
const secret='s'.repeat(43),hash='scrypt:'+'a'.repeat(32)+':'+'b'.repeat(128);
const envKeys=['ZO7AL_ADMIN_SESSION_SECRET','ZO7AL_ADMIN_PASSWORD_HASH','MODRINTH_OAUTH_CLIENT_ID','MODRINTH_OAUTH_CLIENT_SECRET'];
const saved=Object.fromEntries(envKeys.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch;
process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;process.env.ZO7AL_ADMIN_PASSWORD_HASH=hash;delete process.env.MODRINTH_OAUTH_CLIENT_ID;delete process.env.MODRINTH_OAUTH_CLIENT_SECRET;
test.after(()=>{globalThis.fetch=originalFetch;for(const [k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;delete globalThis.__modrinthTests;});
function reset(){state.app=vault.sealYoutube(app,'modrinth-app');state.auth=null;state.pending.clear();state.queries=[];state.limits=true;state.cacheCleared=[];globalThis.fetch=originalFetch;}
const headers=()=>({origin:'https://zo7al.test',cookie:ADMIN_COOKIE+'='+signAdminSession(secret,hash),'Content-Type':'application/json'});
const post=(body,extra={})=>new Request('https://zo7al.test/api/admin/modrinth',{method:'POST',headers:{...headers(),...extra},body:JSON.stringify(body)});
async function start(){const started=await auth.startModrinthOAuth(new Request('https://zo7al.test/api/admin/modrinth'));const url=new URL(started.url);return {started,url,request:new Request('https://zo7al.test/api/admin/modrinth/oauth/callback?state='+url.searchParams.get('state')+'&code=test-code',{headers:{cookie:started.cookie.split(';')[0]}})};}
function mockProvider(calls=[]){globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return String(url).endsWith('/token')?Response.json({access_token:'test-access-token',token_type:'Bearer',expires_in:3600}):Response.json({id:'abc12345',username:'Zo7al',email:'private@example.test'});};}
test('Modrinth OAuth requires admin, origin and a persisted rate limit before provider requests',async()=>{
 reset();const calls=[];mockProvider(calls);
 assert.equal((await route.GET(new Request('https://zo7al.test/api/admin/modrinth'))).status,401);
 assert.equal((await route.POST(post({action:'connect'},{cookie:''}))).status,401);
 assert.equal((await route.POST(post({action:'connect'},{origin:'https://other.test'}))).status,403);
 state.limits=false;assert.equal((await route.POST(post({action:'connect'}))).status,429);assert.equal(calls.length,0);
 state.limits=true;assert.equal((await route.POST(post({action:'disconnect'}))).status,400);
});
test('Modrinth consent requests only profile and project reads with a private browser-bound state',async()=>{
 reset();const {started,url}=await start();
 assert.equal(url.origin+url.pathname,'https://modrinth.com/auth/authorize');assert.equal(url.searchParams.get('scope'),'USER_READ PROJECT_READ');assert.equal(url.searchParams.get('redirect_uri'),'https://zo7al.test/api/admin/modrinth/oauth/callback');assert.match(started.cookie,/HttpOnly; SameSite=Lax/);assert.doesNotMatch(started.url,/clientSecret|test-not-a-real/);
 const status=await auth.modrinthStatus(new Request('https://zo7al.test/api/admin/modrinth'));assert.equal(status.clientConfigured,true);assert.doesNotMatch(JSON.stringify(status),/sealed|clientSecret|accessToken|email/);
});
test('Modrinth code exchange stores encrypted identity and cannot replay or use another browser',async()=>{
 reset();const {request}=await start(),calls=[];mockProvider(calls);
 const wrong=new Request(request.url,{headers:{cookie:'zo7al-modrinth-oauth='+'x'.repeat(43)}});await assert.rejects(auth.finishModrinthOAuth(wrong),/INVALID/);assert.equal(calls.length,0);
 assert.equal(await auth.finishModrinthOAuth(request),'connected');assert.equal(calls[0].options.headers.Authorization,app.clientSecret);assert.equal(calls[0].options.body.get('grant_type'),'authorization_code');assert.equal(calls[1].options.headers.Authorization,'test-access-token');
 const stored=await auth.modrinthAuth();assert.equal(stored.username,'Zo7al');assert.doesNotMatch(state.auth,/test-access-token|Zo7al|private@example/);assert.throws(()=>vault.openYoutube(state.auth,'auth'));
 await assert.rejects(auth.finishModrinthOAuth(request),/INVALID/);assert.equal(calls.length,2);
});
test('disconnecting or replacing the app cancels an in-flight Modrinth callback',async()=>{
 reset();const {request}=await start();globalThis.fetch=async raw=>{if(String(raw).endsWith('/token')){state.pending.clear();return Response.json({access_token:'test-token',token_type:'Bearer',expires_in:3600});}return Response.json({id:'abc12345',username:'Zo7al'});};
 await assert.rejects(auth.finishModrinthOAuth(request),/MR_RECONNECT/);assert.equal(state.auth,null);
 await auth.saveModrinthApp(app);assert.equal(state.pending.size,0);assert.equal(state.auth,null);
});
test('callback results contain no provider codes, tokens or private profile data',async()=>{
 reset();const {request}=await start();mockProvider();const response=await callback.GET(request);assert.equal(response.status,303);const location=response.headers.get('location');assert.equal(new URL(location).searchParams.get('view'),'modrinth');assert.equal(new URL(location).searchParams.get('oauth'),'connected');assert.doesNotMatch(location,/test-code|test-access|email/);assert.match(response.headers.get('set-cookie'),/Max-Age=0/);assert.deepEqual(state.cacheCleared,['modrinth']);
});
test('cancellation preserves the existing identity, while expired tokens require renewed consent',async()=>{
 reset();state.expiresAt=Date.now()+3600000;state.auth=vault.sealYoutube({accessToken:'previous-token',expiresAt:state.expiresAt,userId:'abc12345',username:'Zo7al'},'modrinth-auth');const existing=state.auth;
 const {request}=await start(),url=new URL(request.url);url.searchParams.set('error','access_denied');assert.equal(await auth.finishModrinthOAuth(new Request(url,{headers:request.headers})),'cancelled');assert.equal(state.auth,existing);
 state.expiresAt=Date.now()-1000;state.auth=vault.sealYoutube({accessToken:'expired-token',expiresAt:state.expiresAt,userId:'abc12345',username:'Zo7al'},'modrinth-auth');await assert.rejects(auth.modrinthAuth(),/MR_RECONNECT/);assert.equal((await auth.modrinthStatus(new Request('https://zo7al.test'))).reconnectRequired,true);
 await assert.rejects(auth.modrinthJSON('/v2/user/../../private','token'),/INVALID/);
});
test('OAuth UI catalogs have complete keys and consistent interpolation in all ten languages',()=>{
 const en=JSON.parse(readFileSync(new URL('../messages/en.json',import.meta.url))).oauth;
 for(const locale of ['ar','de','es','fr','pt','tr','ja','ko','zh']){const all=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));assert.deepEqual(Object.keys(all.oauth).sort(),Object.keys(en).sort());assert.ok(all.creators.notificationPending);for(const key of ['allPlatforms','allStatuses','platform'])assert.ok(all.hub[key]);}
});
