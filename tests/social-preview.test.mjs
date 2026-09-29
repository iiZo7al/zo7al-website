import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedPreviewUrl, parseSocialMetadata } from '../src/lib/sync/social-preview-data.ts';

test('only public HTTPS social origins are eligible, including redirect destinations', () => {
  for (const url of ['http://youtube.com/a', 'https://youtube.com.evil.test/a', 'https://localhost/a', 'https://127.0.0.1/a', 'https://youtube.com:8443/a', 'https://user:secret@youtube.com/a', 'file:///etc/passwd']) assert.equal(allowedPreviewUrl(url), false, url);
  for (const url of ['https://www.youtube.com/@iiZo7al', 'https://youtube.com/@Zo7alGames', 'https://discord.gg/nxScVYrSXq']) assert.equal(allowedPreviewUrl(url), true, url);
});
test('Open Graph handles reversed attributes, entities and safe relative images', () => {
  assert.deepEqual(parseSocialMetadata(`<meta content='Zo7al &amp; Games' property='og:title'><meta content='/photo.png?a=1&amp;b=2' property='og:image'>`, 'https://youtube.com/@Zo7alGames'), { title: 'Zo7al & Games', image: 'https://youtube.com/photo.png?a=1&b=2' });
  assert.deepEqual(parseSocialMetadata(`<meta name="twitter:title" content="Gaming &#x1F3AE;"><meta name="twitter:image" content="javascript:alert(1)">`, 'https://x.com/Zo7alGames'), { title: 'Gaming 🎮', image: undefined });
});
test('blocked and sign-in pages do not become profile previews', () => {
  assert.equal(parseSocialMetadata('<meta property="og:title" content="Log in to Instagram">', 'https://instagram.com/iizo7al'), null);
  assert.equal(parseSocialMetadata('<title>Just a moment</title>', 'https://youtube.com/@iiZo7al'), null);
});
