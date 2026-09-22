import { getStoreCatalog } from "@/lib/server/tebex";
export const runtime = "nodejs";
export async function GET() {
  const catalog = await getStoreCatalog();
  return Response.json(catalog, { status: catalog.live ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
