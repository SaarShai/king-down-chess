// Deploy script test (secrets-and-public-gates/09). Each case runs the real tools/deploy.sh in a
// temporary repository with a bare remote. Stub `npm` and `npx` on PATH write each call to a log,
// with the commit and the folder of the call. The browser-check runner is `npm run check:browser`,
// so the `npm` stub also logs the runner. Origin/main holds a stub `tools/wt.sh`, because the deploy
// script calls the `wt` of the commit that it tests; the stub logs `wt add <path>`.
import { spawn } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const script = fileURLToPath(new URL('./deploy.sh', import.meta.url));
const liveCheck = fileURLToPath(new URL('./deploy-live-check.mjs', import.meta.url));

type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

const stub = (path: string, lines: string[]) => {
  writeFileSync(path, ['#!/bin/sh', ...lines, ''].join('\n'));
  chmodSync(path, 0o755);
};

/** A work tree whose origin/main holds the stub wt script and the real live check, and stub npm and
 *  npx on PATH. The runner stub writes the build (`STUB_DIST`, a folder) into `dist/`, as the real
 *  runner builds the app there. */
function setup() {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const log = join(repo.root, 'calls.log');
  const started = join(repo.root, 'started');
  const record = `echo "$(basename "$0") $* @ $(git rev-parse HEAD 2>/dev/null) in $(pwd -P) with $(ls | tr '\\n' ' ')" >> "${log}"`;
  mkdirSync(join(repo.dir, 'tools'));
  stub(join(repo.dir, 'tools', 'wt.sh'), [record]);
  cpSync(liveCheck, join(repo.dir, 'tools', 'deploy-live-check.mjs'));
  repo.write('app.txt', 'one\n');
  repo.git('add', '.');
  repo.git('commit', '-q', '-m', 'one');
  repo.git('push', '-q', 'origin', 'main');
  const bin = join(repo.root, 'bin');
  mkdirSync(bin);
  // STUB_FAIL=<word> makes a call that holds that argument fail; STUB_HANG=<word> makes it wait.
  const holds = (name: string) => `[ -n "$${name}" ] && case " $* " in *" $${name} "*) true;; *) false;; esac`;
  const behave = [
    record,
    `if ${holds('STUB_HANG')}; then touch "${started}"; sleep 30; fi`,
    `if ${holds('STUB_FAIL')}; then exit 1; fi`,
  ];
  stub(join(bin, 'npm'), [...behave, 'if [ "$1 $2" = "run check:browser" ] && [ -n "$STUB_DIST" ]; then cp -R "$STUB_DIST" dist; fi']);
  stub(join(bin, 'npx'), behave);
  const env = { PATH: `${bin}:${repo.env.PATH}`, STUB_FAIL: '', STUB_HANG: '', STUB_DIST: '', DEPLOY_LIVE_URL: 'http://127.0.0.1:9', DEPLOY_LIVE_TIMEOUT_MS: '1500' };
  const deploy = (args: string[] = [], extra: Record<string, string> = {}) => repo.run(script, args, { env: { ...env, ...extra } });
  const deployAsync = (args: string[] = [], extra: Record<string, string> = {}) => runAsync(script, args, { cwd: repo.dir, env: { ...repo.env, ...env, ...extra } });
  const calls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []);
  return { repo, env, deploy, deployAsync, calls, started };
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
    const npmTest = calls().find(line => line.startsWith('npm test '))?.replace(/ with .*/, '');
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

// The live check (secrets-and-public-gates/10). A local server stands in for the live site. It serves
// a set of files and records each request; a request with a cookie header gets a 400 and is recorded.
const folders: string[] = [];
const servers: { close: () => void }[] = [];
afterEach(() => {
  while (servers.length) servers.pop()!.close();
  while (folders.length) rmSync(folders.pop()!, { recursive: true, force: true });
});

/** The pages of a build: the entry script name is the bundle name. */
const pages = (bundle = 'index-Abc123_x', terms = 'Terms v1') => ({
  'index.html': `<!doctype html><html><head><script type="module" crossorigin src="./assets/${bundle}.js"></script></head><body></body></html>`,
  'privacy.html': '<!doctype html><title>Privacy</title><p>Privacy v1</p>\n',
  'terms.html': `<!doctype html><title>Terms</title><p>${terms}</p>\n`,
  'delete-data.html': '<!doctype html><title>Delete data</title><p>Delete v1</p>\n',
});

/** A build folder with the given pages. */
function buildFolder(files: Record<string, string>) {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'deploy-build-'));
  folders.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

/** A local site. `files` can change between requests; `/` serves `index.html`. */
async function site(files: () => Record<string, string>) {
  const requests: { path: string; cookie?: string }[] = [];
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    requests.push({ path, cookie: req.headers.cookie });
    if (req.headers.cookie !== undefined) { res.writeHead(400).end('cookie sent'); return; }
    const body = files()[path === '/' ? 'index.html' : path.slice(1)];
    if (body === undefined) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': 'text/html', 'set-cookie': 'visit=1; Path=/' }).end(body);
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, requests };
}

/** Runs a command without a block on the event loop, so that the local site can answer. */
function runAsync(command: string, args: string[], options: { cwd?: string; env: Record<string, string | undefined> }) {
  return new Promise<{ status: number | null; stdout: string; stderr: string; seconds: number }>(done => {
    const start = Date.now();
    const child = spawn(command, args, { cwd: options.cwd, env: options.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => done({ status, stdout, stderr, seconds: (Date.now() - start) / 1000 }));
  });
}

const check = (folder: string, url: string, timeoutMs = 1500) =>
  runAsync(process.execPath, [liveCheck, folder], { env: { ...process.env, DEPLOY_LIVE_URL: url, DEPLOY_LIVE_TIMEOUT_MS: String(timeoutMs) } });

describe('deploy-live-check.mjs', { timeout: 20_000 }, () => {
  it('passes when the live site serves the build, and sends no cookie', async () => {
    const files = pages();
    const live = await site(() => files);
    const result = await check(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('index-Abc123_x.js');
    expect(live.requests.map(r => r.path).sort()).toEqual(['/', '/delete-data.html', '/privacy.html', '/terms.html']);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('fails within the time limit when the live site loads a different bundle, and names both bundles', async () => {
    const live = await site(() => pages('index-Old999'));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/bundle: .*index-Old999\.js.*index-Abc123_x\.js/);
    expect(result.stderr).not.toMatch(/terms\.html|privacy\.html|delete-data\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('fails within the time limit when the live terms page differs, and names only that page', async () => {
    const live = await site(() => pages(undefined, 'Terms v2'));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/terms\.html: the live page differs/);
    expect(result.stderr).not.toMatch(/bundle:|privacy\.html|delete-data\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('tries again until the live site serves the build, inside the time limit', async () => {
    let served = 0;
    const live = await site(() => (served++ < 4 ? pages('index-Old999') : pages()));
    const result = await check(buildFolder(pages()), live.url, 3000);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.filter(r => r.path === '/').length).toBe(2);
  });
});

// The publish step (secrets-and-public-gates/10): the stub npx stands in for the Vercel CLI, and a
// local site that serves the stub build stands in for the live site.
describe('deploy.sh --publish', { timeout: 20_000 }, () => {
  const words = (line: string) => line.replace(/ @ .*/, '');
  const npxCalls = (calls: string[]) => calls.filter(line => line.startsWith('npx '));

  it('after the checks, publishes the tested build with the pinned Vercel CLI and confirms the live site', async () => {
    const { repo, deployAsync, calls } = setup();
    const files = pages();
    const live = await site(() => files);
    const result = await deployAsync(['--publish'], { STUB_DIST: buildFolder(files), DEPLOY_LIVE_URL: live.url });
    expect(result.status, result.stderr).toBe(0);
    const log = calls().map(words);
    const runner = log.indexOf('npm run check:browser');
    expect(runner).toBeGreaterThan(-1);
    // One link of the kingdown project, then one deploy, both with the same pinned version: an exact
    // version, never a range or a tag such as latest.
    const npx = npxCalls(calls());
    const version = /vercel@(\d+\.\d+\.\d+) /.exec(npx[0] ?? '')?.[1];
    expect(version).toBeTruthy();
    expect(npx.map(words)).toEqual([`npx --yes vercel@${version} link --project kingdown --yes`, `npx --yes vercel@${version} deploy --prod --yes`]);
    expect(log.indexOf(words(npx[0]))).toBeGreaterThan(runner);
    // It runs in a folder named kingdown that holds the tested build (the runner wrote dist/ there).
    expect(npx[1]).toMatch(/\/kingdown with delete-data\.html index\.html privacy\.html terms\.html ?$/);
    expect(result.stdout).toMatch(/live-check: pass/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
    expect(live.requests.length).toBeGreaterThan(0);
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('a failed check stops the script before the npx call', async () => {
    const { repo, deployAsync, calls } = setup();
    for (const fail of ['test', 'run']) {
      const result = await deployAsync(['--publish'], { STUB_FAIL: fail, STUB_DIST: buildFolder(pages()) });
      expect(result.status).not.toBe(0);
      expect(npxCalls(calls())).toEqual([]);
      expect(result.stdout).not.toContain('live-check');
      expectGone(repo, worktreeOf(result.stdout));
    }
  });

  it('a failed Vercel deploy stops the script before the live check', async () => {
    const { repo, deployAsync } = setup();
    const result = await deployAsync(['--publish'], { STUB_FAIL: 'deploy', STUB_DIST: buildFolder(pages()) });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at publish');
    expect(result.stdout).not.toContain('live-check');
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('fails when the live site does not serve the build, names the difference, and removes its worktree', async () => {
    const { repo, deployAsync } = setup();
    const live = await site(() => pages(undefined, 'Terms v2'));
    const result = await deployAsync(['--publish'], { STUB_DIST: buildFolder(pages()), DEPLOY_LIVE_URL: live.url });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/terms\.html: the live page differs/);
    expect(result.stderr).toContain('FAIL at live check');
    expectGone(repo, worktreeOf(result.stdout));
  });
});
