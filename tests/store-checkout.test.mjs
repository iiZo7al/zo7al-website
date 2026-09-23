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
const backend = moduleUrl('src/lib/server/tebex.ts', {'@/lib/data/store': data, './store-description': moduleUrl('src/lib/server/store-description.ts')});
const {getStoreCatalog, ownsStorePackage} = await import(backend);
const {POST} = await import(moduleUrl('src/app/api/store/checkout/route.ts', {'@/lib/server/tebex': backend}));
const {GET: paymentStatus} = await import(moduleUrl('src/app/api/store/status/route.ts', {'@/lib/server/tebex': backend}));
const request = (body, origin = 'https://zo7al.test', ip = '203.0.113.5') => new Request('https://zo7al.test/api/store/checkout', {method:'POST', headers:{origin,'x-forwarded-for':ip},body:JSON.stringify(body)});

test('checkout validates catalog, preserves Tebex prices and fails closed', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.TEBEX_PUBLIC_TOKEN, originalPrivateKey = process.env.TEBEX_PRIVATE_KEY, originalPluginSecret = process.env.TEBEX_PLUGIN_SECRET;
  delete process.env.TEBEX_PLUGIN_SECRET;
  const calls = [];
  try {
    delete process.env.TEBEX_PUBLIC_TOKEN;
    assert.equal((await getStoreCatalog()).live, false);
    assert.equal((await POST(request({packageId:7312779,username:'Player'}))).status, 503);
    process.env.TEBEX_PUBLIC_TOKEN = 'test-public-token';
    delete process.env.TEBEX_PRIVATE_KEY;
    const missingKey = await POST(request({packageId:7312779,username:'Player'}));
    assert.equal(missingKey.status,503);
    assert.deepEqual(await missingKey.json(),{error:'CONFIGURATION'});
    process.env.TEBEX_PRIVATE_KEY = 'test-private-key';
    globalThis.fetch = async (url, options) => {
      calls.push({url,headers:options.headers,body:options.body && JSON.parse(options.body)});
      if (url.endsWith('categories?includePackages=1')) return Response.json({data:[{packages:[{id:7312779,name:'VIP',total_price:14.25,currency:'EUR'},{id:9,name:'Custom',variables:[{}]}]},{dynamic:true,packages:[{id:10,name:'Dynamic'}]}]});
      if (url.endsWith('/accounts/test-public-token/baskets')) return Response.json({data:{ident:'basket_123',username_id:'player_uuid'}});
      if (url.endsWith('/baskets/basket_123/packages')) return Response.json({data:{ident:'basket_123',username_id:'player_uuid'}});
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
    assert.equal(basket.headers.Authorization, 'Basic ' + Buffer.from('test-public-token:test-private-key').toString('base64'));
    assert.ok(calls.filter(call=>call.url.endsWith('categories?includePackages=1')).every(call=>!call.headers.Authorization));
    assert.equal(basket.body.username,'Player');
    assert.equal(basket.body.ip_address,'203.0.113.5');
    assert.equal(basket.body.complete_url,'https://zo7al.test/store?checkout=complete');
    assert.deepEqual(calls.at(-1).body,{package_id:'7312779',quantity:1});
    const validFetch = globalThis.fetch;
    process.env.TEBEX_PLUGIN_SECRET = 'test-game-secret';
    globalThis.fetch = async (url,options) => {
      if (url.startsWith('https://plugin.tebex.io/')) {
        assert.equal(url,'https://plugin.tebex.io/player/player_uuid/packages?package=7312779');
        assert.equal(options.headers['X-Tebex-Secret'],'test-game-secret');
        return Response.json([{txn_id:'private',package:{id:7312779}}]);
      }
      return validFetch(url,options);
    };
    const beforeOwned = calls.filter(call=>call.url.endsWith('/packages')).length;
    const owned = await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.15'));
    assert.equal(owned.status,409);
    assert.deepEqual(await owned.json(),{error:'ALREADY_OWNED'});
    assert.equal(calls.filter(call=>call.url.endsWith('/packages')).length,beforeOwned);
    globalThis.fetch = async()=>Response.json([]);
    assert.equal(await ownsStorePackage('player_uuid',7312779),false);
    globalThis.fetch = async()=>new Response('unavailable',{status:503});
    assert.equal(await ownsStorePackage('player_uuid',7312779),null);
    delete process.env.TEBEX_PLUGIN_SECRET;
    assert.equal(await ownsStorePackage('player_uuid',7312779),null);

    globalThis.fetch = async (url,options) => url.endsWith('/accounts/test-public-token/baskets')
      ? new Response('private upstream response', {status:401}) : validFetch(url,options);
    const denied = await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.11'));
    assert.equal(denied.status,503);
    assert.deepEqual(await denied.json(),{error:'CONFIGURATION'});
    globalThis.fetch = async (url,options) => url.endsWith('/packages')
      ? Response.json({detail:"The product isn't purchasable",extra:'private upstream content'}, {status:400}) : validFetch(url,options);
    const restricted = await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.12'));
    assert.equal(restricted.status,409);
    assert.deepEqual(await restricted.json(),{error:'PURCHASE_RESTRICTED'});
    globalThis.fetch = async (url,options) => url.endsWith('/packages')
      ? Response.json({detail:'unrecognized private upstream error'}, {status:400}) : validFetch(url,options);
    const unknown = await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.13'));
    assert.equal(unknown.status,502);
    assert.deepEqual(await unknown.json(),{error:'UNAVAILABLE',diagnostic:'PACKAGE_400'});
    globalThis.fetch = async()=>{throw Error('upstream offline');};
    assert.equal((await POST(request({packageId:7312779,username:'Player'}))).status,503);
    assert.equal((await getStoreCatalog()).live,false);
    for(let i=0;i<8;i++) await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.9'));
    assert.equal((await POST(request({packageId:7312779,username:'Player'},undefined,'203.0.113.9'))).status,429);
  } finally { if(originalPluginSecret===undefined) delete process.env.TEBEX_PLUGIN_SECRET; else process.env.TEBEX_PLUGIN_SECRET=originalPluginSecret; globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.TEBEX_PUBLIC_TOKEN; else process.env.TEBEX_PUBLIC_TOKEN=originalToken; if(originalPrivateKey===undefined) delete process.env.TEBEX_PRIVATE_KEY; else process.env.TEBEX_PRIVATE_KEY=originalPrivateKey; }
});

test('catalog follows Tebex edits, order, images, additions and removals without a local rank list', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.TEBEX_PUBLIC_TOKEN;
  try {
    process.env.TEBEX_PUBLIC_TOKEN = 'test-public-token';
    globalThis.fetch = async()=>Response.json({data:[{order:1,packages:[
      {id:7312779,name:'VIP renamed',total_price:12.34,currency:'SAR',description:'<p>Updated benefits</p>',order:2,image:'https://dunb17ur4ymx4.cloudfront.net/vip.png'},
      {id:888,name:'New rank',total_price:0,currency:'USD',description:'New benefits',order:1,media:[{type:'image',primary:true,url:'https://dunb17ur4ymx4.cloudfront.net/new.png'}]},
      {id:889,name:'No price',order:3,image:'javascript:bad()'},
    ]}]});
    const result = await getStoreCatalog();
    assert.equal(result.live,true);
    assert.deepEqual(result.products.map(p=>p.id),[888,7312779,889]);
    assert.equal(result.products[0].price,0);
    assert.equal(result.products[0].image,'https://dunb17ur4ymx4.cloudfront.net/new.png');
    assert.equal(result.products[1].name,'VIP renamed');
    assert.equal(result.products[1].price,12.34);
    assert.equal(result.products[1].description,'Updated benefits');
    assert.equal(result.products[2].price,null);
    assert.equal(result.products[2].image,null);
    globalThis.fetch = async()=>Response.json({data:[]});
    assert.deepEqual(await getStoreCatalog(),{products:[],live:true});
  } finally { globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.TEBEX_PUBLIC_TOKEN; else process.env.TEBEX_PUBLIC_TOKEN=originalToken; }
});

test('success confirmation requires a completed matching basket from Tebex, never a return URL flag', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.TEBEX_PUBLIC_TOKEN;
  try {
    process.env.TEBEX_PUBLIC_TOKEN = 'test-public-token';
    const request = new Request('https://zo7al.test/api/store/status?ident=basket_123456&checkout=complete');
    globalThis.fetch = async()=>Response.json({data:{ident:'basket_123456',complete:false}});
    assert.deepEqual(await (await paymentStatus(request)).json(),{paid:false});
    globalThis.fetch = async()=>Response.json({data:{ident:'different_basket',complete:true}});
    assert.deepEqual(await (await paymentStatus(request)).json(),{paid:false});
    globalThis.fetch = async()=>Response.json({data:{ident:'basket_123456',complete:true,email:'private@example.com',username:'Private'}});
    const success = await paymentStatus(request);
    assert.equal(success.headers.get('cache-control'),'no-store');
    assert.deepEqual(await success.json(),{paid:true});
    assert.equal((await paymentStatus(new Request('https://zo7al.test/api/store/status?checkout=complete'))).status,400);
    globalThis.fetch = async()=>{throw Error('upstream offline');};
    assert.equal((await paymentStatus(request)).status,503);
  } finally { globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.TEBEX_PUBLIC_TOKEN; else process.env.TEBEX_PUBLIC_TOKEN=originalToken; }
});

test('Coins retain their category and can be bought again; lifetime ranks still require ownership checks', async () => {
  const savedFetch=globalThis.fetch;
  const saved=Object.fromEntries(['TEBEX_PUBLIC_TOKEN','TEBEX_PRIVATE_KEY','TEBEX_PLUGIN_SECRET'].map(k=>[k,process.env[k]]));
  try {
    process.env.TEBEX_PUBLIC_TOKEN='test-public-token'; process.env.TEBEX_PRIVATE_KEY='test-private-key'; process.env.TEBEX_PLUGIN_SECRET='test-plugin-secret';
    let added=0;
    globalThis.fetch=async(url)=>{
      if(url.endsWith('categories?includePackages=1'))return Response.json({data:[{id:2,name:'Coins',order:1,packages:[{id:88,name:'1,000 Coins',type:'single',user_limit:null,total_price:2.99,currency:'USD'}]},{id:1,name:'Ranks',order:0,packages:[{id:77,name:'VIP',type:'single',user_limit:{limit:1,period_length:null},total_price:9.99,currency:'USD'}]}]});
      if(url.includes('plugin.tebex.io')) throw Error('Consumables must not be blocked by past purchase ownership');
      if(url.endsWith('/baskets')) return Response.json({data:{ident:'coin_basket',username_id:'player_uuid'}});
      if(url.endsWith('/packages')) {added++;return Response.json({data:{}});}
      throw Error('Unexpected URL');
    };
    const catalog=await getStoreCatalog();
    assert.deepEqual(catalog.products.map(p=>p.category.name),['Ranks','Coins']);
    assert.equal(catalog.products[0].ownershipCheck,true);
    assert.equal(catalog.products[1].ownershipCheck,false);
    assert.equal(catalog.products[1].price,2.99);
    for(let i=0;i<2;i++) assert.equal((await POST(request({packageId:88,username:'Player'},undefined,'203.0.113.99'))).status,200);
    assert.equal(added,2);
  } finally { globalThis.fetch=savedFetch; for(const [key,value] of Object.entries(saved)) if(value===undefined) delete process.env[key]; else process.env[key]=value; }
});
