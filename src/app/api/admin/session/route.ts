import { getAdminPermissions, ownerAccountsConfigured } from "@/lib/server/admin-account";
import { configuredAdmin, privateHeaders } from "@/lib/server/site-security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await getAdminPermissions(request);
  return Response.json(
    {
      authenticated: auth !== null,
      configured: configuredAdmin() || ownerAccountsConfigured(),
      permissions: auth?.permissions ?? [],
      isOwner: auth?.isOwner ?? false,
    },
    { headers: privateHeaders },
  );
}
