"use client";
import { useLocale,useTranslations } from 'next-intl';
import { Award,Check } from 'lucide-react';
import { achievementProgress } from '@/lib/data/community';
import { communityCopy } from '@/lib/data/community-copy';
import { isPlayerStatKey } from '@/lib/data/player-statistics';
import { useCommunity } from './CommunityProvider';
export default function PlayerAchievements({stats}:{stats:Record<string,number>|null}){
 const locale=useLocale(),c=communityCopy(locale),t=useTranslations('hub'),{entries}=useCommunity(),custom=entries.filter(e=>e.kind==='achievement'&&e.topic!=='fortnite');
 const rules=custom.flatMap(e=>isPlayerStatKey(e.payload.stat)&&typeof e.payload.threshold==='number'?[{id:e.id,stat:e.payload.stat,threshold:e.payload.threshold}]:[]);
 const goals=achievementProgress(stats,rules);
 return goals.length?<section className="community-achievements"><h3><Award size={20} aria-hidden="true"/>{c.achievements}</h3><p className="hub-muted">{c.defaultGoals}</p><div className="community-achievement-grid">{goals.map(goal=><article key={goal.id} className={'community-achievement'+(goal.earned?' is-earned':'')}><span className="community-achievement-icon">{goal.earned?<Check size={20} aria-hidden="true"/>:<Award size={20} aria-hidden="true"/>}</span><div><h4>{custom.find(e=>e.id===goal.id)?.title??t('stat_'+goal.stat)}</h4><span>{(goal.earned?c.earned+' · ':'')+c.goal+': '+new Intl.NumberFormat(locale).format(goal.stat==='playtimeSeconds'?goal.threshold/3600:goal.threshold)}</span></div><progress value={goal.percent} max={100} aria-label={c.progress}/></article>)}</div></section>:null;
}
