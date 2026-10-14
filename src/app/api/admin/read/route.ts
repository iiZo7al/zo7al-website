import { hasAdminSession } from '@/lib/server/admin-account';
import { privateHeaders, sameOrigin, readJSON } from '@/lib/server/site-security';
import { siteDatabase } from '@/lib/server/site-db';
const pages = ['overview', 'profiles', 'badges', 'console', 'connections', 'minecraft', 'fortnite', 'youtube', 'modrinth', 'curseforge', 'news', 'event', 'rule', 'application', 'support', 'registrations', 'orders', 'community'];
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { if (!await hasAdminSession(request))
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: privateHeaders }); try {
    const rows = (await (await siteDatabase()).query('SELECT page,read_at FROM site_admin_page_reads')).rows;
    return Response.json({ reads: Object.fromEntries(rows.map(r => [r.page, new Date(r.read_at).toISOString()])) }, { headers: privateHeaders });
}
catch {
    return Response.json({ error: 'UNAVAILABLE' }, { status: 503, headers: privateHeaders });
} }
export async function POST(request: Request) { if (!await hasAdminSession(request))
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: privateHeaders }); if (!sameOrigin(request))
    return Response.json({ error: 'INVALID' }, { status: 403, headers: privateHeaders }); try {
    const body = await readJSON(request, 512) as {
        page?: string;
    };
    if (!body || !pages.includes(body.page ?? ''))
        return Response.json({ error: 'INVALID' }, { status: 400, headers: privateHeaders });
    const result = await (await siteDatabase()).query('INSERT INTO site_admin_page_reads(page,read_at) VALUES($1,now()) ON CONFLICT(page) DO UPDATE SET read_at=excluded.read_at RETURNING read_at', [body.page]);
    return Response.json({ readAt: new Date(result.rows[0].read_at).toISOString() }, { headers: privateHeaders });
}
catch {
    return Response.json({ error: 'UNAVAILABLE' }, { status: 503, headers: privateHeaders });
} }
