"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Award, Plus, Search, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { contentImageUrl, type ContentImage } from '@/lib/data/content-media';
type Badge = {
    id: string;
    name: string;
    archived: boolean;
    image: ContentImage;
};
type Member = {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    badges: string[];
};
export default function BadgeManagement({ onExpired }: {
    onExpired: () => void;
}) {
    const t = useTranslations('badges'), h = useTranslations('hub'), [badges, setBadges] = useState<Badge[]>([]), [members, setMembers] = useState<Member[]>([]), [query, setQuery] = useState(''), [version, setVersion] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
    useEffect(() => { const controller = new AbortController(), timer = setTimeout(() => { void fetch('/api/admin/badges?' + new URLSearchParams({ q: query }), { cache: 'no-store', signal: controller.signal }).then(async (r) => { if (r.status === 401) {
        onExpired();
        return;
    } if (!r.ok)
        throw Error(); const d = await r.json(); if (!controller.signal.aborted) {
        setBadges(d.badges);
        setMembers(d.members);
    } }).catch(() => { if (!controller.signal.aborted)
        setError(h('unavailable')); }); }, 150); return () => { clearTimeout(timer); controller.abort(); }; }, [query, version, onExpired, h]);
    async function run(input: Record<string, unknown>) { const r = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); if (r.status === 401) {
        onExpired();
        throw Error();
    } if (!r.ok)
        throw Error(); setVersion(v => v + 1); }
    const act = async (input: Record<string, unknown>) => { setBusy(true); setError(''); try {
        await run(input);
    }
    catch {
        setError(h('unavailable'));
    }
    finally {
        setBusy(false);
    } };
    return <section className='dash-panel card-glow'><div className='dash-section-heading'><div><h1>{t('title')}</h1><p className='dash-help'>{t('intro')}</p></div><Award /></div>{error && <p role='alert' className='hub-error'>{error}</p>}<form className='hub-form badge-create-form' onSubmit={async (e) => { e.preventDefault(); const form = e.currentTarget, data = new FormData(form), file = data.get('image'); if (!(file instanceof File) || !file.size)
        return; setBusy(true); setError(''); try {
        const upload = new FormData();
        upload.set('image', file);
        const r = await fetch('/api/admin/hub/media', { method: 'POST', body: upload });
        if (r.status === 401) {
            onExpired();
            throw Error();
        }
        if (!r.ok)
            throw Error();
        const { image } = await r.json();
        await run({ action: 'create', name: data.get('name'), imageId: image.id });
        form.reset();
    }
    catch {
        setError(h('unavailable'));
    }
    finally {
        setBusy(false);
    } }}><label>{t('name')}<input name='name' required maxLength={64} disabled={busy}/></label><label>{t('image')}<input name='image' type='file' accept='image/png,image/jpeg,image/webp,image/gif,image/avif' required disabled={busy}/></label><button type='submit' className='dash-button dash-button-primary' disabled={busy}><Plus size={17}/>{t('create')}</button></form><div className='badge-catalog'>{badges.map(b => <article key={b.id} className='badge-catalog-item'><Image src={contentImageUrl(b.image)} alt='' width={48} height={48} unoptimized/><strong>{b.name}</strong><button className='dash-button' disabled={busy} onClick={() => void act({ action: 'archive', badgeId: b.id, archived: !b.archived })}>{t(b.archived ? 'restore' : 'archive')}</button></article>)}</div><div className='dash-section-heading mt-8'><h2>{t('assign')}</h2><label className='flex items-center gap-2'><Search size={18}/><input className='dash-search' aria-label={h('search')} value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className='badge-members'>{members.map(m => <article key={m.id} className='badge-member'><div>{m.avatar && <Image src={m.avatar} alt='' width={36} height={36} unoptimized/>}<strong>{m.name}</strong><small dir='ltr'>{m.username ? '@' + m.username : m.id}</small></div><div className='badge-choices'>{badges.filter(b => !b.archived).map(b => <button key={b.id} className='dash-button' aria-pressed={m.badges.includes(b.id)} disabled={busy} onClick={() => void act({ action: m.badges.includes(b.id) ? 'revoke' : 'grant', userId: m.id, badgeId: b.id })}><Image src={contentImageUrl(b.image)} alt='' width={22} height={22} unoptimized/>{b.name}{m.badges.includes(b.id) && <Check size={15}/>}</button>)}</div></article>)}</div></section>;
}
