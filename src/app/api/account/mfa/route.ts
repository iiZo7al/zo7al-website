import QRCode from 'qrcode';
import {verifyAccountFactor as verifyCode,verifiedEmail,localRecoveryStatus,generateLocalRecoveryCodes} from '@/lib/server/account-verification';
import {hasAccountSecondFactor} from '@/lib/server/account-auth';
import {randomBytes} from 'node:crypto';
import {AccountError,accountHeaders,accountOrigin,authRequest,requireAccountSession,setAccountTokens,type AuthUser} from '@/lib/server/account-auth';
import {readJSON} from '@/lib/server/site-security';
import {siteDatabase} from '@/lib/server/site-db';
import {limitAttempt} from '@/lib/server/site-content';
import {cancelAccountDeletion} from '@/lib/server/account-auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const failed=(error:unknown,headers:Headers)=>Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});
const verified=(user:AuthUser)=>(user.factors??[]).filter(factor=>factor.factor_type==='totp'&&factor.status==='verified');
async function recoveryStatus(access:string,user:AuthUser) {
 const local=await localRecoveryStatus(user);if(local.enrolled)return {...local,local:true};
 try {const data=await authRequest('/factors/recovery-codes','GET',undefined,access);return {available:true,enrolled:true,remaining:data.remaining??0,total:data.total??0};}
 catch(error){if(error instanceof AccountError&&error.code==='MFA_NOT_FOUND')return {available:true,enrolled:false,remaining:0,total:0};if(error instanceof AccountError&&error.code==='MFA_UNAVAILABLE')return {...await localRecoveryStatus(user),native:false};throw error;}
}
export async function GET(request:Request) {
 const headers=accountHeaders();
 try {
  const {user,access}=await requireAccountSession(request,headers);
  const factors=verified(user).map(f=>({id:f.id,name:f.friendly_name??'Zo7al'}));
  const required=!await hasAccountSecondFactor(request,user,access);
  // Pending first-factor sessions can only see the challenge choices, not the account.
  if(required){const local=await localRecoveryStatus(user);return Response.json({required:true,enabled:true,factors,emailAvailable:!!verifiedEmail(user),recovery:{...local,enrolled:local.enrolled||(user.factors??[]).some(f=>f.factor_type==='recovery_code'&&f.status==='verified')}},{headers});}
  return Response.json({required:false,enabled:factors.length>0,factors,emailAvailable:!!verifiedEmail(user),recovery:await recoveryStatus(access,user)},{headers});
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
  const factors=verified(user),required=!await hasAccountSecondFactor(request,user,access);
  if(body.action==='verify') {await verifyCode(user,access,body,headers);await cancelAccountDeletion(user.id);return Response.json({ok:true},{headers});}
  if(body.action==='confirm') {
   if(required)throw new AccountError('MFA_REQUIRED',403);
   const tokens=await verifyCode(user,access,body,headers,true);
   try {
    const status=await recoveryStatus(tokens.access_token!,user);

    if(!status.enrolled) {
     try {
      const data=await authRequest('/factors/recovery-codes','POST',{},tokens.access_token);
      if(!data.codes?.length||data.codes.some(c=>!/^[a-z0-9]{16}$/i.test(c)))throw new AccountError('UNAVAILABLE',503);
      return Response.json({ok:true,codes:data.codes.map(c=>c.toUpperCase().match(/.{4}/g)!.join('-'))},{headers});
     }catch(error){if(!(error instanceof AccountError)||error.code!=='MFA_UNAVAILABLE')throw error;}
     return Response.json({ok:true,codes:await generateLocalRecoveryCodes(user)},{headers});
    }
   }catch(error){return Response.json({ok:true,recoveryError:error instanceof AccountError?error.code:'UNAVAILABLE'},{headers});}
   return Response.json({ok:true},{headers});
  }
  if(required)throw new AccountError('MFA_REQUIRED',403);
  if(body.action==='enroll') {
   const fresh=factors.length?await verifyCode(user,access,body,headers):null;
   for(const pending of user.factors??[])if(pending.factor_type==='totp'&&pending.status==='unverified'&&uuid(pending.id))await authRequest('/factors/'+pending.id,'DELETE',undefined,fresh?.access_token??access);
   const result=await authRequest('/factors','POST',{factor_type:'totp',friendly_name:'Zo7al '+randomBytes(3).toString('hex'),issuer:'Zo7al'},fresh?.access_token??access);
   if(!uuid(result.id)||!result.totp||!result.totp.qr_code||!result.totp.secret)throw new AccountError('UNAVAILABLE',503);
   const uri=result.totp.uri??'otpauth://totp/Zo7al:'+encodeURIComponent(user.email??user.id)+'?secret='+encodeURIComponent(result.totp.secret)+'&issuer=Zo7al';
   if(!uri.startsWith('otpauth://totp/')||uri.length>2048)throw new AccountError('UNAVAILABLE',503);
   const qr=await QRCode.toDataURL(uri,{width:256,margin:4,errorCorrectionLevel:'M'});
   return Response.json({id:result.id,qr,secret:result.totp.secret},{headers});
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
   const status=await recoveryStatus(freshAccess,user);
   if(body.action==='codes') {
    if('local' in status||'native' in status&&status.native===false)return Response.json({codes:await generateLocalRecoveryCodes(user)},{headers});
    const data=await authRequest('/factors/recovery-codes'+(status.enrolled?'/regenerate':''),'POST',{},freshAccess);
    if(!Array.isArray(data.codes)||data.codes.length===0||data.codes.some(c=>typeof c!=='string'||!/^[a-z0-9]{16}$/i.test(c)))throw new AccountError('UNAVAILABLE',503);
    return Response.json({codes:data.codes.map(c=>c.toUpperCase().match(/.{4}/g)!.join('-'))},{headers});
   }
   if(factors.length===1)await (await siteDatabase()).query('DELETE FROM site_account_recovery_codes WHERE user_id=$1',[user.id]);
   if(factors.length===1&&status.enrolled&&!('local' in status))await authRequest('/factors/recovery-codes','DELETE',undefined,freshAccess);
   await authRequest('/factors/'+target!.id,'DELETE',undefined,freshAccess);
   const updated=await authRequest('/token?grant_type=refresh_token','POST',{refresh_token:fresh.refresh_token});setAccountTokens(updated,headers);
   return Response.json({ok:true},{headers});
  }
  throw new AccountError('INVALID');
 }catch(error){return failed(error,headers);}
}
