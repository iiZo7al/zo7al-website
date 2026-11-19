import "server-only";
import crypto from "node:crypto";
import { siteDatabase } from "@/lib/server/site-db";
import {
  isTargetRole,
  type SolarCollaborationRequest,
  type SolarRequestStatus,
  type SolarRequestTargetRole,
} from "@/lib/data/solar-requests";

const CACHE_KEY = "solar_creator_requests";

// In-memory fallback if database is not reachable during local dev
let memoryFallback: SolarCollaborationRequest[] = [];

function sanitizeRequest(raw: unknown): SolarCollaborationRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : "";
  const creatorUserId = typeof r.creatorUserId === "string" ? r.creatorUserId.trim() : "";
  const creatorName = typeof r.creatorName === "string" ? r.creatorName.trim() : "";
  const targetRole = typeof r.targetRole === "string" ? r.targetRole.trim() : "";
  const title = typeof r.title === "string" ? r.title.trim() : "";
  const details = typeof r.details === "string" ? r.details.trim() : "";
  const status = (typeof r.status === "string" ? r.status.trim() : "pending") as SolarRequestStatus;
  const createdAt = typeof r.createdAt === "string" ? r.createdAt : "";
  const updatedAt = typeof r.updatedAt === "string" ? r.updatedAt : "";

  if (!id || !creatorUserId || !creatorName || !isTargetRole(targetRole) || !title || !details) {
    return null;
  }

  return {
    id,
    creatorUserId,
    creatorName,
    ...(typeof r.creatorAvatar === "string" && r.creatorAvatar ? { creatorAvatar: r.creatorAvatar } : {}),
    ...(typeof r.creatorDiscord === "string" && r.creatorDiscord ? { creatorDiscord: r.creatorDiscord } : {}),
    targetRole,
    title,
    details,
    ...(typeof r.materialsUrl === "string" && r.materialsUrl ? { materialsUrl: r.materialsUrl } : {}),
    ...(typeof r.deadline === "string" && r.deadline ? { deadline: r.deadline } : {}),
    status: ["pending", "in_progress", "completed", "cancelled"].includes(status) ? status : "pending",
    ...(typeof r.acceptedByUserId === "string" && r.acceptedByUserId ? { acceptedByUserId: r.acceptedByUserId } : {}),
    ...(typeof r.acceptedByName === "string" && r.acceptedByName ? { acceptedByName: r.acceptedByName } : {}),
    ...(typeof r.acceptedByAvatar === "string" && r.acceptedByAvatar ? { acceptedByAvatar: r.acceptedByAvatar } : {}),
    ...(typeof r.acceptedAt === "string" && r.acceptedAt ? { acceptedAt: r.acceptedAt } : {}),
    ...(typeof r.completedAt === "string" && r.completedAt ? { completedAt: r.completedAt } : {}),
    createdAt: Number.isFinite(Date.parse(createdAt)) ? new Date(createdAt).toISOString() : new Date().toISOString(),
    updatedAt: Number.isFinite(Date.parse(updatedAt)) ? new Date(updatedAt).toISOString() : new Date().toISOString(),
  };
}

async function saveRequests(requests: SolarCollaborationRequest[]): Promise<void> {
  memoryFallback = requests;
  try {
    const db = await siteDatabase();
    await db.query(
      `INSERT INTO site_platform_cache (platform, payload, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (platform)
       DO UPDATE SET payload = $2, updated_at = now()`,
      [CACHE_KEY, JSON.stringify({ requests })],
    );
  } catch {
    // Keep memory fallback alive if db is not configured
  }
}

export async function getSolarCollaborationRequests(): Promise<SolarCollaborationRequest[]> {
  try {
    const db = await siteDatabase();
    const res = await db.query(
      "SELECT payload FROM site_platform_cache WHERE platform = $1 LIMIT 1",
      [CACHE_KEY],
    );
    const rawList = res.rows[0]?.payload?.requests;
    if (Array.isArray(rawList)) {
      const parsed = rawList
        .map(sanitizeRequest)
        .filter((r): r is SolarCollaborationRequest => r !== null)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      memoryFallback = parsed;
      return parsed;
    }
  } catch {
    // Fall back to memory
  }
  return memoryFallback;
}

export async function createSolarCollaborationRequest(input: {
  creatorUserId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorDiscord?: string;
  targetRole: SolarRequestTargetRole;
  title: string;
  details: string;
  materialsUrl?: string;
  deadline?: string;
}): Promise<SolarCollaborationRequest> {
  const existing = await getSolarCollaborationRequests();
  const now = new Date().toISOString();
  const newReq: SolarCollaborationRequest = {
    id: `req_${crypto.randomUUID()}`,
    creatorUserId: input.creatorUserId,
    creatorName: input.creatorName,
    creatorAvatar: input.creatorAvatar,
    creatorDiscord: input.creatorDiscord,
    targetRole: input.targetRole,
    title: input.title,
    details: input.details,
    materialsUrl: input.materialsUrl,
    deadline: input.deadline,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newReq, ...existing];
  await saveRequests(updated);
  return newReq;
}

export async function updateSolarCollaborationRequest(
  requestId: string,
  updater: (req: SolarCollaborationRequest) => SolarCollaborationRequest | null,
): Promise<SolarCollaborationRequest | null> {
  const existing = await getSolarCollaborationRequests();
  const idx = existing.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const current = existing[idx];
  const updatedReq = updater(current);
  if (!updatedReq) return null;

  updatedReq.updatedAt = new Date().toISOString();
  existing[idx] = updatedReq;
  await saveRequests(existing);
  return updatedReq;
}
