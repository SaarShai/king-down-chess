import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { CHECK_SITE_ENV } from './lib/checks.mjs';
import { checks } from './lib/registry.mjs';
import { tempRepo } from './lib/temp-repo.mjs';

vi.setConfig({ testTimeout: 60_000 });
const repos: ReturnType<typeof tempRepo>[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

// The real runner and registry use stand-ins for the build, preview, browser scripts, locks and tree snapshots.
function run(names: string[], failBuild = false, shell: Record<string, string> = {}) {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const events = join(repo.root, 'events.jsonl');
  repo.write('package.json', JSON.stringify({ type: 'module', scripts: { build: 'node build.mjs' } }));
  repo.write('build.mjs', `import { appendFileSync, writeFileSync } from 'node:fs'; appendFileSync(process.env.RUNNER_EVENTS, '"build"\\n');
    writeFileSync(process.env.RUNNER_EVENTS + '.build', JSON.stringify(Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('VITE_'))))); process.exit(${failBuild ? 1 : 0});`);
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
  for (const file of ['check.mjs', 'lib/checks.mjs', 'lib/first-fault.mjs', 'lib/registry.mjs', 'lib/temp-repo.mjs']) {
    mkdirSync(join(repo.dir, 'tools', file, '..'), { recursive: true });
    cpSync(new URL(file, import.meta.url), join(repo.dir, 'tools', file));
  }
  // The default case takes 8.8 s on the M1 with real Git calls. Lock and snapshot tests cover those modules.
  repo.write('tools/lib/lock.mjs', `
    export const SLOTS = 3;
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
  `);
  const result = spawnSync(process.execPath, ['tools/check.mjs', ...names], {
    cwd: repo.dir, env: { ...repo.env, TMPDIR: repo.root, RUNNER_EVENTS: events, PLAYABLE_URL: undefined, VITE_KINGDOWN_STAGE: undefined, ...shell },
    encoding: 'utf8', timeout: 30_000,
  });
  const calls = existsSync(events) ? readFileSync(events, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [];
  const build = existsSync(events + '.build') ? JSON.parse(readFileSync(events + '.build', 'utf8')) : null;
  return { result, calls, build };
}

describe('browser check site build', () => {
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
