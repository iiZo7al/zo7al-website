"use client";
import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Package, Video, MessageCircle, CalendarDays } from "lucide-react";
import TrackingPanel from "./TrackingPanel";
import QueryObserver from "./QueryObserver";
const tabs = [
  { value: "orders", kind: "order", label: "orders", Icon: Package },
  { value: "applications", kind: "application", label: "applications", Icon: Video },
  { value: "support", kind: "support", label: "report", Icon: MessageCircle },
  { value: "events", kind: "event", label: "registrations", Icon: CalendarDays },
] as const;
export default function RequestActivity() {
  const t = useTranslations("hub"), locale = useLocale(), [selected, setSelected] = useState("orders");
  const queryChanged = useCallback((value: string | null) => setSelected(tabs.some(tab => tab.value === value) ? value! : "orders"), []);
  const activate = (value: string) => {
    setSelected(value); const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  };
  const current = tabs.find(tab => tab.value === selected) ?? tabs[0];
  return <>
    <QueryObserver param="tab" onChange={queryChanged} />
    <div>
        <div className="hub-actions mb-7" role="tablist" aria-label={t("activity")}>{tabs.map(({ value, label, Icon }) => <button key={value} id={`activity-tab-${value}`} type="button" role="tab" aria-selected={selected === value} aria-controls="activity-panel" tabIndex={selected === value ? 0 : -1} className="hub-button" onClick={() => activate(value)} onKeyDown={event => {
          const direction = ["ar", "fa", "he", "ur"].includes(locale) ? -1 : 1;
          const step = event.key === "ArrowRight" ? direction : event.key === "ArrowLeft" ? -direction : 0;
          if (!step && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (tabs.findIndex(tab => tab.value === value) + step + tabs.length) % tabs.length;
          activate(tabs[index].value); document.getElementById(`activity-tab-${tabs[index].value}`)?.focus();
        }}><Icon size={16} aria-hidden="true" />{t(label)}</button>)}</div>
        <div id="activity-panel" role="tabpanel" tabIndex={0} aria-labelledby={`activity-tab-${current.value}`}><TrackingPanel key={current.kind} kind={current.kind} /></div>
    </div>
  </>;
}
