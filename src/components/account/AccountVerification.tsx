"use client";
import {useEffect,useState} from 'react';
import {useTranslations} from 'next-intl';
import {Mail,LoaderCircle} from 'lucide-react';
import {ProofForm,getStatus,type Status} from './AccountProof';
export async function verificationAction(action:string,input:Record<string,unknown>){
 const response=await fetch('/api/account/verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...input})}),data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
export function EmailVerification({purpose='login',target='',onVerified}:{purpose?:string;target?:string;onVerified:(proof:string)=>Promise<void>|void}){
 const t=useTranslations('account'),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const fail=(error:unknown)=>{const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));};
 return <div className="account-security-email"><p className="account-help">{t('security.emailAlternative')}</p>{sent?<form className="hub-form account-login-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const data=await verificationAction('verify-email',{purpose,target,code:new FormData(e.currentTarget).get('code')});await onVerified(data.proof??'');}catch(error){fail(error);}finally{setBusy(false);}}}><label>{t('verificationCode')}<input name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" minLength={6} maxLength={10} dir="ltr" required disabled={busy}/></label><button className="hub-button" disabled={busy}>{busy&&<LoaderCircle size={16} className="animate-spin"/>}{t('security.verify')}</button><p role="status" className="account-help">{t('emailSent')}</p></form>:<button type="button" className="hub-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await verificationAction('send-email',{purpose,target});setSent(true);}catch(error){fail(error);}finally{setBusy(false);}}}><Mail size={17}/>{t('sendCode')}</button>}{error&&<p role="alert" className="account-error mt-3">{error}</p>}</div>;
}
export default function AccountVerification({purpose,target='',onVerified}:{purpose:string;target?:string;onVerified:(proof:string)=>Promise<void>|void}){
 const t=useTranslations('account'),[status,setStatus]=useState<Status|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const fail=(error:unknown)=>{const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));};
 useEffect(()=>{let active=true;getStatus().then(value=>{if(active)setStatus(value);}).catch(error=>{if(active){const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));}});return()=>{active=false;};},[t]);
 return <div className="account-security"><p className="account-help">{t('security.confirmAction')}</p>{status?.factors.length? <ProofForm factors={status.factors} recovery={status.recovery.enrolled} busy={busy} label={t('security.verify')} onVerify={async proof=>{setBusy(true);setError('');try{const data=await verificationAction('verify-factor',{...proof,purpose,target});await onVerified(data.proof);}catch(error){fail(error);}finally{setBusy(false);}}}/>:null}{status?.emailAvailable&&<EmailVerification purpose={purpose} target={target} onVerified={onVerified}/>} {!status&&!error&&<LoaderCircle className="animate-spin"/>}{status&&!status.factors.length&&!status.emailAvailable&&<p role="alert" className="account-error">{t('errors.EMAIL_UNAVAILABLE')}</p>}{error&&<p role="alert" className="account-error">{error}</p>}</div>;
}
