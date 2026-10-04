"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw, Plug, X, Check, ShieldCheck } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { object, string } from "@/lib/data/pelican-management";

export type PelicanContext = { server?:string; onExpired:()=>void; onConnections:()=>void };
const endpoint="/api/admin/pelican/manage";
function errorKey(code:unknown) {
  return code === "INVALID" ? "invalid" : code === "PELICAN_PERMISSION" ? "permissionDenied" : code === "PELICAN_VALIDATION" ? "validationError" : code === "PELICAN_NOT_FOUND" ? "notFound" : code === "RATE_LIMIT" ? "rateLimit" : code === "SETUP_REQUIRED" ? "setupHint" : "unavailable";
}
export function usePelicanResource(resource:string,context:PelicanContext,params:Record<string,string>={}) {
  const {server,onExpired}=context;
  const query=JSON.stringify(params);
  const [data,setData]=useState<unknown>(undefined),[loading,setLoading]=useState(true),[setup,setSetup]=useState(false),[error,setError]=useState("");
  const controller=useRef<AbortController|null>(null);
  const reload=useCallback(async()=>{
    controller.current?.abort();const current=new AbortController();controller.current=current;
    setLoading(true);setError("");
    try {
      const search=new URLSearchParams({resource,...JSON.parse(query),...(server?{server}:{})});
      const response=await fetch(endpoint+"?"+search,{cache:"no-store",signal:current.signal});
      if(response.status===401){onExpired();return;}
      const value=await response.json();if(!response.ok)throw Error(errorKey(value.error));
      if(current.signal.aborted)return;setSetup(value.status==="setup");setData(value.data);
    }catch(error){if(!current.signal.aborted)setError(error instanceof Error?error.message:"unavailable");}
    finally{if(!current.signal.aborted)setLoading(false);}
  },[resource,query,server,onExpired]);
  useEffect(()=>{let cancelled=false;queueMicrotask(()=>{if(!cancelled)void reload();});return()=>{cancelled=true;controller.current?.abort();};},[reload]);
  return {data,loading,setup,error,reload};
}
export function usePelicanActions(context:PelicanContext,reload:()=>Promise<void>) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const active=useRef(false),lock=useRef(false),controller=useRef<AbortController|null>(null);
  useEffect(()=>{active.current=true;return()=>{active.current=false;controller.current?.abort();};},[]);
  const run=async(action:string,input:Record<string,unknown>={})=>{
    if(lock.current)return null;lock.current=true;setBusy(true);setMessage("");
    controller.current=new AbortController();
    try {
      const response=await fetch(endpoint,{method:"POST",signal:controller.current.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({action,input,...(context.server?{server:context.server}:{})})});
      if(response.status===401){context.onExpired();return null;}
      const result=await response.json();if(!response.ok)throw Error(errorKey(result.error));
      if(!active.current)return null;
      if(!["fileDownload","fileUpload","backupDownload"].includes(action)){setMessage("saved");await reload();}
      return {data:result.data};
    }catch(error){if(active.current&&!controller.current.signal.aborted)setMessage(error instanceof Error?error.message:"unavailable");return null;}
    finally{lock.current=false;if(active.current)setBusy(false);}
  };
  return {busy,message,run,setMessage};
}
export function PelicanFeedback({message}:{message:string}) {
  const p=useTranslations("pelican");
  return message?<div className={"dash-notice "+(message==="saved"?"dash-success":"hub-error")} role="status">{message==="saved"&&<Check size={17}/>}<span>{p.has(message)?p(message):p("unavailable")}</span></div>:null;
}
export type Field = {name:string;label?:string;type?:"text"|"textarea"|"checkbox"|"number"|"email"|"url"|"password"|"select";options?:{value:string;label:string}[];required?:boolean;max?:number;min?:number;dir?:"ltr"|"auto"};
export type OperationForm = {title:string;action:string;fields:Field[];initial?:Record<string,unknown>;danger?:string;detail?:string};
export function PelicanForm({form,busy,run,onClose}:{form:OperationForm;busy:boolean;run:(action:string,input:Record<string,unknown>)=>Promise<unknown>;onClose:()=>void}) {
  const p=useTranslations("pelican");
  const [error,setError]=useState(false);
  return <DetailsDialog title={p(form.title)} onClose={()=>{if(!busy)onClose();}}><form className="hub-form pelican-dialog-form" onSubmit={async event=>{
    event.preventDefault();const values=new FormData(event.currentTarget),input={...form.initial};
    for(const field of form.fields)input[field.name]=field.type==="checkbox"?values.has(field.name):field.type==="number"?Number(values.get(field.name)):values.get(field.name);
    if(form.danger)input.confirm=true;
    setError(false);const result=await run(form.action,input);if(result)onClose();else setError(true);
  }}>
    {form.detail&&<p className="dash-help" dir="auto">{form.detail}</p>}
    {form.fields.map(field=>field.type==="checkbox"?<label key={field.name} className="hub-consent"><input type="checkbox" name={field.name} defaultChecked={form.initial?.[field.name]===true}/>{p(field.label??field.name)}</label>:<label key={field.name}>{p(field.label??field.name)}{field.type==="textarea"?<textarea name={field.name} defaultValue={string(form.initial?.[field.name])} required={field.required} maxLength={field.max??16000} rows={4} dir={field.dir??"auto"}/>:field.type==="select"?<select name={field.name} defaultValue={string(form.initial?.[field.name])} required={field.required}>{field.options?.map(option=><option key={option.value} value={option.value}>{p.has(option.label)?p(option.label):option.label}</option>)}</select>:<input type={field.type??"text"} name={field.name} defaultValue={typeof form.initial?.[field.name]==="number"?String(form.initial[field.name]):string(form.initial?.[field.name])} required={field.required} maxLength={field.max??255} minLength={field.type!=="number"?field.min:undefined} min={field.min} max={field.type==="number"?field.max:undefined} autoComplete="off" dir={field.dir??"auto"}/>}</label>)}
    {form.danger&&<label className="hub-consent pelican-confirm"><input type="checkbox" required/>{p(form.danger)}</label>}
    {error&&<p className="hub-error" role="alert">{p("actionFailed")}</p>}
    <div className="dash-actions"><button className={"dash-button "+(form.danger?"dash-danger":"dash-button-primary")} disabled={busy} type="submit">{p(busy?"loading":"confirm")}</button><button className="dash-button" disabled={busy} type="button" onClick={onClose}>{p("cancel")}</button></div>
  </form></DetailsDialog>;
}
export function PelicanContent({resource,children,context,state,actions}:{resource:string;children:ReactNode;context:PelicanContext;state:ReturnType<typeof usePelicanResource>;actions?:ReactNode}) {
  const p=useTranslations("pelican");
  return <section className="pelican-section"><div className="dash-section-heading"><div><p className="dash-eyebrow">PELICAN · ZO7AL PROJECTS</p><h1>{p(resource)}</h1><p className="dash-help">{p.has(resource+"Hint")?p(resource+"Hint"):p("serverHint")}</p></div><button type="button" className="dash-icon-button" aria-label={p("refresh")} onClick={()=>void state.reload()} disabled={state.loading}><RefreshCw size={18} className={state.loading?"dash-spinning":""}/></button></div>
    {state.setup?<div className="dash-panel card-glow dash-setup"><Plug size={32}/><h2>{p("setupTitle")}</h2><p>{p("setupHint")}</p><button className="dash-button dash-button-primary" type="button" onClick={context.onConnections}>{p("connect")}</button></div>:<>{state.error&&<PelicanFeedback message={state.error}/>}<div className="dash-actions pelican-toolbar">{actions}</div>{state.loading&&state.data===undefined?<div className="dash-panel card-glow dash-empty">{p("loading")}</div>:state.data!==undefined?children:null}</>}
  </section>;
}
export function usePelicanFormat() {
  const locale=useLocale();
  return {
    date:(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—",
    bytes:(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?new Intl.NumberFormat(locale,{style:"unit",unit:value>=1024**3?"gigabyte":value>=1024**2?"megabyte":"kilobyte",maximumFractionDigits:2}).format(value/(value>=1024**3?1024**3:value>=1024**2?1024**2:1024)):"—",
  };
}
export function openPelicanDownload(value:unknown) {
  const url=string(object(value).url);if(!url.startsWith("https://"))return;
  const anchor=document.createElement("a");anchor.href=url;anchor.rel="noopener noreferrer";anchor.referrerPolicy="no-referrer";anchor.target="_blank";anchor.click();
}
export function PelicanEmpty() {const p=useTranslations("pelican");return <div className="dash-panel card-glow dash-empty"><ShieldCheck size={27}/>{p("empty")}</div>;}
export function PelicanCloseButton({onClick}:{onClick:()=>void}) {const p=useTranslations("pelican");return <button type="button" className="dash-icon-button" aria-label={p("close")} onClick={onClick}><X size={18}/></button>;}
