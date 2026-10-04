import { adminCookie, configuredAdmin, privateHeaders, readJSON, sameOrigin, signAdminSession, verifyAdminPassword } from "@/lib/server/site-security";
import { limitAttempt } from "@/lib/server/site-content";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  if (!configuredAdmin()) return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders});
  try {
    const body = await readJSON(request,2048) as {password?:unknown};
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!await limitAttempt("admin-global",40,60) || !await limitAttempt("admin:"+address,6,900)) return Response.json({error:"RATE_LIMIT"},{status:429,headers:{...privateHeaders,"Retry-After":"900"}});
    if (!await verifyAdminPassword(body?.password,process.env.ZO7AL_ADMIN_PASSWORD_HASH!)) return Response.json({error:"INVALID"},{status:401,headers:privateHeaders});
    const session = signAdminSession(process.env.ZO7AL_ADMIN_SESSION_SECRET!,process.env.ZO7AL_ADMIN_PASSWORD_HASH!);
    return Response.json({ok:true},{headers:{...privateHeaders,"Set-Cookie":adminCookie(session)}});
  } catch { return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders}); }
}
