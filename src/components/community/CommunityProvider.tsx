"use client";
import { createContext,useCallback,useContext,useEffect,useState } from 'react';
import { useLocale } from 'next-intl';
import type { CommunityEntry } from '@/lib/data/community';
import './community.css';
type State={entries:CommunityEntry[];loading:boolean;available:boolean;votingAvailable:boolean;refresh:()=>Promise<void>};
const Context=createContext<State>({entries:[],loading:true,available:false,votingAvailable:false,refresh:async()=>{}});
export const useCommunity=()=>useContext(Context);
export default function CommunityProvider({children}:{children:React.ReactNode}){
 const locale=useLocale(),[data,setData]=useState({entries:[] as CommunityEntry[],loading:true,available:true,votingAvailable:false});
 const refresh=useCallback(async()=>{try{const r=await fetch('/api/community?locale='+locale,{cache:'no-store'}),v=await r.json();setData({entries:v.entries??[],loading:false,available:r.ok&&v.available,votingAvailable:!!v.votingAvailable});}catch{setData(s=>({...s,loading:false,available:false}));}},[locale]);
 useEffect(()=>{let active=true;const controller=new AbortController();void fetch('/api/community?locale='+locale,{cache:'no-store',signal:controller.signal}).then(async r=>({r,v:await r.json()})).then(({r,v})=>{if(active)setData({entries:v.entries??[],loading:false,available:r.ok&&v.available,votingAvailable:!!v.votingAvailable});}).catch(()=>{if(active)setData(s=>({...s,loading:false,available:false}));});return()=>{active=false;controller.abort();};},[locale]);
 return <Context.Provider value={{...data,refresh}}>{children}</Context.Provider>;
}
