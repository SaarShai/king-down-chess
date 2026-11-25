// The test lock (tools/test-lock.sh): one `npm test` at a time in all worktrees of a clone.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

it('a run in a second worktree waits while another holds the lock, names the holder, then gives up with exit 75', async () => {
  const { main, side } = clone();
  const { run: held } = await hold(main);
  const start = Date.now();
  const second = run(side, ['echo', 'ran'], { KINGDOWN_TEST_LOCK_WAIT: '2' });
  expect(second.stderr).toContain(`waiting for the test lock (${realpathSync(main)}/.git/kingdown-test.lock; held by pid ${held.pid}, ${realpathSync(main)})`);
  expect([second.status, second.stdout]).toEqual([75, '']);
  expect(Date.now() - start).toBeGreaterThan(1500);
});

it('the processes of a run keep the lock after the run itself is killed; then it frees', async () => {
  const { main, side } = clone();
  const { run: held, child } = await hold(main);
  held.kill('SIGKILL');
  await new Promise(done => held.once('exit', done));
  const waiting = run(side, ['echo', 'ran'], { KINGDOWN_TEST_LOCK_WAIT: '1' });
  expect(waiting.status).toBe(75);
  // The record names the killed run, which no longer runs: the line must not call it the holder.
  expect(waiting.stderr).toContain(`holder unknown, last record: pid ${held.pid}, ${realpathSync(main)}, ended)`);
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

it('a holder record that cannot be written or read does not stop a run', async () => {
  const { main, side } = clone();
  mkdirSync(join(main, '.git/kingdown-test.lock.holder'));
  const { run: held, child } = await hold(main);
  const waiting = run(side, ['echo', 'ran'], { KINGDOWN_TEST_LOCK_WAIT: '1' });
  expect([waiting.status, waiting.stderr]).toEqual([75, `test-lock: waiting for the test lock (${realpathSync(main)}/.git/kingdown-test.lock)\n`]);
  process.kill(child);
  await new Promise(done => held.once('exit', done));
  const after = run(side, ['echo', 'ran']);
  expect([after.status, after.stdout, after.stderr]).toEqual([0, 'ran\n', '']);
});

it('a named pipe or a link in place of the holder record does not stop a run, and the link target stays', () => {
  const { main, side } = clone(), record = join(main, '.git/kingdown-test.lock.holder'), target = join(main, 'target.txt');
  // An open of a named pipe waits for the other end: the run must not open it.
  expect(spawnSync('mkfifo', [record]).status).toBe(0);
  const piped = spawnSync('bash', [script, 'echo', 'ran'], { cwd: side, encoding: 'utf8', env: env(), timeout: 10_000 });
  expect([piped.status, piped.stdout, piped.stderr]).toEqual([0, 'ran\n', '']);
  rmSync(record);
  writeFileSync(target, 'keep');
  symlinkSync(target, record);
  const linked = run(side, ['echo', 'ran']);
  expect([linked.status, linked.stdout, readFileSync(target, 'utf8')]).toEqual([0, 'ran\n', 'keep']);
});
