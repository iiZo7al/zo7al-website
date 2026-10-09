"use client";
import {useState,type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {LoaderCircle} from 'lucide-react';
import {useAccount} from './AccountProvider';
import AccountLogin from './AccountLogin';

export default function AccountSubmission({children,next}:{children:ReactNode;next:string}) {
 const t=useTranslations('account'),{account,ready}=useAccount(),[login,setLogin]=useState(false);
 if(!ready)return <LoaderCircle className="animate-spin" aria-label={t('loading')}/>;
 if(account)return children;
 return <div className="account-submission"><p className="account-help">{t('submissionLogin')}</p><button type="button" className="hub-button hub-button-primary" onClick={()=>setLogin(true)}>{t('signin')}</button>{login&&<AccountLogin next={next} onClose={()=>setLogin(false)}/>}</div>;
}
