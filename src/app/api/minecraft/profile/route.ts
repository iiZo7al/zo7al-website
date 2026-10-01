import { parsePlayerRank } from "@/lib/server/player-profile";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
  if (!/^[.a-zA-Z0-9_ ]{3,32}$/.test(username)) return Response.json({ error: "INVALID" }, { status: 400 });
  const unknown = () => Response.json({ rank: null }, { headers: { "Cache-Control": "no-store" } });
  // Only a deployment-configured trusted bridge can supply a current in-game rank.
  // No caller-supplied URL, raw purchase records or credentials are exposed.
  const endpoint = process.env.MINECRAFT_PROFILE_URL;
  if (!endpoint) return unknown();
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password) return unknown();
    url.searchParams.set("username", username);
    const token = process.env.MINECRAFT_PROFILE_TOKEN;
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      redirect: "error", signal: AbortSignal.timeout(4000), next: { revalidate: 60 },
    });
    if (!response.ok) return unknown();
    return Response.json({ rank: parsePlayerRank(await response.json(), username) }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch { return unknown(); }
}
