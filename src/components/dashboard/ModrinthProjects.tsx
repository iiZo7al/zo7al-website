"use client";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { ExternalLink, RefreshCw, Package } from 'lucide-react';
type Project = {
    id: string;
    slug: string;
    title: string;
    description: string;
    body: string;
    icon_url: string | null;
    gallery?: {
        url: string;
        title?: string;
    }[];
    downloads: number;
    followers: number;
    project_type: string;
    status: string;
    client_side: string;
    server_side: string;
    game_versions?: string[];
    loaders?: string[];
    categories?: string[];
    additional_categories?: string[];
    license?: {
        id: string;
        name: string;
        url?: string;
    };
    issues_url?: string;
    source_url?: string;
    wiki_url?: string;
    discord_url?: string;
    donation_urls?: {
        platform: string;
        url: string;
    }[];
    published?: string;
    updated?: string;
};
type Version = {
    id: string;
    name: string;
    version_number: string;
    version_type: string;
    downloads: number;
    date_published: string;
    game_versions: string[];
    loaders: string[];
    changelog: string;
    files: {
        filename: string;
        size: number;
        primary: boolean;
        url: string;
        hashes?: Record<string, string>;
    }[];
    dependencies?: {
        project_id?: string;
        version_id?: string;
        dependency_type: string;
    }[];
};
type Team = {
    user: {
        id: string;
        username: string;
        avatar_url: string;
    };
    role: string;
};
const safeURL = (v: unknown) => { try {
    const u = new URL(String(v));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
}
catch {
    return null;
} };
export default function ModrinthProjects({ onExpired }: {
    onExpired: () => void;
}) {
    const terms=useTranslations('platformTerms');
    const term=(value:string)=>{const key=value.toLowerCase();return terms.has(key)?terms(key):value;};
    const t = useTranslations('modrinthDetails'), h = useTranslations('hub'), locale = useLocale(), [projects, setProjects] = useState<Project[]>([]), [selected, setSelected] = useState(''), [detail, setDetail] = useState<{
        project: Project;
        versions: Version[];
        team: Team[];
    } | null>(null), [version, setVersion] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(false);
    useEffect(() => { const controller = new AbortController(); const load = async () => { try {
        const r = await fetch('/api/admin/modrinth/projects' + (selected ? '?' + new URLSearchParams({ project: selected }) : ''), { cache: 'no-store', signal: controller.signal });
        if (r.status === 401) {
            onExpired();
            return;
        }
        if (!r.ok)
            throw Error();
        const data = await r.json();
        if (!controller.signal.aborted) {
            if (selected) {
                setDetail(data);
                setProjects(data.projects);
            }
            else {
                setProjects(data.projects);
                if (data.projects[0])
                    setSelected(data.projects[0].id);
            }
            setError(false);
        }
    }
    catch {
        if (!controller.signal.aborted)
            setError(true);
    }
    finally {
        if (!controller.signal.aborted)
            setLoading(false);
    } }; void load(); return () => controller.abort(); }, [selected, version, onExpired]);
    const p = detail?.project, number = (n: number) => new Intl.NumberFormat(locale).format(n), date = (s?: string) => s && Number.isFinite(Date.parse(s)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(s)) : '—';
    return <section className='dash-panel card-glow modrinth-workspace'><div className='dash-section-heading'><h2>{t('title')}</h2><button className='dash-button' disabled={loading} onClick={() => { setLoading(true); setVersion(v => v + 1); }}><RefreshCw size={16}/>{h('refresh')}</button></div><div className='modrinth-project-tabs'>{projects.map(project => <button className='dash-button' key={project.id} aria-pressed={selected === project.id} onClick={() => { if (project.id === selected)
        return; setSelected(project.id); setDetail(null); setLoading(true); }}>{project.icon_url && safeURL(project.icon_url) && <Image src={project.icon_url} width={24} height={24} alt='' unoptimized/>}{project.title}</button>)}</div>{error && <p role='alert' className='hub-error'>{h('unavailable')}</p>}{loading && <p role='status'>{h('loading')}</p>}{p && <><div className='modrinth-project-heading'>{p.icon_url && safeURL(p.icon_url) && <Image src={p.icon_url} width={80} height={80} alt='' unoptimized/>}<div><h2>{p.title}</h2><MarkdownContent className='dash-help'>{p.description}</MarkdownContent><a className='dash-button mt-3' href={'https://modrinth.com/' + p.project_type + '/' + p.slug} target='_blank' rel='noopener noreferrer'><ExternalLink size={16}/>Modrinth</a></div></div><dl className='modrinth-metadata'>{[['downloads', number(p.downloads)], ['followers', number(p.followers)], ['type', term(p.project_type)], ['status', term(p.status)], ['client', term(p.client_side)], ['server', term(p.server_side)], ['published', date(p.published)], ['updated', date(p.updated)], ['license', p.license?.name ?? p.license?.id ?? '—']].map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd dir='auto'>{value}</dd></div>)}</dl><div className='dash-actions'>{[...(p.categories ?? []), ...(p.additional_categories ?? []), ...(p.loaders ?? []), ...(p.game_versions ?? [])].map((tag, i) => <span key={tag + i} className='dash-tag'>{tag}</span>)}</div><div className='dash-actions mt-4'>{[['issues', p.issues_url], ['source', p.source_url], ['wiki', p.wiki_url], ['discord', p.discord_url], ...(p.donation_urls ?? []).map(d => [d.platform, d.url])].map(([label, url]) => safeURL(url) ? <a key={label} className='dash-button' href={safeURL(url)!} target='_blank' rel='noopener noreferrer'><ExternalLink size={15}/>{t.has(label!) ? t(label!) : label}</a> : null)}</div>{p.gallery?.length ? <div className='modrinth-gallery'>{p.gallery.filter(g => safeURL(g.url)).map(g => <Image key={g.url} src={g.url} width={640} height={360} alt={g.title ?? p.title} unoptimized/>)}</div> : null}<details className='modrinth-body' open><summary>{t('description')}</summary><MarkdownContent className='modrinth-text'>{p.body}</MarkdownContent></details><h3>{t('team')}</h3><div className='modrinth-team'>{detail.team.map(m => <a key={m.user.id} href={'https://modrinth.com/user/' + m.user.username} target='_blank' rel='noopener noreferrer' className='dash-button'>{safeURL(m.user.avatar_url) && <Image src={m.user.avatar_url} width={28} height={28} alt='' unoptimized/>}{m.user.username}<small>{term(m.role)}</small></a>)}</div><h3>{t('versions')}</h3><div className='modrinth-versions'>{detail.versions.map(v => <details key={v.id}><summary><Package size={17}/>{v.name} <span className='dash-tag'>{term(v.version_type)}</span><small>{date(v.date_published)}</small></summary><p className='dash-help'>{v.version_number} · {number(v.downloads)} {t('downloads')} · {v.loaders.join(', ')} · {v.game_versions.join(', ')}</p><MarkdownContent className='modrinth-text'>{v.changelog}</MarkdownContent><h4>{t('files')}</h4>{v.files.map(f => <div key={f.filename} className='modrinth-file'>{safeURL(f.url) && <a href={safeURL(f.url)!} target='_blank' rel='noopener noreferrer'>{f.filename}</a>}<small>{number(Math.ceil(f.size / 1024))} KB</small>{Object.entries(f.hashes ?? {}).map(([key, value]) => <code key={key}>{key}: {value}</code>)}</div>)}{v.dependencies?.length ? <div><h4>{t('dependencies')}</h4>{v.dependencies.map((d, i) => <p key={i}>{term(d.dependency_type)} · {d.project_id ?? d.version_id ?? '—'}</p>)}</div> : null}</details>)}</div></>}{!loading && !p && !projects.length && !error && <p className='dash-help'>{h('empty')}</p>}</section>;
}
