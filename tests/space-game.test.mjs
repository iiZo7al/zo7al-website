import assert from 'node:assert/strict';
import test from 'node:test';
import { sweptHit } from '../src/components/home/space-game-rules.ts';

test('fast objects crossing the rocket collide even when both endpoints miss', () => {
  assert.equal(sweptHit({x:0,y:0,z:-4}, {x:0,y:0,z:4}, 1), true);
  assert.equal(sweptHit({x:2,y:0,z:-4}, {x:2,y:0,z:4}, 1), false);
  assert.equal(sweptHit({x:0,y:0,z:0}, {x:0,y:0,z:0}, 1), true);
  assert.equal(sweptHit({x:0,y:0,z:3}, {x:0,y:0,z:4}, 1), false);
});

test('relative-motion collision includes a rocket crossing sideways', () => {
  assert.equal(sweptHit({x:-3,y:0,z:-2}, {x:3,y:0,z:2}, 0.5), true);
  assert.equal(sweptHit({x:-3,y:2,z:-2}, {x:3,y:2,z:2}, 0.5), false);
});

import { validResult, plausibleResult } from '../src/lib/server/space-validation.ts';
const result = { id:'12345678-1234-1234-1234-123456789abc', token:'a'.repeat(64), name:'زحل', score:1000, stars:1 };
test('global results validate names, integers and run credentials', () => {
  assert.equal(validResult(result),true);
  for (const change of [{score:-1},{score:NaN},{score:1.5},{stars:7000},{name:' '},{name:'x'.repeat(21)},{token:'bad'},{id:'-'.repeat(36)}]) assert.equal(validResult({...result,...change}),false);
});
test('server time bounds reject impossible or expired submissions', () => {
  assert.equal(plausibleResult(1000,1,10),true);
  assert.equal(plausibleResult(999999,1,10),false);
  assert.equal(plausibleResult(1000,100,10),false);
  assert.equal(plausibleResult(1000,1,7201),false);
});

import { readFileSync } from 'node:fs';
const locales=['en','ar','de','es','fr','ja','ko','pt','tr','zh'];
const catalogs=locales.map(locale=>JSON.parse(readFileSync(new URL(`../messages/${locale}.json`,import.meta.url),'utf8')));
test('all ten languages contain every game and site UI message with matching placeholders',()=>{
  for(const namespace of ['game','ui']) {
    const english=catalogs[0][namespace];
    for(const catalog of catalogs) {
      assert.deepEqual(Object.keys(catalog[namespace]).sort(),Object.keys(english).sort());
      for(const key of Object.keys(english)) {
        assert.equal(typeof catalog[namespace][key],'string');
        assert.ok(catalog[namespace][key].trim());
        assert.deepEqual((catalog[namespace][key].match(/\{\w+\}/g)||[]).sort(),(english[key].match(/\{\w+\}/g)||[]).sort());
      }
    }
  }
});
