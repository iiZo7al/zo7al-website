"use client";

import { Suspense, useRef, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Package, Video, Headset, CalendarDays,Images } from "lucide-react";
import { REQUEST_TABS, requestTab, type RequestTab } from "@/lib/data/request-tabs";
import { isRtl } from "@/i18n/config";
import TrackingPanel from "./TrackingPanel";
import "./requests.css";

const ICONS = { order: Package, application: Video, support: Headset, event: CalendarDays,gallery:Images };

function ActivityTabs({ selected }: { selected: RequestTab }) {
  const t = useTranslations("hub");
  const locale = useLocale();
  const buttons = useRef<Partial<Record<RequestTab, HTMLButtonElement | null>>>({});
  const current = REQUEST_TABS.find(tab => tab.value === selected)!;
  const Icon = ICONS[current.kind];
  const activate = (value: RequestTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    // Native history integrates with Next navigation without a server round trip.
    window.history.replaceState(null, "", url);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: RequestTab) => {
    const direction = isRtl(locale) ? -1 : 1;
    const step = event.key === "ArrowRight" ? direction : event.key === "ArrowLeft" ? -direction : 0;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index = event.key === "Home" ? 0 : event.key === "End" ? REQUEST_TABS.length - 1 : (REQUEST_TABS.findIndex(tab => tab.value === value) + step + REQUEST_TABS.length) % REQUEST_TABS.length;
    const next = REQUEST_TABS[index].value;
    activate(next);
    buttons.current[next]?.focus();
  };

  return <div className="requests-workspace">
    <div className="requests-tabs" role="tablist" aria-label={t("activity")}>{REQUEST_TABS.map(tab => {
      const TabIcon = ICONS[tab.kind];
      return <button key={tab.value} ref={node => { buttons.current[tab.value] = node; }} type="button" role="tab" id={`request-tab-${tab.value}`} aria-selected={tab.value === selected} aria-controls="requests-panel" tabIndex={tab.value === selected ? 0 : -1} className="requests-tab" data-cursor="button" onClick={() => activate(tab.value)} onKeyDown={event => onKeyDown(event, tab.value)}>
        <span className="requests-tab-icon"><TabIcon size={19} aria-hidden="true"/></span><span>{t(tab.label)}</span>
      </button>;
    })}</div>
    <section id="requests-panel" role="tabpanel" aria-labelledby={`request-tab-${selected}`} tabIndex={0} className="requests-panel">
      <div className="requests-panel-heading"><span className="requests-heading-icon"><Icon size={23} aria-hidden="true"/></span><div><h2>{t(current.label)}</h2><p>{t(current.description)}</p></div></div>
      <TrackingPanel key={current.kind} kind={current.kind}/>
    </section>
  </div>;
}

function QueryActivity() {
  return <ActivityTabs selected={requestTab(useSearchParams().get("tab"))}/>;
}

export default function RequestActivity() {
  return <Suspense fallback={<ActivityTabs selected="orders"/>}><QueryActivity/></Suspense>;
}
