import "server-only";
import { siteDatabase } from "@/lib/server/site-db";
import type { SolarAdminSubType, SolarRole } from "@/lib/data/solar";
import { buildSolarPlanRows, matchesPlanRow } from "@/lib/data/solar-plan";

const VALID_ROLES: SolarRole[] = [
  "admin",
  "creator",
  "streamer",
  "writer",
  "editor",
  "designer",
  "player",
];

const VALID_ADMIN_SUBTYPES: SolarAdminSubType[] = [
  "president",
  "vice_president",
  "exec_supervisor",
  "dept_supervisor",
  "general_admin",
  "admin_monitor",
  "creators_supervisor",
  "creators_admin",
  "designers_supervisor",
  "players_supervisor",
  "players_admin",
  "editors_supervisor",
  "streamers_supervisor",
];

const VALID_GAMES = ["fortnite", "rocket", "minecraft", "fifa", "cod"] as const;

export type CustomSolarOption = {
  id: string;
  label: string;
};

export type SolarSettings = {
  isOpen: boolean;
  announcement: string;
  closedRoles: string[];
  closedAdminSubTypes: string[];
  closedGames: string[];
  customRoles: CustomSolarOption[];
  customAdminSubTypes: CustomSolarOption[];
  customGames: CustomSolarOption[];
  roleQuotas: Record<string, number>;
  requirements: string;
  updatedAt: string;
};

export const DEFAULT_SOLAR_SETTINGS: SolarSettings = {
  isOpen: true,
  announcement: "",
  closedRoles: [],
  closedAdminSubTypes: [],
  closedGames: [],
  customRoles: [],
  customAdminSubTypes: [],
  customGames: [],
  roleQuotas: {},
  requirements: "",
  updatedAt: new Date(0).toISOString(),
};

function sanitizeRoleQuotas(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.trim().toLowerCase();
    if (!/^[a-z0-9_:-]{2,60}$/.test(key)) continue;
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num) || num < 0 || num > 500) continue;
    out[key] = Math.floor(num);
    count++;
    if (count >= 120) break;
  }
  return out;
}

function sanitizeCustomOptions(raw: unknown): CustomSolarOption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CustomSolarOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id.trim().toLowerCase() : "";
    const label = typeof rec.label === "string" ? rec.label.trim().slice(0, 60) : "";
    if (!/^[a-z0-9_-]{2,40}$/.test(id) || !label || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
    if (out.length >= 30) break;
  }
  return out;
}

function filterAllowedIds(raw: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw.filter((v): v is string => typeof v === "string" && allowed.has(v))
    )
  );
}

export async function getSolarSettings(): Promise<SolarSettings> {
  try {
    const db = await siteDatabase();
    const result = await db.query(
      "SELECT payload, updated_at AS \"updatedAt\" FROM site_platform_cache WHERE platform = 'solar_recruitment_settings' LIMIT 1"
    );
    if (!result.rows.length || !result.rows[0].payload) {
      return DEFAULT_SOLAR_SETTINGS;
    }
    const payload = result.rows[0].payload as Partial<SolarSettings>;
    const customRoles = sanitizeCustomOptions(payload.customRoles);
    const customAdminSubTypes = sanitizeCustomOptions(payload.customAdminSubTypes);
    const customGames = sanitizeCustomOptions(payload.customGames);

    const allowedRoles = new Set<string>([...VALID_ROLES, ...customRoles.map((r) => r.id)]);
    const allowedSubTypes = new Set<string>([...VALID_ADMIN_SUBTYPES, ...customAdminSubTypes.map((s) => s.id)]);
    const allowedGames = new Set<string>([...VALID_GAMES, ...customGames.map((g) => g.id)]);

    return {
      isOpen: typeof payload.isOpen === "boolean" ? payload.isOpen : true,
      announcement: typeof payload.announcement === "string" ? payload.announcement.slice(0, 500) : "",
      closedRoles: filterAllowedIds(payload.closedRoles, allowedRoles),
      closedAdminSubTypes: filterAllowedIds(payload.closedAdminSubTypes, allowedSubTypes),
      closedGames: filterAllowedIds(payload.closedGames, allowedGames),
      customRoles,
      customAdminSubTypes,
      customGames,
      roleQuotas: sanitizeRoleQuotas(payload.roleQuotas),
      requirements: typeof payload.requirements === "string" ? payload.requirements.slice(0, 2000) : "",
      updatedAt: result.rows[0].updatedAt
        ? new Date(result.rows[0].updatedAt).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return DEFAULT_SOLAR_SETTINGS;
  }
}

export async function saveSolarSettings(input: Partial<SolarSettings>): Promise<SolarSettings> {
  const current = await getSolarSettings();
  const customRoles =
    input.customRoles !== undefined ? sanitizeCustomOptions(input.customRoles) : current.customRoles;
  const customAdminSubTypes =
    input.customAdminSubTypes !== undefined
      ? sanitizeCustomOptions(input.customAdminSubTypes)
      : current.customAdminSubTypes;
  const customGames =
    input.customGames !== undefined ? sanitizeCustomOptions(input.customGames) : current.customGames;

  const allowedRoles = new Set<string>([...VALID_ROLES, ...customRoles.map((r) => r.id)]);
  const allowedSubTypes = new Set<string>([...VALID_ADMIN_SUBTYPES, ...customAdminSubTypes.map((s) => s.id)]);
  const allowedGames = new Set<string>([...VALID_GAMES, ...customGames.map((g) => g.id)]);

  const next: SolarSettings = {
    isOpen: typeof input.isOpen === "boolean" ? input.isOpen : current.isOpen,
    announcement:
      typeof input.announcement === "string"
        ? input.announcement.trim().slice(0, 500)
        : current.announcement,
    closedRoles:
      input.closedRoles !== undefined
        ? filterAllowedIds(input.closedRoles, allowedRoles)
        : filterAllowedIds(current.closedRoles, allowedRoles),
    closedAdminSubTypes:
      input.closedAdminSubTypes !== undefined
        ? filterAllowedIds(input.closedAdminSubTypes, allowedSubTypes)
        : filterAllowedIds(current.closedAdminSubTypes, allowedSubTypes),
    closedGames:
      input.closedGames !== undefined
        ? filterAllowedIds(input.closedGames, allowedGames)
        : filterAllowedIds(current.closedGames, allowedGames),
    customRoles,
    customAdminSubTypes,
    customGames,
    roleQuotas:
      input.roleQuotas !== undefined
        ? sanitizeRoleQuotas(input.roleQuotas)
        : current.roleQuotas,
    requirements:
      typeof input.requirements === "string"
        ? input.requirements.trim().slice(0, 2000)
        : current.requirements,
    updatedAt: new Date().toISOString(),
  };

  const db = await siteDatabase();
  await db.query(
    `INSERT INTO site_platform_cache (platform, payload, updated_at)
     VALUES ('solar_recruitment_settings', $1, now())
     ON CONFLICT (platform)
     DO UPDATE SET payload = $1, updated_at = now()`,
    [JSON.stringify(next)]
  );

  return next;
}

export type EffectiveSolarSettings = SolarSettings & {
  fullPlanKeys: string[];
};

export async function getEffectiveSolarSettings(): Promise<EffectiveSolarSettings> {
  const settings = await getSolarSettings();
  const fullPlanKeys: string[] = [];

  try {
    const db = await siteDatabase();
    const res = await db.query(
      `SELECT payload FROM site_requests
       WHERE kind = 'application'
         AND status = 'accepted'
         AND COALESCE(payload->>'platform', '') NOT IN ('solar-leave', 'solar-events')
         AND (payload->>'platform' = 'solar' OR COALESCE(payload->>'subject', '') LIKE '%Solar%')`
    );
    const acceptedPayloads = res.rows
      .map((r) => (r.payload && typeof r.payload === "object" ? (r.payload as Record<string, unknown>) : null))
      .filter((p): p is Record<string, unknown> => p !== null);

    const planRows = buildSolarPlanRows({
      customGames: settings.customGames,
      customAdminSubTypes: settings.customAdminSubTypes,
      customRoles: settings.customRoles,
    });

    const closedRolesSet = new Set(settings.closedRoles);
    const closedSubTypesSet = new Set(settings.closedAdminSubTypes);

    let playerRowsTotal = 0;
    let playerRowsFull = 0;
    let supRowsTotal = 0;
    let supRowsFull = 0;
    let paRowsTotal = 0;
    let paRowsFull = 0;

    for (const def of planRows) {
      const required =
        typeof settings.roleQuotas[def.key] === "number"
          ? settings.roleQuotas[def.key]
          : def.defaultCount;
      const occupied = acceptedPayloads.filter((p) => matchesPlanRow(p, def)).length;
      const isFull = occupied >= required;
      if (isFull) {
        fullPlanKeys.push(def.key);
      }

      if (def.role === "player" && def.game) {
        playerRowsTotal++;
        if (isFull) playerRowsFull++;
      } else if (def.role === "admin" && def.adminSubType === "players_supervisor" && def.game) {
        supRowsTotal++;
        if (isFull) supRowsFull++;
      } else if (def.role === "admin" && def.adminSubType === "players_admin" && def.game) {
        paRowsTotal++;
        if (isFull) paRowsFull++;
      } else if (def.role === "admin" && def.adminSubType && isFull) {
        closedSubTypesSet.add(def.adminSubType);
      } else if (def.role !== "admin" && isFull) {
        closedRolesSet.add(def.role);
      }
    }

    if (playerRowsTotal > 0 && playerRowsFull === playerRowsTotal) {
      closedRolesSet.add("player");
    }
    if (supRowsTotal > 0 && supRowsFull === supRowsTotal) {
      closedSubTypesSet.add("players_supervisor");
    }
    if (paRowsTotal > 0 && paRowsFull === paRowsTotal) {
      closedSubTypesSet.add("players_admin");
    }

    return {
      ...settings,
      closedRoles: Array.from(closedRolesSet),
      closedAdminSubTypes: Array.from(closedSubTypesSet),
      fullPlanKeys,
    };
  } catch {
    return {
      ...settings,
      fullPlanKeys,
    };
  }
}

