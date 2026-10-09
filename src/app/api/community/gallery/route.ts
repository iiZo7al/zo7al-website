import { randomUUID } from 'node:crypto';
import {AccountError,accountHeaders,requireAccount} from '@/lib/server/account-auth';
import { sameOrigin,privateHeaders } from '@/lib/server/site-security';
import { limitAttempt } from '@/lib/server/site-content';
import { siteDatabase } from '@/lib/server/site-db';
import { normalizeContentImage } from '@/lib/server/content-media';
import { CONTENT_IMAGE_UPLOAD_BYTES } from '@/lib/data/content-media';
import { validateGallerySubmission } from '@/lib/data/community';
import { notifyCommunity } from '@/lib/server/community';
export const runtime='nodejs';
export const maxDuration=30;
export async function POST(request:Request){
 if(!sameOrigin(request)||!request.headers.get('content-type')?.startsWith('multipart/form-data;'))return Response.json({error:'INVALID'},{status:403,headers:privateHeaders});
 try{
  const headers=accountHeaders(),user=await requireAccount(request,headers);
  if(!await limitAttempt('gallery:'+(request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown'),3,1800)||!await limitAttempt('gallery-account:'+user.id,3,1800))return Response.json({error:'RATE_LIMIT'},{status:429,headers});
  const reader=request.body?.getReader();if(!reader)throw Error('INVALID');
  let size=0;const chunks:Uint8Array[]=[];
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>CONTENT_IMAGE_UPLOAD_BYTES+32000)throw Error('IMAGE_SIZE');chunks.push(part.value);}}finally{await reader.cancel();}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();
  const entry=validateGallerySubmission(Object.fromEntries(form));if(!entry)throw Error('INVALID');
  const file=form.get('image');let image:Awaited<ReturnType<typeof normalizeContentImage>>|null=null;
  if(file instanceof File&&file.size){if(form.getAll('image').length!==1)throw Error('INVALID');image=await normalizeContentImage(Buffer.from(await file.arrayBuffer()));}
  if(!image&&!entry.videoUrl)throw Error('INVALID');
  const id=randomUUID(),imageId=image?randomUUID():null,client=await(await siteDatabase()).connect();
  try{
   await client.query('BEGIN');
   if(image)await client.query("INSERT INTO site_content_images(id,mime_type,width,height,bytes) VALUES($1,'image/webp',$2,$3,$4)",[imageId,image.width,image.height,image.data]);
   await client.query("INSERT INTO community_entries(id,kind,locale,topic,title,body,payload,author,contact_email,image_id,user_id,moderation,published) VALUES($1,'gallery',$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',false)",[id,entry.locale,entry.topic,entry.title,entry.body,JSON.stringify({videoUrl:entry.videoUrl}),entry.author,entry.email,imageId,user.id]);
   await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
  let notified=true;try{await notifyCommunity(id);}catch{notified=false;}
  return Response.json({ok:true,reference:id,notificationPending:!notified},{status:202,headers});
 }catch(error){const code=error instanceof AccountError?error.code:error instanceof Error&&['INVALID','IMAGE_SIZE','IMAGE_FORMAT'].includes(error.message)?error.message:'UNAVAILABLE';return Response.json({error:code},{status:error instanceof AccountError?error.status:code==='IMAGE_SIZE'?413:code==='UNAVAILABLE'?503:400,headers:privateHeaders});}
}
