import 'server-only';
import { AccountError } from './account-auth';
/** Server-only Auth management. Callers supply fixed operations, never browser-selected URLs. */
export async function accountAdminRequest(path:string,method='GET',body?:unknown):Promise<Record<string,unknown>> {
 const base=new URL(process.env.SUPABASE_URL??''),key=process.env.SUPABASE_SECRET_KEY;
 if(!key||base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||!/^\/(?:users(?:\/[a-f0-9-]{36})?|generate_link)$/.test(path))throw new AccountError('CONFIGURATION',503);
 const response=await fetch(base.origin+'/auth/v1/admin'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new AccountError(response.status===404?'ACCOUNT_DELETED':'UNAVAILABLE',response.status===404?404:503);
 const reader=response.body?.getReader();if(!reader)throw new AccountError('UNAVAILABLE',503);
 const chunks:Uint8Array[]=[];let size=0;
 try {while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>64000)throw new AccountError('UNAVAILABLE',503);chunks.push(part.value);}return JSON.parse(Buffer.concat(chunks).toString());}finally{await reader.cancel();}
}
