import { privateHeaders } from "@/lib/server/site-security";
import { clearPlatformCache } from "@/lib/server/dashboard-platforms";
import { finishYoutubeOAuth, clearYoutubeOAuthCookie, youtubeCallback } from "@/lib/server/youtube-auth";
import { youtubeOAuthErrors } from "@/lib/data/youtube-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let state = "failed", reason = "";
  try { state = await finishYoutubeOAuth(request); if (state === "connected") clearPlatformCache("youtube"); } catch (error) {
    const code = error instanceof Error ? error.message : "";
    reason = code === "INVALID" ? "YT_AUTH_EXPIRED" : youtubeOAuthErrors.find(value => value === code) ?? "YT_UNAVAILABLE";
  }
  const url = new URL("/dashboard", youtubeCallback(request)); url.search = new URLSearchParams({ view: "youtube", oauth: state, ...(reason ? { reason } : {}) }).toString();
  return new Response(null, { status: 303, headers: { ...privateHeaders, Location: url.href, "Set-Cookie": clearYoutubeOAuthCookie() } });
}
