import { accountUser } from "@/lib/server/account-auth";
import { createTrackedRequest, limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import { notifyDiscord } from "@/lib/server/discord-notifications";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { eventPlayer } from "@/lib/data/hub-validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  let reference: string | undefined;
  try {
    const b = await readJSON(request,3000) as Record<string,unknown>;
    if (!b || typeof b.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.eventId) || typeof b.email !== "string" || b.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || typeof b.discord !== "string" || !b.discord.trim() || b.discord.length>40 || b.consent!==true || b.website) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const db = await siteDatabase();
    const event = (await db.query("SELECT title,topic FROM site_content WHERE id=$1 AND kind='event' AND published AND starts_at>now()",[b.eventId])).rows[0];
    if (!event) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const topic = event.topic === "fortnite" ? "fortnite" : "minecraft";
    const player = eventPlayer(b, topic);
    if (!player) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!await limitAttempt("event:"+ip,3,900)) return Response.json({error:"RATE_LIMIT"},{status:429,headers:privateHeaders});
    const payload = {eventId:b.eventId,eventTitle:event.title,topic,...player,email:b.email,discord:b.discord};
    const receipt = await createTrackedRequest("event",payload,undefined,(await accountUser(request))?.id??null); reference = receipt.reference;
    const discordId = await notifyDiscord("event",reference,{"Event":event.title,"Game":topic === "fortnite" ? "Fortnite" : "Minecraft",[topic === "fortnite" ? "Epic Games" : "Minecraft"]:player.epic ?? player.minecraft ?? "","Email":b.email,"Discord":b.discord});
    await db.query("UPDATE site_requests SET discord_receipt=$2 WHERE id=$1",[reference,discordId]).catch(()=>{});
    return Response.json({ok:true,...receipt},{headers:privateHeaders});
  } catch {
    if (reference) await siteDatabase().then(db=>db.query("DELETE FROM site_requests WHERE id=$1 AND discord_receipt IS NULL",[reference])).catch(()=>{});
    return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders});
  }
}
