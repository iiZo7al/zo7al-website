import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { markdownSource, markdownUrl } from '../src/lib/data/markdown.ts';
import { localizedMarkdownDescription } from '../src/lib/data/store-localization.ts';

const temporary = mkdtempSync(fileURLToPath(new URL('./markdown-render-', import.meta.url)));
const source = readFileSync(new URL('../src/components/ui/MarkdownContent.tsx', import.meta.url), 'utf8')
  .replace('@/lib/data/markdown', new URL('../src/lib/data/markdown.ts', import.meta.url).href);
writeFileSync(temporary + '/content.mjs', ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const { default: MarkdownContent } = await import(pathToFileURL(temporary + '/content.mjs').href);
test.after(() => rmSync(temporary, { recursive: true, force: true }));
const render = (children, props = {}) => renderToStaticMarkup(createElement(MarkdownContent, props, children));

test('Markdown renders multilingual headings, formatting, tables, tasks, links, images and fenced code', () => {
  const html = render('# أهلاً\n\n**Bold** and *italic* and ~~old~~\n\n[Docs](https://example.com/docs)\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] Done\n- [ ] Later\n\n```js\nconst x = "<script>";\n```\n\n![Grass](/assets/grass.png)');
  for (const expression of [/<h1>أهلاً<\/h1>/, /<strong>Bold<\/strong>/, /<em>italic<\/em>/, /<del>old<\/del>/, /<table>/, /type="checkbox"/, /<pre><code class="language-js">/, /&lt;script&gt;/, /loading="lazy"/, /rel="noopener noreferrer ugc"/]) assert.match(html, expression);
  assert.doesNotMatch(html, /<script>/);
});

test('unsafe HTML, event attributes and executable URL schemes never become interactive content', () => {
  const html = render('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[bad](javascript:alert%281%29)\n\n![bad](data:image/svg+xml;base64,evil)\n\n[bad](//evil.test/path)');
  assert.doesNotMatch(html, /<script|<img|onerror=|href="(?:javascript|data|\/\/)/i);
  for (const url of ['javascript:alert(1)', 'java\nscript:alert(1)', 'vbscript:evil', '//evil.test', '/\\evil.test', 'data:text/html,evil', 'https://user:password@example.com', 'file:///etc/passwd']) assert.equal(markdownUrl(url), '', url);
  for (const url of ['/support?tab=faq', '#updates', '?project=pack', 'https://example.com', 'mailto:hello@example.com']) assert.equal(markdownUrl(url), url);
  assert.equal(markdownUrl('http://example.com/image.png', true), '');
});

test('inline Markdown stays valid inside buttons, links and labels without nested interactive elements', () => {
  const html = render('**Name** [link](https://example.com) ![image](/image.png)', { inline: true });
  assert.match(html, /<strong>Name<\/strong>/);
  assert.doesNotMatch(html, /<p|<a|<img|<div/);
});

test('provider and store normalization preserve Markdown blocks and remove legacy executable HTML', () => {
  const text = '# Title\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\n  **literal**\n```';
  assert.equal(markdownSource(text), text);
  assert.equal(localizedMarkdownDescription(text, key => key), text);
  assert.equal(localizedMarkdownDescription('🎮 In-Game Benefits:\n\n- **Custom perk**', key => 'translated:' + key), 'translated:game\n\n- **Custom perk**');
  assert.equal(markdownSource('<script>evil()</script><p>Hello &amp; welcome</p>\n**Feature**').trim(), 'Hello & welcome\n\n**Feature**');
});
