"use client";
import { Children,type ReactNode,useState } from "react";
import { useTranslations } from "next-intl";
import { useFavorites } from "./Favorites";
export default function FavoriteCollection({ids,children,className}:{ids:string[];children:ReactNode;className:string}) {
  const t=useTranslations("hub"),{ids:saved}=useFavorites(),[only,setOnly]=useState(false);
  const content=Children.toArray(children).filter((_,index)=>!only||saved.includes(ids[index]));
  return <><div className="hub-actions mb-6"><button type="button" className="hub-button" aria-pressed={only} onClick={()=>setOnly(value=>!value)}>{t("favoritesOnly")}</button></div>{content.length?<div className={className}>{content}</div>:<p className="hub-muted">{t("favoritesEmpty")}</p>}</>;
}
