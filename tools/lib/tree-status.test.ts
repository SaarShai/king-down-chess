// Status unit test for the browser-check runner's changed-file guard (checks-and-hooks/06, story 11).
// Each case changes a real temporary repository and compares two snapshots of its working-tree status.
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './temp-repo.mjs';
import { changedPaths, treeStatus } from './tree-status.mjs';

const repos: { cleanup(): void }[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

/** A repository with two committed files, a.txt and b.txt. */
function repo() {
  const r = tempRepo({ hooks: false });
  repos.push(r);
  r.write('a.txt', 'a\n');
  r.write('b.txt', 'b\n');
  r.git('add', '-A');
  r.git('commit', '-q', '-m', 'start');
  return r;
}

describe('changedPaths(before, after)', () => {
  it('is empty when nothing changes', () => {
    const r = repo();
    expect(changedPaths(treeStatus(r.dir), treeStatus(r.dir))).toEqual([]);
  });

  it('names a changed tracked file', () => {
    const r = repo();
    const before = treeStatus(r.dir);
    r.write('a.txt', 'changed\n');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual(['a.txt']);
  });

  it('names a new untracked file, also inside a new folder', () => {
    const r = repo();
    const before = treeStatus(r.dir);
    r.write('new/deep/scratch.txt', 'x\n');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual(['new/deep/scratch.txt']);
  });

  it('names a deleted file', () => {
    const r = repo();
    const before = treeStatus(r.dir);
    r.remove('b.txt');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual(['b.txt']);
  });

  it('does not name a file that was dirty before and did not change', () => {
    const r = repo();
    r.write('a.txt', 'dirty\n');
    r.write('loose.txt', 'untracked\n');
    const before = treeStatus(r.dir);
    expect(changedPaths(before, treeStatus(r.dir))).toEqual([]);
  });

  it('names a file that was dirty before and changed again', () => {
    const r = repo();
    r.write('a.txt', 'dirty\n');
    r.write('loose.txt', 'untracked\n');
    const before = treeStatus(r.dir);
    r.write('a.txt', 'dirtier\n');
    r.write('loose.txt', 'changed\n');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual(['a.txt', 'loose.txt']);
  });

  it('names a dirty file that a check restores to the committed text', () => {
    const r = repo();
    r.write('a.txt', 'dirty\n');
    const before = treeStatus(r.dir);
    r.write('a.txt', 'a\n');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual(['a.txt']);
  });

  it('does not name an ignored file', () => {
    const r = repo();
    r.write('.gitignore', 'out/\n');
    const before = treeStatus(r.dir);
    r.write('out/shot.png', 'png\n');
    expect(changedPaths(before, treeStatus(r.dir))).toEqual([]);
  });
});

describe('the shared check module', () => {
  it('gives tempRepo(), so that check authors import one module', async () => {
    const checks = await import('./checks.mjs');
    expect(checks.tempRepo).toBe(tempRepo);
  });
});
