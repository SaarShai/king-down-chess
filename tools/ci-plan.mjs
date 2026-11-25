import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkShards, filePattern, testGlobs } from './ci-shards.mjs';
import { findGreenTree, gitTree, jobsForRun, jobsMatchPlan } from './ci-green-tree.mjs';
import { localPlan, pathPlan } from './lib/ci-paths.mjs';
import { checks } from './lib/registry.mjs';
import { selectTests, slowTests } from './lib/test-select.mjs';

const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const commit = /^[a-f0-9]{40}$/;
const repo = process.env.GITHUB_REPOSITORY || 'SaarShai/king-down-chess';

function changesFrom(base, target) {
  const paths = git(['diff', '--no-renames', '--name-only', '-z', base, ...(target ? [target] : []), '--']).split('\0');
  if (!target) paths.push(...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0'));
  return [...new Set(paths.filter(Boolean))].map(path => ({ path }));
}

function select(base, target) {
  const baseTree = gitTree(base);
  if (!baseTree) return { mode: 'full' };
  const changes = changesFrom(base, target);
  const plan = target ? pathPlan(changes, true) : localPlan(changes);
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
  const registry = checks.filter(check => !['standalone', 'release'].includes(check.ci));
  const all = checkShards({ registry }), selected = checkShards({ registry, selection });
  if (selection.mode === 'selected') console.log('This is a selection. CI runs the full plan.');
  console.log('Run type check');
  console.log('Run document lints');
  for (const browser of ['chromium', 'webkit']) {
    report(`${browser} test files`, all.filter(job => job.browser === browser).flatMap(job => job.tests),
      selected.filter(job => job.browser === browser).flatMap(job => job.tests));
    report(`${browser} checks`, all.filter(job => job.browser === browser).flatMap(job => job.checks),
      selected.filter(job => job.browser === browser).flatMap(job => job.checks));
  }
  run(['run', 'typecheck']);
  if (selection.mode !== 'full') run(['run', 'test:docs']);
  for (const browser of ['chromium', 'webkit']) {
    const jobs = selected.filter(job => job.browser === browser);
    const tests = jobs.flatMap(job => job.tests);
    const names = [...new Set(jobs.flatMap(job => job.checks))];
    const env = { PLAYABLE_BROWSER: browser, ...(browser === 'webkit' ? { PLAYABLE_CPU_CANVAS: '1' } : {}) };
    if (tests.length) run(['test'], { ...env, KINGDOWN_TEST_FILE: filePattern(tests), KINGDOWN_TEST_NO_TYPECHECK: '1' });
    if (names.length) run(['run', 'check:browser', ...names], env);
  }
} else if (process.argv[2] === 'tests') {
  // npm run test:changed: the type checks and the test files that the change can break (tools/lib/test-select.mjs).
  // KINGDOWN_TEST_BASE names another base, for a branch on a branch (default origin/main).
  const base = git(['merge-base', process.env.KINGDOWN_TEST_BASE || 'origin/main', 'HEAD']).trim();
  const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(file => file && existsSync(file));
  const read = file => { try { return readFileSync(file, 'utf8'); } catch { return undefined; } };
  const plan = selectTests(changesFrom(base).map(({ path }) => path), { files, read });
  const all = globSync(testGlobs), tests = plan.mode === 'full' ? all : plan.tests;
  const skipped = all.filter(file => !tests.includes(file));
  console.log(`Run ${tests.length} test files. Skip ${skipped.length} test files.${plan.mode === 'full' ? ` Full suite: ${plan.reason}.` : ''}`);
  const slow = skipped.filter(file => slowTests.has(file));
  if (slow.length) console.log(`Skip the slow files: ${slow.map(file => `${file} (${slowTests.get(file)} s)`).join(', ')}`);
  if (process.env.KINGDOWN_TEST_WHY === '1' && plan.why) for (const file of tests.filter(file => slowTests.has(file))) console.log(`Why: ${plan.why.get(file)}`);
  if (plan.mode !== 'full') console.log('This is a selection. CI runs the full plan.');
  // '' drops each filter that the caller's shell holds, so the run is the full suite or the full selection, with the type checks.
  if (tests.length) run(['test'], { KINGDOWN_TEST_FILE: plan.mode === 'full' ? '' : filePattern(tests), KINGDOWN_TEST_DOCS: '', KINGDOWN_TEST_SKIP: '', KINGDOWN_TEST_NAME: '', KINGDOWN_TEST_NO_TYPECHECK: '' });
  else run(['run', 'typecheck']); // only deleted test files changed
} else if (process.argv[2] === 'workflow') {
  const base = process.env.CI_BASE ?? '';
  const dispatch = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  if (dispatch && base && !commit.test(base)) throw new Error('base must be a full commit SHA');
  const tree = gitTree('HEAD');
  const reused = !dispatch && findGreenTree(tree, repo);
  const selection = reused ? { mode: 'full' } : select(base, 'HEAD');
  const { mode } = selection;
  const shards = reused ? [] : checkShards({ selection });
  const verify = shards.find(job => job.name === 'verify');
  const matrix = {
    include: shards.filter(job => job !== verify).map(job => ({
      name: job.name, browser: job.browser, part: job.part,
      browsers: job.browsers.join(' '), testPages: job.testPages,
      tests: job.tests.length ? filePattern(job.tests) : '',
      checks: job.checks.join(' '),
      python: job.name.startsWith('test (') && job.name !== 'test (app)',
    })),
  };
  console.log(reused ? 'CI reuses a green tree record.' : `CI mode: ${mode}. Shards: ${matrix.include.map(job => job.name).join(', ') || 'none'}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,
    `mode=${mode}\nreused=${reused}\nmatrix=${JSON.stringify(matrix)}\nverify_tests=${verify ? filePattern(verify.tests) : ''}\n`);
} else if (process.argv[2] === 'record') {
  const { CI_MODE: mode, CI_REUSED: reused, CI_MATRIX: matrix, GITHUB_RUN_ID: id, GITHUB_OUTPUT: output, RUNNER_TEMP: temp } = process.env;
  const names = JSON.parse(matrix).include.map(job => job.name);
  if (!jobsMatchPlan(jobsForRun(repo, id), mode, names, reused === 'true')) throw new Error('The jobs did not pass as planned');
  const tree = gitTree('HEAD');
  if (!tree) throw new Error('The checkout tree is missing');
  writeFileSync(join(temp, 'tested-tree'), `${tree}\n`);
  appendFileSync(output, `hash=${tree}\n`);
} else {
  throw new Error('usage: node tools/ci-plan.mjs changed|tests|workflow|record');
}
