"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Terminal, Folder, Archive, CalendarClock, Database, Users, Network, Play, Settings, Activity, UserRound, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, object, pelicanTabs, string, type PelicanTab } from "@/lib/data/pelican-management";
import { usePelicanResource, type PelicanContext } from "./pelican-ui";
import PelicanConsole from "./PelicanConsole";
import PelicanFiles from "./PelicanFiles";
import PelicanResources from "./PelicanResources";
import PelicanSchedules from "./PelicanSchedules";
import PelicanUsers from "./PelicanUsers";
import PelicanSettings from "./PelicanSettings";
import PelicanActivity from "./PelicanActivity";
import PelicanAccount from "./PelicanAccount";
const icons={console:Terminal,files:Folder,backups:Archive,schedules:CalendarClock,databases:Database,users:Users,network:Network,startup:Play,settings:Settings,activity:Activity,account:UserRound};
export default function PelicanWorkspace({account,panelUrl,onConnections,onExpired}:{account?:string;panelUrl?:string;onConnections:()=>void;onExpired:()=>void}) {
  const p=useTranslations("pelican"),[tab,setTab]=useState<PelicanTab>("console"),[selected,setSelected]=useState<string|undefined>(account),[page,setPage]=useState(1);
  const servers=usePelicanResource("servers",{onConnections,onExpired},{page:String(page)}),rows=collection(servers.data);
  const server=string(rows.find(row=>row.uuid===selected||row.identifier===selected)?.uuid)||selected;
  const context:PelicanContext={server,onConnections,onExpired},pagination=object(object(object(servers.data).meta).pagination),lastPage=typeof pagination.total_pages==="number"?pagination.total_pages:1;
  const Icon=icons[tab];
  return <div className="pelican-workspace"><header className="pelican-workspace-header"><div><p className="dash-eyebrow">ZO7AL PROJECTS</p><h1>{p("title")}</h1><p className="dash-help">{p("workspaceHint")}</p></div>{panelUrl&&<a className="dash-button" href={panelUrl} target="_blank" rel="noopener noreferrer">Pelican<ArrowUpRight size={16}/></a>}</header>
    {rows.length>0&&<div className="pelican-server-selector"><label>{p("server")}<select value={server??""} disabled={servers.loading} onChange={event=>{setSelected(event.target.value);setTab("console");}}>{!rows.some(row=>row.uuid===server)&&server&&<option value={server}>{p("configuredServer")} · {server}</option>}{rows.map(row=><option key={string(row.uuid)} value={string(row.uuid)}>{string(row.name)} · {string(row.identifier)}</option>)}</select></label>{lastPage>1&&<div className="dash-icon-actions"><button className="dash-icon-button" aria-label={p("previous")} disabled={page<=1||servers.loading} onClick={()=>setPage(current=>current-1)}><ChevronLeft size={17}/></button><span className="dash-help">{page}/{lastPage}</span><button className="dash-icon-button" aria-label={p("next")} disabled={page>=lastPage||servers.loading} onClick={()=>setPage(current=>current+1)}><ChevronRight size={17}/></button></div>}</div>}
    <nav className="pelican-tabs" aria-label={p("title")}>{pelicanTabs.map(id=>{const TabIcon=icons[id];return <button className={"dash-button "+(tab===id?"dash-button-primary":"")} type="button" key={id} aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}><TabIcon size={16}/>{p(id)}</button>;})}</nav>
    <div className="pelican-view" key={(server??"configured")+":"+tab}><span className="sr-only"><Icon/> {p(tab)}</span>{tab==="console"?<PelicanConsole serverId={server} onConnections={onConnections} onExpired={onExpired}/>:tab==="files"?<PelicanFiles context={context}/>:tab==="backups"||tab==="databases"||tab==="network"?<PelicanResources resource={tab} context={context}/>:tab==="schedules"?<PelicanSchedules context={context}/>:tab==="users"?<PelicanUsers context={context}/>:tab==="startup"||tab==="settings"?<PelicanSettings resource={tab} context={context}/>:tab==="activity"?<PelicanActivity context={context}/>:<PelicanAccount context={context}/>}</div>
    <p className="dash-help pelican-panel-hint">{p("panelHint")}</p>
  </div>;
}
