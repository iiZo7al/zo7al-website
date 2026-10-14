import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const state = { admin: true, origin: true, limited: false, cleared: [], reads: 0 };
globalThis.__fortniteRefreshTest = state;
const stub = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
let source = readFileSync(new URL('../src/app/api/admin/insights/route.ts', import.meta.url), 'utf8');
for (const [from, value] of Object.entries({
  '@/lib/server/admin-account': 'export async function hasAdminSession(){return globalThis.__fortniteRefreshTest.admin;}',
  '@/lib/server/site-security': 'export const privateHeaders={"Cache-Control":"no-store"}; export function sameOrigin(){return globalThis.__fortniteRefreshTest.origin;}',
  '@/lib/server/site-content': 'export async function limitAttempt(){return !globalThis.__fortniteRefreshTest.limited;}',
  '@/lib/server/dashboard-platforms': 'export function clearPlatformCache(id){globalThis.__fortniteRefreshTest.cleared.push(id);}',
  '@/lib/server/dashboard-insights': 'export async function dashboardInsights(){return {revision:++globalThis.__fortniteRefreshTest.reads};}',
})) source = source.replaceAll(from, stub(value));
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { POST } = await import(stub(compiled));
test.after(() => delete globalThis.__fortniteRefreshTest);

test('Fortnite manual refresh requires admin, same origin and available rate limit before invalidating cache', async () => {
  const request = () => new Request('https://zo7al.test/api/admin/insights', { method: 'POST' });
  state.admin = false;
  assert.equal((await POST(request())).status, 401);
  state.admin = true; state.origin = false;
  assert.equal((await POST(request())).status, 403);
  state.origin = true; state.limited = true;
  assert.equal((await POST(request())).status, 429);
  assert.deepEqual(state.cleared, []); assert.equal(state.reads, 0);
  state.limited = false;
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(state.cleared, ['fortnite']);
  assert.deepEqual(await response.json(), { revision: 1 });
});
