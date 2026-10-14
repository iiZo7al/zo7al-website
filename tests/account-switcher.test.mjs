import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {ACCOUNT_SCHEMA} from '../src/lib/server/account-schema.ts';
import {SITE_SCHEMA} from '../src/lib/server/site-schema.ts';
const stub=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function moduleURL(path,replacements={}){let s=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll("import 'server-only';",'');for(const [name,value] of Object.entries(replacements))s=s.replaceAll(name,value);return stub(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);}
const engine=new PGlite();await engine.exec(SITE_SCHEMA+ACCOUNT_SCHEMA);
const pool={query:(sql,args=[])=>engine.query(sql,args),connect:async()=>({query:pool.query,release(){}})};globalThis.__switcherDB=pool;
const db=stub('export async function siteDatabase(){return globalThis.__switcherDB;}'),security=moduleURL('src/lib/server/site-security.ts'),data=moduleURL('src/lib/data/account.ts');
const authURL=moduleURL('src/lib/server/account-auth.ts',{'./site-db':db,'./site-security':security,'../data/account':data}),auth=await import(authURL);
const switcherURL=moduleURL('src/lib/server/account-switcher.ts',{'./account-auth':authURL,'./site-db':db,'./site-security':security,'../data/account':data}),switcher=await import(switcherURL);
const route=await import(moduleURL('src/app/api/account/accounts/route.ts',{'@/lib/server/account-auth':authURL,'@/lib/server/account-switcher':switcherURL,'@/lib/server/site-security':security,'@/lib/server/site-content':stub('export async function limitAttempt(){return true;}')}));
const envNames=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','DATABASE_URL','ZO7AL_ADMIN_SESSION_SECRET'],saved=Object.fromEntries(envNames.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch;
process.env.SUPABASE_URL='https://auth.zo7al.test';process.env.SUPABASE_PUBLISHABLE_KEY='test';process.env.DATABASE_URL='test';process.env.ZO7AL_ADMIN_SESSION_SECRET='test-secret-'.repeat(6);
const ids=['a1234567-1234-1234-1234-123456789abc','b1234567-1234-1234-1234-123456789abc'];let active=0,factors=[],wrongSubject=false,calls=[];
globalThis.fetch=async(url,options)=>{calls.push(String(url));if(String(url).includes('refresh_token'))return Response.json({access_token:'refreshed-access',refresh_token:'rotated-refresh',expires_in:3600});return Response.json({id:ids[wrongSubject?1:active],email:'member@example.com',user_metadata:{name:'Member '+active},factors});};
const cookies=h=>h.getSetCookie().map(c=>c.split(';')[0]).join('; ');
const req=(body,cookie='',origin='https://zo7al.test')=>new Request('https://zo7al.test/api/account/accounts',{method:'POST',headers:{origin,host:'zo7al.test','Content-Type':'application/json',cookie},body:JSON.stringify(body)});
const session=auth.ACCOUNT_ACCESS+'=current-access; '+auth.ACCOUNT_REFRESH+'=current-refresh';let device;
test.after(async()=>{globalThis.fetch=originalFetch;for(const [k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;await engine.close();});
test('opening the chooser remembers the current session without logout and only returns profile summaries',async()=>{
 const response=await route.POST(req({action:'remember'},session)),body=await response.json();assert.equal(response.status,200);assert.equal(body.accounts[0].id,ids[0]);assert.ok(!JSON.stringify(body).includes('access'));assert.ok(!calls.some(c=>c.includes('/logout')));
 device=cookies(response.headers);assert.match(device,/zo7al-accounts=[a-f0-9]{64}/);assert.match(response.headers.get('set-cookie'),/HttpOnly/);
 const stored=(await pool.query('SELECT sealed FROM site_account_saved_sessions')).rows[0].sealed;assert.ok(!stored.includes('current-refresh'));assert.ok(!stored.includes('current-access'));
});
test('accounts are isolated to the initiating browser and refreshed tokens must return the same subject',async()=>{
 const denied=await route.POST(req({action:'switch',id:ids[0]},auth.ACCOUNT_DEVICE+'='+'f'.repeat(64)));assert.equal(denied.status,401);assert.equal(denied.headers.get('set-cookie'),null);
 wrongSubject=true;const mismatch=await route.POST(req({action:'switch',id:ids[0]},device));assert.equal(mismatch.status,401);assert.equal(mismatch.headers.get('set-cookie'),null);wrongSubject=false;
 assert.equal((await pool.query('SELECT 1 FROM site_account_saved_sessions')).rows.length,0);
 await route.POST(req({action:'remember'},session+'; '+device));
});
test('switching rotates saved refresh tokens and does not transfer the previous account second-factor grant',async()=>{
 factors=[{id:'c1234567-1234-1234-1234-123456789abc',factor_type:'totp',status:'verified'}];
 const switched=await route.POST(req({action:'switch',id:ids[0]},device+'; zo7al-second-factor='+'a'.repeat(64)));assert.equal(switched.status,200);assert.equal((await switched.json()).mfaRequired,true);assert.match(switched.headers.get('set-cookie'),/zo7al-second-factor=;.*Max-Age=0/);assert.match(switched.headers.get('set-cookie'),/rotated-refresh/);factors=[];
 const h=auth.accountHeaders();const again=await switcher.switchSavedAccount(req({},device),h,ids[0]);assert.equal(again.mfaRequired,false);
});
test('expired, banned and cross-origin choices cannot replace the active account',async()=>{
 assert.equal((await route.POST(req({action:'switch',id:ids[0]},device,'https://evil.test'))).status,403);
 await pool.query("UPDATE site_accounts SET banned_until=now()+interval '1 day' WHERE id=$1",[ids[0]]);const banned=await route.POST(req({action:'switch',id:ids[0]},device));assert.equal(banned.status,403);assert.equal(banned.headers.get('set-cookie'),null);await pool.query('UPDATE site_accounts SET banned_until=NULL WHERE id=$1',[ids[0]]);
 await route.POST(req({action:'remember'},session+'; '+device));await pool.query("UPDATE site_account_saved_sessions SET expires_at=now()-interval '1 second'");assert.equal((await route.POST(req({action:'switch',id:ids[0]},device))).status,401);
});
test('signing out forgets only this browser account and MFA-pending sessions cannot be saved',async()=>{
 await route.POST(req({action:'remember'},session+'; '+device));active=1;await route.POST(req({action:'remember'},session+'; '+device));
 await auth.forgetSavedAccount(req({},device),ids[0]);assert.deepEqual((await switcher.savedAccounts(req({},device))).map(a=>a.id),[ids[1]]);
 factors=[{id:'c1234567-1234-1234-1234-123456789abc',factor_type:'totp',status:'verified'}];assert.equal((await route.POST(req({action:'remember'},session+'; '+device))).status,403);
});
