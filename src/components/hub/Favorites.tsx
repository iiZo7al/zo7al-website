"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Heart,Share2 } from "lucide-react";
import { useState } from "react";
import { parseFavorites } from "@/lib/data/favorites";
const KEY="zo7al-favorites";
let memory="[]";
const read=()=>{try{return localStorage.getItem(KEY)??memory;}catch{return memory;}};
const subscribe=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener("zo7al-favorites",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("zo7al-favorites",callback);};};
export function useFavorites() {
  const raw=useSyncExternalStore(subscribe,read,()=>"[]"),ids=parseFavorites(raw);
  const toggle=(id:string)=>{const current=parseFavorites(read());memory=JSON.stringify(current.includes(id)?current.filter(x=>x!==id):[id,...current].slice(0,200));try{localStorage.setItem(KEY,memory);}catch{}window.dispatchEvent(new Event("zo7al-favorites"));};
  return {ids,toggle};
}
export function FavoriteButton({id}:{id:string}) {
  const t=useTranslations("hub"),{ids,toggle}=useFavorites(),saved=ids.includes(id);
  return <button type="button" className="hub-button hub-icon-button" aria-label={t(saved?"removeFavorite":"addFavorite")} title={t(saved?"removeFavorite":"addFavorite")} aria-pressed={saved} onClick={()=>toggle(id)}><Heart size={18} aria-hidden="true" fill={saved?"currentColor":"none"}/></button>;
}
export function ShareButton({path}:{path:string}) {
  const t=useTranslations("hub"),common=useTranslations("common"),[copied,setCopied]=useState(false);
  return <button type="button" className="hub-button hub-icon-button" aria-label={copied?common("copied"):t("share")} title={copied?common("copied"):t("share")} onClick={async()=>{try{await navigator.clipboard.writeText(new URL(path,window.location.origin).href);setCopied(true);window.setTimeout(()=>setCopied(false),2000);}catch{}}}><Share2 size={18} aria-hidden="true"/></button>;
}
