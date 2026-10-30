import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { takeLock } from '../lib/lock.mjs';

export const defaultQueue = '/Users/za/Documents/king down chess (new)/anim-out/queue.json';

export async function queueAction(path, action, options = {}) {
  path = resolve(path);
  await mkdir(dirname(path), { recursive: true });
  const release = await takeLock(`${path}.lock`, { onWait: () => {}, pollMs: 25 });
  try {
    let jobs;
    try { jobs = JSON.parse(await readFile(path, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; jobs = []; }
    if (!Array.isArray(jobs)) throw Error('Queue must be an array');
    let result;
    if (action === 'list') return jobs;
    if (action === 'add') {
      if (!options.job || typeof options.job !== 'object' || Array.isArray(options.job)) throw Error('add needs a job object');
      result = { id: randomUUID(), status: 'todo', job: options.job };
      jobs.push(result);
    } else if (action === 'claim') {
      if (!options.worker) throw Error('claim needs a worker');
      result = jobs.find(job => job.status === 'todo') ?? null;
      if (!result) return null;
      Object.assign(result, { status: 'in-progress', worker: options.worker });
    } else {
      result = jobs.find(job => job.id === options.id);
      if (!result) throw Error('Job not found');
      const transitions = { done: ['in-progress', 'candidate'], fail: ['in-progress', 'rejected'], accept: ['candidate', 'accepted'], reject: ['candidate', 'rejected'] };
      const transition = transitions[action];
      if (!transition || result.status !== transition[0]) throw Error(`Invalid transition: ${result.status} → ${action}`);
      if (['done', 'fail'].includes(action) && (!options.worker || options.worker !== result.worker)) throw Error('Only the claiming worker can finish a job');
      if (action === 'done' && !options.candidate) throw Error('done needs a candidate path');
      if (action === 'fail' && !options.reason) throw Error('fail needs a reason');
      result.status = transition[1];
      if (options.candidate) result.candidate = resolve(options.candidate);
      if (options.reason) result.reason = options.reason;
    }
    const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(jobs, null, 2)}\n`, { flag: 'wx' });
    await rename(temp, path);
    return result;
  } finally { release(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [action, ...args] = process.argv.slice(2);
    const opts = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!args[i].startsWith('--') || args[i + 1] == null) throw Error('Expected --option value');
      opts[args[i].slice(2)] = args[i + 1];
    }
    if (opts.job) opts.job = JSON.parse(await readFile(resolve(opts.job), 'utf8'));
    const result = await queueAction(opts.queue ?? defaultQueue, action, opts);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
