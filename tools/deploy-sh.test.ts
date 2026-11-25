// Deploy script test (secrets-and-public-gates/09), part 1: setup mode, settings, remotes,
// configure and the plugin gates.
// Each case runs the real tools/deploy.sh in a temporary repository (tools/lib/deploy-test-kit.ts)
// with stub npm, npx and node.
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s

import { cleanRepos, enginesDatabase, expectGone, head, pluginProject, setup, siteProject, stagingSupabase, stub, worktreeOf } from './lib/deploy-test-kit';

afterEach(cleanRepos);

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

  it('configures the combined project through private stdin and refuses one mail key alone or invalid server keys', () => {
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
    for (const data of [valid + '\nRESEND_API_KEY=re_alone', valid + '\nKINGDOWN_MAIL_FROM=King Down <hello@kingdown.dev>', valid + '\nKINGDOWN_ENGINES_DATABASE_URL=forbidden', valid + '\nPLUGIN_TEST_DATABASE_URL=forbidden', valid.replace('https://kingdown.dev', 'https://wrong.example'), valid.replace(values.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS, 'a6478e14-9e9a-43a7-a4b7-b888aed30791'), valid.replace(values.KINGDOWN_INTERNAL_SECRET, 'short'), valid.replace('kingdown_plugin_runtime.', 'postgres.'), valid.replace('?sslmode=require', ''), valid.replace(values.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS, 'invalid'), valid.replace('KINGDOWN_INTERNAL_SECRET=', 'UNEXPECTED=')]) {
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
});
