import { parsePlayerRank,parsePlayerStats } from "@/lib/server/player-profile";
import { readSyncedProfile } from "@/lib/server/minecraft-bridge";
import { bridgeId } from "@/lib/data/minecraft-bridge";
import { NETWORK_PROFILE_ID } from "@/lib/data/player-statistics";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const username = params.get("username")?.trim() ?? "", server = params.get("server")?.toLowerCase();
  if (!/^[.a-zA-Z0-9_ ]{3,32}$/.test(username) || server !== undefined && server !== NETWORK_PROFILE_ID && !bridgeId(server)) return Response.json({ error: "INVALID" }, { status: 400 });
  const unknown = () => Response.json({ rank: null,stats:null,online:null,lastSeen:null, ...(server ? { serverId: server } : {}) }, { headers: { "Cache-Control": "no-store" } });
  try {
    const synced = await readSyncedProfile(username, Date.now(), server);
    if (synced) return Response.json(synced, { headers: { "Cache-Control": "private, no-store" } });
  } catch {}
  if (server) return unknown();
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
    const profile=await response.json();
    return Response.json({ rank: parsePlayerRank(profile, username),...parsePlayerStats(profile,username) }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch { return unknown(); }
}
