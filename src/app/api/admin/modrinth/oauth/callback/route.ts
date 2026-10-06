import { privateHeaders } from "@/lib/server/site-security";
import { clearPlatformCache } from "@/lib/server/dashboard-platforms";
import { finishModrinthOAuth, clearModrinthOAuthCookie } from "@/lib/server/modrinth-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let state = "failed";
  try { state = await finishModrinthOAuth(request); if (state === "connected") clearPlatformCache("modrinth"); } catch { /* Provider codes and tokens never enter browser messages. */ }
  const url = new URL("/dashboard", request.url); url.search = new URLSearchParams({ view: "modrinth", oauth: state }).toString();
  return new Response(null, { status: 303, headers: { ...privateHeaders, Location: url.href, "Set-Cookie": clearModrinthOAuthCookie() } });
}
