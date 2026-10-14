import { AccountError, accountHeaders, accountOrigin, clearAccount, requireAccount } from '@/lib/server/account-auth';
import { adminCookie } from '@/lib/server/site-security';
import { scheduleAccountDeletion } from '@/lib/server/account-deletion';
import { readJSON } from '@/lib/server/site-security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
 const headers=accountHeaders();
 try {
  if(!accountOrigin(request))throw new AccountError('INVALID',403);
  const body=await readJSON(request,512) as {confirm?:unknown};
  if(body.confirm!==true)throw new AccountError('INVALID');
  const user=await requireAccount(request,headers),dueAt=await scheduleAccountDeletion(user.id);
  clearAccount(headers);headers.append('Set-Cookie',adminCookie('',true));
  return Response.json({ok:true,dueAt},{headers});
 }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
