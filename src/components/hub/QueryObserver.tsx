"use client";
import { Suspense,useEffect } from "react";
import { useSearchParams } from "next/navigation";
function Observer({param,onChange}:{param:string;onChange:(value:string|null)=>void}) {
  const value=useSearchParams().get(param);
  useEffect(()=>{let cancelled=false;queueMicrotask(()=>{if(!cancelled)onChange(value);});return()=>{cancelled=true;};},[value,onChange]);
  return null;
}
/** Keep URL-dependent effects inside Suspense while prerendering the cards. */
export default function QueryObserver(props:{param:string;onChange:(value:string|null)=>void}) {
  return <Suspense fallback={null}><Observer {...props}/></Suspense>;
}
