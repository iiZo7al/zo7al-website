import { privateHeaders } from "@/lib/server/site-security";
import { getSolarMembers } from "@/lib/server/solar-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const members = await getSolarMembers();
    return Response.json({ ok: true, members }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { ok: false, members: [] },
      { status: 503, headers: privateHeaders },
    );
  }
}
