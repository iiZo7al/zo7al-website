"use client";
import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AtSign, LoaderCircle } from 'lucide-react';
import type { SiteAccount } from '@/lib/data/account';
type AccountState={account:SiteAccount|null;configured:boolean;email:boolean;providers:string[];ready:boolean;error:boolean;errorCode?:string;mfaRequired:boolean;mfaEnabled:boolean;passkeyEnabled:boolean;canDashboard:boolean;refresh:()=>Promise<void>};
const Context=createContext<AccountState|null>(null);

function MandatoryUsernameDialog({ onSaved }: { onSaved: () => Promise<void> }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('account');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mandatory-username-title"
    >
      <div
        className="w-full max-w-md rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-6 shadow-2xl"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <h2 id="mandatory-username-title" className="text-lg font-bold text-[var(--text)]">
          {isAr ? 'اختر اسم المستخدم (Username)' : 'Choose Your Username'}
        </h2>
        <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
          {isAr
            ? 'لإكمال إنشاء حسابك، يجب عليك اختيار اسم مستخدم خاص بك (أحرف إنجليزية أو أرقام أو _ فقط).'
            : 'To finish setting up your account, please choose your unique username (letters, numbers, or _).'}
        </p>

        <form
          className="hub-form mt-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await accountAction('setUsername', { username: username.trim() });
              await onSaved();
            } catch (err) {
              const code = err instanceof Error ? err.message : 'UNAVAILABLE';
              setError(t.has('errors.' + code) ? t('errors.' + code) : t('errors.UNAVAILABLE'));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t('username')}
            <div className="account-input">
              <AtSign size={17} aria-hidden="true" />
              <input
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9_]{3,32}"
                autoCapitalize="none"
                spellCheck={false}
                dir="ltr"
                disabled={busy}
                autoFocus
                placeholder="iiZo7al"
              />
            </div>
          </label>
          {error && (
            <p role="alert" className="account-error">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button
              type="submit"
              className="hub-button hub-button-primary flex-1"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {isAr ? 'حفظ اسم المستخدم' : 'Save Username'}
            </button>
            <button
              type="button"
              className="hub-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await accountAction('signout');
                  await onSaved();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('signout')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountProvider({children}:{children:ReactNode}) {
  const [state,setState]=useState({account:null as SiteAccount|null,configured:false,email:false,providers:[] as string[],ready:false,error:false,mfaRequired:false,mfaEnabled:false,passkeyEnabled:false,canDashboard:false,errorCode:undefined as string|undefined});
  const sequence=useRef(0);
  const refresh=useCallback(async()=>{
    const generation=++sequence.current;
    try {const response=await fetch('/api/account',{cache:'no-store'});const data=await response.json();if(!response.ok){if(generation===sequence.current)setState(s=>({...s,account:null,ready:true,error:true,errorCode:data.error??'UNAVAILABLE'}));return;}if(generation===sequence.current)setState({...data,ready:true,error:false,errorCode:undefined});}
    catch {if(generation===sequence.current)setState(s=>({...s,ready:true,error:true}));}
  },[]);
  useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},300000);window.addEventListener('focus',refresh);return()=>{clearTimeout(initial);clearInterval(timer);window.removeEventListener('focus',refresh);};},[refresh]);
  const needsUsername = state.ready && !!state.account && !state.account.username && !state.mfaRequired;
  return (
    <Context.Provider value={{...state,refresh}}>
      {children}
      {needsUsername && <MandatoryUsernameDialog onSaved={refresh} />}
    </Context.Provider>
  );
}
export function useAccount(){const value=useContext(Context);if(!value)throw Error('AccountProvider required');return value;}
export async function accountAction(action:string,input:Record<string,unknown>={}) {
  const response=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...input})});
  const data=await response.json();if(!response.ok)throw Error(data.error??'UNAVAILABLE');return data;
}
