import { accountUser } from "@/lib/server/account-auth";
import { limitAttempt } from "@/lib/server/site-content";
import { siteDatabase } from "@/lib/server/site-db";
import { privateHeaders, readJSON, sameOrigin, tokenHash, validReceipt } from "@/lib/server/site-security";
import { tebexRequest, tebexToken } from "@/lib/server/tebex";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"INVALID"},{status:403,headers:privateHeaders});
  try {
    const body = await readJSON(request,2000) as {reference?:string;token?:string;kind?:string};
    const kind=body?.kind;
    const user = await accountUser(request);
    const hasReceipt = validReceipt(body);
    if ((!hasReceipt && !(user && typeof body.reference === "string" && /^[a-f0-9-]{36}$/i.test(body.reference))) || !["order","application","support","event"].includes(String(kind))) return Response.json({error:"INVALID"},{status:400,headers:privateHeaders});
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0]??"unknown";
    if(!await limitAttempt("tracking:"+ip,30,60))return Response.json({error:"RATE_LIMIT"},{status:429,headers:privateHeaders});
    const db = await siteDatabase();
    if (kind !== "order") {
      const found = (await db.query('SELECT id AS reference,kind,status,public_note AS note,payload,created_at AS "createdAt",updated_at AS "updatedAt" FROM site_requests WHERE id=$1 AND (token_hash=$2 OR user_id=$4) AND kind=$3',[body.reference,hasReceipt?tokenHash(body.token!):null,kind,user?.id??null])).rows[0];
      if (!found) return Response.json({error:"NOT_FOUND"},{status:404,headers:privateHeaders});
      return Response.json({reference:found.reference,kind:found.kind,status:found.status,note:found.note,createdAt:found.createdAt,updatedAt:found.updatedAt,platform:found.payload.platform??null,eventTitle:found.kind==="event"?found.payload.eventTitle:null},{headers:privateHeaders});
    }
    const order = (await db.query("SELECT id,username,items,basket_ident,created_at FROM site_orders WHERE id=$1 AND (token_hash=$2 OR user_id=$3)",[body.reference,hasReceipt?tokenHash(body.token!):null,user?.id??null])).rows[0];
    if (!order) return Response.json({error:"NOT_FOUND"},{status:404,headers:privateHeaders});
    let paid: boolean | null = null;
    const token = tebexToken();
    if (token) {
      try { const basket = await tebexRequest(`accounts/${encodeURIComponent(token)}/baskets/${encodeURIComponent(order.basket_ident)}`); if (basket.data?.ident === order.basket_ident && typeof basket.data.complete === "boolean") paid = basket.data.complete; } catch {}
    }
    let delivery: "unknown" | "pending" | "delivered" = "unknown";
    // A paid basket does not prove in-game delivery. Only the trusted server can.
    if (paid && process.env.MINECRAFT_ORDER_STATUS_URL) {
      try {
        const u = new URL(process.env.MINECRAFT_ORDER_STATUS_URL);
        if (u.protocol==="https:" && !u.username && !u.password) {
          u.searchParams.set("reference",order.id); u.searchParams.set("basket",order.basket_ident);
          const response = await fetch(u,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(4000),headers:{Accept:"application/json",...(process.env.MINECRAFT_PROFILE_TOKEN?{Authorization:`Bearer ${process.env.MINECRAFT_PROFILE_TOKEN}`}:{})}});
          const result = response.ok ? await response.json() : null;
          if (result?.reference===order.id && ["pending","delivered"].includes(result.delivery)) delivery=result.delivery;
        }
      } catch {}
    }
    return Response.json({reference:order.id,kind:"order",username:order.username,items:order.items,createdAt:order.created_at,status:paid===null?"unknown":paid?"paid":"awaitingPayment",delivery},{headers:privateHeaders});
  } catch { return Response.json({error:"UNAVAILABLE"},{status:503,headers:privateHeaders}); }
}
