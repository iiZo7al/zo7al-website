"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Ellipsis, MonitorDown, PlusSquare, Rocket, Share } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { GAME_INSTALL_HINT_KEY } from "@/lib/data/game-install";

export default function GameLaunchButton({ onPlay }: { onPlay: () => void }) {
  const t = useTranslations("game");
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const launch = () => {
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let hidden = false;
    try { hidden = localStorage.getItem(GAME_INSTALL_HINT_KEY) === "1"; } catch {}
    if (installed || hidden) onPlay();
    else setOpen(true);
  };
  const dismiss = () => {
    if (remember) { try { localStorage.setItem(GAME_INSTALL_HINT_KEY, "1"); } catch {} }
    setOpen(false);
  };
  return <>
    <button type="button" data-cursor="button" data-cursor-label={t("enter")} aria-haspopup="dialog" onClick={launch} className="inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-transparent px-7 py-3.5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-white/5">
      <Rocket size={16} aria-hidden="true"/>{t("play")}<span aria-hidden="true">↗</span>
    </button>
    {open && <DetailsDialog title={t("installTitle")} onClose={dismiss} style={{width:"min(560px,calc(100vw - 24px))"}}>
      <div className="hub-command">
        <p className="text-sm leading-7 text-[var(--text-muted)]">{t("installIntro")}</p>
        <ol className="mt-6 grid gap-5 text-sm leading-7">
          <li className="flex items-start gap-3"><Share size={21} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true"/><span>{t("installShare")}</span></li>
          <li className="flex items-start gap-3"><PlusSquare size={21} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true"/><span>{t("installHome")}</span></li>
          <li className="flex items-start gap-3"><Ellipsis size={21} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true"/><span>{t("installAndroid")}</span></li>
          <li className="flex items-start gap-3"><MonitorDown size={21} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true"/><span>{t("installDesktop")}</span></li>
        </ol>
        <label className="hub-consent mt-6"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/>{t("installDontShow")}</label>
        <div className="hub-actions mt-6"><button type="button" className="hub-button" onClick={()=>{dismiss();onPlay();}} data-cursor="button"><Rocket size={17} aria-hidden="true"/>{t("installPlayNow")}</button></div>
      </div>
    </DetailsDialog>}
  </>;
}
