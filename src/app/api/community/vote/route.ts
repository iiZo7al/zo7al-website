import { voter,vote } from "@/lib/server/community";
import { limitAttempt } from "@/lib/server/site-content";
import { sameOrigin,readJSON,privateHeaders } from "@/lib/server/site-security";
import { isUUID } from "@/lib/data/community";
export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'INVALID'},{status:403,headers:privateHeaders});
 try {
  const body=await readJSON(request,2000) as {poll?:unknown;option?:unknown};
  if(!isUUID(body.poll)||typeof body.option!=='number'||!Number.isInteger(body.option)||body.option<0||body.option>=8)return Response.json({error:'INVALID'},{status:400,headers:privateHeaders});
  const visitor=voter(request);if(!visitor)return Response.json({error:'UNAVAILABLE'},{status:503,headers:privateHeaders});
  if(visitor.cookie)return Response.json({error:'RETRY'},{status:409,headers:{...privateHeaders,'Set-Cookie':visitor.cookie}});
  if(!await limitAttempt('community-vote:'+(request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown'),10,900))return Response.json({error:'RATE_LIMIT'},{status:429,headers:privateHeaders});
  const added=await vote(body.poll,body.option,visitor.hash);return Response.json({ok:true,added},{headers:privateHeaders});
 }catch(error){return Response.json({error:error instanceof Error&&error.message==='CLOSED'?'CLOSED':'UNAVAILABLE'},{status:error instanceof Error&&error.message==='CLOSED'?409:503,headers:privateHeaders});}
}
