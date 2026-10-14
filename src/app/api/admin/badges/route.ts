import { randomUUID } from 'node:crypto';
import { hasAdminSession } from '@/lib/server/admin-account';
import { privateHeaders, sameOrigin, readJSON } from '@/lib/server/site-security';
import { siteDatabase } from '@/lib/server/site-db';
import { limitAttempt } from '@/lib/server/site-content';
import { isUUID } from '@/lib/data/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { if (!await hasAdminSession(request))
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: privateHeaders }); try {
    const db = await siteDatabase(), q = new URL(request.url).searchParams.get('q')?.slice(0, 64) ?? '', [badges, members] = await Promise.all([db.query('SELECT b.id,b.name,b.archived,json_build_object(\'id\',i.id,\'width\',i.width,\'height\',i.height) AS image FROM site_badges b JOIN site_content_images i ON i.id=b.image_id ORDER BY b.created_at DESC LIMIT 100'), db.query("SELECT a.id,a.name,a.username,a.avatar,COALESCE(array_agg(m.badge_id) FILTER(WHERE m.badge_id IS NOT NULL),'{}') AS badges FROM site_accounts a LEFT JOIN site_member_badges m ON m.user_id=a.id WHERE a.deleted_at IS NULL AND a.auth_purged_at IS NULL AND (a.name ILIKE $1 OR a.username ILIKE $1) GROUP BY a.id ORDER BY a.updated_at DESC LIMIT 100", ['%' + q.replace(/[\\%_]/g, '\\$&') + '%'])]);
    return Response.json({ badges: badges.rows, members: members.rows }, { headers: privateHeaders });
}
catch {
    return Response.json({ error: 'UNAVAILABLE' }, { status: 503, headers: privateHeaders });
} }
export async function POST(request: Request) { if (!await hasAdminSession(request))
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: privateHeaders }); if (!sameOrigin(request))
    return Response.json({ error: 'INVALID' }, { status: 403, headers: privateHeaders }); try {
    if (!await limitAttempt('admin:badges', 60, 600))
        return Response.json({ error: 'RATE_LIMIT' }, { status: 429, headers: privateHeaders });
    const body = await readJSON(request, 2048) as Record<string, unknown>, db = await siteDatabase();
    if (body.action === 'create') {
        if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 64 || /[\x00-\x1f<>]/.test(body.name) || !isUUID(body.imageId))
            throw Error('INVALID');
        const id = randomUUID(), result = await db.query('INSERT INTO site_badges(id,name,image_id) SELECT $1,$2,id FROM site_content_images WHERE id=$3 RETURNING id', [id, body.name.trim(), body.imageId]);
        if (!result.rows.length)
            throw Error('INVALID');
    }
    else if (body.action === 'archive') {
        if (!isUUID(body.badgeId) || typeof body.archived !== 'boolean')
            throw Error('INVALID');
        await db.query('UPDATE site_badges SET archived=$2 WHERE id=$1', [body.badgeId, body.archived]);
    }
    else if (['grant', 'revoke'].includes(String(body.action))) {
        if (!isUUID(body.badgeId) || !isUUID(body.userId))
            throw Error('INVALID');
        if (body.action === 'grant')
            await db.query("INSERT INTO site_member_badges(user_id,badge_id) SELECT a.id,b.id FROM site_accounts a CROSS JOIN site_badges b WHERE a.id=$1 AND b.id=$2 AND NOT b.archived AND a.deleted_at IS NULL AND a.auth_purged_at IS NULL ON CONFLICT DO NOTHING", [body.userId, body.badgeId]);
        else
            await db.query('DELETE FROM site_member_badges WHERE user_id=$1 AND badge_id=$2', [body.userId, body.badgeId]);
    }
    else
        throw Error('INVALID');
    return Response.json({ ok: true }, { headers: privateHeaders });
}
catch (error) {
    const invalid = error instanceof Error && error.message === 'INVALID';
    return Response.json({ error: invalid ? 'INVALID' : 'UNAVAILABLE' }, { status: invalid ? 400 : 503, headers: privateHeaders });
} }
