import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedPreviewUrl, parseSocialMetadata } from '../src/lib/sync/social-preview-data.ts';

test('only public HTTPS social origins are eligible, including redirect destinations', () => {
  for (const url of ['http://youtube.com/a', 'https://youtube.com.evil.test/a', 'https://localhost/a', 'https://127.0.0.1/a', 'https://youtube.com:8443/a', 'https://user:secret@youtube.com/a', 'file:///etc/passwd']) assert.equal(allowedPreviewUrl(url), false, url);
  for (const url of ['https://www.youtube.com/@iiZo7al', 'https://youtube.com/@Zo7alGames', 'https://discord.gg/nxScVYrSXq']) assert.equal(allowedPreviewUrl(url), true, url);
});
test('Open Graph handles reversed attributes, entities and safe relative images', () => {
  assert.deepEqual(parseSocialMetadata(`<meta content='Zo7al &amp; Games' property='og:title'><meta content='/photo.png?a=1&amp;b=2' property='og:image'>`, 'https://youtube.com/@Zo7alGames'), { title: 'Zo7al & Games', image: 'https://youtube.com/photo.png?a=1&b=2', description: undefined });
  assert.deepEqual(parseSocialMetadata(`<meta name="twitter:title" content="Gaming &#x1F3AE;"><meta name="twitter:image" content="javascript:alert(1)">`, 'https://x.com/Zo7alGames'), { title: 'Gaming 🎮', image: undefined, description: undefined });
});
test('blocked and sign-in pages do not become profile previews', () => {
  assert.equal(parseSocialMetadata('<meta property="og:title" content="Log in to Instagram">', 'https://instagram.com/iizo7al'), null);
  assert.equal(parseSocialMetadata('<title>Just a moment</title>', 'https://youtube.com/@iiZo7al'), null);
});

const { latestYoutubeVideo, structuredPosts } = await import('../src/lib/sync/social-preview-data.ts');
const yt = contents => `var ytInitialData = ${JSON.stringify({ contents: { tabs: [{ tabRenderer: { selected: true, content: { contents } } }] } })};`;
const video = (id, extra = {}) => ({ videoRenderer: { videoId: id, title: { runs: [{ text: `Video ${id}` }] }, lengthText: { simpleText: '2:20' }, ...extra } });
test('YouTube Videos tab skips Shorts and live videos, but keeps short horizontal uploads', () => {
  const result = latestYoutubeVideo(yt([
    { shortsLockupViewModel: { videoId: 'short111111' } },
    video('short222222', { navigationEndpoint: { commandMetadata: { webCommandMetadata: { url: '/shorts/short222222' } } } }),
    video('live1111111', { thumbnailOverlays: [{ thumbnailOverlayTimeStatusRenderer: { style: 'LIVE' } }] }),
    video('normal11111'), video('older111111'),
  ]));
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://www.youtube.com/watch?v=normal11111');
  assert.equal(latestYoutubeVideo('<entry><yt:videoId>short222222</yt:videoId></entry>').length, 0, 'mixed RSS is never a verified long-form source');
});
test('structured posts sort by date rather than pinned position and reject other origins', () => {
  const html = `<script type="application/ld+json">${JSON.stringify([
    { '@type': 'SocialMediaPosting', name: 'Pinned old', datePublished: '2026-08-01', url: 'https://www.threads.com/@test/post/old' },
    { '@type': 'SocialMediaPosting', name: 'Latest', datePublished: '2026-09-29', url: 'https://www.threads.com/@test/post/new' },
    { '@type': 'SocialMediaPosting', name: 'Not this platform', datePublished: '2026-10-01', url: 'https://x.com/other/status/1' },
  ])}</script>`;
  assert.equal(structuredPosts(html, 'https://www.threads.com/@test', 'post')[0].title, 'Latest');
});
test('account biography is preserved and decoded', () => {
  const result = parseSocialMetadata('<meta property="og:title" content="Creator"><meta name="description" content="Gaming &amp; friends">', 'https://youtube.com/@test');
  assert.equal(result.description, 'Gaming & friends');
});

test('Twitch archive-page parsing rejects clip URLs', () => {
  const html = `<script type="application/ld+json">${JSON.stringify([
    { '@type': 'VideoObject', name: 'Clip', uploadDate: '2026-09-29', url: 'https://www.twitch.tv/test/clip/clip1' },
    { '@type': 'VideoObject', name: 'Saved stream', uploadDate: '2026-09-28', url: 'https://www.twitch.tv/videos/12345' },
  ])}</script>`;
  assert.equal(structuredPosts(html, 'https://www.twitch.tv/test', 'broadcast')[0].url, 'https://www.twitch.tv/videos/12345');
});
