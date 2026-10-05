import { privateHeaders } from "@/lib/server/site-security";
import { clearPlatformCache } from "@/lib/server/dashboard-platforms";
import { finishYoutubeOAuth, clearYoutubeOAuthCookie } from "@/lib/server/youtube-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let state = "failed";
  try { state = await finishYoutubeOAuth(request); if (state === "connected") clearPlatformCache("youtube"); } catch { /* Codes, tokens and provider errors never enter browser messages. */ }
  const url = new URL("/dashboard", request.url); url.search = new URLSearchParams({ view: "youtube", oauth: state }).toString();
  return new Response(null, { status: 303, headers: { ...privateHeaders, Location: url.href, "Set-Cookie": clearYoutubeOAuthCookie() } });
}
