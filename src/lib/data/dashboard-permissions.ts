export const DASHBOARD_PERMISSION_KEYS = [
  "all",
  "overview",
  "console",
  "minecraft",
  "fortnite",
  "youtube",
  "modrinth",
  "curseforge",
  "solar",
  "badges",
  "profiles",
  "news",
  "event",
  "rule",
  "application",
  "support",
  "registrations",
  "orders",
  "community",
  "connections",
] as const;

export type DashboardPermission = (typeof DASHBOARD_PERMISSION_KEYS)[number];

export const DASHBOARD_SPECIFIC_PERMISSIONS = DASHBOARD_PERMISSION_KEYS.filter(
  (key): key is Exclude<DashboardPermission, "all"> => key !== "all",
);

export function normalizeDashboardPermissions(input: unknown): DashboardPermission[] {
  if (!Array.isArray(input)) return [];
  const validSet = new Set<string>(DASHBOARD_PERMISSION_KEYS);
  const out: DashboardPermission[] = [];
  for (const item of input) {
    if (typeof item === "string" && validSet.has(item)) {
      const perm = item as DashboardPermission;
      if (perm === "all") return ["all"];
      if (!out.includes(perm)) out.push(perm);
    }
  }
  return out;
}

export function hasDashboardPermission(
  permissions: readonly string[] | null | undefined,
  required: DashboardPermission,
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.includes("all") || permissions.includes(required);
}

export const DASHBOARD_PERMISSION_LABELS: Record<
  DashboardPermission,
  { ar: string; en: string }
> = {
  all: { ar: "كل الصلاحيات (إدارة كاملة)", en: "All Permissions (Full Admin)" },
  overview: { ar: "نظرة عامة", en: "Overview" },
  console: { ar: "Pelican (إدارة السيرفرات)", en: "Pelican Console" },
  minecraft: { ar: "إحصائيات Minecraft", en: "Minecraft" },
  fortnite: { ar: "إحصائيات Fortnite", en: "Fortnite" },
  youtube: { ar: "إدارة YouTube", en: "YouTube" },
  modrinth: { ar: "إدارة Modrinth", en: "Modrinth" },
  curseforge: { ar: "إحصائيات CurseForge", en: "CurseForge" },
  solar: { ar: "كلان سولار (Solar System)", en: "Solar Clan" },
  badges: { ar: "البادجات", en: "Badges" },
  profiles: { ar: "البروفايلات والصلاحيات", en: "Profiles & Permissions" },
  news: { ar: "الأخبار", en: "News" },
  event: { ar: "الفعاليات", en: "Events" },
  rule: { ar: "قوانين الشبكة", en: "Rules" },
  application: { ar: "تقديمات الصناع", en: "Creator Applications" },
  support: { ar: "مركز الدعم", en: "Support" },
  registrations: { ar: "تسجيلات الفعاليات", en: "Event Registrations" },
  orders: { ar: "طلبات المتجر", en: "Orders" },
  community: { ar: "المجتمع", en: "Community" },
  connections: { ar: "الاتصالات والإعدادات", en: "Connections" },
};
