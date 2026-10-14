import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {SITE_SCHEMA} from '../src/lib/server/site-schema.ts';
import {COMMUNITY_SCHEMA} from '../src/lib/server/community-schema.ts';
import {ACCOUNT_SCHEMA} from '../src/lib/server/account-schema.ts';
const stub=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function mod(path,replacements={}){let s=readFileSync(new URL('../'+path,import.meta.url),'utf8').replace("import 'server-only';",'');for(const [a,b] of Object.entries(replacements))s=s.replaceAll(a,b);return stub(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
const engine=new PGlite();await engine.exec(SITE_SCHEMA+COMMUNITY_SCHEMA+ACCOUNT_SCHEMA);
const pool={query:async(sql,args)=>sql.startsWith('SELECT pg_advisory')?{rows:[]} : engine.query(sql,args),connect:async()=>({query:pool.query,release(){}})};
globalThis.__directMember={pool};
const db=stub('export async function siteDatabase(){return globalThis.__directMember.pool;}'),security=mod('src/lib/server/site-security.ts'),data=mod('src/lib/data/account.ts');
const authURL=mod('src/lib/server/account-auth.ts',{'./site-db':db,'./site-security':security,'../data/account':data}),auth=await import(authURL);
const adminURL=mod('src/lib/server/account-admin.ts',{'./account-auth':authURL});
const member=await import(mod('src/lib/server/member-modrinth.ts',{'./account-auth':authURL,'./account-admin':adminURL,'./site-db':db,'./site-security':security,'../data/account':data}));
const originalFetch=globalThis.fetch,keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','DATABASE_URL','ZO7AL_SITE_URL','MODRINTH_MEMBER_CLIENT_ID','MODRINTH_MEMBER_CLIENT_SECRET','ZO7AL_ACCOUNT_MODRINTH_ENABLED'];
const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));Object.assign(process.env,{SUPABASE_URL:'https://auth.zo7al.test',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'private-auth-test',DATABASE_URL:'test',ZO7AL_SITE_URL:'https://zo7al.test',MODRINTH_MEMBER_CLIENT_ID:'MemberApp123',MODRINTH_MEMBER_CLIENT_SECRET:'private-modrinth-test-secret',ZO7AL_ACCOUNT_MODRINTH_ENABLED:'true'});
let upstream={id:'ModrinthOne',username:'PlayerOne',email:'owner@example.com',email_verified:false},calls=[],users=new Map(),otpTarget=null,forceMFA=false;
const accessFor=id=>Buffer.from(JSON.stringify({sub:id,aal:'aal1'})).toString('base64url');
const userFor=id=>({...users.get(id),factors:forceMFA?[{id:'a1234567-1234-1234-1234-123456789abc',factor_type:'totp',status:'verified'}]:[]});
globalThis.fetch=async(url,options={})=>{
 calls.push({url,options});const body=typeof options.body==='string'?JSON.parse(options.body):null;
 if(url==='https://api.modrinth.com/_internal/oauth/token')return Response.json({access_token:'provider-token'});
 if(url==='https://api.modrinth.com/v2/user')return Response.json(upstream);
 if(url.endsWith('/admin/users')&&options.method==='POST'){users.set(body.id,{...body,identities:[{id:body.id,provider:'email'}]});return Response.json(users.get(body.id));}
 if(/\/admin\/users\//.test(url))return Response.json(users.get(url.split('/').at(-1)));
 if(url.endsWith('/admin/generate_link')){const u=[...users.values()].find(u=>u.email===body.email);otpTarget=u.id;return Response.json({...u,hashed_token:'one-use-native-hash'});}
 if(url.endsWith('/verify'))return Response.json({access_token:'jwt.'+accessFor(otpTarget)+'.mac',refresh_token:'private-refresh',expires_in:3600});
 if(url.endsWith('/user')){const token=options.headers.Authorization.slice(7),id=JSON.parse(Buffer.from(token.split('.')[1],'base64url')).sub;return Response.json(userFor(id));}
 throw Error('Unexpected upstream '+url);
};
const request=(path='/api/account',cookie='')=>new Request('https://zo7al.test'+path,{headers:{origin:'https://zo7al.test',host:'zo7al.test',cookie}});
async function flow(action='oauth',cookie=''){const headers=auth.accountHeaders();const url=new URL(await member.startMemberModrinth(request('/api/account',cookie),headers,action,'/dashboard'));const browser=headers.getSetCookie()[0].split(';')[0];return {url,browser,finish:(extra='',c=browser)=>request('/auth/callback?state='+url.searchParams.get('state')+'&code=provider-code'+extra,c+(cookie?'; '+cookie:''))};}
test.after(async()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;await engine.close();});
test('direct callback has narrow scopes and rejects browser swaps and replay before forwarding',async()=>{
 const f=await flow();assert.equal(f.url.searchParams.get('redirect_uri'),'https://zo7al.test/auth/callback');assert.equal(f.url.searchParams.get('scope'),'USER_READ USER_READ_EMAIL');assert.ok(!f.url.href.includes(process.env.MODRINTH_MEMBER_CLIENT_SECRET));
 const before=calls.length;await assert.rejects(()=>member.finishMemberModrinth(f.finish('','zo7al-member-modrinth='+'a'.repeat(64)),auth.accountHeaders()),/AUTH_EXPIRED/);assert.equal(calls.length,before);
 assert.equal(await member.finishMemberModrinth(f.finish(),auth.accountHeaders()),'/dashboard');
 await assert.rejects(()=>member.finishMemberModrinth(f.finish(),auth.accountHeaders()),/AUTH_EXPIRED/);
 const call=calls.find(c=>c.url.endsWith('/oauth/token'));assert.equal(call.options.body.get('redirect_uri'),'https://zo7al.test/auth/callback');assert.equal(call.options.headers.Authorization,process.env.MODRINTH_MEMBER_CLIENT_SECRET);
});
test('new member identity never auto-merges by personal email and returns a native MFA challenge',async()=>{
 const id=(await pool.query('SELECT user_id FROM site_member_modrinth_identities WHERE provider_id=$1',[upstream.id])).rows[0].user_id;
 assert.ok(users.get(id).email.endsWith('@modrinth.accounts.zo7al.is-a.dev'));assert.notEqual(users.get(id).email,upstream.email);
 const createCount=calls.filter(c=>c.url.endsWith('/admin/users')).length;forceMFA=true;
 const f=await flow();const headers=auth.accountHeaders();assert.equal(await member.finishMemberModrinth(f.finish(),headers),'/account?mfa=1&next=%2Fdashboard');assert.equal(calls.filter(c=>c.url.endsWith('/admin/users')).length,createCount);
 const token=headers.getSetCookie().find(c=>c.startsWith(auth.ACCOUNT_ACCESS+'=')).split(';')[0].split('=')[1];assert.equal(auth.accountRequiresMFA(userFor(id),token),true);forceMFA=false;
 const view=await auth.accountView(userFor(id));assert.equal(view.email,'');assert.ok(view.providers.some(v=>v.provider==='modrinth'));
});
test('linking keeps the current account, rejects identity moves and cancelled authorization',async()=>{
 const id='b1234567-1234-1234-1234-123456789abc';users.set(id,{id,email:'owner@example.com',user_metadata:{name:'Owner'},identities:[{id,provider:'google'}]});await auth.accountView(userFor(id));
 const cookie=auth.ACCOUNT_ACCESS+'=jwt.'+accessFor(id)+'.mac';
 const conflict=await flow('link',cookie);await assert.rejects(()=>member.finishMemberModrinth(conflict.finish(),auth.accountHeaders()),/IDENTITY_LINKED/);
 upstream={...upstream,id:'ModrinthTwo'};const good=await flow('link',cookie);assert.equal(await member.finishMemberModrinth(good.finish(),auth.accountHeaders()),'/dashboard');
 const row=(await pool.query('SELECT user_id FROM site_member_modrinth_identities WHERE provider_id=$1',[upstream.id])).rows[0];assert.equal(row.user_id,id);
 const denied=await flow();const before=calls.length;assert.equal(await member.finishMemberModrinth(denied.finish('&error=access_denied'),auth.accountHeaders()),'/account?tab=connections');assert.equal(calls.length,before);
});
test('expired states, tampered redirects, missing server bridge and banned identities fail closed',async()=>{
 const f=await flow();await pool.query("UPDATE site_member_modrinth_flows SET expires_at=now()-interval '1 minute'");await assert.rejects(()=>member.finishMemberModrinth(f.finish(),auth.accountHeaders()),/AUTH_EXPIRED/);
 const bad=await flow();const before=calls.length;await assert.rejects(()=>member.finishMemberModrinth(bad.finish('&redirect_uri=https://evil.test'),auth.accountHeaders()),/AUTH_EXPIRED/);assert.equal(calls.length,before);
 const key=process.env.SUPABASE_SECRET_KEY;delete process.env.SUPABASE_SECRET_KEY;assert.equal(member.memberModrinthConfigured(),false);await assert.rejects(()=>flow(),/PROVIDER/);process.env.SUPABASE_SECRET_KEY=key;
 const id=(await pool.query('SELECT user_id FROM site_member_modrinth_identities WHERE provider_id=$1',[upstream.id])).rows[0].user_id;await pool.query("UPDATE site_accounts SET banned_until=now()+interval '1 hour' WHERE id=$1",[id]);const banned=await flow();await assert.rejects(()=>member.finishMemberModrinth(banned.finish(),auth.accountHeaders()),/ACCOUNT_BANNED/);
});
