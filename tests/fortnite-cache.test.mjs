import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const stub=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function moduleURL(path,replacements={}){let s=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll("import 'server-only';",'');for(const [name,value]of Object.entries(replacements))s=s.replaceAll(name,value);return stub(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);}
const data=moduleURL('src/lib/data/dashboard.ts',{'./player-statistics':moduleURL('src/lib/data/player-statistics.ts')});
let saved=null,writes=[];globalThis.__fortniteCache={async query(sql,args){if(sql.startsWith('INSERT')){writes.push(args);saved=JSON.parse(args[0]);return {rows:[]};}return {rows:saved?[{payload:saved}]:[]};}};
const cache=await import(moduleURL('src/lib/server/fortnite-cache.ts',{'../data/fortnite-gg-snapshot':stub('export const fortniteGGSnapshot=null;'),'../data/dashboard':data,'./site-db':stub('export async function siteDatabase(){return globalThis.__fortniteCache;}')}));
const live=()=>({id:'fortnite',source:'public',sourceName:'Fortnite.GG',status:'connected',updatedAt:new Date().toISOString(),items:[{id:'1234-1234-1234',title:'Map',url:'https://fortnite.gg/island/1234-1234-1234',metrics:{players:0,plays:6,minutesPlayed:100,averagePlaytime:11.2}}],metrics:{}});
test('verified live source figures populate the persistent cache and stale fallbacks retain their actual observation time',async()=>{
 const result=await cache.resilientFortniteStats(live());assert.equal(result.status,'connected');assert.equal(result.metrics.projects,1);assert.equal(writes.length,1);
 const unavailable={id:'fortnite',status:'unavailable',source:'none',items:[],metrics:{},updatedAt:null};
 let fallback=await cache.resilientFortniteStats(unavailable);assert.equal(fallback.status,'cached');assert.equal(fallback.metrics.players,0);assert.equal(fallback.updatedAt,result.updatedAt);
 saved.updatedAt=new Date(Date.now()-600000).toISOString();fallback=await cache.resilientFortniteStats(unavailable);assert.equal(fallback.metrics.players,null);assert.equal(fallback.metrics.plays,6);assert.equal(fallback.metrics.minutesPlayed,100);
 saved.updatedAt=new Date(Date.now()-2*86400000).toISOString();fallback=await cache.resilientFortniteStats(unavailable);assert.equal(fallback.metrics.plays,null);assert.equal(fallback.items[0].metrics.uniquePlayers,null);assert.equal(fallback.metrics.minutesPlayed,100);assert.equal(fallback.updatedAt,saved.updatedAt);
});
test('unverified snapshots cannot fabricate map metrics or redirect project links',()=>{
 assert.equal(cache.verifiedFortniteSnapshot({...live(),updatedAt:'invalid'}),null);assert.equal(cache.verifiedFortniteSnapshot({...live(),sourceName:'other'}),null);
 const unsafe=live();unsafe.items[0].metrics.players=-1;assert.equal(cache.verifiedFortniteSnapshot(unsafe),null);
 const external=live();external.items[0].url='https://evil.test';assert.equal(cache.verifiedFortniteSnapshot(external).items[0].url,'https://fortnite.gg/island/1234-1234-1234');
});
