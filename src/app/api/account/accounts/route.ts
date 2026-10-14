import {AccountError,accountHeaders,accountOrigin} from '@/lib/server/account-auth';
import {rememberAccount,switchSavedAccount} from '@/lib/server/account-switcher';
import {readJSON} from '@/lib/server/site-security';
import {limitAttempt} from '@/lib/server/site-content';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers=accountHeaders();
 try{
  if(!accountOrigin(request))throw new AccountError('INVALID',403);
  const body=await readJSON(request,1024) as Record<string,unknown>;
  if(!body||!['remember','switch'].includes(String(body.action)))throw new AccountError('INVALID');
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';if(!await limitAttempt('account-switch:'+ip,30,900))throw new AccountError('RATE_LIMIT',429);
  return Response.json(body.action==='remember'?{accounts:await rememberAccount(request,headers)}:await switchSavedAccount(request,headers,body.id),{headers});
 }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
