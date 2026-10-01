"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import CharacterPreview from "./CharacterPreview";
import { useLocale, useTranslations } from "next-intl";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";

export function usePlayerName() {
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem("zo7al-player-name") ?? ""; } catch {}
    queueMicrotask(() => { if (/^[.a-zA-Z0-9_ ]{3,32}$/.test(saved)) setUsername(saved); setReady(true); });
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        if (!username.trim()) localStorage.removeItem("zo7al-player-name");
        else if (/^[.a-zA-Z0-9_ ]{3,32}$/.test(username.trim())) localStorage.setItem("zo7al-player-name", username.trim());
      } catch { /* Storage is optional. */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, ready]);
  return { username, setUsername };
}
function PlayerHead({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const javaName = /^[a-zA-Z0-9_]{3,16}$/.test(name);
  return <Image unoptimized src={javaName && !failed ? `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64` : "/assets/site/server-logo.png"} alt="" width={52} height={52} onError={() => setFailed(true)} className="store-player-head"/>;
}
export default function PlayerIdentity({ username, onChange, id = "store-player-name", required = false, active = true }: { username: string; onChange: (value: string) => void; id?: string; required?: boolean; active?: boolean }) {
  const t = useTranslations("store");
  const copy = storeExperienceCopy(useLocale());
  const [expanded, setExpanded] = useState(false);
  const validName = /^[.a-zA-Z0-9_ ]{3,32}$/.test(username.trim());
  const [avatarName, setAvatarName] = useState(username.trim());
  useEffect(() => { const timer = setTimeout(() => setAvatarName(username.trim()), 650); return () => clearTimeout(timer); }, [username]);
  return <div className="store-player-card"><div className="store-player">
    <button type="button" className="store-player-avatar" disabled={!validName} aria-label={copy.viewCharacter} aria-expanded={expanded && active} aria-controls={`${id}-character`} onClick={() => setExpanded(value => !value)}><PlayerHead key={avatarName} name={avatarName}/></button>
    <div><label htmlFor={id}>{t("username")}</label>
      <input id={id} value={username} onChange={event => onChange(event.target.value)} required={required} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" minLength={3} maxLength={32} pattern="[.a-zA-Z0-9_ ]{3,32}" aria-describedby={`${id}-help`}/>
      <p id={`${id}-help`}>{copy.profileHint}</p>
    </div>
  </div>{expanded && active && validName && <CharacterPreview key={username.trim()} id={`${id}-character`} username={username.trim()}/>}</div>;
}
