import test from 'node:test';
import assert from 'node:assert/strict';
import {newSystemNotices} from '../src/lib/data/system-notifications.ts';
import {parseFortniteGGCreator} from '../src/lib/data/fortnite-gg.ts';
test('system notifications suppress existing, read, opted-out and cross-origin notices',()=>{
 const now=Date.now(),make=(id,extra={})=>({id,kind:'news',date:new Date(now+1).toISOString(),href:'/news',...extra});
 const result=newSystemNotices([make('new'),make('known'),make('read'),make('old',{date:new Date(now-1000).toISOString()}),make('off',{kind:'projects'}),make('remote',{href:'//evil.test/'})],new Set(['known']),{news:true,projects:false},['read'],now);
 assert.deepEqual(result.map(n=>n.id),['new']);
});
test('Fortnite.GG null and rounded counts never conflate missing metrics with zero',()=>{
 const html=`<a href='/island/1234-1234-1234'><h3 class='island-title'>A &amp; B</h3><div><span>Players Now</span> 0</div><div><span>Minutes Played</span> 22.6K</div><div><span>24h Plays</span> –</div></a>`;
 const item=parseFortniteGGCreator(html)[0];assert.equal(item.title,'A & B');assert.equal(item.metrics.players,0);assert.equal(item.metrics.minutesPlayed,22600);assert.equal(item.metrics.plays,null);
 assert.throws(()=>parseFortniteGGCreator('<h1>Service unavailable</h1>'),/INVALID_UPSTREAM/);
});
