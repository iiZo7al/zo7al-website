import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/server/member-modrinth.ts',import.meta.url),'utf8').replace("import 'server-only';",'');
const moduleURL='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {modrinthToken,modrinthUserinfo}=await import(moduleURL);
const keys=['MODRINTH_MEMBER_CLIENT_ID','MODRINTH_MEMBER_CLIENT_SECRET','SUPABASE_URL'];
const env=Object.fromEntries(keys.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch;
Object.assign(process.env,{MODRINTH_MEMBER_CLIENT_ID:'MemberApp123',MODRINTH_MEMBER_CLIENT_SECRET:'member-secret-for-test-only',SUPABASE_URL:'https://auth.zo7al.test'});
let calls=[];
globalThis.fetch=async(url,options)=>{calls.push({url,options});return url.endsWith('/token')?Response.json({access_token:'verified-modrinth-token',expires_in:3600}):Response.json({id:'VerifiedID',username:'VerifiedPlayer',email:'verified@example.com',avatar_url:'https://cdn.modrinth.com/avatar.png',email_verified:false});};
const basic='Basic '+Buffer.from('MemberApp123:member-secret-for-test-only').toString('base64');
const request=(override={},authorization=basic)=>new Request('https://zo7al.test/api/account/modrinth/token',{method:'POST',headers:{authorization,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:'MemberApp123',grant_type:'authorization_code',code:'one-use-provider-code',redirect_uri:'https://auth.zo7al.test/auth/v1/callback',...override})});
test.after(()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(env))if(v===undefined)delete process.env[k];else process.env[k]=v;});
test('Modrinth adapter rejects incorrect credentials, redirects and grant types before forwarding',async()=>{
 calls=[];
 for(const req of [request({},'Basic '+Buffer.from('MemberApp123:wrong').toString('base64')),request({redirect_uri:'https://evil.test/callback'}),request({grant_type:'refresh_token'}),request({code:''})])assert.ok((await modrinthToken(req)).status>=400);
 assert.equal(calls.length,0);
});
test('native OAuth token exchange translates authorization without exposing app secrets',async()=>{
 const response=await modrinthToken(request()),data=await response.json();assert.equal(response.status,200);assert.equal(data.token_type,'Bearer');assert.equal(data.access_token,'verified-modrinth-token');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.ok(!JSON.stringify(data).includes(process.env.MODRINTH_MEMBER_CLIENT_SECRET));
 const call=calls.at(-1);assert.equal(call.url,'https://api.modrinth.com/_internal/oauth/token');assert.equal(call.options.headers.Authorization,process.env.MODRINTH_MEMBER_CLIENT_SECRET);assert.equal(call.options.body.get('redirect_uri'),'https://auth.zo7al.test/auth/v1/callback');assert.equal(call.options.redirect,'error');
});
test('userinfo trusts only the upstream token and never invents verified email or administrator roles',async()=>{
 const response=await modrinthUserinfo(new Request('https://zo7al.test/userinfo',{headers:{authorization:'Bearer member-access'}})),data=await response.json();assert.equal(response.status,200);assert.equal(data.sub,'VerifiedID');assert.equal(data.email_verified,false);assert.ok(!('role' in data));assert.equal(calls.at(-1).options.headers.Authorization,'member-access');
 const before=calls.length;assert.equal((await modrinthUserinfo(new Request('https://zo7al.test/userinfo'))).status,401);assert.equal(calls.length,before);
});
