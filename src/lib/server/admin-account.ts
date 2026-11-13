import 'server-only';
import { hasAdminSession as passwordSession } from './site-security';
import { accountUser } from './account-auth';
import { siteDatabase } from './site-db';
import {
  hasDashboardPermission,
  normalizeDashboardPermissions,
  type DashboardPermission,
} from '@/lib/data/dashboard-permissions';

export function isOwnerAccount(id: string) {
  return (process.env.ZO7AL_ADMIN_ACCOUNT_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => /^[a-f0-9-]{36}$/i.test(v))
    .includes(id);
}

export function ownerAccountsConfigured() {
  return (process.env.ZO7AL_ADMIN_ACCOUNT_IDS ?? '')
    .split(',')
    .some((v) => /^[a-f0-9-]{36}$/i.test(v.trim()));
}

export async function getAccountDashboardPermissions(
  userId: string,
): Promise<DashboardPermission[]> {
  if (!userId) return [];
  if (isOwnerAccount(userId)) return ['all'];
  try {
    const db = await siteDatabase();
    const res = await db.query(
      'SELECT permissions FROM site_dashboard_permissions WHERE user_id = $1',
      [userId],
    );
    return normalizeDashboardPermissions(res.rows[0]?.permissions);
  } catch {
    return [];
  }
}

export async function getAdminPermissions(
  request: Request,
): Promise<{ permissions: DashboardPermission[]; isOwner: boolean } | null> {
  if (passwordSession(request)) {
    return { permissions: ['all'], isOwner: true };
  }
  try {
    const user = await accountUser(request);
    if (!user) return null;
    if (isOwnerAccount(user.id)) {
      return { permissions: ['all'], isOwner: true };
    }
    const permissions = await getAccountDashboardPermissions(user.id);
    if (permissions.length === 0) return null;
    return { permissions, isOwner: false };
  } catch {
    return null;
  }
}

/** Authorize the remotely validated immutable member ID, never an email/name/provider metadata claim. */
export async function hasAdminSession(
  request: Request,
  requiredPermission?: DashboardPermission,
): Promise<boolean> {
  const auth = await getAdminPermissions(request);
  if (!auth) return false;
  if (!requiredPermission) return true;
  return hasDashboardPermission(auth.permissions, requiredPermission);
}

