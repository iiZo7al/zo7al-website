import { communityEntries,saveCommunity,notifyCommunity } from "@/lib/server/community";
import { hasAdminSession,sameOrigin,readJSON,privateHeaders } from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { isUUID } from "@/lib/data/community";
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!hasAdminSession(request))return Response.json({error:'UNAUTHORIZED'},{status:401,headers:privateHeaders});try{return Response.json({entries:await communityEntries('en',true)},{headers:privateHeaders});}catch{return Response.json({error:'UNAVAILABLE'},{status:503,headers:privateHeaders});}}
export async function POST(request:Request){
 if(!hasAdminSession(request))return Response.json({error:'UNAUTHORIZED'},{status:401,headers:privateHeaders});
 if(!sameOrigin(request))return Response.json({error:'INVALID'},{status:403,headers:privateHeaders});
 try{const body=await readJSON(request,64000) as {action?:string;value?:unknown;id?:unknown};
  if(body.action==='save')return Response.json({ok:true,id:await saveCommunity(body.value)},{headers:privateHeaders});
  if(!isUUID(body.id))throw Error('INVALID');
  if(body.action==='reject')await(await siteDatabase()).query("UPDATE community_entries SET published=false,moderation='rejected',updated_at=now() WHERE id=$1 AND kind='gallery'",[body.id]);
  else if(body.action==='archive')await(await siteDatabase()).query('UPDATE community_entries SET published=false,updated_at=now() WHERE id=$1',[body.id]);
  else if(body.action==='retry')await notifyCommunity(body.id);
  else throw Error('INVALID');
  return Response.json({ok:true},{headers:privateHeaders});
 }catch(error){const code=error instanceof Error&&['INVALID','POLL_LOCKED'].includes(error.message)?error.message:'UNAVAILABLE';return Response.json({error:code},{status:code==='UNAVAILABLE'?503:400,headers:privateHeaders});}
}
