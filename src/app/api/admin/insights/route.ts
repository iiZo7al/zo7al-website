import { hasAdminSession, privateHeaders } from "@/lib/server/site-security";
import { dashboardInsights } from "@/lib/server/dashboard-insights";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" },{ status: 401, headers: privateHeaders });
  try { return Response.json(await dashboardInsights(),{ headers: privateHeaders }); }
  catch { return Response.json({ error: "UNAVAILABLE" },{ status: 503, headers: privateHeaders }); }
}
