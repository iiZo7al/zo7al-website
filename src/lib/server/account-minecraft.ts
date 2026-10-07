import 'server-only';
import { randomInt } from 'node:crypto';
import { siteDatabase } from './site-db';
import { tokenHash } from './site-security';
import { AccountError } from './account-auth';
import { minecraftName, LINK_CODE } from '../data/account';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function createMinecraftLink(userId: string, value: unknown) {
  const username = minecraftName(value); if (!username) throw new AccountError('INVALID');
  const code = Array.from({length:8}, () => alphabet[randomInt(alphabet.length)]).join('');
  const db = await siteDatabase();
  if ((await db.query('SELECT user_id FROM site_minecraft_links WHERE username_key=$1 AND user_id<>$2', [username.toLowerCase(),userId])).rowCount) throw new AccountError('LINK_TAKEN',409);
  await db.query("INSERT INTO site_minecraft_link_codes(user_id,code_hash,username_key,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,username_key=excluded.username_key,expires_at=excluded.expires_at", [userId,tokenHash(code),username.toLowerCase()]);
  return { code, expiresAt: new Date(Date.now()+600000).toISOString() };
}
export async function verifyMinecraftLink(bridgeHash: string, value: unknown) {
  const input = value as { code?: unknown; username?: unknown; uuid?: unknown };
  const username = minecraftName(input?.username);
  if (!username || typeof input.code !== 'string' || !LINK_CODE.test(input.code) || typeof input.uuid !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.uuid)) throw new AccountError('INVALID');
  const db = await siteDatabase(), client = await db.connect();
  try {
    await client.query('BEGIN');
    if (!(await client.query('SELECT id FROM minecraft_profile_bridges WHERE token_hash=$1 AND enabled FOR UPDATE',[bridgeHash])).rowCount) throw new AccountError('UNAUTHORIZED',401);
    const row = (await client.query('SELECT user_id FROM site_minecraft_link_codes WHERE code_hash=$1 AND username_key=$2 AND expires_at>now() FOR UPDATE',[tokenHash(input.code),username.toLowerCase()])).rows[0];
    if (!row) throw new AccountError('LINK_EXPIRED',400);
    await client.query('INSERT INTO site_minecraft_links(user_id,uuid,username,username_key) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET uuid=excluded.uuid,username=excluded.username,username_key=excluded.username_key,linked_at=now()', [row.user_id,input.uuid,username,username.toLowerCase()]);
    await client.query('DELETE FROM site_minecraft_link_codes WHERE user_id=$1',[row.user_id]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK').catch(()=>{}); if ((error as {code?:string}).code==='23505') throw new AccountError('LINK_TAKEN',409); throw error; }
  finally { client.release(); }
}
