import "server-only";
import crypto from "node:crypto";
import { siteDatabase } from "@/lib/server/site-db";
import {
  normalizeSolarMemberSocials,
  safeMemberUrl,
  type SolarMember,
} from "@/lib/data/solar-members";

const CACHE_KEY = "solar_clan_members";

function sanitizeMember(raw: unknown, fallbackOrder: number): SolarMember | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, 80) : "";
  const rank = typeof r.rank === "string" ? r.rank.trim().slice(0, 80) : "";
  if (!name || !rank) return null;
  const id =
    typeof r.id === "string" && /^[a-zA-Z0-9_-]{4,64}$/.test(r.id)
      ? r.id
      : crypto.randomUUID();
  const avatar = safeMemberUrl(r.avatar) ?? "";
  const bio = typeof r.bio === "string" ? r.bio.trim().slice(0, 600) : "";
  const order =
    typeof r.order === "number" && Number.isFinite(r.order)
      ? r.order
      : fallbackOrder;
  const updatedAt =
    typeof r.updatedAt === "string" && Number.isFinite(Date.parse(r.updatedAt))
      ? new Date(r.updatedAt).toISOString()
      : new Date().toISOString();

  return {
    id,
    name,
    rank,
    avatar,
    bio,
    socials: normalizeSolarMemberSocials(r.socials),
    order,
    updatedAt,
  };
}

export async function getSolarMembers(): Promise<SolarMember[]> {
  try {
    const db = await siteDatabase();
    const res = await db.query(
      "SELECT payload FROM site_platform_cache WHERE platform = $1 LIMIT 1",
      [CACHE_KEY],
    );
    const list = res.rows[0]?.payload?.members;
    if (!Array.isArray(list)) return [];
    return list
      .map((item, idx) => sanitizeMember(item, idx))
      .filter((m): m is SolarMember => m !== null)
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function saveSolarMembers(members: SolarMember[]): Promise<SolarMember[]> {
  const normalized = members.map((m, idx) => ({ ...m, order: idx }));
  const db = await siteDatabase();
  await db.query(
    `INSERT INTO site_platform_cache (platform, payload, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (platform)
     DO UPDATE SET payload = $2::jsonb, updated_at = now()`,
    [CACHE_KEY, JSON.stringify({ members: normalized })],
  );
  return normalized;
}

export async function upsertSolarMember(input: {
  id?: unknown;
  name?: unknown;
  rank?: unknown;
  avatar?: unknown;
  bio?: unknown;
  socials?: unknown;
}): Promise<SolarMember[]> {
  const current = await getSolarMembers();
  const existingIdx =
    typeof input.id === "string"
      ? current.findIndex((m) => m.id === input.id)
      : -1;

  const candidate = sanitizeMember(
    {
      ...input,
      id:
        existingIdx >= 0
          ? current[existingIdx].id
          : crypto.randomUUID(),
      order: existingIdx >= 0 ? current[existingIdx].order : current.length,
      updatedAt: new Date().toISOString(),
    },
    current.length,
  );

  if (!candidate) {
    throw new Error("INVALID");
  }

  const next = [...current];
  if (existingIdx >= 0) {
    next[existingIdx] = candidate;
  } else {
    next.push(candidate);
  }
  return saveSolarMembers(next);
}

export async function deleteSolarMember(id: string): Promise<SolarMember[]> {
  const current = await getSolarMembers();
  const next = current.filter((m) => m.id !== id);
  return saveSolarMembers(next);
}

export async function moveSolarMember(
  id: string,
  direction: "up" | "down",
): Promise<SolarMember[]> {
  const current = await getSolarMembers();
  const idx = current.findIndex((m) => m.id === id);
  if (idx < 0) return current;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= current.length) return current;
  const next = [...current];
  [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
  return saveSolarMembers(next);
}
