import { AccountError, accountHeaders, requireAccount, accountView } from '@/lib/server/account-auth';
import { getStoreCatalog } from '@/lib/server/tebex';
import { siteDatabase } from '@/lib/server/site-db';
import { readSyncedProfile } from '@/lib/server/minecraft-bridge';
import { ownsRank } from '@/lib/data/rank-ownership';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { const headers = accountHeaders(); try {
    const user = await requireAccount(request, headers), member = await accountView(user);
    const [catalog, profile, applications] = await Promise.all([getStoreCatalog(), member.minecraft ? readSyncedProfile(member.minecraft.username) : Promise.resolve(null), (await siteDatabase()).query("SELECT DISTINCT payload->>'platform' AS platform FROM site_requests WHERE user_id=$1 AND kind='application'", [user.id])]);
    const trusted = !!member.minecraft && profile?.uuid?.toLowerCase() === member.minecraft.uuid.toLowerCase();
    return Response.json({ owned: trusted ? catalog.products.filter(p => ownsRank(profile?.rank, p.name)).map(p => p.id) : [], booster: trusted && ownsRank(profile?.rank, 'Booster'), creatorRank: trusted ? profile?.rank : null, applications: applications.rows.map(r => r.platform).filter(p => ['youtube', 'twitch', 'tiktok'].includes(p)) }, { headers });
}
catch (error) {
    return Response.json({ error: error instanceof AccountError ? error.code : 'UNAVAILABLE' }, { status: error instanceof AccountError ? error.status : 503, headers });
} }
