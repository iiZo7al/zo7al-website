import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { siteDatabase } from "./site-db";
import { notifyDiscord } from "./discord-notifications";
import { tokenHash } from "./site-security";
import { validateContent } from "../data/hub-validation";
import type { HubTopic } from "../data/hub-validation";
import { validateApplication, sendApplicationNotification } from "./creator-applications";
export async function limitAttempt(key: string, limit: number, seconds: number) {
  const db = await siteDatabase();
  const hash = createHash("sha256").update(key).digest("hex");
  const result = await db.query("INSERT INTO site_rate_limits(key,attempts,expires_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN site_rate_limits.expires_at<=now() THEN 1 ELSE site_rate_limits.attempts+1 END, expires_at=CASE WHEN site_rate_limits.expires_at<=now() THEN excluded.expires_at ELSE site_rate_limits.expires_at END RETURNING attempts", [hash, seconds]);
  return result.rows[0].attempts <= limit;
}
export async function publicContent(kind: "news" | "event" | "rule", locale: string, topic: HubTopic | "all" = "minecraft") {
  try {
    const result = await (await siteDatabase()).query("SELECT c.id,c.kind,c.topic,c.locale,c.title,c.body,c.starts_at AS \"startsAt\",c.registration_url AS \"registrationUrl\",c.created_at AS \"createdAt\",CASE WHEN i.id IS NOT NULL THEN json_build_object('id',i.id,'width',i.width,'height',i.height) ELSE NULL END AS image FROM site_content c LEFT JOIN site_content_images i ON i.id=c.image_id WHERE c.kind=$1 AND c.published AND c.locale=$2 AND ($3='all' OR c.topic=$3) ORDER BY COALESCE(c.starts_at,c.created_at) DESC LIMIT 40", [kind,locale,topic]);
    return { items: result.rows, available: true };
  } catch { return { items: [], available: false }; }
}
export async function saveContent(value: unknown) {
  const content = validateContent(value); if (!content) throw new Error("INVALID");
  const id = content.id ?? randomUUID();
  const db = await siteDatabase();
  if (content.imageId && !(await db.query("SELECT id FROM site_content_images WHERE id=$1", [content.imageId])).rowCount) throw Error("INVALID");
  await db.query("INSERT INTO site_content(id,kind,locale,title,body,published,starts_at,registration_url,image_id,topic) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,locale=excluded.locale,title=excluded.title,body=excluded.body,published=excluded.published,starts_at=excluded.starts_at,registration_url=excluded.registration_url,image_id=excluded.image_id,topic=excluded.topic,updated_at=now()", [id,content.kind,content.locale,content.title,content.body,content.published,content.startsAt,content.registrationUrl,content.imageId,content.topic]);
  return id;
}
export async function createTrackedRequest(kind: "application" | "support" | "event", payload: unknown, id: string = randomUUID()) {
  const token = randomBytes(32).toString("hex");
  await (await siteDatabase()).query("INSERT INTO site_requests(id,kind,token_hash,payload,status) VALUES($1,$2,$3,$4,$5)", [id,kind,tokenHash(token),JSON.stringify(payload),kind === "support" ? "open" : "pending"]);
  return { reference: id, token };
}
export async function createOrderReceipt(ident: string, username: string, items: {packageId:number;quantity:number}[], products: {id:number;name:string}[] = []) {
  const reference = randomUUID(), token = randomBytes(32).toString("hex");
  const fields = { "Status": "Checkout created · Awaiting payment. This notification does not confirm payment or in-game delivery.", "Minecraft": username,
    "Items": items.map(item => (products.find(product => product.id === item.packageId)?.name?.slice(0,160) ?? ("Package #" + item.packageId)) + " × " + item.quantity).join("\n") };
  let stored = false;
  if (process.env.DATABASE_URL) {
    try {
      await (await siteDatabase()).query("INSERT INTO site_orders(id,token_hash,basket_ident,username,items,discord_payload) VALUES($1,$2,$3,$4,$5,$6)", [reference,tokenHash(token),ident,username,JSON.stringify(items),JSON.stringify(fields)]);
      stored = true;
    } catch {}
  }
  // Keep checkout usable during a notification outage. A stored notification can
  // be retried by the administrator; its access code never goes to Discord.
  try {
    const receipt = await notifyDiscord("order", reference, fields);
    if (stored) await (await siteDatabase()).query("UPDATE site_orders SET discord_receipt=$2 WHERE id=$1", [reference,receipt]).catch(()=>{});
  } catch {}
  return stored ? { reference, token } : null;
}
export async function retryOrderNotification(id: string) {
  const db = await siteDatabase();
  // Lock the row so concurrent admin clicks do not send duplicate messages.
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const order = (await client.query("SELECT discord_receipt,discord_payload FROM site_orders WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!order || !order.discord_payload) throw new Error("INVALID");
    if (!order.discord_receipt) {
      const receipt = await notifyDiscord("order", id, order.discord_payload);
      await client.query("UPDATE site_orders SET discord_receipt=$2 WHERE id=$1", [id,receipt]);
    }
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{});
    throw error;
  } finally { client.release(); }
}
export async function retryApplicationNotification(id: string) {
  const client = await (await siteDatabase()).connect();
  try {
    await client.query("BEGIN");
    const row = (await client.query("SELECT payload,discord_receipt FROM site_requests WHERE id=$1 AND kind='application' FOR UPDATE", [id])).rows[0];
    const application = validateApplication(row?.payload);
    if (!row || !application) throw Error("INVALID");
    if (!row.discord_receipt) {
      const receipt = await sendApplicationNotification(application, id, process.env.DISCORD_APPLICATION_WEBHOOK_URL);
      await client.query("UPDATE site_requests SET discord_receipt=$2,updated_at=now() WHERE id=$1 AND kind='application'", [id, receipt]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
  finally { client.release(); }
}
