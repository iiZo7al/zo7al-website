import { hasAdminSession } from "@/lib/server/admin-account";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { getSolarSettings, saveSolarSettings } from "@/lib/server/solar-settings";
import type { SolarRole } from "@/lib/data/solar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  }
  try {
    const settings = await getSolarSettings();
    return Response.json({ ok: true, settings }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }
  try {
    const body = await readJSON(request, 8000) as {
      isOpen?: boolean;
      announcement?: string;
      closedRoles?: SolarRole[];
      requirements?: string;
    };

    if (!body || typeof body !== "object") {
      return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    }

    const updated = await saveSolarSettings({
      isOpen: typeof body.isOpen === "boolean" ? body.isOpen : undefined,
      announcement: typeof body.announcement === "string" ? body.announcement : undefined,
      closedRoles: Array.isArray(body.closedRoles) ? body.closedRoles : undefined,
      requirements: typeof body.requirements === "string" ? body.requirements : undefined,
    });

    return Response.json({ ok: true, settings: updated }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
