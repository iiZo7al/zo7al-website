import { accountHeaders,clearAccount } from "@/lib/server/account-auth";
import { adminCookie, privateHeaders, sameOrigin } from "@/lib/server/site-security";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  const headers=accountHeaders();clearAccount(headers);headers.append("Set-Cookie",adminCookie("",true));
  return Response.json({ok:true},{headers});
}
