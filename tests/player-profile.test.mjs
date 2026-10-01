import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerRank } from '../src/lib/server/player-profile.ts';
test('current rank is accepted only for the requested player', () => {
  assert.equal(parsePlayerRank({ username: 'iiZo7al', rank: 'OWNER' }, 'iizo7al'), 'OWNER');
  assert.equal(parsePlayerRank({ username: 'someone', rank: 'OWNER' }, 'iiZo7al'), null);
  assert.equal(parsePlayerRank({ rank: 'VIP' }, 'iiZo7al'), null);
});
test('missing, malformed and formatted rank responses stay unknown', () => {
  for (const rank of [null, {}, '', '§aVIP', '<b>VIP</b>', 'VIP\nOWNER', 'x'.repeat(65)]) {
    assert.equal(parsePlayerRank({ username: 'iiZo7al', rank }, 'iiZo7al'), null);
  }
  assert.equal(parsePlayerRank(null, 'iiZo7al'), null);
});
