import { communityEntries,voter } from "@/lib/server/community";
import { COMMUNITY_LOCALES } from "@/lib/data/community";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 const locale=new URL(request.url).searchParams.get('locale')??'en';
 if(!COMMUNITY_LOCALES.includes(locale))return Response.json({error:'INVALID'},{status:400});
 try {const visitor=voter(request,true),entries=await communityEntries(locale,false,visitor?.hash);return Response.json({entries,available:true,votingAvailable:!!visitor},{headers:{'Cache-Control':'private, no-store',...(visitor?.cookie?{'Set-Cookie':visitor.cookie}:{})}});}catch{return Response.json({entries:[],available:false,votingAvailable:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
