import { AccountError, accountHeaders, publicOrigin } from '@/lib/server/account-auth';
import { finishMemberModrinth } from '@/lib/server/member-modrinth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 const headers=accountHeaders();let path='/account?auth=error';
 try {path=await finishMemberModrinth(request,headers);}catch(error){if(error instanceof AccountError&&error.code==='IDENTITY_LINKED')path='/account?tab=connections&auth=identity-linked';}
 headers.set('Location',publicOrigin(request)+path);return new Response(null,{status:303,headers});
}
