"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Folder, FolderPlus, File as FileIcon, FilePlus2, Upload, Download, Pencil, Copy, Trash2, Archive, ArrowUp, Link, Shield, Save, X } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { collection, filePath, object, string } from "@/lib/data/pelican-management";
import { PelicanContent, PelicanEmpty, PelicanFeedback, PelicanForm, usePelicanActions, usePelicanFormat, usePelicanResource, openPelicanDownload, type OperationForm, type PelicanContext } from "./pelican-ui";

type Editor = {file:string;content:string;loading:boolean;error:string};
export default function PelicanFiles({context}:{context:PelicanContext}) {
  const p=useTranslations("pelican"),format=usePelicanFormat();
  const [directory,setDirectory]=useState("/"),[search,setSearch]=useState(""),[selected,setSelected]=useState<string[]>([]),[form,setForm]=useState<OperationForm|null>(null),[editor,setEditor]=useState<Editor|null>(null),[uploadProgress,setUploadProgress]=useState<number|null>(null),[uploadError,setUploadError]=useState("");
  const state=usePelicanResource("files",context,{directory}),actions=usePelicanActions(context,state.reload);
  const fileInput=useRef<HTMLInputElement>(null),uploadRequest=useRef<XMLHttpRequest|null>(null),uploadLock=useRef(false),editRequest=useRef<AbortController|null>(null),mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;uploadRequest.current?.abort();editRequest.current?.abort();};},[]);
  const navigate=(path:string)=>{if(uploadProgress!==null)return;try{setDirectory(filePath(path));setSelected([]);setSearch("");actions.setMessage("");}catch{actions.setMessage("invalid");}};
  const rows=collection(state.data).filter(row=>string(row.name).toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>Number(a.is_file)-Number(b.is_file)||string(a.name).localeCompare(string(b.name)));
  const path=(name:string)=>directory.replace(/\/$/,"")+"/"+name;
  const run=async(action:string,input:Record<string,unknown>)=>{const result=await actions.run(action,input);if(result)setSelected([]);return result;};
  const openEditor=async(file:string,content?:string)=>{
    editRequest.current?.abort();const controller=new AbortController();editRequest.current=controller;
    setEditor({file,content:content??"",loading:content===undefined,error:""});
    if(content!==undefined)return;
    try {
      const query=new URLSearchParams({resource:"fileContents",file,...(context.server?{server:context.server}:{})});
      const response=await fetch("/api/admin/pelican/manage?"+query,{cache:"no-store",signal:controller.signal});
      if(response.status===401){context.onExpired();return;}
      const value=await response.json();if(!response.ok||typeof value.data!=="string")throw Error("fileReadFailed");
      if(!controller.signal.aborted)setEditor({file,content:value.data,loading:false,error:value.data.includes("\u0000")||new TextEncoder().encode(value.data).length>1000000?"editLimit":""});
    }catch{if(!controller.signal.aborted)setEditor({file,content:"",loading:false,error:"fileReadFailed"});}
  };
  const upload=async(files:File[],targetDirectory:string)=>{
    if(!files.length||uploadLock.current)return null;
    uploadLock.current=true;setUploadError("");setUploadProgress(0);
    try {
      const result=await actions.run("fileUpload");if(!result)throw Error("uploadFailed");
      const url=new URL(string(object(result.data).url));url.searchParams.set("directory",targetDirectory);
      const body=new FormData();for(const file of files)body.append("files",file,file.name);
      await new Promise<void>((resolve,reject)=>{
        const request=new XMLHttpRequest();uploadRequest.current=request;request.open("POST",url.href);request.timeout=15*60*1000;
        request.upload.onprogress=event=>{if(event.lengthComputable&&mounted.current)setUploadProgress(Math.round(event.loaded/event.total*100));};
        request.onload=()=>request.status>=200&&request.status<300?resolve():reject(Error("uploadFailed"));
        request.onerror=()=>reject(Error("uploadFailed"));request.ontimeout=()=>reject(Error("uploadFailed"));request.onabort=()=>reject(Error("uploadCancelled"));request.send(body);
      });
      if(mounted.current){actions.setMessage("saved");await state.reload();}
      return {ok:true};
    }catch(error){if(mounted.current)setUploadError(error instanceof Error?error.message:"uploadFailed");return null;}
    finally{uploadLock.current=false;if(mounted.current)setUploadProgress(null);uploadRequest.current=null;}
  };
  const startUpload=(files:File[])=>{
    const names=new Set(collection(state.data).map(row=>string(row.name)));
    if(files.some(file=>names.has(file.name))){setForm({title:"upload",action:"uploadLocal",fields:[],initial:{files,directory},danger:"overwriteWarning",detail:files.map(file=>file.name).join(", ")});return;}
    void upload(files,directory);
  };
  const disabled=actions.busy||uploadProgress!==null;
  return <PelicanContent resource="files" context={context} state={state} actions={<>
    <button className="dash-button dash-button-primary" type="button" disabled={disabled} onClick={()=>fileInput.current?.click()}><Upload size={16}/>{p("upload")}</button>
    <input ref={fileInput} type="file" multiple className="pelican-file-input" tabIndex={-1} aria-label={p("upload")} onChange={event=>{startUpload(Array.from(event.currentTarget.files??[]));event.currentTarget.value="";}}/>
    <button className="dash-button" type="button" disabled={disabled} onClick={()=>setForm({title:"newFolder",action:"fileFolder",fields:[{name:"name",required:true}],initial:{root:directory}})}><FolderPlus size={16}/>{p("newFolder")}</button>
    <button className="dash-button" type="button" disabled={disabled} onClick={()=>setForm({title:"newFile",action:"newFileLocal",fields:[{name:"name",required:true}],initial:{root:directory}})}><FilePlus2 size={16}/>{p("newFile")}</button>
    <button className="dash-button" type="button" disabled={disabled} onClick={()=>setForm({title:"pull",action:"filePull",fields:[{name:"url",type:"url",required:true,max:4096,dir:"ltr"},{name:"filename"},{name:"use_header",label:"useHeader",type:"checkbox"}],initial:{directory},detail:p("pullHint")})}><Link size={16}/>{p("pull")}</button>
  </>}>
    <PelicanFeedback message={actions.message}/><PelicanFeedback message={uploadError}/>
    <div className="dash-panel card-glow pelican-files"><div className="pelican-file-location"><button className="dash-icon-button" type="button" disabled={directory==="/"||disabled} aria-label={p("parentDirectory")} onClick={()=>navigate(directory.slice(0,directory.lastIndexOf("/"))||"/")}><ArrowUp size={18}/></button><nav className="pelican-breadcrumbs" aria-label={p("directory")}><button type="button" onClick={()=>navigate("/")} disabled={disabled}><Folder size={16}/> /</button>{directory.split("/").filter(Boolean).map((part,index,parts)=><button key={index} type="button" disabled={disabled} onClick={()=>navigate("/"+parts.slice(0,index+1).join("/"))}><bdi>{part}</bdi> /</button>)}</nav><input className="dash-search" aria-label={p("searchFiles")} placeholder={p("searchFiles")} value={search} onChange={event=>setSearch(event.target.value)}/></div>
    {selected.length>0&&<div className="pelican-selection"><strong>{p("selected",{count:selected.length})}</strong><button className="dash-button" type="button" disabled={disabled} onClick={()=>setForm({title:"compress",action:"fileCompress",initial:{root:directory,files:selected,extension:"tar.gz"},fields:[{name:"name"},{name:"extension",type:"select",options:["zip","tar.gz","tar.xz","tar.bz2"].map(value=>({value,label:value}))}]})}><Archive size={16}/>{p("compress")}</button><button className="dash-button" type="button" disabled={disabled} onClick={()=>setForm({title:"chmod",action:"fileChmod",initial:{root:directory,files:selected,mode:"644"},fields:[{name:"mode",required:true,max:4,dir:"ltr"}]})}><Shield size={16}/>{p("chmod")}</button><button className="dash-button dash-danger" type="button" disabled={disabled} onClick={()=>setForm({title:"delete",action:"fileDelete",initial:{root:directory,files:selected},fields:[],danger:"deleteWarning",detail:selected.join(", ")})}><Trash2 size={16}/>{p("delete")}</button></div>}
    <div className="pelican-file-heading"><label className="pelican-checkbox"><input type="checkbox" checked={rows.length>0&&rows.every(row=>selected.includes(string(row.name)))} aria-label={p("selectAll")} onChange={event=>setSelected(event.target.checked?rows.map(row=>string(row.name)):[])}/><span>{p("name")}</span></label><span>{p("size")}</span><span>{p("modified")}</span><span>{p("actions")}</span></div>
    <div className="pelican-drop-area" onDragOver={event=>{if(!disabled)event.preventDefault();}} onDrop={event=>{event.preventDefault();if(!disabled)startUpload(Array.from(event.dataTransfer.files));}}>{rows.map(row=>{
      const name=string(row.name),fullPath=path(name),isFile=row.is_file===true,editable=typeof row.size!=="number"||row.size<=1000000;
      return <div key={name} className="pelican-file-row"><label className="pelican-checkbox"><input type="checkbox" checked={selected.includes(name)} disabled={disabled} aria-label={p("selectFile",{name})} onChange={event=>setSelected(current=>event.target.checked?[...current,name]:current.filter(item=>item!==name))}/></label><button className="pelican-file-name" type="button" disabled={disabled||(isFile&&!editable)} title={isFile&&!editable?p("editLimit"):name} onClick={()=>isFile?void openEditor(fullPath):navigate(fullPath)}>{isFile?<FileIcon size={19}/>:<Folder size={19}/>}<bdi>{name}</bdi>{row.is_symlink===true&&<Link size={12}/>}</button><span className="dash-help pelican-file-size">{format.bytes(row.size)}</span><time className="dash-help pelican-file-date">{format.date(row.modified_at)}</time><div className="dash-icon-actions">
      {isFile&&<button className="dash-icon-button" type="button" disabled={disabled} aria-label={p("download")+" · "+name} onClick={async()=>{const result=await run("fileDownload",{file:fullPath});if(result)openPelicanDownload(result.data);}}><Download size={16}/></button>}
      <details className="pelican-file-menu"><summary className="dash-icon-button" aria-label={p("actions")+" · "+name}>···</summary><div><button type="button" disabled={disabled} onClick={()=>setForm({title:"renameMove",action:"fileRename",initial:{root:"/",from:fullPath,to:fullPath},fields:[{name:"to",label:"destination",required:true,max:4096,dir:"ltr"}]})}><Pencil size={15}/>{p("renameMove")}</button><button type="button" disabled={disabled} onClick={()=>void run("fileCopy",{file:fullPath})}><Copy size={15}/>{p("copy")}</button>{/\.(zip|tar|tgz|gz|txz|xz|bz2)$/i.test(name)&&<button type="button" disabled={disabled} onClick={()=>setForm({title:"decompress",action:"fileDecompress",initial:{root:directory,file:name},fields:[],detail:name})}><Archive size={15}/>{p("decompress")}</button>}<button className="dash-danger" type="button" disabled={disabled} onClick={()=>setForm({title:"delete",action:"fileDelete",initial:{root:directory,files:[name]},fields:[],danger:"deleteWarning",detail:name})}><Trash2 size={15}/>{p("delete")}</button></div></details></div></div>;
    })}{!rows.length&&<div className="dash-empty">{p("emptyDirectory")}</div>}</div>
    <p className="dash-help pelican-files-hint">{p("dropHint")}</p></div>
    {uploadProgress!==null&&<div className="dash-panel card-glow pelican-upload-progress"><Upload size={19}/><span>{p("uploadProgress",{percent:uploadProgress})}</span><progress max={100} value={uploadProgress}/><button className="dash-icon-button" type="button" aria-label={p("cancel")} onClick={()=>uploadRequest.current?.abort()}><X size={17}/></button></div>}
    {!collection(state.data).length&&state.error&&<PelicanEmpty/>}
    {form&&<PelicanForm form={form} busy={disabled} run={async(action,input)=>{
      if(action==="uploadLocal")return upload(input.files as File[],String(input.directory));
      if(action==="newFileLocal"){try{const file=filePath(String(input.root).replace(/\/$/,"")+"/"+String(input.name));void openEditor(file,"");return {ok:true};}catch{return null;}}
      return run(action,input);
    }} onClose={()=>setForm(null)}/>}
    {editor&&<DetailsDialog title={editor.file} onClose={()=>{if(!actions.busy){editRequest.current?.abort();setEditor(null);}}} style={{width:"min(1100px,calc(100vw - 24px))"}}><div className="pelican-editor"><p className="dash-help">{p("editHint")}</p>{editor.error&&<PelicanFeedback message={editor.error}/>}<textarea className="pelican-code-editor" value={editor.content} disabled={editor.loading||actions.busy||!!editor.error} spellCheck={false} dir="ltr" aria-label={p("content")} onChange={event=>setEditor({...editor,content:event.target.value})} maxLength={1000000}/><div className="dash-actions"><button className="dash-button dash-button-primary" type="button" disabled={editor.loading||actions.busy||!!editor.error} onClick={async()=>{const result=await run("fileSave",{file:editor.file,content:editor.content});if(result)setEditor(null);}}><Save size={17}/>{p(editor.loading||actions.busy?"loading":"save")}</button><button className="dash-button" type="button" disabled={actions.busy} onClick={()=>{editRequest.current?.abort();setEditor(null);}}>{p("cancel")}</button></div><PelicanFeedback message={actions.message}/></div></DetailsDialog>}
  </PelicanContent>;
}
