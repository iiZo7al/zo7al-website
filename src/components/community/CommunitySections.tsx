"use client";
import { useLocale, useTranslations } from 'next-intl';
import SectionHeader from '@/components/ui/SectionHeader';
import { communityCopy } from '@/lib/data/community-copy';
import CommunityPolls from './CommunityPolls';
import CommunityGallery from './CommunityGallery';
export default function CommunitySections({topic}:{topic:'minecraft'|'fortnite'}){
 const c=communityCopy(useLocale()),t=useTranslations('hub'),fortnite=topic==='fortnite';
 return <><section id="community-polls" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow={fortnite?"FORTNITE CREATIVE":"ZO7AL NETWORK"} title={fortnite?t('fortnitePolls'):c.polls} text={fortnite?t('fortnitePollIntro'):c.pollIntro}/><div className="mt-14"><CommunityPolls topic={topic}/></div></div></section><section id="community-gallery" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow={fortnite?"FORTNITE CREATIVE":"ZO7AL NETWORK"} title={fortnite?t('fortniteCommunity'):c.gallery} text={fortnite?t('fortniteCommunityIntro'):c.galleryIntro}/><div className="mt-14"><CommunityGallery topic={topic}/></div></div></section></>;
}
