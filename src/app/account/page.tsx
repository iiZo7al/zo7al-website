import {Suspense} from 'react';
import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import PageHero from '@/components/ui/PageHero';
import AccountCenter from '@/components/account/AccountCenter';
export const metadata:Metadata={title:'Account',robots:{index:false,follow:false}};
export default async function AccountPage(){const t=await getTranslations('account');return <main data-accent="store"><PageHero eyebrow="Zo7al Projects" title={t('myAccount')} text={t('accountIntro')}/><div className="mx-auto max-w-[980px] px-6"><Suspense fallback={<p>{t("loading")}</p>}><AccountCenter/></Suspense></div></main>;}
