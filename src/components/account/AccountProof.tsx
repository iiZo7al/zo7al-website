"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {LoaderCircle} from 'lucide-react';
export type Status={emailAvailable?:boolean;enabled:boolean;required:boolean;factors:{id:string;name:string}[];recovery:{available?:boolean;enrolled:boolean;remaining:number;total:number}};
export type Enrollment={id:string;qr:string;secret:string};
type Proof={method:string;factorId:string;code:string};
export async function mfaAction(action:string,input:Record<string,unknown>={}) {
 const response=await fetch('/api/account/mfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...input})});
 const data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
export async function getStatus():Promise<Status> {
 const response=await fetch('/api/account/mfa',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
export function ProofForm({factors,recovery,busy,onVerify,label}:{factors:Status['factors'];recovery:boolean;busy:boolean;onVerify:(proof:Proof)=>void;label:string}) {
 const t=useTranslations('account'),[method,setMethod]=useState('totp');
 return <form className="hub-form account-login-form" onSubmit={event=>{event.preventDefault();const fields=new FormData(event.currentTarget);onVerify({method,factorId:String(fields.get('factorId')??factors[0]?.id??''),code:String(fields.get('code')??'')});}}>
  {recovery&&<div className="account-auth-tabs">{(['totp','recovery'] as const).map(value=><button type="button" key={value} disabled={busy} aria-pressed={method===value} onClick={()=>setMethod(value)}>{t('security.'+(value==='totp'?'app':'backupCode'))}</button>)}</div>}
  {method==='totp'&&factors.length>1&&<label>{t('security.app')}<select name="factorId" disabled={busy}>{factors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
  <label>{t('security.'+(method==='totp'?'appCode':'backupCode'))}<input key={method} name="code" type="text" autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} dir="ltr" inputMode={method==='totp'?'numeric':'text'} pattern={method==='totp'?'[0-9]{6}':undefined} minLength={method==='totp'?6:16} maxLength={method==='totp'?6:40} required disabled={busy}/></label>
  <button className="hub-button hub-button-primary" disabled={busy} aria-busy={busy}>{busy&&<LoaderCircle size={17} className="animate-spin"/>}{label}</button>
 </form>;
}
