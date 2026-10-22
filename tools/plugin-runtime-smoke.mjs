/** Build, then exercise only the copied artifact: no sources, tsx, or dependencies. */
import { buildRuntime, ENGINES } from './plugin-runtime-build.mjs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const scratch = await mkdtemp(join(tmpdir(), 'kingdown-runtime-'));
try {
  await buildRuntime(join(scratch, 'runtime'));
  const files = (await readdir(join(scratch, 'runtime'))).sort();
  if (JSON.stringify(files) !== JSON.stringify(['engines', 'index.mjs', 'package.json', 'search-worker.mjs', 'worker.mjs'])) throw new Error('Runtime contains unexpected assets or source files');
  const archive = (await readdir(ENGINES)).filter(file => file.endsWith('.mjs')).sort();
  if (JSON.stringify((await readdir(join(scratch, 'runtime/engines'))).sort()) !== JSON.stringify(archive)) throw new Error('Runtime engines differ from the engine archive');
  const fixtures = await Promise.all(archive.map(file => readFile(join(ENGINES, file.replace(/\.mjs$/, '.save.json')), 'utf8')));
  await writeFile(join(scratch, 'runtime/probe.mjs'), `
import assert from 'node:assert/strict';
import { createMatch, loadMatch } from './index.mjs';
import { readFileSync } from 'node:fs';
const match = await createMatch({ kings: 'Flame:Haste,none', fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1' });
let restored;
try {
  const first = await match.apply({ id: 'haste', expectedRevision: 0, lan: 'Ra1-a2!H' });
  assert.equal(first.turn, 0); assert.equal(first.ply, 1);
  assert.deepEqual(first.rules.hands, [[], []]); assert(!('piles' in first.rules));
  assert.deepEqual(first.moves.map(m => m.lan), first.legal);
  const lan = await match.chooseMove({ maxTimeMs: 25, maxDepth: 2 });
  assert(first.legal.includes(lan)); assert.deepEqual(await match.snapshot(), first);
  const second = await match.apply({ id: 'ai', expectedRevision: 1, lan });
  const save = await match.exportSave();
  const engine = JSON.parse(save).engine; assert.match(engine, /^sha256:[a-f0-9]{64}$/);
  assert(readFileSync('worker.mjs', 'utf8').includes(engine), 'the build stamps the worker with its fingerprint');
  assert(readFileSync('engines/' + engine.slice(7) + '.mjs', 'utf8').includes(engine), 'the current engine is archived');
  restored = await loadMatch(save);
  assert.deepEqual(await restored.snapshot(), second);
  for (const fixture of ${JSON.stringify(fixtures)}) {
    const old = await loadMatch(fixture);
    try { const { revision, legal } = await old.snapshot(); assert.equal((await old.apply({ id: 'archive', expectedRevision: revision, lan: legal[0] })).revision, revision + 1); }
    finally { await old.close(); }
  }
  console.log('Source-free runtime: Haste, bounded AI, public DTO, apply, save/reload and ${archive.length} archived engine(s) passed');
} finally { await match.close(); await restored?.close(); }
`);
  const { stdout } = await promisify(execFile)(process.execPath, ['probe.mjs'], { cwd: join(scratch, 'runtime'), timeout: 20000 });
  console.log(stdout.trim());
} finally { await rm(scratch, { recursive: true, force: true }); }
