import {randomBytes} from 'node:crypto';
import {AccountError,accountHeaders,accountOrigin,authRequest,requireAccountSession,accountSessionId,requestCookie,setAccountCookie,setAccountTokens,grantAccountSecondFactor,cancelAccountDeletion,type AuthUser} from '@/lib/server/account-auth';
import {verifiedEmail,verificationPurpose,verifyAccountFactor,issueActionProof} from '@/lib/server/account-verification';
import {siteDatabase} from '@/lib/server/site-db';
import {readJSON,tokenHash} from '@/lib/server/site-security';
import {limitAttempt} from '@/lib/server/site-content';
export const runtime='nodejs';export const dynamic='force-dynamic';
const COOKIE=process.env.NODE_ENV==='production'?'__Host-zo7al-email-proof':'zo7al-email-proof';
export async function POST(request:Request){
 const headers=accountHeaders();
 try{
  if(!accountOrigin(request))throw new AccountError('INVALID',403);
  const body=await readJSON(request,2048) as Record<string,unknown>,{user,access}=await requireAccountSession(request,headers);
  if(!await limitAttempt('verification:'+user.id,12,600))throw new AccountError('RATE_LIMIT',429);
  const purpose=body.purpose??'login',target=typeof body.target==='string'?body.target:'';
  if(purpose!=='login'&&!verificationPurpose(purpose)||target.length>160||purpose==='unlink-identity'&&!/^(?:[a-f0-9-]{36}|modrinth:[a-zA-Z0-9]{1,128})$/.test(target)||purpose!=='unlink-identity'&&target)throw new AccountError('INVALID');
  if(body.action==='send-email'){
   const email=verifiedEmail(user),session=accountSessionId(user,access);if(!email)throw new AccountError('EMAIL_UNAVAILABLE',400);if(!session)throw new AccountError('AUTH_EXPIRED',401);
   if(!await limitAttempt('verification-email:'+user.id,1,60))throw new AccountError('RATE_LIMIT',429);
   const browser=randomBytes(32).toString('hex'),db=await siteDatabase();await db.query('DELETE FROM site_account_email_challenges WHERE expires_at<now()');
   await authRequest('/otp','POST',{email,create_user:false});
   await db.query("INSERT INTO site_account_email_challenges(browser_hash,user_id,session_id,email,purpose,target,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '5 minutes')",[tokenHash(browser),user.id,session,email,purpose,target]);setAccountCookie(headers,COOKIE,browser,300);
   return Response.json({ok:true,message:'EMAIL_SENT'},{headers});
  }
  let freshAccess=access;
  if(body.action==='verify-email'){
   const browser=requestCookie(request,COOKIE);if(!/^[a-f0-9]{64}$/.test(browser)||typeof body.code!=='string'||!/^\d{6,10}$/.test(body.code))throw new AccountError('MFA_CODE');
   const db=await siteDatabase(),row=(await db.query('UPDATE site_account_email_challenges SET attempts=attempts+1 WHERE browser_hash=$1 AND user_id=$2 AND session_id=$3 AND purpose=$4 AND target=$5 AND expires_at>now() AND attempts<5 RETURNING email',[tokenHash(browser),user.id,accountSessionId(user,access),purpose,target])).rows[0];if(!row||row.email!==verifiedEmail(user))throw new AccountError('MFA_CODE');
   let tokens;try{tokens=await authRequest('/verify','POST',{type:'email',email:row.email,token:body.code});}catch(error){if(error instanceof AccountError&&['RATE_LIMIT','UNAVAILABLE'].includes(error.code))throw error;throw new AccountError('MFA_CODE');}
   if(!tokens.access_token||!tokens.refresh_token)throw new AccountError('AUTH_EXPIRED',401);
   const confirmed=await authRequest('/user','GET',undefined,tokens.access_token) as AuthUser;if(confirmed.id!==user.id||verifiedEmail(confirmed)!==row.email)throw new AccountError('AUTH_EXPIRED',401);
   const consumed=await db.query('DELETE FROM site_account_email_challenges WHERE browser_hash=$1 RETURNING user_id',[tokenHash(browser)]);if(!consumed.rows.length)throw new AccountError('MFA_CODE');
   setAccountCookie(headers,COOKIE,'',0);setAccountTokens(tokens,headers);freshAccess=tokens.access_token;await grantAccountSecondFactor(confirmed,freshAccess,headers);
  }else if(body.action==='verify-factor'){
   freshAccess=(await verifyAccountFactor(user,access,body,headers)).access_token!;
  }else throw new AccountError('INVALID');
  await cancelAccountDeletion(user.id);
  return Response.json({ok:true,...(purpose==='login'?{}:{proof:await issueActionProof(user,freshAccess,String(purpose),target)})},{headers});
 }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
