"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { attributes, collection, object, string } from "@/lib/data/pelican-management";
import { PelicanContent, PelicanEmpty, usePelicanFormat, usePelicanResource, type PelicanContext } from "./pelican-ui";
function redact(value:unknown):unknown {
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,/password|token|secret|api.?key/i.test(key)?"••••••••":redact(item)]));
  return value;
}
export default function PelicanActivity({context,account=false}:{context:PelicanContext;account?:boolean}) {
  const p=useTranslations("pelican"),format=usePelicanFormat(),[page,setPage]=useState(1),[filter,setFilter]=useState("");
  const state=usePelicanResource(account?"accountActivity":"activity",context,{page:String(page),...(filter?{filter}:{})}),rows=collection(state.data),pagination=object(object(object(state.data).meta).pagination),lastPage=typeof pagination.total_pages==="number"?pagination.total_pages:1;
  return <PelicanContent resource="activity" context={context} state={state} actions={!account&&<form className="hub-form pelican-activity-search" onSubmit={event=>{event.preventDefault();setPage(1);setFilter(String(new FormData(event.currentTarget).get("filter")??""));}}><label><span className="sr-only">{p("filterActivity")}</span><input name="filter" placeholder={p("filterActivity")} maxLength={100}/></label><button className="dash-button" type="submit">{p("search")}</button></form>}>
    <div className="dash-panel card-glow pelican-activity-list">{rows.map(row=>{
      const actor=attributes(object(row.relationships).actor);
      return <article className="pelican-activity-row" key={String(row.id)}><span className="dash-item-icon"><Activity size={18}/></span><div className="dash-item-copy"><strong dir="ltr">{string(row.event)}</strong><p>{string(row.description)}</p><small>{string(actor.username)||"Pelican"} · {format.date(row.timestamp)}{row.is_api===true?" · API":""}</small>{Object.keys(object(row.properties)).length>0&&<details className="pelican-info-details"><summary>{p("details")}</summary><pre>{JSON.stringify(redact(row.properties),null,2)}</pre></details>}</div></article>;
    })}{!rows.length&&<PelicanEmpty/>}</div>{lastPage>1&&<div className="dash-actions pelican-pagination"><button className="dash-button" disabled={page<=1||state.loading} onClick={()=>setPage(current=>current-1)}><ChevronLeft size={17}/>{p("previous")}</button><span>{page} / {lastPage}</span><button className="dash-button" disabled={page>=lastPage||state.loading} onClick={()=>setPage(current=>current+1)}>{p("next")}<ChevronRight size={17}/></button></div>}
  </PelicanContent>;
}
