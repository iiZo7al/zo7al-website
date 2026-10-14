import { hasAdminSession } from "@/lib/server/admin-account";
import {  privateHeaders } from "@/lib/server/site-security";
import { dashboardInsights } from "@/lib/server/dashboard-insights";
import {clearPlatformCache} from '@/lib/server/dashboard-platforms';
import {sameOrigin} from '@/lib/server/site-security';
import {limitAttempt} from '@/lib/server/site-content';
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await hasAdminSession(request)) return Response.json({ error: "UNAUTHORIZED" },{ status: 401, headers: privateHeaders });
  try { return Response.json(await dashboardInsights(),{ headers: privateHeaders }); }
  catch { return Response.json({ error: "UNAVAILABLE" },{ status: 503, headers: privateHeaders }); }
}
export async function POST(request:Request){if(!await hasAdminSession(request))return Response.json({error:'UNAUTHORIZED'},{status:401,headers:privateHeaders});if(!sameOrigin(request))return Response.json({error:'INVALID'},{status:403,headers:privateHeaders});try{if(!await limitAttempt('admin:fortnite-refresh',10,60))return Response.json({error:'RATE_LIMIT'},{status:429,headers:privateHeaders});clearPlatformCache('fortnite');return Response.json(await dashboardInsights(),{headers:privateHeaders});}catch{return Response.json({error:'UNAVAILABLE'},{status:503,headers:privateHeaders});}}
