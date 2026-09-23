import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localizedDescription, descriptionLines} from '../src/lib/data/store-localization.ts';
import {storeDescriptionText} from '../src/lib/server/store-description.ts';

const locales=['en','ar','es','fr','de','pt','tr','ja','ko','zh'];
const messages=Object.fromEntries(locales.map(locale=>[locale,JSON.parse(readFileSync(new URL(`../messages/${locale}.json`,import.meta.url),'utf8'))]));
const translator=locale=>(key,values={})=>{
 const text=messages[locale].storeDescription[key];
 assert.equal(typeof text,'string',`${locale}.${key}`);
 return text.replace(/\{(\w+)\}/g,(_,name)=>{assert.ok(name in values);return values[name]});
};

test('Tebex nested paragraph bullets remain checkable features',()=>{
 const text=storeDescriptionText('<h3>🎮 In-Game Benefits:</h3><ul><li><p>Access to /fly</p></li><li><p>10 sethomes (/sethome)</p></li></ul>');
 assert.deepEqual(descriptionLines(text),['🎮 In-Game Benefits:','• Access to /fly','• 10 sethomes (/sethome)']);
 assert.deepEqual(descriptionLines('•\n\nAccess to /fly\n•\n\n10 sethomes (/sethome)'),['• Access to /fly','• 10 sethomes (/sethome)']);
});

test('translations retain current commands, rank names, bullet count and numeric limits in all ten languages',()=>{
 const text='MVP++ Rank – Zo7al Network\n•\nExclusive chat prefix: [MVP++]\n•\nAccess to command: /kit mvp++\n•\n10 sethomes (/sethome)\nRank Duration: 1 Month (30 Days).\nPayment Type: Monthly recurring subscription.';
 for(const locale of locales){
  const result=localizedDescription(text,translator(locale));
  assert.equal(result.filter(line=>line.startsWith('• ')).length,3);
  assert.ok(result[0].includes('MVP++'));
  assert.ok(result[2].includes('/kit mvp++'));
  assert.ok(result[3].includes('10')&&result[3].includes('/sethome'));
  assert.ok(result[4].includes('30'));
  assert.equal(result[5],messages[locale].storeDescription.recurring);
 }
});

test('new or edited upstream terms are not overwritten by stale translations',()=>{
 assert.deepEqual(localizedDescription('• Access to /newcommand\n• 25 sethomes (/sethome)\nA new restriction from Tebex.',translator('ar')),['• استخدام الأمر /newcommand','• عدد 25 هومات (/sethome)','A new restriction from Tebex.']);
});

test('all store descriptions and new UI messages exist in every locale with identical placeholders',()=>{
 const en=messages.en;
 for(const locale of locales){
  for(const ns of ['storeDescription','store','minecraft','modpacks']){
   assert.deepEqual(Object.keys(messages[locale][ns]).sort(),Object.keys(en[ns]).sort(),`${locale}.${ns}`);
   for(const [key,value] of Object.entries(en[ns])){
    assert.equal(typeof messages[locale][ns][key],'string');
    assert.deepEqual((messages[locale][ns][key].match(/\{\w+\}/g)||[]).sort(),(value.match(/\{\w+\}/g)||[]).sort(),`${locale}.${ns}.${key}`);
   }
  }
 }
});
