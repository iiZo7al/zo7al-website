"use client";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { History, Package, Video, MessageCircle, CalendarDays } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import TrackingPanel from "./TrackingPanel";
import QueryObserver from "./QueryObserver";
const tabs = [
  { value: "orders", kind: "order", label: "orders", Icon: Package },
  { value: "applications", kind: "application", label: "applications", Icon: Video },
  { value: "support", kind: "support", label: "report", Icon: MessageCircle },
  { value: "events", kind: "event", label: "registrations", Icon: CalendarDays },
] as const;
export default function StoreActivity() {
  const t = useTranslations("hub"), [selected, setSelected] = useState<string | null>(null);
  const queryChanged = useCallback((value: string | null) => setSelected(tabs.some(tab => tab.value === value) ? value : null), []);
  const activate = (value: string | null) => {
    setSelected(value); const url = new URL(window.location.href);
    if (value) url.searchParams.set("activity", value); else url.searchParams.delete("activity");
    window.history.replaceState(null, "", url);
  };
  const current = tabs.find(tab => tab.value === selected);
  return <>
    <QueryObserver param="activity" onChange={queryChanged} />
    <button type="button" data-cursor="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-7 py-3.5 text-sm font-semibold" aria-haspopup="dialog" onClick={() => activate("orders")}><History size={17} aria-hidden="true" />{t("activity")}</button>
    {current && <DetailsDialog title={t("activity")} onClose={() => activate(null)} style={{ width: "min(960px, calc(100vw - 24px))" }}>
      <div className="hub-command"><p className="hub-muted">{t("activityIntro")}</p>
        <div className="hub-actions mb-7" role="tablist" aria-label={t("activity")}>{tabs.map(({ value, label, Icon }) => <button key={value} id={`activity-tab-${value}`} type="button" role="tab" aria-selected={selected === value} aria-controls="activity-panel" tabIndex={selected === value ? 0 : -1} className="hub-button" onClick={() => activate(value)} onKeyDown={event => {
          const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!step && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (tabs.findIndex(tab => tab.value === value) + step + tabs.length) % tabs.length;
          activate(tabs[index].value); document.getElementById(`activity-tab-${tabs[index].value}`)?.focus();
        }}><Icon size={16} aria-hidden="true" />{t(label)}</button>)}</div>
        <div id="activity-panel" role="tabpanel" aria-labelledby={`activity-tab-${current.value}`}><TrackingPanel key={current.kind} kind={current.kind} /></div>
      </div>
    </DetailsDialog>}
  </>;
}
