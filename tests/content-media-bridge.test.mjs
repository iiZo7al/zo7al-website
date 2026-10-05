import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import { validateContent } from '../src/lib/data/hub-validation.ts';
import { validateProfileBatch, bridgeName } from '../src/lib/data/minecraft-bridge.ts';
import { CONTENT_IMAGE_UPLOAD_BYTES } from '../src/lib/data/content-media.ts';
import { ADMIN_COOKIE, signAdminSession, tokenHash } from '../src/lib/server/site-security.ts';

const stub = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
function moduleUrl(path, replacements = {}) {
  let source = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
  for (const [name, value] of Object.entries(replacements).sort(([a], [b]) => b.length - a.length)) source = source.replaceAll(name, value);
  return stub(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const id = 'a1234567-1234-1234-1234-123456789abc', playerId = 'b1234567-1234-1234-1234-123456789abc';
const secret = 's'.repeat(43), hash = 'scrypt:' + 'a'.repeat(32) + ':' + 'b'.repeat(128), key = 'k'.repeat(43);
const state = { queries: [], releases: 0, limits: true, fail: false, bridge: true, imageExists: true, published: true, profile: null };
const database = {
  async query(sql, args = []) {
    state.queries.push({ sql, args });
    if (state.fail) throw Error('database unavailable');
    if (sql.startsWith('SELECT id FROM minecraft_profile_bridges')) return { rows: state.bridge ? [{ id }] : [], rowCount: state.bridge ? 1 : 0 };
    if (sql.startsWith('INSERT INTO minecraft_profile_bridges')) return { rows: [{ id: args[0], name: args[1] }], rowCount: 1 };
    if (sql.startsWith('UPDATE minecraft_profile_bridges SET name=')) return { rows: state.bridge ? [{ id, name: args[1] }] : [], rowCount: state.bridge ? 1 : 0 };
    if (sql.startsWith('UPDATE minecraft_profile_bridges') && sql.includes('RETURNING')) return { rows: [{ id, name: 'Zo7al SMP' }], rowCount: 1 };
    if (sql.startsWith('SELECT b.id,b.name')) return { rows: [{ id, name: 'Zo7al SMP', enabled: true, players: 1, lastSync: null }], rowCount: 1 };
    if (sql.startsWith('SELECT p.uuid')) return { rows: Array.isArray(state.profile) ? state.profile : state.profile ? [state.profile] : [], rowCount: state.profile ? 1 : 0 };
    if (sql.startsWith('SELECT i.bytes')) return { rows: state.imageExists && (args[1] || state.published) ? [{ bytes: Buffer.from('test-webp'), width: 1600, height: 900 }] : [] };
    if (sql.startsWith('SELECT id FROM site_content_images')) return { rows: state.imageExists ? [{ id }] : [], rowCount: state.imageExists ? 1 : 0 };
    return { rows: [], rowCount: 1 };
  },
  async connect() { return { query: database.query, release: () => { state.releases++; } }; },
};
globalThis.__contentBridgeTests = { state, database };
const db = stub('export async function siteDatabase(){return globalThis.__contentBridgeTests.database;}');
const security = moduleUrl('src/lib/server/site-security.ts');
const mediaData = moduleUrl('src/lib/data/content-media.ts');
const bridgeData = moduleUrl('src/lib/data/minecraft-bridge.ts');
const parser = moduleUrl('src/lib/server/player-profile.ts');
const limits = stub('export async function limitAttempt(){return globalThis.__contentBridgeTests.state.limits;}');
const mediaModule = moduleUrl('src/lib/server/content-media.ts', { './site-db': db, '../data/content-media': mediaData, '"sharp"': JSON.stringify(import.meta.resolve('sharp')) });
const bridgeModule = moduleUrl('src/lib/server/minecraft-bridge.ts', { './site-db': db, './player-profile': parser });
const media = await import(mediaModule), bridge = await import(bridgeModule);
const replacements = { '@/lib/server/site-db': db, '@/lib/server/site-security': security, '@/lib/server/site-content': limits, '@/lib/data/content-media': mediaData, '@/lib/data/minecraft-bridge': bridgeData, '@/lib/server/content-media': mediaModule, '@/lib/server/minecraft-bridge': bridgeModule, '@/lib/server/player-profile': parser };
const upload = await import(moduleUrl('src/app/api/admin/hub/media/route.ts', replacements));
const mediaRoute = await import(moduleUrl('src/app/api/hub/media/[id]/route.ts', replacements));
const admin = await import(moduleUrl('src/app/api/admin/minecraft-bridge/route.ts', replacements));
const ingress = await import(moduleUrl('src/app/api/minecraft/bridge/route.ts', replacements));
const profileRoute = await import(moduleUrl('src/app/api/minecraft/profile/route.ts', replacements));
const content = await import(moduleUrl('src/lib/server/site-content.ts', { './site-db': db, './site-security': security, '../data/hub-validation': moduleUrl('src/lib/data/hub-validation.ts'), './discord-notifications': stub('export async function notifyDiscord(){}') }));
const envKeys = ['DATABASE_URL', 'ZO7AL_ADMIN_PASSWORD_HASH', 'ZO7AL_ADMIN_SESSION_SECRET', 'MINECRAFT_PROFILE_URL', 'MINECRAFT_PROFILE_TOKEN'];
const saved = Object.fromEntries(envKeys.map(k => [k, process.env[k]]));
process.env.DATABASE_URL = 'postgresql://dummy-test'; process.env.ZO7AL_ADMIN_PASSWORD_HASH = hash; process.env.ZO7AL_ADMIN_SESSION_SECRET = secret;
delete process.env.MINECRAFT_PROFILE_URL; delete process.env.MINECRAFT_PROFILE_TOKEN;
test.after(() => { for (const [name, value] of Object.entries(saved)) if (value === undefined) delete process.env[name]; else process.env[name] = value; delete globalThis.__contentBridgeTests; });
function reset() { state.queries = []; state.releases = 0; state.limits = true; state.fail = false; state.bridge = true; state.imageExists = true; state.published = true; state.profile = null; }
const authHeaders = () => ({ cookie: ADMIN_COOKIE + '=' + signAdminSession(secret, hash) });
const post = (path, body, auth = true, origin = 'https://zo7al.test') => new Request('https://zo7al.test' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', origin, ...(auth ? authHeaders() : {}) }, body: JSON.stringify(body) });
const multipart = (bytes, { auth = true, origin = 'https://zo7al.test', type = 'image/png', duplicate = false } = {}) => {
  const body = new FormData(); body.append('image', new Blob([bytes], { type }), 'cover.png'); if (duplicate) body.append('image', new Blob([bytes]), 'second.png');
  return new Request('https://zo7al.test/api/admin/hub/media', { method: 'POST', headers: { origin, ...(auth ? authHeaders() : {}) }, body });
};
const png = (width, height) => sharp({ create: { width, height, channels: 4, background: { r: 30, g: 40, b: 50, alpha: 0.5 } } }).png().toBuffer();
const now = Date.now(), capturedAt = new Date(now).toISOString();
const validPlayer = { uuid: playerId, username: '.Bedrock Name', rank: 'MVP++', stats: { kills: 0, deaths: 7, playtimeSeconds: 3600 }, online: true, lastSeen: capturedAt, capturedAt };
const batch = profiles => ({ schemaVersion: 1, profiles });
const send = (body, token = key) => new Request('https://zo7al.test/api/minecraft/bridge', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token, 'x-forwarded-for': '192.0.2.10' }, body: JSON.stringify(body) });

test('actual image decoding keeps landscape, square and portrait ratios without cropping', async () => {
  for (const [width, height] of [[1600, 900], [800, 800], [450, 900]]) {
    const normalized = await media.normalizeContentImage(await png(width, height));
    assert.equal(normalized.width, width); assert.equal(normalized.height, height);
    const metadata = await sharp(normalized.data).metadata(); assert.equal(metadata.format, 'webp'); assert.equal(metadata.hasAlpha, true);
  }
  const resized = await media.normalizeContentImage(await png(5000, 1000)); assert.equal(resized.width, 4096); assert.equal(resized.height, 819);
});
test('image conversion applies orientation, strips metadata and rejects SVG, corrupt and excessive bytes', async () => {
  const oriented = await sharp(await png(400, 200)).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const normalized = await media.normalizeContentImage(oriented); assert.equal(normalized.width, 200); assert.equal(normalized.height, 400);
  assert.equal((await sharp(normalized.data).metadata()).exif, undefined);
  for (const bytes of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'), Buffer.from('not an image')]) await assert.rejects(media.normalizeContentImage(bytes), /IMAGE_FORMAT/);
  await assert.rejects(media.normalizeContentImage(Buffer.alloc(CONTENT_IMAGE_UPLOAD_BYTES + 1)), /IMAGE_SIZE/);
});
test('image uploads authenticate and check origin before touching the database', async () => {
  reset(); const bytes = await png(16, 9);
  assert.equal((await upload.POST(multipart(bytes, { auth: false }))).status, 401);
  assert.equal((await upload.POST(multipart(bytes, { origin: 'https://other.test' }))).status, 403); assert.equal(state.queries.length, 0);
});
test('upload success stores decoded bytes rather than trusting MIME, and failures remain actionable', async () => {
  reset(); const bytes = await png(160, 90), response = await upload.POST(multipart(bytes, { type: 'text/plain' }));
  assert.equal(response.status, 200); const result = await response.json(); assert.equal(result.image.width, 160); assert.equal(result.image.height, 90);
  const inserted = state.queries.find(q => q.sql.startsWith('INSERT INTO site_content_images')); assert.equal((await sharp(inserted.args[3]).metadata()).format, 'webp');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await upload.POST(multipart(Buffer.from('fake png')))).status, 400);
  assert.equal((await upload.POST(multipart(bytes, { duplicate: true }))).status, 413);
  assert.equal((await upload.POST(multipart(Buffer.alloc(CONTENT_IMAGE_UPLOAD_BYTES + 1)))).status, 413);
  state.fail = true; assert.equal((await upload.POST(multipart(bytes))).status, 503);
  reset(); state.limits = false; assert.equal((await upload.POST(multipart(bytes))).status, 429);
});
test('unpublished and unattached images stay private but owners can preview them', async () => {
  reset(); state.published = false;
  const request = new Request('https://zo7al.test/api/hub/media/' + id), params = { params: Promise.resolve({ id }) };
  assert.equal((await mediaRoute.GET(request, params)).status, 404);
  const owner = await mediaRoute.GET(new Request(request, { headers: authHeaders() }), params); assert.equal(owner.status, 200); assert.equal(owner.headers.get('cache-control'), 'private, no-store');
  state.published = true; const visible = await mediaRoute.GET(request, params); assert.equal(visible.status, 200); assert.equal(visible.headers.get('content-type'), 'image/webp'); assert.equal(visible.headers.get('x-content-type-options'), 'nosniff');
  reset(); assert.equal((await mediaRoute.GET(request, { params: Promise.resolve({ id: '../../secret' }) })).status, 404); assert.equal(state.queries.length, 0);
});
test('content images only accept stored IDs and saving can replace or remove the association', async () => {
  reset(); const news = { kind: 'news', locale: 'ar', title: 'خبر', body: 'خبر جديد من زحل', published: false, imageId: id };
  assert.equal(validateContent(news).imageId, id);
  assert.equal(validateContent({ ...news, imageId: 'https://untrusted.test/image' }), null);
  assert.equal(validateContent({ ...news, kind: 'rule' }), null);
  await content.saveContent(news); assert.equal(state.queries.at(-1).args.at(-1), id);
  await content.saveContent({ ...news, imageId: '' }); assert.equal(state.queries.at(-1).args.at(-1), null);
  state.imageExists = false; await assert.rejects(content.saveContent(news), /INVALID/);
});
test('player payloads preserve real zeroes and unknown ranks and discard private fields', () => {
  const profiles = validateProfileBatch(batch([{ ...validPlayer, rank: null, stats: { kills: 0, wins: null, inventory: 99 }, ip: 'private', email: 'private' }]), now);
  assert.deepEqual(profiles[0].stats, { kills: 0 }); assert.equal(profiles[0].rank, null); assert.equal(profiles[0].username, '.Bedrock Name');
  for (const field of ['ip', 'email', 'inventory']) assert.equal(field in profiles[0], false);
  assert.deepEqual(validateProfileBatch(batch([]), now), []);
});
test('malformed or excessive profile batches are rejected as a whole', () => {
  for (const changes of [{ uuid: 'invalid' }, { username: '<Player>' }, { rank: '§aVIP' }, { online: 'true' }, { stats: { kills: -1 } }, { stats: { deaths: '7' } }, { stats: { wins: Infinity } }, { capturedAt: new Date(now + 121000).toISOString() }, { lastSeen: 'yesterday' }]) assert.equal(validateProfileBatch(batch([{ ...validPlayer, ...changes }]), now), null);
  assert.equal(validateProfileBatch(batch([validPlayer, { ...validPlayer, uuid: playerId.toUpperCase() }]), now), null);
  assert.equal(validateProfileBatch(batch(Array(101).fill(validPlayer)), now), null);
  assert.equal(validateProfileBatch({ schemaVersion: 2, profiles: [] }, now), null);
  assert.equal(bridgeName('<Server>'), null); assert.equal(bridgeName('  Zo7al SMP  '), 'Zo7al SMP');
});
test('bridge owner endpoints require authenticated same-origin explicit configuration actions', async () => {
  reset();
  assert.equal((await admin.GET(new Request('https://zo7al.test/api/admin/minecraft-bridge'))).status, 401);
  assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'create', name: 'SMP', confirm: true }, false))).status, 401);
  assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'create', name: 'SMP', confirm: true }, true, 'https://other.test'))).status, 403);
  assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'create', name: 'SMP' }))).status, 400); assert.equal(state.queries.length, 0);
});
test('bridge keys are returned once, stored only as hashes, replaceable and revocable', async () => {
  reset(); const response = await admin.POST(post('/api/admin/minecraft-bridge', { action: 'create', name: 'Zo7al SMP', confirm: true }));
  assert.equal(response.status, 200); const created = await response.json(); assert.match(created.token, /^[A-Za-z0-9_-]{43}$/);
  const stored = state.queries.find(q => q.sql.startsWith('INSERT')); assert.equal(stored.args[2], tokenHash(created.token)); assert.equal(JSON.stringify(stored).includes(created.token), false);
  const metadata = await (await admin.GET(new Request('https://zo7al.test/api/admin/minecraft-bridge', { headers: authHeaders() }))).json();
  assert.equal(JSON.stringify(metadata).includes(created.token), false); assert.equal(JSON.stringify(metadata).includes('token_hash'), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const rotated = await (await admin.POST(post('/api/admin/minecraft-bridge', { action: 'rotate', id, confirm: true }))).json(); assert.notEqual(rotated.token, created.token);
  assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'revoke', id, confirm: true }))).status, 200); assert.ok(state.queries.some(q => /enabled=false,token_hash=NULL/.test(q.sql)));
});
test('plugin ingress rejects missing keys, disabled connections, invalid bodies and rate limits', async () => {
  reset(); assert.equal((await ingress.POST(send(batch([validPlayer]), 'short'))).status, 401); assert.equal(state.queries.length, 0);
  state.bridge = false; assert.equal((await ingress.POST(send(batch([validPlayer])))).status, 401);
  reset(); state.limits = false; assert.equal((await ingress.POST(send(batch([validPlayer])))).status, 429); assert.equal(state.queries.length, 0);
  reset(); assert.equal((await ingress.POST(send(batch([{ ...validPlayer, rank: '<b>OWNER</b>' }])))).status, 400);
  assert.equal(state.queries.some(q => q.sql.startsWith('INSERT INTO minecraft_player_profiles')), false);
});
test('profile writes recheck the locked key, reject stale updates and acknowledge completed transactions', async () => {
  reset(); const response = await ingress.POST(send(batch([validPlayer]))); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true, accepted: 1 });
  const locked = state.queries.find(q => q.sql.includes('FOR UPDATE')); assert.equal(locked.args[1], tokenHash(key)); assert.match(locked.sql, /token_hash=\$2 AND enabled FOR UPDATE/);
  const insert = state.queries.find(q => q.sql.startsWith('INSERT INTO minecraft_player_profiles')); assert.match(insert.sql, /excluded.captured_at>=minecraft_player_profiles.captured_at/); assert.equal(JSON.parse(insert.args[1])[0].stats.kills, 0);
  assert.equal(state.queries.at(-1).sql, 'COMMIT'); assert.equal(state.releases, 1); assert.equal(response.headers.get('cache-control'), 'no-store');
  reset(); state.bridge = false; await assert.rejects(bridge.receiveProfiles(id, tokenHash(key), [validPlayer]), /UNAUTHORIZED/); assert.equal(state.queries.at(-1).sql, 'ROLLBACK'); assert.equal(state.releases, 1);
});
test('player lookup handles case, database dates and stale online state while keeping historical data', async () => {
  reset(); state.profile = { ...validPlayer, username: 'Player', lastSeen: new Date(now), capturedAt: new Date(now), updatedAt: new Date(now), lastSync: new Date(now), serverName: 'Zo7al SMP' };
  const fresh = await bridge.readSyncedProfile('pLaYeR', now); assert.equal(fresh.rank, 'MVP++'); assert.equal(fresh.online, true); assert.equal(fresh.lastSeen, capturedAt); assert.equal(fresh.serverName, 'Zo7al SMP');
  assert.equal(state.queries.at(-1).args[0], 'player'); assert.match(state.queries.at(-1).sql, /b.enabled/);
  const stale = await bridge.readSyncedProfile('Player', now + 181000); assert.equal(stale.online, null); assert.equal(stale.rank, 'MVP++'); assert.equal(stale.stats.kills, 0); assert.equal(stale.lastSeen, fresh.lastSeen);
  state.profile.online = false; assert.equal((await bridge.readSyncedProfile('Player', now + 181000)).online, false);
});
test('existing public profile API reads synchronized data and keeps missing players unknown', async () => {
  reset(); const request = new Request('https://zo7al.test/api/minecraft/profile?username=Player');
  assert.deepEqual(await (await profileRoute.GET(request)).json(), { rank: null, stats: null, online: null, lastSeen: null });
  state.profile = { ...validPlayer, username: 'Player', lastSeen: capturedAt, capturedAt, lastSync: capturedAt, updatedAt: capturedAt, serverName: 'Zo7al SMP' };
  const response = await profileRoute.GET(request), value = await response.json(); assert.equal(value.rank, 'MVP++'); assert.equal(value.uuid, playerId); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  for (const field of ['token', 'token_hash', 'bridge_id']) assert.equal(field in value, false);
  reset(); assert.equal((await profileRoute.GET(new Request('https://zo7al.test/api/minecraft/profile?username=%3Cscript%3E'))).status, 400); assert.equal(state.queries.length, 0);
});
test('all image and bridge controls are translated with matching keys and variables', () => {
  const locales = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'tr', 'ja', 'ko', 'zh'], baseline = JSON.parse(readFileSync(new URL('../messages/en.json', import.meta.url)));
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const locale of locales) {
    const catalog = JSON.parse(readFileSync(new URL('../messages/' + locale + '.json', import.meta.url)));
    assert.deepEqual(Object.keys(catalog.minecraftBridge).sort(), Object.keys(baseline.minecraftBridge).sort());
    for (const [key, text] of Object.entries(baseline.minecraftBridge)) { assert.ok(catalog.minecraftBridge[key].trim()); assert.deepEqual(placeholders(catalog.minecraftBridge[key]), placeholders(text), locale + ':' + key); }
    for (const key of ['coverImage', 'imageHint', 'uploadImage', 'removeImage', 'imageInvalid', 'imageUploadFailed', 'profileServer', 'profileUpdated']) assert.ok(catalog.hub[key].trim());
  }
});

test('four backends keep their ranks and counters separate and can be selected explicitly', async () => {
  reset();
  const names = ['lobby', 'smp', 'pvp-modren', 'pvp-clasic'];
  const servers = names.map((name, i) => ({
    ...validPlayer, username: 'Player', serverId: 'c1234567-1234-1234-1234-123456789ab' + i, serverName: name,
    rank: ['DEFAULT', 'VIP', 'MVP++', 'MVP'][i], stats: { kills: i * 10, deaths: 0 }, online: i === 3,
    capturedAt, lastSync: capturedAt, updatedAt: capturedAt,
  }));
  state.profile = servers;
  for (const server of servers) {
    const result = await bridge.readSyncedProfile('Player', now, server.serverId);
    assert.equal(result.serverId, server.serverId); assert.equal(result.serverName, server.serverName);
    assert.equal(result.stats.kills, server.stats.kills); assert.equal(result.rank, server.rank);
    assert.deepEqual(result.servers.map(item => item.name), names);
  }
  const classic = servers[3], response = await profileRoute.GET(new Request('https://zo7al.test/api/minecraft/profile?username=Player&server=' + classic.serverId.toUpperCase()));
  assert.equal((await response.json()).rank, 'MVP');
  assert.equal(await bridge.readSyncedProfile('Player', now, id), null);
  const absent = await (await profileRoute.GET(new Request('https://zo7al.test/api/minecraft/profile?username=Player&server=' + id))).json();
  assert.equal(absent.rank, null); assert.equal(absent.serverId, id);
  reset(); assert.equal((await profileRoute.GET(new Request('https://zo7al.test/api/minecraft/profile?username=Player&server=../../private'))).status, 400); assert.equal(state.queries.length, 0);
});

test('legacy offline imports cannot move a player last-seen time backwards', async () => {
  reset(); await bridge.receiveProfiles(id, tokenHash(key), [validPlayer]);
  assert.match(state.queries.find(q => q.sql.startsWith('INSERT INTO minecraft_player_profiles')).sql, /GREATEST\(minecraft_player_profiles.last_seen,excluded.last_seen\)/);
});

 test('renaming a player-profile server changes only its label and preserves key and profiles', async () => {
 reset(); const response = await admin.POST(post('/api/admin/minecraft-bridge', { action: 'rename', id, name: 'Zo7al Lobby', confirm: true }));
 assert.equal(response.status, 200); const result = await response.json(); assert.equal(result.bridge.name, 'Zo7al Lobby'); assert.equal('token' in result, false);
 const updates = state.queries.filter(q => q.sql.startsWith('UPDATE')); assert.equal(updates.length, 1); assert.deepEqual(updates[0].args, [id, 'Zo7al Lobby']); assert.doesNotMatch(updates[0].sql, /token_hash|enabled|minecraft_player_profiles/);
 reset(); assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'rename', id, name: '', confirm: true }))).status, 400); assert.equal(state.queries.length, 0);
 state.bridge = false; assert.equal((await admin.POST(post('/api/admin/minecraft-bridge', { action: 'rename', id, name: 'Missing', confirm: true }))).status, 400);
 });
