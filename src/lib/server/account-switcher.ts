import 'server-only';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {AccountError,ACCOUNT_REFRESH,ACCOUNT_DEVICE,accountSession,accountView,authRequest,clearAccount,requestCookie,setAccountCookie,setAccountTokens,accountRequiresMFA,hasAccountSecondFactor,forgetSavedAccount,type AuthUser} from './account-auth';
import type {SiteAccount} from '../data/account';
import {siteDatabase} from './site-db';
import {tokenHash} from './site-security';

const validDevice=(value:string)=>/^[a-f0-9]{64}$/.test(value);
function key(){const secret=process.env.ZO7AL_ADMIN_SESSION_SECRET??'';if(secret.length<43)throw new AccountError('CONFIGURATION',503);return createHash('sha256').update('zo7al-account-switcher:'+secret).digest();}
function encode(value:unknown,binding:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(binding));const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join('.');}
function decode(value:string,binding:string):{refresh:string}{const [iv,tag,data,extra]=value.split('.');if(!iv||!tag||!data||extra||value.length>16000)throw new AccountError('AUTH_EXPIRED',401);const decipher=createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url'));decipher.setAAD(Buffer.from(binding));decipher.setAuthTag(Buffer.from(tag,'base64url'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8'));}
function responseCookie(headers:Headers,name:string){return headers.getSetCookie().filter(c=>c.startsWith(name+'=')).at(-1)?.split(';')[0].slice(name.length+1);}
export type SavedAccount=Pick<SiteAccount,'id'|'name'|'avatar'>;
export async function savedAccounts(request:Request):Promise<SavedAccount[]>{
 const device=requestCookie(request,ACCOUNT_DEVICE);if(!validDevice(device))return [];
 const rows=(await(await siteDatabase()).query('SELECT s.user_id AS id,a.name,a.avatar FROM site_account_saved_sessions s JOIN site_accounts a ON a.id=s.user_id WHERE device_hash=$1 AND expires_at>now() AND a.deleted_at IS NULL AND (a.deletion_due_at IS NULL OR a.deletion_due_at>now()) AND (a.banned_until IS NULL OR a.banned_until<=now()) ORDER BY s.updated_at DESC LIMIT 5',[tokenHash(device)])).rows;
 return rows.map(row=>({id:row.id,name:row.name,avatar:row.avatar??null}));
}
export async function rememberAccount(request:Request,headers:Headers){
 const session=await accountSession(request,headers);if(!session)throw new AccountError('LOGIN_REQUIRED',401);
 if(!await hasAccountSecondFactor(request,session.user,session.access))throw new AccountError('MFA_REQUIRED',403);
 const view=await accountView(session.user),refresh=responseCookie(headers,ACCOUNT_REFRESH)??requestCookie(request,ACCOUNT_REFRESH);if(!refresh)throw new AccountError('AUTH_EXPIRED',401);
 let device=requestCookie(request,ACCOUNT_DEVICE);if(!validDevice(device))device=randomBytes(32).toString('hex');const hash=tokenHash(device),db=await siteDatabase();
 await db.query('DELETE FROM site_account_saved_sessions WHERE expires_at<=now()');
 await db.query("INSERT INTO site_account_saved_sessions(device_hash,user_id,sealed,expires_at) VALUES($1,$2,$3,now()+interval '30 days') ON CONFLICT(device_hash,user_id) DO UPDATE SET sealed=excluded.sealed,expires_at=excluded.expires_at,updated_at=now()",[hash,view.id,encode({refresh},hash+':'+view.id)]);
 await db.query('DELETE FROM site_account_saved_sessions WHERE device_hash=$1 AND user_id NOT IN (SELECT user_id FROM site_account_saved_sessions WHERE device_hash=$1 ORDER BY updated_at DESC LIMIT 5)',[hash]);
 setAccountCookie(headers,ACCOUNT_DEVICE,device,30*86400);
 const cookies=(request.headers.get('cookie')??'').split(';').filter(c=>!c.trim().startsWith(ACCOUNT_DEVICE+'='));cookies.push(ACCOUNT_DEVICE+'='+device);
 return savedAccounts(new Request(request.url,{headers:{cookie:cookies.join('; ')}}));
}
export async function switchSavedAccount(request:Request,headers:Headers,id:unknown){
 const device=requestCookie(request,ACCOUNT_DEVICE);if(!validDevice(device)||typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw new AccountError('AUTH_EXPIRED',401);
 const hash=tokenHash(device),client=await(await siteDatabase()).connect();
 try{
  await client.query('BEGIN');const row=(await client.query('SELECT sealed FROM site_account_saved_sessions WHERE device_hash=$1 AND user_id=$2 AND expires_at>now() FOR UPDATE',[hash,id])).rows[0];if(!row)throw new AccountError('AUTH_EXPIRED',401);
  const saved=decode(row.sealed,hash+':'+id);if(typeof saved.refresh!=='string'||!saved.refresh||saved.refresh.length>3800)throw new AccountError('AUTH_EXPIRED',401);
  // Serialize refresh rotation per saved session and validate the returned subject remotely.
  const tokens=await authRequest('/token?grant_type=refresh_token','POST',{refresh_token:saved.refresh}),user=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;
  if(user.id!==id)throw new AccountError('AUTH_EXPIRED',401);
  const account=(await client.query('SELECT deleted_at,deletion_due_at,banned_until FROM site_accounts WHERE id=$1',[id])).rows[0];if(!account||account.deleted_at||account.deletion_due_at&&new Date(account.deletion_due_at).getTime()<=Date.now())throw new AccountError('ACCOUNT_DELETED',403);if(account.banned_until&&new Date(account.banned_until).getTime()>Date.now())throw new AccountError('ACCOUNT_BANNED',403);
  if(!tokens.access_token||!tokens.refresh_token||!Number.isFinite(tokens.expires_in))throw new AccountError('AUTH_EXPIRED',401);
  await client.query('UPDATE site_account_saved_sessions SET sealed=$3,updated_at=now() WHERE device_hash=$1 AND user_id=$2',[hash,id,encode({refresh:tokens.refresh_token},hash+':'+id)]);await client.query('COMMIT');
  clearAccount(headers);setAccountTokens(tokens,headers);return {ok:true,mfaRequired:accountRequiresMFA(user,tokens.access_token)};
 }catch(error){await client.query('ROLLBACK').catch(()=>{});if(error instanceof AccountError&&['AUTH_EXPIRED','ACCOUNT_DELETED','ACCOUNT_BANNED'].includes(error.code))await forgetSavedAccount(request,id);throw error;}finally{client.release();}
}
