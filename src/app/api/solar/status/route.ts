import { accountHeaders, accountUser } from "@/lib/server/account-auth";
import { privateHeaders } from "@/lib/server/site-security";
import { getUserSolarStatus } from "@/lib/server/solar-member-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = accountHeaders();
  try {
    const user = await accountUser(request, headers);
    if (!user) {
      return Response.json(
        {
          applicationStatus: null,
          isMember: false,
          memberInfo: null,
          prefill: null,
          leaveRequests: [],
        },
        { headers: privateHeaders },
      );
    }
    const status = await getUserSolarStatus(user.id);
    return Response.json(status, { headers: privateHeaders });
  } catch {
    return Response.json(
      {
        applicationStatus: null,
        isMember: false,
        memberInfo: null,
        prefill: null,
        leaveRequests: [],
      },
      { headers: privateHeaders },
    );
  }
}
