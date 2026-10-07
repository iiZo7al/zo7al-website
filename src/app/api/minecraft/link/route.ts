import { AccountError, accountHeaders } from '@/lib/server/account-auth';
import { verifyMinecraftLink } from '@/lib/server/account-minecraft';
import { readJSON, tokenHash } from '@/lib/server/site-security';
import { limitAttempt } from '@/lib/server/site-content';
export const runtime='nodejs';
export async function POST(request:Request) {
  const headers=accountHeaders();
  const token=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if(!token)return Response.json({error:'UNAUTHORIZED'},{status:401,headers});
  try {
    if(!await limitAttempt('bridge-link:'+tokenHash(token),30,60))throw new AccountError('RATE_LIMIT',429);
    await verifyMinecraftLink(tokenHash(token),await readJSON(request,1024));
    return Response.json({ok:true,accepted:0},{headers});
  }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
