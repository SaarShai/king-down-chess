import { spawn, spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { PG_BIN } from './lib/postgres.mjs';
import { CHECK_SITE_ENV } from './lib/checks.mjs';
import { checks } from './lib/registry.mjs';
import { tempRepo } from './lib/temp-repo.mjs';

vi.setConfig({ testTimeout: 60_000 });
const repos: ReturnType<typeof tempRepo>[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

// The real runner and registry use stand-ins for the build, preview, browser scripts, schema, locks and tree snapshots.
// A stand-in check appends its PLUGIN_TEST_DATABASE_URL to events.jsonl.db; RUNNER_STANDIN=fail makes it exit 1, and
// RUNNER_STANDIN=hang makes it wait. The default shell gives a stub database, so the runner starts no PostgreSQL.
function setup(failBuild = false) {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const events = join(repo.root, 'events.jsonl');
  repo.write('package.json', JSON.stringify({ type: 'module', scripts: { build: 'node build.mjs' } }));
  repo.write('build.mjs', `import { appendFileSync, writeFileSync } from 'node:fs'; appendFileSync(process.env.RUNNER_EVENTS, '"build"\\n');
    writeFileSync(process.env.RUNNER_EVENTS + '.build', JSON.stringify(Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('VITE_') || k === 'KINGDOWN_TEST_PAGES')))); process.exit(${failBuild ? 1 : 0});`);
  repo.write('tools/plugin-db/bootstrap-test.mjs', `import { appendFileSync } from 'node:fs';
    appendFileSync(process.env.RUNNER_EVENTS, JSON.stringify({ schema: process.env.PLUGIN_TEST_DATABASE_URL }) + '\\n');`);
  repo.write('node_modules/.gitignore', '*\n');
  symlinkSync(new URL('../node_modules/playwright', import.meta.url), join(repo.dir, 'node_modules/playwright'), 'dir');
  repo.write('node_modules/vite/package.json', JSON.stringify({ type: 'module', exports: './index.mjs' }));
  repo.write('node_modules/vite/index.mjs', `
    import { appendFileSync } from 'node:fs';
    export async function preview() {
      appendFileSync(process.env.RUNNER_EVENTS, '"preview"\\n');
      return { resolvedUrls: { local: ['http://127.0.0.1:1234/'] }, close: async () => appendFileSync(process.env.RUNNER_EVENTS, '"close"\\n') };
    }
  `);
  for (const file of ['check.mjs', 'lib/checks.mjs', 'lib/first-fault.mjs', 'lib/postgres.mjs', 'lib/registry.mjs', 'lib/temp-repo.mjs']) {
    mkdirSync(join(repo.dir, 'tools', file, '..'), { recursive: true });
    cpSync(new URL(file, import.meta.url), join(repo.dir, 'tools', file));
  }
  // The default case takes 8.8 s on the M1 with real Git calls. Lock and snapshot tests cover those modules.
  repo.write('tools/lib/lock.mjs', `
    export const SLOTS = 3;
    export const enterMachineLease = async () => {};
    export const machineLeaseStdio = stdio => stdio;
    export const runLockPath = () => '';
    export const releaseAll = () => {};
    export const takeLock = async () => () => {};
    export { takeLock as takeSlot, takeLock as takeAllSlots };
  `);
  repo.write('tools/lib/tree-status.mjs', `
    export const treeStatus = () => new Map();
    export const changedPaths = () => [];
  `);
  for (const script of new Set(checks.map(c => c.script))) repo.write(script, `
    import { appendFileSync } from 'node:fs';
    appendFileSync(process.env.RUNNER_EVENTS, JSON.stringify({ script: process.argv[1].slice(process.cwd().length + 1), args: process.argv.slice(2), url: process.env.PLAYABLE_URL, stage: process.env.VITE_KINGDOWN_STAGE }) + '\\n');
    appendFileSync(process.env.RUNNER_EVENTS + '.db', (process.env.PLUGIN_TEST_DATABASE_URL ?? '') + '\\n');
    if (process.env.RUNNER_STANDIN === 'fail') process.exit(1);
    if (process.env.RUNNER_STANDIN === 'hang') setInterval(() => {}, 1000);
  `);
  const env = (shell: Record<string, string | undefined>) => ({
    ...repo.env, TMPDIR: repo.root, RUNNER_EVENTS: events, PLAYABLE_URL: undefined, VITE_KINGDOWN_STAGE: undefined, CI: undefined,
    KINGDOWN_TEST_PAGES: undefined, PLUGIN_TEST_DATABASE_URL: 'postgresql://postgres@127.0.0.1:9/stub_test', RUNNER_STANDIN: undefined, ...shell,
  });
  const read = () => ({
    calls: existsSync(events) ? readFileSync(events, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [],
    build: existsSync(events + '.build') ? JSON.parse(readFileSync(events + '.build', 'utf8')) : null,
    dbs: existsSync(events + '.db') ? readFileSync(events + '.db', 'utf8').trim().split('\n') : [],
    // The throwaway data folders that the runner left in the system temp folder (TMPDIR).
    leftFolders: readdirSync(repo.root).filter(name => name.startsWith('kingdown-check-pg-')),
  });
  return { repo, env, read };
}

function run(names: string[], failBuild = false, shell: Record<string, string | undefined> = {}) {
  const { repo, env, read } = setup(failBuild);
  const result = spawnSync(process.execPath, ['tools/check.mjs', ...names], { cwd: repo.dir, env: env(shell), encoding: 'utf8', timeout: 30_000 });
  return { result, ...read() };
}

describe('browser check site build', () => {
  it('uses the supplied local stack for an external check', () => {
    const url = 'http://127.0.0.1:5442/';
    const { result, calls } = run(['next-arrange'], false, { PLAYABLE_URL: url });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls).toEqual([{ script: 'tools/verify-next-arrange.mjs', args: [], url }]);
  });

  it('skips the site build and preview for checks that build their own artifact', () => {
    const { result, calls } = run(['plugin-ui', 'plugin-ui-http', 'plugin-oauth', 'web-game', 'recovery-consumers']);
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls).toHaveLength(5);
    expect(calls.at(-1)).toMatchObject({ script: 'tools/web-game-check.mjs', args: ['recovery'] });
    expect(calls.every(call => typeof call === 'object' && !('url' in call))).toBe(true);
    expect(result.stdout).not.toContain('serving the build');
  });

  it('runs the staging checks with the staging build stage and the production ones without it', () => {
    const { result, calls } = run(['web-game', 'web-game-staging', 'plugin-ui-http', 'plugin-ui-http-staging']);
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls.map(call => call.stage)).toEqual([undefined, 'staging', undefined, 'staging']);
    expect(calls[1]).toMatchObject({ script: 'tools/web-game-check.mjs', args: [] });
    expect(calls[3]).toMatchObject({ script: 'tools/plugin-browser-check.mjs', args: ['http'] });
  });

  it.each([{ names: ['web-online'] }, { names: ['plugin-ui', 'web-online'] }, { names: ['gui-board-preview'] }, { names: [] }])('builds and serves the site for $names', ({ names }) => {
    const { result, calls } = run(names);
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls.slice(0, 2)).toEqual(['build', 'preview']);
    expect(calls.at(-1)).toBe('close');
    expect(calls.slice(2, -1).every(call => call.url === 'http://127.0.0.1:1234/')).toBe(true);
    expect(calls.length).toBe((names.length || checks.filter(c => !c.byName).length) + 3);
    const selected = names.length ? names.map(name => checks.find(c => c.name === name)!) : checks.filter(c => !c.byName);
    expect(calls.slice(2, -1)).toEqual(selected.map(c => ({ script: c.script, args: c.args ?? [], url: 'http://127.0.0.1:1234/' })));
  });

  it('--no-gpu leaves out the frame-time checks, --gpu runs only them, and a named one runs with CI set', () => {
    const scripts = (calls: unknown[]) => calls.filter((call): call is { script: string } => typeof call === 'object').map(call => call.script);
    const gpu = checks.filter(c => c.gpu), rest = checks.filter(c => !c.byName && !c.gpu);
    expect(gpu.map(c => c.name)).toEqual(['king-effects', 'painted-game']);
    const ci = run(['--no-gpu']);
    expect(ci.result.status, ci.result.stderr + ci.result.stdout).toBe(0);
    expect(scripts(ci.calls)).toEqual(rest.map(c => c.script));
    expect(ci.result.stdout).toContain('check: --no-gpu: left out king-effects, painted-game');
    const all = run([], false, { CI: 'true' });
    expect(scripts(all.calls)).toEqual(checks.filter(c => !c.byName).map(c => c.script));
    expect(scripts(run(['king-effects'], false, { CI: 'true' }).calls)).toEqual(['tools/verify-king-effects.mjs']);
    const only = run(['--gpu'], false, { CI: 'true' });
    expect(only.result.status, only.result.stderr + only.result.stdout).toBe(0);
    expect(scripts(only.calls)).toEqual(gpu.map(c => c.script));
    const named = run(['--gpu', 'home']);
    expect(named.result.status).toBe(2);
    expect(named.result.stderr).toContain('--gpu and --no-gpu take no name');
    expect(run(['--gpu', '--no-gpu']).result.status).toBe(2);
  });

  it('builds the site as a production build with the fake account project, whatever the shell holds', () => {
    const { result, build } = run(['web-online'], false, { VITE_KINGDOWN_STAGE: 'staging', VITE_SUPABASE_URL: 'https://puhspsyjyzaghmgtkzqd.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_other' });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(build).toMatchObject(CHECK_SITE_ENV);
    expect(CHECK_SITE_ENV).toEqual({ VITE_KINGDOWN_STAGE: '', VITE_SUPABASE_URL: 'https://web-proof.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test' });
  });

  it('stops before preview and checks when the site build fails', () => {
    const { result, calls } = run(['web-online'], true);
    expect(result.status).toBe(1);
    expect(calls).toEqual(['build']);
    expect(result.stdout).toContain('FAIL build');
  });
});

it('runs only the checks from a CI shard and keeps the local no-GPU option', () => {
  const { result, calls } = run(['--no-gpu'], false, { KINGDOWN_CI_BROWSER_CHECKS: 'plugin-oauth plugin-ui-http' });
  expect(result.status, result.stderr + result.stdout).toBe(0);
  expect(calls).toEqual([
    { script: 'tools/plugin-browser-check.mjs', args: ['oauth'] },
    { script: 'tools/plugin-browser-check.mjs', args: ['http'] },
  ]);
});

it.each(['release-site', 'release-history'])('lets %s use its own local build in CI', name => {
  const { result, calls } = run(['--no-gpu'], false, { KINGDOWN_CI_BROWSER_CHECKS: name });
  expect(result.status, result.stderr + result.stdout).toBe(0);
  expect(calls).toEqual([{ script: `tools/verify-${name}.mjs`, args: [] }]);
});

it('fails a CI browser shard when every named check needs a GPU', () => {
  const { result, calls } = run(['--no-gpu'], false, { KINGDOWN_CI_BROWSER_CHECKS: 'king-effects painted-game' });
  expect(result.status, result.stderr + result.stdout).toBe(2);
  expect(result.stderr).toContain('a CI shard must run at least one check');
  expect(calls).toEqual([]);
});

describe('browser check setup', () => {
  it('builds the test pages for a check that needs them, and only then', () => {
    expect(checks.filter(c => c.ciTestPages).map(c => c.name)).toEqual(['play-scenes']);
    const pages = run(['play-scenes']);
    expect(pages.result.status, pages.result.stderr + pages.result.stdout).toBe(0);
    expect(pages.build).toMatchObject({ ...CHECK_SITE_ENV, KINGDOWN_TEST_PAGES: '1' });
    expect(run(['home']).build).not.toHaveProperty('KINGDOWN_TEST_PAGES');
  });

  it('gives a set PLUGIN_TEST_DATABASE_URL to the database checks as it is and starts nothing', () => {
    const given = 'postgresql://postgres@127.0.0.1:9/given_test';
    const { result, calls, dbs, leftFolders } = run(['web-game', 'web-online'], false, { PLUGIN_TEST_DATABASE_URL: given, PG_BIN: '/nonexistent' });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(dbs).toEqual([given, given]);
    expect(calls.some(call => call.schema)).toBe(false);
    expect(result.stdout).not.toContain('test database');
    expect(leftFolders).toEqual([]);
  });

  it('stops before the build with one line when a database check has no database and no PostgreSQL programs', () => {
    const { result, calls } = run(['web-online'], false, { PLUGIN_TEST_DATABASE_URL: undefined, PG_BIN: '/nonexistent' });
    expect(result.status).toBe(2);
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
    expect(result.stderr).toMatch(/^check: no test database for web-online: \/nonexistent has no initdb.*PostgreSQL 17.*PG_BIN.*PLUGIN_TEST_DATABASE_URL\n$/);
    expect(calls).toEqual([]);
  });

  it('starts no PostgreSQL for a run without a database check', () => {
    const { result, dbs } = run(['home'], false, { PLUGIN_TEST_DATABASE_URL: undefined, PG_BIN: '/nonexistent' });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(dbs).toEqual(['']);
  });

  const serverPid = (stdout: string) => Number(stdout.match(/test database \S+ \(server PID (\d+)/)?.[1]);
  const gone = (pid: number) => { try { process.kill(pid, 0); return false; } catch { return true; } };
  const ownDatabase = /^postgresql:\/\/postgres@127\.0\.0\.1:\d+\/\w+_test$/;

  it.skipIf(!existsSync(join(PG_BIN, 'initdb')))('starts a throwaway loopback database, prepares it, and removes it after a pass and a fail', () => {
    for (const standin of [undefined, 'fail']) {
      const { result, calls, dbs, leftFolders } = run(['web-game', 'plugin-oauth'], false, { PLUGIN_TEST_DATABASE_URL: undefined, RUNNER_STANDIN: standin });
      expect(result.status, result.stderr + result.stdout).toBe(standin ? 1 : 0);
      expect(dbs).toHaveLength(2);
      expect(dbs[0]).toMatch(ownDatabase);
      expect(dbs[1]).toBe(dbs[0]);
      expect(calls[0]).toEqual({ schema: dbs[0] });
      const pid = serverPid(result.stdout);
      expect(pid).toBeGreaterThan(0);
      expect(gone(pid)).toBe(true);
      expect(leftFolders).toEqual([]);
    }
  });

  it.skipIf(!existsSync(join(PG_BIN, 'initdb')))('stops and removes the throwaway database on SIGTERM', async () => {
    const { repo, env, read } = setup();
    const child = spawn(process.execPath, ['tools/check.mjs', 'web-game'], { cwd: repo.dir, env: env({ PLUGIN_TEST_DATABASE_URL: undefined, RUNNER_STANDIN: 'hang' }) });
    let stdout = '';
    child.stdout.on('data', data => { stdout += data; });
    const exited = new Promise<number | null>(resolve => child.once('exit', code => resolve(code)));
    const deadline = Date.now() + 30_000;
    while (!read().dbs.length && Date.now() < deadline) await new Promise(r => setTimeout(r, 50));
    expect(read().dbs[0]).toMatch(ownDatabase);
    child.kill('SIGTERM');
    expect(await exited).toBe(143);
    const pid = serverPid(stdout);
    expect(pid).toBeGreaterThan(0);
    expect(gone(pid)).toBe(true);
    expect(read().leftFolders).toEqual([]);
  });
});
