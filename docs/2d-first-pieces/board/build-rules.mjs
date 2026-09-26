import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const base = new URL('./', import.meta.url);
await build({ entryPoints: [fileURLToPath(new URL('rules-entry.ts', base))], outfile: fileURLToPath(new URL('rules.mjs', base)), bundle: true, format: 'esm', target: 'es2022', minify: true, banner: { js: '// Generated from src/rules/engine.ts and rules.ts. Rebuild with node docs/2d-first-pieces/board/build-rules.mjs.' } });
const sources = {};
for (const name of ['engine.ts', 'rules.ts']) sources[`src/rules/${name}`] = createHash('sha256').update(await readFile(new URL(`../../../src/rules/${name}`, base))).digest('hex');
await writeFile(new URL('rules-source.json', base), JSON.stringify(sources, null, 2) + '\n');
