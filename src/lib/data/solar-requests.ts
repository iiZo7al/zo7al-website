export type SolarRequestTargetRole = "writer" | "editor" | "designer";
export type SolarRequestStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface SolarCollaborationRequest {
  id: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorDiscord?: string;
  targetRole: SolarRequestTargetRole;
  title: string;
  details: string;
  materialsUrl?: string;
  deadline?: string;
  status: SolarRequestStatus;
  acceptedByUserId?: string;
  acceptedByName?: string;
  acceptedByAvatar?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const SOLAR_TARGET_ROLE_CONFIG: Record<
  SolarRequestTargetRole,
  { label: string; placeholder: string; icon: string }
> = {
  writer: {
    label: "كتاب الأفكار (سكريبت / أفكار)",
    placeholder: "مثال: سكريبت لتحدي فورتنايت جديد، أو أفكار لمقطع يوتيوب...",
    icon: "PenTool",
  },
  editor: {
    label: "الممنتجين (مونتاج فيديو)",
    placeholder: "مثال: مونتاج مقطع 12 دقيقة لتحدي ماينكرافت مع مؤثرات حركية...",
    icon: "Video",
  },
  designer: {
    label: "المصممين (صورة مصغرة / بنر)",
    placeholder: "مثال: تصميم صورة مصغرة جذابة (Thumbnail) ليوتيوب بعنوان...",
    icon: "Palette",
  },
};

export function isTargetRole(val: unknown): val is SolarRequestTargetRole {
  return val === "writer" || val === "editor" || val === "designer";
}

export function validateSolarRequestInput(raw: unknown): {
  targetRole: SolarRequestTargetRole;
  title: string;
  details: string;
  materialsUrl?: string;
  deadline?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const targetRole = typeof r.targetRole === "string" ? r.targetRole.trim() : "";
  if (!isTargetRole(targetRole)) return null;

  const title = typeof r.title === "string" ? r.title.trim().slice(0, 150) : "";
  if (!title || title.length < 3) return null;

  const details = typeof r.details === "string" ? r.details.trim().slice(0, 3000) : "";
  if (!details || details.length < 5) return null;

  const materialsUrl =
    typeof r.materialsUrl === "string" && r.materialsUrl.trim()
      ? r.materialsUrl.trim().slice(0, 500)
      : undefined;

  const deadline =
    typeof r.deadline === "string" && r.deadline.trim()
      ? r.deadline.trim().slice(0, 50)
      : undefined;

  return {
    targetRole,
    title,
    details,
    materialsUrl,
    deadline,
  };
}
