/**
 * Worker-thread entry that can load TypeScript. tsx's `--import` hook reaches the main thread, but
 * on some Node releases (22.x in the cloud sessions) it does not reach worker threads, and a worker
 * that imports `./game` (an extensionless TypeScript import) dies with ERR_MODULE_NOT_FOUND. Each
 * worker therefore registers tsx itself, then imports its real entry, which `tsWorker()` in
 * `./ts-worker.ts` passes as the last `argv` entry. Registering on a Node where the hook already
 * reached the worker is harmless: the second resolver only sees what the first one passed on.
 */
import { register } from 'tsx/esm/api';

register();
await import(process.argv[process.argv.length - 1]);
