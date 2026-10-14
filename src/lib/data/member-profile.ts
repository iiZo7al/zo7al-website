export const PROFILE_SOCIALS = [
  "github",
  "youtube",
  "discord",
  "twitch",
  "tiktok",
  "instagram",
  "x",
  "website",
  "threads","bluesky","snapchat","facebook","telegram","whatsapp","kick","reddit","linkedin","pinterest","steam","spotify","roblox","playstation","epicgames","modrinth","curseforge","patreon","linktree","fortnite",
] as const;
export type MemberProfile = {
  username: string | null;
  banner: string | null;
  bio: string;
  socials: Record<string, string>;
};
export function profileUsername(value: unknown): string | null {
  return typeof value === "string" && /^[a-zA-Z0-9_]{3,32}$/.test(value.trim().replace(/^@/, ""))
    ? value.trim().replace(/^@/, "")
    : null;
}
export function profileURL(value: unknown): string | null {
  if (value === "") return "";
  if (typeof value !== "string" || value.length > 1024) return null;
  if (/^\/api\/profile-media\/[a-f0-9-]{36}$/.test(value)) return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function profileSettings(value: Record<string, unknown>) {
  const username = profileUsername(value.username),
    avatar = profileURL(value.avatar),
    banner = profileURL(value.banner);
  if (
    !username ||
    avatar === null ||
    banner === null ||
    typeof value.bio !== "string" ||
    value.bio.length > 500 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value.bio)
  )
    return null;
  if (
    !value.socials ||
    typeof value.socials !== "object" ||
    Array.isArray(value.socials)
  )
    return null;
  const socials: Record<string, string> = {};
  for (const key of PROFILE_SOCIALS) {
    const url = profileURL(
      (value.socials as Record<string, unknown>)[key] ?? "",
    );
    if (url === null) return null;
    if (url) socials[key] = url;
  }
  return {
    username,
    avatar: avatar || null,
    banner: banner || null,
    bio: value.bio.trim(),
    socials,
  };
}

export function profileHandle(value:string):string|null {
 try { const decoded=decodeURIComponent(value);return decoded.startsWith("@")?profileUsername(decoded):null; } catch { return null; }
}
