export const SOLAR_LEAVE_DURATIONS = [
  { id: "2_days", label: "يومين" },
  { id: "3_days", label: "3 ايام" },
  { id: "4_days", label: "4 ايام" },
  { id: "5_days", label: "5 ايام" },
  { id: "6_days", label: "6 ايام" },
  { id: "1_week", label: "اسبوع" },
  { id: "2_weeks", label: "اسبوعين" },
  { id: "other", label: "أخرى" },
] as const;

export type SolarLeaveDuration = (typeof SOLAR_LEAVE_DURATIONS)[number]["id"];

export const SOLAR_LEAVE_DURATION_LABELS: Record<string, string> = {
  "2_days": "يومين",
  "3_days": "3 ايام",
  "4_days": "4 ايام",
  "5_days": "5 ايام",
  "6_days": "6 ايام",
  "1_week": "اسبوع",
  "2_weeks": "اسبوعين",
  other: "أخرى",
};

export interface SolarLeaveInput {
  name: string;
  discord: string;
  phone: string;
  leaveDuration: SolarLeaveDuration;
  leaveDurationCustom?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  pledgeAgreed: boolean;
  signedContractUrl: string;
  reason: string;
}

const VALID_DURATIONS = new Set<string>(SOLAR_LEAVE_DURATIONS.map((d) => d.id));
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(val: unknown, max: number): string {
  return typeof val === "string" ? val.trim().slice(0, max) : "";
}

function diffCalendarDays(startIso: string, endIso: string): number | null {
  if (!ISO_DATE_RE.test(startIso) || !ISO_DATE_RE.test(endIso)) return null;
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86400000) + 1;
}

export function validateSolarLeaveApplication(
  body: unknown,
): SolarLeaveInput | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;

  const name = cleanText(r.name, 80);
  const discord = cleanText(r.discord, 60);
  const phone = cleanText(r.phone, 30);
  const leaveDurationRaw = cleanText(r.leaveDuration, 20);
  const leaveDurationCustom = cleanText(r.leaveDurationCustom, 80);
  const leaveStartDate = cleanText(r.leaveStartDate, 20);
  const leaveEndDate = cleanText(r.leaveEndDate, 20);
  const pledgeAgreed = r.pledgeAgreed === true;
  const signedContractUrl = cleanText(r.signedContractUrl, 400);
  const reason = cleanText(r.reason, 2000);

  if (!name || !discord || !phone) return null;
  if (!VALID_DURATIONS.has(leaveDurationRaw)) return null;

  let resolvedCustom = leaveDurationCustom;
  if (leaveDurationRaw === "other") {
    if (leaveStartDate || leaveEndDate) {
      const days = diffCalendarDays(leaveStartDate, leaveEndDate);
      if (days === null || days < 1 || days > 14) return null;
      if (!resolvedCustom) {
        resolvedCustom = `من ${leaveStartDate} إلى ${leaveEndDate} (${days} ${days === 1 ? "يوم" : days === 2 ? "يومين" : days <= 10 ? "أيام" : "يوماً"})`;
      }
    }
    if (!resolvedCustom) return null;
  }

  if (!pledgeAgreed) return null;
  if (!signedContractUrl.startsWith("/api/solar/media/")) return null;
  if (!reason) return null;

  return {
    name,
    discord,
    phone,
    leaveDuration: leaveDurationRaw as SolarLeaveDuration,
    ...(leaveDurationRaw === "other"
      ? {
          leaveDurationCustom: resolvedCustom,
          ...(leaveStartDate && leaveEndDate
            ? { leaveStartDate, leaveEndDate }
            : {}),
        }
      : {}),
    pledgeAgreed: true,
    signedContractUrl,
    reason,
  };
}
