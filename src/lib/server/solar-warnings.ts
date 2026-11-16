import "server-only";
import crypto from "node:crypto";
import { siteDatabase } from "@/lib/server/site-db";
import { getSolarMembers } from "@/lib/server/solar-members";
import {
  computeWarningExpiry,
  type SolarWarningDurationKey,
  type SolarWarningPledge,
  type SolarWarningSignatureInput,
} from "@/lib/data/solar-warnings";

const CACHE_KEY = "solar_warning_pledges";

function sanitizePledge(raw: unknown): SolarWarningPledge | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : "";
  const memberId = typeof r.memberId === "string" && r.memberId.trim() ? r.memberId.trim() : "";
  const memberName = typeof r.memberName === "string" ? r.memberName.trim() : "";
  const memberRank = typeof r.memberRank === "string" ? r.memberRank.trim() : "";
  const reason = typeof r.reason === "string" ? r.reason.trim() : "";
  const expiresAt = typeof r.expiresAt === "string" ? r.expiresAt : "";
  const createdAt = typeof r.createdAt === "string" ? r.createdAt : "";
  if (!id || !memberId || !memberName || !reason || !Number.isFinite(Date.parse(expiresAt))) {
    return null;
  }

  return {
    id,
    memberId,
    ...(typeof r.memberUserId === "string" && r.memberUserId ? { memberUserId: r.memberUserId } : {}),
    memberName,
    memberRank,
    ...(typeof r.memberDiscord === "string" && r.memberDiscord ? { memberDiscord: r.memberDiscord } : {}),
    reason,
    durationKey: (typeof r.durationKey === "string" ? r.durationKey : "7_days") as SolarWarningDurationKey,
    durationLabel: typeof r.durationLabel === "string" ? r.durationLabel : "7 أيام",
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: Number.isFinite(Date.parse(createdAt)) ? new Date(createdAt).toISOString() : new Date().toISOString(),
    status: r.status === "signed" ? "signed" : "pending",
    ...(typeof r.signedAt === "string" ? { signedAt: r.signedAt } : {}),
    ...(typeof r.signerName === "string" ? { signerName: r.signerName } : {}),
    ...(typeof r.signerAge === "string" ? { signerAge: r.signerAge } : {}),
    ...(typeof r.signerDiscord === "string" ? { signerDiscord: r.signerDiscord } : {}),
    ...(typeof r.signedContractUrl === "string" ? { signedContractUrl: r.signedContractUrl } : {}),
    ...(typeof r.pledgeAgreed === "boolean" ? { pledgeAgreed: r.pledgeAgreed } : {}),
  };
}

async function savePledges(pledges: SolarWarningPledge[]): Promise<void> {
  const db = await siteDatabase();
  await db.query(
    `INSERT INTO site_platform_cache (platform, payload, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (platform)
     DO UPDATE SET payload = $2, updated_at = now()`,
    [CACHE_KEY, JSON.stringify({ pledges })],
  );
}

export async function getSolarWarningPledges(): Promise<SolarWarningPledge[]> {
  try {
    const db = await siteDatabase();
    const res = await db.query(
      "SELECT payload FROM site_platform_cache WHERE platform = $1 LIMIT 1",
      [CACHE_KEY],
    );
    const rawList = res.rows[0]?.payload?.pledges;
    if (!Array.isArray(rawList)) return [];

    const now = Date.now();
    const parsed = rawList
      .map(sanitizePledge)
      .filter((p): p is SolarWarningPledge => p !== null);

    const active = parsed
      .filter((p) => Date.parse(p.expiresAt) > now)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    if (active.length !== rawList.length) {
      await savePledges(active);
    }

    return active;
  } catch {
    return [];
  }
}

export async function createSolarWarningPledge(input: {
  memberId: string;
  reason: string;
  durationKey: SolarWarningDurationKey;
  customDays?: number;
}): Promise<SolarWarningPledge | null> {
  const members = await getSolarMembers();
  const member = members.find((m) => m.id === input.memberId);
  if (!member) return null;

  const reason = input.reason.trim().slice(0, 1000);
  if (!reason) return null;

  const expiry = computeWarningExpiry(input.durationKey, input.customDays);
  if (!expiry) return null;

  const existing = await getSolarWarningPledges();
  const pledge: SolarWarningPledge = {
    id: `warn_${crypto.randomUUID()}`,
    memberId: member.id,
    ...(member.userId ? { memberUserId: member.userId } : {}),
    memberName: member.name,
    memberRank: member.rank,
    reason,
    durationKey: input.durationKey,
    durationLabel: expiry.durationLabel,
    expiresAt: expiry.expiresAt,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await savePledges([pledge, ...existing]);
  return pledge;
}

export async function deleteSolarWarningPledge(id: string): Promise<boolean> {
  const existing = await getSolarWarningPledges();
  const next = existing.filter((p) => p.id !== id);
  if (next.length === existing.length) return false;
  await savePledges(next);
  return true;
}

export async function signSolarWarningPledge(params: {
  userId: string;
  memberId?: string;
  input: SolarWarningSignatureInput;
}): Promise<SolarWarningPledge | null> {
  const existing = await getSolarWarningPledges();
  const idx = existing.findIndex(
    (p) =>
      p.id === params.input.pledgeId &&
      ((p.memberUserId && p.memberUserId === params.userId) ||
        (params.memberId && p.memberId === params.memberId)),
  );
  if (idx === -1) return null;

  const target = existing[idx];
  const updated: SolarWarningPledge = {
    ...target,
    status: "signed",
    signedAt: new Date().toISOString(),
    signerName: params.input.name,
    signerAge: params.input.age,
    signerDiscord: params.input.discord,
    signedContractUrl: params.input.signedContractUrl,
    pledgeAgreed: true,
  };

  const next = [...existing];
  next[idx] = updated;
  await savePledges(next);
  return updated;
}
