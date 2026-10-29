// Deploy script test (secrets-and-public-gates/09). Each case runs the real tools/deploy.sh in a
// temporary repository with a bare remote. Stub `npm`, `npx` and `node` on PATH write each call to a
// log, with the commit and the folder of the call. The browser-check runner is `node tools/check.mjs`,
// so the `node` stub also logs the runner. Origin/main holds a stub `tools/wt.sh` and a stub
// `tools/test-lock.sh`, because the deploy script calls the tools of the commit that it tests; the
// stubs log `wt add <path>` and `test-lock.sh bash tools/test-unlocked.sh`.
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s
import { tempRepo } from './lib/temp-repo.mjs';
import { PARKED_PATHS } from './chatgpt-plugin.mjs';

const script = fileURLToPath(new URL('./deploy.sh', import.meta.url));
const liveCheck = fileURLToPath(new URL('./deploy-live-check.mjs', import.meta.url));
const keepAssets = fileURLToPath(new URL('./deploy-keep-assets.mjs', import.meta.url));
const pluginLiveCheck = fileURLToPath(new URL('./deploy-plugin-live-check.mjs', import.meta.url));
const pluginSwitch = fileURLToPath(new URL('./chatgpt-plugin.mjs', import.meta.url));
const siteProject = { projectId: 'prj_SiteTest', orgId: 'team_mIlANWWDRbX1NT4jgJn9jAna', projectName: 'kingdown' };
const enginesDatabase = 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require';
const productionSupabase = 'https://utqzovjmclfyojedmwok.supabase.co', stagingSupabase = 'https://puhspsyjyzaghmgtkzqd.supabase.co';
const pluginProject = { projectId: 'prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6', orgId: 'team_mIlANWWDRbX1NT4jgJn9jAna', projectName: 'kingdown-plugin' };

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
  // STUB_FAIL=<word> makes a call that holds that argument fail; STUB_HANG=<word> makes it wait.
  const holds = (name: string) => `[ -n "$${name}" ] && case " $* " in *" $${name} "*) true;; *) false;; esac`;
  const behave = [
    record,
    `if ${holds('STUB_HANG')}; then touch "${started}"; sleep 30; fi`,
    `if ${holds('STUB_FAIL')}; then exit 1; fi`,
  ];
  mkdirSync(join(repo.dir, 'tools'));
  stub(join(repo.dir, 'tools', 'wt.sh'), [record, '[ -z "$STUB_LINK_MODULES" ] || ln -s "$STUB_LINK_MODULES" node_modules']);
  stub(join(repo.dir, 'tools', 'test-lock.sh'), behave);
  cpSync(liveCheck, join(repo.dir, 'tools', 'deploy-live-check.mjs'));
  cpSync(keepAssets, join(repo.dir, 'tools', 'deploy-keep-assets.mjs'));
  cpSync(pluginLiveCheck, join(repo.dir, 'tools', 'deploy-plugin-live-check.mjs'));
  cpSync(pluginSwitch, join(repo.dir, 'tools', 'chatgpt-plugin.mjs'));
  repo.write('vercel.json', readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'));
  repo.write('app.txt', 'one\n');
  repo.git('add', '.');
  repo.git('commit', '-q', '-m', 'one');
  // deploy.sh requires the GitHub origin URL, also after insteadOf. Test pushes go to the bare
  // remote through the push URL; the deploy script fetches it through the git shim below.
  repo.git('remote', 'set-url', 'origin', 'https://github.com/SaarShai/king-down-chess.git');
  repo.git('remote', 'set-url', '--push', 'origin', repo.remote);
  repo.git('push', '-q', 'origin', 'main');
  const bin = join(repo.root, 'bin');
  mkdirSync(bin);
  // The git shim forwards each call to the real git. Only for a fetch inside this temp folder, it
  // adds a command-line insteadOf rule from the configured origin URL to the bare remote, so the
  // script's own config and `ls-remote --get-url` checks see no rewrite.
  const realGit = repo.run('sh', ['-c', 'command -v git']).stdout.trim();
  stub(join(bin, 'git'), [
    `case "$(pwd -P)" in "${repo.root}"/*) if [ "$1" = fetch ]; then url=$("${realGit}" config --get remote.origin.url) && exec "${realGit}" -c "url.${repo.remote}.insteadOf=$url" "$@"; fi ;; esac`,
    `exec "${realGit}" "$@"`,
  ]);
  stub(join(bin, 'npm'), [...behave,
    'if [ "$1 $2" = "run plugin:build:vercel" ]; then mkdir -p plugin-deploy/.vercel/output/functions/mcp.func; printf "consent-v1" > plugin-deploy/.vercel/output/functions/mcp.func/consent.mjs; fi',
    // The site build parks the ChatGPT plugin (tools/chatgpt-plugin.mjs): its function has no consent script.
    `if [ "$1 $2" = "run build:vercel" ]; then mkdir -p kingdown-deploy/.vercel/output/functions/mcp.func kingdown-deploy/.vercel/output/static; printf '{"version":3}\n' > kingdown-deploy/.vercel/output/config.json; if [ -n "$STUB_DIST" ]; then cp -R "$STUB_DIST/." kingdown-deploy/.vercel/output/static; else printf page > kingdown-deploy/.vercel/output/static/index.html; printf worker > kingdown-deploy/.vercel/output/static/sw.js; fi; fi`,
    // The build copies the committed engine archives; STUB_TAMPER_ENGINE changes them, STUB_STAGING_MANIFEST adds the staging manifest.
    'if [ "$1 $2" = "run build:vercel" ] && [ -d engines ]; then mkdir -p kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines; cp engines/*.mjs kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines/; if [ -n "$STUB_TAMPER_ENGINE" ]; then for f in kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines/*.mjs; do printf x >> "$f"; done; fi; fi',
    'if [ "$1 $2" = "run build:vercel" ] && [ -n "$STUB_STAGING_MANIFEST" ]; then printf "{}" > kingdown-deploy/.vercel/output/staging.json; fi',
    // STUB_NEW_ENGINE: the build archives an engine that origin/main does not hold.
    'if { [ "$1 $2" = "run plugin:build:vercel" ] || [ "$1 $2" = "run build:vercel" ]; } && [ -n "$STUB_NEW_ENGINE" ]; then mkdir -p engines; printf "bundle" > engines/new.mjs; fi',
  ]);
  stub(join(bin, 'node'), [
    `case "$1" in */deploy-plugin-live-check.mjs) ${record}; exec "${process.execPath}" "$1" "$2" "\${STUB_PLUGIN_ORIGIN:-$DEPLOY_LIVE_URL}" ;; esac`,
    `case "$1" in tools/engines-check.mjs) ${behave.join('; ')}; exit 0 ;; esac`,
    `case "$1" in tools/check.mjs) ${behave.join('; ')}; if [ $# -eq 1 ] && [ -n "$STUB_DIST" ]; then cp -R "$STUB_DIST" dist; fi; exit 0 ;; esac`,
    `exec "${process.execPath}" "$@"`,
  ]);
  stub(join(bin, 'npx'), [...behave,
    `case " $* " in *" link --project kingdown-plugin "*) project='${JSON.stringify(pluginProject)}' ;; *" link --project kingdown "*) project='${JSON.stringify(siteProject)}' ;; esac; if [ -n "$project" ]; then mkdir -p .vercel; [ -z "$STUB_PROJECT" ] || project="$STUB_PROJECT"; printf "%s\\n" "$project" > .vercel/project.json; fi`,
    'case " $* " in *" deploy --prebuilt --prod "*) if [ "$(basename "$PWD")" = kingdown ]; then test -f .vercel/output/config.json && test -d .vercel/output/functions/mcp.func && cmp -s "$STUB_DIST/index.html" .vercel/output/static/index.html || exit 1; fi ;; esac',
    // STUB_PUBLISH_DIR: the fake CLI puts the published static tree there, as the live site after the switch.
    'case " $* " in *" deploy --prebuilt --prod "*) if [ -n "$STUB_PUBLISH_DIR" ]; then rm -rf "$STUB_PUBLISH_DIR" && cp -R .vercel/output/static "$STUB_PUBLISH_DIR"; fi ;; esac',
    'case " $* " in *" env add "*) cat > "$STUB_ENV_DIR/$5" ;; esac',
  ]);
  const env = { PATH: `${bin}:${repo.env.PATH}`, STUB_FAIL: '', STUB_HANG: '', STUB_DIST: '', STUB_PROJECT: '', STUB_NEW_ENGINE: '', STUB_TAMPER_ENGINE: '', STUB_STAGING_MANIFEST: '', STUB_LINK_MODULES: '', STUB_PUBLISH_DIR: '', KINGDOWN_STAGE: '', VITE_KINGDOWN_STAGE: '', VITE_SUPABASE_URL: productionSupabase, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', KINGDOWN_ENGINES_DATABASE_URL: '', DEPLOY_LIVE_URL: 'http://127.0.0.1:9', DEPLOY_LIVE_TIMEOUT_MS: '1500' };
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
  it('links only the approved plugin project in setup mode and publishes nothing', () => {
    const { repo, deploy, calls } = setup();
    const before = repo.git('worktree', 'list', '--porcelain').stdout;
    const result = deploy(['--setup-plugin']);
    expect(result.status, result.stderr).toBe(0);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      'npx --yes vercel@62.2.0 link --project kingdown-plugin --scope saars-projects-2c777ec5 --yes',
      'npx --yes vercel@62.2.0 project inspect kingdown-plugin --scope saars-projects-2c777ec5',
    ]);
    expect(result.stdout).toContain('published nothing');
    expect(repo.git('worktree', 'list', '--porcelain').stdout).toBe(before);
  });

  it('refuses a link to the wrong team or project', () => {
    const { deploy } = setup();
    for (const change of [{ orgId: 'team_wrong' }, { projectName: 'kingdown' }, { projectId: 'invalid' }]) {
      const result = deploy(['--setup-plugin'], { STUB_PROJECT: JSON.stringify({ ...pluginProject, ...change }) });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('FAIL at verify plugin project');
      expect(result.stdout).not.toContain('inspect plugin project');
    }
  });

  it.each(['website', 'plugin'])('requires a test database before it makes a %s worktree', target => {
    const { deploy, calls } = setup();
    for (const url of ['', 'postgresql://localhost/plugin_test?host=remote.example', 'postgresql://remote.example/plugin_test', 'postgresql://localhost/production']) {
      const result = deploy(['--target', target], { PLUGIN_TEST_DATABASE_URL: url });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('database');
      expect(calls()).toEqual([]);
      expect(result.stdout).not.toContain('worktree');
    }
  });

  it.each(['website', 'plugin'])('requires the engines setting before any %s publish work', target => {
    const { repo, deploy, calls } = setup();
    const gitLog = join(repo.root, 'git-calls');
    // Publication does no Git work before this check.
    stub(join(repo.root, 'bin', 'git'), [`echo git >> "${gitLog}"`, 'exit 99']);
    const result = deploy(['--target', target, '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: '' });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('set KINGDOWN_ENGINES_DATABASE_URL before --publish');
    expect(result.stdout).not.toMatch(/step|worktree|skipped/);
    expect(calls()).toEqual([]);
    expect(existsSync(gitLog)).toBe(false);
  });

  it.each([
    ['staging', 'postgresql://kingdown_plugin_runtime.puhspsyjyzaghmgtkzqd:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require'],
    ['staging direct', 'postgresql://kingdown_plugin_runtime:fake-engines-password@db.puhspsyjyzaghmgtkzqd.supabase.co/postgres?sslmode=require'],
    ['loopback', 'postgresql://kingdown_test:fake-engines-password@127.0.0.1:55432/kingdown_test'],
    ['other host', 'postgresql://reader:fake-engines-password@db.example/postgres?sslmode=require'],
    ['NUL-split user', 'postgresql://postgres.puhspsyjyzaghmgtkzqd%00application_name%00x.utqzovjmclfyojedmwok:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require'],
    ['cluster-alias user', 'postgresql://kingdown_plugin_runtime.cluster.review.utqzovjmclfyojedmwok:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require'],
    ['NUL-split database', 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres%00user%00postgres.puhspsyjyzaghmgtkzqd?sslmode=require'],
  ])('refuses a %s engines database before any publish work', (_, database) => {
    const { repo, deploy, calls } = setup();
    const gitLog = join(repo.root, 'git-calls');
    stub(join(repo.root, 'bin', 'git'), [`echo git >> "${gitLog}"`, 'exit 99']);
    for (const target of ['website', 'plugin']) {
      const result = deploy(['--target', target, '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: database });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('KINGDOWN_ENGINES_DATABASE_URL must name the production Supabase database, with no PGOPTIONS, before --publish');
      expect(result.stderr + result.stdout).not.toContain('fake-engines-password');
      expect(result.stdout).not.toMatch(/step|worktree|skipped/);
    }
    expect(calls()).toEqual([]);
    expect(existsSync(gitLog)).toBe(false);
  });

  it('refuses PGOPTIONS with a production engines database before any publish work', () => {
    const { repo, deploy, calls } = setup();
    const gitLog = join(repo.root, 'git-calls');
    stub(join(repo.root, 'bin', 'git'), [`echo git >> "${gitLog}"`, 'exit 99']);
    const result = deploy(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, PGOPTIONS: 'reference=puhspsyjyzaghmgtkzqd' });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('with no PGOPTIONS, before --publish');
    expect(result.stderr + result.stdout).not.toMatch(/fake-engines-password|reference=/);
    expect(calls()).toEqual([]);
    expect(existsSync(gitLog)).toBe(false);
  });

  it('checks a repository that holds the staging plan; the old staging-repository block is gone', () => {
    const { repo, deploy } = setup();
    repo.write('docs/specs/staging-first-game/plan.md', '# Independent staging project\n');
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).not.toContain('disabled in this staging repository');
  });

  it('refuses every staging setting in every mode before any work', () => {
    const { repo, deploy, calls } = setup();
    const before = repo.git('worktree', 'list', '--porcelain').stdout;
    const modes = [[], ['--publish'], ['--target', 'plugin'], ['--target', 'plugin', '--publish'], ['--setup-plugin'], ['--configure', 'unused-private-env'], ['--configure-plugin', 'unused-private-env']];
    for (const name of ['KINGDOWN_STAGE', 'VITE_KINGDOWN_STAGE']) for (const args of modes) {
      const result = deploy(args, { [name]: 'staging', KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase });
      expect([args, result.status]).toEqual([args, 2]);
      expect(result.stderr).toContain(`unset ${name}; production refuses staging settings`);
      expect(result.stdout).not.toMatch(/step|worktree|skipped/);
    }
    for (const [change, message] of [[{ VITE_SUPABASE_URL: stagingSupabase }, 'set VITE_SUPABASE_URL='], [{ VITE_SUPABASE_URL: '' }, 'set VITE_SUPABASE_URL='], [{ VITE_SUPABASE_PUBLISHABLE_KEY: '' }, 'VITE_SUPABASE_PUBLISHABLE_KEY'], [{ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' }, 'VITE_SUPABASE_PUBLISHABLE_KEY'], [{ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_bad key' }, 'VITE_SUPABASE_PUBLISHABLE_KEY']] as const) for (const args of [[], ['--publish']]) {
      const result = deploy(args, { ...change, KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(message);
      expect(result.stderr).not.toContain('private');
    }
    expect(calls()).toEqual([]);
    expect(repo.git('worktree', 'list', '--porcelain').stdout).toBe(before);
  });

  it('refuses a build that carries the staging manifest before publication', () => {
    const { repo, deploy, calls } = setup();
    const result = deploy(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_STAGING_MANIFEST: '1' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('the build carries the staging manifest');
    expect(result.stderr).toContain('FAIL at production artifact');
    expect(calls().some(line => line.startsWith('npx ') || line.includes('check:vercel'))).toBe(false);
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('records the published bytes and refuses a changed engine archive', () => {
    const { repo, deploy, calls } = setup();
    // A real archive name is the engine's source hash, not the sha256 of its bytes.
    const archive = 'engine bytes\n', hash = createHash('sha256').update(archive).digest('hex'), name = `${'a'.repeat(64)}.mjs`;
    repo.write(`engines/${name}`, archive);
    repo.git('add', '.'); repo.git('commit', '-q', '-m', 'engine'); repo.git('push', '-q', 'origin', 'main');
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`deploy: sha256 ${createHash('sha256').update('page').digest('hex')} static/index.html`);
    expect(result.stdout).toContain(`deploy: sha256 ${createHash('sha256').update('worker').digest('hex')} static/sw.js`);
    expect(result.stdout).toContain(`deploy: sha256 ${hash} engine archive ${name}`);
    expect(result.stdout).toContain('deploy: 1 engine archives unchanged; no staging manifest');
    const changed = deploy(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_TAMPER_ENGINE: '1' });
    expect(changed.status).not.toBe(0);
    expect(changed.stderr).toContain(`engine archive ${name} changed`);
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
  });

  it('builds with its own node_modules when wt links the shared installation', () => {
    const { deploy, calls } = setup();
    const result = deploy([], { STUB_LINK_MODULES: tmpdir() });
    expect(result.status, result.stderr).toBe(0);
    const log = calls().map(line => line.replace(/ @ .*/, ''));
    expect(log.slice(0, 2)).toEqual([`wt.sh add ${worktreeOf(result.stdout)}`, 'npm ci']);
    expect(calls().find(line => line.startsWith('npm run build:vercel'))).not.toMatch(/ node_modules /);
  });

  it('names the missing GitHub remote before it makes a worktree', () => {
    const { repo, deploy, calls } = setup();
    repo.git('remote', 'rename', 'origin', 'source');
    const result = deploy();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('add the GitHub remote origin');
    expect(calls()).toEqual([]);
  });

  it.each(['/tmp/other.git', 'https://github.com/SaarShai/king-down-chess-fork.git', 'https://github.com/Other/king-down-chess.git', 'git@github.com:Other/king-down-chess.git'])('stops before the fetch when origin is %s', url => {
    const { repo, deploy, calls } = setup();
    repo.git('remote', 'set-url', 'origin', url);
    const result = deploy();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('remote origin must be the GitHub repository SaarShai/king-down-chess');
    expect(result.stdout).not.toContain('fetch origin');
    expect(calls()).toEqual([]);
  });

  it.each(['https://github.com/SaarShai/king-down-chess', 'git@github.com:SaarShai/king-down-chess.git', 'ssh://git@github.com/SaarShai/king-down-chess'])('accepts the GitHub origin form %s', url => {
    const { repo, deploy } = setup();
    repo.git('remote', 'set-url', 'origin', url);
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
  });

  it('stops before the fetch when an insteadOf rule rewrites the GitHub origin to another repository', () => {
    const { repo, deploy, calls } = setup();
    repo.git('init', '-q', '--bare', '-b', 'main', join(repo.root, 'other.git'));
    repo.git('config', `url.${join(repo.root, 'other.git')}.insteadOf`, 'https://github.com/SaarShai/king-down-chess.git');
    const result = deploy();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('remote origin must be the GitHub repository SaarShai/king-down-chess');
    expect(result.stdout).not.toContain('fetch origin');
    expect(calls()).toEqual([]);
  });

  it('fetches main into origin/main even when remote.origin.fetch maps another branch there', () => {
    const { repo, deploy, calls } = setup();
    const main = head(repo, 'HEAD');
    repo.git('checkout', '-q', '-b', 'other');
    repo.write('app.txt', 'other\n');
    repo.git('commit', '-q', '-am', 'other');
    repo.git('push', '-q', 'origin', 'other');
    repo.git('checkout', '-q', 'main');
    repo.git('config', 'remote.origin.fetch', '+refs/heads/other:refs/remotes/origin/main');
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const npmTest = calls().find(line => line.startsWith('test-lock.sh '))?.replace(/ with .*/, '');
    expect(npmTest).toBe(`test-lock.sh bash tools/test-unlocked.sh @ ${main} in ${worktreeOf(result.stdout)}`);
  });

  it('sets only the seven plugin values through stdin and prints none of their values', () => {
    const { repo, deploy, calls } = setup();
    const values = {
      KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown-plugin.vercel.app',
      SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: 'a6478e14-9e9a-43a7-a4b7-b888aed30791',
      KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake-test-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
      KINGDOWN_PLUGIN_OAUTH_READY: '0', KINGDOWN_INTERNAL_SECRET: 'fake-internal-secret-for-plugin-tests',
    };
    const file = join(repo.root, 'plugin.env');
    const inputDir = join(repo.root, 'env-input'); mkdirSync(inputDir);
    writeFileSync(file, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n'), { mode: 0o600 });
    const result = deploy(['--configure-plugin', file], { STUB_ENV_DIR: inputDir });
    expect(result.status, result.stderr).toBe(0);
    for (const [key, value] of Object.entries(values)) expect(readFileSync(join(inputDir, key), 'utf8')).toBe(value);
    const writes = calls().filter(line => line.includes(' env add '));
    expect(writes).toHaveLength(7);
    expect(writes.every(line => line.includes('production --force --sensitive --yes --scope saars-projects-2c777ec5'))).toBe(true);
    expect(result.stdout + result.stderr + calls().join('\n')).not.toMatch(/fake-test-password|fake-internal-secret/);
    expect(calls().some(line => line.startsWith('npm ') || line.includes(' deploy '))).toBe(false);

    const before = calls().length;
    const valid = readFileSync(file, 'utf8');
    for (const data of [valid + '\nUNEXPECTED=value', valid.replace('kingdown_plugin_runtime.', 'postgres.'), valid.replace('?sslmode=require', '?user=postgres&host=wrong.example'), valid.replace('?sslmode=require', ''), valid.replace(values.KINGDOWN_INTERNAL_SECRET, 'short'), valid.replace(/\nKINGDOWN_INTERNAL_SECRET=.*/, '')]) {
      writeFileSync(file, data);
      const invalid = deploy(['--configure-plugin', file], { STUB_ENV_DIR: inputDir });
      expect(invalid.status).not.toBe(0);
      expect(invalid.stdout + invalid.stderr).not.toMatch(/fake-test-password|fake-internal-secret/);
      expect(calls()).toHaveLength(before);
    }
    chmodSync(file, 0o644);
    const publicFile = deploy(['--configure-plugin', file], { STUB_ENV_DIR: inputDir });
    expect(publicFile.status).not.toBe(0);
    expect(publicFile.stderr).toContain('mode 600');
    expect(calls()).toHaveLength(before);
  });

  it('configures the combined project through private stdin and refuses mail or invalid server keys', () => {
    const { repo, deploy, calls } = setup();
    const values = {
      KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev', SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '11111111-1111-4111-8111-111111111111',
      KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake-site-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
      KINGDOWN_PLUGIN_OAUTH_READY: '0', KINGDOWN_INTERNAL_SECRET: 'fake-internal-secret-for-release-tests',
    };
    const file = join(repo.root, 'site.env'), inputDir = join(repo.root, 'env-input'); mkdirSync(inputDir);
    const valid = Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n');
    writeFileSync(file, valid, { mode: 0o600 });
    const result = deploy(['--configure', file], { STUB_ENV_DIR: inputDir });
    expect(result.status, result.stderr).toBe(0);
    for (const [key, value] of Object.entries(values)) expect(readFileSync(join(inputDir, key), 'utf8')).toBe(value);
    expect(calls().filter(line => line.includes(' env add '))).toHaveLength(7);
    expect(calls()[0]).toContain('link --project kingdown --scope saars-projects-2c777ec5 --yes');
    expect(calls().some(line => line.startsWith('npm ') || line.includes(' deploy '))).toBe(false);
    expect(result.stdout + result.stderr + calls().join('\n')).not.toMatch(/fake-site-password|fake-internal-secret/);
    const before = calls().length;
    for (const data of [valid + '\nRESEND_API_KEY=forbidden', valid + '\nKINGDOWN_MAIL_FROM=forbidden', valid + '\nKINGDOWN_ENGINES_DATABASE_URL=forbidden', valid + '\nPLUGIN_TEST_DATABASE_URL=forbidden', valid.replace('https://kingdown.dev', 'https://wrong.example'), valid.replace(values.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS, 'a6478e14-9e9a-43a7-a4b7-b888aed30791'), valid.replace(values.KINGDOWN_INTERNAL_SECRET, 'short'), valid.replace('kingdown_plugin_runtime.', 'postgres.'), valid.replace('?sslmode=require', ''), valid.replace(values.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS, 'invalid'), valid.replace('KINGDOWN_INTERNAL_SECRET=', 'UNEXPECTED=')]) {
      writeFileSync(file, data);
      const invalid = deploy(['--configure', file], { STUB_ENV_DIR: inputDir });
      expect(invalid.status).not.toBe(0); expect(calls()).toHaveLength(before);
      expect(invalid.stdout + invalid.stderr).not.toMatch(/fake-site-password|fake-internal-secret/);
    }
    writeFileSync(file, valid); chmodSync(file, 0o644);
    expect(deploy(['--configure', file], { STUB_ENV_DIR: inputDir }).status).not.toBe(0);
    expect(calls()).toHaveLength(before);
    chmodSync(file, 0o600);
    const wrong = deploy(['--configure', file], { STUB_ENV_DIR: inputDir, STUB_PROJECT: JSON.stringify({ ...siteProject, orgId: 'team_wrong' }) });
    expect(wrong.status).not.toBe(0); expect(wrong.stderr).toContain('FAIL at verify site project');
    expect(calls().filter(line => line.includes(' env add '))).toHaveLength(7);
  });

  it('runs every plugin gate without a Vercel call by default', () => {
    const { repo, deploy, calls } = setup();
    const result = deploy(['--target', 'plugin'], { PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test' });
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`, 'npm run plugin:db:init-test', 'test-lock.sh bash tools/test-unlocked.sh',
      'npm run plugin:build:vercel',
      'npm run plugin:server:check -- plugin-deploy/.vercel/output/functions/mcp.func',
      'npm run plugin:smoke', 'npm run plugin:check:protocol',
      'node tools/check.mjs plugin-oauth plugin-ui plugin-ui-http',
    ]);
    expect(result.stdout).toContain('published nothing');
    expect(result.stdout).toContain('KINGDOWN_ENGINES_DATABASE_URL is not set; skipped the check of engines in use');
    expectGone(repo, path);
  });

  it.each(['website', 'plugin'])('checks unfinished engines for %s without printing the database URL', target => {
    const { deploy, calls } = setup();
    const database = { PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase };
    const result = deploy(['--target', target], database);
    expect(result.status, result.stderr).toBe(0);
    const lines = calls().map(line => line.replace(/ @ .*/, ''));
    const build = target === 'website' ? 'build:vercel' : 'plugin:build:vercel';
    const artifact = target === 'website' ? 'kingdown-deploy' : 'plugin-deploy';
    expect(lines.slice(lines.indexOf(`npm run ${build}`), lines.indexOf(`npm run ${build}`) + 2)).toEqual([
      `npm run ${build}`, `node tools/engines-check.mjs ${artifact}/.vercel/output/functions/mcp.func/runtime/engines`,
    ]);
    expect(result.stdout + result.stderr + calls().join('\n')).not.toContain('fake-engines-password');
    // Check-only mode keeps the general checker: a local test database passes the shell gate.
    const local = deploy(['--target', target], { ...database, KINGDOWN_ENGINES_DATABASE_URL: 'postgresql://kingdown_test@127.0.0.1:55432/kingdown_test' });
    expect(local.status, local.stderr).toBe(0);
    const failed = deploy(['--target', target, '--publish'], { ...database, STUB_FAIL: 'tools/engines-check.mjs' });
    expect(failed.status).not.toBe(0);
    expect(failed.stderr).toContain('FAIL at engines in use');
    expect(failed.stdout + failed.stderr + calls().join('\n')).not.toContain('fake-engines-password');
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
  });

  it.each(['website', 'plugin'])('refuses a %s release with an engine not on origin/main', target => {
    const { repo, deploy, calls } = setup();
    const result = deploy(['--target', target, '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', STUB_NEW_ENGINE: '1' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at engine archive');
    expect(result.stderr).toContain('engines/');
    expect(calls().some(line => line.startsWith('npx ') || line.includes('plugin:server:check'))).toBe(false);
    expectGone(repo, worktreeOf(result.stdout));
  });

  it.each(['plugin:db:init-test', 'tools/test-unlocked.sh', 'plugin:build:vercel', 'plugin:server:check', 'plugin:smoke', 'plugin:check:protocol', 'plugin-ui'])('stops the failed plugin gate %s before publication', fail => {
    const { repo, deploy, calls } = setup();
    const result = deploy(['--target', 'plugin', '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', STUB_FAIL: fail });
    expect(result.status, fail).not.toBe(0);
    expect(calls().some(line => line.startsWith('npx '))).toBe(false);
    expectGone(repo, worktreeOf(result.stdout));
  });

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

  it('checks the combined tree and every release gate on fresh origin/main before publication', () => {
    const { deploy, calls } = setup();
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const path = worktreeOf(result.stdout);
    expect(calls().map(line => line.replace(/ @ .*/, ''))).toEqual([
      `wt.sh add ${path}`,
      'npm run plugin:db:init-test',
      'test-lock.sh bash tools/test-unlocked.sh',
      'node tools/check.mjs',
      'npm run build:vercel',
      'npm run check:vercel',
      'node tools/check.mjs web-online',
    ]);
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

// The live check (secrets-and-public-gates/10). A local server stands in for the live site. It serves
// a set of files and records each request; a request with a cookie header gets a 400 and is recorded.
const folders: string[] = [];
const servers: { close: () => void }[] = [];
afterEach(() => {
  while (servers.length) servers.pop()!.close();
  while (folders.length) rmSync(folders.pop()!, { recursive: true, force: true });
});

/** The pages of a build: the entry script name is the bundle name. */
const offlineFiles = ['./', 'index.html', 'assets/style.css', 'assets/lazy.js', 'assets/ai-worker.js', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'];
const pages = (bundle = 'index-Abc123_x', terms = 'Terms v1') => ({
  'index.html': `<!doctype html><html><head><script type="module" crossorigin src="./assets/${bundle}.js"></script></head><body></body></html>`,
  'privacy.html': '<!doctype html><title>Privacy</title><p>Privacy v1</p>\n',
  'terms.html': `<!doctype html><title>Terms</title><p>${terms}</p>\n`,
  'delete-data.html': '<!doctype html><title>Delete data</title><p>Delete v1</p>\n',
  'support.html': '<!doctype html><title>Support</title><p>Support v1</p>\n',
  'sw.js': `const VERSION = 'build-v1';\nconst POLICY = 'public-build-v1';\nconst ALLOWLIST = ${JSON.stringify([...offlineFiles, `assets/${bundle}.js`])};\nconst PRECACHE = ${JSON.stringify([...offlineFiles, `assets/${bundle}.js`])};`,
  [`assets/${bundle}.js`]: 'entry-v1',
  'assets/style.css': 'body { color: black; }',
  'assets/lazy.js': 'lazy-v1',
  'assets/ai-worker.js': 'worker-v1',
  'fonts/game.woff2': 'font-v1',
  'icons/game.png': 'icon-v1',
  'ui/board.webp': 'board-v1',
  'ui/piece.svg': '<svg/>',
  'manifest.webmanifest': '{}',
});
const appPages = ['/play', '/play/', '/play/profile', '/play/settings', '/g/00000000-0000-4000-8000-000000000000', '/j', '/j/'];
const closedPages = ['/play.html', '/j/deploy-check-inert-token', '/deploy-check-unknown'];
const apiPaths = ['/api', '/api/status', '/api/games', '/api/me/games'];
const apiProbes = ['GET /api', 'POST /api', 'GET /api/status', 'POST /api/status', 'GET /api/me/games', 'POST /api/games'];
const apiClosure = JSON.stringify({ code: 'NOT_FOUND', message: 'Not found' });
type Access = 'closed' | 'open';
/** The site API's answer to an unsigned probe while the 0016 switch is `access` (src/api/http.ts). */
function apiAnswer(method: string, path: string, access: Access): [number, unknown] {
  if (path === '/api') return [404, { code: 'NOT_FOUND', message: 'Not found' }];
  if (path === '/api/status' && method === 'GET') return [200, { account_access: access, valid_for_ms: access === 'open' ? 4999 : 0 }];
  if (`${method} ${path}` === 'GET /api/me/games' || `${method} ${path}` === 'POST /api/games') return access === 'open' ? [401, { code: 'UNAUTHENTICATED', message: 'Sign in again' }] : [503, { code: 'UNAVAILABLE', message: 'Account play is temporarily unavailable.' }];
  return [405, { code: 'NOT_ALLOWED', message: 'Method not allowed' }];
}
/** Serve an app page or an API answer as the site routes do; false for any other path. */
function siteRoute(req: IncomingMessage, res: ServerResponse, path: string, files: Record<string, string>, access: Access) {
  if (appPages.includes(path)) { res.writeHead(200, { 'content-type': 'text/html' }).end(files['index.html']); return true; }
  if (!apiPaths.includes(path)) return false;
  const [status, body] = apiAnswer(req.method ?? 'GET', path, access);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(JSON.stringify(body));
  return true;
}
const contentType = (path: string) => ({ js: 'text/javascript', css: 'text/css', json: 'application/json', woff2: 'font/woff2', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' })[path.split('.').at(-1)!] ?? 'text/html';

/** A build folder with the given pages. */
function buildFolder(files: Record<string, string>) {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'deploy-build-'));
  folders.push(dir);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

/** The files of a folder by path, as `pages()` gives them. */
const tree = (dir: string): Record<string, string> => Object.fromEntries(readdirSync(dir, { recursive: true }).map(String)
  .filter(file => statSync(join(dir, file)).isFile()).map(file => [file, readFileSync(join(dir, file), 'utf8')]));

/** A folder that a local site serves as the live site: `files` until the fake CLI puts the publish copy
 *  there (STUB_PUBLISH_DIR), as Vercel switches to a new deployment. */
function liveFolder(files: Record<string, string>) {
  const dir = join(buildFolder({}), 'live');
  cpSync(buildFolder(files), dir, { recursive: true });
  return dir;
}

/** An old live build: its bundle imports a lazy chunk, the chunk names a style and the style an image. */
const oldBuild = (): Record<string, string> => ({
  ...pages('index-OldA1234'),
  'assets/index-OldA1234.js': 'import("./chunk-OldB1234.js")',
  'assets/chunk-OldB1234.js': 'const style = "assets/style-OldC1234.css";',
  'assets/style-OldC1234.css': 'body { background: url(/assets/art-OldD1234.webp) }',
  'assets/art-OldD1234.webp': 'old art',
});

/** A local site. `files` can change between requests; `/` serves `index.html`. */
async function site(files: () => Record<string, string>, challengeReply: { status?: number; type?: string | null; location?: string; path?: string; body?: string; cache?: string | null; drop?: number } = {}, access: Access = 'closed') {
  const requests: { path: string; method?: string; cookie?: string }[] = [];
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    requests.push({ path, method: req.method, cookie: req.headers.cookie });
    // drop: close the connection with no reply this many times, as a network fault does.
    if (challengeReply.drop && path === challengeReply.path) { challengeReply.drop--; req.socket.destroy(); return; }
    if (req.headers.cookie !== undefined) { res.writeHead(400).end('cookie sent'); return; }
    const body = files()[path === '/' ? 'index.html' : path.slice(1)];
    if (path === (challengeReply.path ?? '/.well-known/openai-apps-challenge')) {
      const api = apiPaths.includes(path);
      const type = challengeReply.type === undefined ? (api ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8') : challengeReply.type;
      const cache = challengeReply.cache === undefined && api ? 'no-store' : challengeReply.cache;
      res.writeHead(challengeReply.status ?? (body === undefined ? 404 : 200), { ...(type ? { 'content-type': type } : {}), ...(cache ? { 'cache-control': cache } : {}), ...(challengeReply.location ? { location: challengeReply.location } : {}) }).end(challengeReply.body ?? body);
      return;
    }
    if (body === undefined && siteRoute(req, res, path, files(), access)) return;
    if (body === undefined) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': contentType(path), 'set-cookie': 'visit=1; Path=/' }).end(body);
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

describe('deploy-live-check.mjs', () => {
  const challenge = '.well-known/openai-apps-challenge';

  it('passes when the live site serves the build, and sends no cookie', async () => {
    const files = pages();
    const live = await site(() => files);
    const result = await check(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('index-Abc123_x.js');
    expect(live.requests.map(r => `${r.method} ${r.path}`).sort()).toEqual([
      ...Object.keys(files).map(file => `GET /${file}`), 'GET /', ...[...appPages, ...closedPages].map(path => `GET ${path}`), ...apiProbes,
    ].sort());
    expect(result.stdout).toContain('sw.js version build-v1, policy public-build-v1, sha256');
    expect(result.stdout).toContain("7 app pages serve the build's index.html; 3 closed paths answer 404; account_access closed; 5 API probes pass");
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('fails within the time limit when the live site loads a different bundle, and names both bundles', async () => {
    const live = await site(() => ({ ...pages(), 'index.html': pages('index-Old999')['index.html'] }));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/bundle: .*index-Old999\.js.*index-Abc123_x\.js/);
    expect(result.stderr).not.toMatch(/terms\.html|privacy\.html|delete-data\.html|support\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('fails within the time limit when the live terms page differs, and names only that page', async () => {
    const live = await site(() => pages(undefined, 'Terms v2'));
    const result = await check(buildFolder(pages()), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toMatch(/terms\.html: the live page differs/);
    expect(result.stderr).not.toMatch(/bundle:|privacy\.html|delete-data\.html|support\.html/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it.each(['missing', 'stale'])('refuses a %s support page within the time limit', async fault => {
    const files = pages(), served: Record<string,string> = {...files};
    if (fault === 'missing') delete served['support.html']; else served['support.html'] = 'Old support';
    const live = await site(() => served);
    const result = await check(buildFolder(files), live.url, 1500);
    expect(result.status).toBe(1);
    expect(result.seconds).toBeLessThan(1.5 + 5);
    expect(result.stderr).toContain('support.html');
  });

  it('tries again until the live site serves the build, inside the time limit', async () => {
    let served = 0;
    const live = await site(() => (served++ === 0 ? { ...pages(), 'index.html': pages('index-Old999')['index.html'] } : pages()));
    const result = await check(buildFolder(pages()), live.url, 3000);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.filter(r => r.path === '/').length).toBe(2);
  });

  it.each(['sw.js', 'assets/index-Abc123_x.js', 'assets/lazy.js', 'assets/ai-worker.js', 'assets/style.css', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'])('rejects stale public bytes at %s', async path => {
    const files = pages();
    const live = await site(() => ({ ...files, [path]: 'stale bytes' }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${path}: the live page differs`);
  });

  it('compares every file under assets/, also one that no worker list names', async () => {
    const files = { ...pages(), 'assets/chunk-OldB1234.js': 'old chunk' };
    const live = await site(() => files);
    const pass = await check(buildFolder(files), live.url);
    expect(pass.status, pass.stderr).toBe(0);
    expect(live.requests.some(r => r.path === '/assets/chunk-OldB1234.js')).toBe(true);
    expect(pass.stdout).toContain('public files match bytes and types (5 under /assets/)');
    const stale = await site(() => ({ ...files, 'assets/chunk-OldB1234.js': 'other bytes' }));
    const changed = await check(buildFolder(files), stale.url, 0);
    expect(changed.status).toBe(1);
    expect(changed.stderr).toContain('assets/chunk-OldB1234.js: the live page differs');
    const missing = await site(() => pages());
    const fail = await check(buildFolder(files), missing.url, 0);
    expect(fail.status).toBe(1);
    expect(fail.stderr).toContain('/assets/chunk-OldB1234.js: HTTP 404');
  });

  it('rejects a missing offline asset', async () => {
    const files = pages(), served: Record<string, string> = { ...files };
    delete served['assets/lazy.js'];
    const live = await site(() => served);
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/assets/lazy.js: HTTP 404');
  });

  it.each(['sw.js', 'assets/index-Abc123_x.js', 'assets/style.css', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'])('rejects an HTML fallback type for %s', async path => {
    const files = pages(), live = await site(() => files, { path: `/${path}`, type: 'text/html' });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`/${path}: expected `);
  });

  it.each(closedPages)('rejects an open route at %s', async path => {
    const files = pages(), live = await site(() => ({ ...files, [path.slice(1)]: '<html>unexpected</html>' }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`GET ${path}: expected 404 without redirect, got HTTP 200`);
  });

  it.each(appPages)('requires the build\'s index.html at the app page %s', async path => {
    const files = pages();
    for (const served of [{ ...files, [path.slice(1)]: 'stale shell' }, undefined]) {
      const live = served ? await site(() => served) : await site(() => files, { path, status: 404, type: 'text/html', body: 'not found' });
      const result = await check(buildFolder(files), live.url, 0);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(served ? `${path.slice(1)} (app page): the live page differs` : `${path}: HTTP 404`);
    }
  });

  it('passes with the switch open and prints the account state', async () => {
    const files = pages(), live = await site(() => files, {}, 'open');
    const result = await check(buildFolder(files), live.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('account_access open; 5 API probes pass');
  });

  it.each([
    { name: 'HTML 404', type: 'text/html', body: '<html>Not found</html>' },
    { name: 'missing JSON type', type: null, body: apiClosure },
    { name: 'empty 404', body: '' },
    { name: 'malformed JSON', body: '{broken' },
    { name: 'wrong code', body: JSON.stringify({ code: 'UNAVAILABLE' }) },
    { name: 'missing no-store', body: apiClosure, cache: null },
    { name: 'cacheable closure', body: apiClosure, cache: 'max-age=60' },
    { name: 'verifier 503', status: 503, body: JSON.stringify({ code: 'UNAVAILABLE' }) },
  ])('rejects $name for GET and POST /api', async fault => {
    const live = await site(() => pages(), { path: '/api', ...fault });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    for (const method of ['GET', 'POST']) expect(result.stderr).toContain(`${method} /api:`);
  });

  it.each([
    { name: 'a missing status', status: 404, body: apiClosure, message: 'GET /api/status: expected JSON HTTP 200' },
    { name: 'an unknown state', status: 200, body: JSON.stringify({ account_access: 'maybe', valid_for_ms: 0 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'a cacheable status', status: 200, body: JSON.stringify({ account_access: 'closed', valid_for_ms: 0 }), cache: 'max-age=60', message: 'GET /api/status: expected JSON HTTP 200' },
    // src/api/http.ts: a closed state has no lease; an open state has a positive lease.
    { name: 'a closed state with a lease', status: 200, body: JSON.stringify({ account_access: 'closed', valid_for_ms: 5000 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'an open state without a lease', status: 200, body: JSON.stringify({ account_access: 'open', valid_for_ms: 0 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
    { name: 'an open state with a negative lease', status: 200, body: JSON.stringify({ account_access: 'open', valid_for_ms: -1 }), message: 'expected account_access closed (valid_for_ms 0) or open (valid_for_ms > 0)' },
  ])('rejects $name at /api/status', async ({ message, ...fault }) => {
    const live = await site(() => pages(), { path: '/api/status', ...fault });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it.each([
    { path: '/api/me/games', status: 200, body: '[]', message: 'GET /api/me/games: expected JSON HTTP 503 UNAVAILABLE' },
    { path: '/api/me/games', status: 401, body: JSON.stringify({ code: 'UNAUTHENTICATED' }), message: 'GET /api/me/games: expected JSON HTTP 503 UNAVAILABLE' },
    { path: '/api/games', status: 201, body: '{}', message: 'POST /api/games: expected JSON HTTP 503 UNAVAILABLE' },
  ])('rejects an account call that does not refuse while the switch is closed ($path HTTP $status)', async ({ message, ...fault }) => {
    const live = await site(() => pages(), fault);
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it('rejects an unsigned account call that succeeds while the switch is open', async () => {
    const live = await site(() => pages(), { path: '/api/me/games', status: 200, body: '[]' }, 'open');
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GET /api/me/games: expected JSON HTTP 401 UNAUTHENTICATED');
  });

  it.each([302, 404])('rejects a closed-route redirect header with HTTP %s and does not follow it', async status => {
    const live = await site(() => pages(), { path: '/deploy-check-unknown', status, location: '/redirect-target' });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GET /deploy-check-unknown: expected 404 without redirect');
    expect(live.requests.some(request => request.path === '/redirect-target')).toBe(false);
  });

  it('rejects a redirect for the worker and does not follow it', async () => {
    const live = await site(() => pages(), { path: '/sw.js', status: 307, location: '/redirect-target' });
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/sw.js: HTTP 307');
    expect(live.requests.some(request => request.path === '/redirect-target')).toBe(false);
  });

  it('rejects an incomplete local build before it sends a probe', async () => {
    const files: Record<string, string> = { ...pages() }, live = await site(() => pages());
    delete files['assets/lazy.js'];
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('the build has no assets/lazy.js');
    expect(live.requests).toEqual([]);
  });

  it('checks the exact domain challenge bytes as plain text with no cookie', async () => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files);
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`${challenge} are identical to the build`);
    expect(live.requests.filter(r => r.path === `/${challenge}`)).toHaveLength(1);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it('skips a live domain challenge when the build has no file', async () => {
    const live = await site(() => ({ ...pages(), [challenge]: randomUUID() }));
    const result = await check(buildFolder(pages()), live.url, 0);
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.some(r => r.path === `/${challenge}`)).toBe(false);
  });

  it.each(['application/json', 'text/html', 'text/plainly', null])('rejects a domain challenge with type %s', async type => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files, { type });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: expected text/plain`);
  });

  it.each([201, 301, 302, 307, 308])('rejects domain challenge status %s and follows no redirect', async status => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => files, { status, location: '/token' });
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: HTTP ${status}`);
    expect(live.requests.some(r => r.path === '/token')).toBe(false);
  });

  it('rejects a missing live domain challenge', async () => {
    const live = await site(() => pages());
    const result = await check(buildFolder({ ...pages(), [challenge]: randomUUID() }), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: HTTP 404`);
  });

  it('rejects a domain challenge that differs by one byte', async () => {
    const files = { ...pages(), [challenge]: randomUUID() };
    const live = await site(() => ({ ...files, [challenge]: files[challenge].slice(0, -1) }));
    const result = await check(buildFolder(files), live.url, 0);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${challenge}: the live page differs`);
  });
});

const keep = (folder: string, url: string) => runAsync(process.execPath, [keepAssets, folder], { env: { ...process.env, DEPLOY_LIVE_URL: url } });

describe('deploy-keep-assets.mjs', () => {
  // Each form in which a Vite build names a file under assets/, also with a query or a fragment. The
  // image holds a quoted name that the walk must not read; the page holds a sibling name outside
  // assets/. The live list of a previous release names a file that this release does not keep.
  const live = (): Record<string, string> => ({
    'index.html': '<script type="module" src="/assets/index-AAAA1111.js"></script><link rel="stylesheet" href="./assets/style-BBBB2222.css"><a href="./page-CCCC3333.js"><img srcset="/assets/small-PPPP6666.webp 1x, /assets/big-QQQQ7777.webp 2x">',
    'sw.js': 'const PRECACHE = ["assets/pre-DDDD4444.js","assets/plain.js"];',
    'assets/index-AAAA1111.js': 'import{a}from"./shared-EEEE5555.js";const m=()=>import(\'./lazy-FFFF6666.js\');const d=["assets/dep-GGGG7777.js"];new URL("/assets/worker-HHHH8888.js",import.meta.url);const p=`/assets/pic-II-I9999.webp`;const q="/assets/data-OOOO5555.json?raw";',
    'assets/style-BBBB2222.css': '@font-face{src:url(/assets/font-JJJJ0000.woff2)}.m{mask-image:url("/assets/shape-NNNN4444.svg#mark")}',
    'assets/data-OOOO5555.json': '{}', 'assets/shape-NNNN4444.svg': '<svg/>', 'assets/small-PPPP6666.webp': 'small', 'assets/big-QQQQ7777.webp': 'big',
    'assets/pre-DDDD4444.js': 'pre', 'assets/shared-EEEE5555.js': 'shared', 'assets/lazy-FFFF6666.js': 'lazy', 'assets/dep-GGGG7777.js': 'dep', 'assets/worker-HHHH8888.js': 'worker',
    'assets/pic-II-I9999.webp': 'image "./bogus-KKKK1111.js"', 'assets/font-JJJJ0000.woff2': 'font', 'assets/plain.js': 'plain', 'page-CCCC3333.js': 'page',
    'assets/kept-files.json': '["older-LLLL2222.js"]\n', 'assets/older-LLLL2222.js': 'older',
  });
  const build = (): Record<string, string> => ({ 'index.html': '<script type="module" src="/assets/index-New11111.js"></script>', 'sw.js': 'new worker', 'assets/index-New11111.js': 'import"./shared-EEEE5555.js"', 'assets/shared-EEEE5555.js': 'shared' });
  const kept = ['big-QQQQ7777.webp', 'data-OOOO5555.json', 'dep-GGGG7777.js', 'font-JJJJ0000.woff2', 'index-AAAA1111.js', 'lazy-FFFF6666.js', 'pic-II-I9999.webp', 'pre-DDDD4444.js', 'shape-NNNN4444.svg', 'small-PPPP6666.webp', 'style-BBBB2222.css', 'worker-HHHH8888.js'];

  it('keeps each file that the live build names, and changes no file of the build', async () => {
    const site_ = await site(live), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`serves 13 content-named files under /assets/; 1 are in the build with the same bytes; kept 12: ${kept.join(', ')}`);
    expect(tree(folder)).toEqual({ ...build(), ...Object.fromEntries(kept.map(file => [`assets/${file}`, live()[`assets/${file}`]])), 'assets/kept-files.json': `${JSON.stringify(kept)}\n` });
    expect(site_.requests.map(r => `${r.method} ${r.path}`).sort()).toEqual(['GET /', 'GET /sw.js', ...['shared-EEEE5555.js', ...kept].map(file => `GET /assets/${file}`)].sort());
    expect(site_.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it.each([
    ['a missing file', { 'assets/lazy-FFFF6666.js': undefined }, {}, 'GET /assets/lazy-FFFF6666.js: expected HTTP 200, got 404'],
    ['an HTML fallback', {}, { path: '/assets/lazy-FFFF6666.js', type: 'text/html', body: '<!doctype html>' }, 'GET /assets/lazy-FFFF6666.js: expected text/javascript or application/javascript, got text/html'],
    ['other bytes at a name of the build', { 'assets/shared-EEEE5555.js': 'changed' }, {}, '/assets/shared-EEEE5555.js: the live file differs from the build\'s file of the same name'],
    ['a page that names no asset', { 'index.html': 'no script', 'sw.js': 'no list' }, {}, 'and /sw.js name no file under /assets/'],
    ['a missing worker', { 'sw.js': undefined }, {}, 'GET /sw.js: expected HTTP 200, got 404'],
    ['an HTML fallback for the worker', {}, { path: '/sw.js', type: 'text/html' }, 'GET /sw.js: expected text/javascript or application/javascript, got text/html'],
    ['a page of another type', {}, { path: '/', type: 'text/plain' }, 'GET /: expected text/html, got text/plain'],
    ['an old file of a type with no check', { 'assets/style-BBBB2222.css': 'b{background:url(/assets/photo-MMMM3333.jpg)}', 'assets/photo-MMMM3333.jpg': 'jpeg' }, {}, 'GET /assets/photo-MMMM3333.jpg: the live build names a file of a type with no check'],
    ['an old file with an upper-case extension', { 'assets/style-BBBB2222.css': 'b{background:url(/assets/photo-MMMM3333.PNG)}', 'assets/photo-MMMM3333.PNG': 'png' }, {}, 'GET /assets/photo-MMMM3333.PNG: the live build names a file of a type with no check'],
  ])('stops at %s and writes no file', async (_, change, reply, message) => {
    const files = { ...live(), ...change } as Record<string, string>;
    const site_ = await site(() => files, reply), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^keep-assets: /);
    expect(result.stderr).toContain(message);
    expect(tree(folder)).toEqual(build());
  });

  it('tries a file again after a network fault, and stops after the third fault', async () => {
    const path = '/assets/lazy-FFFF6666.js', reply = { path, type: 'text/javascript' };
    const once = await site(live, { ...reply, drop: 2 }), kept_ = buildFolder(build());
    const result = await keep(kept_, once.url);
    expect(result.status, result.stderr).toBe(0);
    expect(once.requests.filter(r => r.path === path)).toHaveLength(3);
    expect(tree(kept_)['assets/lazy-FFFF6666.js']).toBe('lazy');
    // An HTTP reply gets no second try.
    const gone = live();
    delete gone['assets/lazy-FFFF6666.js'];
    const missing = await site(() => gone);
    expect((await keep(buildFolder(build()), missing.url)).status).toBe(1);
    expect(missing.requests.filter(r => r.path === path)).toHaveLength(1);
    const always = await site(live, { ...reply, drop: 3 }), folder = buildFolder(build());
    const failed = await keep(folder, always.url);
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain(`keep-assets: GET ${path}: fetch failed`);
    expect(always.requests.filter(r => r.path === path)).toHaveLength(3);
    expect(tree(folder)).toEqual(build());
  });

  it('keeps the files of the live list again when the live page is the page of this build', async () => {
    // A first publish of this build kept lazy-FFFF6666.js and named it in its list. A rerun keeps it again.
    const first = { ...build(), 'assets/lazy-FFFF6666.js': 'lazy', 'assets/kept-files.json': '["lazy-FFFF6666.js"]\n' };
    const site_ = await site(() => first), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('serves 3 content-named files under /assets/ (a rerun: the live page is the page of this build; the live list names 1); 2 are in the build with the same bytes; kept 1: lazy-FFFF6666.js; assets/kept-files.json names them');
    expect(tree(folder)).toEqual(first);
    // The first publish with this tool finds no live list; a list with another name stops the publish.
    for (const [list, status, message] of [[undefined, 0, '(a rerun: the live page is the page of this build; no live list); 2 are in the build with the same bytes; kept 0'], ['["../index.html"]', 1, 'the live list is not a list of content names'], ['{"files":[]}', 1, 'the live list is not a list of content names']] as const) {
      const served = { ...build(), ...(list === undefined ? {} : { 'assets/kept-files.json': list }) };
      const rerun = await keep(buildFolder(build()), (await site(() => served)).url);
      expect([rerun.status, rerun.stdout + rerun.stderr]).toEqual([status, expect.stringContaining(message)]);
    }
  });

  it('refuses invalid arguments, a build without assets/, a build file with no checked type and a build with a list before any request', async () => {
    const site_ = await site(live);
    for (const [args, message] of [[[], 'usage:'], [[buildFolder({ 'index.html': 'page', 'sw.js': 'worker' })], 'the build has no assets'], [[buildFolder({ ...build(), 'assets/song-ABCD1234.mp3': 'song' })], 'no checked content type for assets/song-ABCD1234.mp3'], [[buildFolder({ ...build(), 'assets/kept-files.json': '[]' })], 'the build already has assets/kept-files.json']] as const) {
      const result = await runAsync(process.execPath, [keepAssets, ...args], { env: { ...process.env, DEPLOY_LIVE_URL: site_.url } });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(message);
    }
    expect(site_.requests).toEqual([]);
  });
});

async function pluginSite(fault = '', files?: Record<string, string> | (() => Record<string, string>)) {
  const requests: { path: string; method?: string; cookie?: string; authorization?: string }[] = [];
  let url = '';
  const server = createServer((req, res) => {
    const path = req.url ?? '/';
    requests.push({ path, method: req.method, cookie: req.headers.cookie, authorization: req.headers.authorization });
    res.setHeader('set-cookie', 'visit=1; Path=/');
    const served = typeof files === 'function' ? files() : files;
    const file = served?.[path === '/' ? 'index.html' : path.slice(1)];
    if (file !== undefined) { res.setHeader('content-type', contentType(path)); res.end(file); }
    // parked: the live site without the ChatGPT plugin (tools/chatgpt-plugin.mjs) answers 404 for each plugin path.
    else if (fault === 'parked') { if (!(served && siteRoute(req, res, path, served, 'closed'))) res.writeHead(404).end(); }
    else if (path === '/.well-known/oauth-protected-resource/mcp' || path === '/.well-known/oauth-protected-resource') {
      if (fault === 'metadata-root' && path === '/.well-known/oauth-protected-resource') { res.writeHead(404).end(); return; }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ resource: `${url}/mcp`, authorization_servers: [fault === 'issuer' ? 'https://wrong.example/auth/v1' : 'https://utqzovjmclfyojedmwok.supabase.co/auth/v1'], scopes_supported: ['openid'] }));
    } else if (path === '/mcp') {
      res.writeHead(fault === 'challenge' ? 200 : 401, { 'www-authenticate': `Bearer resource_metadata="${url}/.well-known/oauth-protected-resource/mcp", scope="openid"` }).end('{}');
    } else if (path.split('?')[0] === '/authorize') {
      if (fault === 'query' && path.includes('?')) { res.writeHead(307, { location: '/authorize' }).end(); return; }
      res.setHeader('content-type', 'text/html');
      res.end('<script type="application/json" id="kingdown-consent-config">{"supabaseUrl":"https://utqzovjmclfyojedmwok.supabase.co"}</script><script type="module" src="/consent.mjs"></script>');
    } else if (path === '/plugin-art/test-art.webp') {
      const headers: Record<string, string> = { ...artHeaders };
      if (fault === 'csp') headers['Content-Security-Policy'] = "default-src 'none'";
      if (fault === 'cors') delete headers['Access-Control-Allow-Origin'];
      res.writeHead(200, headers).end(fault === 'art' ? 'stale-art' : 'art-v1');
    } else if (path === '/consent.mjs') res.end(fault === 'script' ? 'old-consent' : 'consent-v1');
    else if (!(served && siteRoute(req, res, path, served, 'closed'))) res.writeHead(404).end();
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, requests };
}

const artHeaders = { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Content-Security-Policy': "default-src 'self'" };
function pluginFolder() {
  const tree = buildFolder({}), folder = join(tree, 'functions/mcp.func');
  mkdirSync(folder, { recursive: true }); mkdirSync(join(tree, 'static/plugin-art'), { recursive: true });
  writeFileSync(join(folder, 'consent.mjs'), 'consent-v1');
  writeFileSync(join(tree, 'static/plugin-art/test-art.webp'), 'art-v1');
  writeFileSync(join(tree, 'config.json'), JSON.stringify({ version: 3, routes: [{ src: '^/plugin-art/', headers: artHeaders, continue: true }] }));
  return folder;
}

describe('deploy-plugin-live-check.mjs', () => {
  const parkedFolder = () => { const folder = join(buildFolder({}), 'functions/mcp.func'); mkdirSync(folder, { recursive: true }); return folder; };
  const parkedRequests = [...PARKED_PATHS, '/plugin-art/deploy-check-0000.webp'].flatMap(path => [`GET ${path}`, `POST ${path}`]).sort();

  it('checks that each parked plugin path answers 404 when the build has no consent script', async () => {
    const live = await pluginSite('parked');
    const result = await runAsync(process.execPath, [pluginLiveCheck, parkedFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '1500' } });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ChatGPT plugin parked');
    expect(live.requests.map(request => `${request.method} ${request.path}`).sort()).toEqual(parkedRequests);
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('rejects a parked build while the live site still serves the plugin', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, parkedFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '1500' } });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('plugin-live-check: FAIL');
    expect(live.requests.some(request => request.method === 'POST' && request.path === '/mcp')).toBe(true);
  });

  it('checks discovery, an unsigned challenge and the built consent script without account credentials', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, buildFolder({ 'consent.mjs': 'consent-v1' }), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '1500' } });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('plugin-live-check: pass');
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me', '/consent.mjs', '/mcp']);
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('checks both metadata paths, the consent query and built art policy with the migration timeout', async () => {
    const live = await pluginSite();
    const result = await runAsync(process.execPath, [pluginLiveCheck, pluginFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '900000' } });
    expect(result.status, result.stderr).toBe(0);
    expect(live.requests.map(request => request.path).sort()).toEqual(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me', '/consent.mjs', '/mcp', '/plugin-art/test-art.webp']);
    expect(live.requests.every(request => !request.cookie && !request.authorization)).toBe(true);
  });

  it('rejects missing metadata, a lost consent query, unsigned access and stale scripts or art policies', async () => {
    for (const fault of ['issuer', 'challenge', 'script', 'metadata-root', 'query', 'art', 'csp', 'cors']) {
      const live = await pluginSite(fault);
      const result = await runAsync(process.execPath, [pluginLiveCheck, pluginFolder(), live.url], { env: { ...process.env, DEPLOY_LIVE_TIMEOUT_MS: '250' } });
      expect(result.status, fault).toBe(1);
      expect(result.stderr).toContain('plugin-live-check: FAIL');
      expect(result.seconds).toBeLessThan(5);
    }
  });
});

describe('deploy.sh --target plugin --publish', () => {
  it('publishes only the tested artifact to the approved project and checks it without a player session', async () => {
    const { repo, deployAsync, calls } = setup();
    const live = await pluginSite();
    const result = await deployAsync(['--target', 'plugin', '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', STUB_PLUGIN_ORIGIN: live.url });
    expect(result.status, result.stderr).toBe(0);
    expect(calls().filter(line => line.startsWith('npx ')).map(line => line.replace(/ @ .*/, ''))).toEqual([
      'npx --yes vercel@62.2.0 link --project kingdown-plugin --scope saars-projects-2c777ec5 --yes',
      'npx --yes vercel@62.2.0 deploy --prebuilt --prod --scope saars-projects-2c777ec5 --yes',
    ]);
    expect(result.stdout).toContain('plugin-live-check: pass');
    expect(calls().some(line => line.startsWith('node tools/engines-check.mjs --production plugin-deploy/.vercel/output/functions/mcp.func/runtime/engines '))).toBe(true);
    expect(result.stdout).not.toContain('skipped the check of engines in use');
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('rejects a different linked project before the production command', () => {
    const { deploy, calls } = setup();
    const result = deploy(['--target', 'plugin', '--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', STUB_PROJECT: JSON.stringify({ projectId: 'prj_Wrong', projectName: 'kingdown-plugin', orgId: 'team_mIlANWWDRbX1NT4jgJn9jAna' }) });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at verify plugin project');
    expect(calls().some(line => line.includes(' deploy --prebuilt'))).toBe(false);
  });
});

// The publish step (secrets-and-public-gates/10): the stub npx stands in for the Vercel CLI, and a
// local site that serves the stub build stands in for the live site.
describe('deploy.sh --publish', () => {
  const words = (line: string) => line.replace(/ @ .*/, '');
  const npxCalls = (calls: string[]) => calls.filter(line => line.startsWith('npx '));

  it('after the checks, publishes the tested build with the pinned Vercel CLI and confirms the live site', async () => {
    const { repo, deployAsync, calls } = setup();
    const files = pages(), published = liveFolder(files);
    const live = await pluginSite('parked', () => tree(published));
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(files), STUB_PUBLISH_DIR: published, DEPLOY_LIVE_URL: live.url, DEPLOY_LIVE_TIMEOUT_MS: '900000' });
    expect(result.status, result.stderr).toBe(0);
    const log = calls().map(words);
    const runner = log.indexOf('node tools/check.mjs');
    const engines = log.indexOf('node tools/engines-check.mjs --production kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines');
    expect(engines).toBeGreaterThan(log.indexOf('npm run build:vercel'));
    expect(result.stdout).not.toContain('skipped the check of engines in use');
    expect(runner).toBeGreaterThan(-1);
    // One link of the kingdown project, then one deploy, both with the same pinned version: an exact
    // version, never a range or a tag such as latest.
    const npx = npxCalls(calls());
    const version = /vercel@(\d+\.\d+\.\d+) /.exec(npx[0] ?? '')?.[1];
    expect(version).toBeTruthy();
    expect(npx.map(words)).toEqual([`npx --yes vercel@${version} link --project kingdown --scope saars-projects-2c777ec5 --yes`, `npx --yes vercel@${version} deploy --prebuilt --prod --scope saars-projects-2c777ec5 --yes`]);
    expect(log.indexOf(words(npx[0]))).toBeGreaterThan(runner);
    expect(log.indexOf(words(npx[0]))).toBeGreaterThan(engines);
    // The fake CLI checks the copied static files and function before it accepts a prebuilt publish.
    expect(npx[1]).toMatch(/\/kingdown with *$/);
    expect(result.stdout).toContain('plugin-live-check: pass');
    expect(live.requests.some(request => request.path === '/mcp')).toBe(true);
    expect(result.stdout).toContain('time limit 900 s');
    expect(result.stdout).toMatch(/live-check: pass/);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
    expect(live.requests.length).toBeGreaterThan(0);
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('refuses the wrong site project before publication or an environment write', () => {
    const { deploy, calls } = setup();
    for (const change of [{ orgId: 'team_wrong' }, { projectName: 'kingdown-plugin' }, { projectId: 'invalid' }]) {
      const result = deploy(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_PROJECT: JSON.stringify({ ...siteProject, ...change }) });
      expect(result.status).not.toBe(0); expect(result.stderr).toContain('FAIL at verify site project');
      expect(calls().some(line => line.includes(' deploy ') || line.includes(' env add '))).toBe(false);
    }
  });

  it('stops on a failed plugin live check after the site check passes', async () => {
    const { repo, deployAsync } = setup();
    const files = pages(), published = liveFolder(files), live = await pluginSite('challenge', () => tree(published));
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(files), STUB_PUBLISH_DIR: published, DEPLOY_LIVE_URL: live.url });
    expect(result.status).not.toBe(0); expect(result.stdout).toContain('live-check: pass:');
    expect(result.stderr).toContain('FAIL at plugin live check');
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('a failed check stops the script before the npx call', async () => {
    const { repo, deployAsync, calls } = setup();
    for (const fail of ['tools/test-unlocked.sh', 'run']) {
      const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_FAIL: fail, STUB_DIST: buildFolder(pages()) });
      expect(result.status).not.toBe(0);
      expect(npxCalls(calls())).toEqual([]);
      expect(result.stdout).not.toContain('live-check');
      expectGone(repo, worktreeOf(result.stdout));
    }
  });

  it('a failed Vercel deploy stops the script before the live check', async () => {
    const { repo, deployAsync } = setup();
    const live = await site(() => pages());
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_FAIL: 'deploy', STUB_DIST: buildFolder(pages()), DEPLOY_LIVE_URL: live.url });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL at publish');
    expect(result.stdout).not.toContain('live-check');
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('fails when the live site does not serve the build, names the difference, and removes its worktree', async () => {
    const { repo, deployAsync } = setup();
    const live = await site(() => pages(undefined, 'Terms v2'));
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(pages()), DEPLOY_LIVE_URL: live.url });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/terms\.html: the live page differs/);
    expect(result.stderr).toContain('FAIL at live check');
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('keeps the files of the live build in the publish copy, so an old page loads its lazy chunk after the switch', async () => {
    const { repo, deployAsync } = setup();
    const files = pages(), old = oldBuild(), oldFiles = Object.keys(old).filter(name => name.includes('-Old'));
    // The live site serves the old build until the fake CLI puts the publish copy in its place.
    const published = liveFolder(old);
    const live = await pluginSite('parked', () => tree(published));
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(files), STUB_PUBLISH_DIR: published, DEPLOY_LIVE_URL: live.url });
    expect(result.status, result.stderr).toBe(0);
    const steps = [...result.stdout.matchAll(/^deploy: step (.+)$/gm)].map(match => match[1]);
    expect(steps.slice(steps.indexOf('copy artifact'))).toEqual(['copy artifact', 'link site project', 'verify site project', 'keep live assets', 'publish', 'live check', 'plugin live check']);
    const kept = ['art-OldD1234.webp', 'chunk-OldB1234.js', 'index-OldA1234.js', 'style-OldC1234.css'];
    expect(result.stdout).toContain(`kept 4: ${kept.join(', ')}; assets/kept-files.json names them`);
    // After the switch: the new build byte for byte, each old file with its own bytes, and the list.
    const after = { ...files, ...Object.fromEntries(oldFiles.map(name => [name, old[name]])), 'assets/kept-files.json': `${JSON.stringify(kept)}\n` };
    expect(tree(published)).toEqual(after);
    expect(result.stdout).toMatch(/live-check: pass: .*\(9 under \/assets\/\)/);
    const chunk = await fetch(`${live.url}/assets/chunk-OldB1234.js`);
    expect([chunk.status, await chunk.text()]).toEqual([200, old['assets/chunk-OldB1234.js']]);
    // A rerun of the same build, as after a failed live check, keeps the old files again.
    const rerun = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(files), STUB_PUBLISH_DIR: published, DEPLOY_LIVE_URL: live.url });
    expect(rerun.status, rerun.stderr).toBe(0);
    expect(rerun.stdout).toContain(`(a rerun: the live page is the page of this build; the live list names 4); 1 are in the build with the same bytes; kept 4: ${kept.join(', ')}`);
    expect(tree(published)).toEqual(after);
    expect(live.requests.filter(r => r.cookie !== undefined)).toEqual([]);
    expectGone(repo, worktreeOf(result.stdout));
  });

  it('stops before publication when a file of the live build cannot be read', async () => {
    const { repo, deployAsync, calls } = setup();
    const old = oldBuild();
    delete old['assets/chunk-OldB1234.js'];
    const live = await site(() => old);
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(pages()), DEPLOY_LIVE_URL: live.url });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('keep-assets: GET /assets/chunk-OldB1234.js: expected HTTP 200, got 404');
    expect(result.stderr).toContain('FAIL at keep live assets');
    expect(calls().some(line => line.includes(' deploy --prebuilt'))).toBe(false);
    expect(result.stdout).not.toContain('live-check');
    expectGone(repo, worktreeOf(result.stdout));
  });
});
