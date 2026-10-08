/** Build, then exercise only the copied artifact: no sources, tsx, or dependencies. */
import { buildRuntime } from './plugin-runtime-build.mjs';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const scratch = await mkdtemp(join(tmpdir(), 'kingdown-runtime-'));
try {
  await buildRuntime(join(scratch, 'runtime'));
  const files = (await readdir(join(scratch, 'runtime'))).sort();
  if (JSON.stringify(files) !== JSON.stringify(['index.mjs', 'package.json', 'worker.mjs'])) throw new Error('Runtime contains unexpected assets or source files');
  await writeFile(join(scratch, 'runtime/probe.mjs'), `
import assert from 'node:assert/strict';
import { createMatch, loadMatch } from './index.mjs';
const match = await createMatch({ kings: 'Flame:Haste,none', fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1' });
let restored;
try {
  const first = await match.apply({ id: 'haste', expectedRevision: 0, lan: 'Ra1-a2!H' });
  assert.equal(first.turn, 0); assert.equal(first.ply, 1);
  assert(!('hands' in first.rules)); assert(!('piles' in first.rules));
  assert.deepEqual(first.moves.map(m => m.lan), first.legal);
  const lan = await match.chooseMove({ maxTimeMs: 25, maxDepth: 2 });
  assert(first.legal.includes(lan)); assert.deepEqual(await match.snapshot(), first);
  const second = await match.apply({ id: 'ai', expectedRevision: 1, lan });
  const save = await match.exportSave();
  assert.match(JSON.parse(save).engine, /^sha256:[a-f0-9]{64}$/);
  restored = await loadMatch(save);
  assert.deepEqual(await restored.snapshot(), second);
  console.log('Source-free runtime: Haste, bounded AI, public DTO, apply, save/reload passed');
} finally { await match.close(); await restored?.close(); }
`);
  const { stdout } = await promisify(execFile)(process.execPath, ['probe.mjs'], { cwd: join(scratch, 'runtime'), timeout: 20000 });
  console.log(stdout.trim());
} finally { await rm(scratch, { recursive: true, force: true }); }
