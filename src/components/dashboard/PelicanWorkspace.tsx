"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Terminal, Folder, Archive, CalendarClock, Database, Users, Network, Play, Settings, Activity, UserRound, ArrowUpRight, ChevronLeft } from "lucide-react";
import { pelicanTabs, type PelicanTab } from "@/lib/data/pelican-management";
import { type PelicanContext } from "./pelican-ui";
import PelicanFleet from "./PelicanFleet";
import PelicanConsole from "./PelicanConsole";
import PelicanFiles from "./PelicanFiles";
import PelicanResources from "./PelicanResources";
import PelicanSchedules from "./PelicanSchedules";
import PelicanUsers from "./PelicanUsers";
import PelicanSettings from "./PelicanSettings";
import PelicanActivity from "./PelicanActivity";
import PelicanAccount from "./PelicanAccount";
const icons={console:Terminal,files:Folder,backups:Archive,schedules:CalendarClock,databases:Database,users:Users,network:Network,startup:Play,settings:Settings,activity:Activity,account:UserRound};
export default function PelicanWorkspace({panelUrl,onConnections,onExpired}:{account?:string;panelUrl?:string;onConnections:()=>void;onExpired:()=>void}) {
  const p=useTranslations("pelican"),[tab,setTab]=useState<PelicanTab>("console"),[selected,setSelected]=useState<string|undefined>();
  const server=selected;
  const context:PelicanContext={server,onConnections,onExpired};
  const Icon=icons[tab];
  return <div className="pelican-workspace"><header className="pelican-workspace-header"><div><p className="dash-eyebrow">ZO7AL PROJECTS</p><h1>{p("title")}</h1><p className="dash-help">{p("workspaceHint")}</p></div>{panelUrl&&<a className="dash-button" href={panelUrl} target="_blank" rel="noopener noreferrer">Pelican<ArrowUpRight size={16}/></a>}</header>
    {!server?<PelicanFleet onSelect={id=>{setSelected(id);setTab("console");}} onConnections={onConnections} onExpired={onExpired}/>:<><button type="button" className="dash-button pelican-back-fleet" onClick={()=>setSelected(undefined)}><ChevronLeft size={17}/>{p("backToServers")}</button>
    <nav className="pelican-tabs" aria-label={p("title")}>{pelicanTabs.map(id=>{const TabIcon=icons[id];return <button className={"dash-button "+(tab===id?"dash-button-primary":"")} type="button" key={id} aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}><TabIcon size={16}/>{p(id)}</button>;})}</nav>
    <div className="pelican-view" key={(server??"configured")+":"+tab}><span className="sr-only"><Icon/> {p(tab)}</span>{tab==="console"?<PelicanConsole serverId={server} onConnections={onConnections} onExpired={onExpired}/>:tab==="files"?<PelicanFiles context={context}/>:tab==="backups"||tab==="databases"||tab==="network"?<PelicanResources resource={tab} context={context}/>:tab==="schedules"?<PelicanSchedules context={context}/>:tab==="users"?<PelicanUsers context={context}/>:tab==="startup"||tab==="settings"?<PelicanSettings resource={tab} context={context}/>:tab==="activity"?<PelicanActivity context={context}/>:<PelicanAccount context={context}/>}</div>
    <p className="dash-help pelican-panel-hint">{p("panelHint")}</p>
    </>}
  </div>;
}
