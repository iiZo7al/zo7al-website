import { readFileSync } from 'node:fs';
import ts from 'typescript';
function url(path, replacements = {}) {
  let source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  for (const [name, value] of Object.entries(replacements)) source = source.replaceAll(name, value);
  return 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
}
export const statDataUrl = url('src/lib/data/player-statistics.ts');
export const bridgeDataUrl = url('src/lib/data/minecraft-bridge.ts', { './player-statistics': statDataUrl });
export const parserUrl = url('src/lib/server/player-profile.ts', { '../data/player-statistics': statDataUrl });
export const statistics = await import(statDataUrl);
export const validation = await import(bridgeDataUrl);
export const playerParser = await import(parserUrl);
