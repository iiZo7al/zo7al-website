export interface SolarPlanRowDef {
  key: string;
  department: string;
  rankLabel: string;
  defaultCount: number;
  role: string;
  adminSubType?: string;
  game?: string;
  isCustom?: boolean;
}

export const BUILTIN_SOLAR_PLAN_ROWS: SolarPlanRowDef[] = [
  // الإدارة العليا
  { key: "admin:president", department: "الإدارة العليا", rankLabel: "الرئيس", defaultCount: 1, role: "admin", adminSubType: "president" },
  { key: "admin:vice_president", department: "الإدارة العليا", rankLabel: "نائب الرئيس", defaultCount: 1, role: "admin", adminSubType: "vice_president" },
  { key: "admin:exec_supervisor", department: "الإدارة العليا", rankLabel: "الرئيس التنفيذي", defaultCount: 1, role: "admin", adminSubType: "exec_supervisor" },
  { key: "admin:dept_supervisor", department: "الإدارة العليا", rankLabel: "مشرف الأقسام", defaultCount: 1, role: "admin", adminSubType: "dept_supervisor" },
  { key: "admin:general_admin", department: "الإدارة العليا", rankLabel: "الإدارة العامة", defaultCount: 2, role: "admin", adminSubType: "general_admin" },
  { key: "admin:admin_monitor", department: "الإدارة العليا", rankLabel: "مراقب الإدارة", defaultCount: 1, role: "admin", adminSubType: "admin_monitor" },

  // صناع المحتوى
  { key: "admin:creators_supervisor", department: "صناع المحتوى", rankLabel: "مشرف صناع المحتوى", defaultCount: 1, role: "admin", adminSubType: "creators_supervisor" },
  { key: "admin:creators_admin", department: "صناع المحتوى", rankLabel: "إداري صناع المحتوى", defaultCount: 2, role: "admin", adminSubType: "creators_admin" },
  { key: "role:creator", department: "صناع المحتوى", rankLabel: "صانع محتوى", defaultCount: 10, role: "creator" },
  { key: "admin:streamers_supervisor", department: "صناع المحتوى", rankLabel: "إداري ستريمر", defaultCount: 1, role: "admin", adminSubType: "streamers_supervisor" },
  { key: "role:streamer", department: "صناع المحتوى", rankLabel: "ستريمر", defaultCount: 3, role: "streamer" },

  // فورتنايت
  { key: "admin:players_supervisor:fortnite", department: "فورتنايت", rankLabel: "مشرف لاعبين فورتنايت", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "fortnite" },
  { key: "admin:players_admin:fortnite", department: "فورتنايت", rankLabel: "إداري لاعبين فورتنايت", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "fortnite" },
  { key: "player:fortnite", department: "فورتنايت", rankLabel: "لاعب فورتنايت", defaultCount: 5, role: "player", game: "fortnite" },

  // ماينكرافت
  { key: "admin:players_supervisor:minecraft", department: "ماينكرافت", rankLabel: "مشرف لاعبين ماينكرافت", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "minecraft" },
  { key: "admin:players_admin:minecraft", department: "ماينكرافت", rankLabel: "إداري لاعبين ماينكرافت", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "minecraft" },
  { key: "player:minecraft", department: "ماينكرافت", rankLabel: "لاعب ماينكرافت", defaultCount: 3, role: "player", game: "minecraft" },

  // روكيت ليق
  { key: "admin:players_supervisor:rocket", department: "روكيت ليق", rankLabel: "مشرف لاعبين روكيت ليق", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "rocket" },
  { key: "admin:players_admin:rocket", department: "روكيت ليق", rankLabel: "إداري لاعبين روكيت ليق", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "rocket" },
  { key: "player:rocket", department: "روكيت ليق", rankLabel: "لاعب روكيت ليق", defaultCount: 5, role: "player", game: "rocket" },

  // فيفا
  { key: "admin:players_supervisor:fifa", department: "فيفا", rankLabel: "مشرف لاعبين فيفا", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "fifa" },
  { key: "admin:players_admin:fifa", department: "فيفا", rankLabel: "إداري لاعبين فيفا", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "fifa" },
  { key: "player:fifa", department: "فيفا", rankLabel: "لاعب فيفا", defaultCount: 5, role: "player", game: "fifa" },

  // كود (Call of Duty)
  { key: "admin:players_supervisor:cod", department: "كود", rankLabel: "مشرف لاعبين كود", defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: "cod" },
  { key: "admin:players_admin:cod", department: "كود", rankLabel: "إداري لاعبين كود", defaultCount: 1, role: "admin", adminSubType: "players_admin", game: "cod" },
  { key: "player:cod", department: "كود", rankLabel: "لاعب كود", defaultCount: 5, role: "player", game: "cod" },

  // الأفكار والتصميم والمونتاج
  { key: "role:writer", department: "الأفكار والتصميم والمونتاج", rankLabel: "كاتب أفكار الكلان", defaultCount: 3, role: "writer" },
  { key: "admin:designers_supervisor", department: "الأفكار والتصميم والمونتاج", rankLabel: "مشرف المصممين", defaultCount: 1, role: "admin", adminSubType: "designers_supervisor" },
  { key: "role:designer", department: "الأفكار والتصميم والمونتاج", rankLabel: "مصمم", defaultCount: 3, role: "designer" },
  { key: "admin:editors_supervisor", department: "الأفكار والتصميم والمونتاج", rankLabel: "مشرف الممنتجين", defaultCount: 1, role: "admin", adminSubType: "editors_supervisor" },
  { key: "role:editor", department: "الأفكار والتصميم والمونتاج", rankLabel: "ممنتج", defaultCount: 3, role: "editor" },
];

export function buildSolarPlanRows(custom?: {
  customGames?: { id: string; label: string }[];
  customAdminSubTypes?: { id: string; label: string }[];
  customRoles?: { id: string; label: string }[];
  hiddenRoles?: string[];
  hiddenAdminSubTypes?: string[];
  hiddenGames?: string[];
  labelOverrides?: Record<string, string>;
}): SolarPlanRowDef[] {
  const hiddenRoles = new Set(custom?.hiddenRoles ?? []);
  const hiddenSubs = new Set(custom?.hiddenAdminSubTypes ?? []);
  const hiddenGames = new Set(custom?.hiddenGames ?? []);
  const overrides = custom?.labelOverrides ?? {};

  const list: SolarPlanRowDef[] = BUILTIN_SOLAR_PLAN_ROWS.filter((row) => {
    if (hiddenRoles.has(row.role)) return false;
    if (row.adminSubType && hiddenSubs.has(row.adminSubType)) return false;
    if (row.game && hiddenGames.has(row.game)) return false;
    return true;
  }).map((row) => {
    let rankLabel = row.rankLabel;
    let department = row.department;
    if (row.role !== "admin" && !row.game && overrides[`role:${row.role}`]) {
      rankLabel = overrides[`role:${row.role}`];
    } else if (row.role === "admin" && row.adminSubType && !row.game && overrides[`subtype:${row.adminSubType}`]) {
      rankLabel = overrides[`subtype:${row.adminSubType}`];
    } else if (row.game && overrides[`game:${row.game}`]) {
      const gLabel = overrides[`game:${row.game}`];
      department = gLabel;
      if (row.role === "player") rankLabel = `لاعب ${gLabel}`;
      else if (row.adminSubType === "players_supervisor") rankLabel = `مشرف لاعبين ${gLabel}`;
      else if (row.adminSubType === "players_admin") rankLabel = `إداري لاعبين ${gLabel}`;
    }
    return { ...row, department, rankLabel };
  });

  if (custom?.customGames?.length) {
    for (const g of custom.customGames) {
      if (hiddenGames.has(g.id)) continue;
      list.push(
        { key: `admin:players_supervisor:${g.id}`, department: g.label, rankLabel: `مشرف لاعبين ${g.label}`, defaultCount: 1, role: "admin", adminSubType: "players_supervisor", game: g.id, isCustom: true },
        { key: `admin:players_admin:${g.id}`, department: g.label, rankLabel: `إداري لاعبين ${g.label}`, defaultCount: 1, role: "admin", adminSubType: "players_admin", game: g.id, isCustom: true },
        { key: `player:${g.id}`, department: g.label, rankLabel: `لاعب ${g.label}`, defaultCount: 5, role: "player", game: g.id, isCustom: true }
      );
    }
  }
  if (custom?.customAdminSubTypes?.length) {
    for (const s of custom.customAdminSubTypes) {
      if (hiddenSubs.has(s.id)) continue;
      list.push({
        key: `admin:${s.id}`,
        department: "تخصصات إدارية",
        rankLabel: s.label,
        defaultCount: 1,
        role: "admin",
        adminSubType: s.id,
        isCustom: true,
      });
    }
  }
  if (custom?.customRoles?.length) {
    for (const r of custom.customRoles) {
      if (hiddenRoles.has(r.id)) continue;
      list.push({
        key: `role:${r.id}`,
        department: "الأقسام والرتب",
        rankLabel: r.label,
        defaultCount: 1,
        role: r.id,
        isCustom: true,
      });
    }
  }
  return list;
}

export function matchesPlanRow(
  payload: Record<string, unknown>,
  def: SolarPlanRowDef
): boolean {
  const rRole = String(payload.role || "");
  const rSub = String(payload.adminSubType || "");
  const rGame = String(payload.game || "");
  if (rRole !== def.role) return false;
  if (def.adminSubType && rSub !== def.adminSubType) return false;
  if (def.game && rGame !== def.game) return false;
  return true;
}
