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
 const privateTerms=/dashboard|داش\s*بورد|لوحة\s*ال?تحكم|tableau de bord|panel de control|painel de contro(?:le|lo)|ダッシュボード|대시보드|控制面板|仪表板/i;
 assert.ok(!base.includes('dashboard-access'));assert.ok(base.includes('project-updates'));
 for(const faq of Object.values(catalogs)){
  assert.equal(faq.items.length,49);assert.equal(new Set(faq.items.map(item=>item.id )).size,49);
  assert.deepEqual(faq.items.map(item=>item.id),base);
  assert.deepEqual(Object.keys(faq.categories),Object.keys(catalogs.en.categories));
  assert.ok(faq.clearSearch&&faq.filterLabel&&faq.resetFilters);
  for(const item of faq.items){
   assert.ok(item.q&&item.a&&faq.categories[item.category]);
   assert.ok(!privateTerms.test(JSON.stringify(item)),item.id+" contains administrator content");
   if(item.href){assert.equal(faqActionHref(item.href),item.href);assert.ok(item.action);assert.ok(['/','/minecraft','/store','/socials','/support','/requests','/modpacks','/account'].includes(new URL(item.href,'https://zo7al.test').pathname));}
  }
 }
 assert.ok(catalogs.ar.items.find(item=>item.id==='requests').a.includes('بحسابك'));
 for(const id of ['account-login','public-profile','minecraft-link','two-factor','passkeys','backup-codes','discord-account-conflict','minecraft-bans','delete-account','account-password','owned-ranks','subscriptions','switch-account','unlink-account'])assert.ok(base.includes(id));
 for(const faq of Object.values(catalogs))assert.ok(!faq.items.some(item=>item.href?.includes('community-polls')));
 assert.ok(catalogs.en.items.find(item=>item.id==='notifications').a.includes('Clearing site cookies'));
 assert.match(catalogs.en.items.find(item=>item.id==='account-password').a,/Security/);
 assert.match(catalogs.en.items.find(item=>item.id==='backup-codes').a,/ten backup codes/);
 assert.match(catalogs.en.items.find(item=>item.id==='leaderboard').a,/top five/);
});
test('FAQ actions reject external, protocol-relative and executable destinations',()=>{
 for(const url of ['https://example.test','//example.test','javascript:alert(1)','/\\example.test','/support\n','/support onclick=alert(1)',null])assert.equal(faqActionHref(url),null);
 assert.equal(faqActionHref('/support?tab=report'),'/support?tab=report');
});
