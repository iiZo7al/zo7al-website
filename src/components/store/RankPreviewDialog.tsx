"use client";
import { useId } from "react";
import { useLocale } from "next-intl";
import DetailsDialog from "@/components/ui/DetailsDialog";
import {useAccount} from '@/components/account/AccountProvider';
import AccountLogin from '@/components/account/AccountLogin';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import CharacterPreview from "./CharacterPreview";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";

export default function RankPreviewDialog({ rankName, onClose }: { rankName: string; username?: string; onNameChange?: (name: string) => void; onClose: () => void }) {
  const copy = storeExperienceCopy(useLocale());
  const id = useId();
  const {account}=useAccount(),t=useTranslations('account');
  if(!account)return <AccountLogin next='/store' onClose={onClose}/>;
  const name=account.minecraft?.username;
  return <DetailsDialog title={`${copy.rankPreview} · ${rankName}`} onClose={onClose} style={{ width: "min(600px, calc(100vw - 24px))" }}>
    <div className="store-rank-preview-dialog-body">
      {name?<CharacterPreview key={name} id={`${id}-character`} username={name} previewRank={rankName}/>:<><p className='account-help'>{t('linkIntro')}</p><Link href='/account?tab=connections' className='hub-button hub-button-primary' onClick={onClose}>{t('linkMinecraft')}</Link></>}
    </div>
  </DetailsDialog>;
}
