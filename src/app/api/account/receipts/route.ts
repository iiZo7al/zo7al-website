import {AccountError,accountHeaders,accountOrigin,requireAccount} from '@/lib/server/account-auth';
import {siteDatabase} from '@/lib/server/site-db';
import {readJSON,tokenHash,validReceipt} from '@/lib/server/site-security';
import {limitAttempt} from '@/lib/server/site-content';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 const headers=accountHeaders();
 try {const user=await requireAccount(request,headers);const rows=(await (await siteDatabase()).query(`SELECT id AS reference,'order' AS kind,created_at AS "savedAt",username AS title FROM site_orders WHERE user_id=$1 UNION ALL SELECT id AS reference,kind,created_at AS "savedAt",COALESCE(payload->>'subject',payload->>'platform',payload->>'eventTitle','') AS title FROM site_requests WHERE user_id=$1 UNION ALL SELECT id AS reference,'gallery' AS kind,created_at AS "savedAt",title FROM community_entries WHERE user_id=$1 AND kind='gallery' ORDER BY "savedAt" DESC LIMIT 100`,[user.id])).rows;return Response.json({receipts:rows},{headers});}
 catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
export async function POST(request:Request) {
 const headers=accountHeaders();
 try {
  if(!accountOrigin(request))throw new AccountError('INVALID',403);
  const user=await requireAccount(request,headers);
  if(!await limitAttempt('account-receipts:'+user.id,20,600))throw new AccountError('RATE_LIMIT',429);
  const body=await readJSON(request,8000) as {receipts?:unknown};
  if(!Array.isArray(body.receipts)||body.receipts.length>30)throw new AccountError('INVALID');
  const db=await siteDatabase();
  for(const candidate of body.receipts) {
    const receipt=candidate as {reference:string;token:string;kind:string};
    if(!validReceipt(candidate)||!['order','application','support','event'].includes(receipt.kind))throw new AccountError('INVALID');
    // Possessing the existing private receipt is the only way to claim a guest request.
    if(receipt.kind==='order')await db.query('UPDATE site_orders SET user_id=$1 WHERE id=$2 AND token_hash=$3 AND (user_id IS NULL OR user_id=$1)',[user.id,receipt.reference,tokenHash(receipt.token)]);
    else await db.query('UPDATE site_requests SET user_id=$1 WHERE id=$2 AND token_hash=$3 AND kind=$4 AND (user_id IS NULL OR user_id=$1)',[user.id,receipt.reference,tokenHash(receipt.token),receipt.kind]);
  }
  return Response.json({ok:true},{headers});
 }catch(error){return Response.json({error:error instanceof AccountError?error.code:'UNAVAILABLE'},{status:error instanceof AccountError?error.status:503,headers});}
}
