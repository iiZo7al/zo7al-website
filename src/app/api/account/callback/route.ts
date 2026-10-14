import { accountHeaders, finishAccountFlow, publicOrigin } from '@/lib/server/account-auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  const headers=accountHeaders();let path='/account?auth=error';
  const params=new URL(request.url).searchParams;
  if(params.get('error_code')==='identity_already_exists'||/already linked to another user/i.test(params.get('error_description')??''))path='/account?tab=connections&auth=identity-linked';
  else try { path=await finishAccountFlow(request,headers,new URL(request.url).searchParams.get('code')??''); } catch {}
  headers.set('Location',publicOrigin(request)+path);
  return new Response(null,{status:303,headers});
}
