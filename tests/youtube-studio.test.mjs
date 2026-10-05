import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import { youtubeVideoId, youtubePrivacy, YOUTUBE_UPLOAD_CHUNK } from '../src/lib/data/youtube-studio.ts';
import { ADMIN_COOKIE, signAdminSession } from '../src/lib/server/site-security.ts';
const stub = s => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
function moduleUrl(path, replacements = {}) {
 let s = readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace('import "server-only";', '');
 for (const [name, value] of Object.entries(replacements).sort(([a], [b]) => b.length - a.length)) s = s.replaceAll(name, value);
 return stub(ts.transpileModule(s, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const channelId = 'UC' + 'a'.repeat(22), videoId = 'abcdef12345', secret = 's'.repeat(43), hash = 'scrypt:' + 'a'.repeat(32) + ':' + 'b'.repeat(128);
const state = { app: null, auth: null, oauth: new Map(), queries: [], releases: 0, limits: true };
const db = { async query(sql, args = []) {
 state.queries.push({ sql, args });
 if (sql.startsWith('SELECT sealed FROM youtube_studio_app')) return { rows: state.app ? [{ sealed: state.app }] : [] };
 if (sql.startsWith('SELECT sealed FROM youtube_studio_auth')) return { rows: state.auth ? [{ sealed: state.auth }] : [] };
 if (sql.startsWith('SELECT channel_id')) return { rows: state.auth ? [{ channel_id: channelId, title: 'Zo7al' }] : [] };
 if (sql.startsWith('INSERT INTO youtube_studio_app')) state.app = args[0];
 if (sql.startsWith('INSERT INTO youtube_studio_auth')) state.auth = args[0];
 if (sql.startsWith('INSERT INTO youtube_studio_oauth')) state.oauth.set(args[0], { browser: args[1], sealed: args[2], claimed: false });
 if (sql.startsWith('UPDATE youtube_studio_oauth')) { const row = state.oauth.get(args[0]); if (!row || row.browser !== args[1] || row.claimed) return { rows: [], rowCount: 0 }; row.claimed = true; return { rows: [row], rowCount: 1 }; }
 if (sql.startsWith('DELETE FROM youtube_studio_oauth WHERE state_hash')) { const row = state.oauth.get(args[0]); state.oauth.delete(args[0]); return { rows: row ? [row] : [], rowCount: row ? 1 : 0 }; }
 if (sql === 'DELETE FROM youtube_studio_oauth') state.oauth.clear();
 if (sql.startsWith('DELETE FROM youtube_studio_auth')) { const row = state.auth; state.auth = null; return { rows: row ? [{ sealed: row }] : [], rowCount: row ? 1 : 0 }; }
 if (sql.startsWith('UPDATE youtube_studio_auth SET sealed=')) { if (state.auth !== args[1]) return { rows: [], rowCount: 0 }; state.auth = args[0]; }
 return { rows: [], rowCount: 1 };
 }, async connect() { return { query: db.query, release: () => state.releases++ }; } };
globalThis.__youtubeTests = { state, db };
const data = moduleUrl('src/lib/data/youtube-studio.ts'), security = moduleUrl('src/lib/server/site-security.ts');
const authModule = moduleUrl('src/lib/server/youtube-auth.ts', { './site-db': stub('export async function siteDatabase(){return globalThis.__youtubeTests.db;}'), './site-security': security, '../data/youtube-studio': data });
const auth = await import(authModule);
const studioModule = moduleUrl('src/lib/server/youtube-studio.ts', { './youtube-auth': authModule, '../data/youtube-studio': data }), studio = await import(studioModule);
const uploadModule = moduleUrl('src/lib/server/youtube-upload.ts', { './youtube-auth': authModule, './youtube-studio': studioModule, '../data/youtube-studio': data }), upload = await import(uploadModule);
const limits = stub('export async function limitAttempt(){return globalThis.__youtubeTests.state.limits;}');
const replacements = { '@/lib/server/site-security': security, '@/lib/server/site-content': limits, '@/lib/server/youtube-auth': authModule, '@/lib/server/youtube-studio': studioModule, '@/lib/server/youtube-upload': uploadModule, '@/lib/data/youtube-studio': data, '@/lib/server/dashboard-platforms': stub('export function clearPlatformCache(){}') };
const route = await import(moduleUrl('src/app/api/admin/youtube/route.ts', replacements)), uploadRoute = await import(moduleUrl('src/app/api/admin/youtube/upload/route.ts', replacements));
const media = await import(moduleUrl('src/app/api/admin/youtube/media/route.ts', { ...replacements, '"sharp"': JSON.stringify(import.meta.resolve('sharp')) }));
const keys = ['ZO7AL_ADMIN_PASSWORD_HASH', 'ZO7AL_ADMIN_SESSION_SECRET', 'YOUTUBE_OAUTH_CLIENT_ID', 'YOUTUBE_OAUTH_CLIENT_SECRET'];
const env = Object.fromEntries(keys.map(k => [k, process.env[k]])), originalFetch = globalThis.fetch;
process.env.ZO7AL_ADMIN_SESSION_SECRET = secret; process.env.ZO7AL_ADMIN_PASSWORD_HASH = hash; delete process.env.YOUTUBE_OAUTH_CLIENT_ID; delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
test.after(() => { globalThis.fetch = originalFetch; for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v; delete globalThis.__youtubeTests; });
const app = { clientId: '123-example.apps.googleusercontent.com', clientSecret: 'test-secret-not-a-real-google-credential' };
const credentials = () => ({ ...app, accessToken: 'test-access-token', refreshToken: 'test-refresh-token', channelId, title: 'Zo7al', expiresAt: Date.now() + 3600000 });
function reset(connected = true) { state.app = auth.sealYoutube(app, 'app'); state.auth = connected ? auth.sealYoutube(credentials(), 'auth') : null; state.oauth.clear(); state.queries = []; state.limits = true; }
const headers = () => ({ origin: 'https://zo7al.test', cookie: ADMIN_COOKIE + '=' + signAdminSession(secret, hash), 'Content-Type': 'application/json' });
const post = (body, extra = {}) => new Request('https://zo7al.test/api/admin/youtube', { method: 'POST', headers: { ...headers(), ...extra }, body: JSON.stringify(body) });
test('YouTube input accepts owned-video links and rejects paths, malformed URLs and visibility', () => {
 for (const value of [videoId, 'https://www.youtube.com/watch?v=' + videoId, 'https://youtu.be/' + videoId, 'https://www.youtube.com/shorts/' + videoId]) assert.equal(youtubeVideoId(value), videoId);
 for (const value of ['../private', 'not a URL', 'http://youtu.be/' + videoId, 'https://evil.test/watch?v=' + videoId, 'https://user:secret@youtube.com/watch?v=' + videoId]) assert.throws(() => youtubeVideoId(value), /INVALID/);
 assert.throws(() => youtubePrivacy('published'), /INVALID/);
});
test('Google credentials are encrypted, purpose-bound and excluded from status responses', async () => {
 reset(); const sealed = auth.sealYoutube(credentials(), 'auth'); assert.doesNotMatch(sealed, /test-access-token|test-refresh-token|clientSecret/);
 assert.equal(auth.openYoutube(sealed, 'auth').channelId, channelId); assert.throws(() => auth.openYoutube(sealed, 'upload'));
 const parts = sealed.split('.'); parts[2] = (parts[2][0] === 'a' ? 'b' : 'a') + parts[2].slice(1); assert.throws(() => auth.openYoutube(parts.join('.'), 'auth'));
 const status = await auth.youtubeStatus(new Request('https://zo7al.test/api/admin/youtube')); assert.equal(status.connected, true); assert.equal(status.redirectUri, 'https://zo7al.test/api/admin/youtube/oauth/callback'); assert.doesNotMatch(JSON.stringify(status), /accessToken|refreshToken|clientSecret|sealed/);
});
test('OAuth uses PKCE, a browser-bound nonce and one-time callback consumption', async () => {
 reset(false); const started = await auth.startYoutubeOAuth(new Request('https://zo7al.test/api/admin/youtube')), url = new URL(started.url);
 assert.equal(url.hostname, 'accounts.google.com'); assert.equal(url.searchParams.get('code_challenge_method'), 'S256'); assert.match(started.cookie, /HttpOnly; SameSite=Lax/);
 const callback = 'https://zo7al.test/api/admin/youtube/oauth/callback?state=' + url.searchParams.get('state') + '&code=test-code';
 await assert.rejects(auth.finishYoutubeOAuth(new Request(callback, { headers: { cookie: 'zo7al-youtube-oauth=' + 'x'.repeat(43) } })), /INVALID/);
 const calls = []; globalThis.fetch = async (raw, options) => { calls.push({ raw: String(raw), options }); return String(raw).includes('/token') ? Response.json({ access_token: 'new-test-access', refresh_token: 'new-test-refresh', expires_in: 3600 }) : Response.json({ items: [{ id: channelId, snippet: { title: 'Zo7al' } }] }); };
 const request = new Request(callback, { headers: { cookie: started.cookie.split(';')[0] } });
 assert.equal(await auth.finishYoutubeOAuth(request), 'connected'); assert.equal((await auth.youtubeAuth()).channelId, channelId);
 assert.ok(calls[0].options.body.get('code_verifier')); assert.equal(calls[0].options.body.get('redirect_uri'), 'https://zo7al.test/api/admin/youtube/oauth/callback');
 await assert.rejects(auth.finishYoutubeOAuth(request), /INVALID/);
});
test('a disconnect or app replacement cancels an OAuth callback already exchanging its code', async () => {
 reset(false); const started = await auth.startYoutubeOAuth(new Request('https://zo7al.test/api/admin/youtube')), url = new URL(started.url);
 globalThis.fetch = async raw => { if (String(raw).includes('/token')) { state.oauth.clear(); return Response.json({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }); } return Response.json({ items: [{ id: channelId, snippet: { title: 'Zo7al' } }] }); };
 await assert.rejects(auth.finishYoutubeOAuth(new Request('https://zo7al.test/api/admin/youtube/oauth/callback?state=' + url.searchParams.get('state') + '&code=test', { headers: { cookie: started.cookie.split(';')[0] } })), /YT_RECONNECT/);
 assert.equal(state.auth, null);
});
test('video updates preserve untouched fields and block mutation of another channel', async () => {
 reset(); const calls = [];
 const previous = { id: videoId, snippet: { channelId, title: 'Old', description: 'Keep description', tags: ['keep'], categoryId: '20' }, status: { privacyStatus: 'private', embeddable: true, license: 'youtube', selfDeclaredMadeForKids: false } };
 globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); return Response.json(options.method === 'PUT' ? JSON.parse(options.body) : { items: [previous] }); };
 await studio.writeYoutubeStudio('videoUpdate', { id: videoId, title: 'New' });
 const body = JSON.parse(calls.at(-1).options.body); assert.equal(body.snippet.description, 'Keep description'); assert.deepEqual(body.snippet.tags, ['keep']); assert.equal(body.status.embeddable, true); assert.equal(body.status.privacyStatus, 'private');
 calls.length = 0; previous.snippet.channelId = 'UC' + 'b'.repeat(22);
 await assert.rejects(studio.writeYoutubeStudio('videoDelete', { id: videoId, confirm: true }), error => error.code === 'YT_PERMISSION'); assert.equal(calls.length, 1); assert.equal(calls[0].options.method, 'GET');
});
test('resumable uploads verify Google session URLs, chunks and confirmed byte ranges without exposing tokens', async () => {
 reset(); const calls = [], size = YOUTUBE_UPLOAD_CHUNK + 1, session = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test-session';
 globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); if (options.method === 'POST') return new Response(null, { status: 200, headers: { location: session } }); return calls.length === 2 ? new Response(null, { status: 308, headers: { range: 'bytes=0-' + (YOUTUBE_UPLOAD_CHUNK - 1) } }) : Response.json({ id: videoId }); };
 const started = await upload.startYoutubeUpload({ size, mime: 'video/mp4', title: 'Zo7al test', privacyStatus: 'private', selfDeclaredMadeForKids: false }); assert.doesNotMatch(JSON.stringify(started), /test-access-token|test-session|refreshToken/);
 assert.equal((await upload.sendYoutubeChunk(started.ticket, 0, Buffer.alloc(YOUTUBE_UPLOAD_CHUNK))).offset, YOUTUBE_UPLOAD_CHUNK);
 assert.equal(calls[1].options.headers['Content-Range'], 'bytes 0-' + (YOUTUBE_UPLOAD_CHUNK - 1) + '/' + size);
 const done = await upload.sendYoutubeChunk(started.ticket, YOUTUBE_UPLOAD_CHUNK, Buffer.alloc(1)); assert.equal(done.done, true); assert.equal(done.id, videoId);
 assert.throws(() => upload.youtubeUploadURL('https://evil.test/upload?upload_id=test')); assert.throws(() => upload.youtubeUploadOffset('bytes=5-50', size));
 await assert.rejects(upload.sendYoutubeChunk(started.ticket, 1, Buffer.alloc(1)), /INVALID/);
 await assert.rejects(upload.startYoutubeUpload({ size, mime: 'video/mp4', title: 'Test' }), /INVALID/);
 await assert.rejects(upload.startYoutubeUpload({ size, mime: 'video/mp4', title: 'Test', privacyStatus: 'public', selfDeclaredMadeForKids: false, publishAt: new Date(Date.now() + 86400000).toISOString() }), /INVALID/);
});
test('YouTube routes require admin, same origin and rate limit before any Google call', async () => {
 reset(); const calls = []; globalThis.fetch = async url => { calls.push(url); throw Error('must not call'); };
 assert.equal((await route.GET(new Request('https://zo7al.test/api/admin/youtube'))).status, 401);
 assert.equal((await route.POST(post({ action: 'connect' }, { cookie: '' }))).status, 401);
 assert.equal((await route.POST(post({ action: 'videoDelete' }, { origin: 'https://evil.test' }))).status, 403);
 assert.equal((await uploadRoute.POST(post({}, { cookie: '' }))).status, 401);
 state.limits = false; assert.equal((await route.POST(post({ action: 'connect' }))).status, 429); assert.equal(calls.length, 0);
});
test('all Studio catalogs have complete keys and identical interpolation parameters', () => {
 const en = JSON.parse(readFileSync(new URL('../messages/en.json', import.meta.url))).youtubeStudio;
 const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
 for (const locale of ['ar','de','es','fr','pt','tr','ja','ko','zh']) { const catalog = JSON.parse(readFileSync(new URL('../messages/' + locale + '.json', import.meta.url))).youtubeStudio; assert.deepEqual(Object.keys(catalog).sort(), Object.keys(en).sort()); for (const [key, value] of Object.entries(en)) assert.deepEqual(placeholders(catalog[key]), placeholders(value), locale + ':' + key); }
});
test('YouTube media decodes thumbnails, validates timed captions and verifies video ownership', async () => {
 reset(); const calls = [], owned = { id: videoId, snippet: { channelId } };
 globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); return String(url).includes('/upload/') ? Response.json({ id: 'saved-media' }) : Response.json({ items: [owned] }); };
 const request = (bytes, action = 'thumbnail', auth = true) => {
  const data = new FormData(); data.set('action', action); data.set('videoId', videoId); data.set('language', 'ar'); data.set('file', new Blob([bytes]), action === 'caption' ? 'track.srt' : 'cover.png');
  return new Request('https://zo7al.test/api/admin/youtube/media', { method: 'POST', headers: { origin: 'https://zo7al.test', ...(auth ? { cookie: headers().cookie } : {}) }, body: data });
 };
 assert.equal((await media.POST(request('image', 'thumbnail', false))).status, 401); assert.equal(calls.length, 0);
 const bytes = await sharp({ create: { width: 160, height: 90, channels: 3, background: '#222' } }).png().toBuffer();
 assert.equal((await media.POST(request(bytes))).status, 200); const uploaded = calls.find(call => call.url.includes('/upload/')); assert.equal((await sharp(Buffer.from(uploaded.options.body)).metadata()).format, 'jpeg');
 calls.length = 0; assert.equal((await media.POST(request('fake image'))).status, 400); assert.equal(calls.some(call => call.options.method === 'POST'), false);
 assert.equal((await media.POST(request('1\n00:00:00,000 --> 00:00:03,000\nZo7al\n', 'caption'))).status, 200);
 calls.length = 0; assert.equal((await media.POST(request('no subtitle timings', 'caption'))).status, 400); assert.equal(calls.some(call => call.options.method === 'POST'), false);
 owned.snippet.channelId = 'UC' + 'b'.repeat(22); calls.length = 0;
 assert.equal((await media.POST(request(bytes))).status, 403); assert.equal(calls.length, 1);
});
