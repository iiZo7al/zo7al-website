export type SolarWarningDurationKey =
  | "24_hours"
  | "3_days"
  | "7_days"
  | "14_days"
  | "30_days"
  | "custom";

export interface SolarWarningPledge {
  id: string;
  memberId: string;
  memberUserId?: string;
  memberName: string;
  memberRank: string;
  memberDiscord?: string;
  reason: string;
  durationKey: SolarWarningDurationKey;
  durationLabel: string;
  expiresAt: string;
  createdAt: string;
  status: "pending" | "signed";
  signedAt?: string;
  signerName?: string;
  signerAge?: string;
  signerDiscord?: string;
  signedContractUrl?: string;
  pledgeAgreed?: boolean;
}

export const SOLAR_WARNING_DURATIONS: {
  id: SolarWarningDurationKey;
  label: string;
  hours?: number;
}[] = [
  { id: "24_hours", label: "24 ساعة", hours: 24 },
  { id: "3_days", label: "3 أيام", hours: 72 },
  { id: "7_days", label: "أسبوع (7 أيام)", hours: 168 },
  { id: "14_days", label: "أسبوعين (14 يوماً)", hours: 336 },
  { id: "30_days", label: "شهر (30 يوماً)", hours: 720 },
  { id: "custom", label: "مدة مخصصة (تحديد من التقويم)" },
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function computeWarningExpiry(
  durationKey: SolarWarningDurationKey,
  customDays?: number,
  customStartDate?: string,
  customEndDate?: string,
): { expiresAt: string; durationLabel: string } | null {
  const now = Date.now();
  if (durationKey === "custom") {
    if (
      customStartDate &&
      customEndDate &&
      ISO_DATE_RE.test(customStartDate) &&
      ISO_DATE_RE.test(customEndDate)
    ) {
      const startMs = new Date(`${customStartDate}T00:00:00+03:00`).getTime();
      const endMs = new Date(`${customEndDate}T23:59:59+03:00`).getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;
      const days = Math.round((new Date(`${customEndDate}T00:00:00Z`).getTime() - new Date(`${customStartDate}T00:00:00Z`).getTime()) / 86400000) + 1;
      if (days < 1) return null;
      const daysText =
        days === 1 ? "يوم" : days === 2 ? "يومين" : days <= 10 ? "أيام" : "يوماً";
      return {
        expiresAt: new Date(endMs).toISOString(),
        durationLabel: `من ${customStartDate} إلى ${customEndDate} (${days} ${daysText})`,
      };
    }

    const days = typeof customDays === "number" ? Math.round(customDays) : NaN;
    if (!Number.isFinite(days) || days < 1) return null;
    const expiresAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
    const durationLabel =
      days === 1
        ? "يوم واحد"
        : days === 2
          ? "يومين"
          : days <= 10
            ? `${days} أيام`
            : `${days} يوماً`;
    return { expiresAt, durationLabel };
  }

  const found = SOLAR_WARNING_DURATIONS.find((d) => d.id === durationKey);
  if (!found || !found.hours) return null;
  const expiresAt = new Date(now + found.hours * 60 * 60 * 1000).toISOString();
  return { expiresAt, durationLabel: found.label };
}

export interface SolarWarningSignatureInput {
  pledgeId: string;
  name: string;
  age: string;
  discord: string;
  signedContractUrl: string;
  pledgeAgreed: boolean;
}

export function validateWarningPledgeSignature(
  raw: unknown,
): SolarWarningSignatureInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const pledgeId = typeof b.pledgeId === "string" ? b.pledgeId.trim() : "";
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  const age = typeof b.age === "string" ? b.age.trim().slice(0, 12) : "";
  const discord = typeof b.discord === "string" ? b.discord.trim().slice(0, 60) : "";
  const signedContractUrl =
    typeof b.signedContractUrl === "string" ? b.signedContractUrl.trim().slice(0, 500) : "";
  const pledgeAgreed = b.pledgeAgreed === true || b.pledgeAgreed === "true";

  if (!pledgeId || !name || !age || !discord || !signedContractUrl || !pledgeAgreed) {
    return null;
  }
  if (!signedContractUrl.startsWith("/") && !/^https?:\/\//i.test(signedContractUrl)) {
    return null;
  }
  return {
    pledgeId,
    name,
    age,
    discord,
    signedContractUrl,
    pledgeAgreed: true,
  };
}
