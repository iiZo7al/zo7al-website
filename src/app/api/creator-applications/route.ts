import { AccountError,accountHeaders,accountOrigin,requireAccount,accountView } from "@/lib/server/account-auth";
import { createApplicationHandler } from "@/lib/server/creator-applications";
import { createTrackedRequest,limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
export const runtime = "nodejs";
export async function POST(request:Request) {
  const headers=accountHeaders();
  let userId:string; let contact:{email:string;discord:string;minecraft:string};
  try {if(!accountOrigin(request))throw new AccountError('INVALID',403);const user=await requireAccount(request,headers);userId=user.id;const member=await accountView(user);const discord=member.providers.find(p=>p.provider==='discord');if(!discord)throw new AccountError('DISCORD_REQUIRED',400);if(!member.minecraft)throw new AccountError('LINK_REQUIRED',400);contact={email:member.email,discord:discord.name??'Discord',minecraft:member.minecraft.username};if(!await limitAttempt('creator-account:'+userId,3,900))throw new AccountError('RATE_LIMIT',429);} catch(error) {return Response.json({error:error instanceof AccountError?error.code:"UNAVAILABLE"},{status:error instanceof AccountError?error.status:503,headers});}
  const handler = createApplicationHandler(() => process.env.DISCORD_APPLICATION_WEBHOOK_URL, fetch, process.env.DATABASE_URL ? {
  save: (application, reference) => createTrackedRequest("application", application, reference,userId),
  delivered: async (reference, receipt) => { await (await siteDatabase()).query("UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",[reference,receipt]); },
  discard: async reference => { await (await siteDatabase()).query("DELETE FROM site_requests WHERE id=$1 AND discord_receipt IS NULL",[reference]); },
} : undefined);

  const response=await handler(request,contact!);
  headers.forEach((value,key)=>response.headers.set(key,value));
  return response;
}
