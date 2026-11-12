import "server-only";
import { siteDatabase } from "@/lib/server/site-db";
import type { SolarRole } from "@/lib/data/solar";

export type SolarSettings = {
  isOpen: boolean;
  announcement: string;
  closedRoles: SolarRole[];
  requirements: string;
  updatedAt: string;
};

export const DEFAULT_SOLAR_SETTINGS: SolarSettings = {
  isOpen: true,
  announcement: "",
  closedRoles: [],
  requirements: "",
  updatedAt: new Date(0).toISOString(),
};

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
    return {
      isOpen: typeof payload.isOpen === "boolean" ? payload.isOpen : true,
      announcement: typeof payload.announcement === "string" ? payload.announcement.slice(0, 500) : "",
      closedRoles: Array.isArray(payload.closedRoles)
        ? (payload.closedRoles.filter((r): r is SolarRole =>
            ["admin", "creator", "streamer", "writer", "editor", "designer", "player"].includes(String(r))
          ))
        : [],
      requirements: typeof payload.requirements === "string" ? payload.requirements.slice(0, 2000) : "",
      updatedAt: result.rows[0].updatedAt ? new Date(result.rows[0].updatedAt).toISOString() : new Date().toISOString(),
    };
  } catch {
    return DEFAULT_SOLAR_SETTINGS;
  }
}

export async function saveSolarSettings(input: Partial<SolarSettings>): Promise<SolarSettings> {
  const current = await getSolarSettings();
  const next: SolarSettings = {
    isOpen: typeof input.isOpen === "boolean" ? input.isOpen : current.isOpen,
    announcement: typeof input.announcement === "string" ? input.announcement.trim().slice(0, 500) : current.announcement,
    closedRoles: Array.isArray(input.closedRoles)
      ? input.closedRoles.filter((r): r is SolarRole =>
          ["admin", "creator", "streamer", "writer", "editor", "designer", "player"].includes(String(r))
        )
      : current.closedRoles,
    requirements: typeof input.requirements === "string" ? input.requirements.trim().slice(0, 2000) : current.requirements,
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
