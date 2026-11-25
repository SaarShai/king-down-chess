// Deploy script test (secrets-and-public-gates/09), part 2: the site gates, the release commit,
// CI reuse, frame-time records and cleanup.
// Each case runs the real tools/deploy.sh in a temporary repository (tools/lib/deploy-test-kit.ts)
// with stub npm, npx and node.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s

import { cleanRepos, enginesDatabase, expectGone, head, script, setup, worktreeOf } from './lib/deploy-test-kit';

afterEach(cleanRepos);

describe('deploy.sh', () => {
  it.each(['plugin:db:init-test', 'tools/test-unlocked.sh', 'tools/check.mjs', 'build:vercel', 'check:vercel', 'web-online'])('stops the failed site gate %s before publication', fail => {
    const { repo, deploy, calls } = setup();
    const result = deploy(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_FAIL: fail });
    expect(result.status, fail).not.toBe(0);
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
    expectGone(repo, worktreeOf(result.stdout));
  });

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
    const npmTest = calls().find(line => line.startsWith('test-lock.sh '))?.replace(/ with .*/, '');
    expect(npmTest).toBe(`test-lock.sh bash tools/test-unlocked.sh @ ${fresh} in ${path}`);
  });

  it('stops before making a worktree when fetched main differs from the release commit', () => {
    const { repo, deploy, calls } = setup();
    const known = head(repo, 'HEAD');
    repo.write('app.txt', 'new main\n');
    repo.git('commit', '-q', '-am', 'new main');
    repo.git('push', '-q', 'origin', 'main');
    const moved = head(repo, 'HEAD');
    repo.git('update-ref', 'refs/remotes/origin/main', known);

    const result = deploy([], { KINGDOWN_RELEASE_COMMIT: known });
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(result.stderr).toContain(`origin/main moved from ${known} to ${moved}`);
    expect(result.stdout).not.toContain('make worktree');
    expect(calls()).toEqual([]);
  });

  it('checks the combined tree and every release gate on fresh origin/main before publication', () => {
    const { repo, deploy, calls } = setup();
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`,
      'npm run plugin:db:init-test',
      `node tools/ci-green.mjs ${head(repo, 'HEAD')}`,
      'test-lock.sh bash tools/test-unlocked.sh',
      'node tools/check.mjs',
      'npm run build:vercel',
      'npm run check:vercel',
      'node tools/check.mjs web-online',
      'npm run plugin:check:protocol',
      'node tools/check.mjs plugin-ui plugin-ui-http',
    ]);
    expect(result.stdout).not.toMatch(/skipped npm test/);
  });

  it('with CI passed and the --no-gpu check:browser step in the commit workflow, skips npm test, the web journey and all browser checks but the frame-time ones', () => {
    const { repo, deploy, calls } = setup();
    repo.write('.github/workflows/plugin-checks.yml', 'jobs:\n  browser-default:\n    steps:\n      - run: npm run check:browser -- --no-gpu\n        env:\n          PLAYABLE_BROWSER: chromium\n');
    repo.git('add', '.'); repo.git('commit', '-q', '-m', 'workflow'); repo.git('push', '-q', 'origin', 'main');
    const result = deploy([], { STUB_CI_PASS: '1' });
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`,
      'npm run plugin:db:init-test',
      `node tools/ci-green.mjs ${head(repo, 'HEAD')}`,
      'node tools/check.mjs --gpu',
      'npm run build:vercel',
      'npm run check:vercel',
    ]);
    expect(result.stdout).toMatch(/CI passed at [0-9a-f]{40}; skipped npm test, the browser checks that CI ran, the web journey and the plugin checks/);
  });

  it('with CI passed on a commit whose workflow has no such step, keeps the browser checks', () => {
    const { repo, deploy, calls } = setup();
    const result = deploy([], { STUB_CI_PASS: '1' });
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`,
      'npm run plugin:db:init-test',
      `node tools/ci-green.mjs ${head(repo, 'HEAD')}`,
      'node tools/check.mjs',
      'npm run build:vercel',
      'npm run check:vercel',
    ]);
    expect(result.stdout).toMatch(/CI passed at [0-9a-f]{40}; skipped npm test, the web journey and the plugin checks/);
  });

  it.each(['same tree', 'no record', 'different tree', 'bad record', 'bad time', 'extra line', 'failed record', 'same tree without CI'])(
    'reuses frame-time checks only for a valid pass at the published tree (%s)', testCase => {
      const { repo, deploy, calls } = setup();
      repo.write('.github/workflows/plugin-checks.yml', '      - run: npm run check:browser -- --no-gpu\n');
      repo.git('add', '.');
      repo.git('commit', '-qm', 'workflow');
      const tree = head(repo, 'HEAD^{tree}');
      const priorTree = head(repo, 'HEAD~1^{tree}');
      const pr = head(repo, 'HEAD');
      repo.git('commit', '--allow-empty', '-qm', 'same tree on main');
      repo.git('push', '-q', 'origin', 'main');
      expect(head(repo, 'HEAD')).not.toBe(pr);
      const record = join(repo.root, 'frame checks.pass');
      const time = '2026-11-21T08:15:00Z';
      if (testCase !== 'no record') {
        const status = testCase === 'failed record' ? 'fail' : 'pass';
        const checks = testCase === 'bad record' ? 'king-effects' : 'king-effects painted-game';
        const at = testCase === 'bad time' ? '2026-11-21T25:15:00Z' : time;
        writeFileSync(record, `${status} ${testCase === 'different tree' ? priorTree : tree} ${at} ${checks}\n${testCase === 'extra line' ? '\n' : ''}`);
      }

      const ci = testCase !== 'same tree without CI';
      const result = deploy([], { STUB_CI_PASS: ci ? '1' : '', KINGDOWN_FRAME_CHECKS_RECORD: testCase === 'no record' ? '' : record });
      expect(result.status, result.stdout + result.stderr).toBe(0);
      const browser = calls().filter(line => line.startsWith('node tools/check.mjs')).map(line => line.replace(/ @ .*/, ''));
      if (testCase.startsWith('same tree')) {
        expect(browser).toEqual(ci ? [] : ['node tools/check.mjs --no-gpu', 'node tools/check.mjs web-online', 'node tools/check.mjs plugin-ui plugin-ui-http']);
        expect(result.stdout.match(/^deploy: skipped frame-time browser checks.*$/gm)).toEqual([
          `deploy: skipped frame-time browser checks for tree ${tree} (passed at ${time})`,
        ]);
      } else {
        expect(browser).toEqual(['node tools/check.mjs --gpu']);
        expect(result.stdout).not.toContain('skipped frame-time browser checks');
      }
      expect(calls().some(line => line.startsWith('npx '))).toBe(false);
    },
  );

  it('reuses a completed frame-time run for the merge tree after a later deploy gate fails', () => {
    const { repo, deploy, calls } = setup();
    repo.write('.github/workflows/plugin-checks.yml', '      - run: npm run check:browser -- --no-gpu\n');
    repo.git('add', '.');
    repo.git('commit', '-qm', 'workflow');
    repo.git('push', '-q', 'origin', 'main');
    const history = join(repo.root, 'evidence');
    const live = join(history, `release-1-${'a'.repeat(40)}`, 'live');
    mkdirSync(live, { recursive: true });
    const record = join(live, 'frame-checks.pass');
    writeFileSync(record, `pass ${head(repo, 'HEAD~1^{tree}')} 2026-11-23T10:00:00Z king-effects painted-game\n`);
    const config = { STUB_CI_PASS: '1', STUB_FRAME_PASS: '1', KINGDOWN_FRAME_CHECKS_RECORD: record, KINGDOWN_FRAME_CHECKS_HISTORY: history };
    const failed = deploy([], { ...config, STUB_FAIL: 'build:vercel' });
    expect(failed.status, failed.stdout + failed.stderr).toBe(1);
    expect(calls().filter(line => line.startsWith('node tools/check.mjs --gpu'))).toHaveLength(1);
    const retry = deploy([], config);
    expect(retry.status, retry.stdout + retry.stderr).toBe(0);
    expect(retry.stdout).toContain(`skipped frame-time browser checks for tree ${head(repo, 'HEAD^{tree}')}`);
    expect(calls().filter(line => line.startsWith('node tools/check.mjs --gpu'))).toHaveLength(1);
    expect(readFileSync(record, 'utf8')).toContain(head(repo, 'HEAD~1^{tree}'));
  });

  it('runs the plugin target without the CI check', () => {
    const { deploy, calls } = setup();
    const result = deploy(['--target', 'plugin'], { PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', STUB_CI_PASS: '1' });
    expect(result.status, result.stderr).toBe(0);
    expect(calls().some(line => line.includes('ci-green'))).toBe(false);
    expect(calls().some(line => line.startsWith('test-lock.sh '))).toBe(true);
  });

  it('with no flag, never calls vercel and says that it published nothing', () => {
    const { deploy, calls } = setup();
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
    expect(result.stdout).toMatch(/published nothing/);
  });

  it('refuses unknown and repeated arguments before it makes a worktree', () => {
    const { repo, deploy, calls } = setup();
    const before = repo.git('worktree', 'list', '--porcelain').stdout;
    for (const args of [['main'], ['--ref', 'main'], ['-p'], ['--publish', 'extra'], ['--publish=yes'], [''], ['--publish', '--publish'], ['--target'], ['--target', 'other'], ['--target', 'website', '--target', 'website'], ['--setup-plugin', '--publish'], ['--configure'], ['--configure', 'file', '--publish'], ['--configure', '']]) {
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
    const result = deploy([], { STUB_FAIL: 'tools/test-unlocked.sh' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at npm test');
    expect(calls().map(line => line.replace(/ @ .*/, ''))).not.toContain('node tools/check.mjs');
  });

  it('stops at a failed browser check with a non-zero exit and names the step', () => {
    const { deploy } = setup();
    const result = deploy([], { STUB_FAIL: 'tools/check.mjs' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at browser checks');
    expect(result.stdout).not.toMatch(/checks passed/);
  });

  it('removes its worktree and folder after a pass and after a failure', () => {
    const { repo, deploy } = setup();
    const pass = deploy();
    expect(pass.status, pass.stderr).toBe(0);
    expectGone(repo, worktreeOf(pass.stdout));
    const fail = deploy([], { STUB_FAIL: 'tools/test-unlocked.sh' });
    expect(fail.status).not.toBe(0);
    expectGone(repo, worktreeOf(fail.stdout));
  });

  it('removes its worktree and folder after a SIGINT during npm test', async () => {
    const { repo, env, started } = setup();
    const child = spawn(script, [], { cwd: repo.dir, env: { ...repo.env, ...env, STUB_HANG: 'tools/test-unlocked.sh' }, detached: true });
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
