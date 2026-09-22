import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storeDescriptionText } from '../src/lib/server/store-description.ts';
test('Tebex descriptions retain full bilingual text, lists and the plus sign', () => {
  const text = storeDescriptionText('<p>رتبة MVP+</p><ul><li>/fly</li><li>10 homes</li></ul><p>' + 'Permanent '.repeat(200) + '</p><p>Payment: one-time.</p>');
  assert.ok(text.length > 1200);
  assert.ok(text.includes('رتبة MVP+'));
  assert.ok(text.includes('• /fly\n'));
  assert.ok(text.endsWith('Payment: one-time.'));
});
test('description data is plain text, without active markup or script contents', () => {
  assert.equal(storeDescriptionText('<script>alert(1)</script><p onclick="bad()">A &amp; B<br>Terms &#43; &#x2b;</p>'), 'A & B\nTerms + +');
  assert.equal(storeDescriptionText(null), '');
  assert.equal(storeDescriptionText('&#999999999;'), '�');
});
