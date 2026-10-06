"use client";
import { useEffect,useRef,useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import { useLocale,useTranslations } from "next-intl";
import DetailsDialog from "@/components/ui/DetailsDialog";
import SearchIcon from "@/components/ui/SearchIcon";
type Entry={title:string;href:string;keywords?:string;category?:string};
const normalize=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f]/g,"").toLocaleLowerCase();
export function SearchTrigger() {
  const t=useTranslations("hub");
  return <button type="button" className="nav-search-trigger" data-cursor="link" aria-label={t("search")} title={t("search")+" · Ctrl + K"} aria-haspopup="dialog" onClick={()=>window.dispatchEvent(new Event("zo7al-search"))}><SearchIcon size={17}/></button>;
}
export default function CommandSearch() {
  const t=useTranslations("hub"),nav=useTranslations("nav"),faq=useTranslations("faq"),locale=useLocale(),path=usePathname(),router=useRouter();
  const [open,setOpen]=useState(false),[query,setQuery]=useState(""),[remote,setRemote]=useState<Entry[]>([]),[active,setActive]=useState(0),[loading,setLoading]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const allowed=()=>path!=="/game"&&!document.documentElement.classList.contains("space-flight-active");
    const show=()=>{if(allowed()){setOpen(true);setQuery("");setActive(0);}};
    const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&allowed()){e.preventDefault();show();}};
    window.addEventListener("keydown",key);window.addEventListener("zo7al-search",show);
    return()=>{window.removeEventListener("keydown",key);window.removeEventListener("zo7al-search",show);};
  },[path]);
  useEffect(()=>{
    if(!open)return;
    input.current?.focus();
    const c=new AbortController();
    queueMicrotask(()=>{if(!c.signal.aborted)setLoading(true);});
    void fetch("/api/hub/search?locale="+locale,{signal:c.signal}).then(r=>r.json()).then(data=>{if(!c.signal.aborted)setRemote(Array.isArray(data.items)?data.items:[]);}).catch(()=>{}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[open,locale]);
  useEffect(()=>{if(open)document.getElementById(`search-result-${active}`)?.scrollIntoView({block:"nearest"});},[open,active]);
  const entries:Entry[]=[
    ...(["home","minecraft","modpacks","fortnite","socials","support","store"] as const).map(key=>({title:nav(key),href:key==="home"?"/":"/"+key,keywords:key})),
    ...([{key:"news",href:"/#news"},{key:"events",href:"/minecraft#events"},{key:"player",href:"/minecraft#player"},{key:"activity",href:"/requests?tab=orders"},{key:"applications",href:"/requests?tab=applications"}]).map(({key,href})=>({title:t(key),href,keywords:key})),
    {title:"Space Run",href:"/game",keywords:"game rocket"},
    {title:t("commonErrorsTitle"),href:"/minecraft#common-errors",keywords:"errors حلول مشاكل"},
    ...(faq.raw("items") as {q:string;a:string}[]).map(item=>({title:item.q,href:"/support#faq",keywords:item.a,category:faq("title")})),
    ...remote
  ];
  const search=normalize(query.trim());
  const results=query.trim().toLowerCase()==="/dashboard"?[{title:"/dashboard",href:"/dashboard"}]:entries.filter(item=>!search||normalize(item.title+" "+(item.keywords??"")).includes(search)).slice(0,25);
  const go=(href:string)=>{setOpen(false);router.push(href);};
  if(!open)return null;
  return <DetailsDialog title={t("search")+" · Ctrl + K"} onClose={()=>setOpen(false)}><div className="hub-command"><label htmlFor="global-search" className="sr-only">{t("search")}</label><input ref={input} id="global-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}} placeholder={t("searchPlaceholder")} className="hub-search-input" role="combobox" aria-expanded="true" aria-controls="global-search-results" aria-autocomplete="list" aria-activedescendant={results.length?`search-result-${Math.min(active,results.length-1)}`:undefined} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setActive(v=>results.length?(v+1)%results.length:0);}if(e.key==="ArrowUp"){e.preventDefault();setActive(v=>results.length?(v-1+results.length)%results.length:0);}if(e.key==="Enter"&&results.length){e.preventDefault();go(results[Math.min(active,results.length-1)].href);}}}/><div id="global-search-results" role="listbox" aria-label={t("search")} className="hub-command-list">{results.map((item,index)=><button key={item.href+":"+index} id={`search-result-${index}`} type="button" role="option" aria-selected={index===Math.min(active,results.length-1)} className="hub-command-item text-start" onMouseEnter={()=>setActive(index)} onClick={()=>go(item.href)}><span dir="auto">{item.title}</span>{item.category&&<small dir="auto">{item.category}</small>}</button>)}{!results.length&&<p className="hub-muted">{faq("noResults")}</p>}</div>{loading&&<p className="hub-muted mt-3" role="status">{t("loading")}</p>}</div></DetailsDialog>;
}
