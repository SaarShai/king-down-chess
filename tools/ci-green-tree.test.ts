import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { gitTree, greenRecord, jobsMatchPlan } from './ci-green-tree.mjs';
import { localPlan, pathPlan } from './lib/ci-paths.mjs';

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

it('runs the full CI plan for a package version bump', () => {
  const old = { version: '1.0.0', scripts: { test: 'bash tools/test-lock.sh' } };
  const change = { path: 'package.json', before: JSON.stringify(old), after: JSON.stringify({ ...old, version: '1.1.0' }) };
  expect(pathPlan([change], true).mode).toBe('full');
});

it('runs the full CI plan for help CSS with a green base', () => {
  expect(pathPlan([{ path: 'src/interface/play/help/help.css' }], true)).toEqual({ mode: 'full' });
  expect(pathPlan([{ path: 'src/unknown.ts' }], true)).toEqual({ mode: 'full' });
});

it.each([
  ['help/help.css', ['src/interface/play/help/**/*.test.ts']],
  ['menus.css', ['src/interface/play/menus.test.ts', 'src/interface/play/mini-board.test.ts']],
])('runs the focus contrast test and the existing local tests for %s', (css, tests) => {
  expect(localPlan([{ path: `src/interface/play/${css}` }])).toMatchObject({
    mode: 'selected', tests: [...tests, 'tools/focus-contrast.test.ts'],
  });
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

it('requires the latest result of every planned runner before it records the tree', () => {
  const names = ['test (1)', 'browser-ui (opening)'];
  const jobs = ['reuse', 'verify', ...names.map(name => `checks / ${name}`)].map((name, id) => ({
    id, name, status: 'completed', conclusion: 'success',
  }));
  expect(jobsMatchPlan(jobs, 'full', names)).toBe(true);
  expect(jobsMatchPlan(jobs, 'selected', names)).toBe(false);
  expect(jobsMatchPlan(jobs.slice(0, 2), 'full', [])).toBe(false);
  expect(jobsMatchPlan(jobs.slice(0, -1), 'full', names)).toBe(false);
  expect(jobsMatchPlan([...jobs, { ...jobs[3], id: 8, conclusion: 'cancelled' }], 'full', names)).toBe(false);
  expect(jobsMatchPlan([jobs[0], jobs[1], { ...jobs[2], name: 'checks / ${{ matrix.name }}', conclusion: 'skipped' }], 'docs', [])).toBe(true);
});

it('records an exact-tree reuse when verify and the matrix both skip', () => {
  const jobs = ['reuse', 'verify', 'checks'].map((name, id) => ({
    id, name, status: 'completed', conclusion: name === 'reuse' ? 'success' : 'skipped',
  }));
  expect(jobsMatchPlan(jobs, 'full', [], true)).toBe(true);
  expect(jobsMatchPlan(jobs, 'full', [])).toBe(false);
});
