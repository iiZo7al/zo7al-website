import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { siteDatabase } from './site-db';
import { tokenHash } from './site-security';
import { accountNext, safeAccountName, type SiteAccount } from '../data/account';

const secure = process.env.NODE_ENV === 'production';
export const ACCOUNT_ACCESS = secure ? '__Host-zo7al-access' : 'zo7al-access';
export const ACCOUNT_REFRESH = secure ? '__Host-zo7al-refresh' : 'zo7al-refresh';
const FLOW_COOKIE = secure ? '__Host-zo7al-account-flow' : 'zo7al-account-flow';
export type AuthFactor = { id: string; factor_type: string; status: string; friendly_name?: string };
export type AuthUser = { id: string; email?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; identities?: { id: string; identity_id?: string; provider: string }[]; factors?: AuthFactor[] };
export type AuthResult = { access_token?: string; refresh_token?: string; expires_in?: number; user?: AuthUser; url?: string; external?: Record<string, boolean>; email?: boolean; code?: string; msg?: string; id?: string; type?: string; totp?: {qr_code:string;secret:string;uri:string}; codes?:string[]; total?:number; remaining?:number };
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
export function clearAccount(headers: Headers) { setAccountCookie(headers, ACCOUNT_ACCESS, '', 0); setAccountCookie(headers, ACCOUNT_REFRESH, '', 0); }
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
    const code = response.status === 429 ? 'RATE_LIMIT' : response.status >= 500 ? 'UNAVAILABLE' : ['invalid_credentials','user_not_found'].includes(reason) ? 'CREDENTIALS' : reason === 'email_not_confirmed' ? 'EMAIL_CONFIRM' : ['weak_password','same_password'].includes(reason) ? 'PASSWORD' : ['provider_disabled','identity_already_exists','manual_linking_disabled'].includes(reason) ? 'PROVIDER' : ['session_not_found','refresh_token_not_found','refresh_token_already_used','bad_jwt'].includes(reason) || response.status === 401 ? 'AUTH_EXPIRED' : reason==='mfa_factor_not_found'?'MFA_NOT_FOUND':reason==='insufficient_aal'?'MFA_REQUIRED':['mfa_verification_failed','mfa_verification_rejected','mfa_challenge_expired'].includes(reason)?'MFA_CODE':path.startsWith('/factors')&&(response.status===404||/not_enabled|disabled/.test(reason??''))?'MFA_UNAVAILABLE':'INVALID';
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
export async function accountUser(request:Request,headers?:Headers):Promise<AuthUser|null> {
  const session=await accountSession(request,headers);if(!session)return null;
  if(accountRequiresMFA(session.user,session.access))throw new AccountError('MFA_REQUIRED',403);
  return session.user;
}
export async function requireAccountSession(request:Request,headers:Headers) {
  const session=await accountSession(request,headers);
  if(!session||!/^[a-f0-9-]{36}$/i.test(session.user.id))throw new AccountError('LOGIN_REQUIRED',401);
  return session;
}
export async function requireAccount(request: Request, headers?: Headers) { const user = await accountUser(request, headers); if (!user || !/^[a-f0-9-]{36}$/i.test(user.id)) throw new AccountError('LOGIN_REQUIRED', 401); return user; }
export async function accountView(user: AuthUser): Promise<SiteAccount> {
  const db = await siteDatabase();
  const fallback = safeAccountName(user.user_metadata?.full_name) ?? safeAccountName(user.user_metadata?.name) ?? user.email?.split('@')[0]?.slice(0,64) ?? 'Zo7al';
  await db.query('INSERT INTO site_accounts(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING', [user.id, fallback]);
  const row = (await db.query('SELECT a.name,l.uuid,l.username,l.linked_at FROM site_accounts a LEFT JOIN site_minecraft_links l ON l.user_id=a.id WHERE a.id=$1',[user.id])).rows[0];
  const rawAvatar = user.user_metadata?.avatar_url;
  let avatar: string | null = null;
  if (typeof rawAvatar === 'string' && rawAvatar.length < 1024) { try { const url = new URL(rawAvatar); if (url.protocol === 'https:' && !url.username && !url.password) avatar = url.href; } catch {} }
  return { id: user.id, name: row.name, email: user.email ?? '', avatar, providers: (user.identities ?? []).map(v => ({ id: v.identity_id ?? v.id, provider: v.provider })), minecraft: row.uuid ? { uuid: row.uuid, username: row.username, linkedAt: new Date(row.linked_at).toISOString() } : null };
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
  if(accountRequiresMFA(user,result.access_token!))return '/account?mfa=1&next='+encodeURIComponent(flow.purpose==='recover'?'/account?tab=password&recovery=1':accountNext(flow.next_path));
  return flow.purpose === 'recover' ? '/account?tab=password&recovery=1' : accountNext(flow.next_path);
}
