"use client";
import { useLocale } from 'next-intl';
import SectionHeader from '@/components/ui/SectionHeader';
import { communityCopy } from '@/lib/data/community-copy';
import CommunityPolls from './CommunityPolls';
import CommunityGallery from './CommunityGallery';
export default function CommunitySections({topic}:{topic:'minecraft'|'fortnite'}){
 const c=communityCopy(useLocale());
 return <><section id="community-polls" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL PROJECTS" title={c.polls} text={c.pollIntro}/><div className="mt-14"><CommunityPolls topic={topic}/></div></div></section><section id="community-gallery" className="hub-section scroll-mt-24"><div className="hub-section-inner"><SectionHeader eyebrow="ZO7AL PROJECTS" title={c.gallery} text={c.galleryIntro}/><div className="mt-14"><CommunityGallery topic={topic}/></div></div></section></>;
}
