import { FORTNITE_MAPS } from "@/lib/data/fortnite";
import { MODRINTH_FALLBACK } from "@/lib/data/modrinth";
import { CURSEFORGE_PROJECTS } from "@/lib/data/curseforge";
import { publicContent } from "@/lib/server/site-content";
import { hubLocales } from "@/lib/data/hub-validation";
import { getStoreCatalog } from "@/lib/server/tebex";
export async function GET(request: Request) {
  const locale=new URL(request.url).searchParams.get("locale")??"en";
  if(!hubLocales.includes(locale))return Response.json({error:"INVALID"},{status:400});
  const [catalog,news,events]=await Promise.all([getStoreCatalog(),publicContent("news",locale,"all"),publicContent("event",locale,"all")]);
  return Response.json({items:[
    ...FORTNITE_MAPS.map(map=>({title:map.title,href:"/fortnite?map="+map.code,keywords:map.code+" "+map.category,category:"Fortnite"})),
    ...MODRINTH_FALLBACK.map(p=>({title:p.title,href:"/modpacks?project=modrinth:"+p.slug,keywords:p.description,category:"Modrinth"})),
    ...CURSEFORGE_PROJECTS.map(p=>({title:p.title,href:"/modpacks?project=curseforge:"+p.id,keywords:p.description,category:"CurseForge"})),
    ...catalog.products.map(p=>({title:p.name,href:"/store",keywords:p.category?.name,category:"Zo7al Network"})),
    ...news.items.map(n=>({title:n.title,href:(n.topic==="fortnite"?"/fortnite":"/")+"?news="+encodeURIComponent(n.id)+"#news",keywords:n.body,category:n.topic==="fortnite"?"Fortnite":"Minecraft"})),
    ...events.items.map(n=>({title:n.title,href:"/events?topic="+(n.topic==="fortnite"?"fortnite":"minecraft")+"#"+n.id,keywords:n.body,category:n.topic==="fortnite"?"Fortnite":"Minecraft"}))
  ]},{headers:{"Cache-Control":"public,max-age=60"}});
}
