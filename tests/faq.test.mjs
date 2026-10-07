import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterFaqItems, faqActionHref, normalizeFaqSearch } from '../src/lib/data/faq.ts';

const locales=['en','ar','es','fr','de','pt','tr','ja','ko','zh'];
const catalogs=Object.fromEntries(locales.map(locale=>[locale,JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url))).faq]));
test('FAQ search finds Arabic diacritics, spelling variants, Latin accents and multiple terms',()=>{
 const items=[{category:'minecraft',q:'كيف أُعاينُ شخصيتي؟',a:'افتح العين في بطاقة الرتبة.'},{category:'community',q:'Où voir les événements ?',a:'Les événements sont sur Minecraft.'}];
 assert.equal(filterFaqItems(items,'اعاين شخصيتي').length,1);
 assert.equal(filterFaqItems(items,'اُعاين الرتبة').length,1);
 assert.equal(filterFaqItems(items,'evenements minecraft').length,1);
 assert.equal(filterFaqItems(items,'الرتبة','community').length,0);
 assert.equal(filterFaqItems(items,'غير موجود').length,0);
 assert.equal(normalizeFaqSearch('إِشْعَـار'),'اشعار');
});
test('all FAQs cover the same durable features and only use existing internal destinations',()=>{
 const base=catalogs.en.items.map(item=>item.id);
 for(const faq of Object.values(catalogs)){
  assert.equal(faq.items.length,35);assert.equal(new Set(faq.items.map(item=>item.id)).size,35);
  assert.deepEqual(faq.items.map(item=>item.id),base);
  assert.deepEqual(Object.keys(faq.categories),Object.keys(catalogs.en.categories));
  assert.ok(faq.clearSearch&&faq.filterLabel&&faq.resetFilters);
  for(const item of faq.items){
   assert.ok(item.q&&item.a&&faq.categories[item.category]);
   if(item.href){assert.equal(faqActionHref(item.href),item.href);assert.ok(item.action);assert.ok(['/','/minecraft','/store','/socials','/support','/requests','/modpacks'].includes(new URL(item.href,'https://zo7al.test').pathname));}
  }
 }
 assert.ok(catalogs.ar.items.find(item=>item.id==='requests').a.includes('رمز المتابعة'));
 assert.ok(catalogs.en.items.find(item=>item.id==='notifications').a.includes('Clearing site cookies'));
});
test('FAQ actions reject external, protocol-relative and executable destinations',()=>{
 for(const url of ['https://example.test','//example.test','javascript:alert(1)','/\\example.test','/support\n','/support onclick=alert(1)',null])assert.equal(faqActionHref(url),null);
 assert.equal(faqActionHref('/support?tab=report'),'/support?tab=report');
});
