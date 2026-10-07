// Deploy script test (secrets-and-public-gates/09). Each case runs the real tools/deploy.sh in a
// temporary repository with a bare remote. Stub `npm` and `npx` on PATH write each call to a log,
// with the commit and the folder of the call. The browser-check runner is `npm run check:browser`,
// so the `npm` stub also logs the runner. Origin/main holds a stub `tools/wt.sh`, because the deploy
// script calls the `wt` of the commit that it tests; the stub logs `wt add <path>`.
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const script = fileURLToPath(new URL('./deploy.sh', import.meta.url));

type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

const stub = (path: string, lines: string[]) => {
  writeFileSync(path, ['#!/bin/sh', ...lines, ''].join('\n'));
  chmodSync(path, 0o755);
};

/** A work tree whose origin/main holds the stub wt script, and stub npm and npx on PATH. */
function setup() {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const log = join(repo.root, 'calls.log');
  const started = join(repo.root, 'started');
  const record = `echo "$(basename "$0") $* @ $(git rev-parse HEAD) in $(pwd -P)" >> "${log}"`;
  mkdirSync(join(repo.dir, 'tools'));
  stub(join(repo.dir, 'tools', 'wt.sh'), [record]);
  repo.write('app.txt', 'one\n');
  repo.git('add', '.');
  repo.git('commit', '-q', '-m', 'one');
  repo.git('push', '-q', 'origin', 'main');
  const bin = join(repo.root, 'bin');
  mkdirSync(bin);
  // STUB_FAIL=<first argument> makes that call fail; STUB_HANG=<first argument> makes it wait.
  const behave = [
    record,
    `if [ "$1" = "$STUB_HANG" ]; then touch "${started}"; sleep 30; fi`,
    'if [ "$1" = "$STUB_FAIL" ]; then exit 1; fi',
  ];
  stub(join(bin, 'npm'), behave);
  stub(join(bin, 'npx'), behave);
  const env = { PATH: `${bin}:${repo.env.PATH}`, STUB_FAIL: '', STUB_HANG: '' };
  const deploy = (args: string[] = [], extra: Record<string, string> = {}) => repo.run(script, args, { env: { ...env, ...extra } });
  const calls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []);
  return { repo, env, deploy, calls, started };
}

/** The deploy worktree path that the script prints on its first line. */
const worktreeOf = (stdout: string) => /^deploy: worktree (\S+) at /m.exec(stdout)?.[1];

const head = (repo: Repo, ref: string) => repo.git('rev-parse', ref).stdout.trim();

function expectGone(repo: Repo, path: string | undefined) {
  expect(path).toBeTruthy();
  expect(existsSync(path!)).toBe(false);
  expect(repo.git('worktree', 'list', '--porcelain').stdout).not.toContain(path!);
}

describe('deploy.sh', () => {
  it('tests a fresh origin/main: not a local commit, and a remote commit that the local ref does not know yet', () => {
    const { repo, deploy, calls } = setup();
    const known = head(repo, 'HEAD');
    // A newer origin/main that the local remote-tracking ref has not fetched.
    repo.write('app.txt', 'two\n');
    repo.git('commit', '-q', '-am', 'two');
    repo.git('push', '-q', 'origin', 'main');
    const fresh = head(repo, 'HEAD');
    repo.git('update-ref', 'refs/remotes/origin/main', known);
    // A local commit that is not pushed.
    repo.write('app.txt', 'local\n');
    repo.git('commit', '-q', '-am', 'local only');
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    const npmTest = calls().find(line => line.startsWith('npm test '));
    expect(npmTest).toBe(`npm test @ ${fresh} in ${path}`);
  });

  it('calls wt add <path> on the deploy worktree, then npm test, then the browser-check runner', () => {
    const { deploy, calls } = setup();
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`,
      'npm test',
      'npm run check:browser',
    ]);
  });

  it('with no flag, never calls vercel and says that it published nothing', () => {
    const { deploy, calls } = setup();
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    expect(calls().join('\n')).not.toContain('vercel');
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
    expect(result.stdout).toMatch(/published nothing/);
  });

  it('refuses any argument other than --publish before it makes a worktree', () => {
    const { repo, deploy, calls } = setup();
    const before = repo.git('worktree', 'list', '--porcelain').stdout;
    for (const args of [['main'], ['--ref', 'main'], ['-p'], ['--publish', 'extra'], ['--publish=yes'], ['']]) {
      const result = deploy(args);
      expect(result.status, args.join(' ')).not.toBe(0);
      expect(result.stderr).toContain('usage');
      expect(result.stdout).not.toContain('deploy: worktree');
    }
    expect(repo.git('worktree', 'list', '--porcelain').stdout).toBe(before);
    expect(calls()).toEqual([]);
  });

  it('stops at a failed npm test with a non-zero exit, names the step, and does not call the runner', () => {
    const { deploy, calls } = setup();
    const result = deploy([], { STUB_FAIL: 'test' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at npm test');
    expect(calls().map(line => line.replace(/ @ .*/, ''))).not.toContain('npm run check:browser');
  });

  it('stops at a failed browser check with a non-zero exit and names the step', () => {
    const { deploy } = setup();
    const result = deploy([], { STUB_FAIL: 'run' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at browser checks');
    expect(result.stdout).not.toMatch(/checks passed/);
  });

  it('removes its worktree and folder after a pass and after a failure', () => {
    const { repo, deploy } = setup();
    const pass = deploy();
    expect(pass.status, pass.stderr).toBe(0);
    expectGone(repo, worktreeOf(pass.stdout));
    const fail = deploy([], { STUB_FAIL: 'test' });
    expect(fail.status).not.toBe(0);
    expectGone(repo, worktreeOf(fail.stdout));
  });

  it('removes its worktree and folder after a SIGINT during npm test', async () => {
    const { repo, env, started } = setup();
    const child = spawn(script, [], { cwd: repo.dir, env: { ...repo.env, ...env, STUB_HANG: 'test' }, detached: true });
    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', () => {});
    const exit = new Promise<number | null>(done => child.on('exit', code => done(code)));
    const deadline = Date.now() + 10_000;
    while (!existsSync(started) && Date.now() < deadline) await new Promise(done => setTimeout(done, 50));
    expect(existsSync(started)).toBe(true);
    const path = worktreeOf(stdout);
    expect(path && existsSync(path)).toBe(true);
    process.kill(-child.pid!, 'SIGINT'); // the whole process group, as Ctrl-C does
    expect(await exit).toBe(130);
    expectGone(repo, path);
  });
});
