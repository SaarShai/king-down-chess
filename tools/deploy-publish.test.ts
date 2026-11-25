// Deploy script test (secrets-and-public-gates/09 and 10): the --publish runs.
// Each case runs the real tools/deploy.sh in a temporary repository (tools/lib/deploy-test-kit.ts)
// with stub npm, npx and node.
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s

import { cleanRepos, enginesDatabase, expectGone, head, setup, siteProject, worktreeOf } from './lib/deploy-test-kit';
import { buildFolder, closeSites, liveFolder, oldBuild, pages, pluginSite, site, tree } from './lib/deploy-site-kit';

afterEach(cleanRepos);
afterEach(closeSites);

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

  it('with CI passed and the check:browser step in the workflow, the publish runs only the frame-time browser checks, then the engine, artifact, publish and live gates', async () => {
    const { repo, deployAsync, calls } = setup();
    repo.write('.github/workflows/plugin-checks.yml', 'jobs:\n  browser-default:\n    steps:\n      - run: npm run check:browser -- --no-gpu\n        env:\n          PLAYABLE_BROWSER: chromium\n');
    repo.git('add', '.'); repo.git('commit', '-q', '-m', 'workflow'); repo.git('push', '-q', 'origin', 'main');
    const files = pages(), published = liveFolder(files);
    const live = await pluginSite('parked', () => tree(published));
    const result = await deployAsync(['--publish'], { KINGDOWN_ENGINES_DATABASE_URL: enginesDatabase, STUB_DIST: buildFolder(files), STUB_PUBLISH_DIR: published, DEPLOY_LIVE_URL: live.url, DEPLOY_LIVE_TIMEOUT_MS: '900000', STUB_CI_PASS: '1' });
    expect(result.status, result.stderr).toBe(0);
    expect([...result.stdout.matchAll(/^deploy: step (.+)$/gm)].map(match => match[1])).toEqual(['fetch origin', 'make worktree', 'wt add', 'plugin test database',
      'frame-time browser checks', 'site artifact', 'engine archive', 'production artifact', 'engines in use', 'site HTTP check',
      'copy artifact', 'link site project', 'verify site project', 'keep live assets', 'publish', 'live check', 'plugin live check']);
    expect(calls().some(line => line.startsWith('test-lock.sh '))).toBe(false);
    expect(calls().filter(line => line.startsWith('node tools/check.mjs')).map(line => line.replace(/ @ .*/, ''))).toEqual(['node tools/check.mjs --gpu']);
    expect(calls().some(line => line.startsWith(`node tools/ci-green.mjs ${head(repo, 'HEAD')} `))).toBe(true);
    expectGone(repo, worktreeOf(result.stdout));
  });

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
