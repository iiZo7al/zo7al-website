"use client";
import { useCallback,useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import PlayerIdentity, { usePlayerName } from "@/components/store/PlayerIdentity";
import CharacterPreview from "@/components/store/CharacterPreview";
import Link from "next/link";
import PlayerStatIcon from "./PlayerStatIcon";
import QueryObserver from "./QueryObserver";
import PlayerAchievements from "@/components/community/PlayerAchievements";
import { isUUID } from "@/lib/data/community";
import { isPlayerStatKey, NETWORK_PROFILE_ID, type PlayerStatKey } from "@/lib/data/player-statistics";
type Profile = {
  rank: string | null; online: boolean | null; stats: Record<string, number> | null; lastSeen: string | null;
  serverId?: string; serverName?: string; updatedAt?: string | null; servers?: { id: string; name: string }[];
  statCoverage?: Record<string, { available: number; total: number }>;
};
export default function PlayerProfile() {
  const { username, setUsername } = usePlayerName(), t = useTranslations("hub"), locale = useLocale();
  const [name, setName] = useState(""), [profile, setProfile] = useState<Profile | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const mounted = useRef(false), request = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const lookup = useCallback(async (nextName: string, server?: string) => {
    request.current?.abort(); const controller=new AbortController();request.current=controller;setBusy(true);setError(false);
    setName(nextName); setProfile(null);
    try {
      const response = await fetch("/api/minecraft/profile?username=" + encodeURIComponent(nextName) + "&server=" + encodeURIComponent(server ?? NETWORK_PROFILE_ID), { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw Error();
      const value = await response.json(); if (mounted.current&&!controller.signal.aborted) setProfile(value);
    } catch { if (mounted.current && !controller.signal.aborted) setError(true); }
    finally { if(request.current===controller){request.current=null;if(mounted.current)setBusy(false);} }
  },[]);
  const queryChanged=useCallback(()=>{
    const player=new URL(window.location.href).searchParams.get('player');
    if(!player||!/^[.a-zA-Z0-9_ ]{3,32}$/.test(player))return;
    const server=new URL(window.location.href).searchParams.get('server');
    setUsername(player);void lookup(player,server===NETWORK_PROFILE_ID||isUUID(server)?server:undefined);
  },[setUsername,lookup]);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <div className="hub-grid">
    <QueryObserver param="player" onChange={queryChanged}/>
    <QueryObserver param="server" onChange={queryChanged}/>
    <form className="hub-card hub-form" onSubmit={event => { event.preventDefault(); void lookup(username.trim()); }}>
      <PlayerIdentity id="profile-username" username={username} onChange={setUsername} required allowCharacterPreview={false} />
      <p className="hub-muted">{t("profileHelp")}</p>
      <button className="hub-button" disabled={busy}>{t(busy ? "loading" : "viewProfile")}</button>
      <div className="hub-actions"><Link href="/requests?tab=orders" className="hub-button">{t("activity")}</Link></div>
      {error && <p className="hub-error" role="alert">{t("unavailable")}</p>}
    </form>
    {name && <div className="hub-card">
      {profile?.servers && profile.servers.length > 1 && <div className="hub-form"><label htmlFor="profile-server">{t("profileServer")}<select id="profile-server" value={profile.serverId} disabled={busy} onChange={event => void lookup(name, event.target.value)}>{profile.servers.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}</select></label></div>}
      <CharacterPreview key={name + ":" + (profile?.serverId ?? "")} id="profile-character" username={name} profileServer={profile?.serverId} currentRank={profile?.rank ?? null} />
      {profile && <>
        {profile.serverName && <p className="hub-muted">{t("profileServer")}: <span dir="auto">{profile.serverName}</span></p>}
        {profile.serverId === NETWORK_PROFILE_ID && <p className="hub-muted">{t("profileNetworkHint")}</p>}
        <p className="hub-muted">{profile.online === true ? t("online") : profile.online === false ? t("offline") : t("profileUnknown")}</p>
        {profile.stats && <dl className="hub-player-stats">{Object.entries(profile.stats).filter(([key]) => isPlayerStatKey(key)).map(([key, value]) => {
          const coverage = profile.statCoverage?.[key];
          return <div key={key} className="hub-player-stat"><dt><span className="hub-player-stat-icon"><PlayerStatIcon stat={key as PlayerStatKey} /></span><span>{t("stat_" + key)}</span></dt><dd>{new Intl.NumberFormat(locale, { maximumFractionDigits: key === "playtimeSeconds" || key === "distanceMeters" ? 1 : 0 }).format(key === "playtimeSeconds" ? value / 3600 : value)}</dd>{coverage && coverage.available < coverage.total && <small>{t("statCoverage", coverage)}</small>}</div>;
        })}</dl>}
        <PlayerAchievements stats={profile.stats}/>
        {profile.lastSeen && <p>{t("lastSeen")}: {date(profile.lastSeen)}</p>}
        {profile.updatedAt && <p className="hub-muted">{t("profileUpdated")}: {date(profile.updatedAt)}</p>}
      </>}
    </div>}
  </div>;
}
