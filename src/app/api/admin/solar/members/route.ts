import { hasAdminSession } from "@/lib/server/admin-account";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import {
  deleteSolarMember,
  getSolarMembers,
  moveSolarMember,
  upsertSolarMember,
} from "@/lib/server/solar-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession(request, "solar"))) {
    return Response.json(
      { error: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders },
    );
  }
  try {
    const members = await getSolarMembers();
    return Response.json({ ok: true, members }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: privateHeaders },
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession(request, "solar"))) {
    return Response.json(
      { error: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders },
    );
  }
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "INVALID" },
      { status: 403, headers: privateHeaders },
    );
  }
  try {
    const body = (await readJSON(request, 16384)) as {
      action?: string;
      id?: string;
      direction?: "up" | "down";
      member?: {
        id?: string;
        name?: string;
        rank?: string;
        avatar?: string;
        bio?: string;
        socials?: unknown;
      };
    };

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "INVALID" },
        { status: 400, headers: privateHeaders },
      );
    }

    if (body.action === "upsert" && body.member) {
      const members = await upsertSolarMember(body.member);
      return Response.json({ ok: true, members }, { headers: privateHeaders });
    }

    if (body.action === "delete" && typeof body.id === "string") {
      const members = await deleteSolarMember(body.id);
      return Response.json({ ok: true, members }, { headers: privateHeaders });
    }

    if (
      body.action === "move" &&
      typeof body.id === "string" &&
      (body.direction === "up" || body.direction === "down")
    ) {
      const members = await moveSolarMember(body.id, body.direction);
      return Response.json({ ok: true, members }, { headers: privateHeaders });
    }

    return Response.json(
      { error: "INVALID" },
      { status: 400, headers: privateHeaders },
    );
  } catch (err) {
    const status = err instanceof Error && err.message === "INVALID" ? 400 : 503;
    return Response.json(
      { error: status === 400 ? "INVALID" : "UNAVAILABLE" },
      { status, headers: privateHeaders },
    );
  }
}
