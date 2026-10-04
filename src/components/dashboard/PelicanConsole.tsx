"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Terminal, Cpu, MemoryStick, HardDrive, Plug, RefreshCw, Send, Trash2, Play, Square, RotateCw, Clock, ShieldCheck } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { cleanConsoleLine, parsePelicanStats, pelicanState, type PelicanServer } from "@/lib/data/pelican";

type Signal="start"|"stop"|"restart";
type Sample={cpu:number|null;memory:number|null};
export default function PelicanConsole({onConnections,onExpired}:{onConnections:()=>void;onExpired:()=>void}) {
  const d=useTranslations("dashboard"),h=useTranslations("hub"),locale=useLocale();
  const [server,setServer]=useState<PelicanServer|null>(null),[setup,setSetup]=useState(false),[state,setState]=useState("connecting"),[epoch,setEpoch]=useState(0);
  const [logs,setLogs]=useState<string[]>([]),[samples,setSamples]=useState<Sample[]>([]),[command,setCommand]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[confirm,setConfirm]=useState<Signal|null>(null),[follow,setFollow]=useState(true);
  const output=useRef<HTMLDivElement>(null),history=useRef<string[]>([]),historyIndex=useRef(-1);
  useEffect(()=>{
    const controller=new AbortController();let tornDown=false,socket:WebSocket|null=null,timer:ReturnType<typeof setTimeout>|undefined,attempts=0,refreshing=false;
    const postToken=async()=>{const response=await fetch("/api/admin/pelican",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"websocket"})});if(response.status===401){onExpired();throw Error("expired");}if(!response.ok)throw Error("socket");return await response.json() as {socket:string;token:string};};
    const renew=async()=>{if(refreshing||tornDown||socket?.readyState!==WebSocket.OPEN)return;refreshing=true;try{const value=await postToken();if(!tornDown&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({event:"auth",args:[value.token]}));}catch{if(!tornDown)socket?.close();}finally{refreshing=false;}};
    const connect=async()=>{
      try {
        const response=await fetch("/api/admin/pelican",{cache:"no-store",signal:controller.signal});if(response.status===401){onExpired();return;}if(!response.ok)throw Error("unavailable");const result=await response.json();if(tornDown)return;
        if(result.status==="setup"){setSetup(true);setState("setup");return;}setSetup(false);setServer(result.server);setState("connecting");
        const value=await postToken();if(tornDown)return;socket=new WebSocket(value.socket);
        const authTimer=setTimeout(()=>{if(socket?.readyState!==WebSocket.CLOSED)socket?.close();},15000);
        socket.onopen=()=>socket?.send(JSON.stringify({event:"auth",args:[value.token]}));
        socket.onmessage=event=>{
          if(tornDown||typeof event.data!=="string"||event.data.length>200000)return;
          try {
            const frame=JSON.parse(event.data);if(!Array.isArray(frame.args))return;const arg=frame.args[0];
            if(frame.event==="auth success"){clearTimeout(authTimer);setState("connected");attempts=0;socket?.send(JSON.stringify({event:"send logs",args:[null]}));}
            else if(frame.event==="console output"||frame.event==="install output"){if(typeof arg==="string")setLogs(current=>[...current,...cleanConsoleLine(arg).split(/\r?\n/).map(line=>line.slice(0,4000))].slice(-300));}
            else if(frame.event==="stats"){const stats=parsePelicanStats(typeof arg==="string"?JSON.parse(arg):arg,true);setServer(current=>current?{...current,stats:{...stats,state:stats.state??current.stats.state},updatedAt:new Date().toISOString()}:current);if(stats.cpu!==null||stats.memory!==null)setSamples(current=>[...current,{cpu:stats.cpu,memory:stats.memory}].slice(-60));}
            else if(frame.event==="status"){const status=pelicanState(arg);if(status)setServer(current=>current?{...current,stats:{...current.stats,state:status}}:current);}
            else if(frame.event==="token expiring"||frame.event==="token expired"){void renew();}
            else if(frame.event==="auth error"||frame.event==="jwt error"){socket?.close();}
          } catch { /* Ignore malformed frames without executing log content. */ }
        };
        socket.onclose=()=>{clearTimeout(authTimer);if(tornDown)return;setState("disconnected");if(attempts++<3)timer=setTimeout(()=>void connect(),Math.min(15000,2000*2**attempts));};
        socket.onerror=()=>socket?.close();
      } catch {if(!tornDown)setState("disconnected");}
    };
    void connect();
    // Re-authentication checks the website session too, including expiry/logout.
    const heartbeat=setInterval(()=>void renew(),45000);
    return()=>{tornDown=true;controller.abort();clearTimeout(timer);clearInterval(heartbeat);socket?.close();};
  },[epoch,onExpired]);
  useEffect(()=>{if(follow&&output.current)output.current.scrollTop=output.current.scrollHeight;},[logs,follow]);
  const sendAction=useCallback(async(action:"command"|"power",value:string)=>{
    if(busy)return;setBusy(true);setMessage("");
    try{const response=await fetch("/api/admin/pelican",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(action==="command"?{action,command:value}:{action,signal:value})});if(response.status===401){onExpired();return;}if(!response.ok)throw Error(response.status===429?"rateLimit":"consoleFailed");if(action==="command"){history.current=[value,...history.current.filter(item=>item!==value)].slice(0,20);historyIndex.current=-1;setCommand("");}else setConfirm(null);setMessage("commandSent");}catch(error){setMessage(error instanceof Error?error.message:"consoleFailed");}finally{setBusy(false);}
  },[busy,onExpired]);
  const format=(n:number|null|undefined)=>typeof n==="number"?new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(n):"—";
  const bytes=(n:number|null|undefined)=>typeof n==="number"?format(n/(1024**3))+" GiB":"—";
  const resources=[{key:"cpu",icon:Cpu,value:format(server?.stats.cpu)+(server?.stats.cpu!==null&&server?.stats.cpu!==undefined?"%":""),limit:server?.limits.cpu,samples:samples.map(s=>s.cpu),color:"#ff8b2c"},{key:"memory",icon:MemoryStick,value:bytes(server?.stats.memory),limit:server?.limits.memory,samples:samples.map(s=>s.memory),color:"#8b7bff"},{key:"disk",icon:HardDrive,value:bytes(server?.stats.disk),limit:server?.limits.disk,samples:[],color:"#40d6ac"}];
  if(setup)return <section><div className="dash-section-heading"><h1>{d("console")}</h1><Terminal size={26}/></div><div className="dash-panel dash-setup dash-console-setup"><span className="dash-platform-logo dash-logo-pelican"><Terminal size={36}/></span><h2>{d("pelicanTitle")}</h2><p>{d("connect_pelican")}</p><button className="dash-button dash-button-primary" type="button" onClick={onConnections}><Plug size={17}/>{d("connectPelican")}</button><small className="dash-help"><ShieldCheck size={15}/>{d("encrypted")}</small></div></section>;
  return <section><div className="dash-section-heading"><div><p className="dash-eyebrow">PELICAN · MINECRAFT</p><h1>{server?.name??d("console")}</h1></div><span className={"dash-connection-state "+(state==="connected"?"is-connected":"")}><i/>{d("console_"+state)}</span></div><div className="dash-console-resources">{resources.map(resource=><div className="dash-panel dash-console-resource" key={resource.key}><span className="dash-item-icon"><resource.icon size={21}/></span><span className="dash-help">{d(resource.key)}</span><strong dir="ltr">{resource.value}</strong>{resource.limit!==null&&resource.limit!==undefined&&<small>{d("limit")}: {resource.limit===0?d("unlimited"):format(resource.limit)+(resource.key==="cpu"?"%":" MiB")}</small>}<Sparkline samples={resource.samples} color={resource.color}/></div>)}</div>
    <div className="dash-panel dash-console-panel"><div className="dash-console-toolbar"><span><Terminal size={17}/>{d("console")}<span className="dash-tag">{server?.stats.state?d("state_"+server.stats.state):"—"}</span></span><div className="dash-icon-actions"><button className="dash-icon-button" type="button" aria-label={h("refresh")} onClick={()=>{setState("connecting");setEpoch(value=>value+1);}}><RefreshCw size={16}/></button><button className="dash-icon-button" type="button" aria-label={d("clearConsole")} onClick={()=>setLogs([])}><Trash2 size={16}/></button></div></div><div ref={output} className="dash-console-output" dir="ltr" tabIndex={0} role="log" aria-live="off" aria-label={d("console")}>{logs.length?logs.map((line,index)=><div key={index} className={/\b(ERROR|SEVERE|WARN)\b/.test(line)?"dash-console-warning":""}>{line||" "}</div>):<p className="dash-help">{d(state==="disconnected"?"wsHint":"waitingLogs")}</p>}</div><form className="dash-console-command" onSubmit={event=>{event.preventDefault();if(command.trim()&&!busy&&state==="connected")void sendAction("command",command.trim());}}><span aria-hidden="true">❯</span><input value={command} onChange={event=>setCommand(event.target.value)} onKeyDown={event=>{if(event.key!=="ArrowUp"&&event.key!=="ArrowDown")return;event.preventDefault();historyIndex.current=Math.max(-1,Math.min(history.current.length-1,historyIndex.current+(event.key==="ArrowUp"?1:-1)));setCommand(history.current[historyIndex.current]??"");}} maxLength={1000} autoComplete="off" spellCheck={false} dir="ltr" aria-label={d("command")} placeholder={d("command")} disabled={state!=="connected"||busy}/><button className="dash-icon-button" type="submit" aria-label={d("sendCommand")} disabled={!command.trim()||busy||state!=="connected"}><Send size={17}/></button></form></div>
    <div className="dash-console-footer"><label className="dash-help dash-follow"><input type="checkbox" checked={follow} onChange={event=>setFollow(event.target.checked)}/>{d("followLogs")}</label><span className="dash-help"><Clock size={14}/>{d("uptime")}: {server?.stats.uptime!==null&&server?.stats.uptime!==undefined?format(server.stats.uptime/60000)+" "+d("minutes"):"—"}</span><div className="dash-actions">{([{signal:"start",icon:Play},{signal:"restart",icon:RotateCw},{signal:"stop",icon:Square}] as const).map(action=><button className={"dash-button "+(action.signal==="stop"?"dash-danger":"")} type="button" disabled={busy||state!=="connected"} key={action.signal} onClick={()=>{setMessage("");setConfirm(action.signal);}}><action.icon size={14}/>{d(action.signal)}</button>)}</div></div>{message&&<p role="status" className={message==="commandSent"?"dash-success":"hub-error"}>{message==="rateLimit"?h(message):d(message)}</p>}
    {confirm&&<DetailsDialog title={d(confirm)} onClose={()=>{if(!busy)setConfirm(null);}}><div className="dash-delete-dialog"><p>{d("powerConfirm",{action:d(confirm)})}</p><div className="dash-actions"><button className={"dash-button "+(confirm==="stop"?"dash-danger":"dash-button-primary")} type="button" disabled={busy} onClick={()=>void sendAction("power",confirm)}>{busy?h("loading"):d(confirm)}</button><button className="dash-button" type="button" disabled={busy} onClick={()=>setConfirm(null)}>{d("cancel")}</button></div>{message&&<p className="hub-error" role="alert">{message==="rateLimit"?h(message):d(message)}</p>}</div></DetailsDialog>}
  </section>;
}
function Sparkline({samples,color}:{samples:(number|null)[];color:string}) {
  const d=useTranslations("dashboard");
  if(samples.length<2)return <span className="dash-sparkline-placeholder">{d("liveSamples")}</span>;
  const max=Math.max(1,...samples.filter((n):n is number=>n!==null));
  const path=samples.map((n,index)=>n===null?"":(index===0||samples[index-1]===null?"M":"L")+index/(samples.length-1)*200+","+(38-n/max*32)).join(" ");
  return <svg className="dash-sparkline" viewBox="0 0 200 44" aria-label={d("liveSamples")} role="img"><path d={path} fill="none" stroke={color} strokeWidth="2"/></svg>;
}
