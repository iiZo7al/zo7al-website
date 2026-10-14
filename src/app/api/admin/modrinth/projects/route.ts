import { hasAdminSession } from '@/lib/server/admin-account';
import { privateHeaders } from '@/lib/server/site-security';
import { modrinthAuth, modrinthJSON } from '@/lib/server/modrinth-auth';
import { MODRINTH_API_URL } from '@/lib/data/modrinth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function publicJSON(path: string) { const r = await fetch('https://api.modrinth.com' + path, { headers: { Accept: 'application/json', 'User-Agent': 'Zo7alProjects/1.0 (zo7al.is-a.dev)' }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000) }); if (!r.ok)
    throw Error(); const text = await r.text(); if (text.length > 2000000)
    throw Error(); return JSON.parse(text); }
export async function GET(request: Request) {
    if (!await hasAdminSession(request))
        return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: privateHeaders });
    try {
        const auth = await modrinthAuth(), url = new URL(request.url), id = url.searchParams.get('project');
        let projects: Record<string, unknown>[];
        if (auth)
            projects = await modrinthJSON('/v2/user/' + auth.userId + '/projects', auth.accessToken) as Record<string, unknown>[];
        else {
            const r = await fetch(MODRINTH_API_URL, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
            if (!r.ok)
                throw Error();
            projects = await r.json();
        }
        if (!Array.isArray(projects))
            throw Error();
        if (!id)
            return Response.json({ projects }, { headers: privateHeaders });
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !projects.some(p => p.id === id))
            return Response.json({ error: 'INVALID' }, { status: 400, headers: privateHeaders });
        const get = (path: string) => auth ? modrinthJSON(path, auth.accessToken) : publicJSON(path), [project, versions, team] = await Promise.all([get('/v2/project/' + id), get('/v2/project/' + id + '/version'), get('/v2/project/' + id + '/members').catch(() => [])]);
        return Response.json({ projects, project, versions: Array.isArray(versions) ? versions : [], team: Array.isArray(team) ? team : [] }, { headers: privateHeaders });
    }
    catch {
        return Response.json({ error: 'UNAVAILABLE' }, { status: 503, headers: privateHeaders });
    }
}
