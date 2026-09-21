import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function moduleUrl(path, replacements = {}) {
  let source = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
  for (const [name, replacement] of Object.entries(replacements)) source = source.replaceAll(name, replacement);
  return 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
}
const data = moduleUrl('src/lib/data/store.ts');
const backend = moduleUrl('src/lib/server/tebex.ts', {'@/lib/data/store': data});
const {getStoreCatalog} = await import(backend);
const {POST} = await import(moduleUrl('src/app/api/store/checkout/route.ts', {'@/lib/server/tebex': backend}));
const request = (body, origin = 'https://zo7al.test', ip = '203.0.113.5') => new Request('https://zo7al.test/api/store/checkout', {method:'POST', headers:{origin,'x-forwarded-for':ip},body:JSON.stringify(body)});

test('checkout validates catalog, preserves Tebex prices and fails closed', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.TEBEX_PUBLIC_TOKEN;
  const calls = [];
  try {
    delete process.env.TEBEX_PUBLIC_TOKEN;
    assert.equal((await getStoreCatalog()).live, false);
    assert.equal((await POST(request({packageId:7312779,username:'Player'}))).status, 503);
    process.env.TEBEX_PUBLIC_TOKEN = 'test-public-token';
    globalThis.fetch = async (url, options) => {
      calls.push({url,body:options.body && JSON.parse(options.body)});
      if (url.endsWith('categories?includePackages=1')) return Response.json({data:[{packages:[{id:7312779,name:'VIP',total_price:14.25,currency:'EUR'},{id:9,name:'Custom',variables:[{}]}]},{dynamic:true,packages:[{id:10,name:'Dynamic'}]}]});
      if (url.endsWith('/accounts/test-public-token/baskets')) return Response.json({data:{ident:'basket_123'}});
      if (url.endsWith('/baskets/basket_123/packages')) return Response.json({data:{ident:'basket_123'}});
      throw Error('Unexpected upstream request ' + url);
    };
    const catalog = await getStoreCatalog();
    assert.equal(catalog.products[0].price,14.25);
    assert.equal(catalog.products[0].currency,'EUR');
    assert.equal(catalog.products[1].available,false);
    assert.equal(catalog.products[2].available,false);
    assert.equal((await POST(request({packageId:7312779,username:'Player'}, 'https://other.test'))).status,403);
    assert.equal((await POST(request({packageId:7312779,username:'<script>'}))).status,400);
    assert.equal((await POST(request({packageId:999,username:'Player'}))).status,400);
    assert.equal((await POST(request({packageId:9,username:'Player'}))).status,400);
    const result = await POST(request({packageId:7312779,username:' Player ',price:0,quantity:100}));
    assert.equal(result.status,200);
    assert.deepEqual(await result.json(),{ident:'basket_123'});
    assert.equal(result.headers.get('cache-control'),'no-store');
    const basket = calls.find(call=>call.url.endsWith('/accounts/test-public-token/baskets'));
    assert.equal(basket.body.username,'Player');
    assert.equal(basket.body.ip_address,'203.0.113.5');
    assert.equal(basket.body.complete_url,'https://zo7al.test/store');
    assert.deepEqual(calls.at(-1).body,{package_id:'7312779',quantity:1});
    globalThis.fetch = async()=>{throw Error('upstream offline');};
    assert.equal((await POST(request({packageId:7312779,username:'Player'}))).status,503);
    assert.equal((await getStoreCatalog()).live,false);
    for(let i=0;i<8;i++) await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.9'));
    assert.equal((await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.9'))).status,429);
  } finally { globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.TEBEX_PUBLIC_TOKEN; else process.env.TEBEX_PUBLIC_TOKEN=originalToken; }
});
