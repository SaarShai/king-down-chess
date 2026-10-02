/** A worker thread that runs a TypeScript entry under tsx; see `./worker-boot.mjs` for why. */
import { Worker, type WorkerOptions } from 'node:worker_threads';

const BOOT = new URL('./worker-boot.mjs', import.meta.url);

export function tsWorker(entry: URL, opts: WorkerOptions = {}): Worker {
  return new Worker(BOOT, { ...opts, argv: [...(opts.argv ?? []), entry.href] });
}
