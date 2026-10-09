import {randomBytes} from 'node:crypto';
import {AccountError,accountHeaders,accountOrigin,accountRequiresMFA,authRequest,requireAccountSession,setAccountTokens,type AuthUser,type AuthResult} from '@/lib/server/account-auth';
import {readJSON,tokenHash} from '@/lib/server/site-security';
import {siteDatabase} from '@/lib/server/site-db';
import {limitAttempt} from '@/lib/server/site-content';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const failed=(error:unknown,headers:Headers)=>Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});
const verified=(user:AuthUser)=>(user.factors??[]).filter(factor=>factor.factor_type==='totp'&&factor.status==='verified');
async function recoveryStatus(access:string) {
 try {const data=await authRequest('/factors/recovery-codes','GET',undefined,access);return {enrolled:true,remaining:data.remaining??0,total:data.total??0};}
 catch(error){if(error instanceof AccountError&&error.code==='MFA_NOT_FOUND')return {enrolled:false,remaining:0,total:0};throw error;}
}
/** Supabase consumes/rejects replayed codes and owns the TOTP secret and code hashes. */
async function verifyCode(user:AuthUser,access:string,body:Record<string,unknown>,headers:Headers,allowUnverified=false):Promise<AuthResult> {
 let tokens:AuthResult;
 if(body.method==='recovery') {
  if(allowUnverified||typeof body.code!=='string'||!/^[a-z0-9]{16}$/i.test(body.code.replace(/[\s-]/g,'')))throw new AccountError('MFA_CODE');
  tokens=await authRequest('/factors/recovery-codes/verify','POST',{code:body.code},access);
 } else {
  const factor=(user.factors??[]).find(f=>f.id===body.factorId&&f.factor_type==='totp'&&(f.status==='verified'||allowUnverified&&f.status==='unverified'));
  if(!factor||!uuid(factor.id)||typeof body.code!=='string'||!/^\d{6}$/.test(body.code))throw new AccountError('MFA_CODE');
  // Reserve across concurrent requests; a fresh challenge must not reuse a TOTP.
  // Wrong/transient attempts also stay reserved until the next app code.
  const db=await siteDatabase();
  await db.query('DELETE FROM site_account_mfa_attempts WHERE expires_at<now()');
  const reserved=await db.query("INSERT INTO site_account_mfa_attempts(user_id,factor_id,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '2 minutes') ON CONFLICT DO NOTHING RETURNING user_id",[user.id,factor.id,tokenHash('mfa:'+user.id+':'+factor.id+':'+body.code)]);
  if(!reserved.rows.length)throw new AccountError('MFA_CODE');
  const challenge=await authRequest('/factors/'+factor.id+'/challenge','POST',{},access);
  if(!uuid(challenge.id))throw new AccountError('UNAVAILABLE',503);
  tokens=await authRequest('/factors/'+factor.id+'/verify','POST',{challenge_id:challenge.id,code:body.code},access);
 }
 if(!tokens.access_token||!tokens.refresh_token)throw new AccountError('AUTH_EXPIRED',401);
 const confirmed=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;
 if(confirmed.id!==user.id||accountRequiresMFA(confirmed,tokens.access_token))throw new AccountError('AUTH_EXPIRED',401);
 setAccountTokens(tokens,headers);return tokens;
}
export async function GET(request:Request) {
 const headers=accountHeaders();
 try {
  const {user,access}=await requireAccountSession(request,headers);
  const factors=verified(user).map(f=>({id:f.id,name:f.friendly_name??'Zo7al'}));
  const required=accountRequiresMFA(user,access);
  // Pending first-factor sessions can only see the challenge choices, not the account.
  if(required)return Response.json({required:true,enabled:true,factors,recovery:{enrolled:(user.factors??[]).some(f=>f.factor_type==='recovery_code'&&f.status==='verified'),remaining:0,total:0}},{headers});
  return Response.json({required:false,enabled:factors.length>0,factors,recovery:await recoveryStatus(access)},{headers});
 }catch(error){return failed(error,headers);}
}
export async function POST(request:Request) {
 const headers=accountHeaders();
 try {
  if(!accountOrigin(request))throw new AccountError('INVALID',403);
  const body=await readJSON(request,4096) as Record<string,unknown>;
  if(!body||typeof body.action!=='string')throw new AccountError('INVALID');
  const {user,access}=await requireAccountSession(request,headers);
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
  if(!await limitAttempt('mfa:ip:'+ip,20,900)||!await limitAttempt('mfa:user:'+user.id,10,600))throw new AccountError('RATE_LIMIT',429);
  const factors=verified(user),required=accountRequiresMFA(user,access);
  if(body.action==='verify') {await verifyCode(user,access,body,headers);return Response.json({ok:true},{headers});}
  if(body.action==='confirm') {
   if(required)throw new AccountError('MFA_REQUIRED',403);
   const tokens=await verifyCode(user,access,body,headers,true);
   try {
    const status=await recoveryStatus(tokens.access_token!);
    if(!status.enrolled) {
     const data=await authRequest('/factors/recovery-codes','POST',{},tokens.access_token);
     if(!data.codes?.length||data.codes.some(c=>!/^[a-z0-9]{16}$/i.test(c)))throw new AccountError('UNAVAILABLE',503);
     return Response.json({ok:true,codes:data.codes.map(c=>c.toUpperCase().match(/.{4}/g)!.join('-'))},{headers});
    }
   }catch(error){return Response.json({ok:true,recoveryError:error instanceof AccountError?error.code:'UNAVAILABLE'},{headers});}
   return Response.json({ok:true},{headers});
  }
  if(required)throw new AccountError('MFA_REQUIRED',403);
  if(body.action==='enroll') {
   if(process.env.ZO7AL_ACCOUNT_MFA_ENABLED!=='true'&&!factors.length)throw new AccountError('MFA_UNAVAILABLE',503);
   const fresh=factors.length?await verifyCode(user,access,body,headers):null;
   for(const pending of user.factors??[])if(pending.factor_type==='totp'&&pending.status==='unverified'&&uuid(pending.id))await authRequest('/factors/'+pending.id,'DELETE',undefined,fresh?.access_token??access);
   const result=await authRequest('/factors','POST',{factor_type:'totp',friendly_name:'Zo7al '+randomBytes(3).toString('hex'),issuer:'Zo7al'},fresh?.access_token??access);
   if(!uuid(result.id)||!result.totp||!result.totp.qr_code||!result.totp.secret)throw new AccountError('UNAVAILABLE',503);
   return Response.json({id:result.id,qr:result.totp.qr_code,secret:result.totp.secret},{headers});
  }
  if(body.action==='cancel') {
   const factor=(user.factors??[]).find(f=>f.id===body.factorId&&f.factor_type==='totp'&&f.status==='unverified');
   if(!factor||!uuid(factor.id))throw new AccountError('INVALID');
   await authRequest('/factors/'+factor.id,'DELETE',undefined,access);return Response.json({ok:true},{headers});
  }
  if(['codes','remove'].includes(body.action)) {
   if(!factors.length)throw new AccountError('INVALID');
   const target=body.action==='remove'?factors.find(f=>f.id===body.targetId):null;
   if(body.action==='remove'&&!target)throw new AccountError('INVALID');
   // Losing the app is recovered by enrolling a new app with a backup code first.
   if(target&&factors.length===1&&body.method==='recovery')throw new AccountError('MFA_APP_REQUIRED');
   const fresh=await verifyCode(user,access,body,headers),freshAccess=fresh.access_token!;
   const status=await recoveryStatus(freshAccess);
   if(body.action==='codes') {
    const data=await authRequest('/factors/recovery-codes'+(status.enrolled?'/regenerate':''),'POST',{},freshAccess);
    if(!Array.isArray(data.codes)||data.codes.length===0||data.codes.some(c=>typeof c!=='string'||!/^[a-z0-9]{16}$/i.test(c)))throw new AccountError('UNAVAILABLE',503);
    return Response.json({codes:data.codes.map(c=>c.toUpperCase().match(/.{4}/g)!.join('-'))},{headers});
   }
   if(factors.length===1&&status.enrolled)await authRequest('/factors/recovery-codes','DELETE',undefined,freshAccess);
   await authRequest('/factors/'+target!.id,'DELETE',undefined,freshAccess);
   const updated=await authRequest('/token?grant_type=refresh_token','POST',{refresh_token:fresh.refresh_token});setAccountTokens(updated,headers);
   return Response.json({ok:true},{headers});
  }
  throw new AccountError('INVALID');
 }catch(error){return failed(error,headers);}
}
