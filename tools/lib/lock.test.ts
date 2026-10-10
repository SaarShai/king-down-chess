// Lock unit test for the browser-check runner (checks-and-hooks/06, story 12; after-redesign/01).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SLOTS, exclusivePath, releaseAll, runLockPath, slotPaths, takeAllSlots, takeLock, takeOver, takeSlot } from './lock.mjs';
import { tempRepo } from './temp-repo.mjs';

const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'lock-test-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'check-browser.lock');
}

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const quiet = { onWait: () => {}, pollMs: 10 };
const holder = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
/** The process id of a process that no longer exists. */
const deadPid = () => Number(spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout);

/** A repository with a second worktree; both work trees share one common directory. */
function twoWorktrees() {
  const repo = tempRepo({ hooks: false });
  cleanups.push(repo.cleanup);
  repo.write('a.txt', 'a\n');
  repo.git('add', '-A');
  repo.git('commit', '-q', '-m', 'start');
  const second = join(repo.root, 'second');
  expect(repo.git('worktree', 'add', '-q', second).status).toBe(0);
  return { repo, main: repo.dir, second, common: realpathSync(join(repo.dir, '.git')) };
}

describe('takeLock(path)', () => {
  it('makes the lock file and frees it', async () => {
    const path = scratch();
    const release = await takeLock(path, quiet);
    expect(holder(path).pid).toBe(process.pid);
    release();
    expect(existsSync(path)).toBe(false);
  });

  it('makes a second taker wait with one wait line, and gives it the lock when the first frees it', async () => {
    const path = scratch();
    const releaseFirst = await takeLock(path, quiet);
    const lines: string[] = [];
    let taken = false;
    const second = takeLock(path, { onWait: line => lines.push(line), pollMs: 10 }).then(release => { taken = true; return release; });
    await tick(150);
    expect(taken).toBe(false);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(String(process.pid));
    releaseFirst();
    const releaseSecond = await second;
    expect(lines).toHaveLength(1);
    expect(holder(path).pid).toBe(process.pid);
    releaseSecond();
    expect(existsSync(path)).toBe(false);
  });

  it('takes the lock of a process that no longer exists', async () => {
    const path = scratch();
    writeFileSync(path, JSON.stringify({ pid: deadPid(), cwd: '/gone' }));
    const release = await takeLock(path, quiet);
    expect(holder(path).pid).toBe(process.pid);
    release();
  });

  it('does not free a lock that another taker holds now', async () => {
    const path = scratch();
    const release = await takeLock(path, quiet);
    writeFileSync(path, JSON.stringify({ pid: process.ppid, cwd: '/other' }));
    release();
    expect(holder(path).pid).toBe(process.ppid);
  });

  it('does not free a newer lease of its own process', async () => {
    const path = scratch();
    const releaseOld = await takeLock(path, quiet);
    releaseOld();
    const releaseNew = await takeLock(path, quiet);
    releaseOld();
    expect(existsSync(path)).toBe(true);
    releaseNew();
    expect(existsSync(path)).toBe(false);
  });

  it('takes over a lock file that cannot be read when it is older than staleMs, and not before', async () => {
    const path = scratch();
    writeFileSync(path, '');
    const lines: string[] = [];
    let taken = false;
    const taker = takeLock(path, { onWait: line => lines.push(line), pollMs: 10, staleMs: 200 }).then(release => { taken = true; return release; });
    await tick(80);
    expect(taken).toBe(false);
    const old = new Date(Date.now() - 1000);
    utimesSync(path, old, old);
    const release = await taker;
    expect(holder(path).pid).toBe(process.pid);
    expect(lines).toHaveLength(1);
    release();
  });
});

describe('takeOver(path, seen)', () => {
  it('removes the stale file whose text it inspected', () => {
    const path = scratch();
    const dead = JSON.stringify({ pid: deadPid(), cwd: '/gone' });
    writeFileSync(path, dead);
    takeOver(path, dead);
    expect(existsSync(path)).toBe(false);
  });

  it('puts a live lease back when another taker replaced the stale file first', () => {
    const path = scratch();
    const dead = JSON.stringify({ pid: deadPid(), cwd: '/gone' });
    const live = JSON.stringify({ pid: process.pid, cwd: '/live', token: 'abc' });
    writeFileSync(path, live); // the other taker removed the dead lease and made this one
    takeOver(path, dead);
    expect(readFileSync(path, 'utf8')).toBe(live);
    expect(readdirSync(dirname(path))).toEqual(['check-browser.lock']); // no .stale file stays
  });
});

describe('releaseAll()', () => {
  it('frees every lease this process holds, the partial set of an exclusive taker included', async () => {
    const { main, common } = twoWorktrees();
    const other = JSON.stringify({ pid: process.ppid, cwd: '/other' });
    writeFileSync(join(common, 'check-slot-1.lock'), other); // slot 1 is taken, so the exclusive taker holds the lock and slot 0 and waits
    const releaseRun = await takeLock(runLockPath(main), quiet);
    const exclusive = takeAllSlots(main, 2, quiet);
    await tick(50);
    expect(existsSync(join(common, 'check-browser.lock'))).toBe(true);
    expect(existsSync(join(common, 'check-slot-0.lock'))).toBe(true);
    releaseAll();
    expect(existsSync(join(common, 'check-browser.lock'))).toBe(false);
    expect(existsSync(join(common, 'check-slot-0.lock'))).toBe(false);
    expect(existsSync(runLockPath(main))).toBe(false);
    expect(holder(join(common, 'check-slot-1.lock')).pid).toBe(process.ppid);
    unlinkSync(join(common, 'check-slot-1.lock'));
    (await exclusive)(); // the waiting taker goes on and frees what it took after the releaseAll
    releaseRun();
    expect(SLOTS).toBe(3);
  });
});

describe('the lock paths', () => {
  it('runLockPath differs for two worktrees; the exclusive path and the slots are shared, in the common directory', () => {
    const { main, second, common } = twoWorktrees();
    expect(runLockPath(main)).toBe(join(common, 'check-run.lock'));
    expect(runLockPath(second)).not.toBe(runLockPath(main));
    expect(runLockPath(second).endsWith('check-run.lock')).toBe(true);
    expect(exclusivePath(main)).toBe(join(common, 'check-browser.lock'));
    expect(exclusivePath(second)).toBe(exclusivePath(main));
    expect(slotPaths(main, 2)).toEqual([join(common, 'check-slot-0.lock'), join(common, 'check-slot-1.lock')]);
    expect(slotPaths(second, 2)).toEqual(slotPaths(main, 2));
  });
});

describe('takeSlot(dir, n) and takeAllSlots(dir, n)', () => {
  it('gives two takers the two slots; a third waits with one line and goes on when a slot frees', async () => {
    const { main, second, common } = twoWorktrees();
    const releaseA = await takeSlot(main, 2, quiet);
    const releaseB = await takeSlot(second, 2, quiet);
    expect(existsSync(join(common, 'check-slot-0.lock'))).toBe(true);
    expect(existsSync(join(common, 'check-slot-1.lock'))).toBe(true);
    const lines: string[] = [];
    let taken = false;
    const third = takeSlot(main, 2, { onWait: line => lines.push(line), pollMs: 10 }).then(release => { taken = true; return release; });
    await tick(100);
    expect(taken).toBe(false);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('all 2 slots are taken');
    releaseA();
    const releaseC = await third;
    expect(lines).toHaveLength(1);
    releaseB();
    releaseC();
    expect(existsSync(join(common, 'check-slot-0.lock'))).toBe(false);
    expect(existsSync(join(common, 'check-slot-1.lock'))).toBe(false);
  });

  it('an exclusive taker takes the exclusive lock and every slot, and frees them all', async () => {
    const { main, common } = twoWorktrees();
    const release = await takeAllSlots(main, 2, quiet);
    for (const name of ['check-browser.lock', 'check-slot-0.lock', 'check-slot-1.lock']) expect(holder(join(common, name)).pid).toBe(process.pid);
    release();
    for (const name of ['check-browser.lock', 'check-slot-0.lock', 'check-slot-1.lock']) expect(existsSync(join(common, name))).toBe(false);
  });

  it('a normal taker waits while an exclusive taker is pending, so a stream of normal takers does not starve it', async () => {
    const { main, second, common } = twoWorktrees();
    const releaseA = await takeSlot(main, 2, quiet);
    let exclusiveTaken = false;
    const exclusive = takeAllSlots(second, 2, quiet).then(release => { exclusiveTaken = true; return release; });
    await tick(50);
    expect(exclusiveTaken).toBe(false);
    expect(holder(join(common, 'check-browser.lock')).pid).toBe(process.pid); // pending: slot 0 is free, slot 1 waits for A
    const lines: string[] = [];
    let normalTaken = false;
    const normal = takeSlot(main, 2, { onWait: line => lines.push(line), pollMs: 10 }).then(release => { normalTaken = true; return release; });
    await tick(100);
    expect(normalTaken).toBe(false);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('an exclusive check waits or runs');
    releaseA();
    const releaseExclusive = await exclusive;
    await tick(50);
    expect(normalTaken).toBe(false);
    releaseExclusive();
    const releaseNormal = await normal;
    expect(lines).toHaveLength(1);
    releaseNormal();
  });

  it('takes over the slot and the pending marker of a process that no longer exists', async () => {
    const { main, common } = twoWorktrees();
    const dead = JSON.stringify({ pid: deadPid(), cwd: '/gone' });
    writeFileSync(join(common, 'check-browser.lock'), dead);
    writeFileSync(join(common, 'check-slot-0.lock'), dead);
    writeFileSync(join(common, 'check-slot-1.lock'), dead);
    const release = await takeSlot(main, 2, quiet);
    expect(holder(join(common, 'check-slot-0.lock')).pid).toBe(process.pid);
    expect(existsSync(join(common, 'check-browser.lock'))).toBe(false);
    release();
  });

  it('a release never removes a slot that another process holds now', async () => {
    const { main, common } = twoWorktrees();
    const release = await takeSlot(main, 1, quiet);
    writeFileSync(join(common, 'check-slot-0.lock'), JSON.stringify({ pid: process.ppid, cwd: '/other' }));
    release();
    expect(holder(join(common, 'check-slot-0.lock')).pid).toBe(process.ppid);
  });
});
