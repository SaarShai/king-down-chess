// push-main test: the real tools/push-main.sh in a temporary repository with the real hooks (tools/lib/temp-repo.mjs).
// The hooks path is absolute, as in a clone of this repository, so the pre-push hook runs in the script's worktree too.
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const script = fileURLToPath(new URL('./push-main.sh', import.meta.url));
type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

/**
 * A checkout of main with one commit on the remote and a second one, not yet pushed. The commits hold the
 * fixture package, so that the hook's `npm test` runs in a worktree of them; with `testFails`, that test fails.
 */
function setup({ testFails = false } = {}) {
  const repo = tempRepo();
  repos.push(repo);
  repo.git('config', 'core.hooksPath', join(repo.dir, '.githooks'));
  repo.write('notes.md', 'one\n');
  if (testFails) repo.write('.fixture/test.fail', 'the fixture test fails\n');
  repo.git('add', '-f', 'notes.md', 'package.json', 'fixture.mjs', ...(testFails ? ['.fixture/test.fail'] : []));
  repo.git('commit', '-q', '-m', 'start');
  expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
  repo.write('notes.md', 'two\n');
  repo.git('add', 'notes.md');
  repo.git('commit', '-q', '-m', 'second');
  return repo;
}
const remoteMain = (repo: Repo) => repo.run('git', ['rev-parse', 'main'], { cwd: repo.remote }).stdout.trim();
const worktrees = (repo: Repo) => repo.git('worktree', 'list').stdout.trim().split('\n').length;

describe('push-main.sh', { timeout: 60_000 }, () => {
  it('pushes the tip of main from a clean worktree while another edit sits in the checkout, from any worktree', () => {
    const repo = setup();
    const sha = repo.git('rev-parse', 'HEAD').stdout.trim();
    repo.write('notes.md', 'three\n'); // another session's uncommitted edit
    const side = join(repo.root, 'side'); // a worktree of another branch: the default is still main's tip
    repo.git('worktree', 'add', '-q', '-b', 'side', side, 'HEAD~1');
    const direct = repo.git('push', 'origin', 'main');
    expect(direct.status).not.toBe(0);
    expect(direct.stderr).toContain('differ from HEAD');
    expect(direct.stderr).toContain('tools/push-main.sh');
    const run = repo.run('bash', [script], { cwd: side });
    expect(run.status, run.stderr).toBe(0);
    expect(remoteMain(repo)).toBe(sha);
    expect(worktrees(repo)).toBe(2);
    expect(repo.read('notes.md')).toBe('three\n');
  });

  it('runs the hook in its worktree, and removes the worktree when the hook refuses', () => {
    const repo = setup({ testFails: true });
    const before = remoteMain(repo);
    const run = repo.run('bash', [script]);
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('the fixture test fails');
    expect(run.stderr).toContain('npm test failed');
    expect(remoteMain(repo)).toBe(before);
    expect(worktrees(repo)).toBe(1);
  });

  it('refuses a commit that is not on main, and sends nothing on a dry run', () => {
    const repo = setup();
    const main = repo.git('rev-parse', 'HEAD').stdout.trim();
    const before = remoteMain(repo);
    repo.git('switch', '-q', '-c', 'side');
    repo.write('side.md', 'side\n');
    repo.git('add', 'side.md');
    repo.git('commit', '-q', '-m', 'side');
    const side = repo.git('rev-parse', 'HEAD').stdout.trim();
    const refused = repo.run('bash', [script, side]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('not on the local main branch');
    const dry = repo.run('bash', [script, '--dry-run', main]);
    expect(dry.status, dry.stderr).toBe(0);
    expect(remoteMain(repo)).toBe(before);
    expect(worktrees(repo)).toBe(1);
  });
});
