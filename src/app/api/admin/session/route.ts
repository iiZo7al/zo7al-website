import { hasAdminSession, configuredAdmin, privateHeaders } from "@/lib/server/site-security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return Response.json({authenticated:hasAdminSession(request),configured:configuredAdmin()}, {headers:privateHeaders}); }
