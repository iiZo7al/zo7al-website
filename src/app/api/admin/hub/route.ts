import { hasAdminSession, privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { siteDatabase } from "@/lib/server/site-db";
import { saveContent, retryOrderNotification, retryApplicationNotification, limitAttempt } from "@/lib/server/site-content";
import { validReview } from "@/lib/data/hub-validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  try {
    const db = await siteDatabase();
    const [content,requests,orders] = await Promise.all([
      db.query('SELECT c.id,c.kind,c.topic,c.locale,c.title,c.body,c.published,c.created_at AS "createdAt",c.starts_at AS "startsAt",c.registration_url AS "registrationUrl",CASE WHEN i.id IS NOT NULL THEN json_build_object(\'id\',i.id,\'width\',i.width,\'height\',i.height) ELSE NULL END AS image FROM site_content c LEFT JOIN site_content_images i ON i.id=c.image_id ORDER BY c.created_at DESC LIMIT 100'),
      db.query('SELECT id,kind,payload,status,public_note AS "note",created_at AS "createdAt",discord_receipt AS "discordReceipt" FROM site_requests ORDER BY created_at DESC LIMIT 100'),
      db.query('SELECT id,username,items,discord_receipt AS "discordReceipt",created_at AS "createdAt" FROM site_orders ORDER BY created_at DESC LIMIT 100')
    ]);
    return Response.json({content:content.rows,requests:requests.rows,orders:orders.rows},{headers:privateHeaders});
  } catch { return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders}); }
}
export async function POST(request: Request) {
  if (!hasAdminSession(request)) return Response.json({error:"UNAUTHORIZED"},{status:401,headers:privateHeaders});
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  try {
    const body = await readJSON(request,64000) as {action?:string;value?:unknown;id?:unknown};
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
      await (await siteDatabase()).query("DELETE FROM site_content WHERE id=$1",[body.id]);
      return Response.json({ok:true},{headers:privateHeaders});
    }
    throw new Error("INVALID");
  } catch(error) { return Response.json({error:error instanceof Error && error.message === "INVALID" ? "INVALID":"UNAVAILABLE"},{status:error instanceof Error && error.message === "INVALID" ? 400:503,headers:privateHeaders}); }
}
