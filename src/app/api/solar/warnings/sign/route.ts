import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { limitAttempt } from "@/lib/server/site-content";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { getSolarMembers } from "@/lib/server/solar-members";
import { signSolarWarningPledge } from "@/lib/server/solar-warnings";
import { validateWarningPledgeSignature } from "@/lib/data/solar-warnings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = accountHeaders();
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }

  try {
    const user = await accountUser(request, headers);
    if (!user) {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: privateHeaders });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (
      !(await limitAttempt("solar-warning-sign:ip:" + ip, 10, 900)) ||
      !(await limitAttempt("solar-warning-sign:user:" + user.id, 10, 900))
    ) {
      return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
    }

    const body = await readJSON(request, 64000);
    const input = validateWarningPledgeSignature(body);
    if (!input) {
      return Response.json({ error: "INVALID" }, { status: 400, headers: privateHeaders });
    }

    const members = await getSolarMembers();
    const memberRecord = members.find((m) => m.userId === user.id);

    const updated = await signSolarWarningPledge({
      userId: user.id,
      memberId: memberRecord?.id,
      input,
    });
    if (!updated) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: privateHeaders });
    }

    return Response.json({ ok: true, pledge: updated }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
