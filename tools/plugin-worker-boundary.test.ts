import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const copy = await mkdtemp(join(tmpdir(), 'kingdown-worker-boundary-'));
  try {
    await mkdir(join(copy, 'tools'));
    await Promise.all([
      cp(join(root, 'src'), join(copy, 'src'), { recursive: true }),
      cp(join(root, 'tools/plugin-runtime-build.mjs'), join(copy, 'tools/plugin-runtime-build.mjs')),
      cp(join(root, 'package.json'), join(copy, 'package.json')),
      symlink(join(root, 'node_modules'), join(copy, 'node_modules'), 'dir'),
    ]);
    await writeFile(join(copy, 'probe.mjs'), `
import { writeFile } from 'node:fs/promises';
import { buildWorker, buildSearchWorker } from './tools/plugin-runtime-build.mjs';
const { source, engine } = await buildWorker();
await writeFile(process.argv[2] + '.mjs', source);
await writeFile(process.argv[2] + '.search.mjs', await buildSearchWorker());
await writeFile(process.argv[2] + '.json', JSON.stringify({ engine }));
`);
    const build = async (name: string) => {
      await promisify(execFile)(process.execPath, ['probe.mjs', name], { cwd: copy, timeout: 30_000, maxBuffer: 1_000_000 });
      return { source: await readFile(join(copy, name + '.mjs'), 'utf8'), search: await readFile(join(copy, name + '.search.mjs'), 'utf8'), engine: JSON.parse(await readFile(join(copy, name + '.json'), 'utf8')).engine as string };
    };
    const baseline = await build('baseline');
    const catalog = join(copy, 'src/content/cards.ts'), original = await readFile(catalog, 'utf8');
    const cosmetic = original.replace("name: 'Freeze',", "name: 'Cold Touch',").replace("art: 'ui/cards/freeze.webp'", "art: 'ui/cards/freeze-cosmetic-proof.webp'");
    expect(cosmetic).not.toBe(original);
    expect(cosmetic).toContain("name: 'Cold Touch'");
    expect(cosmetic).toContain("art: 'ui/cards/freeze-cosmetic-proof.webp'");
    await writeFile(catalog, cosmetic);
    const renamed = await build('cosmetic');
    expect({ sameBytes: renamed.source === baseline.source, engine: renamed.engine }).toEqual({ sameBytes: true, engine: baseline.engine });
    expect(baseline.source).not.toContain('ui/cards/freeze.webp');
    expect(baseline.source).not.toContain('card-freeze');

    const ceremony = join(copy, 'src/ceremony-game.ts'), labels = await readFile(ceremony, 'utf8');
    const relabeled = labels.replace('`${piece} flies`', '`${piece} soars`');
    expect(relabeled).not.toBe(labels);
    await writeFile(ceremony, relabeled);
    const captioned = await build('ceremony');
    expect.soft({ sameBytes: captioned.source === baseline.source, engine: captioned.engine }, 'ceremony labels').toEqual({ sameBytes: true, engine: baseline.engine });
    await writeFile(ceremony, labels);

    const previously = join(copy, 'src/previously.ts'), narration = await readFile(previously, 'utf8');
    const reworded = narration.replace('they drew a card with Growth.', 'they drew one card with Growth.');
    expect(reworded).not.toBe(narration);
    await writeFile(previously, reworded);
    const narrated = await build('previously');
    expect.soft({ sameBytes: narrated.source === baseline.source, engine: narrated.engine }, 'previous-turn narration').toEqual({ sameBytes: true, engine: baseline.engine });
    await writeFile(previously, narration);

    const read = join(copy, 'src/read.ts'), teaching = await readFile(read, 'utf8');
    const retaught = teaching.replace('Their maester swapped places with one of their pieces.', 'Their maester exchanged places with one of their pieces.');
    expect(retaught).not.toBe(teaching);
    await writeFile(read, retaught);
    const taught = await build('teaching');
    expect.soft({ sameBytes: taught.source === baseline.source, engine: taught.engine }, 'Beginner teaching words').toEqual({ sameBytes: true, engine: baseline.engine });
    await writeFile(read, teaching);

    const mechanics = join(copy, 'src/rules/engine.ts'), engine = await readFile(mechanics, 'utf8');
    const changed = engine.replace('export const HAND_MAX = 8;', 'export const HAND_MAX = 7;');
    expect(changed).not.toBe(engine);
    await writeFile(mechanics, changed);
    const enforcing = await build('mechanics');
    expect(enforcing.engine).not.toBe(renamed.engine);
    expect(enforcing.source === renamed.source).toBe(false);

    await writeFile(mechanics, engine);
    await writeFile(catalog, original);
    for (const [path, mutate] of [
      ['src/ai/eval.ts', (source: string) => source.replace('PAWN_V = 100,', 'PAWN_V = 101,')],
      ['src/ai/skill.ts', (source: string) => source.replace('const STRONG_MS = 2500;', 'const STRONG_MS = 2499;')],
      ['src/ai/nnue/weights.ts', (source: string) => source.replace(/(NET_B64: string = ')(.)/, (_match, prefix, first) => prefix + (first === 'A' ? 'B' : 'A'))],
    ] as const) {
      const file = join(copy, path), source = await readFile(file, 'utf8');
      const changed = mutate(source);
      expect(changed).not.toBe(source);
      await writeFile(file, changed);
      const evaluated = await build(path.split('/').at(-1)!.replace('.ts', ''));
      expect.soft({ sameBytes: evaluated.source === baseline.source, engine: evaluated.engine }, path).toEqual({ sameBytes: true, engine: baseline.engine });
      expect.soft(evaluated.search, path).not.toBe(baseline.search);
      await writeFile(file, source);
    }
    await writeFile(join(copy, 'compiled-probe.mjs'), `
import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildRuntime } from './tools/plugin-runtime-build.mjs';
await buildRuntime(resolve('runtime'), { archiveDir: resolve('temporary-pairs'), publish: true });
await rm('src', { recursive: true });
const { createMatch, loadMatch } = await import(pathToFileURL(resolve('runtime/index.mjs')).href);
const matches = [];
try {
  const match = await createMatch({ fen: '7k/8/8/8/8/8/q7/R5K1 w - - 0 1' }); matches.push(match);
  const before = await match.snapshot(), engine = JSON.parse(await match.exportSave()).engine;
  const lan = await match.chooseMove({ maxDepth: 1, maxTimeMs: 1000 });
  assert(before.legal.includes(lan));
  assert.deepEqual(await match.snapshot(), before);
  const accepted = await match.apply({ id: 'compiled-helper', expectedRevision: before.revision, lan });
  const saved = await match.exportSave(), loaded = await loadMatch(saved); matches.push(loaded);
  assert.deepEqual(await loaded.snapshot(), accepted);
  assert.equal(await loaded.exportSave(), saved);
  const reply = await loaded.chooseMove({ maxDepth: 1, maxTimeMs: 1000 });
  assert(accepted.legal.includes(reply));
  const continued = await loaded.apply({ id: 'compiled-helper-reply', expectedRevision: accepted.revision, lan: reply });
  const reloaded = await loadMatch(await loaded.exportSave()); matches.push(reloaded);
  assert.deepEqual(await reloaded.snapshot(), continued);
  assert.equal(JSON.parse(await reloaded.exportSave()).engine, engine);
  await match.close();
  await assert.rejects(match.chooseMove({ maxDepth: 1 }), /closed/);
  await writeFile('compiled-proof.json', JSON.stringify({ engine, revision: continued.revision, history: continued.history, helper: true, reload: true, closed: true }));
} finally { await Promise.all(matches.map(match => match.close())); }
`);
    await promisify(execFile)(process.execPath, ['compiled-probe.mjs'], { cwd: copy, timeout: 30_000, maxBuffer: 1_000_000 });
    expect(JSON.parse(await readFile(join(copy, 'compiled-proof.json'), 'utf8'))).toMatchObject({ engine: baseline.engine, revision: 2, helper: true, reload: true, closed: true });
  } finally { await rm(copy, { recursive: true, force: true }); }
}, 90_000);
