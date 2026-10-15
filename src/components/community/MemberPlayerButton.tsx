"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DetailsDialog from "@/components/ui/DetailsDialog";
import GrassBlockIcon from "@/components/ui/GrassBlockIcon";
import PlayerProfile from "@/components/hub/PlayerProfile";

export default function MemberPlayerButton({
  linkedUsername,
}: {
  linkedUsername?: string | null;
}) {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hub-button"
        aria-label={t("player")}
        title={t("player")}
        onClick={() => setOpen(true)}
      >
        <GrassBlockIcon size={20} />
      </button>
      {open && (
        <DetailsDialog
          title={t("player")}
          className="member-player-dialog"
          onClose={() => setOpen(false)}
        >
          <div className="account-dialog-body">
            <PlayerProfile linkedUsername={linkedUsername ?? undefined} />
          </div>
        </DetailsDialog>
      )}
    </>
  );
}
