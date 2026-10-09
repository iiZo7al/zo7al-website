"use client";
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {UserRound,Settings,Link2,KeyRound,LogOut,ClipboardList} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useAccount,accountAction} from './AccountProvider';
import GrassBlockIcon from '@/components/ui/GrassBlockIcon';
import AccountLogin from './AccountLogin';
import './account.css';
export default function AccountMenu() {
  const t=useTranslations('account'),{account,ready,refresh}=useAccount(),[open,setOpen]=useState(false),[login,setLogin]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),reduced=useReducedMotion();
  useEffect(()=>{if(!open)return;const listener=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',listener);return()=>document.removeEventListener('pointerdown',listener);},[open]);
  return <div ref={root} className="account-navigation" onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setOpen(false);}}>
    <button ref={trigger} type="button" className="account-avatar" aria-label={account?t('myAccount'):t('signin')} aria-expanded={account?open:login} aria-controls={account&&open?'account-navigation-menu':undefined} disabled={!ready} data-cursor="button" onClick={()=>{setError('');if(account)setOpen(!open);else setLogin(true);}}>
      {account?.avatar?<Image unoptimized src={account.avatar} alt="" width={38} height={38}/>:<UserRound size={20} aria-hidden="true"/>}
    </button>
    <AnimatePresence>{account&&open&&<motion.div id="account-navigation-menu" className="account-menu" initial={{opacity:0,y:reduced?0:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-5}} transition={{duration:reduced?0:.18}}>
      <div className="account-menu-heading"><strong>{account.name}</strong><small dir="ltr">{account.minecraft?.username??account.email}</small></div>
      {([{href:'/account',key:'myAccount',icon:UserRound},{href:'/account?tab=player',key:'player',icon:GrassBlockIcon},{href:'/account?tab=settings',key:'settings',icon:Settings},{href:'/account?tab=connections',key:'connections',icon:Link2},{href:'/account?tab=password',key:'password',icon:KeyRound},{href:'/requests',key:'requests',icon:ClipboardList}] as const).map(({href,key,icon:Icon})=><Link key={key} href={href} data-cursor="link" onClick={()=>setOpen(false)}><Icon size={17} aria-hidden="true"/>{t(key)}</Link>)}
      <button type="button" data-cursor="button" disabled={busy} onClick={async()=>{setBusy(true);try{await accountAction('signout');await refresh();setOpen(false);}catch{setError(t('errors.UNAVAILABLE'));}finally{setBusy(false);}}}><LogOut size={17} aria-hidden="true"/>{t('signout')}</button>{error&&<p role="alert">{error}</p>}
    </motion.div>}</AnimatePresence>
    {login&&<AccountLogin onClose={()=>setLogin(false)}/>}
  </div>;
}
