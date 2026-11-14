import { siteDatabase } from "./site-db";
import { getSolarMembers } from "./solar-members";

export type SolarApplicationStatus = "accepted" | "pending" | "rejected" | null;

export interface SolarLeaveRequestSummary {
  id: string;
  status: string;
  note: string;
  createdAt: string;
  leaveDuration: string;
  leaveDurationCustom?: string;
  reason: string;
}

export interface SolarLeavePrefill {
  name?: string;
  discord?: string;
  phone?: string;
}

export interface SolarUserStatus {
  applicationStatus: SolarApplicationStatus;
  isMember: boolean;
  memberInfo: {
    name: string;
    rank: string;
    handle?: string;
  } | null;
  prefill: SolarLeavePrefill | null;
  leaveRequests: SolarLeaveRequestSummary[];
}

export async function getUserSolarStatus(userId: string): Promise<SolarUserStatus> {
  const [db, members] = await Promise.all([siteDatabase(), getSolarMembers()]);
  const memberRecord = members.find((m) => m.userId === userId) ?? null;

  const [appRes, leaveRes] = await Promise.all([
    db.query(
      `SELECT status, payload FROM site_requests
       WHERE user_id = $1 AND kind = 'application' AND payload->>'platform' = 'solar'
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    ),
    db.query(
      `SELECT id, status, public_note AS note, created_at AS "createdAt", payload
       FROM site_requests
       WHERE user_id = $1 AND kind = 'application' AND payload->>'platform' = 'solar-leave'
       ORDER BY created_at DESC LIMIT 20`,
      [userId],
    ),
  ]);

  const rawStatus = appRes.rows[0]?.status;
  const appPayload =
    appRes.rows[0]?.payload && typeof appRes.rows[0].payload === "object"
      ? (appRes.rows[0].payload as Record<string, unknown>)
      : {};
  let applicationStatus: SolarApplicationStatus =
    rawStatus === "accepted" || rawStatus === "pending" || rawStatus === "rejected"
      ? rawStatus
      : null;

  if (memberRecord && applicationStatus !== "accepted") {
    applicationStatus = "accepted";
  }

  const isMember = applicationStatus === "accepted" || Boolean(memberRecord);

  const prefillName =
    typeof appPayload.name === "string" && appPayload.name.trim()
      ? appPayload.name.trim()
      : memberRecord?.name;
  const prefillDiscord =
    typeof appPayload.discord === "string" && appPayload.discord.trim()
      ? appPayload.discord.trim()
      : undefined;
  const prefillPhone =
    typeof appPayload.whatsapp === "string" && appPayload.whatsapp.trim()
      ? appPayload.whatsapp.trim()
      : undefined;

  const prefill: SolarLeavePrefill | null =
    prefillName || prefillDiscord || prefillPhone
      ? {
          ...(prefillName ? { name: prefillName } : {}),
          ...(prefillDiscord ? { discord: prefillDiscord } : {}),
          ...(prefillPhone ? { phone: prefillPhone } : {}),
        }
      : null;

  const leaveRequests: SolarLeaveRequestSummary[] = leaveRes.rows.map((row) => {
    const p =
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {};
    return {
      id: String(row.id),
      status: String(row.status ?? "pending"),
      note: typeof row.note === "string" ? row.note : "",
      createdAt: String(row.createdAt ?? ""),
      leaveDuration: typeof p.leaveDuration === "string" ? p.leaveDuration : "",
      leaveDurationCustom:
        typeof p.leaveDurationCustom === "string" ? p.leaveDurationCustom : undefined,
      reason: typeof p.reason === "string" ? p.reason : "",
    };
  });

  return {
    applicationStatus,
    isMember,
    memberInfo: memberRecord
      ? {
          name: memberRecord.name,
          rank: memberRecord.rank,
          ...(memberRecord.handle ? { handle: memberRecord.handle } : {}),
        }
      : null,
    prefill,
    leaveRequests,
  };
}

export async function isAcceptedSolarMember(userId: string): Promise<boolean> {
  const [db, members] = await Promise.all([siteDatabase(), getSolarMembers()]);
  if (members.some((m) => m.userId === userId)) return true;
  const res = await db.query(
    `SELECT 1 FROM site_requests
     WHERE user_id = $1 AND kind = 'application' AND status = 'accepted' AND payload->>'platform' = 'solar'
     LIMIT 1`,
    [userId],
  );
  return res.rows.length > 0;
}
