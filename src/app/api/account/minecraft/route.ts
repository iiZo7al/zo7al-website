import { AccountError, accountHeaders, accountOrigin, requireAccount, accountView } from '@/lib/server/account-auth';
import { createMinecraftLink } from '@/lib/server/account-minecraft';
import { readJSON } from '@/lib/server/site-security';
import { siteDatabase } from '@/lib/server/site-db';
import { limitAttempt } from '@/lib/server/site-content';
export const runtime='nodejs';
export async function POST(request:Request) {
  const headers=accountHeaders();
  try {
    if(!accountOrigin(request))throw new AccountError('INVALID',403);
    const user=await requireAccount(request,headers);await accountView(user);
    if(!await limitAttempt('account-link:'+user.id,8,600))throw new AccountError('RATE_LIMIT',429);
    const body=await readJSON(request,1024) as {action?:string;username?:unknown};
    if(body.action==='unlink') {
      const client=await (await siteDatabase()).connect();
      try {await client.query('BEGIN');await client.query('DELETE FROM site_minecraft_link_codes WHERE user_id=$1',[user.id]);await client.query('DELETE FROM site_minecraft_links WHERE user_id=$1',[user.id]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
      return Response.json({ok:true},{headers});
    }
    return Response.json(await createMinecraftLink(user.id,body.username),{headers});
  }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
