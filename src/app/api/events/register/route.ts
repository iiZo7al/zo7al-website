import { createTrackedRequest, limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import { notifyDiscord } from "@/lib/server/discord-notifications";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  let reference: string | undefined;
  try {
    const b = await readJSON(request,3000) as Record<string,unknown>;
    if (!b || typeof b.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.eventId) || typeof b.minecraft !== "string" || !/^[.a-zA-Z0-9_ ]{3,32}$/.test(b.minecraft) || typeof b.email !== "string" || b.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || typeof b.discord !== "string" || !b.discord.trim() || b.discord.length>40 || b.consent!==true || b.website) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const db = await siteDatabase();
    const event = (await db.query("SELECT title FROM site_content WHERE id=$1 AND kind='event' AND published AND starts_at>now()",[b.eventId])).rows[0];
    if (!event) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!await limitAttempt("event:"+ip,3,900)) return Response.json({error:"RATE_LIMIT"},{status:429,headers:privateHeaders});
    const payload = {eventId:b.eventId,eventTitle:event.title,minecraft:b.minecraft,email:b.email,discord:b.discord};
    const receipt = await createTrackedRequest("event",payload); reference = receipt.reference;
    const discordId = await notifyDiscord("event",reference,{"Event":event.title,"Minecraft":b.minecraft,"Email":b.email,"Discord":b.discord});
    await db.query("UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",[reference,discordId]).catch(()=>{});
    return Response.json({ok:true,...receipt},{headers:privateHeaders});
  } catch {
    if (reference) await siteDatabase().then(db=>db.query("DELETE FROM site_requests WHERE id=$1 AND discord_receipt IS NULL",[reference])).catch(()=>{});
    return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders});
  }
}
