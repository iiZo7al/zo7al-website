"use client";
import { useState } from "react";
import { useTranslations,useLocale } from "next-intl";
import PlayerIdentity,{usePlayerName} from "@/components/store/PlayerIdentity";
import CharacterPreview from "@/components/store/CharacterPreview";
import Link from "next/link";
type Profile={rank:string|null;online:boolean|null;stats:Record<string,number>|null;lastSeen:string|null};
export default function PlayerProfile() {
  const {username,setUsername}=usePlayerName(),t=useTranslations("hub"),locale=useLocale();
  const [name,setName]=useState(""),[profile,setProfile]=useState<Profile|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
  return <div className="hub-grid"><form className="hub-card hub-form" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError(false);setName(username.trim());setProfile(null);try{const response=await fetch("/api/minecraft/profile?username="+encodeURIComponent(username.trim()),{cache:"no-store"});if(!response.ok)throw Error();setProfile(await response.json());}catch{setError(true);}finally{setBusy(false);}}}><PlayerIdentity id="profile-username" username={username} onChange={setUsername} required allowCharacterPreview={false}/><p className="hub-muted">{t("profileHelp")}</p><button className="hub-button" disabled={busy}>{t(busy?"loading":"viewProfile")}</button><div className="hub-actions"><Link href="/store?activity=orders" className="hub-button">{t("activity")}</Link></div>{error&&<p className="hub-error" role="alert">{t("unavailable")}</p>}</form>{name&&<div className="hub-card"><CharacterPreview key={name} id="profile-character" username={name}/>{profile&&<><p className="hub-muted">{profile.online===true?t("online"):profile.online===false?t("offline"):t("profileUnknown")}</p>{profile.stats&&<dl className="mt-5 grid grid-cols-2 gap-4">{Object.entries(profile.stats).map(([key,value])=><div key={key}><dt className="hub-muted">{t("stat_"+key)}</dt><dd>{new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(key==="playtimeSeconds"?value/3600:value)}</dd></div>)}</dl>}{profile.lastSeen&&<p>{t("lastSeen")}: {new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(profile.lastSeen))}</p>}</>}</div>}</div>;
}
