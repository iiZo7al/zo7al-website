import test from 'node:test';
import assert from 'node:assert/strict';
import {validateApplication,webhookUrl,createApplicationHandler} from '../src/lib/server/creator-applications.ts';
const valid={platform:'youtube',email:'creator@example.com',minecraft:'Zo7al',discord:'zo7al',channel:'https://www.youtube.com/@zo7al',followers:'100',content:'Minecraft videos',reason:'I make Minecraft videos.\nI would like to join.',consent:true};
const hook='https://discord.com/api/webhooks/123/abc';
const req=(body=valid)=>new Request('https://example.com/api/creator-applications',{method:'POST',headers:{origin:'https://example.com','content-type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)});
test('validate platform, consent and multiline application',()=>{assert.ok(validateApplication(valid));assert.equal(validateApplication({...valid,consent:false}),null);assert.equal(validateApplication({...valid,platform:'twitch'}),null);assert.equal(validateApplication({...valid,channel:'https://youtube.com.evil.test/@x'}),null);assert.equal(webhookUrl('https://evil.test/api/webhooks/123/abc'),null);});
test('success requires Discord receipt; mentions disabled',async()=>{let sent;const handle=createApplicationHandler(()=>hook,async(url,options)=>{assert.equal(new URL(url).search,'?wait=true');sent=JSON.parse(options.body);return Response.json({id:'12345'});});const result=await handle(req());assert.equal(result.status,200);assert.equal((await result.json()).ok,true);assert.deepEqual(sent.allowed_mentions,{parse:[]});});
test('missing webhook and failed delivery do not report success',async()=>{assert.equal((await createApplicationHandler(()=>undefined)(req())).status,503);assert.equal((await createApplicationHandler(()=>hook,async()=>new Response('',{status:500}))(req())).status,502);assert.equal((await createApplicationHandler(()=>hook,async()=>Response.json({}))(req())).status,502);});
test('cross-origin and repeated submissions are blocked',async()=>{const handle=createApplicationHandler(()=>hook,async()=>Response.json({id:'12'}));const cross=req();cross.headers.set('origin','https://evil.test');assert.equal((await handle(cross)).status,403);for(let i=0;i<3;i++) assert.equal((await handle(req())).status,200);assert.equal((await handle(req())).status,429);});

test('tracked applications reserve before delivery and retain their receipt during a webhook outage',async()=>{
 const steps=[];
 const storage={save:async()=>{steps.push('save');return {token:'a'.repeat(64)};},delivered:async()=>{steps.push('delivered');},discard:async()=>{steps.push('discard');}};
 const handle=createApplicationHandler(()=>hook,async()=>{steps.push('webhook');return Response.json({id:'12345'});},storage);
 const result=await handle(req());assert.equal(result.status,200);assert.equal((await result.json()).token,'a'.repeat(64));assert.deepEqual(steps,['save','webhook','delivered']);
 const failed=createApplicationHandler(()=>hook,async()=>Response.json({}),storage);
 const retained=await failed(req());assert.equal(retained.status,202);const pending=await retained.json();assert.equal(pending.discordPending,true);assert.equal(pending.token,'a'.repeat(64));assert.notEqual(steps.at(-1),'discard');
 const confirmed=createApplicationHandler(()=>hook,async()=>Response.json({id:'12345'}),{...storage,delivered:async()=>{throw Error('DB outage after confirmation');}});
 assert.equal((await confirmed(req())).status,200);
});

test('application normalization drops extra fields and a storage failure never sends an untracked notification',async()=>{
 const clean=validateApplication({...valid,minecraft:' Zo7al ',email:'creator@example.com',extra:'private field'});
 assert.equal(clean.minecraft,'Zo7al');assert.equal('extra' in clean,false);
 let calls=0;
 const handle=createApplicationHandler(()=>hook,async()=>{calls++;return Response.json({id:'12345'});},{save:async()=>{throw Error('DB outage');},delivered:async()=>{},discard:async()=>{}});
 assert.equal((await handle(req())).status,503);assert.equal(calls,0);
});
