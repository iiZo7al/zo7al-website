import { randomUUID, createHash } from "node:crypto";
import { hasAdminSession } from "@/lib/server/admin-account";
import {  privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { saveContent, retryOrderNotification, retryApplicationNotification, limitAttempt } from "@/lib/server/site-content";
import { validReview } from "@/lib/data/hub-validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  try {
    const db = await siteDatabase();
    const [content,requests,orders] = await Promise.all([
      db.query(`SELECT c.poll_id AS "pollId",CASE WHEN p.id IS NOT NULL THEN json_build_object('question',p.title,'options',p.payload->'options','endsAt',p.payload->'endsAt') ELSE NULL END AS poll,c.id,c.kind,c.topic,c.locale,c.title,c.body,c.published,c.created_at AS "createdAt",c.starts_at AS "startsAt",c.registration_url AS "registrationUrl",CASE WHEN i.id IS NOT NULL THEN json_build_object('id',i.id,'width',i.width,'height',i.height) ELSE NULL END AS image FROM site_content c LEFT JOIN community_entries p ON p.id=c.poll_id LEFT JOIN site_content_images i ON i.id=c.image_id ORDER BY c.created_at DESC LIMIT 100`),
      db.query('SELECT id,kind,payload,status,public_note AS "note",created_at AS "createdAt",discord_receipt AS "discordReceipt" FROM site_requests ORDER BY created_at DESC LIMIT 250'),
      db.query('SELECT id,username,items,discord_receipt AS "discordReceipt",created_at AS "createdAt" FROM site_orders ORDER BY created_at DESC LIMIT 100')
    ]);
    return Response.json({content:content.rows,requests:requests.rows,orders:orders.rows},{headers:privateHeaders});
  } catch { return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders}); }
}
export async function POST(request: Request) {
  if (!await hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  try {
    const body = await readJSON(request,131072) as {action?:string;value?:unknown;id?:unknown};
    if (body?.action === "content") { const id = await saveContent(body.value); return Response.json({ok:true,id},{headers:privateHeaders}); }
    if (body?.action === "retryDiscord" && typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) { await retryOrderNotification(body.id); return Response.json({ok:true},{headers:privateHeaders}); }
    if (body?.action === "retryApplication" && typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      if (!await limitAttempt("admin-application-notification", 10, 60)) return Response.json({error:"RATE_LIMIT"},{status:429,headers:privateHeaders});
      await retryApplicationNotification(body.id); return Response.json({ok:true},{headers:privateHeaders});
    }
    if (body?.action === "review") {
      const review = validReview(body.value); if (!review) throw new Error("INVALID");
      const result = await (await siteDatabase()).query("UPDATE site_requests SET status=$3,public_note=$4,updated_at=now() WHERE id=$1 AND kind=$2 RETURNING id",[review.id,review.kind,review.status,review.note]);
      if (!result.rowCount) return Response.json({error:"INVALID"},{status:404,headers:privateHeaders});
      return Response.json({ok:true},{headers:privateHeaders});
    }
    if (body?.action === "delete" && typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      await (await siteDatabase()).query("WITH removed AS (DELETE FROM site_content WHERE id=$1 RETURNING poll_id) UPDATE community_entries SET published=false,updated_at=now() WHERE id IN (SELECT poll_id FROM removed)",[body.id]);
      return Response.json({ok:true},{headers:privateHeaders});
    }
    if (body?.action === "deleteRequest" && typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      await (await siteDatabase()).query("DELETE FROM site_requests WHERE id=$1",[body.id]);
      return Response.json({ok:true},{headers:privateHeaders});
    }
    if (body?.action === "importSolar") {
      const items = Array.isArray(body.value) ? body.value : [];
      if (!items.length || items.length > 200) throw new Error("INVALID");
      const db = await siteDatabase();
      let inserted = 0;
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue;
        const r = raw as Record<string, unknown>;
        const name = typeof r.name === "string" ? r.name.trim().slice(0, 80) : "";
        if (!name) continue;
        const statusRaw = typeof r.status === "string" ? r.status.trim().toLowerCase() : "accepted";
        const status = ["pending", "accepted", "rejected"].includes(statusRaw) ? statusRaw : "accepted";
        const note = typeof r.note === "string" ? r.note.trim().slice(0, 2000) : "";
        const role = typeof r.role === "string" && ["admin", "creator", "streamer", "writer", "editor", "designer", "player"].includes(r.role) ? r.role : "creator";
        const payload = {
          platform: "solar",
          name,
          nickname: typeof r.nickname === "string" ? r.nickname.trim().slice(0, 80) : name,
          age: typeof r.age === "string" || typeof r.age === "number" ? String(r.age).trim().slice(0, 10) : undefined,
          country: typeof r.country === "string" ? r.country.trim().slice(0, 80) : undefined,
          discord: typeof r.discord === "string" ? r.discord.trim().slice(0, 50) : "",
          whatsapp: typeof r.whatsapp === "string" ? r.whatsapp.trim().slice(0, 30) : "",
          role,
          adminSubType: typeof r.adminSubType === "string" && r.adminSubType.trim() ? r.adminSubType.trim() : undefined,
          game: typeof r.game === "string" && r.game.trim() ? r.game.trim() : undefined,
          channelUrl: typeof r.url === "string" && r.url.trim() ? r.url.trim().slice(0, 500) : undefined,
          experienceDuration: typeof r.experienceDuration === "string" ? r.experienceDuration.trim().slice(0, 200) : undefined,
          contractDuration: typeof r.contractDuration === "string" ? r.contractDuration.trim().slice(0, 100) : "3_months",
          whyJoin: typeof r.whyJoin === "string" ? r.whyJoin.trim().slice(0, 2000) : "مستورد عبر جدول Excel / CSV",
          bio: typeof r.whyJoin === "string" ? r.whyJoin.trim().slice(0, 2000) : "مستورد عبر جدول Excel / CSV",
          subject: `عضو / طلب كلان Solar — ${name}`,
          importedAt: new Date().toISOString(),
        };
        const id = randomUUID();
        const tokenHash = createHash("sha256").update(randomUUID()).digest("hex");
        await db.query(
          "INSERT INTO site_requests (id, kind, token_hash, payload, status, public_note) VALUES ($1, 'application', $2, $3, $4, $5)",
          [id, tokenHash, JSON.stringify(payload), status, note]
        );
        inserted++;
      }
      return Response.json({ ok: true, inserted }, { headers: privateHeaders });
    }
    throw new Error("INVALID");
  } catch(error) { return Response.json({error:error instanceof Error && ['INVALID','POLL_LOCKED'].includes(error.message)?error.message:'UNAVAILABLE'},{status:error instanceof Error && ['INVALID','POLL_LOCKED'].includes(error.message)?400:503,headers:privateHeaders}); }
}
