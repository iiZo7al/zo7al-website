import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {SITE_SCHEMA} from '../src/lib/server/site-schema.ts';
import {ACCOUNT_SCHEMA} from '../src/lib/server/account-schema.ts';
const stub=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function moduleURL(path,replacements={}){let source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll("import 'server-only';",'');for(const [a,b] of Object.entries(replacements))source=source.replaceAll(a,b);return stub(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
const engine=new PGlite();await engine.exec(SITE_SCHEMA+ACCOUNT_SCHEMA);
const pool={query:async(sql,args=[])=>{const r=await engine.query(sql,args);return {...r,rowCount:r.affectedRows??r.rows.length};}};
globalThis.__mfaTests={pool,allowed:true};
const db=stub('export async function siteDatabase(){return globalThis.__mfaTests.pool;}'),security=moduleURL('src/lib/server/site-security.ts'),data=moduleURL('src/lib/data/account.ts');
const authURL=moduleURL('src/lib/server/account-auth.ts',{'./site-db':db,'./site-security':security,'../data/account':data}),auth=await import(authURL);
const limit=stub('export async function limitAttempt(){return globalThis.__mfaTests.allowed;}');
const replacements={'@/lib/server/account-auth':authURL,'@/lib/server/site-security':security,'@/lib/server/site-content':limit,'@/lib/server/site-db':db};
const mfa=await import(moduleURL('src/app/api/account/mfa/route.ts',replacements));
const account=await import(moduleURL('src/app/api/account/route.ts',{...replacements,'@/lib/server/site-db':db,'@/lib/data/account':data,'@/i18n/config':moduleURL('src/i18n/config.ts')}));
const receipts=await import(moduleURL('src/app/api/account/receipts/route.ts',{...replacements,'@/lib/server/site-db':db}));
const envKeys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','DATABASE_URL','ZO7AL_SITE_URL','ZO7AL_ACCOUNT_MFA_ENABLED'];
const savedEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
Object.assign(process.env,{SUPABASE_URL:'https://auth.zo7al.test',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',DATABASE_URL:'test',ZO7AL_ACCOUNT_MFA_ENABLED:'true'});delete process.env.ZO7AL_SITE_URL;
const originalFetch=globalThis.fetch,userId='a1234567-1234-1234-1234-123456789abc';
let user,factors,tokens,refreshes,calls,used,backupHashes,backupFactor,sequence;
const hash=s=>createHash('sha256').update(s.replace(/[\s-]/g,'').toLowerCase()).digest('hex');
function mint(aal='aal1') {const access='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:userId,aal,nonce:++sequence})).toString('base64url')+'.trusted',refresh='refresh-'+sequence;tokens.set(access,{aal});refreshes.set(refresh,access);return {access_token:access,refresh_token:refresh,expires_in:3600};}
function reset() {factors=[];tokens=new Map();refreshes=new Map();calls=[];used=new Set();backupHashes=new Set();backupFactor=null;sequence=0;user={id:userId,email:'private@example.com',user_metadata:{full_name:'Private Member',aal:'aal2'},identities:[{id:'google',provider:'google'},{id:'discord',provider:'discord'}]};globalThis.__mfaTests.allowed=true;process.env.ZO7AL_ACCOUNT_MFA_ENABLED='true';return mint();}
const view=()=>({...user,factors:[...factors,...(backupFactor?[backupFactor]:[])]});
const bad=(error_code,status=422)=>Response.json({error_code},{status});
globalThis.fetch=async(url,options={})=>{
 const path=new URL(url).pathname.replace('/auth/v1',''),query=new URL(url).search,body=options.body?JSON.parse(options.body):{},access=options.headers?.Authorization?.replace('Bearer ',''),session=tokens.get(access);
 calls.push({path,method:options.method??'GET',body,access});
 if(path==='/settings')return Response.json({external:{google:true,email:true}});
 if(path==='/token') {
  if(query.includes('grant_type=password')||query.includes('grant_type=pkce'))return Response.json(mint('aal1'));
  const current=refreshes.get(body.refresh_token);return current&&tokens.has(current)?Response.json(mint(tokens.get(current).aal)):bad('bad_jwt',401);
 }
 if(!session)return bad('bad_jwt',401);
 if(path==='/user')return Response.json(view());
 if(path==='/factors'&&options.method==='POST') {const f={id:randomUUID(),status:'unverified',factor_type:'totp',friendly_name:body.friendly_name};factors.push(f);return Response.json({id:f.id,totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg"></svg>',secret:'JBSWY3DPEHPK3PXP'}});}
 if(path==='/factors/recovery-codes/verify') {
  const key=hash(body.code);if(!backupHashes.delete(key))return bad('mfa_verification_failed');return Response.json(mint('aal2'));
 }
 if(path==='/factors/recovery-codes'||path==='/factors/recovery-codes/regenerate') {
  if(options.method==='GET')return backupFactor?Response.json({id:backupFactor.id,total:10,remaining:backupHashes.size}):bad('mfa_factor_not_found',404);
  if(session.aal!=='aal2')return bad('insufficient_aal',403);
  if(options.method==='DELETE'){backupFactor=null;backupHashes.clear();return Response.json({ok:true});}
  const codes=Array.from({length:10},(_,i)=>(path.endsWith('regenerate')?'n':'k')+String(i).padStart(15,'0'));backupHashes=new Set(codes.map(hash));backupFactor={id:randomUUID(),factor_type:'recovery_code',status:'verified'};return Response.json({codes});
 }
 const match=path.match(/^\/factors\/([^/]+)(?:\/(challenge|verify))?$/),factor=match&&factors.find(f=>f.id===match[1]);
 if(factor&&match[2]==='challenge')return Response.json({id:'e1234567-1234-1234-1234-123456789abc'});
 if(factor&&match[2]==='verify') {
  if(body.code==='000000')return bad('mfa_verification_failed');used.add(body.code);factor.status='verified';return Response.json(mint('aal2'));
 }
 if(factor&&options.method==='DELETE') {if(factor.status==='verified'&&session.aal!=='aal2')return bad('insufficient_aal');factors=factors.filter(f=>f.id!==factor.id);return Response.json({id:factor.id});}
 return bad('validation_failed',400);
};
const cookie=h=>h.getSetCookie().filter(v=>v.startsWith(auth.ACCOUNT_ACCESS+'=')||v.startsWith(auth.ACCOUNT_REFRESH+'=')).map(v=>v.split(';')[0]).join('; ');
const request=(path,body,access,extra={})=>new Request('https://zo7al.test'+path,{method:body?'POST':'GET',headers:{host:'zo7al.test',origin:'https://zo7al.test','Content-Type':'application/json',...(access?{cookie:typeof access==='string'?auth.ACCOUNT_ACCESS+'='+access:cookie(access)}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
const post=(body,access,extra)=>mfa.POST(request('/api/account/mfa',body,access,extra));
const verifiedFactor=()=>{const f={id:randomUUID(),factor_type:'totp',status:'verified',friendly_name:'My App'};factors.push(f);return f;};
test.after(async()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(savedEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v;}await engine.close();});

test('first-factor sessions cannot view member data, mutate accounts, link identities or list receipts',async()=>{
 const initial=reset(),f=verifiedFactor();
 await assert.rejects(()=>auth.requireAccount(request('/account',null,initial.access_token)),/MFA_REQUIRED/);
 for(const action of [{action:'settings',name:'Attacker',locale:'en'},{action:'password',password:'long-new-password'},{action:'link',provider:'google'},{action:'unlink',identityId:'google'}]) {
  const response=await account.POST(request('/api/account',action,initial.access_token));assert.equal(response.status,403);assert.equal((await response.json()).error,'MFA_REQUIRED');
 }
 const list=await receipts.GET(request('/api/account/receipts',null,initial.access_token));assert.equal(list.status,403);
 const pending=await (await account.GET(request('/api/account',null,initial.access_token))).json();assert.equal(pending.account,null);assert.equal(pending.mfaRequired,true);assert.ok(!JSON.stringify(pending).includes('private@example'));
 const status=await (await mfa.GET(request('/api/account/mfa',null,initial.access_token))).json();assert.equal(status.required,true);assert.deepEqual(status.factors,[{id:f.id,name:'My App'}]);
 const forged=initial.access_token.replace(Buffer.from(JSON.stringify({sub:userId,aal:'aal1',nonce:1})).toString('base64url'),Buffer.from(JSON.stringify({sub:userId,aal:'aal2',nonce:1})).toString('base64url'));
 assert.equal(await auth.accountUser(request('/account',null,forged)),null);
});
test('enrollment needs a correct app code; activation returns backups once, only in a private response',async()=>{
 const initial=reset();delete process.env.ZO7AL_ACCOUNT_MFA_ENABLED;
 assert.equal((await post({action:'enroll'},initial.access_token)).status,503);process.env.ZO7AL_ACCOUNT_MFA_ENABLED='true';
 const start=await post({action:'enroll'},initial.access_token),enrollment=await start.json();assert.equal(start.status,200);assert.equal(start.headers.get('cache-control'),'private, no-store');assert.ok(enrollment.secret);
 const wrong=await post({action:'confirm',factorId:enrollment.id,code:'000000'},initial.access_token);assert.equal((await wrong.json()).error,'MFA_CODE');assert.equal(factors[0].status,'unverified');assert.equal(wrong.headers.get('set-cookie'),null);
 const confirmed=await post({action:'confirm',factorId:enrollment.id,code:'123456'},initial.access_token),data=await confirmed.json();assert.equal(confirmed.status,200);assert.equal(data.codes.length,10);assert.match(data.codes[0],/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);assert.match(confirmed.headers.get('set-cookie'),/HttpOnly/);
 const publicView=await (await account.GET(request('/api/account',null,confirmed.headers))).json();assert.equal(publicView.account.id,userId);assert.equal(publicView.mfaRequired,false);assert.ok(!JSON.stringify(publicView).includes(enrollment.secret));assert.ok(!JSON.stringify(publicView).includes(data.codes[0]));
 const status=await (await mfa.GET(request('/api/account/mfa',null,confirmed.headers))).json();assert.equal(status.recovery.remaining,10);assert.ok(!JSON.stringify(status).includes('codes":['));
});
test('app verification upgrades cookies; wrong codes, replay, CSRF and rate-limit bypass are rejected',async()=>{
 const initial=reset(),factor=verifiedFactor();
 const csrf=await post({action:'verify',factorId:factor.id,code:'123456'},initial.access_token,{origin:'https://evil.test'});assert.equal(csrf.status,403);assert.equal(calls.length,0);
 globalThis.__mfaTests.allowed=false;assert.equal((await post({action:'verify',factorId:factor.id,code:'123456'},initial.access_token)).status,429);assert.ok(!calls.some(c=>c.path.endsWith('/challenge')));globalThis.__mfaTests.allowed=true;
 assert.equal((await post({action:'verify',factorId:randomUUID(),code:'123456'},initial.access_token)).status,400);
 const result=await post({action:'verify',factorId:factor.id,code:'123456'},initial.access_token);assert.equal(result.status,200);assert.equal((await auth.requireAccount(request('/account',null,result.headers))).id,userId);
 const replay=await post({action:'verify',factorId:factor.id,code:'123456'},initial.access_token);assert.equal((await replay.json()).error,'MFA_CODE');
 const noProof=await post({action:'remove',targetId:factor.id},result.headers);assert.equal(noProof.status,400);assert.equal(factors.length,1);
});
test('concurrent TOTP submissions reserve the code once across fresh native challenges',async()=>{
 const initial=reset(),factor=verifiedFactor();
 const responses=await Promise.all([post({action:'verify',factorId:factor.id,code:'567890'},initial.access_token),post({action:'verify',factorId:factor.id,code:'567890'},initial.access_token)]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,400]);assert.equal(calls.filter(c=>c.path.endsWith('/challenge')).length,1);
 const rows=(await pool.query('SELECT code_hash,expires_at FROM site_account_mfa_attempts WHERE user_id=$1 AND factor_id=$2',[userId,factor.id])).rows;
 assert.equal(rows.length,1);assert.match(rows[0].code_hash,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(rows).includes('567890'));
 await pool.query("UPDATE site_account_mfa_attempts SET expires_at=now()-interval '1 second' WHERE user_id=$1 AND factor_id=$2",[userId,factor.id]);
 assert.equal((await post({action:'verify',factorId:factor.id,code:'567890'},initial.access_token)).status,200);
});
test('backup codes upgrade the session once; replacement invalidates old codes and counts remaining',async()=>{
 const initial=reset(),factor=verifiedFactor(),strong=mint('aal2');
 const issued=await post({action:'codes',factorId:factor.id,code:'123456'},strong.access_token),codes=(await issued.json()).codes;
 const recovered=await post({action:'verify',method:'recovery',code:codes[0].toLowerCase()},initial.access_token);assert.equal(recovered.status,200);assert.equal((await auth.requireAccount(request('/account',null,recovered.headers))).id,userId);
 const replay=await post({action:'verify',method:'recovery',code:codes[0]},initial.access_token);assert.equal((await replay.json()).error,'MFA_CODE');
 const status=await (await mfa.GET(request('/api/account/mfa',null,recovered.headers))).json();assert.equal(status.recovery.remaining,9);
 const denied=await post({action:'remove',targetId:factor.id,method:'recovery',code:codes[1]},recovered.headers);assert.equal((await denied.json()).error,'MFA_APP_REQUIRED');assert.equal(backupHashes.size,9);
 const replaced=await post({action:'codes',factorId:factor.id,code:'234567'},recovered.headers);assert.equal((await replaced.json()).codes.length,10);
 assert.equal((await post({action:'verify',method:'recovery',code:codes[1]},initial.access_token)).status,400);
});
test('lost-device recovery can add and verify a new app, then remove the old one safely',async()=>{
 const initial=reset(),old=verifiedFactor(),strong=mint('aal2');
 const issued=await post({action:'codes',factorId:old.id,code:'123456'},strong.access_token),codes=(await issued.json()).codes;
 const recovered=await post({action:'verify',method:'recovery',code:codes[0]},initial.access_token);
 const addition=await post({action:'enroll',method:'recovery',code:codes[1]},recovered.headers),newFactor=await addition.json();assert.equal(addition.status,200);
 const confirmed=await post({action:'confirm',factorId:newFactor.id,code:'234567'},addition.headers);assert.equal(confirmed.status,200);assert.equal(factors.filter(f=>f.status==='verified').length,2);assert.equal((await confirmed.json()).codes,undefined);
 const removed=await post({action:'remove',targetId:old.id,factorId:newFactor.id,code:'345678'},confirmed.headers);assert.equal(removed.status,200);assert.deepEqual(factors.map(f=>f.id),[newFactor.id]);assert.ok(backupFactor);
 const disabled=await post({action:'remove',targetId:newFactor.id,factorId:newFactor.id,code:'456789'},removed.headers);assert.equal(disabled.status,200);assert.equal(factors.length,0);assert.equal(backupFactor,null);assert.equal(backupHashes.size,0);
 const deletes=calls.filter(c=>c.method==='DELETE').map(c=>c.path);assert.ok(deletes.indexOf('/factors/recovery-codes')<deletes.indexOf('/factors/'+newFactor.id));
});
test('password and OAuth completion enter the challenge; token refresh cannot skip the second factor',async()=>{
 const initial=reset();verifiedFactor();
 const signin=await account.POST(request('/api/account',{action:'signin',email:user.email,password:'password'},null));assert.equal((await signin.json()).mfaRequired,true);
 const flowHeaders=auth.accountHeaders();await auth.startAccountFlow(request('/api/account'),flowHeaders,'oauth','/store');
 const flowCookie=flowHeaders.getSetCookie()[0].split(';')[0];assert.equal(await auth.finishAccountFlow(request('/api/account/callback',null,null,{cookie:flowCookie}),auth.accountHeaders(),'oauth-code'),'/account?mfa=1&next=%2Fstore');
 const expired=request('/api/account',null,null,{cookie:auth.ACCOUNT_ACCESS+'=expired; '+auth.ACCOUNT_REFRESH+'='+initial.refresh_token});
 const view=await account.GET(expired);assert.equal((await view.json()).mfaRequired,true);assert.ok(view.headers.get('set-cookie'));
 const verify=await post({action:'verify',factorId:factors[0].id,code:'123456'},view.headers);assert.equal(verify.status,200);
});
