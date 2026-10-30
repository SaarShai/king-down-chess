import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, stat, statfs } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultQueue, queueAction } from './queue.mjs';

const fields = ['character', 'army', 'kind', 'facing', 'keys', 'timing', 'output'];
export const minFreeBytes = () => Number(process.env.KINGDOWN_ANIM_MIN_FREE_GIB ?? 30) * 1024 ** 3;

export async function dispatch({ queue = defaultQueue, slots = 1, bank = fileURLToPath(new URL('./bank.mjs', import.meta.url)) } = {}) {
  if (!Number.isSafeInteger(slots) || slots < 1) throw Error('slots must be a positive integer');
  await access(bank);
  let failed = false;
  async function worker() {
    const worker = `${process.pid}-${randomUUID()}`;
    for (;;) {
      const disk = await statfs('/');
      if (disk.bavail * disk.bsize < minFreeBytes()) throw Error(`This Mac has less than ${Number(process.env.KINGDOWN_ANIM_MIN_FREE_GIB ?? 30)} GiB free`);
      const claim = await queueAction(queue, 'claim', { worker });
      if (!claim) return;
      try {
        const job = claim.job;
        if (!job || typeof job !== 'object' || Object.keys(job).some(key => !fields.includes(key))) throw Error('Invalid bank job fields');
        for (const key of fields.slice(0, 5)) if (typeof job[key] !== 'string' || !job[key]) throw Error(`Job needs ${key}`);
        const args = ['make'];
        for (const key of fields) if (job[key] != null) {
          if (typeof job[key] !== 'string' || !job[key]) throw Error(`Invalid ${key}`);
          args.push(`--${key}`, job[key]);
        }
        const output = await new Promise((done, reject) => {
          const child = spawn(process.execPath, [bank, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
          let stdout = '', stderr = '';
          child.stdout.on('data', data => { stdout += data; });
          child.stderr.on('data', data => { stderr += data; });
          child.on('error', reject);
          child.on('close', code => code === 0 ? done(stdout) : reject(Error(stderr.trim() || `bank exited ${code}`)));
        });
        const result = JSON.parse(output);
        if (typeof result.candidate !== 'string' || !result.candidate) throw Error('Bank returned no candidate path');
        if (!(await stat(result.candidate)).isFile()) throw Error('Bank candidate is not a file');
        await queueAction(queue, 'done', { worker, id: claim.id, candidate: result.candidate });
        console.log(`${claim.id}: candidate ${result.candidate}`);
      } catch (error) {
        failed = true;
        await queueAction(queue, 'fail', { worker, id: claim.id, reason: String(error.message) });
        console.error(`${claim.id}: ${error.message}`);
      }
    }
  }
  const results = await Promise.allSettled(Array.from({ length: slots }, worker));
  const stopped = results.find(result => result.status === 'rejected');
  if (stopped) throw stopped.reason;
  if (failed) throw Error('One or more bank jobs failed');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!['--queue', '--slots'].includes(args[i]) || args[i + 1] == null) throw Error('Use --slots N [--queue path]');
      options[args[i].slice(2)] = args[i + 1];
    }
    if (options.slots != null) options.slots = Number(options.slots);
    await dispatch(options);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
