"use client";
import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import type { SiteAccount } from '@/lib/data/account';
type AccountState={account:SiteAccount|null;configured:boolean;email:boolean;providers:string[];ready:boolean;error:boolean;refresh:()=>Promise<void>};
const Context=createContext<AccountState|null>(null);
export default function AccountProvider({children}:{children:ReactNode}) {
  const [state,setState]=useState({account:null as SiteAccount|null,configured:false,email:false,providers:[] as string[],ready:false,error:false});
  const sequence=useRef(0);
  const refresh=useCallback(async()=>{
    const generation=++sequence.current;
    try {const response=await fetch('/api/account',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(generation===sequence.current)setState({...data,ready:true,error:false});}
    catch {if(generation===sequence.current)setState(s=>({...s,ready:true,error:true}));}
  },[]);
  useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},300000);window.addEventListener('focus',refresh);return()=>{clearTimeout(initial);clearInterval(timer);window.removeEventListener('focus',refresh);};},[refresh]);
  return <Context.Provider value={{...state,refresh}}>{children}</Context.Provider>;
}
export function useAccount(){const value=useContext(Context);if(!value)throw Error('AccountProvider required');return value;}
export async function accountAction(action:string,input:Record<string,unknown>={}) {
  const response=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...input})});
  const data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
