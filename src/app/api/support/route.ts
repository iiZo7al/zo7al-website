import { AccountError,accountHeaders,requireAccount } from "@/lib/server/account-auth";
import { createTrackedRequest, limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import { notifyDiscord } from "@/lib/server/discord-notifications";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { validateSupport } from "@/lib/data/hub-validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  let reference: string | undefined;
  try {
    const headers=accountHeaders(),user=await requireAccount(request,headers);
    const payload = validateSupport(await readJSON(request,14000)); if (!payload) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!await limitAttempt("support:"+ip,3,900)||!await limitAttempt('support-account:'+user.id,3,900)) return Response.json({error:"RATE_LIMIT"},{status:429,headers});
    const receipt = await createTrackedRequest("support",payload,undefined,user.id); reference = receipt.reference;
    try {
    const discordId = await notifyDiscord("support",reference,{"Type":payload.type,"Email":payload.email,"Minecraft":payload.username,"Order":payload.order,"Subject":payload.subject,"Message":payload.message,...(payload.project?{Project:payload.project,ProjectTitle:payload.projectTitle??''}:{}),...(payload.version?{Version:payload.version}:{})});
    await (await siteDatabase()).query("UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",[reference,discordId]).catch(()=>{});
    } catch {return Response.json({ok:true,...receipt,notificationPending:true},{status:202,headers});}
    return Response.json({ok:true,...receipt},{headers});
  } catch(error) {
    return Response.json({error:error instanceof AccountError?error.code:"UNAVAILABLE"},{status:error instanceof AccountError?error.status:503,headers:privateHeaders});
  }
}
