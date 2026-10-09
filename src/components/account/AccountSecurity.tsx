"use client";
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ShieldCheck,Copy,Download,LoaderCircle} from 'lucide-react';
import {useAccount,accountAction} from './AccountProvider';
import {accountNext} from '@/lib/data/account';
type Status={enabled:boolean;required:boolean;factors:{id:string;name:string}[];recovery:{enrolled:boolean;remaining:number;total:number}};
type Enrollment={id:string;qr:string;secret:string};
type Proof={method:string;factorId:string;code:string};
async function mfaAction(action:string,input:Record<string,unknown>={}) {
 const response=await fetch('/api/account/mfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...input})});
 const data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
async function getStatus():Promise<Status> {
 const response=await fetch('/api/account/mfa',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
function ProofForm({factors,recovery,busy,onVerify,label}:{factors:Status['factors'];recovery:boolean;busy:boolean;onVerify:(proof:Proof)=>void;label:string}) {
 const t=useTranslations('account'),[method,setMethod]=useState('totp');
 return <form className="hub-form account-login-form" onSubmit={event=>{event.preventDefault();const fields=new FormData(event.currentTarget);onVerify({method,factorId:String(fields.get('factorId')??factors[0]?.id??''),code:String(fields.get('code')??'')});}}>
  {recovery&&<div className="account-auth-tabs">{(['totp','recovery'] as const).map(value=><button type="button" key={value} disabled={busy} aria-pressed={method===value} onClick={()=>setMethod(value)}>{t('security.'+(value==='totp'?'app':'backupCode'))}</button>)}</div>}
  {method==='totp'&&factors.length>1&&<label>{t('security.app')}<select name="factorId" disabled={busy}>{factors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
  <label>{t('security.'+(method==='totp'?'appCode':'backupCode'))}<input key={method} name="code" type="text" autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} dir="ltr" inputMode={method==='totp'?'numeric':'text'} pattern={method==='totp'?'[0-9]{6}':undefined} minLength={method==='totp'?6:16} maxLength={method==='totp'?6:24} required disabled={busy}/></label>
  <button className="hub-button hub-button-primary" disabled={busy} aria-busy={busy}>{busy&&<LoaderCircle size={17} className="animate-spin"/>}{label}</button>
 </form>;
}
export function AccountMFAChallenge({next='/account',onComplete}:{next?:string;onComplete?:()=>void}) {
 const t=useTranslations('account'),{refresh}=useAccount(),[status,setStatus]=useState<Status|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const fail=(error:unknown)=>{const code=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+code)?t('errors.'+code):t('errors.UNAVAILABLE'));};
 useEffect(()=>{let active=true;getStatus().then(value=>{if(active)setStatus(value);}).catch(error=>{if(active){const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));}});return()=>{active=false;};},[t]);
 return <div className="account-security"><ShieldCheck size={32} aria-hidden="true"/><h2>{t('security.title')}</h2><p className="account-help">{t('security.challenge')}</p>
  {status&&<ProofForm factors={status.factors} recovery={status.recovery.enrolled} busy={busy} label={t('security.verify')} onVerify={async proof=>{setBusy(true);setError('');try{await mfaAction('verify',proof);await refresh();if(onComplete)onComplete();else window.location.assign(accountNext(next));}catch(error){fail(error);}finally{setBusy(false);}}}/>}
  {!status&&!error&&<LoaderCircle className="animate-spin" aria-label={t('loading')}/>}
  {error&&<p role="alert" className="account-error">{error}</p>}
  <button type="button" className="account-text-button" disabled={busy} onClick={async()=>{setBusy(true);try{await accountAction('signout');await refresh();onComplete?.();}catch(error){fail(error);}finally{setBusy(false);}}}>{t('security.otherAccount')}</button>
 </div>;
}
export default function AccountSecurity() {
 const t=useTranslations('account'),{refresh}=useAccount();
 const [status,setStatus]=useState<Status|null>(null),[enrollment,setEnrollment]=useState<Enrollment|null>(null),[codes,setCodes]=useState<string[]>([]),[saved,setSaved]=useState(false),[operation,setOperation]=useState<{action:'enroll'|'codes'|'remove';targetId?:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const reload=async()=>{setStatus(await getStatus());await refresh();};
 const fail=(error:unknown)=>{const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));};
 useEffect(()=>{let active=true;getStatus().then(value=>{if(active)setStatus(value);}).catch(error=>{if(active){const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));}});return()=>{active=false;};},[t]);
 const act=async(action:string,input:Record<string,unknown>={})=>{
  setBusy(true);setError('');setMessage('');
  try {
   const data=await mfaAction(action,input);setOperation(null);
   if(action==='enroll')setEnrollment(data);
   if(action==='cancel'||action==='confirm')setEnrollment(null);
   if(data.codes){setCodes(data.codes);setSaved(false);}
   if(data.recoveryError)fail(Error(data.recoveryError));
   await reload();if(action==='confirm')setMessage(t('security.enabled'));if(action==='remove')setMessage(t('security.removed'));
  }catch(error){fail(error);}finally{setBusy(false);}
 };
 const qr=enrollment?.qr.startsWith('<svg')?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(enrollment.qr):enrollment?.qr.startsWith('data:image/')?enrollment.qr:'';
 return <section className="account-card account-security"><div className="account-security-heading"><ShieldCheck size={26} aria-hidden="true"/><div><h2>{t('security.title')}</h2><p className="account-help">{t('security.intro')}</p></div>{status&&<span className="account-security-badge" data-enabled={status.enabled}>{t('security.'+(status.enabled?'enabled':'disabled'))}</span>}</div>
  {error&&<p role="alert" className="account-error">{error}</p>}{message&&<p role="status" className="account-notice">{message}</p>}
  {!status&&!error&&<LoaderCircle className="animate-spin" aria-label={t('loading')}/>}
  {enrollment?<div className="account-security-setup"><p className="account-help">{t('security.scan')}</p>{qr&&<Image unoptimized src={qr} width={200} height={200} alt={t('security.qrAlt')} className="account-security-qr"/>}<p className="account-help">{t('security.manualKey')}</p><code dir="ltr" className="account-security-secret">{enrollment.secret}</code><button type="button" className="hub-button" onClick={async()=>{try{await navigator.clipboard.writeText(enrollment.secret);setMessage(t('security.copied'));}catch(error){fail(error);}}}><Copy size={16}/>{t('security.copy')}</button><ProofForm factors={[{id:enrollment.id,name:'Zo7al'}]} recovery={false} busy={busy} label={t('security.activate')} onVerify={proof=>void act('confirm',proof)}/><button className="account-text-button" type="button" disabled={busy} onClick={()=>void act('cancel',{factorId:enrollment.id})}>{t('security.cancel')}</button></div>:codes.length>0?<div className="account-security-codes"><h3>{t('security.backups')}</h3><p className="account-help">{t('security.codesHint')}</p><div className="account-security-code-grid" dir="ltr">{codes.map(code=><code key={code}>{code}</code>)}</div><div className="account-security-actions"><button type="button" className="hub-button" onClick={async()=>{try{await navigator.clipboard.writeText(codes.join('\n'));setMessage(t('security.copied'));}catch(error){fail(error);}}}><Copy size={16}/>{t('security.copy')}</button><button type="button" className="hub-button" onClick={()=>{const text=t('security.codesHint')+'\n\n'+codes.join('\n'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='zo7al-recovery-codes.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}><Download size={16}/>{t('security.download')}</button></div><label className="account-security-confirm"><input type="checkbox" checked={saved} onChange={event=>setSaved(event.target.checked)}/>{t('security.savedCodes')}</label><button type="button" className="hub-button hub-button-primary" disabled={!saved} onClick={()=>{setCodes([]);setSaved(false);}}>{t('security.done')}</button></div>:operation&&status?<div className="account-security-operation"><p className="account-help">{t('security.'+(operation.action==='remove'?'removeHint':operation.action==='codes'?'regenerateHint':'changeHint'))}</p><ProofForm factors={status.factors} recovery={status.recovery.enrolled} busy={busy} label={t('security.verify')} onVerify={proof=>void act(operation.action,{...operation,...proof})}/><button className="account-text-button" type="button" disabled={busy} onClick={()=>setOperation(null)}>{t('security.cancel')}</button></div>:status&&<>
   {status.enabled?<><div className="account-security-factors">{status.factors.map(factor=><div className="account-connection" key={factor.id}><span>{t('security.app')}<small>{factor.name}</small></span><button className="hub-button" type="button" disabled={busy} onClick={()=>{setError('');setOperation({action:'remove',targetId:factor.id});}}>{t('security.remove')}</button></div>)}</div><p className="account-help">{status.recovery.enrolled?t('security.remaining',{count:status.recovery.remaining}):t('security.noCodes')}</p><div className="account-security-actions"><button className="hub-button" type="button" disabled={busy} onClick={()=>{setError('');setOperation({action:'codes'});}}>{t('security.'+(status.recovery.enrolled?'regenerate':'generateCodes'))}</button><button className="hub-button" type="button" disabled={busy} onClick={()=>{setError('');setOperation({action:'enroll'});}}>{t('security.changeApp')}</button></div></>:<button className="hub-button hub-button-primary" type="button" disabled={busy} onClick={()=>void act('enroll')}>{t('security.setup')}</button>}
  </>}
 </section>;
}
