// Git-hook test for pre-push (checks-and-hooks/04). Each case drives the real hook through a real
// `git push` from a temporary repository to its bare remote.
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from '../lib/temp-repo.mjs';

type Repo = ReturnType<typeof tempRepo>;
type Call = { name: string; args: string[]; stdin: string; git: string[] };

const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

/** A temporary repository whose main holds one commit on the remote (pushed past the hooks). */
const make = () => {
  const repo = tempRepo();
  repos.push(repo);
  repo.write('README.md', 'seed\n');
  commit(repo, 'seed');
  expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
  return repo;
};
/** Commits every change in the work tree; the commit skips the hooks, so that only pre-push logs calls. */
const commit = (repo: Repo, message = 'change') => {
  repo.git('add', '-A');
  const result = repo.git('commit', '-q', '--no-verify', '-m', message);
  expect(result.status, result.stderr).toBe(0);
  return repo.git('rev-parse', 'HEAD').stdout.trim();
};
/** Changes one file and commits it. `git add -f` also takes the files that tempRepo() excludes (the hooks, the package file). */
const change = (repo: Repo, path: string) => {
  repo.write(path, path === 'package.json'
    ? JSON.stringify({ ...JSON.parse(repo.read(path)), description: String(Math.random()) })
    : `${path} ${Math.random()}\n`);
  repo.git('add', '-f', path);
  return commit(repo, `change ${path}`);
};
const calls = (repo: Repo): Call[] =>
  repo.exists('.fixture/calls.jsonl') ? repo.read('.fixture/calls.jsonl').trim().split('\n').map(line => JSON.parse(line)) : [];
const remoteHead = (repo: Repo, branch: string) => repo.git('--git-dir', repo.remote, 'rev-parse', '-q', '--verify', `refs/heads/${branch}`).stdout.trim();

describe('pre-push', () => {
  it('story 3: each push runs the package test script, and a push that passes reaches the remote', () => {
    const repo = make();
    const head = change(repo, 'docs/a.md');
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status, push.stderr).toBe(0);
    expect(calls(repo).map(c => c.name)).toEqual(['test', 'gate']);
    expect(remoteHead(repo, 'feature')).toBe(head);
  });

  it('story 3: a failed test refuses the push, and the test output shows', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    repo.write('.fixture/test.fail', 'FAIL src/rules.test.ts > a king move\n');
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toContain('FAIL src/rules.test.ts > a king move');
    expect(push.stderr).toMatch(/pre-push: npm test failed/);
    expect(remoteHead(repo, 'feature')).toBe('');
  });

  it('story 9: the gate gets `push`, the remote name, the URL and git\'s stdin lines; the test gets no GIT_ variable', () => {
    const repo = make();
    const base = repo.git('rev-parse', 'HEAD').stdout.trim();
    const head = change(repo, 'docs/a.md');
    expect(repo.git('push', 'origin', 'HEAD:refs/heads/feature', 'HEAD:refs/heads/main').status).toBe(0);
    const [test, gate] = calls(repo);
    expect(test.git).toEqual([]);
    expect(gate.args).toEqual(['push', 'origin', repo.remote]);
    expect(gate.stdin.trim().split('\n').sort()).toEqual([
      `HEAD ${head} refs/heads/feature ${'0'.repeat(40)}`,
      `HEAD ${head} refs/heads/main ${base}`,
    ]);
    expect(gate.git).toEqual(expect.arrayContaining(['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_SYSTEM']));
  });

  it('story 9: a gate that exits 1 refuses the push, and its stderr shows', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    repo.write('.fixture/gate.fail', 'gate: secret: the value of KAGGLE_KEY is in docs/a.md\n');
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toContain('gate: secret: the value of KAGGLE_KEY is in docs/a.md');
    expect(push.stderr).toContain('repo gate refused the push');
    expect(remoteHead(repo, 'feature')).toBe('');
  });

  it('story 9: a package with no gate script refuses and says that the gate is missing', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    const pkg = JSON.parse(repo.read('package.json'));
    delete pkg.scripts.gate;
    repo.write('package.json', JSON.stringify(pkg));
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toMatch(/gate is missing/);
  });

  it('a branch deletion pushes without a test run', () => {
    const repo = make();
    expect(repo.git('push', '-q', '--no-verify', 'origin', 'HEAD:refs/heads/old').status).toBe(0);
    repo.write('.fixture/test.fail', 'the test must not run\n');
    const push = repo.git('push', 'origin', '--delete', 'old');
    expect(push.status, push.stderr).toBe(0);
    expect(calls(repo)).toEqual([]);
    expect(remoteHead(repo, 'old')).toBe('');
  });

  it('a push of a commit that is not HEAD is refused, and the refusal names the fix', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    expect(repo.git('branch', 'other').status).toBe(0);
    change(repo, 'docs/b.md');
    const push = repo.git('push', 'origin', 'other');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toMatch(/refs\/heads\/other is not HEAD/);
    expect(push.stderr).toContain('git switch other');
    expect(calls(repo)).toEqual([]);
    expect(remoteHead(repo, 'other')).toBe('');
  });

  it('a push with a tracked file changed but not committed is refused, and the refusal names the fix', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    repo.write('README.md', 'changed, not committed\n');
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toContain('README.md');
    expect(push.stderr).toMatch(/Commit or stash them/);
    expect(calls(repo)).toEqual([]);
    expect(remoteHead(repo, 'feature')).toBe('');
  });

  it('an untracked file does not refuse the push', () => {
    const repo = make();
    change(repo, 'docs/a.md');
    repo.write('scratch.txt', 'untracked\n');
    const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
    expect(push.status, push.stderr).toBe(0);
  });

  describe('story 4: a direct push to main', () => {
    const protectedFiles = ['src/a.ts', 'public/a.txt', 'index.html', 'package.json', 'package-lock.json',
      'supabase/migrations/a.sql', '.githooks/a.txt', '.claude/settings.json', 'tools/a.mjs', 'plugin-deploy/runtime-role.sql', 'vercel.json'];

    it.each(protectedFiles)('that changes %s is refused, and the output names the path and the fix', path => {
      const repo = make();
      const base = remoteHead(repo, 'main');
      change(repo, 'docs/a.md');
      change(repo, path);
      const push = repo.git('push', 'origin', 'main');
      expect(push.status).not.toBe(0);
      expect(push.stderr).toContain(`    ${path}\n`);
      expect(push.stderr).not.toContain('docs/a.md');
      expect(push.stderr).toMatch(/git switch -c <branch>/);
      expect(push.stderr).toMatch(/pull request into main/);
      expect(calls(repo)).toEqual([]);
      expect(remoteHead(repo, 'main')).toBe(base);
    });

    it('that renames a file out of src/ is refused', () => {
      const repo = make();
      change(repo, 'src/a.ts');
      expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
      expect(repo.git('mv', 'src/a.ts', 'a.ts').status).toBe(0);
      commit(repo, 'move');
      const push = repo.git('push', 'origin', 'main');
      expect(push.status).not.toBe(0);
      expect(push.stderr).toContain('    src/a.ts\n');
    });

    it('that changes only docs passes, after the test and the gate', () => {
      const repo = make();
      const head = change(repo, 'docs/a.md');
      change(repo, 'TASKS.md');
      const push = repo.git('push', 'origin', 'main');
      expect(push.status, push.stderr).toBe(0);
      expect(calls(repo).map(c => c.name)).toEqual(['test', 'gate']);
      expect(remoteHead(repo, 'main')).not.toBe(head);
      expect(remoteHead(repo, 'main')).toBe(repo.git('rev-parse', 'HEAD').stdout.trim());
    });

    it('a push of src/ to a branch passes, after the test', () => {
      const repo = make();
      change(repo, 'src/a.ts');
      const push = repo.git('push', 'origin', 'HEAD:refs/heads/feature');
      expect(push.status, push.stderr).toBe(0);
      expect(calls(repo).map(c => c.name)).toEqual(['test', 'gate']);
    });
  });

  it('story 5: a push to main with no known remote head is refused with "fetch first"', () => {
    const repo = make();
    const clone = `${repo.root}/clone`;
    expect(repo.git('clone', '-q', repo.remote, clone).status).toBe(0);
    const inClone = (...args: string[]) => repo.run('git', args, { cwd: clone });
    inClone('config', 'user.name', 'Other');
    inClone('config', 'user.email', 'other@example.invalid');
    repo.run('sh', ['-c', 'echo other > other.md'], { cwd: clone });
    inClone('add', 'other.md');
    expect(inClone('commit', '-q', '-m', 'other').status).toBe(0);
    expect(inClone('push', '-q', 'origin', 'main').status).toBe(0);

    change(repo, 'docs/a.md');
    const push = repo.git('push', 'origin', 'main');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toContain('fetch first');
    expect(push.stderr).toContain('git fetch origin');
    expect(calls(repo)).toEqual([]);
  });

  it('story 5: a push to a main that the remote does not have is refused with "fetch first"', () => {
    const repo = tempRepo();
    repos.push(repo);
    change(repo, 'docs/a.md');
    const push = repo.git('push', 'origin', 'main');
    expect(push.status).not.toBe(0);
    expect(push.stderr).toContain('fetch first');
    expect(remoteHead(repo, 'main')).toBe('');
  });
});
