import 'server-only';
import { hasAdminSession as passwordSession } from './site-security';
import { accountUser } from './account-auth';
export function isOwnerAccount(id:string) {
 return (process.env.ZO7AL_ADMIN_ACCOUNT_IDS??'').split(',').map(v=>v.trim()).filter(v=>/^[a-f0-9-]{36}$/i.test(v)).includes(id);
}
export function ownerAccountsConfigured(){return (process.env.ZO7AL_ADMIN_ACCOUNT_IDS??'').split(',').some(v=>/^[a-f0-9-]{36}$/i.test(v.trim()));}
/** Authorize the remotely validated immutable member ID, never an email/name/provider metadata claim. */
export async function hasAdminSession(request:Request) {
 if(passwordSession(request))return true;
 if(!ownerAccountsConfigured())return false;
 try {const user=await accountUser(request);return !!user&&isOwnerAccount(user.id);}catch{return false;}
}
