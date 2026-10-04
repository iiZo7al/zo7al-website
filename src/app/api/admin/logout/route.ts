import { adminCookie, privateHeaders, sameOrigin } from "@/lib/server/site-security";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  return Response.json({ok:true},{headers:{...privateHeaders,"Set-Cookie":adminCookie("",true)}});
}
