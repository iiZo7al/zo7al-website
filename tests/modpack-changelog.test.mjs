import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function moduleUrl(path, replacements = {}) {
  let source = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  return 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
}
const stub = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const helper = moduleUrl('src/lib/data/modpack-changelog.ts', { './modpack-details': new URL('../src/lib/data/modpack-details.ts', import.meta.url).href });
const { changelogText, curseForgeFileUrls, parseCurseForgeFilePage, parseCurseForgeFiles, parseModrinthReleases } = await import(helper);
const cfUrl = 'https://www.curseforge.com/minecraft/modpacks/zo7al-pack';
const cfProject = { id: 'zo7al-pack', title: 'Zo7al Pack', iconUrl: '', url: cfUrl, releases: [{ url: cfUrl + '/files/99' }] };
const page = (title, date, body) => `<h2 class="file-details-card-title">${title}</h2><dl><dt>Uploaded</dt><dd><span>${date}</span></dd></dl><section class="file-details-changelog"><h3>What's new</h3><div class="changelog">${body}</div></section>`;
const state = { key: undefined, calls: [], pages: new Map(), pageCalls: [], fetch: null };
globalThis.__zo7alChangelogs = state;
const service = await import(moduleUrl('src/lib/server/modpack-changelogs.ts', {
  '../data/modrinth': stub('export const MODRINTH_API_URL="https://api.modrinth.com/v2/user/iiZo7al/projects"; export const MODRINTH_FALLBACK=[{slug:"zo7al-pack",title:"Zo7al Pack",projectType:"modpack",iconUrl:null,url:"https://modrinth.com/modpack/zo7al-pack"}];'),
  '../data/modpack-changelog': helper,
  '../sync/curseforge': stub('export async function getSyncedCurseForgeProjects(){return {items:' + JSON.stringify([cfProject]) + ',source:"live"};}'),
  '../sync/next-data': stub('export async function fetchExternal(url){const s=globalThis.__zo7alChangelogs;s.pageCalls.push(url);if(!s.pages.has(url))throw Error("UPSTREAM");return s.pages.get(url);}'),
  './dashboard-connections': stub('export async function readConnections(){return {curseforge:globalThis.__zo7alChangelogs.key?{apiKey:globalThis.__zo7alChangelogs.key}:undefined};}'),
}));
const originalFetch = globalThis.fetch, saved = { DATABASE_URL: process.env.DATABASE_URL, CURSEFORGE_API_KEY: process.env.CURSEFORGE_API_KEY };
test.beforeEach(() => {
  state.key = undefined; state.calls = []; state.pages = new Map(); state.pageCalls = [];
  process.env.DATABASE_URL = 'test-database-connection'; delete process.env.CURSEFORGE_API_KEY;
  state.fetch = async () => { throw Error('UPSTREAM'); };
  globalThis.fetch = async (url, options) => { state.calls.push({ url, options }); return state.fetch(url, options); };
});
test.after(() => { globalThis.fetch = originalFetch; delete globalThis.__zo7alChangelogs; for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });

test('Modrinth changelogs preserve source versions and dates, exclude unpublished versions, and order newest first', () => {
  const version = { id: 'older', name: 'Release', version_number: '1.0.0', date_published: '2026-07-01', status: 'listed', changelog: '# Added\n- **Better FPS**' };
  const releases = parseModrinthReleases([version, { ...version, id: 'newer', version_number: '2.0.0', date_published: '2026-08-01' }, { ...version, id: 'draft', status: 'draft' }, { ...version, id: 'unsafe/id' }, { ...version, id: 'invalid', date_published: 'invalid' }], 'zo7al-pack');
  assert.equal(releases.length, 2); assert.equal(releases[0].version, '2.0.0');
  assert.equal(releases[0].published, '2026-08-01T00:00:00.000Z');
  assert.equal(releases[0].url, 'https://modrinth.com/modpack/zo7al-pack/version/newer');
  assert.equal(releases[0].changelog, 'Added\n- Better FPS');
  assert.throws(() => parseModrinthReleases({}, 'zo7al-pack'), /UPSTREAM/);
});
test('CurseForge file metadata must belong to the requested project and contain real publication dates', () => {
  const file = { id: 10, modId: 123, displayName: '0.5.0 (Beta)', fileDate: '2026-07-01', releaseType: 2, fileLength: 1234 };
  const files = parseCurseForgeFiles({ data: [file, { ...file, id: 11, fileDate: '2026-08-01' }, { ...file, id: 12, modId: 999 }, { ...file, id: 13, isAvailable: false }, { ...file, id: 14, fileDate: 'invalid' }] }, cfUrl, 123);
  assert.equal(files.length, 2); assert.equal(files[0].url, cfUrl + '/files/11');
  assert.equal(files[0].version, '0.5.0 (Beta)'); assert.equal(files[0].type, 'beta'); assert.equal(files[0].size, 1234);
});
test('public CurseForge file notes retain multilingual text without scripts or unrelated page content', () => {
  const file = parseCurseForgeFilePage(page('0.5.0 &#x28;Beta&#x29;', 'Jul 13, 2026', '<h2>Updates</h2><p>تحسين الأداء &amp; FPS</p><script>unsafe()</script><p>- Better controls</p>'), cfUrl + '/files/10');
  assert.equal(file.version, '0.5.0 (Beta)'); assert.equal(file.published, '2026-07-13T00:00:00.000Z');
  assert.equal(file.changelog, 'Updates\nتحسين الأداء & FPS\n- Better controls');
  assert.doesNotMatch(file.changelog, /unsafe|What's new|<|>/);
  assert.equal(parseCurseForgeFilePage('<h2>Security challenge</h2>', cfUrl), null);
  assert.equal(parseCurseForgeFilePage(page('Test', 'not a date', '<p>Note</p>'), cfUrl), null);
  assert.equal(changelogText('&#0; &#x110000; &#xD800; &#x41;'), '&#0; &#x110000; &#xD800; A');
});
test('CurseForge public discovery follows only files on this exact project and host', () => {
  const html = '<a href="/minecraft/modpacks/zo7al-pack/files/10">A</a><a href="' + cfUrl + '/files/11?tab=changes">B</a><a href="https://evil.test/minecraft/modpacks/zo7al-pack/files/12">X</a><a href="/minecraft/modpacks/other/files/13">X</a><a href="' + cfUrl + '/files/10">Duplicate</a><a href="' + cfUrl + '/files/../settings">X</a>';
  assert.deepEqual(curseForgeFileUrls(html, cfUrl), [cfUrl + '/files/11', cfUrl + '/files/10']);
});

function apiResponse(url) {
  if (url.includes('/user/iiZo7al/projects')) return Response.json([{ slug: 'zo7al-pack', title: 'Zo7al Pack', project_type: 'modpack' }, { slug: 'network', title: 'Network', project_type: 'server' }]);
  if (url.includes('/project/zo7al-pack/version')) return Response.json([{ id: 'abcd1234', name: 'Release', version_number: '1.0.0', date_published: '2026-07-01', changelog: 'New controls' }]);
  if (url.includes('/mods/search')) return Response.json({ data: [{ id: 123, slug: 'other', gameId: 432 }, { id: 456, slug: 'zo7al-pack', gameId: 432 }] });
  if (url.includes('/mods/456/files?pageSize')) return Response.json({ data: [{ id: 10, modId: 456, displayName: '0.5.0', fileDate: '2026-07-13', isAvailable: true }] });
  if (url.endsWith('/mods/456/files/10/changelog')) return Response.json({ data: '<p>Improved FPS</p>' });
  throw Error('UNEXPECTED_URL');
}
test('the full feed uses both official APIs and an existing saved CurseForge connection without exposing its key', async () => {
  state.key = 'test-not-a-real-curseforge-key'; state.fetch = async url => apiResponse(url);
  const data = await service.getModpackChangelogs();
  assert.deepEqual(data.sources, [{ source: 'Modrinth', status: 'live' }, { source: 'CurseForge', status: 'live' }]);
  assert.equal(data.projects.length, 2);
  assert.equal(data.projects.find(project => project.source === 'CurseForge').releases[0].changelog, 'Improved FPS');
  assert.doesNotMatch(JSON.stringify(data), /test-not-a-real|apiKey/);
  for (const { url, options } of state.calls) {
    assert.equal(options.redirect, 'error'); assert.equal(options.next.revalidate, 600); assert.ok(options.signal);
    assert.equal(url.includes(state.key), false);
    assert.equal(options.headers['x-api-key'], url.startsWith('https://api.curseforge.com/') ? state.key : undefined);
  }
});
test('public CurseForge pages supply current changelogs when no API key is configured, independently of Modrinth outages', async () => {
  const listing = cfUrl + '/files/all?page=1&pageSize=20&showAlphaFiles=show';
  state.pages.set(listing, '<a href="' + cfUrl + '/files/123">Current file</a>');
  state.pages.set(cfUrl + '/files/123', page('New version', 'Oct 7, 2026', '<p>Public source updates</p>'));
  const data = await service.getModpackChangelogs();
  assert.equal(data.sources.find(source => source.source === 'Modrinth').status, 'unavailable');
  assert.equal(data.sources.find(source => source.source === 'CurseForge').status, 'live');
  assert.equal(data.projects.find(project => project.source === 'CurseForge').releases[0].url, cfUrl + '/files/123');
  assert.equal(state.pageCalls.includes(cfUrl + '/files/99'), false);
});
test('a failed CurseForge changelog refresh falls back to its official public file page', async () => {
  state.key = 'test-not-a-real-key'; state.fetch = async url => url.endsWith('/changelog') ? new Response('', { status: 403 }) : apiResponse(url);
  state.pages.set(cfUrl + '/files/10', page('0.5.0', 'Jul 13, 2026', '<p>Public API fallback</p>'));
  const data = await service.getModpackChangelogs('curseforge:zo7al-pack');
  assert.equal(data.sources[0].status, 'live'); assert.equal(data.projects[0].releases[0].changelog, 'Public API fallback');
  assert.equal(state.calls.some(call => call.url.includes('modrinth.com')), false);
  state.pages.clear();
  const partial = await service.getModpackChangelogs('curseforge:zo7al-pack');
  assert.equal(partial.sources[0].status, 'partial'); assert.equal(partial.projects[0].releases.length, 1);
  assert.equal(partial.projects[0].releases[0].changelog, undefined);
});
test('project-specific requests cannot fetch other creators, arbitrary URLs, or the other platform', async () => {
  state.fetch = async url => apiResponse(url);
  const data = await service.getModpackChangelogs('modrinth:zo7al-pack');
  assert.equal(data.projects.length, 1); assert.equal(data.projects[0].releases[0].changelog, 'New controls');
  assert.equal(state.pageCalls.length, 0); assert.equal(state.calls.some(call => call.url.includes('curseforge.com')), false);
  state.calls = [];
  const unknown = await service.getModpackChangelogs('modrinth:another-creator');
  assert.deepEqual(unknown.projects, []); assert.equal(state.calls.some(call => call.url.includes('/project/another-creator/')), false);
});
test('blocked public pages are marked unavailable instead of claiming an empty live changelog', async () => {
  state.pages.set(cfUrl + '/files/all?page=1&pageSize=20&showAlphaFiles=show', '<h1>Security challenge</h1>');
  const data = await service.getModpackChangelogs('curseforge:zo7al-pack');
  assert.equal(data.sources[0].status, 'unavailable'); assert.deepEqual(data.projects[0].releases, []);
});
test('the public route rejects invalid project keys and caches only complete responses', async () => {
  const stateUrl = stub('export async function getModpackChangelogs(key){return {projects:[],sources:[{source:"Modrinth",status:key?"partial":"live"}]};}');
  const { GET } = await import(moduleUrl('src/app/api/modpacks/changelog/route.ts', { '@/lib/server/modpack-changelogs': stateUrl }));
  for (const key of ['https://evil.test', 'modrinth:../other', 'curseforge:', 'other:project']) assert.equal((await GET(new Request('https://zo7al.test/api/modpacks/changelog?project=' + encodeURIComponent(key)))).status, 400);
  const complete = await GET(new Request('https://zo7al.test/api/modpacks/changelog'));
  assert.match(complete.headers.get('cache-control'), /s-maxage=300/);
  const partial = await GET(new Request('https://zo7al.test/api/modpacks/changelog?project=modrinth:zo7al-pack'));
  assert.equal(partial.headers.get('cache-control'), 'no-store');
});
