import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from '@formatjs/icu-messageformat-parser';
import ts from 'typescript';
import { cartCopy } from '../src/lib/data/cart-copy.ts';
import { communityCopy } from '../src/lib/data/community-copy.ts';
import { storeExperienceCopy } from '../src/lib/data/store-experience-copy.ts';

const locales = ['en', 'ar', 'es', 'fr', 'de', 'pt', 'tr', 'ja', 'ko', 'zh'];
const catalogs = Object.fromEntries(locales.map(locale => [locale, JSON.parse(readFileSync(new URL('../messages/' + locale + '.json', import.meta.url)))]));
function flatten(value, prefix = '') {
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => Object.entries(flatten(child, prefix ? prefix + '.' + key : key))));
 return { [prefix]: value };
}
function parameters(value) {
 const result = new Set();
 const visit = nodes => nodes.forEach(node => { if ([1, 2, 3, 4, 5, 6].includes(node.type)) result.add(node.value); if (node.options) Object.values(node.options).forEach(option => visit(option.value)); if (node.children) visit(node.children); });
 visit(parse(value, { ignoreTag: true })); return [...result].sort();
}
test('all ten website catalogs contain complete messages and matching ICU parameters', () => {
 const base = flatten(catalogs.en), keys = Object.keys(base).sort();
 for (const locale of locales) {
  const translated = flatten(catalogs[locale]); assert.deepEqual(Object.keys(translated).sort(), keys, locale);
  for (const key of keys) {
   assert.equal(typeof translated[key], typeof base[key], locale + ':' + key);
   if (typeof base[key] === 'string') { assert.ok(translated[key].trim(), locale + ':' + key); assert.deepEqual(parameters(translated[key]), parameters(base[key]), locale + ':' + key); }
  }
 }
});
test('shared interface copy and administration instructions are translated in every locale', () => {
 for (const copy of [cartCopy, communityCopy, storeExperienceCopy]) {
  const base = copy('en');
  for (const locale of locales) {
   const values = copy(locale); assert.deepEqual(Object.keys(values).sort(), Object.keys(base).sort(), locale);
   for (const [key, value] of Object.entries(values)) { assert.ok(value.trim(), locale + ':' + key); assert.deepEqual(parameters(value), parameters(base[key]), locale + ':' + key); }
  }
 }
 for (const locale of locales.slice(1)) for (const namespace of ['pelican', 'youtubeStudio']) {
  for (const [key, english] of Object.entries(catalogs.en[namespace])) {
   if (english.match(/[A-Za-z]+/g)?.length >= 4) assert.notEqual(catalogs[locale][namespace][key], english, locale + ':' + namespace + '.' + key);
  }
 }
});
test('translated catalogs do not retain English sentences in website interface copy', () => {
 const english = flatten(catalogs.en);
 for (const locale of locales.slice(1)) {
  for (const [key, value] of Object.entries(flatten(catalogs[locale]))) {
   if (typeof value !== 'string' || /\.(id|href|url)$/.test(key)) continue;
   if ((english[key].match(/[A-Za-z]+/g) ?? []).length >= 4) {
    assert.notEqual(value, english[key], `${locale}:${key}`);
   }
  }
 }
});
test('literal translation calls resolve to existing catalog entries', () => {
 const configFile = ts.readConfigFile(fileURLToPath(new URL('../tsconfig.json', import.meta.url)), ts.sys.readFile);
 const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, fileURLToPath(new URL('..', import.meta.url)));
 const program = ts.createProgram(config.fileNames, config.options), checker = program.getTypeChecker();
 let checked = 0;
 for (const source of program.getSourceFiles()) {
  if (!source.fileName.replaceAll('\\', '/').includes('/src/')) continue;
  const visit = node => {
   if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
    const declaration = checker.getSymbolAtLocation(node.expression)?.valueDeclaration;
    if (declaration && ts.isVariableDeclaration(declaration)) {
     let initializer = declaration.initializer;
     if (initializer && ts.isAwaitExpression(initializer)) initializer = initializer.expression;
     if (initializer && ts.isCallExpression(initializer) && ['useTranslations', 'getTranslations'].includes(initializer.expression.getText(source)) && initializer.arguments[0] && ts.isStringLiteral(initializer.arguments[0])) {
      const namespace = initializer.arguments[0].text, key = node.arguments[0].text;
      let value = catalogs.en[namespace];
      for (const part of key.split('.')) value = value?.[part];
      assert.equal(typeof value, 'string', `${source.fileName}: ${namespace}.${key}`);
      checked++;
     }
    }
   }
   ts.forEachChild(node, visit);
  };
  visit(source);
 }
 assert.ok(checked > 700, `Expected to audit website calls, checked ${checked}`);
});
