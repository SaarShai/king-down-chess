import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { gitTree, greenRecord } from './ci-green-tree.mjs';
import { pathPlan } from './lib/ci-paths.mjs';

const repository = 'owner/game';
const workflow = { id: 18, path: '.github/workflows/plugin-checks.yml' };
const tree = 'a'.repeat(40), baseTree = 'b'.repeat(40);
const good = {
  id: 47, workflow_id: 18, path: workflow.path, status: 'completed', conclusion: 'success',
  event: 'pull_request', repository: { full_name: repository }, head_repository: { full_name: repository },
};
const record = { name: `tested-tree-${tree}`, expired: false, workflow_run: { id: 47 } };

it('uses the recorded PR merge tree, independent of its head SHA', () => {
  expect(greenRecord(tree, record, good, repository, workflow)).toBe(true);
});

it.each([
  ['failed', { conclusion: 'failure' }],
  ['cancelled', { conclusion: 'cancelled' }],
  ['in progress', { status: 'in_progress' }],
  ['fork', { head_repository: { full_name: 'fork/game' } }],
  ['different repository', { repository: { full_name: 'other/game' } }],
  ['different workflow', { workflow_id: 19 }],
  ['no run', null],
  ['different run', { id: 48 }],
])('refuses a record with a %s run', (_name, run) => {
  expect(greenRecord(tree, record, run && { ...good, ...run }, repository, workflow)).toBe(false);
});

it('refuses a green PR that tested the head on a different base', () => {
  expect(greenRecord(baseTree, record, good, repository, workflow)).toBe(false);
});

it('runs the full suite for a doc push whose base run was cancelled', () => {
  const baseGreen = greenRecord(baseTree, { ...record, name: `tested-tree-${baseTree}` },
    { ...good, conclusion: 'cancelled' }, repository, workflow);
  expect(pathPlan([{ path: 'docs/lessons/agents-and-tools.md' }], baseGreen).mode).toBe('full');
  expect(pathPlan([{ path: 'docs/lessons/agents-and-tools.md' }], true).mode).toBe('docs');
});

it('runs all jobs when the change includes a document that a test reads', () => {
  expect(pathPlan([{ path: 'docs/MATRIX.md' }, { path: 'TASKS.md' }], true).mode).toBe('full');
});

it('checks only docs and types for a verified base and a package version bump', () => {
  const old = { version: '1.0.0', scripts: { test: 'bash tools/test-lock.sh' } };
  const change = { path: 'package.json', before: JSON.stringify(old), after: JSON.stringify({ ...old, version: '1.1.0' }) };
  expect(pathPlan([change], true).mode).toBe('docs');
  expect(pathPlan([{ ...change, after: JSON.stringify({ version: '1.1.0', scripts: {} }) }], true).mode).toBe('full');
});

it('a screen change selects related checks and an unknown path selects all', () => {
  const screen = pathPlan([{ path: 'src/interface/play/help/help.css' }], true);
  expect(screen).toMatchObject({ mode: 'selected', tests: ['src/interface/play/help/**/*.test.ts'] });
  expect(screen.checks).toContain('read-piece');
  expect(pathPlan([{ path: 'src/unknown.ts' }], true)).toEqual({ mode: 'full' });
  expect(pathPlan([{ path: 'src/interface/play/help/help.css' }], false)).toEqual({ mode: 'full' });
});

it('preserves legacy push reuse when GitHub returns more than a megabyte of history', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kingdown-tree-'));
  try {
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    const push = { ...good, event: 'push', head_sha: head };
    const stdio = join(dir, 'gh');
    writeFileSync(stdio, `#!/usr/bin/env node
const endpoint = process.argv[3];
if (endpoint.includes('/jobs?')) console.log(JSON.stringify({jobs: [{name:'verify'}, {name:'browser-default'}]}));
else if (endpoint.includes('/runs?')) console.log(JSON.stringify({padding: 'x'.repeat(1300000), workflow_runs: [${JSON.stringify(push)}]}));
else if (endpoint.includes('/artifacts?')) console.log(JSON.stringify({artifacts: []}));
else console.log(${JSON.stringify(JSON.stringify(workflow))});
`, { mode: 0o755 });
    const command = `import { findGreenTree } from './tools/ci-green-tree.mjs';
      console.log(findGreenTree(${JSON.stringify(gitTree('HEAD'))}, ${JSON.stringify(repository)}));`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', command], {
      encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    });
    expect(result.stdout).toBe('true\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
