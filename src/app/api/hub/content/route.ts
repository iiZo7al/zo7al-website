import { publicContent } from "@/lib/server/site-content";
import { hubLocales } from "@/lib/data/hub-validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") === "event" ? "event" : params.get("kind") === "rule" ? "rule" : "news";
  const locale = params.get("locale") ?? "en";
  if (!hubLocales.includes(locale)) return Response.json({error:"INVALID"},{status:400});
  return Response.json(await publicContent(kind,locale),{headers:{"Cache-Control":"no-store"}});
}
