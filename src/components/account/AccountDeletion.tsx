"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Trash2} from 'lucide-react';
import DetailsDialog from '@/components/ui/DetailsDialog';
import {useAccount} from './AccountProvider';
export default function AccountDeletion() {
 const t=useTranslations('account'),{refresh}=useAccount(),router=useRouter();
 const [open,setOpen]=useState(false),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="account-card"><h2>{t('deletion.title')}</h2><p className="account-help">{t('deletion.hint')}</p><button type="button" className="hub-button mt-5" onClick={()=>{setOpen(true);setConfirmed(false);setError('');}}><Trash2 size={16}/>{t('deletion.request')}</button>{open&&<DetailsDialog title={t('deletion.confirmTitle')} onClose={()=>{if(!busy)setOpen(false);}}><form className="hub-form p-6" onSubmit={async event=>{event.preventDefault();if(!confirmed||busy)return;setBusy(true);setError('');try{const response=await fetch('/api/account/deletion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});const data=await response.json();if(!response.ok)throw Error(data.error);await refresh();router.replace('/account?deletion=scheduled');}catch(error){const key=error instanceof Error?error.message:'UNAVAILABLE';setError(t.has('errors.'+key)?t('errors.'+key):t('errors.UNAVAILABLE'));}finally{setBusy(false);}}}><p>{t('deletion.hint')}</p><label className="account-security-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/>{t('deletion.acknowledge')}</label>{error&&<p role="alert" className="account-error">{error}</p>}<button className="hub-button" disabled={!confirmed||busy}><Trash2 size={16}/>{t('deletion.request')}</button><button type="button" className="account-text-button" disabled={busy} onClick={()=>setOpen(false)}>{t('security.cancel')}</button></form></DetailsDialog>}</section>;
}
