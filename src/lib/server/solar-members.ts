import "server-only";
import crypto from "node:crypto";
import { siteDatabase } from "@/lib/server/site-db";
import {
  normalizeSolarMemberSocials,
  safeMemberUrl,
  SOLAR_MEMBER_SOCIAL_PLATFORMS,
  type SolarMember,
  type SolarMemberSocialPlatform,
} from "@/lib/data/solar-members";

const CACHE_KEY = "solar_clan_members";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_TO_RANK: Record<string, string> = {
  creator: "صانع محتوى",
  streamer: "ستريمر",
  designer: "مصمم",
  editor: "ممنتج",
  player: "لاعب",
  admin: "إداري",
  writer: "كاتب أفكار",
};

const SUBTYPE_TO_RANK: Record<string, string> = {
  president: "قائد الكلان",
  vice_president: "نائب الرئيس",
  exec_supervisor: "مشرف تنفيذي",
  dept_supervisor: "مشرف أقسام",
  general_admin: "إدارة عامة",
  admin_monitor: "مراقب إدارة",
  creators_supervisor: "مشرف صناع محتوى",
  creators_admin: "إداري صناع محتوى",
  designers_supervisor: "مشرف مصممين",
  players_supervisor: "مشرف لاعبين",
  players_admin: "إداري لاعبين",
  editors_supervisor: "مشرف ممنتجين",
  streamers_supervisor: "مشرف ستريمرز",
};

const VALID_SOCIAL_PLATFORMS = new Set<string>(
  SOLAR_MEMBER_SOCIAL_PLATFORMS.map((p) => p.id),
);

function sanitizeHandle(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^@/, "");
  return /^[a-zA-Z0-9_.-]{2,40}$/.test(trimmed) ? trimmed : undefined;
}

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
  const userId =
    typeof r.userId === "string" && UUID_RE.test(r.userId)
      ? r.userId
      : undefined;
  const handle = sanitizeHandle(r.handle);
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
    ...(userId ? { userId } : {}),
    ...(handle ? { handle } : {}),
    name,
    rank,
    avatar,
    bio,
    socials: normalizeSolarMemberSocials(r.socials),
    order,
    updatedAt,
  };
}

async function readStoredMembers(): Promise<SolarMember[]> {
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
}

export async function getSolarMembers(): Promise<SolarMember[]> {
  try {
    const members = await readStoredMembers();
    const userIds = Array.from(
      new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id))),
    );
    if (userIds.length === 0) return members;

    const db = await siteDatabase();
    const accRes = await db.query(
      "SELECT id, username, avatar FROM site_accounts WHERE id = ANY($1::uuid[])",
      [userIds],
    );
    const byId = new Map<string, { username: string | null; avatar: string | null }>();
    for (const row of accRes.rows) {
      byId.set(String(row.id), {
        username: typeof row.username === "string" ? row.username : null,
        avatar: typeof row.avatar === "string" ? row.avatar : null,
      });
    }

    return members.map((member) => {
      if (!member.userId) return member;
      const acc = byId.get(member.userId);
      if (!acc) return member;
      const liveHandle = sanitizeHandle(acc.username) ?? member.handle;
      const liveAvatar = safeMemberUrl(acc.avatar) ?? member.avatar;
      return {
        ...member,
        ...(liveHandle ? { handle: liveHandle } : {}),
        avatar: liveAvatar,
      };
    });
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
  userId?: unknown;
  handle?: unknown;
  name?: unknown;
  rank?: unknown;
  avatar?: unknown;
  bio?: unknown;
  socials?: unknown;
}): Promise<SolarMember[]> {
  const current = await readStoredMembers();
  const existingIdx =
    typeof input.id === "string"
      ? current.findIndex((m) => m.id === input.id)
      : -1;
  const existing = existingIdx >= 0 ? current[existingIdx] : null;

  const candidate = sanitizeMember(
    {
      ...input,
      id: existing ? existing.id : crypto.randomUUID(),
      userId: input.userId ?? existing?.userId,
      handle: input.handle ?? existing?.handle,
      order: existing ? existing.order : current.length,
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
  const current = await readStoredMembers();
  const next = current.filter((m) => m.id !== id);
  return saveSolarMembers(next);
}

export async function moveSolarMember(
  id: string,
  direction: "up" | "down",
): Promise<SolarMember[]> {
  const current = await readStoredMembers();
  const idx = current.findIndex((m) => m.id === id);
  if (idx < 0) return current;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= current.length) return current;
  const next = [...current];
  [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
  return saveSolarMembers(next);
}

export async function syncAcceptedSolarApplicant(requestId: string): Promise<void> {
  if (!UUID_RE.test(requestId)) return;
  const db = await siteDatabase();
  const reqRes = await db.query(
    "SELECT id, user_id, payload FROM site_requests WHERE id = $1 AND kind = 'application' LIMIT 1",
    [requestId],
  );
  const row = reqRes.rows[0];
  if (!row) return;
  const payload =
    row.payload && typeof row.payload === "object"
      ? (row.payload as Record<string, unknown>)
      : null;
  if (!payload || payload.platform !== "solar") return;

  const userId =
    typeof row.user_id === "string" && UUID_RE.test(row.user_id)
      ? row.user_id
      : undefined;

  let accountName = "";
  let accountHandle: string | undefined;
  let accountAvatar = "";
  let accountBio = "";
  const accountSocials: { platform: SolarMemberSocialPlatform; label: string; url: string }[] = [];

  if (userId) {
    const accRes = await db.query(
      "SELECT name, username, avatar, bio, socials FROM site_accounts WHERE id = $1 LIMIT 1",
      [userId],
    );
    const acc = accRes.rows[0];
    if (acc) {
      accountName = typeof acc.name === "string" ? acc.name.trim() : "";
      accountHandle = sanitizeHandle(acc.username);
      accountAvatar = safeMemberUrl(acc.avatar) ?? "";
      accountBio = typeof acc.bio === "string" ? acc.bio.trim().slice(0, 600) : "";
      if (acc.socials && typeof acc.socials === "object") {
        for (const [k, v] of Object.entries(acc.socials as Record<string, unknown>)) {
          const url = safeMemberUrl(v);
          if (!url) continue;
          const plat = VALID_SOCIAL_PLATFORMS.has(k)
            ? (k as SolarMemberSocialPlatform)
            : "website";
          accountSocials.push({ platform: plat, label: "", url });
        }
      }
    }
  }

  const roleKey = typeof payload.role === "string" ? payload.role : "";
  const subKey = typeof payload.adminSubType === "string" ? payload.adminSubType : "";
  const rank =
    (roleKey === "admin" && subKey && SUBTYPE_TO_RANK[subKey]) ||
    ROLE_TO_RANK[roleKey] ||
    "عضو";

  const payloadName =
    (typeof payload.nickname === "string" && payload.nickname.trim()) ||
    (typeof payload.name === "string" && payload.name.trim()) ||
    "";
  const displayName = (accountName || payloadName || "عضو Solar").slice(0, 80);

  const channelUrl = safeMemberUrl(payload.channelUrl);
  if (channelUrl && !accountSocials.some((s) => s.url === channelUrl)) {
    accountSocials.push({ platform: "website", label: "", url: channelUrl });
  }

  const bio =
    accountBio ||
    (typeof payload.whyJoin === "string" ? payload.whyJoin.trim().slice(0, 600) : "");

  const current = await readStoredMembers();
  const existingIdx = current.findIndex(
    (m) => (userId && m.userId === userId) || m.id === requestId,
  );

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const next = [...current];
    next[existingIdx] = {
      ...existing,
      ...(userId ? { userId } : {}),
      ...(accountHandle ? { handle: accountHandle } : {}),
      avatar: accountAvatar || existing.avatar,
      updatedAt: new Date().toISOString(),
    };
    await saveSolarMembers(next);
    return;
  }

  const added: SolarMember = {
    id: requestId,
    ...(userId ? { userId } : {}),
    ...(accountHandle ? { handle: accountHandle } : {}),
    name: displayName,
    rank,
    avatar: accountAvatar,
    bio,
    socials: accountSocials.slice(0, 12),
    order: current.length,
    updatedAt: new Date().toISOString(),
  };

  await saveSolarMembers([...current, added]);
}
