import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { AccountError, accountRequiresMFA, accountView, assertAccountAllowed, authRequest, cancelAccountDeletion, publicOrigin, requestCookie, requireAccount, setAccountCookie, setAccountTokens, type AuthUser } from './account-auth';
import { accountNext, safeAccountName } from '../data/account';
import { siteDatabase } from './site-db';
import { tokenHash } from './site-security';
import { accountAdminRequest } from './account-admin';

const FLOW = process.env.NODE_ENV === 'production' ? '__Host-zo7al-member-modrinth' : 'zo7al-member-modrinth';
const agent = 'Zo7alProjects/1.0 (https://zo7al.is-a.dev)';
export function memberModrinthConfigured() {
 return process.env.ZO7AL_ACCOUNT_MODRINTH_ENABLED==='true' && /^[A-Za-z0-9_-]{8,128}$/.test(process.env.MODRINTH_MEMBER_CLIENT_ID??'') && /^[\x21-\x7e]{16,256}$/.test(process.env.MODRINTH_MEMBER_CLIENT_SECRET??'') && !!process.env.SUPABASE_SECRET_KEY;
}
const callback = (request:Request) => publicOrigin(request)+'/auth/callback';
async function json(response:Response):Promise<Record<string,unknown>> {
 if(!response.ok)throw new AccountError(response.status>=500?'UNAVAILABLE':'AUTH_EXPIRED',response.status>=500?503:401);
 const reader=response.body?.getReader();if(!reader)throw new AccountError('UNAVAILABLE',503);
 const chunks:Uint8Array[]=[];let size=0;
 try {while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>32000)throw new AccountError('UNAVAILABLE',503);chunks.push(part.value);}return JSON.parse(Buffer.concat(chunks).toString());}finally{await reader.cancel();}
}
export async function startMemberModrinth(request:Request,headers:Headers,action:'oauth'|'link',next:unknown) {
 if(!memberModrinthConfigured())throw new AccountError('PROVIDER');
 const user=action==='link'?await requireAccount(request):null;
 const state=randomBytes(32).toString('hex'),browser=randomBytes(32).toString('hex'),db=await siteDatabase();
 await db.query('DELETE FROM site_member_modrinth_flows WHERE expires_at<now()');
 await db.query("INSERT INTO site_member_modrinth_flows(state_hash,browser_hash,user_id,next_path,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",[tokenHash(state),tokenHash(browser),user?.id??null,accountNext(next)]);
 setAccountCookie(headers,FLOW,browser,600);
 const url=new URL('https://modrinth.com/auth/authorize');
 url.search=new URLSearchParams({client_id:process.env.MODRINTH_MEMBER_CLIENT_ID!,redirect_uri:callback(request),response_type:'code',scope:'USER_READ USER_READ_EMAIL',state}).toString();
 return url.href;
}
export async function finishMemberModrinth(request:Request,headers:Headers) {
 const params=new URL(request.url).searchParams,state=params.get('state')??'',browser=requestCookie(request,FLOW);
 setAccountCookie(headers,FLOW,'',0);
 if(!memberModrinthConfigured()||!/^[a-f0-9]{64}$/.test(state)||!/^[a-f0-9]{64}$/.test(browser))throw new AccountError('AUTH_EXPIRED',401);
 // Atomically consume the browser-bound state before exchanging any authorization code.
 const db=await siteDatabase();
 const flow=(await db.query('DELETE FROM site_member_modrinth_flows WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>now() RETURNING user_id,next_path',[tokenHash(state),tokenHash(browser)])).rows[0];
 if(!flow)throw new AccountError('AUTH_EXPIRED',401);
 if(params.has('error'))return '/account?tab=connections';
 const code=params.get('code');
 if(!code||code.length>4096||/[\x00-\x20\x7f]/.test(code)||params.has('client_id')&&params.get('client_id')!==process.env.MODRINTH_MEMBER_CLIENT_ID||params.has('redirect_uri')&&params.get('redirect_uri')!==callback(request))throw new AccountError('AUTH_EXPIRED',401);
 if(flow.user_id&&(await requireAccount(request,headers)).id!==flow.user_id)throw new AccountError('AUTH_EXPIRED',401);
 const token=await json(await fetch('https://api.modrinth.com/_internal/oauth/token',{method:'POST',headers:{Authorization:process.env.MODRINTH_MEMBER_CLIENT_SECRET!,'User-Agent':agent},body:new URLSearchParams({client_id:process.env.MODRINTH_MEMBER_CLIENT_ID!,grant_type:'authorization_code',code,redirect_uri:callback(request)}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)}));
 if(typeof token.access_token!=='string'||!/^[\x21-\x7e]{1,4096}$/.test(token.access_token))throw new AccountError('AUTH_EXPIRED',401);
 const identity=await json(await fetch('https://api.modrinth.com/v2/user',{headers:{Authorization:token.access_token,'User-Agent':agent},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)})),name=safeAccountName(identity.username);
 if(typeof identity.id!=='string'||!/^[A-Za-z0-9]{1,128}$/.test(identity.id)||!name)throw new AccountError('AUTH_EXPIRED',401);
 const client=await db.connect();let id:string;
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',['member-modrinth:'+identity.id]);
  const row=(await client.query('SELECT user_id FROM site_member_modrinth_identities WHERE provider_id=$1',[identity.id])).rows[0];
  if(flow.user_id&&row&&row.user_id!==flow.user_id)throw new AccountError('IDENTITY_LINKED',409);
  id=row?.user_id??flow.user_id??randomUUID();
  const account=(await client.query('SELECT deleted_at,banned_until,deletion_due_at FROM site_accounts WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(account?.deleted_at||account?.deletion_due_at&&new Date(account.deletion_due_at).getTime()<=Date.now())throw new AccountError('ACCOUNT_DELETED',403);
  if(account?.banned_until&&new Date(account.banned_until).getTime()>Date.now())throw new AccountError('ACCOUNT_BANNED',403);
  if(!row&&!flow.user_id) {
   // Internal identifier only: never verify or auto-match a member's Modrinth email.
   const user=await accountAdminRequest('/users','POST',{id,email:randomBytes(32).toString('hex')+'@modrinth.accounts.zo7al.is-a.dev',email_confirm:true,app_metadata:{zo7al_modrinth:identity.id},user_metadata:{name}});
   if(user.id!==id)throw new AccountError('AUTH_EXPIRED',401);
   await client.query('INSERT INTO site_accounts(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING',[id,name]);
  }
  await client.query('INSERT INTO site_member_modrinth_identities(user_id,provider_id,name) VALUES($1,$2,$3) ON CONFLICT(provider_id) DO UPDATE SET name=excluded.name',[id,identity.id,name]);
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});if((error as {code?:string}).code==='23505')throw new AccountError('IDENTITY_LINKED',409);throw error;}finally{client.release();}
 if(flow.user_id)return accountNext(flow.next_path);
 const target=await accountAdminRequest('/users/'+id);
 if(target.id!==id||typeof target.email!=='string')throw new AccountError('AUTH_EXPIRED',401);
 await assertAccountAllowed(id);
 const link=await accountAdminRequest('/generate_link','POST',{type:'magiclink',email:target.email});
 if(link.id!==id||typeof link.hashed_token!=='string')throw new AccountError('AUTH_EXPIRED',401);
 // Native AAL1 session. Only native factor verification can elevate it to AAL2.
 const tokens=await authRequest('/verify','POST',{type:'magiclink',token_hash:link.hashed_token});
 const user=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;
 if(user.id!==id)throw new AccountError('AUTH_EXPIRED',401);
 await accountView(user);setAccountTokens(tokens,headers);
  if(!accountRequiresMFA(user,tokens.access_token!))await cancelAccountDeletion(id);
 return accountRequiresMFA(user,tokens.access_token!)?'/account?mfa=1&next='+encodeURIComponent(accountNext(flow.next_path)):accountNext(flow.next_path);
}
