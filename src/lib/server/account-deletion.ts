import 'server-only';
import { randomBytes } from 'node:crypto';
import { siteDatabase } from './site-db';
import { tokenHash } from './site-security';
import { AccountError } from './account-auth';
import { accountAdminRequest } from './account-admin';
import { isOwnerAccount } from './admin-account';

export async function scheduleAccountDeletion(id:string) {
 if(isOwnerAccount(id))throw new AccountError('OWNER_PROTECTED',403);
 if(!process.env.SUPABASE_SECRET_KEY||!process.env.CRON_SECRET)throw new AccountError('CONFIGURATION',503);
 const row=(await (await siteDatabase()).query("UPDATE site_accounts SET deletion_due_at=now()+interval '15 days',updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING deletion_due_at",[id])).rows[0];
 if(!row)throw new AccountError('ACCOUNT_DELETED',404);
 return new Date(row.deletion_due_at).toISOString();
}
/** Mark revoked + remove profile data first, so an upstream outage cannot restore account access. */
export async function permanentlyDeleteAccount(id:string,dueOnly=false) {
 if(!/^[a-f0-9-]{36}$/i.test(id))throw new AccountError('INVALID');
 if(isOwnerAccount(id))throw new AccountError('OWNER_PROTECTED',403);
 if(!process.env.SUPABASE_SECRET_KEY)throw new AccountError('CONFIGURATION',503);
 const db=await siteDatabase(),client=await db.connect();let ready=false;
 try {
  await client.query('BEGIN');
  const row=(await client.query('SELECT deleted_at,deletion_due_at,auth_delete_pending FROM site_accounts WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!row)throw new AccountError('ACCOUNT_DELETED',404);
  if(dueOnly&&!row.auth_delete_pending&&(!row.deletion_due_at||new Date(row.deletion_due_at).getTime()>Date.now())) {await client.query('COMMIT');return false;}
  await client.query("UPDATE site_accounts SET name='Deleted',username=NULL,avatar=NULL,banner=NULL,bio='',socials='{}',ban_reason='',banned_until=NULL,deletion_due_at=NULL,deleted_at=coalesce(deleted_at,now()),auth_delete_pending=true,updated_at=now() WHERE id=$1",[id]);
  await client.query('DELETE FROM site_profile_images WHERE user_id=$1',[id]);
  // Retain anonymized purchase accounting, never live owner/receipt/contact access.
  await client.query("UPDATE site_orders SET user_id=NULL,username='Deleted',token_hash=$2,discord_receipt=NULL,discord_payload=NULL WHERE user_id=$1",[id,tokenHash(randomBytes(32).toString('hex'))]);
  await client.query('DELETE FROM site_requests WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_content_images i WHERE i.id IN (SELECT image_id FROM community_entries WHERE user_id=$1) AND NOT EXISTS(SELECT 1 FROM community_entries e WHERE e.image_id=i.id AND e.user_id IS DISTINCT FROM $1) AND NOT EXISTS(SELECT 1 FROM site_content c WHERE c.image_id=i.id)',[id]);
  await client.query('DELETE FROM community_entries WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_minecraft_link_codes WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_minecraft_links WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_member_modrinth_identities WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_member_modrinth_flows WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_account_auth_flows WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_passkey_flows WHERE user_id=$1',[id]);
  for(const table of ['site_account_recovery_codes','site_account_second_factors','site_account_action_proofs','site_account_email_challenges','site_account_saved_sessions'])await client.query('DELETE FROM '+table+' WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_account_mfa_attempts WHERE user_id=$1',[id]);
  await client.query('DELETE FROM site_account_moderation_log WHERE user_id=$1',[id]);
  await client.query("INSERT INTO site_account_moderation_log(user_id,action,reason) VALUES($1,'delete','')",[id]);
  await client.query('COMMIT');ready=true;
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
 if(ready) {
  try {await accountAdminRequest('/users/'+id,'DELETE',{should_soft_delete:false});}
  catch(error){if(!(error instanceof AccountError)||error.code!=='ACCOUNT_DELETED')throw error;}
  await db.query('UPDATE site_accounts SET auth_delete_pending=false,auth_purged_at=now() WHERE id=$1 AND deleted_at IS NOT NULL',[id]);
 }
 return true;
}
export async function deleteExpiredAccounts() {
 const rows=(await (await siteDatabase()).query('SELECT id FROM site_accounts WHERE deletion_due_at<=now() OR auth_delete_pending=true ORDER BY updated_at LIMIT 20')).rows;
 let deleted=0,failed=0;
 for(const row of rows)try{if(await permanentlyDeleteAccount(row.id,true))deleted++;}catch{failed++;}
 return {deleted,failed};
}
