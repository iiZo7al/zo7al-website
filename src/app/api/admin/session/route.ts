import { hasAdminSession, ownerAccountsConfigured } from "@/lib/server/admin-account";
import {  configuredAdmin, privateHeaders } from "@/lib/server/site-security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return Response.json({authenticated:await hasAdminSession(request),configured:configuredAdmin()||ownerAccountsConfigured()}, {headers:privateHeaders}); }
