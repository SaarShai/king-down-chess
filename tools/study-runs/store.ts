import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync, openSync, closeSync, fsyncSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export function atomicText(path: string, value: string, expected?: string): void {
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    const fd = openSync(temp, 'wx', 0o600);
    try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); }
    if (expected !== undefined && readFileSync(path, 'utf8') !== expected) throw new Error('File changed; update stopped.');
    renameSync(temp, path);
    const directory = openSync(dirname(path), 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
  } finally { rmSync(temp, { force: true }); }
}
export function atomicJSON(path: string, value: unknown): void { atomicText(path, JSON.stringify(value, null, 2) + '\n'); }
export function readJSON<T>(path: string): T { return JSON.parse(readFileSync(path, 'utf8')) as T; }
export function validRunId(id: string): void { if (!/^study-\d{8}-[a-f0-9]{12}$/.test(id)) throw new Error('Invalid run ID.'); }
// A kernel lock is released when the studio exits, including a hard stop.
// Its empty file stays outside the result snapshot and is safe to reuse.
const lockProgram = `import fcntl,os,sys
fd=os.open(sys.argv[1],os.O_RDWR|os.O_CREAT|os.O_NOFOLLOW,0o600)
try: fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError: sys.exit(3)
print('locked',flush=True)
sys.stdin.buffer.read()
os.close(fd)
`;
async function kernelLock<T>(path: string, action: () => Promise<T>): Promise<T> {
  const child = spawn('python3', ['-c', lockProgram, path], { stdio: ['pipe', 'pipe', 'ignore'] });
  const closed = new Promise<void>(resolve => child.once('close', () => resolve()));
  child.stdin.on('error', () => {});
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Studio lock timed out.')), 15000);
      child.once('error', () => reject(new Error('Studio lock service is unavailable.')));
      child.once('exit', () => reject(new Error('This run is busy in another studio process.')));
      child.stdout.once('data', data => data.toString().trim() === 'locked' ? resolve() : reject(new Error('Invalid studio lock.')));
    });
    clearTimeout(timer);
    return await action();
  } finally { clearTimeout(timer); child.stdin.end(); child.kill(); await closed; }
}
export function createRunStore(root: string) {
  mkdirSync(root, { recursive: true });
  const queues = new Map<string, Promise<unknown>>();
  async function locked<T>(key: string, action: () => Promise<T>): Promise<T> {
    if (!/^[a-z0-9-]+$/.test(key)) throw new Error('Invalid lock key.');
    const previous = queues.get(key) ?? Promise.resolve();
    const work = previous.catch(() => {}).then(() => kernelLock(join(root, `${key}.lock`), action));
    queues.set(key, work);
    try { return await work; } finally { if (queues.get(key) === work) queues.delete(key); }
  }
  return {
    root, locked,
    path(id: string) { validRunId(id); return join(root, `${id}.json`); },
    ids() { return readdirSync(root).filter(n => /^study-\d{8}-[a-f0-9]{12}\.json$/.test(n)).map(n => n.slice(0, -5)); },
  };
}
