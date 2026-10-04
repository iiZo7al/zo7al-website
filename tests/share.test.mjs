import test from "node:test";
import assert from "node:assert/strict";
import {copyText,shareLink} from "../src/lib/browser/share.ts";

function browser(t,navigator,document={}) {
 const previous=Object.fromEntries(["navigator","document"].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:navigator});
 Object.defineProperty(globalThis,"document",{configurable:true,value:document});
 t.after(()=>{for(const key of ["navigator","document"]) {if(previous[key])Object.defineProperty(globalThis,key,previous[key]);else delete globalThis[key];}});
}
const url="https://zo7al.test/modpacks?project=modrinth%3Aexample";
test("sharing uses the native sheet when supported",async t=>{
 let sent;browser(t,{share:async value=>{sent=value;},canShare:()=>true});
 assert.equal(await shareLink(url,"Zo7al"),"shared");assert.deepEqual(sent,{url,title:"Zo7al"});
});
test("dismissing the share sheet does not copy unexpectedly",async t=>{
 let copied=false;browser(t,{share:async()=>{throw new DOMException("Cancelled","AbortError");},clipboard:{writeText:async()=>{copied=true;}}});
 assert.equal(await shareLink(url,"Zo7al"),"cancelled");assert.equal(copied,false);
});
test("unsupported sharing copies the complete deep link",async t=>{
 let copied;browser(t,{canShare:()=>false,share:async()=>{throw Error("Unexpected sheet");},clipboard:{writeText:async value=>{copied=value;}}});
 assert.equal(await shareLink(url,"Zo7al"),"copied");assert.equal(copied,url);
});
test("browser cancellation objects preserve the same no-copy behavior",async t=>{
 let copied=false;browser(t,{share:async()=>{throw {name:"AbortError"};},clipboard:{writeText:async()=>{copied=true;}}});
 assert.equal(await shareLink(url,"Zo7al"),"cancelled");assert.equal(copied,false);
});
test("share permission errors fall back to copying",async t=>{
 let copied;browser(t,{share:async()=>{throw new DOMException("Denied","NotAllowedError");},clipboard:{writeText:async value=>{copied=value;}}});
 assert.equal(await shareLink(url,"Zo7al"),"copied");assert.equal(copied,url);
});
test("clipboard permission errors use a dialog-local field and restore focus",async t=>{
 const events=[];const field={style:{},focus(){events.push("focus");},select(){events.push("select");},setSelectionRange(a,b){assert.deepEqual([a,b],[0,url.length]);},remove(){events.push("remove");}};
 const dialog={appendChild(value){assert.equal(value,field);events.push("append");}};
 const focused={closest(selector){assert.equal(selector,"dialog[open]");return dialog;},focus(){events.push("restore");}};
 browser(t,{clipboard:{writeText:async()=>{throw Error("Denied");}}},{activeElement:focused,createElement:()=>field,execCommand(command){assert.equal(command,"copy");assert.equal(field.value,url);return true;}});
 assert.equal(await copyText(url),true);assert.deepEqual(events,["append","focus","select","remove","restore"]);
});
test("when all copy methods fail, sharing offers a manual link",async t=>{
 let removed=false;const field={style:{},focus(){},select(){},setSelectionRange(){},remove(){removed=true;}};
 browser(t,{}, {activeElement:null,createElement:()=>field,body:{appendChild(){}},execCommand(){return false;}});
 assert.equal(await shareLink(url,"Zo7al"),"manual");assert.equal(removed,true);
});
