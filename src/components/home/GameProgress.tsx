"use client";
import { useEffect,useState } from "react";
import { useLocale,useTranslations } from "next-intl";
import { dailyChallenge,MILESTONES,type Milestone } from "@/lib/data/space-progress";
const KEY="zo7al-space-achievements";
export function saveMilestones(unlocked:Milestone[]) {
  try{const previous:unknown=JSON.parse(localStorage.getItem(KEY)??"[]");const valid=Array.isArray(previous)?previous.filter((id):id is Milestone=>MILESTONES.includes(id)):[];localStorage.setItem(KEY,JSON.stringify([...new Set([...valid,...unlocked])]));window.dispatchEvent(new Event("zo7al-achievements"));}catch{}
}
export default function GameProgress({score,stars,compact=false}:{score:number;stars:number;compact?:boolean}) {
  const t=useTranslations("game"),locale=useLocale(),[challenge,setChallenge]=useState<ReturnType<typeof dailyChallenge>|null>(null),[unlocked,setUnlocked]=useState<string[]>([]);
  useEffect(()=>{const load=()=>{setChallenge(dailyChallenge());try{const raw=JSON.parse(localStorage.getItem(KEY)??"[]");setUnlocked(Array.isArray(raw)?raw.filter(id=>MILESTONES.includes(id)):[]);}catch{setUnlocked([]);}};queueMicrotask(load);window.addEventListener("zo7al-achievements",load);const timer=setInterval(load,60000);return()=>{window.removeEventListener("zo7al-achievements",load);clearInterval(timer);};},[]);
  if(!challenge)return null;
  const progress=Math.min(challenge.target,challenge.metric==="score"?score:stars);
  return <section className={compact?"mt-4 text-[10px]":"mb-5 rounded-xl border border-[var(--border)] p-4 text-start"} aria-label={t("dailyChallenge")}><p className="font-semibold">{t("dailyChallenge")}</p><p className="mt-2 text-[var(--text-muted)]">{t(challenge.metric==="score"?"challengeScore":"challengeStars",{count:challenge.target.toLocaleString(locale)})}</p><progress max={challenge.target} value={progress} className="mt-2 h-1.5 w-full accent-[var(--accent)]" aria-label={t("dailyChallenge")}/><p>{progress.toLocaleString(locale)} / {challenge.target.toLocaleString(locale)}</p>{!compact&&<><h4 className="mt-4 mb-2 font-semibold">{t("achievements")}</h4><ul className="grid grid-cols-2 gap-2">{MILESTONES.map(id=><li key={id} className={unlocked.includes(id)?"rounded-lg border border-[var(--accent)] p-2 text-xs text-[var(--accent)]":"rounded-lg border border-[var(--border)] p-2 text-xs text-[var(--text-muted)]"}>{unlocked.includes(id)?"✦ ":"◇ "}{t("achievement_"+id)}</li>)}</ul><p className="mt-3 text-[10px] text-[var(--text-muted)]">{t("achievementHelp")}</p></>}</section>;
}
