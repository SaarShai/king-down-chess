import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { checks } from './lib/registry.mjs';
import { tempRepo } from './lib/temp-repo.mjs';

vi.setConfig({ testTimeout: 60_000 });
const repos: ReturnType<typeof tempRepo>[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

// The real runner and registry use small stand-ins for the build, preview and browser scripts.
function run(names: string[], failBuild = false) {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const events = join(repo.root, 'events.jsonl');
  repo.write('package.json', JSON.stringify({ type: 'module', scripts: { build: 'node build.mjs' } }));
  repo.write('build.mjs', `import { appendFileSync } from 'node:fs'; appendFileSync(process.env.RUNNER_EVENTS, '"build"\\n'); process.exit(${failBuild ? 1 : 0});`);
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
  for (const file of ['check.mjs', 'lib/checks.mjs', 'lib/first-fault.mjs', 'lib/lock.mjs', 'lib/registry.mjs', 'lib/tree-status.mjs']) {
    mkdirSync(join(repo.dir, 'tools', file, '..'), { recursive: true });
    cpSync(new URL(file, import.meta.url), join(repo.dir, 'tools', file));
  }
  for (const script of new Set(checks.map(c => c.script))) repo.write(script, `
    import { appendFileSync } from 'node:fs';
    appendFileSync(process.env.RUNNER_EVENTS, JSON.stringify({ script: process.argv[1], url: process.env.PLAYABLE_URL }) + '\\n');
  `);
  const result = spawnSync(process.execPath, ['tools/check.mjs', ...names], {
    cwd: repo.dir, env: { ...repo.env, TMPDIR: repo.root, RUNNER_EVENTS: events, PLAYABLE_URL: undefined },
    encoding: 'utf8', timeout: 30_000,
  });
  const calls = existsSync(events) ? readFileSync(events, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [];
  return { result, calls };
}

describe('browser check site build', () => {
  it('skips the site build and preview for plugin-only checks', () => {
    const { result, calls } = run(['plugin-ui', 'plugin-ui-http', 'plugin-oauth']);
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls).toHaveLength(3);
    expect(calls.every(call => typeof call === 'object' && !('url' in call))).toBe(true);
    expect(result.stdout).not.toContain('serving the build');
  });

  it.each([{ names: ['web-online'] }, { names: ['plugin-ui', 'web-online'] }, { names: [] }])('builds and serves the site for $names', ({ names }) => {
    const { result, calls } = run(names);
    expect(result.status, result.stderr + result.stdout).toBe(0);
    expect(calls.slice(0, 2)).toEqual(['build', 'preview']);
    expect(calls.at(-1)).toBe('close');
    expect(calls.slice(2, -1).every(call => call.url === 'http://127.0.0.1:1234/')).toBe(true);
    expect(calls.length).toBe((names.length || checks.filter(c => !c.byName).length) + 3);
  });

  it('stops before preview and checks when the site build fails', () => {
    const { result, calls } = run(['web-online'], true);
    expect(result.status).toBe(1);
    expect(calls).toEqual(['build']);
    expect(result.stdout).toContain('FAIL build');
  });
});
