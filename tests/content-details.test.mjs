import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORTNITE_DETAILS } from '../src/lib/data/fortnite-details.ts';
import { modrinthDetails, readableDescription } from '../src/lib/data/modpack-details.ts';

test('all thirteen verified islands have code-keyed descriptions and exact tags', () => {
  assert.equal(Object.keys(FORTNITE_DETAILS).length, 13);
  for (const [code, details] of Object.entries(FORTNITE_DETAILS)) {
    assert.match(code, /^\d{4}-\d{4}-\d{4}$/);
    assert.match(details.description, /Made In UEFN/);
    assert.ok(details.tags.length >= 3);
  }
  assert.match(FORTNITE_DETAILS['7067-2620-1606'].description, /Proximity Chat/);
  assert.doesNotMatch(FORTNITE_DETAILS['3325-4001-0926'].description, /Proximity Chat/);
  assert.deepEqual(FORTNITE_DETAILS['4904-5829-1966'].tags, ['free for all', '8v8', 'base', 'training']);
  assert.match(FORTNITE_DETAILS['3310-5985-8629'].description, /50 Gold Coins/);
});

test('Modrinth releases are ordered by publication and preserve actual version numbers', () => {
  const data = modrinthDetails({ body: 'Details', game_versions: ['1.21.11'], loaders: ['fabric'], license: { id: 'MIT' } }, [
    { id: 'older', name: 'Old', version_number: '1.0', version_type: 'release', date_published: '2026-07-01' },
    { id: 'newer', name: 'iiZo7al PvP 1.0.0', version_number: '2.0.0', version_type: 'beta', date_published: '2026-08-21', files: [{ primary: true, size: 1234 }] },
  ], 'iizo7al-pvp');
  assert.equal(data.releases[0].version, '2.0.0');
  assert.equal(data.releases[0].size, 1234);
  assert.equal(data.releases[0].url, 'https://modrinth.com/modpack/iizo7al-pvp/version/newer');
  assert.deepEqual(data.gameVersions, ['1.21.11']);
  assert.deepEqual(modrinthDetails({}, [], 'server').releases, []);
});

test('external descriptions become readable text without executable HTML or image markup', () => {
  const text = readableDescription('# Heading\n\n<script>evil()</script><img src=x onerror="evil()"><p>Hello &amp; welcome</p>\n* **Feature**\n[Docs](https://example.com)\n[![Ad](https://example.com/a.png)](https://example.com)');
  assert.equal(text, 'Heading\n\nHello & welcome\n\n* Feature\nDocs (https://example.com)');
  assert.doesNotMatch(text, /evil|<|!\[/);
});
