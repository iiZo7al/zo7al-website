"use client";
import { useEffect, useId, useState } from "react";
import { useLocale } from "next-intl";
import DetailsDialog from "@/components/ui/DetailsDialog";
import PlayerIdentity from "./PlayerIdentity";
import CharacterPreview from "./CharacterPreview";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";

export default function RankPreviewDialog({ rankName, username, onNameChange, onClose }: { rankName: string; username: string; onNameChange: (name: string) => void; onClose: () => void }) {
  const copy = storeExperienceCopy(useLocale());
  const id = useId();
  const name = username.trim();
  const [previewName, setPreviewName] = useState(name);
  const valid = /^[.a-zA-Z0-9_ ]{3,32}$/.test(name);
  useEffect(() => { const timer = setTimeout(() => setPreviewName(name), 650); return () => clearTimeout(timer); }, [name]);
  return <DetailsDialog title={`${copy.rankPreview} · ${rankName}`} onClose={onClose} style={{ width: "min(600px, calc(100vw - 24px))" }}>
    <div className="store-rank-preview-dialog-body">
      <PlayerIdentity id={`${id}-username`} username={username} onChange={onNameChange} allowCharacterPreview={false}/>
      {valid && previewName === name ? <CharacterPreview key={previewName} id={`${id}-character`} username={previewName} previewRank={rankName}/> : <p className="store-checkout-description" role="status">{valid ? copy.skinLoading : copy.previewName}</p>}
    </div>
  </DetailsDialog>;
}
