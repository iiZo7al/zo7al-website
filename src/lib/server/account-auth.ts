import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { siteDatabase } from './site-db';
import { tokenHash } from './site-security';
import { accountEmail, accountNext, safeAccountName, type SiteAccount } from '../data/account';

const secure = process.env.NODE_ENV === 'production';
export const ACCOUNT_ACCESS = secure ? '__Host-zo7al-access' : 'zo7al-access';
export const ACCOUNT_REFRESH = secure ? '__Host-zo7al-refresh' : 'zo7al-refresh';
export const ACCOUNT_DEVICE = secure ? '__Host-zo7al-accounts' : 'zo7al-accounts';
const FLOW_COOKIE = secure ? '__Host-zo7al-account-flow' : 'zo7al-account-flow';
export type AuthFactor = { id: string; factor_type: string; status: string; friendly_name?: string };
export type AuthUser = { id: string; email?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; identities?: { id: string; identity_id?: string; provider: string; identity_data?:Record<string,unknown> }[]; factors?: AuthFactor[] };
export type AuthResult = { access_token?: string; refresh_token?: string; expires_in?: number; user?: AuthUser; url?: string; external?: Record<string, boolean>; passkeys_enabled?: boolean; email?: boolean; code?: string; msg?: string; id?: string; type?: string; totp?: {qr_code:string;secret:string;uri:string}; codes?:string[]; total?:number; remaining?:number };
export class AccountError extends Error { constructor(public code: string, public status = 400) { super(code); } }
export function accountConfigured() { return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY && !!process.env.DATABASE_URL; }
export function publicOrigin(request: Request) {
  const supplied = process.env.ZO7AL_SITE_URL?.trim();
  if (supplied) { const url = new URL(supplied); if (url.protocol !== 'https:' || url.username || url.password) throw new AccountError('CONFIGURATION', 503); return url.origin; }
  const host = request.headers.get('host') ?? new URL(request.url).host;
  if (!/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(host)) throw new AccountError('INVALID');
  return `${secure ? 'https:' : new URL(request.url).protocol}//${host}`;
}
export function accountOrigin(request: Request) { return request.headers.get('origin') === publicOrigin(request); }
export function requestCookie(request: Request, name: string) { return request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) ?? ''; }
export function setAccountCookie(headers: Headers, name: string, value: string, age: number) {
  if (!/^[a-zA-Z0-9_.-]*$/.test(value) || value.length > 3800) throw new AccountError('UNAVAILABLE', 503);
  headers.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`);
}
export function accountHeaders() { return new Headers({ 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' }); }
export async function forgetSavedAccount(request:Request,id:string){const device=requestCookie(request,ACCOUNT_DEVICE);if(/^[a-f0-9]{64}$/.test(device))await(await siteDatabase()).query('DELETE FROM site_account_saved_sessions WHERE device_hash=$1 AND user_id=$2',[tokenHash(device),id]);}
export function clearAccount(headers: Headers) { setAccountCookie(headers, SECOND_FACTOR, '', 0); setAccountCookie(headers, ACCOUNT_ACCESS, '', 0); setAccountCookie(headers, ACCOUNT_REFRESH, '', 0); }
export function setAccountTokens(result: AuthResult, headers: Headers) {
  if (!result.access_token || !result.refresh_token || !Number.isFinite(result.expires_in)) throw new AccountError('AUTH_EXPIRED', 401);
  setAccountCookie(headers, ACCOUNT_ACCESS, result.access_token, Math.min(86400, result.expires_in!));
  setAccountCookie(headers, ACCOUNT_REFRESH, result.refresh_token, 30 * 86400);
}
export async function authRequest(path: string, method = 'GET', body?: unknown, access?: string): Promise<AuthResult> {
  const base = process.env.SUPABASE_URL?.trim(), key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!base || !key) throw new AccountError('CONFIGURATION', 503);
  const url = new URL(base); if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new AccountError('CONFIGURATION', 503);
  const response = await fetch(`${url.origin}/auth/v1${path}`, { method, headers: { apikey: key, 'Content-Type': 'application/json', ...(access ? { Authorization: 'Bearer ' + access } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason=data.error_code??data.code;
    const code = response.status === 429 ? 'RATE_LIMIT' : response.status >= 500 ? 'UNAVAILABLE' : ['invalid_credentials','user_not_found'].includes(reason) ? 'CREDENTIALS' : reason === 'email_not_confirmed' ? 'EMAIL_CONFIRM' : ['weak_password','same_password'].includes(reason) ? 'PASSWORD' : reason==='identity_already_exists'?'IDENTITY_LINKED':['provider_disabled','manual_linking_disabled'].includes(reason) ? 'PROVIDER' : ['session_not_found','refresh_token_not_found','refresh_token_already_used','bad_jwt'].includes(reason) || response.status === 401 ? 'AUTH_EXPIRED' : path.startsWith('/passkeys')&&(response.status===404||/passkey_disabled|webauthn_/.test(reason??''))?'PASSKEY_UNAVAILABLE':reason==='mfa_factor_not_found'?'MFA_NOT_FOUND':reason==='insufficient_aal'?'MFA_REQUIRED':['mfa_verification_failed','mfa_verification_rejected','mfa_challenge_expired'].includes(reason)?'MFA_CODE':path.startsWith('/factors')&&(response.status===404||/not_enabled|disabled/.test(reason??''))?'MFA_UNAVAILABLE':'INVALID';
    throw new AccountError(code, response.status === 429 ? 429 : response.status >= 500 ? 503 : response.status === 401 ? 401 : 400);
  }
  return data;
}
export async function accountSession(request: Request, headers?: Headers): Promise<{user:AuthUser;access:string}|null> {
  let access = requestCookie(request, ACCOUNT_ACCESS);
  if (!accountConfigured() || !access && !requestCookie(request, ACCOUNT_REFRESH)) return null;
  try { if (access) return {user:await authRequest('/user', 'GET', undefined, access) as AuthUser,access}; }
  catch (error) { if (!(error instanceof AccountError) || error.code !== 'AUTH_EXPIRED') throw error; }
  if (!headers) return null;
  const refresh = requestCookie(request, ACCOUNT_REFRESH); if (!refresh) return null;
  try { const tokens = await authRequest('/token?grant_type=refresh_token', 'POST', { refresh_token: refresh }); setAccountTokens(tokens, headers); access = tokens.access_token!; return {user:await authRequest('/user', 'GET', undefined, access) as AuthUser,access}; }
  catch (error) { if (error instanceof AccountError && error.code === 'AUTH_EXPIRED') { clearAccount(headers); return null; } throw error; }
}
/** Only inspect claims AFTER the exact access token was validated by /user. */
export function accountRequiresMFA(user:AuthUser,validatedAccess:string) {
  if(!(user.factors??[]).some(factor=>factor.status==='verified'))return false;
  try {const claims=JSON.parse(Buffer.from(validatedAccess.split('.')[1],'base64url').toString());return claims.sub!==user.id||claims.aal!=='aal2';}catch{return true;}
}
const SECOND_FACTOR = secure ? '__Host-zo7al-second-factor' : 'zo7al-second-factor';
/** Claims are read only after /user validated this exact access token. */
export function accountSessionId(user:AuthUser,access:string):string|null {
 try{const claims=JSON.parse(Buffer.from(access.split('.')[1],'base64url').toString());return claims.sub===user.id&&/^[a-f0-9-]{36}$/i.test(claims.session_id??'')?claims.session_id:null;}catch{return null;}
}
function factorFingerprint(user:AuthUser){return tokenHash((user.factors??[]).filter(f=>f.status==='verified').map(f=>f.id).sort().join(':'));}
export async function grantAccountSecondFactor(user:AuthUser,access:string,headers:Headers){
 const session=accountSessionId(user,access);if(!session)throw new AccountError('AUTH_EXPIRED',401);
 const token=randomBytes(32).toString('hex'),db=await siteDatabase();await db.query('DELETE FROM site_account_second_factors WHERE expires_at<now()');
 await db.query("INSERT INTO site_account_second_factors(token_hash,user_id,session_id,factor_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '12 hours')",[tokenHash(token),user.id,session,factorFingerprint(user)]);
 setAccountCookie(headers,SECOND_FACTOR,token,43200);
}
export async function hasAccountSecondFactor(request:Request,user:AuthUser,access:string){
 if(!accountRequiresMFA(user,access))return true;
 const token=requestCookie(request,SECOND_FACTOR),session=accountSessionId(user,access);if(!session||!/^[a-f0-9]{64}$/.test(token))return false;
 const result=await (await siteDatabase()).query('SELECT user_id FROM site_account_second_factors WHERE token_hash=$1 AND user_id=$2 AND session_id=$3 AND factor_hash=$4 AND expires_at>now()',[tokenHash(token),user.id,session,factorFingerprint(user)]);return result.rows.length>0;
}
export async function accountUser(request:Request,headers?:Headers):Promise<AuthUser|null> {
  const session=await accountSession(request,headers);if(!session)return null;
  if(!await hasAccountSecondFactor(request,session.user,session.access))throw new AccountError('MFA_REQUIRED',403);
  await assertAccountAllowed(session.user.id);
  return session.user;
}
export async function requireAccountSession(request:Request,headers:Headers) {
  const session=await accountSession(request,headers);
  if(!session||!/^[a-f0-9-]{36}$/i.test(session.user.id))throw new AccountError('LOGIN_REQUIRED',401);
  await assertAccountAllowed(session.user.id);
  return session;
}
export async function requireAccount(request: Request, headers?: Headers) { const user = await accountUser(request, headers); if (!user || !/^[a-f0-9-]{36}$/i.test(user.id)) throw new AccountError('LOGIN_REQUIRED', 401); return user; }
export async function assertAccountAllowed(id:string) {
 const row=(await (await siteDatabase()).query('SELECT deleted_at,banned_until,deletion_due_at FROM site_accounts WHERE id=$1',[id])).rows[0];
 if(row?.deleted_at || row?.deletion_due_at && new Date(row.deletion_due_at).getTime()<=Date.now())throw new AccountError('ACCOUNT_DELETED',403);
 if(row?.banned_until && new Date(row.banned_until).getTime()>Date.now())throw new AccountError('ACCOUNT_BANNED',403);
}
export async function accountView(user: AuthUser): Promise<SiteAccount> {
  const db = await siteDatabase();
  const fallback = safeAccountName(user.user_metadata?.full_name) ?? safeAccountName(user.user_metadata?.name) ?? user.email?.split('@')[0]?.slice(0,64) ?? 'Zo7al';
  await db.query('INSERT INTO site_accounts(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING', [user.id, fallback]);
  const row = (await db.query('SELECT a.name,a.username AS handle,a.avatar,a.banner,a.bio,a.socials,l.uuid,l.username,l.linked_at FROM site_accounts a LEFT JOIN site_minecraft_links l ON l.user_id=a.id WHERE a.id=$1',[user.id])).rows[0];
  const modrinth=(await db.query('SELECT provider_id,name FROM site_member_modrinth_identities WHERE user_id=$1',[user.id])).rows[0];
  const internalEmail=user.email?.endsWith('@modrinth.accounts.zo7al.is-a.dev');
  // Linked provider contact details are never used to select/merge an authentication subject.
  const contactEmail=internalEmail?(user.identities??[]).map(v=>accountEmail(v.identity_data?.email)).find(v=>v&&!v.endsWith('@modrinth.accounts.zo7al.is-a.dev'))??'':user.email??'';
  await assertAccountAllowed(user.id);
  const rawAvatar = row.avatar ?? user.user_metadata?.avatar_url;
  let avatar: string | null = typeof rawAvatar==='string'&&/^\/api\/profile-media\/[a-f0-9-]{36}$/.test(rawAvatar)?rawAvatar:null;
  if (typeof rawAvatar === 'string' && rawAvatar.length < 1024) { try { const url = new URL(rawAvatar); if (url.protocol === 'https:' && !url.username && !url.password) avatar = url.href; } catch {} }
  return { id: user.id, name: row.name, username:row.handle??null, banner:row.banner??null, bio:row.bio??'', socials:row.socials??{}, email: contactEmail, avatar, providers: [...(user.identities ?? []).filter(v=>!(v.provider==='email'&&user.email?.endsWith('@modrinth.accounts.zo7al.is-a.dev'))).map(v => ({ id: v.identity_id ?? v.id, provider: v.provider==='twitter'?'x':v.provider, ...(v.provider==='discord'?{name:safeAccountName(v.identity_data?.full_name)??safeAccountName(v.identity_data?.name)??'Discord'}:{}) })),...(modrinth?[{id:'modrinth:'+modrinth.provider_id,provider:'modrinth',name:modrinth.name}]:[])], minecraft: row.uuid ? { uuid: row.uuid, username: row.username, linkedAt: new Date(row.linked_at).toISOString() } : null };
}
export async function startAccountFlow(request: Request, headers: Headers, purpose: string, next: unknown, userId: string | null = null) {
  const browser = randomBytes(32).toString('hex'), verifier = randomBytes(48).toString('base64url');
  await (await siteDatabase()).query('DELETE FROM site_account_auth_flows WHERE expires_at<now()');
  await (await siteDatabase()).query("INSERT INTO site_account_auth_flows(browser_hash,verifier,purpose,user_id,next_path,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 hour')", [tokenHash(browser),verifier,purpose,userId,accountNext(next)]);
  setAccountCookie(headers, FLOW_COOKIE, browser, 3600);
  return { code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 's256', redirectTo: publicOrigin(request) + '/api/account/callback' };
}
export async function finishAccountFlow(request: Request, headers: Headers, code: string) {
  const browser = requestCookie(request, FLOW_COOKIE); setAccountCookie(headers, FLOW_COOKIE, '', 0);
  if (!/^[a-f0-9]{64}$/.test(browser) || !code || code.length > 2048) throw new AccountError('AUTH_EXPIRED', 401);
  const flow = (await (await siteDatabase()).query('DELETE FROM site_account_auth_flows WHERE browser_hash=$1 AND expires_at>now() RETURNING verifier,purpose,user_id,next_path',[tokenHash(browser)])).rows[0];
  if (!flow) throw new AccountError('AUTH_EXPIRED', 401);
  const result = await authRequest('/token?grant_type=pkce', 'POST', { auth_code: code, code_verifier: flow.verifier });
  const user = await authRequest('/user', 'GET', undefined, result.access_token) as AuthUser;
  if (!user?.id || flow.user_id && flow.user_id !== user.id) throw new AccountError('AUTH_EXPIRED', 401);
  await accountView(user); setAccountTokens(result, headers);
  if(accountRequiresMFA(user,result.access_token!))return '/account?mfa=1&next='+encodeURIComponent(flow.purpose==='recover'?'/account?tab=security&recovery=1':accountNext(flow.next_path));
  await cancelAccountDeletion(user.id);
  return flow.purpose === 'recover' ? '/account?tab=security&recovery=1' : accountNext(flow.next_path);
}

export function accountProviderEnabled(provider:string,settings:AuthResult) {
  if(provider==='modrinth')return process.env.ZO7AL_ACCOUNT_MODRINTH_ENABLED==='true'&&!!process.env.MODRINTH_MEMBER_CLIENT_ID&&!!process.env.MODRINTH_MEMBER_CLIENT_SECRET&&!!process.env.SUPABASE_SECRET_KEY;
  if(provider==='x'||provider==='twitter')return false;
  return settings.external?.[provider]===true;
}
export async function accountPasskeysEnabled() { return (await authRequest('/settings')).passkeys_enabled===true; }
export async function cancelAccountDeletion(id:string) {
 await assertAccountAllowed(id);
 await (await siteDatabase()).query('UPDATE site_accounts SET deletion_due_at=NULL WHERE id=$1 AND deletion_due_at>now() AND deleted_at IS NULL',[id]);
}
