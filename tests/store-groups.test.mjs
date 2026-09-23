import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupStoreProducts } from '../src/lib/data/store-groups.ts';
import { localizedDescription } from '../src/lib/data/store-localization.ts';
const booster={id:-1,name:'Booster'};
test('new Tebex groups stay separate, with Booster and MVP++ ordering confined to ranks',()=>{
 const products=[{id:7312784,name:'MVP+',category:{id:1,name:'Ranks',image:null}},{id:2,name:'MVP++',category:{id:1,name:'Ranks',image:null}},{id:3,name:'10,000 Coins',category:{id:2,name:'Coins',image:'https://example.com/coins.png'}},{id:4,name:'Future item',category:{id:3,name:'New category',image:null}}];
 const groups=groupStoreProducts(products,booster);
 assert.deepEqual(groups.map(g=>g.name),['Ranks','Coins','New category']);
 assert.deepEqual(groups[0].products.map(p=>p.name),['MVP++','MVP+','Booster']);
 assert.equal(groups[1].image,'https://example.com/coins.png');
 assert.deepEqual(groups[1].products.map(p=>p.id),[3]);
 assert.equal(products.length,4);
});
test('a coins-only catalog does not put Booster in Coins',()=>{
 const groups=groupStoreProducts([{id:3,name:'Coins',category:{id:2,name:'Coins'}}],booster);
 assert.deepEqual(groups.map(g=>g.name),['Coins','Discord']);
});
test('live coin quantities and bonus amounts are preserved through localization',()=>{
 const calls=[];
 const lines=localizedDescription('🪙 100,000 Coins – Zo7al Network\n• +20% Bonus (20,000 Coins)\nTotal Received: 120,000 Coins.\nA new creator edit', (key,values)=>{calls.push([key,values]);return key;});
 assert.deepEqual(calls,[['coinsHeading',{count:'100,000'}],['coinsBonus',{bonus:'20',count:'20,000'}],['coinsReceived',{count:'120,000'}]]);
 assert.equal(lines[1],'• coinsBonus');
 assert.equal(lines.at(-1),'A new creator edit');
});
