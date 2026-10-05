import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { ADMIN_COOKIE, signAdminSession } from '../src/lib/server/site-security.ts';
const stub = s => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
function moduleUrl(path, replacements = {}) {
 let s = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
 for (const [name, value] of Object.entries(replacements).sort(([a], [b]) => b.length - a.length)) s = s.replaceAll(name, value);
 return stub(ts.transpileModule(s, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const data = moduleUrl('src/lib/data/dashboard.ts'), management = moduleUrl('src/lib/data/pelican-management.ts'), pelicanData = moduleUrl('src/lib/data/pelican.ts', { './dashboard': data });
const state = { calls: [], direct: [], admin: [], failure: '', connection: true, limits: true };
globalThis.__fleetTests = state;
const service = stub(`export async function pelicanRequest(connection,path,body,options={}) {
 const s=globalThis.__fleetTests;s.calls.push({connection,path,options});
 if(path==='/resources'){if(connection.account===s.failure)throw Error('node unavailable');return {attributes:{current_state:'running',resources:{cpu_absolute:0,memory_bytes:512,uptime:60000}}};}
 const data=options.query?.type==='admin-all'?s.admin:s.direct;return {data,meta:{pagination:{total:data.length,total_pages:1}}};
}`);
const fleetModule = moduleUrl('src/lib/server/pelican-fleet.ts', { '../data/dashboard': data, '../data/pelican-management': management, '../data/pelican': pelicanData, './pelican': service });
const fleet = await import(fleetModule);
const connection = { provider: 'pelican', account: '', panelUrl: 'https://panel.example.com', apiKey: 'k'.repeat(32) };
const security = moduleUrl('src/lib/server/site-security.ts');
const fleetRoute = await import(moduleUrl('src/app/api/admin/pelican/fleet/route.ts', { '@/lib/server/site-security': security, '@/lib/server/dashboard-connections': stub('export async function readConnections(){return globalThis.__fleetTests.connection?{pelican:' + JSON.stringify(connection) + '}:{};}'), '@/lib/server/pelican-fleet': fleetModule, '@/lib/server/site-content': stub('export async function limitAttempt(){return globalThis.__fleetTests.limits;}') }));
const row = (n, owned = true) => ({ attributes: { uuid: '12345678-1234-1234-1234-' + String(n).padStart(12, '0'), name: 'Server ' + n, server_owner: owned, limits: { cpu: 100, memory: 1024, disk: 2048 }, allocations: { secret: 'never return' }, description: 'Minecraft', node: 'Node A' } });
const secret = 's'.repeat(43), hash = 'scrypt:' + 'a'.repeat(32) + ':' + 'b'.repeat(128), env = { ZO7AL_ADMIN_PASSWORD_HASH: process.env.ZO7AL_ADMIN_PASSWORD_HASH, ZO7AL_ADMIN_SESSION_SECRET: process.env.ZO7AL_ADMIN_SESSION_SECRET };
process.env.ZO7AL_ADMIN_PASSWORD_HASH = hash; process.env.ZO7AL_ADMIN_SESSION_SECRET = secret;
test.after(() => { for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v; delete globalThis.__fleetTests; });
test('fleet auto-discovers added servers without a configured UUID and isolates failed nodes', async () => {
 state.calls = []; state.direct = [row(1)]; state.admin = [];
 const first = await fleet.pelicanFleet(connection, 1, '', 'all'); assert.equal(first.servers.length, 1); assert.equal(first.servers[0].stats.cpu, 0);
 state.direct.push(row(2)); state.failure = row(2).attributes.uuid;
 const next = await fleet.pelicanFleet(connection, 1, 'Lobby', 'all'); assert.equal(next.servers.length, 2); assert.equal(next.servers[1].stats, null); assert.equal(next.servers[0].stats.state, 'running');
 assert.equal(state.calls.find(call => call.options.query?.['filter[name]'])?.options.query['filter[name]'], 'Lobby');
 assert.doesNotMatch(JSON.stringify(next), /apiKey|allocations|never return/);
});
test('root keys use the full panel list and non-root keys retain their directly accessible servers', async () => {
 state.direct = [row(1)]; state.admin = [row(1), row(3, false)]; state.failure = '';
 assert.equal((await fleet.pelicanFleet(connection, 1, '', 'all')).servers.length, 2);
 assert.deepEqual((await fleet.pelicanFleet(connection, 1, '', 'other')).servers.map(v => v.name), ['Server 3']);
 state.admin = []; assert.equal((await fleet.pelicanFleet(connection, 1, '', 'all')).servers.length, 1);
});
test('fleet route authenticates and validates before contacting Pelican', async () => {
 state.calls = []; const url = 'https://zo7al.test/api/admin/pelican/fleet', headers = { cookie: ADMIN_COOKIE + '=' + signAdminSession(secret, hash) };
 assert.equal((await fleetRoute.GET(new Request(url))).status, 401);
 for (const query of ['?page=0', '?scope=invalid', '?search=%00']) assert.equal((await fleetRoute.GET(new Request(url + query, { headers }))).status, 400);
 assert.equal(state.calls.length, 0);
 state.connection = false; assert.equal((await (await fleetRoute.GET(new Request(url, { headers }))).json()).status, 'setup'); state.connection = true;
 state.limits = false; assert.equal((await fleetRoute.GET(new Request(url, { headers }))).status, 429); state.limits = true;
});
const platform = await import(moduleUrl('src/lib/server/dashboard-platforms.ts', {
 './youtube-auth': stub('export async function youtubeAuth(){throw Error("YT_SETUP");}'), '../data/dashboard': data, '../data/minecraft': stub('export const MINECRAFT_SERVER={javaAddress:"example.com"};'), '../data/fortnite': stub('export const FORTNITE_MAPS=[{code:"1234-1234-1234",title:"One"},{code:"5678-5678-5678",title:"Two"}];'), '../data/curseforge': stub('export const CURSEFORGE_PROJECTS=[];'), '../data/modrinth': stub('export const MODRINTH_API_URL="https://api.modrinth.com/test";')
}));
test('Fortnite daily requests avoid invalid filters and privacy-hidden data remains a connected API', async () => {
 const original = globalThis.fetch, calls = []; try {
  globalThis.fetch = async url => { calls.push(String(url)); return Response.json({ plays: [{ value: null }], minutesPlayed: [], peakCCU: [] }); };
  const result = await platform.fetchPlatform('fortnite'); assert.equal(result.status, 'connected'); assert.equal(result.metrics.plays, null); assert.equal(result.coverage.available, 0);
  for (const raw of calls) { const url = new URL(raw); assert.equal(url.search, ''); assert.match(url.pathname, /\/islands\/\d{4}-\d{4}-\d{4}\/metrics\/day$/); }
 } finally { globalThis.fetch = original; }
});
test('Fortnite real zeroes stay zero, malformed/error responses do not report a healthy connection', async () => {
 const original = globalThis.fetch; try {
  globalThis.fetch = async () => Response.json({ plays: [{ value: 0, timestamp: "2026-10-01T00:00:00Z" }], minutesPlayed: [{ value: 0, timestamp: "2026-10-01T00:00:00Z" }], peakCCU: [{ value: 0, timestamp: "2026-10-01T00:00:00Z" }] });
  let result = await platform.fetchPlatform('fortnite'); assert.equal(result.metrics.plays, 0); assert.equal(result.coverage.available, 2);
  globalThis.fetch = async () => Response.json({ error: 'bad gateway' }); result = await platform.fetchPlatform('fortnite'); assert.equal(result.status, 'unavailable'); assert.equal(result.metrics.plays, null);
  globalThis.fetch = async () => new Response('offline', { status: 503 }); result = await platform.fetchPlatform('fortnite'); assert.equal(result.status, 'unavailable');
 } finally { globalThis.fetch = original; }
});
