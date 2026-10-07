import { accountHeaders, finishAccountFlow, publicOrigin } from '@/lib/server/account-auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  const headers=accountHeaders();let path='/account?auth=error';
  try { path=await finishAccountFlow(request,headers,new URL(request.url).searchParams.get('code')??''); } catch {}
  headers.set('Location',publicOrigin(request)+path);
  return new Response(null,{status:303,headers});
}
