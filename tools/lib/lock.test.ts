// Lock unit test for the browser-check runner (checks-and-hooks/06, story 12).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lockPath, takeLock } from './lock.mjs';
import { tempRepo } from './temp-repo.mjs';

const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'lock-test-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'check-browser.lock');
}

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('takeLock(path)', () => {
  it('makes the lock file and frees it', async () => {
    const path = scratch();
    const release = await takeLock(path, { onWait: () => {} });
    expect(JSON.parse(readFileSync(path, 'utf8')).pid).toBe(process.pid);
    release();
    expect(existsSync(path)).toBe(false);
  });

  it('makes a second taker wait with one wait line, and gives it the lock when the first frees it', async () => {
    const path = scratch();
    const releaseFirst = await takeLock(path, { onWait: () => {} });
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
    expect(JSON.parse(readFileSync(path, 'utf8')).pid).toBe(process.pid);
    releaseSecond();
    expect(existsSync(path)).toBe(false);
  });

  it('takes the lock of a process that no longer exists', async () => {
    const path = scratch();
    const dead = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout;
    writeFileSync(path, JSON.stringify({ pid: Number(dead), cwd: '/gone' }));
    const lines: string[] = [];
    const release = await takeLock(path, { onWait: line => lines.push(line), pollMs: 10 });
    expect(JSON.parse(readFileSync(path, 'utf8')).pid).toBe(process.pid);
    release();
  });

  it('does not free a lock that another taker holds now', async () => {
    const path = scratch();
    const release = await takeLock(path, { onWait: () => {} });
    writeFileSync(path, JSON.stringify({ pid: process.ppid, cwd: '/other' }));
    release();
    expect(JSON.parse(readFileSync(path, 'utf8')).pid).toBe(process.ppid);
  });
});

describe('lockPath(dir)', () => {
  it('is in git\'s common directory, the same for two worktrees', () => {
    const repo = tempRepo({ hooks: false });
    cleanups.push(repo.cleanup);
    repo.write('a.txt', 'a\n');
    repo.git('add', '-A');
    repo.git('commit', '-q', '-m', 'start');
    const second = join(repo.root, 'second');
    expect(repo.git('worktree', 'add', '-q', second).status).toBe(0);
    const common = realpathSync(join(repo.dir, '.git'));
    expect(lockPath(repo.dir)).toBe(join(common, 'check-browser.lock'));
    expect(lockPath(second)).toBe(lockPath(repo.dir));
  });
});
