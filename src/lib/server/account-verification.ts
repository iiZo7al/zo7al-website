import 'server-only';
import {randomBytes} from 'node:crypto';
import {AccountError,accountView,authRequest,accountRequiresMFA,grantAccountSecondFactor,setAccountTokens,type AuthUser,type AuthResult,accountSessionId} from './account-auth';
import {siteDatabase} from './site-db';
import {tokenHash} from './site-security';

export const verifiedFactors=(user:AuthUser)=>(user.factors??[]).filter(f=>f.factor_type==='totp'&&f.status==='verified');
export function verifiedEmail(user:AuthUser){return typeof user.email==='string'&&!!user.email_confirmed_at&&!user.email.endsWith('@modrinth.accounts.zo7al.is-a.dev')?user.email:null;}
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
export async function localRecoveryStatus(user:AuthUser){
 const row=(await (await siteDatabase()).query('SELECT count(*) AS total,count(*) FILTER(WHERE used_at IS NULL) AS remaining FROM site_account_recovery_codes WHERE user_id=$1',[user.id])).rows[0];
 return {available:true,enrolled:Number(row?.total)>0,total:Number(row?.total??0),remaining:Number(row?.remaining??0)};
}
export async function generateLocalRecoveryCodes(user:AuthUser){
 await accountView(user);
 const codes=Array.from({length:10},()=>randomBytes(16).toString('hex').toUpperCase()),db=await siteDatabase(),client=await db.connect();
 try{await client.query('BEGIN');await client.query('SELECT id FROM site_accounts WHERE id=$1 FOR UPDATE',[user.id]);await client.query('DELETE FROM site_account_recovery_codes WHERE user_id=$1',[user.id]);for(const code of codes)await client.query('INSERT INTO site_account_recovery_codes(user_id,code_hash) VALUES($1,$2)',[user.id,tokenHash('backup:'+user.id+':'+code)]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 return codes.map(c=>c.match(/.{4}/g)!.join('-'));
}
export async function verifyAccountFactor(user:AuthUser,access:string,body:Record<string,unknown>,headers:Headers,allowUnverified=false):Promise<AuthResult>{
 let tokens:AuthResult;
 if(body.method==='recovery'){
  if(allowUnverified||!verifiedFactors(user).length||typeof body.code!=='string')throw new AccountError('MFA_CODE');
  const normalized=body.code.replace(/[\s-]/g,'').toUpperCase();
  if(/^[A-F0-9]{32}$/.test(normalized)){
   const result=await (await siteDatabase()).query('UPDATE site_account_recovery_codes SET used_at=now() WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL RETURNING code_hash',[user.id,tokenHash('backup:'+user.id+':'+normalized)]);
   if(!result.rows.length)throw new AccountError('MFA_CODE');
   await grantAccountSecondFactor(user,access,headers);return {access_token:access};
  }
  if(!/^[a-z0-9]{16}$/i.test(normalized))throw new AccountError('MFA_CODE');
  tokens=await authRequest('/factors/recovery-codes/verify','POST',{code:body.code},access);
 }else{
  const factor=(user.factors??[]).find(f=>f.id===body.factorId&&f.factor_type==='totp'&&(f.status==='verified'||allowUnverified&&f.status==='unverified'));
  if(!factor||!uuid(factor.id)||typeof body.code!=='string'||!/^\d{6}$/.test(body.code))throw new AccountError('MFA_CODE');
  const db=await siteDatabase();await db.query('DELETE FROM site_account_mfa_attempts WHERE expires_at<now()');
  const reserved=await db.query("INSERT INTO site_account_mfa_attempts(user_id,factor_id,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '2 minutes') ON CONFLICT DO NOTHING RETURNING user_id",[user.id,factor.id,tokenHash('mfa:'+user.id+':'+factor.id+':'+body.code)]);
  if(!reserved.rows.length)throw new AccountError('MFA_CODE');
  const challenge=await authRequest('/factors/'+factor.id+'/challenge','POST',{},access);if(!uuid(challenge.id))throw new AccountError('UNAVAILABLE',503);
  tokens=await authRequest('/factors/'+factor.id+'/verify','POST',{challenge_id:challenge.id,code:body.code},access);
 }
 if(!tokens.access_token||!tokens.refresh_token)throw new AccountError('AUTH_EXPIRED',401);
 const confirmed=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;
 if(confirmed.id!==user.id||accountRequiresMFA(confirmed,tokens.access_token))throw new AccountError('AUTH_EXPIRED',401);
 setAccountTokens(tokens,headers);return tokens;
}
const purposes=['delete-account','unlink-identity','unlink-minecraft'] as const;
export function verificationPurpose(value:unknown):value is typeof purposes[number]{return purposes.some(p=>p===value);}
export async function issueActionProof(user:AuthUser,access:string,purpose:string,target:string){
 const session=accountSessionId(user,access),proof=randomBytes(32).toString('hex');
 if(!session)throw new AccountError('AUTH_EXPIRED',401);
 const db=await siteDatabase();await db.query('DELETE FROM site_account_action_proofs WHERE expires_at<now()');
 await db.query("INSERT INTO site_account_action_proofs(token_hash,user_id,session_id,purpose,target,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '5 minutes')",[tokenHash(proof),user.id,session,purpose,target]);return proof;
}
export async function requireActionProof(user:AuthUser,access:string,proof:unknown,purpose:string,target=''){
 if(typeof proof!=='string'||!/^[a-f0-9]{64}$/.test(proof))throw new AccountError('VERIFICATION_REQUIRED',403);
 const session=accountSessionId(user,access);if(!session)throw new AccountError('AUTH_EXPIRED',401);
 const result=await (await siteDatabase()).query('DELETE FROM site_account_action_proofs WHERE token_hash=$1 AND user_id=$2 AND session_id=$3 AND purpose=$4 AND target=$5 AND expires_at>now() RETURNING user_id',[tokenHash(proof),user.id,session,purpose,target]);
 if(!result.rows.length)throw new AccountError('VERIFICATION_REQUIRED',403);
}
