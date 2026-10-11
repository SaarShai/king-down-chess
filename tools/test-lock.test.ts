// The test lock (tools/test-lock.sh): one `npm test` at a time in all worktrees of a clone.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const script = fileURLToPath(new URL('./test-lock.sh', import.meta.url));
const dirs: string[] = [], pids: number[] = [];
afterEach(() => {
  while (pids.length) try { process.kill(pids.pop()!); } catch { /* ended */ }
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** A new git clone with a second worktree. */
function clone(): { main: string; side: string } {
  const dir = mkdtempSync(join(tmpdir(), 'kingdown-test-lock-'));
  dirs.push(dir);
  const main = join(dir, 'main'), side = join(dir, 'side');
  const git = (...args: string[]) => spawnSync('git', args, { cwd: main, encoding: 'utf8' });
  spawnSync('git', ['init', '-q', main]);
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'start');
  git('worktree', 'add', '-q', '--detach', side);
  return { main, side };
}
/** The caller's environment without its own lock mark (this file runs inside the lock of `npm test`). */
const env = (extra: Record<string, string> = {}) => {
  const e: Record<string, string | undefined> = { ...process.env };
  delete e.KINGDOWN_TEST_LOCKED;
  return { ...e, ...extra };
};
const run = (cwd: string, args: string[], extra?: Record<string, string>) =>
  spawnSync('bash', [script, ...args], { cwd, encoding: 'utf8', env: env(extra) });
/** A run that holds the lock until the test ends; it prints the pid of its child `sleep`. */
async function hold(cwd: string): Promise<{ run: ChildProcess; child: number }> {
  const held = spawn('bash', [script, 'sh', '-c', 'sleep 60 & echo $!; wait'], { cwd, env: env() });
  pids.push(held.pid!);
  const child = Number(await new Promise<string>(done => held.stdout!.once('data', d => done(String(d)))));
  pids.push(child);
  return { run: held, child };
}

it('a run in a second worktree waits while another holds the lock, then gives up with exit 75', async () => {
  const { main, side } = clone();
  await hold(main);
  const start = Date.now();
  const second = run(side, ['echo', 'ran'], { KINGDOWN_TEST_LOCK_WAIT: '2' });
  expect(second.stderr).toContain('waiting for the test lock');
  expect([second.status, second.stdout]).toEqual([75, '']);
  expect(Date.now() - start).toBeGreaterThan(1500);
});

it('the processes of a run keep the lock after the run itself is killed; then it frees', async () => {
  const { main, side } = clone();
  const { run: held, child } = await hold(main);
  held.kill('SIGKILL');
  await new Promise(done => held.once('exit', done));
  expect(run(side, ['echo', 'ran'], { KINGDOWN_TEST_LOCK_WAIT: '1' }).status).toBe(75);
  process.kill(child);
  await new Promise(done => setTimeout(done, 300));
  const after = run(side, ['sh', '-c', 'echo "$KINGDOWN_TEST_LOCKED"']);
  expect([after.status, after.stdout.trim(), after.stderr]).toEqual([0, '1', '']);
});

it('a nested run takes no lock; a run outside git runs with none', async () => {
  const { main } = clone();
  await hold(main);
  const nested = run(main, ['echo', 'nested'], { KINGDOWN_TEST_LOCKED: '1', KINGDOWN_TEST_LOCK_WAIT: '1' });
  expect([nested.status, nested.stdout.trim(), nested.stderr]).toEqual([0, 'nested', '']);
  const outside = mkdtempSync(join(tmpdir(), 'kingdown-test-lock-out-'));
  dirs.push(outside);
  expect(run(outside, ['echo', 'outside'], { GIT_CEILING_DIRECTORIES: tmpdir() }).stdout.trim()).toBe('outside');
});
