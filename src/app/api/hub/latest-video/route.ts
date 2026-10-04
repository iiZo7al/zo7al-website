import { getSyncedSocials } from "@/lib/sync/socials";
import { getSocialPreview } from "@/lib/sync/previews";
export async function GET() {
  const {items}=await getSyncedSocials();
  const youtube=items.find(item=>item.platform==="youtube");
  const preview=youtube?await getSocialPreview(youtube.url):null;
  const item=preview?.items?.find(item=>item.kind==="video");
  return Response.json({item:item?{title:item.title,url:item.url}:null},{headers:{"Cache-Control":"public,max-age=300"}});
}
