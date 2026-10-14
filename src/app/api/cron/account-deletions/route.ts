import { timingSafeEqual } from 'node:crypto';
import { deleteExpiredAccounts } from '@/lib/server/account-deletion';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 const expected=Buffer.from('Bearer '+(process.env.CRON_SECRET??'')),actual=Buffer.from(request.headers.get('authorization')??'');
 if(!process.env.CRON_SECRET||expected.length!==actual.length||!timingSafeEqual(expected,actual))return new Response(null,{status:401});
 try{return Response.json(await deleteExpiredAccounts(),{headers:{'Cache-Control':'no-store'}});}catch{return new Response(null,{status:503});}
}
