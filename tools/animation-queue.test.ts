import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { queueAction } from './anim/queue.mjs';
import { dispatch } from './anim/dispatch.mjs';

let dir = '';
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });
// The dispatcher keeps a 30 GiB free-space rule for real runs; a test machine is not the place for that limit.
process.env.KINGDOWN_ANIM_MIN_FREE_GIB = '0';

it('claims each job once across processes and enforces transitions', async () => {
  dir = await mkdtemp(join(tmpdir(), 'animation-queue-'));
  const path = join(dir, 'queue.json');
  for (let i = 0; i < 6; i++) await queueAction(path, 'add', { job: { number: i } });
  const claim = (i: number) => new Promise<any>((resolve, reject) => {
    const child = spawn(process.execPath, ['tools/anim/queue.mjs', 'claim', '--queue', path, '--worker', `worker-${i}`]);
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
  });
  const claims = await Promise.all(Array.from({ length: 8 }, (_, i) => claim(i)));
  const claimed = claims.filter(Boolean);
  expect(claimed).toHaveLength(6);
  expect(new Set(claimed.map(job => job.id)).size).toBe(6);
  const job = claimed[0];
  await expect(queueAction(path, 'done', { id: job.id, worker: 'wrong', candidate: dir })).rejects.toThrow('claiming worker');
  await queueAction(path, 'done', { id: job.id, worker: job.worker, candidate: dir });
  await queueAction(path, 'accept', { id: job.id });
  await expect(queueAction(path, 'accept', { id: job.id })).rejects.toThrow('Invalid transition');
  expect(JSON.parse(await readFile(path, 'utf8')).filter((item: any) => item.status === 'accepted')).toHaveLength(1);
});

it('dispatches jobs and records bank failures', async () => {
  dir = await mkdtemp(join(tmpdir(), 'animation-dispatch-'));
  const path = join(dir, 'queue.json'), bank = join(dir, 'bank.mjs');
  await writeFile(bank, `const keys = process.argv[process.argv.indexOf('--keys') + 1];
if (keys === 'bad') { console.error('bad keys'); process.exit(1); }
console.log(JSON.stringify({ candidate: keys }));\n`);
  const job = { character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys: join(dir, 'candidate') };
  await writeFile(job.keys, '{}');
  await queueAction(path, 'add', { job });
  await queueAction(path, 'add', { job: { ...job, keys: 'bad' } });
  await expect(dispatch({ queue: path, bank: join(dir, 'missing.mjs') })).rejects.toThrow();
  expect((await queueAction(path, 'list')).map((item: any) => item.status)).toEqual(['todo', 'todo']);
  await expect(dispatch({ queue: path, slots: 2, bank })).rejects.toThrow('One or more bank jobs failed');
  const jobs = await queueAction(path, 'list');
  expect(jobs.map((item: any) => item.status)).toEqual(['candidate', 'rejected']);
  expect(jobs[0].candidate).toBe(job.keys);
  expect(jobs[1].reason).toContain('bad keys');
});
