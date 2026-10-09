"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {LoaderCircle,Mail,KeyRound,Orbit,ArrowRight} from 'lucide-react';
import DetailsDialog from '@/components/ui/DetailsDialog';
import {AccountMFAChallenge} from './AccountSecurity';
import AccountIdentityIcon from './AccountIdentityIcon';
import {accountProviderName} from '@/lib/data/account';
import {useAccount,accountAction} from './AccountProvider';
export default function AccountLogin({onClose,next='/account'}:{onClose:()=>void;next?:string}) {
  const t=useTranslations('account'),{configured,email,providers,refresh,mfaRequired,error:loadError}=useAccount();
  const [mode,setMode]=useState<'signin'|'signup'|'recover'>('signin'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const run=async(action:string,input:Record<string,unknown>)=>{setBusy(true);setError('');setMessage('');try{const data=await accountAction(action,{...input,next});if(data.url){window.location.assign(data.url);return;}if(data.message==='EMAIL_SENT'){setMessage(t('emailSent'));return;}await refresh();if(!data.mfaRequired)onClose();}catch(error){const code=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+code)?t('errors.'+code):t('errors.UNAVAILABLE'));}finally{setBusy(false);}};
  return <DetailsDialog title={t(mfaRequired?'security.title':mode)} onClose={onClose} className="account-login-dialog"><div className="account-dialog-body">
    <div className="account-login-intro"><span className="account-login-emblem" aria-hidden="true"><Orbit size={32}/></span><span className="account-login-brand" dir="ltr">ZO7AL</span><p className="account-help">{t('loginIntro')}</p></div>
    {mfaRequired?<AccountMFAChallenge next={next} onComplete={onClose}/>:!configured?<p role="status" className="account-notice">{t(loadError?'errors.UNAVAILABLE':'errors.CONFIGURATION')}</p>:<>
      {mode!=='recover'&&providers.length>0&&<div className="account-provider-buttons">{providers.map(provider=><button key={provider} type="button" className="hub-button account-provider-button" disabled={busy} data-provider={provider} data-cursor="button" onClick={()=>void run('oauth',{provider})}><span className="account-provider-icon"><AccountIdentityIcon provider={provider}/></span><span>{t('continueWith',{provider:accountProviderName(provider)})}</span><ArrowRight size={16} className="account-provider-arrow" aria-hidden="true"/></button>)}</div>}
      {email&&<>{mode!=='recover'&&providers.length>0&&<div className="account-login-divider"><span>{t('email')}</span></div>}<div className="account-auth-tabs">{(['signin','signup'] as const).map(tab=><button type="button" key={tab} aria-pressed={mode===tab} disabled={busy} onClick={()=>{setMode(tab);setMessage('');setError('');}}>{t(tab)}</button>)}</div>
      <form className="hub-form account-login-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void run(mode,{email:data.get('email'),...(mode==='recover'?{}:{password:data.get('password')})});}}>
        <label>{t('email')}<div className="account-input"><Mail size={17} aria-hidden="true"/><input name="email" type="email" autoComplete="email" dir="ltr" required maxLength={254} disabled={busy}/></div></label>
        {mode!=='recover'&&<label>{t('password')}<div className="account-input"><KeyRound size={17} aria-hidden="true"/><input name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} required minLength={mode==='signup'?12:1} maxLength={128} disabled={busy}/></div>{mode==='signup'&&<small>{t('passwordHint')}</small>}</label>}
        <button className="hub-button hub-button-primary" disabled={busy} aria-busy={busy}>{busy?<LoaderCircle size={18} className="animate-spin"/>:null}{t(mode)}</button>
        {mode==='signin'&&<button type="button" className="account-text-button" disabled={busy} onClick={()=>{setMode('recover');setError('');setMessage('');}}>{t('forgotPassword')}</button>}
      </form></>}
    </>}
    {message&&<p role="status" className="account-notice">{message}</p>}{error&&<p role="alert" className="account-error">{error}</p>}
  </div></DetailsDialog>;
}
