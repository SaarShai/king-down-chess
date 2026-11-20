import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { checkShards, filePattern } from './ci-shards.mjs';
import { findGreenTree, gitTree } from './ci-green-tree.mjs';
import { compareContents, pathPlan } from './lib/ci-paths.mjs';

const git = args => execFileSync('git', args, { encoding: 'utf8' });
const commit = /^[a-f0-9]{40}$/;
const repo = process.env.GITHUB_REPOSITORY || 'SaarShai/king-down-chess';

function changesFrom(base, target) {
  const paths = git(['diff', '--no-renames', '--name-only', '-z', base, ...(target ? [target] : []), '--']).split('\0');
  if (!target) paths.push(...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0'));
  return [...new Set(paths.filter(Boolean))].map(path => {
    if (!compareContents(path)) return { path };
    try {
      const before = git(['show', `${base}:${path}`]);
      const after = target ? git(['show', `${target}:${path}`]) : readFileSync(path, 'utf8');
      return { path, before, after };
    } catch { return { path }; }
  });
}

function select(base, target) {
  const baseTree = gitTree(base);
  if (!baseTree) return { mode: 'full' };
  const changes = changesFrom(base, target);
  const plan = pathPlan(changes, true);
  return plan.mode === 'full' || !findGreenTree(baseTree, repo) ? { mode: 'full' } : plan;
}

function run(args, extra = {}) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env: { ...process.env, ...extra } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function report(what, all, selected) {
  const run = [...new Set(selected)];
  const skipped = [...new Set(all)].filter(name => !run.includes(name));
  console.log(`Run ${what} (${run.length}): ${run.join(', ') || 'none'}`);
  console.log(`Skip ${what} (${skipped.length}): ${skipped.join(', ') || 'none'}`);
}

if (process.argv[2] === 'changed') {
  const base = git(['rev-parse', '--verify', 'origin/main^{commit}']).trim();
  const selection = select(base);
  const all = checkShards(), selected = checkShards({ selection });
  console.log('Run type check');
  if (selection.mode === 'docs') console.log('Run document lints');
  else console.log('Document lints run when selected by the test plan');
  for (const browser of ['chromium', 'webkit']) {
    report(`${browser} test files`, all.filter(job => job.browser === browser).flatMap(job => job.tests),
      selected.filter(job => job.browser === browser).flatMap(job => job.tests));
    report(`${browser} checks`, all.filter(job => job.browser === browser).flatMap(job => job.checks),
      selected.filter(job => job.browser === browser).flatMap(job => job.checks));
  }
  run(['run', 'typecheck']);
  if (selection.mode === 'docs') run(['run', 'test:docs']);
  for (const browser of ['chromium', 'webkit']) {
    const jobs = selected.filter(job => job.browser === browser);
    const tests = jobs.flatMap(job => job.tests);
    const names = [...new Set(jobs.flatMap(job => job.checks))];
    const env = { PLAYABLE_BROWSER: browser, ...(browser === 'webkit' ? { PLAYABLE_CPU_CANVAS: '1' } : {}) };
    if (tests.length) run(['test'], { ...env, KINGDOWN_TEST_FILE: filePattern(tests), KINGDOWN_TEST_NO_TYPECHECK: '1' });
    if (names.length) run(['run', 'check:browser', ...names], env);
  }
} else if (process.argv[2] === 'workflow') {
  const base = process.env.CI_BASE ?? '';
  const dispatch = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  if (dispatch && base && !commit.test(base)) throw new Error('base must be a full commit SHA');
  const tree = gitTree('HEAD');
  const selection = !dispatch && findGreenTree(tree, repo) ? { mode: 'reuse' } : select(base, 'HEAD');
  const matrix = {
    include: checkShards({ selection }).map(job => ({
      name: job.name, browser: job.browser, part: job.part,
      tests: job.tests.length ? filePattern(job.tests) : '',
      checks: job.checks.join(' '),
      python: job.name.startsWith('test (') && job.name !== 'test (app)',
    })),
  };
  console.log(`CI mode: ${selection.mode}. Shards: ${matrix.include.map(job => job.name).join(', ') || 'none'}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,
    `mode=${selection.mode}\nmatrix=${JSON.stringify(matrix)}\n`);
} else {
  throw new Error('usage: node tools/ci-plan.mjs changed|workflow');
}
