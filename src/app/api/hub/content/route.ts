import { publicContent } from "@/lib/server/site-content";
import { hubLocales, hubTopics, type HubTopic } from "@/lib/data/hub-validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") === "event" ? "event" : params.get("kind") === "rule" ? "rule" : "news";
  const locale = params.get("locale") ?? "en";
  const topic = params.get("topic") ?? "minecraft";
  if (!hubLocales.includes(locale) || topic !== "all" && !hubTopics.includes(topic as HubTopic)) return Response.json({error:"INVALID"},{status:400});
  return Response.json(await publicContent(kind,locale,topic as HubTopic | "all"),{headers:{"Cache-Control":"no-store"}});
}
