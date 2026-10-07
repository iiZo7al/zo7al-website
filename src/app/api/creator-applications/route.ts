import { accountUser } from "@/lib/server/account-auth";
import { createApplicationHandler } from "@/lib/server/creator-applications";
import { createTrackedRequest } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
export const runtime = "nodejs";
export async function POST(request:Request) {
  let userId:string|null;
  try {userId=(await accountUser(request))?.id??null;} catch {return Response.json({error:"UNAVAILABLE"},{status:503});}
  const handler = createApplicationHandler(() => process.env.DISCORD_APPLICATION_WEBHOOK_URL, fetch, process.env.DATABASE_URL ? {
  save: (application, reference) => createTrackedRequest("application", application, reference,userId),
  delivered: async (reference, receipt) => { await (await siteDatabase()).query("UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",[reference,receipt]); },
  discard: async reference => { await (await siteDatabase()).query("DELETE FROM site_requests WHERE id=$1 AND discord_receipt IS NULL",[reference]); },
} : undefined);

  return handler(request);
}
