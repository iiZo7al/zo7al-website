import { getSolarSettings } from "@/lib/server/solar-settings";
import { privateHeaders } from "@/lib/server/site-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSolarSettings();
    return Response.json(
      { ok: true, settings },
      { headers: { ...privateHeaders, "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } }
    );
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
