import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCreatorIslands, parseIslandDetails, safeMediaUrl, fortniteLocale } from '../src/lib/sync/fortnite-parser.ts';

test('creator cards preserve localized names, emoji, entities and both link formats', () => {
  const cards = parseCreatorIslands(`<a href="/@zo7al/4904-5829-1966?lang=ar"><img alt="ALL WEAPONS زحل 🚀 &amp; ✨" src="https://cdn.example/map.jpg"></a><a href="/creative/island-codes/4904-5829-1966">duplicate</a><a href="/@someone/1111-1111-1111">unrelated</a>`);
  assert.deepEqual(cards, [{code:'4904-5829-1966',title:'ALL WEAPONS زحل 🚀 & ✨',thumbnail:'https://cdn.example/map.jpg'}]);
});
test('details preserve source copy, tags and a real source video URL', () => {
  const details = parseIslandDetails(`<meta property="og:url" content="https://www.fortnite.com/@zo7al/4904-5829-1966"><h1>خريطة 🚀</h1><pre>First line\nSecond &amp; third</pre><div><span>gun game</span><span>free for all</span><span>attack</span><span>competitive</span></div><button>4904-5829-1966</button><video><source src="https://cdn.example/trailer.mp4?x=1&amp;y=2"></video>`, '4904-5829-1966');
  assert.equal(details.title,'خريطة 🚀');
  assert.equal(details.description,'First line\nSecond & third');
  assert.deepEqual(details.tags,['gun game','free for all','attack','competitive']);
  assert.equal(details.videoUrl,'https://cdn.example/trailer.mp4?x=1&y=2');
});
test('JSON metadata is scoped to the island, not another recommended map', () => {
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({pageProps:{linkData:{mnemonic:'4904-5829-1966',metadata:{title:'Exact source title',description:'Source description',tags:['training'],video:{url:'https://cdn.example/own.mp4'}}},recommendation:{mnemonic:'1111-1111-1111',metadata:{title:'Other',video:{url:'https://cdn.example/wrong.mp4'}}}}})}</script>`;
  const details = parseIslandDetails(html,'4904-5829-1966');
  assert.equal(details.title,'Exact source title');
  assert.equal(details.videoUrl,'https://cdn.example/own.mp4');
  assert.deepEqual(details.tags,['training']);
});
test('challenge pages, other islands and unsafe media never become map details', () => {
  assert.equal(parseIslandDetails('<h1>Verify you are human</h1>','4904-5829-1966'),null);
  assert.equal(parseIslandDetails('<meta property="og:url" content="https://www.fortnite.com/@zo7al/1111-1111-1111"><h1>Other</h1>','4904-5829-1966'),null);
  assert.equal(safeMediaUrl('javascript:alert(1)'),undefined);
  assert.equal(safeMediaUrl('data:video/mp4;base64,123'),undefined);
  assert.equal(parseIslandDetails('<meta property="og:title" content="Island 4904-5829-1966"><h1>Island</h1>','4904-5829-1966').videoUrl,undefined);
});
test('source locale is explicit and never interpolates arbitrary input', () => {
  assert.equal(fortniteLocale('en'),'en-US'); assert.equal(fortniteLocale('ar'),'ar');
  assert.equal(fortniteLocale('pt'),'pt-BR'); assert.equal(fortniteLocale('bad&lang=evil'),'en-US');
});
