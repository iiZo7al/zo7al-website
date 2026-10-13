import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { SITE_SCHEMA } from '../src/lib/server/site-schema.ts';
import { COMMUNITY_SCHEMA } from '../src/lib/server/community-schema.ts';
import { ACCOUNT_SCHEMA } from '../src/lib/server/account-schema.ts';
import { minecraftName,accountEmail,accountPassword,accountNext,checkoutRecipient,accountProviderName } from '../src/lib/data/account.ts';
const stub=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function moduleURL(path,replacements={}){let source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll("import 'server-only';",'');for(const [a,b] of Object.entries(replacements))source=source.replaceAll(a,b);return stub(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
const engine=new PGlite();await engine.exec(SITE_SCHEMA+COMMUNITY_SCHEMA+ACCOUNT_SCHEMA);
const pool={query:async(sql,args=[])=>{const r=await engine.query(sql,args);return {...r,rowCount:/^SELECT/.test(sql)?r.rows.length:r.affectedRows??r.rows.length};},connect:async()=>({query:pool.query,release(){}})};
globalThis.__accountTests={pool};
const db=stub('export async function siteDatabase(){return globalThis.__accountTests.pool;}');
const data=moduleURL('src/lib/data/account.ts');
const security=moduleURL('src/lib/server/site-security.ts');
const authURL=moduleURL('src/lib/server/account-auth.ts',{'./site-db':db,'./site-security':security,'../data/account':data});
const auth=await import(authURL);
const links=await import(moduleURL('src/lib/server/account-minecraft.ts',{'./site-db':db,'./site-security':security,'./account-auth':authURL,'../data/account':data}));
const accountRoute=await import(moduleURL('src/app/api/account/route.ts',{'@/lib/server/account-auth':authURL,'@/lib/data/member-profile':moduleURL('src/lib/data/member-profile.ts'),'@/lib/data/account':data,'@/lib/server/site-security':security,'@/lib/server/site-content':stub('export async function limitAttempt(){return true;}'),'@/lib/server/site-db':db,'@/i18n/config':moduleURL('src/i18n/config.ts')}));
const userId='a1234567-1234-1234-1234-123456789abc',otherId='b1234567-1234-1234-1234-123456789abc',uuid='c1234567-1234-1234-1234-123456789abc',bridgeId='d1234567-1234-1234-1234-123456789abc';
const headers=(values={})=>({origin:'https://zo7al.test',host:'zo7al.test','Content-Type':'application/json',...values});
const request=(path='/api/account',body,extra={})=>new Request('https://zo7al.test'+path,{method:body?'POST':'GET',headers:headers(extra),...(body?{body:JSON.stringify(body)}:{})});
const cookie=(h,name)=>h.getSetCookie().find(v=>v.startsWith(name+'='))?.split(';')[0];
const savedEnv={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY:process.env.SUPABASE_PUBLISHABLE_KEY,DATABASE_URL:process.env.DATABASE_URL,ZO7AL_SITE_URL:process.env.ZO7AL_SITE_URL};
process.env.SUPABASE_URL='https://auth.zo7al.test';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';process.env.DATABASE_URL='test';delete process.env.ZO7AL_SITE_URL;
const originalFetch=globalThis.fetch;
let calls=[],user={id:userId,email:'owner@example.com',identities:[{id:'discord-id',provider:'discord'}],user_metadata:{full_name:'Zo7al Player',site_role:'admin'},app_metadata:{}};
let handler=()=>Response.json(user);
globalThis.fetch=async(url,options)=>{calls.push({url,options});return handler(String(url),options);};
test.after(async()=>{globalThis.fetch=originalFetch;for(const [key,value] of Object.entries(savedEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await engine.close();});

test('normal purchases use the verified player; gifts may target another linked player',()=>{
 assert.equal(checkoutRecipient(false,'SomeoneElse',{username:'VerifiedPlayer'}),'VerifiedPlayer');
 assert.equal(checkoutRecipient(true,'Other_Player',{username:'VerifiedPlayer'}),'Other_Player');
 assert.throws(()=>checkoutRecipient(false,'SomeoneElse',null),/LINK_REQUIRED/);
 assert.throws(()=>checkoutRecipient('true','Player',null),/INVALID/);
 assert.throws(()=>checkoutRecipient(true,'<script>',null),/INVALID/);
 assert.equal(minecraftName(' .Bedrock Player '),'.Bedrock Player');
 assert.equal(accountEmail(' Invalid '),null);assert.equal(accountPassword('short'),false);
 for(const path of ['//evil.test','/\\evil.test','https://evil.test','/dashboard','/account?redirect=\\evil'])assert.equal(accountNext(path),'/account');
 assert.equal(accountNext('/store'),'/store');
});
test('access cookies are HTTP-only and user identity is verified by the auth server',async()=>{
 calls=[];handler=()=>Response.json(user);
 const h=auth.accountHeaders();auth.setAccountTokens({access_token:'verified-access',refresh_token:'verified-refresh',expires_in:3600},h);
 assert.match(h.get('set-cookie'),/HttpOnly/);assert.match(h.get('set-cookie'),/SameSite=Lax/);assert.equal(h.get('cache-control'),'private, no-store');
 assert.equal((await auth.requireAccount(request('/api/account',undefined,{cookie:cookie(h,auth.ACCOUNT_ACCESS)}))).id,userId);
 assert.ok(calls.some(v=>v.url.endsWith('/auth/v1/user')));
 assert.equal(calls[0].options.headers.Authorization,'Bearer verified-access');
 handler=()=>Response.json({code:'bad_jwt'},{status:401});
 assert.equal(await auth.accountUser(request('/api/account',undefined,{cookie:auth.ACCOUNT_ACCESS+'=forged'})),null);
});
test('expired access refreshes securely; transient outages keep refresh cookies',async()=>{
 let refreshed=false;
 handler=(url)=>{if(url.includes('grant_type=refresh_token')){refreshed=true;return Response.json({access_token:'new-access',refresh_token:'new-refresh',expires_in:3600});}return refreshed?Response.json(user):Response.json({code:'bad_jwt'},{status:401});};
 const h=auth.accountHeaders(),req=request('/api/account',undefined,{cookie:auth.ACCOUNT_ACCESS+'=old-access; '+auth.ACCOUNT_REFRESH+'=old-refresh'});
 assert.equal((await auth.accountUser(req,h)).id,userId);assert.match(h.get('set-cookie'),/new-refresh/);
 handler=url=>url.includes('/token')?Response.json({}, {status:503}):Response.json({code:'bad_jwt'},{status:401});
 const outage=auth.accountHeaders();await assert.rejects(()=>auth.accountUser(req,outage),/UNAVAILABLE/);assert.equal(outage.get('set-cookie'),null);
});
test('OAuth uses PKCE, consumes browser-bound flow once, and rejects cross-account linking',async()=>{
 handler=()=>Response.json(user);await auth.accountView(user);
 const h=auth.accountHeaders();const start=await auth.startAccountFlow(request(),h,'oauth','/store');assert.match(start.code_challenge,/^[A-Za-z0-9_-]{43}$/);
 const flowCookie=h.getSetCookie()[0].split(';')[0];
 let captured;
 handler=(url,opts)=>url.includes('grant_type=pkce')?(captured=JSON.parse(opts.body),Response.json({access_token:'oauth-access',refresh_token:'oauth-refresh',expires_in:3600})):Response.json(user);
 assert.equal(await auth.finishAccountFlow(request('/api/account/callback',undefined,{cookie:flowCookie}),auth.accountHeaders(),'callback-code'),'/store');
 assert.ok(captured.code_verifier.length>=43);assert.equal(captured.auth_code,'callback-code');
 await assert.rejects(()=>auth.finishAccountFlow(request('/api/account/callback',undefined,{cookie:flowCookie}),auth.accountHeaders(),'callback-code'),/AUTH_EXPIRED/);
 const linkH=auth.accountHeaders();await auth.startAccountFlow(request(),linkH,'link','/account',userId);
 handler=(url)=>url.includes('/token')?Response.json({access_token:'wrong',refresh_token:'wrong-refresh',expires_in:3600}):Response.json({...user,id:otherId});
 const deniedH=auth.accountHeaders();await assert.rejects(()=>auth.finishAccountFlow(request('/api/account/callback',undefined,{cookie:linkH.getSetCookie()[0].split(';')[0]}),deniedH,'code'),/AUTH_EXPIRED/);
 assert.ok(!deniedH.getSetCookie().some(v=>v.startsWith(auth.ACCOUNT_ACCESS+'=')));
});
test('Minecraft link requires a valid server token, matching online-player name and unexpired code',async()=>{
 handler=()=>Response.json(user);await auth.accountView({...user,id:otherId});
 const hash='a'.repeat(64);await pool.query('INSERT INTO minecraft_profile_bridges(id,name,token_hash) VALUES($1,$2,$3)',[bridgeId,'Lobby',hash]);
 const challenge=await links.createMinecraftLink(userId,'Player');assert.match(challenge.code,/^[A-HJ-NP-Z2-9]{8}$/);
 await assert.rejects(()=>links.verifyMinecraftLink('b'.repeat(64),{code:challenge.code,uuid,username:'Player'}),/UNAUTHORIZED/);
 await assert.rejects(()=>links.verifyMinecraftLink(hash,{code:challenge.code,uuid,username:'Other'}),/LINK_EXPIRED/);
 await links.verifyMinecraftLink(hash,{code:challenge.code,uuid,username:'Player'});
 assert.equal((await auth.accountView(user)).minecraft.username,'Player');
 await assert.rejects(()=>links.verifyMinecraftLink(hash,{code:challenge.code,uuid,username:'Player'}),/LINK_EXPIRED/);
 await assert.rejects(()=>links.createMinecraftLink(otherId,'Player'),/LINK_TAKEN/);
 const other=await links.createMinecraftLink(otherId,'Different');
 await assert.rejects(()=>links.verifyMinecraftLink(hash,{code:other.code,uuid,username:'Different'}),/LINK_TAKEN/);
 assert.equal((await auth.accountView({...user,id:otherId})).minecraft,null);
 await pool.query("UPDATE site_minecraft_link_codes SET expires_at=now()-interval '1 second' WHERE user_id=$1",[otherId]);
 await assert.rejects(()=>links.verifyMinecraftLink(hash,{code:other.code,uuid:'e1234567-1234-1234-1234-123456789abc',username:'Different'}),/LINK_EXPIRED/);
});
test('account API blocks cross-origin writes and exposes only enabled real providers',async()=>{
 assert.equal((await accountRoute.POST(request('/api/account',{action:'signin',email:'owner@example.com',password:'anything'},{origin:'https://evil.test'}))).status,403);
 handler=url=>url.endsWith('/settings')?Response.json({external:{google:true,discord:false,email:true}}):Response.json(user);
 const response=await accountRoute.GET(request('/api/account',undefined,{cookie:auth.ACCOUNT_ACCESS+'=verified-access'})),data=await response.json();
 assert.deepEqual(data.providers,['google']);assert.equal(data.email,true);assert.equal(data.account.id,userId);assert.ok(!JSON.stringify(data).includes('access_token'));assert.ok(!JSON.stringify(data).includes('site_role'));
});

test('Microsoft is offered only when enabled and requests email through PKCE for sign-in and linking',async()=>{
 assert.equal(accountProviderName('azure'),'Microsoft');
 handler=url=>url.endsWith('/settings')?Response.json({external:{azure:true,google:true,discord:false}}):url.includes('/user/identities/authorize?')?Response.json({url:'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'}):Response.json(user);
 const view=await (await accountRoute.GET(request())).json();assert.deepEqual(view.providers,['google','azure']);
 const start=await accountRoute.POST(request('/api/account',{action:'oauth',provider:'azure',next:'/store'}));
 assert.equal(start.status,200);const url=new URL((await start.json()).url);
 assert.equal(url.searchParams.get('provider'),'azure');assert.equal(url.searchParams.get('scopes'),'email');assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.match(url.searchParams.get('code_challenge'),/^[A-Za-z0-9_-]{43}$/);
 assert.equal(url.searchParams.get('redirect_to'),'https://zo7al.test/api/account/callback');assert.ok(start.headers.getSetCookie().some(value=>value.includes('account-flow=')));
 calls=[];const linked=await accountRoute.POST(request('/api/account',{action:'link',provider:'azure',next:'/account?tab=connections'},{cookie:auth.ACCOUNT_ACCESS+'=verified-access'}));
 assert.equal(linked.status,200);const linkRequest=new URL(calls.find(call=>call.url.includes('/user/identities/authorize?')).url);
 assert.equal(linkRequest.searchParams.get('scopes'),'email');assert.equal(linkRequest.searchParams.get('skip_http_redirect'),'true');
 handler=()=>Response.json({external:{azure:false}});
 const disabled=await accountRoute.POST(request('/api/account',{action:'oauth',provider:'azure'}));assert.equal(disabled.status,400);assert.equal((await disabled.json()).error,'PROVIDER');assert.equal(disabled.headers.get('set-cookie'),null);
 const phone=await accountRoute.POST(request('/api/account',{action:'oauth',provider:'phone'}));assert.equal(phone.status,400);assert.equal((await phone.json()).error,'INVALID');
});


test('private receipts can be claimed once; another account cannot list, steal or track them',async()=>{
 const limit=stub('export async function limitAttempt(){return true;}');
 const replacements={'@/lib/server/account-auth':authURL,'@/lib/server/site-db':db,'@/lib/server/site-security':security,'@/lib/server/site-content':limit};
 const receipts=await import(moduleURL('src/app/api/account/receipts/route.ts',replacements));
 const tracking=await import(moduleURL('src/app/api/tracking/route.ts',{...replacements,'@/lib/server/tebex':stub('export function tebexToken(){return null;}export async function tebexRequest(){throw Error();}')}));
 const {tokenHash}=await import(security),reference='f1234567-1234-1234-1234-123456789abc',token='c'.repeat(64),orderId='f2234567-1234-1234-1234-123456789abc';
 await pool.query('INSERT INTO site_requests(id,kind,token_hash,payload) VALUES($1,$2,$3,$4)',[reference,'support',tokenHash(token),JSON.stringify({email:'private@example.com',message:'private issue'})]);
 await pool.query('INSERT INTO site_orders(id,token_hash,basket_ident,username,items,user_id) VALUES($1,$2,$3,$4,$5,$6)',[orderId,tokenHash(token),'private_basket','Player','[]',otherId]);
 const logged={cookie:auth.ACCOUNT_ACCESS+'=verified-access'};
 handler=()=>Response.json(user);
 assert.equal((await tracking.POST(request('/api/tracking',{reference,kind:'support'},logged))).status,404);
 await receipts.POST(request('/api/account/receipts',{receipts:[{reference,kind:'support',token:'d'.repeat(64)}]},logged));
 assert.equal((await pool.query('SELECT user_id FROM site_requests WHERE id=$1',[reference])).rows[0].user_id,null);
 assert.equal((await receipts.POST(request('/api/account/receipts',{receipts:[{reference,kind:'support',token}]},logged))).status,200);
 const result=await tracking.POST(request('/api/tracking',{reference,kind:'support'},logged));assert.equal(result.status,200);assert.ok(!JSON.stringify(await result.json()).includes('private issue'));
 const list=await (await receipts.GET(request('/api/account/receipts',undefined,logged))).json();assert.deepEqual(list.receipts.map(v=>v.reference),[reference]);
 assert.equal((await tracking.POST(request('/api/tracking',{reference:orderId,kind:'order'},logged))).status,404);
 await receipts.POST(request('/api/account/receipts',{receipts:[{reference:orderId,kind:'order',token}]},logged));
 assert.equal((await pool.query('SELECT user_id FROM site_orders WHERE id=$1',[orderId])).rows[0].user_id,otherId);
 handler=()=>Response.json({...user,id:otherId});
 assert.equal((await tracking.POST(request('/api/tracking',{reference,kind:'support'},logged))).status,404);
 await receipts.POST(request('/api/account/receipts',{receipts:[{reference,kind:'support',token}]},logged));
 assert.equal((await pool.query('SELECT user_id FROM site_requests WHERE id=$1',[reference])).rows[0].user_id,userId);
 handler=()=>Response.json({code:'bad_jwt'},{status:401});
 const signout=await accountRoute.POST(request('/api/account',{action:'signout'},logged));assert.equal(signout.status,200);assert.match(signout.headers.get('set-cookie'),/Max-Age=0/);
});

test('profile handles are unique, private fields are excluded, and unsafe social URLs fail',async()=>{
 handler=()=>Response.json(user);
 const body={action:'profile',username:'iiZo7al',avatar:'https://example.com/avatar.webp',banner:'',bio:'Minecraft and Fortnite creator',socials:{github:'https://github.com/iiZo7al'}};
 const req=(input)=>request('/api/account',input,{cookie:auth.ACCOUNT_ACCESS+'=verified-access'});
 assert.equal((await accountRoute.POST(req(body))).status,200);
 const profile=await auth.accountView(user);assert.equal(profile.username,'iiZo7al');assert.equal(profile.bio,body.bio);assert.equal(profile.socials.github,body.socials.github);assert.equal(profile.avatar,body.avatar);
 assert.equal((await accountRoute.POST(req({...body,username:'unsafe/name'}))).status,400);
 assert.equal((await accountRoute.POST(req({...body,socials:{website:'javascript:alert(1)'}}))).status,400);
 handler=()=>Response.json({...user,id:otherId});
 assert.equal((await accountRoute.POST(req({...body,username:'IIZO7AL'}))).status,409);
 handler=()=>Response.json(user);
});

test('site bans immediately block verified existing sessions; expiry restores access; deleted profiles stay revoked',async()=>{
 handler=()=>Response.json(user);
 await pool.query("UPDATE site_accounts SET banned_until=now()+interval '1 hour' WHERE id=$1",[userId]);
 const req=request('/api/account',undefined,{cookie:auth.ACCOUNT_ACCESS+'=verified-access'});
 await assert.rejects(()=>auth.requireAccount(req),/ACCOUNT_BANNED/);
 await assert.rejects(()=>auth.requireAccountSession(req,auth.accountHeaders()),/ACCOUNT_BANNED/);
 assert.equal((await accountRoute.POST(request('/api/account',{action:'settings',name:'Zo7al',locale:'en'},{cookie:auth.ACCOUNT_ACCESS+'=verified-access'}))).status,403);
 await pool.query("UPDATE site_accounts SET banned_until=now()-interval '1 hour' WHERE id=$1",[userId]);
 assert.equal((await auth.requireAccount(req)).id,userId);
 await pool.query('UPDATE site_accounts SET deleted_at=now() WHERE id=$1',[userId]);
 await assert.rejects(()=>auth.accountView(user),/ACCOUNT_DELETED/);
 await assert.rejects(()=>auth.requireAccount(req),/ACCOUNT_DELETED/);
 await pool.query('UPDATE site_accounts SET deleted_at=NULL,banned_until=NULL WHERE id=$1',[userId]);
});

const passkeys=await import(moduleURL('src/app/api/account/passkeys/route.ts',{'@/lib/server/account-auth':authURL,'@/lib/server/site-security':security,'@/lib/server/site-db':db,'@/lib/server/site-content':stub('export async function limitAttempt(){return true;}')}));
test('passkeys bind challenges to the initiating browser, consume once, and preserve MFA enforcement',async()=>{
 const previous=process.env.ZO7AL_ACCOUNT_PASSKEY_ENABLED;process.env.ZO7AL_ACCOUNT_PASSKEY_ENABLED='true';
 const challengeId='passkey-challenge-1';let verifyCalls=0;
 const pendingUser={...user,factors:[{id:'verified-factor',factor_type:'totp',status:'verified'}]};
 handler=url=>url.endsWith('/options')?Response.json({challenge_id:challengeId,options:{challenge:'challenge-bytes'}}):url.endsWith('/verify')?(verifyCalls++,Response.json({access_token:'h.'+Buffer.from(JSON.stringify({sub:userId,aal:'aal1'})).toString('base64url')+'.sig',refresh_token:'refresh',expires_in:3600})):Response.json(pendingUser);
 try {
  assert.equal((await passkeys.POST(request('/api/account/passkeys',{action:'signin-start'},{origin:'https://evil.test'}))).status,403);
  const start=await passkeys.POST(request('/api/account/passkeys',{action:'signin-start'}));assert.equal(start.status,200);const flow=start.headers.getSetCookie()[0].split(';')[0];
  const body={action:'signin-verify',challengeId,credential:{type:'public-key',id:'credential'}};
  assert.equal((await passkeys.POST(request('/api/account/passkeys',body))).status,400);assert.equal(verifyCalls,0);
  const verified=await passkeys.POST(request('/api/account/passkeys',body,{cookie:flow}));assert.equal(verified.status,200);const result=await verified.json();assert.equal(result.mfaRequired,true);assert.ok(!JSON.stringify(result).includes('access_token'));assert.match(verified.headers.get('set-cookie'),/HttpOnly/);
  assert.equal((await passkeys.POST(request('/api/account/passkeys',body,{cookie:flow}))).status,401);assert.equal(verifyCalls,1);
  assert.equal((await passkeys.POST(request('/api/account/passkeys',{action:'register-start'},{cookie:auth.ACCOUNT_ACCESS+'=validated-access'}))).status,403);
  process.env.ZO7AL_ACCOUNT_PASSKEY_ENABLED='false';assert.equal((await passkeys.POST(request('/api/account/passkeys',{action:'signin-start'}))).status,503);
 } finally {if(previous===undefined)delete process.env.ZO7AL_ACCOUNT_PASSKEY_ENABLED;else process.env.ZO7AL_ACCOUNT_PASSKEY_ENABLED=previous;handler=()=>Response.json(user);}
});

const bridgeData=moduleURL('src/lib/data/minecraft-bridge.ts',{'./player-statistics':moduleURL('src/lib/data/player-statistics.ts')});
const adminProfiles=await import(moduleURL('src/app/api/admin/profiles/route.ts',{'@/lib/server/site-security':security,'@/lib/server/site-db':db,'@/lib/data/minecraft-bridge':bridgeData}));
test('profile moderation requires administrator session and same origin; deletion preserves a revocation tombstone',async()=>{
 const savedSecret=process.env.ZO7AL_ADMIN_SESSION_SECRET,savedHash=process.env.ZO7AL_ADMIN_PASSWORD_HASH;
 const secret='s'.repeat(43),hash='scrypt:'+ 'a'.repeat(32)+':'+ 'b'.repeat(128);process.env.ZO7AL_ADMIN_SESSION_SECRET=secret;process.env.ZO7AL_ADMIN_PASSWORD_HASH=hash;
 const adminCookie= (await import(security)).ADMIN_COOKIE+'='+(await import(security)).signAdminSession(secret,hash);
 const req=(body,origin='https://zo7al.test')=>request('/api/admin/profiles',body,{origin,cookie:adminCookie});
 try {
  assert.equal((await adminProfiles.GET(request('/api/admin/profiles'))).status,401);
  assert.equal((await adminProfiles.POST(request('/api/admin/profiles',{id:otherId,action:'ban',until:null},{cookie:auth.ACCOUNT_ACCESS+'=member'}))).status,401);
  assert.equal((await adminProfiles.POST(req({id:otherId,action:'ban',until:null},'https://evil.test'))).status,403);
  assert.equal((await adminProfiles.POST(req({id:otherId,action:'ban',until:'2000-01-01'}))).status,400);
  assert.equal((await adminProfiles.POST(req({id:otherId,action:'ban',until:new Date(Date.now()+3600000).toISOString(),reason:'Temporary moderation'}))).status,200);
  await assert.rejects(()=>auth.assertAccountAllowed(otherId),/ACCOUNT_BANNED/);
  assert.equal((await adminProfiles.POST(req({id:otherId,action:'unban'}))).status,200);await auth.assertAccountAllowed(otherId);
  assert.equal((await adminProfiles.POST(req({id:otherId,action:'delete'}))).status,200);
  const row=(await pool.query('SELECT username,deleted_at,bio FROM site_accounts WHERE id=$1',[otherId])).rows[0];assert.equal(row.username,null);assert.ok(row.deleted_at);assert.equal(row.bio,'');
  await assert.rejects(()=>auth.assertAccountAllowed(otherId),/ACCOUNT_DELETED/);
  assert.equal((await pool.query('SELECT * FROM site_account_moderation_log WHERE user_id=$1',[otherId])).rows.length,3);
 } finally {if(savedSecret===undefined)delete process.env.ZO7AL_ADMIN_SESSION_SECRET;else process.env.ZO7AL_ADMIN_SESSION_SECRET=savedSecret;if(savedHash===undefined)delete process.env.ZO7AL_ADMIN_PASSWORD_HASH;else process.env.ZO7AL_ADMIN_PASSWORD_HASH=savedHash;}
});
