import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { privateHeaders, readJSON, sameOrigin } from "@/lib/server/site-security";
import { isAcceptedSolarMember, getUserSolarStatus } from "@/lib/server/solar-member-status";
import {
  createSolarCollaborationRequest,
  getSolarCollaborationRequests,
  updateSolarCollaborationRequest,
} from "@/lib/server/solar-requests";
import { validateSolarRequestInput } from "@/lib/data/solar-requests";
import { resolveDutiesRoleId } from "@/lib/data/solar-duties";
import { limitAttempt } from "@/lib/server/site-content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = accountHeaders();
  const user = await accountUser(request, headers);
  if (!user) {
    return Response.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: privateHeaders });
  }

  const isMember = await isAcceptedSolarMember(user.id);
  if (!isMember) {
    return Response.json({ error: "NOT_MEMBER" }, { status: 403, headers: privateHeaders });
  }

  const status = await getUserSolarStatus(user.id);
  const requests = await getSolarCollaborationRequests();

  return Response.json(
    {
      requests,
      userRole: resolveDutiesRoleId(status.memberInfo?.rank),
      userRank: status.memberInfo?.rank || "",
    },
    { headers: privateHeaders },
  );
}

export async function POST(request: Request) {
  const headers = accountHeaders();
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }

  const user = await accountUser(request, headers);
  if (!user) {
    return Response.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: privateHeaders });
  }

  const isMember = await isAcceptedSolarMember(user.id);
  if (!isMember) {
    return Response.json({ error: "NOT_MEMBER" }, { status: 403, headers: privateHeaders });
  }

  // Rate limit creator requests to 5 per 15 minutes
  if (!(await limitAttempt("solar-req:" + user.id, 5, 900))) {
    return Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: privateHeaders });
  }

  const status = await getUserSolarStatus(user.id);
  const userRole = resolveDutiesRoleId(status.memberInfo?.rank);

  // Strictly Creators only can create requests
  if (userRole !== "creator") {
    return Response.json(
      { error: "CREATOR_ONLY", message: "هذه الميزة مخصصة حصراً لصناع المحتوى" },
      { status: 403, headers: privateHeaders },
    );
  }

  const body = await readJSON(request, 64000);
  const validated = validateSolarRequestInput(body);
  if (!validated) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400, headers: privateHeaders });
  }

  const creatorName =
    status.memberInfo?.name ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "صانع محتوى";

  const creatorAvatar =
    (typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined) ||
    (typeof user.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : undefined);

  const created = await createSolarCollaborationRequest({
    creatorUserId: user.id,
    creatorName,
    creatorAvatar,
    creatorDiscord: status.prefill?.discord,
    targetRole: validated.targetRole,
    title: validated.title,
    details: validated.details,
    materialsUrl: validated.materialsUrl,
    deadline: validated.deadline,
  });

  return Response.json({ ok: true, request: created }, { headers: privateHeaders });
}

export async function PATCH(request: Request) {
  const headers = accountHeaders();
  if (!sameOrigin(request)) {
    return Response.json({ error: "INVALID" }, { status: 403, headers: privateHeaders });
  }

  const user = await accountUser(request, headers);
  if (!user) {
    return Response.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: privateHeaders });
  }

  const isMember = await isAcceptedSolarMember(user.id);
  if (!isMember) {
    return Response.json({ error: "NOT_MEMBER" }, { status: 403, headers: privateHeaders });
  }

  const status = await getUserSolarStatus(user.id);
  const userRole = resolveDutiesRoleId(status.memberInfo?.rank);
  const body = (await readJSON(request, 16000)) as Record<string, unknown>;

  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const action = typeof body?.action === "string" ? body.action.trim() : "";

  if (!requestId || !action) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400, headers: privateHeaders });
  }

  const updated = await updateSolarCollaborationRequest(requestId, (current) => {
    if (action === "accept") {
      // Must be pending
      if (current.status !== "pending") return null;

      // Writers can only accept writer requests, Editors only editor requests, Designers only designer requests
      if (userRole !== current.targetRole) {
        return null;
      }

      const acceptedByName =
        status.memberInfo?.name ||
        (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "عضو الكلان");

      const acceptedByAvatar =
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : undefined;

      return {
        ...current,
        status: "in_progress",
        acceptedByUserId: user.id,
        acceptedByName,
        acceptedByAvatar,
        acceptedAt: new Date().toISOString(),
      };
    }

    if (action === "complete") {
      // Can be completed by the one who accepted it, the creator, or an admin
      if (
        user.id !== current.acceptedByUserId &&
        user.id !== current.creatorUserId &&
        userRole !== "admin"
      ) {
        return null;
      }

      return {
        ...current,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
    }

    if (action === "cancel") {
      // Can be cancelled by the creator or an admin
      if (user.id !== current.creatorUserId && userRole !== "admin") {
        return null;
      }

      return {
        ...current,
        status: "cancelled",
      };
    }

    return null;
  });

  if (!updated) {
    return Response.json(
      { error: "ACTION_FAILED", message: "تعذر تنفيذ الإجراء أو ليس لديك صلاحية" },
      { status: 400, headers: privateHeaders },
    );
  }

  return Response.json({ ok: true, request: updated }, { headers: privateHeaders });
}
