"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Newspaper, Vote } from "lucide-react";
import { communityCopy } from "@/lib/data/community-copy";
import CommunityManagement from "./CommunityManagement";
import DashboardManagement from "./DashboardManagement";
import type { DashboardData, Mutate } from "./types";

export default function DashboardNews({ data, busy, mutate, onExpired }: { data: DashboardData; busy: boolean; mutate: Mutate; onExpired: () => void }) {
  const t = useTranslations("hub"), c = communityCopy(useLocale());
  const [mode, setMode] = useState<"news" | "polls">("news");
  const [pollBusy, setPollBusy] = useState(false);
  return <section>
    <div className="hub-actions mb-6" role="group" aria-label={t("news") + " · " + c.polls}>
      <button type="button" className="hub-button" aria-pressed={mode === "news"} disabled={busy || pollBusy} onClick={() => setMode("news")} data-cursor="button"><Newspaper size={17} aria-hidden="true"/>{t("news")}</button>
      <button type="button" className="hub-button" aria-pressed={mode === "polls"} disabled={busy || pollBusy} onClick={() => setMode("polls")} data-cursor="button"><Vote size={17} aria-hidden="true"/>{c.polls}</button>
    </div>
    <div hidden={mode !== "news"}><DashboardManagement tab="news" data={data} busy={busy} mutate={mutate}/></div>
    <div hidden={mode !== "polls"}><CommunityManagement onlyKind="poll" onExpired={onExpired} onBusyChange={setPollBusy}/></div>
  </section>;
}
