// The profile bridge must read the server's current permissions, not cart items or purchase history.
export function parsePlayerRank(data: unknown, username: string): string | null {
  if (!data || typeof data !== "object") return null;
  const profile = data as Record<string, unknown>;
  if (typeof profile.username !== "string" || profile.username.toLowerCase() !== username.toLowerCase()) return null;
  if (typeof profile.rank !== "string") return null;
  const rank = profile.rank.trim();
  return rank.length > 0 && rank.length <= 64 && !/[\x00-\x1f\x7f§<>]/.test(rank) ? rank : null;
}

export function parsePlayerStats(data:unknown,username:string) {
  const empty={stats:null,online:null,lastSeen:null};
  if(!data||typeof data!=="object")return empty;
  const profile=data as Record<string,unknown>;
  if(typeof profile.username!=="string"||profile.username.toLowerCase()!==username.toLowerCase())return empty;
  const stats:Record<string,number>={};
  if(profile.stats&&typeof profile.stats==="object")for(const key of ["kills","deaths","wins","playtimeSeconds"]) {const value=(profile.stats as Record<string,unknown>)[key];if(typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=1e12)stats[key]=value;}
  return {stats:Object.keys(stats).length?stats:null,online:typeof profile.online==="boolean"?profile.online:null,lastSeen:typeof profile.lastSeen==="string"&&profile.lastSeen.length<50&&Number.isFinite(Date.parse(profile.lastSeen))?profile.lastSeen:null};
}
