import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { siteDatabase } from "./site-db";
import { notifyDiscord } from "./discord-notifications";
import { validateCommunity, type CommunityEntry } from "../data/community";
import { tokenHash } from "./site-security";

const PUBLIC_COLUMNS = `e.id,e.kind,e.locale,e.topic,e.project_key AS "projectKey",e.title,e.body,e.payload,e.published,e.moderation,e.author,e.created_at AS "createdAt",e.updated_at AS "updatedAt",CASE WHEN i.id IS NOT NULL THEN json_build_object('id',i.id,'width',i.width,'height',i.height) ELSE NULL END AS image`;
export async function communityEntries(locale: string, admin = false) {
  const db = await siteDatabase();
  const result = await db.query(`SELECT ${PUBLIC_COLUMNS}${admin ? ',e.contact_email AS "contactEmail",e.discord_receipt AS "discordReceipt"' : ''} FROM community_entries e LEFT JOIN site_content_images i ON i.id=e.image_id
    WHERE $2::boolean OR (e.published AND e.moderation='approved' AND (e.locale=$1 OR (e.locale='en' AND NOT EXISTS(SELECT 1 FROM community_entries translated WHERE translated.kind=e.kind AND translated.project_key=e.project_key AND e.project_key<>'' AND (e.kind<>'changelog' OR translated.payload->>'version'=e.payload->>'version') AND translated.locale=$1 AND translated.published AND translated.moderation='approved')))) ORDER BY e.updated_at DESC LIMIT 200`,[locale,admin]);
  const rows = result.rows.map(row=>({...row,createdAt:new Date(row.createdAt).toISOString(),updatedAt:new Date(row.updatedAt).toISOString()})) as CommunityEntry[];
  const polls = rows.filter(row=>row.kind==='poll').map(row=>row.id);
  if (polls.length) {
    const votes = (await db.query('SELECT poll_id,option_index,count(*)::integer AS count FROM community_votes WHERE poll_id=ANY($1::uuid[]) GROUP BY poll_id,option_index',[polls])).rows;
    for (const row of rows.filter(row=>row.kind==='poll')) {
      row.votes = (row.payload.options as string[]).map((_,index)=>votes.find(v=>v.poll_id===row.id&&v.option_index===index)?.count??0);
    }
  }
  return rows;
}
export async function saveCommunity(value: unknown) {
  const entry = validateCommunity(value); if (!entry) throw Error('INVALID');
  const db = await siteDatabase(), id = entry.id ?? randomUUID();
  if (entry.imageId && !(await db.query('SELECT id FROM site_content_images WHERE id=$1',[entry.imageId])).rowCount) throw Error('INVALID');
  // Preserve submitted contact details and ballots; poll option edits cannot reassign votes.
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const previous = (await client.query('SELECT kind,payload FROM community_entries WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if (previous && previous.kind !== entry.kind) throw Error('INVALID');
    if (previous?.kind==='poll' && JSON.stringify(previous.payload.options)!==JSON.stringify(entry.payload.options) && (await client.query('SELECT 1 FROM community_votes WHERE poll_id=$1 LIMIT 1',[id])).rowCount) throw Error('POLL_LOCKED');
    await client.query(`INSERT INTO community_entries(id,kind,locale,topic,project_key,title,body,payload,published,moderation,author,image_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10,$11)
      ON CONFLICT(id) DO UPDATE SET locale=excluded.locale,topic=excluded.topic,project_key=excluded.project_key,title=excluded.title,body=excluded.body,payload=excluded.payload,published=excluded.published,moderation='approved',author=excluded.author,image_id=excluded.image_id,updated_at=now()`,[id,entry.kind,entry.locale,entry.topic,entry.projectKey,entry.title,entry.body,JSON.stringify(entry.payload),entry.published,entry.author,entry.imageId]);
    await client.query('COMMIT');return id;
  } catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error;} finally{client.release();}
}
const VISITOR_COOKIE = process.env.NODE_ENV==='production' ? '__Host-zo7al-voter' : 'zo7al-voter';
const visitorMac = (nonce:string) => createHmac('sha256',process.env.ZO7AL_ADMIN_SESSION_SECRET ?? '').update('community-vote:'+nonce).digest('hex');
export function voter(request: Request) {
  const secret = process.env.ZO7AL_ADMIN_SESSION_SECRET;
  if (!secret || secret.length<43) return null;
  const value=request.headers.get('cookie')?.split(';').map(p=>p.trim()).find(p=>p.startsWith(VISITOR_COOKIE+'='))?.slice(VISITOR_COOKIE.length+1)??'';
  const [nonce,mac,extra]=value.split('.');
  if (!extra && /^[a-f0-9]{64}$/.test(nonce??'') && /^[a-f0-9]{64}$/.test(mac??'') && timingSafeEqual(Buffer.from(mac),Buffer.from(visitorMac(nonce)))) return {hash:tokenHash(nonce),cookie:null};
  const fresh=randomBytes(32).toString('hex');
  return {hash:tokenHash(fresh),cookie:`${VISITOR_COOKIE}=${fresh}.${visitorMac(fresh)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV==='production'?'; Secure':''}`};
}
export async function vote(poll:string, option:number, hash:string) {
  const client=await(await siteDatabase()).connect();
  try {
    await client.query('BEGIN');
    const row=(await client.query("SELECT payload FROM community_entries WHERE id=$1 AND kind='poll' AND published AND moderation='approved' FOR UPDATE",[poll])).rows[0];
    if (!row || !Array.isArray(row.payload.options) || option>=row.payload.options.length || row.payload.endsAt && Date.parse(row.payload.endsAt)<=Date.now()) throw Error('CLOSED');
    const result=await client.query('INSERT INTO community_votes(poll_id,visitor_hash,option_index) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING option_index',[poll,hash,option]);
    await client.query('COMMIT');return !!result.rowCount;
  } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
}
export async function notifyCommunity(id:string) {
  const client=await(await siteDatabase()).connect();
  try {
    await client.query('BEGIN');
    const row=(await client.query("SELECT title,body,author,contact_email,payload,discord_receipt FROM community_entries WHERE id=$1 AND kind='gallery' FOR UPDATE",[id])).rows[0];
    if (!row)throw Error('INVALID');
    if (!row.discord_receipt) {const receipt=await notifyDiscord('support',id,{Type:'Community gallery submission — awaiting moderation',Title:row.title,Author:row.author,Email:row.contact_email??'',Description:row.body,Video:String(row.payload.videoUrl??''),Review:'https://zo7al.is-a.dev/dashboard'});await client.query('UPDATE community_entries SET discord_receipt=$2 WHERE id=$1',[id,receipt]);}
    await client.query('COMMIT');
  } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
}
