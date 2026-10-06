"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import PlayerIdentity, { usePlayerName } from "@/components/store/PlayerIdentity";
import CharacterPreview from "@/components/store/CharacterPreview";
import Link from "next/link";
import PlayerStatIcon from "./PlayerStatIcon";
import { isPlayerStatKey, NETWORK_PROFILE_ID, type PlayerStatKey } from "@/lib/data/player-statistics";
type Profile = {
  rank: string | null; online: boolean | null; stats: Record<string, number> | null; lastSeen: string | null;
  serverId?: string; serverName?: string; updatedAt?: string | null; servers?: { id: string; name: string }[];
  statCoverage?: Record<string, { available: number; total: number }>;
};
export default function PlayerProfile() {
  const { username, setUsername } = usePlayerName(), t = useTranslations("hub"), locale = useLocale();
  const [name, setName] = useState(""), [profile, setProfile] = useState<Profile | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const mounted = useRef(false), request = useRef<AbortController | null>(null), lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const lookup = async (nextName: string, server?: string) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(false); request.current = new AbortController();
    if (!server) { setName(nextName); setProfile(null); }
    try {
      const response = await fetch("/api/minecraft/profile?username=" + encodeURIComponent(nextName) + "&server=" + encodeURIComponent(server ?? NETWORK_PROFILE_ID), { cache: "no-store", signal: request.current.signal });
      if (!response.ok) throw Error();
      const value = await response.json(); if (mounted.current) setProfile(value);
    } catch { if (mounted.current && !request.current.signal.aborted) setError(true); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <div className="hub-grid">
    <form className="hub-card hub-form" onSubmit={event => { event.preventDefault(); void lookup(username.trim()); }}>
      <PlayerIdentity id="profile-username" username={username} onChange={setUsername} required allowCharacterPreview={false} />
      <p className="hub-muted">{t("profileHelp")}</p>
      <button className="hub-button" disabled={busy}>{t(busy ? "loading" : "viewProfile")}</button>
      <div className="hub-actions"><Link href="/store?activity=orders" className="hub-button">{t("activity")}</Link></div>
      {error && <p className="hub-error" role="alert">{t("unavailable")}</p>}
    </form>
    {name && <div className="hub-card">
      {profile?.servers && profile.servers.length > 1 && <div className="hub-form"><label htmlFor="profile-server">{t("profileServer")}<select id="profile-server" value={profile.serverId} disabled={busy} onChange={event => void lookup(name, event.target.value)}>{profile.servers.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}</select></label></div>}
      <CharacterPreview key={name + ":" + (profile?.serverId ?? "")} id="profile-character" username={name} profileServer={profile?.serverId} />
      {profile && <>
        {profile.serverName && <p className="hub-muted">{t("profileServer")}: <span dir="auto">{profile.serverName}</span></p>}
        {profile.serverId === NETWORK_PROFILE_ID && <p className="hub-muted">{t("profileNetworkHint")}</p>}
        <p className="hub-muted">{profile.online === true ? t("online") : profile.online === false ? t("offline") : t("profileUnknown")}</p>
        {profile.stats && <dl className="hub-player-stats">{Object.entries(profile.stats).filter(([key]) => isPlayerStatKey(key)).map(([key, value]) => {
          const coverage = profile.statCoverage?.[key];
          return <div key={key} className="hub-player-stat"><dt><span className="hub-player-stat-icon"><PlayerStatIcon stat={key as PlayerStatKey} /></span><span>{t("stat_" + key)}</span></dt><dd>{new Intl.NumberFormat(locale, { maximumFractionDigits: key === "playtimeSeconds" || key === "distanceMeters" ? 1 : 0 }).format(key === "playtimeSeconds" ? value / 3600 : value)}</dd>{coverage && coverage.available < coverage.total && <small>{t("statCoverage", coverage)}</small>}</div>;
        })}</dl>}
        {profile.lastSeen && <p>{t("lastSeen")}: {date(profile.lastSeen)}</p>}
        {profile.updatedAt && <p className="hub-muted">{t("profileUpdated")}: {date(profile.updatedAt)}</p>}
      </>}
    </div>}
  </div>;
}
