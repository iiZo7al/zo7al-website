import { hasAdminSession } from "@/lib/server/admin-account";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import {
  createSolarWarningPledge,
  deleteSolarWarningPledge,
  getSolarWarningPledges,
} from "@/lib/server/solar-warnings";
import type { SolarWarningDurationKey } from "@/lib/data/solar-warnings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession(request, "solar"))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  }
  try {
    const pledges = await getSolarWarningPledges();
    return Response.json({ ok: true, pledges }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession(request, "solar"))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }
  try {
    const body = (await readJSON(request, 16000)) as {
      memberId?: string;
      reason?: string;
      durationKey?: SolarWarningDurationKey;
      customDays?: number;
    };
    if (
      !body ||
      typeof body.memberId !== "string" ||
      typeof body.reason !== "string" ||
      typeof body.durationKey !== "string"
    ) {
      return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    }

    const pledge = await createSolarWarningPledge({
      memberId: body.memberId.trim(),
      reason: body.reason.trim(),
      durationKey: body.durationKey,
      customDays: typeof body.customDays === "number" ? body.customDays : undefined,
    });
    if (!pledge) {
      return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    }
    return Response.json({ ok: true, pledge }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession(request, "solar"))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: privateHeaders });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim() || "";
    if (!id) {
      return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    }
    const deleted = await deleteSolarWarningPledge(id);
    return Response.json({ ok: deleted }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
