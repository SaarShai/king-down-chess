import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';
import { tempRepo } from '../lib/temp-repo.mjs';
import pr405 from './pr-405-ci.fixture.json';

const head = 'a'.repeat(40);
const stages = ['ci', 'staging', 'staging-checks', 'merge', 'main-ci', 'engines', 'publish', 'live-check', 'log'];
const evidence = process.env.KINGDOWN_RELEASE_EVIDENCE || tmpdir();
mkdirSync(evidence, { recursive: true });
const folder = mkdtempSync(join(evidence, 'kingdown-release-test-'));
afterAll(() => rmSync(folder, { recursive: true, force: true }));
const run = (command: string, args: string[], settings: NodeJS.ProcessEnv = {}) => {
  return spawnSync(command, args, {
    encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, KINGDOWN_RELEASE_WORKTREE: join(folder, 'build worktree'), KINGDOWN_RELEASE_EVIDENCE: folder, KINGDOWN_RELEASE_LOG: join(folder, 'release.md'), ...settings },
  });
};

function release(args: string[] = [], fail?: string, note = 'dry-run fixture', settings: NodeJS.ProcessEnv = {}) {
  const result = run('bash', ['tools/release/release.sh', '--dry-run', ...args, '1499', head, note], { KINGDOWN_RELEASE_FAIL_STAGE: fail, ...settings });
  const progress = result.stdout.match(/^release: progress (.+)$/m)?.[1];
  return {
    code: result.status,
    output: result.stdout + result.stderr,
    started: [...result.stdout.matchAll(/^release: (\S+) start$/gm)].map(match => match[1]),
    done: progress && readFileSync(progress + '.done', 'utf8').trim(),
  };
}

function pendingRelease(pr: string, script: string, settings: NodeJS.ProcessEnv = {}) {
  const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force "$2" "$1" >/dev/null
dry=no
: > "$progress"
exec 3>&1
pending_job() {
  /bin/bash -c '
    evidence=$1 lock=$2
    on_term() { sleep .1; [ ! -d "$lock" ] || touch "$evidence/stopped"; exit 143; }
    trap on_term TERM
    touch "$1/pending"
    sleep 2
    touch "$1/finished"
  ' fixture "$run" "$lock" >&3
}
await_pending() {
  for ((i = 0; i < 200; i++)); do
    [ ! -f "$run/pending" ] || return 0
    sleep .02
  done
  return 81
}
${script}
`, 'tools/release/release.sh', head, pr], settings);
  const evidence = join(folder, `release-dry-${pr}-${head}`);
  return {
    code: result.status,
    output: result.stdout + result.stderr,
    started: [...readFileSync(join(evidence, 'progress.log'), 'utf8').matchAll(/^release: (\S+) start$/gm)].map(match => match[1]),
    finished: existsSync(join(evidence, 'finished')),
    stoppedWithLock: existsSync(join(evidence, 'stopped')),
    unlocked: !existsSync(join(folder, 'release-dry-active')),
  };
}

it('plans the browser checks in the worktrees at the PR head and merge commit', () => {
  const worktree = join(folder, 'build worktree');
  const plans = [release(), release(['--tweak'])];
  for (const [index, plan] of plans.entries()) {
    const checks = plan.output.split('\n').filter(line => line.includes('PLAYABLE_URL=') && line.includes('check:browser'));
    expect(checks).toHaveLength(index === 0 ? 2 : 1);
    for (const line of checks) expect(line.replaceAll('\\', '')).toContain(worktree);
    expect(checks.at(-1)).toContain('release-site');
    const commits = plan.output.split('\n').filter(line => line.includes('git rev-parse --verify HEAD'));
    expect(commits.map(line => line.replaceAll('\\', '').match(/\(expect (.+)\)$/)?.[1])).toEqual(
      index === 0 ? [head, '<merge-commit>'] : ['<merge-commit>'],
    );
    expect(plan.output).toContain('npm ls --depth=0');
  }
  expect(plans[0].output).toContain('release-site release-history');
  // staging-checks also runs the unsigned plugin and Muse probe on the staging build; a tweak skips staging.
  const probes = plans[0].output.split('\n').filter(line => line.includes('deploy-plugin-live-check.mjs'));
  expect(probes).toHaveLength(1);
  expect(probes[0].replaceAll('\\', '')).toContain(`${join(worktree, 'kingdown-deploy/.vercel/output/functions/mcp.func')} https://kingdown-staging.vercel.app`);
  expect(plans[1].output).not.toContain('deploy-plugin-live-check.mjs');
});

it('plans the frame-time checks during PR CI in the live worktree at the PR head', () => {
  for (const args of [[], ['--tweak']]) {
    const plan = release(args);
    const ci = plan.output.split('release: ci start\n')[1]?.split('release: ci pass\n')[0] ?? '';
    expect(plan.code, plan.output).toBe(0);
    expect(ci).toContain('in parallel');
    expect(ci).toContain('ci-wait.sh');
    expect(ci).toContain('node tools/check.mjs --gpu');
    expect(ci.replaceAll('\\', '')).toContain(`cwd=${join(folder, 'build worktree')} git checkout --detach ${head}`);
    expect(ci).toContain('frame-checks.pass');
    expect(ci).toMatch(/release: time frame-checks \d+s/);
  }
});

it('stops before merge when the frame-time checks fail', () => {
  for (const args of [[], ['--tweak']]) {
    const stopped = release(args, 'frame-checks');
    expect(stopped.started).toEqual(['ci']);
    expect([stopped.code, stopped.done]).toEqual([1, '1']);
    expect(stopped.output).toContain('release: ci failed');
  }
});

it.each([
  ['a frame-time failure', '', 83, '1513'],
  ['Ctrl-C', 'INT', 130, '1514'],
  ['SIGTERM', 'TERM', 143, '1515'],
])('stops staging and its child before a later stage starts after %s', (_fault, signal, code, pr) => {
  const stopped = pendingRelease(pr, `
overlap_staging=yes
gh() { echo "$head"; }
bash() { [ "$1" = "$tools/release/ci-wait.sh" ]; }
staging_deploy() { pending_job; }
checks() { return 0; }
node() { return 0; }
frame_checks() {
  await_pending || return
  if [ -n "$SIGNAL" ]; then kill -s "$SIGNAL" "$$"; fi
  return 83
}
run_logged_stage ci
join_staging
say 'merge start'
`, { SIGNAL: signal });
  expect(stopped.code, stopped.output).toBe(code);
  expect(stopped.finished, stopped.output).toBe(false);
  expect(stopped.stoppedWithLock).toBe(true);
  expect(stopped.unlocked).toBe(true);
  expect(stopped.started).toEqual(['ci', 'staging']);
});

it('starts staging before the frame-time checks finish when the worktrees differ', () => {
  const full = release([], undefined, undefined, { KINGDOWN_RELEASE_WORKTREE: '' });
  expect(full.code, full.output).toBe(0);
  expect(full.output.indexOf('release: staging start')).toBeLessThan(full.output.indexOf('release: ci pass'));
  expect(full.output.indexOf('release: merge start')).toBeGreaterThan(full.output.indexOf('release: staging-checks pass'));
});

it('stops before merge when the parallel staging checks fail', () => {
  const failed = release([], 'staging-checks', undefined, { KINGDOWN_RELEASE_WORKTREE: '' });
  expect(failed.code, failed.output).toBe(1);
  expect(failed.output).toContain('release: staging-checks failed');
  expect(failed.started).not.toContain('merge');
});

it('runs staging after CI when the stages share a worktree', () => {
  const shared = release();
  expect(shared.code, shared.output).toBe(0);
  expect(shared.output.indexOf('release: staging start')).toBeGreaterThan(shared.output.indexOf('release: ci pass'));
});

it('starts the engine check during main CI and waits for both before publish', () => {
  const plan = release(['--from', 'main-ci', '--force']);
  expect(plan.code, plan.output).toBe(0);
  expect(plan.output.indexOf('release: engines start')).toBeLessThan(plan.output.indexOf('release: main-ci pass'));
  expect(plan.output.indexOf('release: publish start')).toBeGreaterThan(plan.output.indexOf('release: engines pass'));
});

it('does not publish if the engine check fails during main CI', () => {
  const failed = release(['--from', 'main-ci', '--force'], 'engines');
  expect(failed.code, failed.output).toBe(1);
  expect(failed.output).toContain('release: engines failed');
  expect(failed.started).not.toContain('publish');
});

it.each([
  ['engines', '1516'],
  ['main-ci', '1517'],
])('stops the pending check when %s fails', (failed, pr) => {
  const stopped = pendingRelease(pr, `
gh() { echo "$head"; }
outward() {
  [ "$2" = "$tools/release/ci-wait.sh" ] || return 80
  if [ "$FAILED" = main-ci ]; then await_pending && return 82; else pending_job; fi
}
live_step() {
  if [ "$FAILED" = engines ]; then await_pending && return 82; else pending_job; fi
}
run_logged_stage main-ci
join_engines
say 'publish start'
`, { FAILED: failed });
  expect(stopped.finished, stopped.output).toBe(false);
  expect(stopped.code, stopped.output).toBe(82);
  expect(stopped.output).toContain(`release: ${failed} failed (82)`);
  expect(stopped.stoppedWithLock).toBe(true);
  expect(stopped.unlocked).toBe(true);
  expect(stopped.started).toEqual(['main-ci', 'engines']);
});

it('uses the exact merge commit for the engine check while main CI is still pending', () => {
  const merged = 'e'.repeat(40);
  const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force 1512 "$1" >/dev/null
dry=no
stage=main-ci
live_step() { [ "$1 $2" = "engines $MERGED" ] && [ ! -f "$run/main-commit" ] && touch "$run/engines-started"; }
outward() {
  [ "$2" = "$tools/release/ci-wait.sh" ] && [ "$3" = "$MERGED" ] && [ "$5" = '--retry-failed' ] || return 80
  for ((i = 0; i < 100; i++)); do
    [ ! -f "$run/engines-started" ] || return 0
    sleep .02
  done
  return 81
}
gh() { echo "$MERGED"; }
run_stage main-ci
join_engines
cat "$run/main-commit"
`, 'tools/release/release.sh', head], { MERGED: merged });
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain(merged);
});

it.each([
  ['pass', '1505'],
  ['frame-time fails', '1506'],
  ['PR CI fails', '1507'],
  ['fork', '1508'],
  ['reuse', '1509'],
  ['overlap', '1510'],
  ['overlap CI fails', '1511'],
])('records the PR tree only when both CI jobs pass (%s)', (outcome, number) => {
  const repo = tempRepo({ hooks: false });
  try {
    repo.write('.gitignore', 'node_modules/\n');
    repo.git('add', '.');
    repo.git('commit', '-qm', 'base');
    const base = repo.git('rev-parse', 'HEAD').stdout.trim();
    repo.write('catalog.txt', `PR change ${number}\n`);
    repo.git('add', '.');
    repo.git('commit', '-qm', 'PR');
    const commit = repo.git('rev-parse', 'HEAD').stdout.trim();
    const tree = repo.git('rev-parse', 'HEAD^{tree}').stdout.trim();
    repo.git('push', '-q', 'origin', `HEAD:refs/pull/${number}/head`);
    repo.git('checkout', '-q', '--detach', base);
    const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force "$2" "$1" >/dev/null
dry=no
stage=ci
mkdir -p "$run/live"
printf 'old pass\n' > "$frame_record"
if [ "$OUTCOME" = reuse ]; then
  prior="$base/release-1505-${'b'.repeat(40)}/live"
  mkdir -p "$prior"
  printf 'pass %s 2026-11-23T10:00:00Z king-effects painted-game\n' "$TREE" > "$prior/frame-checks.pass"
fi
if [[ "$OUTCOME" == overlap* ]]; then overlap_staging=yes; fi
gh() { printf '%s\n' "$PR_JSON" | jq -r "\${!#}"; }
bash() {
  [[ "$1" == */ci-wait.sh && "$2" == "$head" && "$4" == --pr-head ]] || return 80
  touch "$run/ci-started"
  [ "$OUTCOME" != reuse ] || return 0
  for ((i = 0; i < 100; i++)); do
    if [ -f "$run/gpu-started" ]; then
      [[ "$OUTCOME" != *'CI fails' ]] || return 1
      touch "$run/pr-green"
      return
    fi
    sleep .02
  done
  return 81
}
npm() { [ "$1" = ci ] && mkdir -p node_modules; }
staging_deploy() { [ -f "$run/pr-green" ] && [ -f "$run/gpu-started" ] && touch "$run/staging-ran"; }
checks() { [ -f "$run/staging-ran" ] && touch "$run/staging-checked"; }
node() {
  [[ "$1" != */deploy-plugin-live-check.mjs ]] || return 0
  [ "$OUTCOME" != reuse ] && [ "$*" = 'tools/check.mjs --gpu' ] && [ -d node_modules ] &&
    [ "$(git rev-parse HEAD)" = "$head" ] && [ "$KINGDOWN_SOLO_LAUNCH" = 1 ] || return 82
  for ((i = 0; i < 100; i++)); do
    if [ -f "$run/ci-started" ]; then
      touch "$run/gpu-started"
      [ "$OUTCOME" != "frame-time fails" ] || return 83
      if [ "$OUTCOME" = overlap ]; then
        for ((i = 0; i < 100; i++)); do
          [ ! -f "$run/staging-checked" ] || break
          sleep .02
        done
        [ -f "$run/staging-checked" ] || return 85
      fi
      printf 'ok   king-effects     1.0 s\nok   painted-game     1.0 s\n'
      return
    fi
    sleep .02
  done
  return 84
}
run_stage ci
if [ "$OUTCOME" = overlap ]; then join_staging; fi
cat "$frame_record"
`, 'tools/release/release.sh', commit, number], {
      KINGDOWN_RELEASE_WORKTREE: repo.dir,
      OUTCOME: outcome,
      TREE: tree,
      PR_JSON: JSON.stringify({ state: 'OPEN', baseRefName: 'main', headRefOid: commit, isCrossRepository: outcome === 'fork' }),
    });
    const output = result.stdout + result.stderr;
    const evidence = join(folder, `release-dry-${number}-${commit}`);
    const passed = ['pass', 'reuse', 'overlap'].includes(outcome);
    expect(result.status, output).toBe(passed ? 0 : outcome === 'frame-time fails' ? 83 : 1);
    expect(existsSync(join(evidence, 'gpu-started'))).toBe(!['fork', 'reuse'].includes(outcome));
    expect(existsSync(join(evidence, 'staging-checked'))).toBe(outcome === 'overlap');
    if (passed) {
      expect(output).toMatch(new RegExp(`^pass ${tree} \\d{4}-\\d{2}-\\d{2}T[0-9:]+Z king-effects painted-game$`, 'm'));
    } else {
      expect(existsSync(join(evidence, 'live/frame-checks.pass'))).toBe(false);
    }
    rmSync(evidence, { recursive: true, force: true });
  } finally {
    repo.cleanup();
  }
});

it('plans both preview site checks from the build worktree', () => {
  const result = run('python3', ['tools/release/staging.py', '--preview', '--dry-run', head]);
  const checks = result.stdout.split('\n').filter(line => line.includes('check:browser release-site'));
  expect(checks).toHaveLength(2);
  for (const line of checks) expect(line).toContain(join(folder, 'build worktree'));
});

it('refuses a stale check worktree and uses its own packages at the expected commit', () => {
  const repo = tempRepo({ hooks: false });
  try {
    const shared = join(folder, 'shared packages');
    mkdirSync(shared);
    writeFileSync(join(shared, 'sentinel'), 'shared');
    repo.write('.gitignore', 'node_modules\n');
    repo.write('catalog.txt', 'text from the expected commit');
    repo.git('add', '.');
    repo.git('commit', '-qm', 'catalog');
    const commit = repo.git('rev-parse', 'HEAD').stdout.trim();
    symlinkSync(shared, join(repo.dir, 'node_modules'), 'dir');
    const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force 1504 "$1" >/dev/null
dry=no
npm() {
  printf '%s at %s\\n' "$*" "$PWD"
  case "$1" in
    ls) [ -d node_modules ] ;;
    ci) mkdir node_modules ;;
    run) [ "$PLAYABLE_URL" = "http://127.0.0.1" ] && [ -d node_modules ] && cat catalog.txt ;;
  esac
}
if checks "$2" "$1" http://127.0.0.1 release-site; then exit 3; fi
printf 'local edit\n' >> "$2/catalog.txt"
if checks "$2" "$3" http://127.0.0.1 release-site; then exit 4; fi
git -C "$2" restore catalog.txt
checks "$2" "$3" http://127.0.0.1 release-site
`, 'tools/release/release.sh', head, repo.dir, commit]);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stderr).toContain(`is at ${commit}. Set the worktree to ${head}`);
    expect(result.stderr).toContain('worktree has changes');
    expect(result.stdout.match(/^ci at .+$/gm)).toEqual([`ci at ${repo.dir}`]);
    expect(result.stdout).toContain(`run check:browser release-site at ${repo.dir}`);
    expect(result.stdout).toContain('text from the expected commit');
    expect(readFileSync(join(shared, 'sentinel'), 'utf8')).toBe('shared');
  } finally {
    repo.cleanup();
  }
});

it('lists every release stage, stops on failure, then starts at the requested stage', () => {
  const first = release();
  expect(first.started, first.output).toEqual(stages);
  expect([first.code, first.done]).toEqual([0, '0']);

  const stopped = release([], 'staging-checks');
  expect(stopped.started).toEqual(stages.slice(0, 3));
  expect(stopped.output).toContain('release: staging-checks failed');
  expect([stopped.code, stopped.done]).toEqual([1, '1']);

  const resumed = release(['--from', 'staging-checks']);
  expect(resumed.started).toEqual(stages.slice(2));
  expect(resumed.output).toContain('release: ci skipped\nrelease: staging skipped\n');
  expect([resumed.code, resumed.done]).toEqual([0, '0']);
  expect(release(['--from', 'merge']).started).toEqual(stages.slice(3));
  expect(release(['--tweak']).started).toEqual(stages.filter(stage => !stage.startsWith('staging')));
});

function replayPr405(runs = pr405.runs) {
  const bin = mkdtempSync(join(folder, 'pr-ci-bin-'));
  writeFileSync(join(bin, 'gh'), `#!/bin/sh
case "$*" in
  *"/check-runs?per_page=100") printf '%s\\n' '${JSON.stringify(pr405.pages)}' ;;
  *"/status") printf '%s\\n' '${JSON.stringify(pr405.status)}' ;;
  *"/actions/workflows/"*) printf '%s\\n' '${JSON.stringify(runs)}' ;;
  *) exit 2 ;;
esac
`, { mode: 0o755 });
  return (mode: string[] = []) => run('bash', ['tools/release/ci-wait.sh', pr405.status.sha, '0', ...mode],
    { PATH: bin + ':' + process.env.PATH });
}

it('passes a green pull-request run for release CI and requires an exact run for main CI', () => {
  const wait = replayPr405();
  const production = wait();
  expect(production.status, production.stdout + production.stderr).toBe(1);

  const plan = release();
  const plannedWait = plan.output.split('\n').find(line => line.includes(`ci-wait.sh ${head}`));
  expect(plannedWait).toBeDefined();
  const pullRequest = wait(plannedWait?.endsWith(' --pr-head') ? ['--pr-head'] : []);
  expect(pullRequest.status, pullRequest.stdout + pullRequest.stderr).toBe(0);
  expect(plan.output).toMatch(new RegExp(`ci-pr-green\\.mjs'? ${head}`));
  expect(plan.output).toContain('--retry-failed');
});

it('refuses a green pull-request run from a fork', () => {
  const [workflowRun] = pr405.runs.workflow_runs;
  const wait = replayPr405({ workflow_runs: [{ ...workflowRun, head_repository: { full_name: 'fork/king-down-chess' } }] });
  const fork = wait(['--pr-head']);
  expect(fork.status, fork.stdout + fork.stderr).toBe(1);
});

it('checks for a reconcile note before any CI wait when main has moved', () => {
  const plan = release([], undefined, '  ').output;
  const comparison = `compare/main...${head}`;
  const preflight = plan.indexOf(comparison);
  expect(preflight, plan).toBeGreaterThan(-1);
  expect(preflight).toBeLessThan(plan.indexOf('release: ci start'));
  expect(plan.lastIndexOf(comparison)).toBeGreaterThan(plan.indexOf('release: merge start'));
  expect(release().output).not.toContain(comparison);
  expect(release(['--from', 'main-ci', '--force'], undefined, '').output).not.toContain(comparison);

  const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force 1502 "$1" >/dev/null
gh() { jq "$4" <<< "$COMPARE"; }
outward() { "$@"; }
require_reconciled_base
`, 'tools/release/release.sh', head], {
    COMPARE: JSON.stringify({ base_commit: { sha: 'b'.repeat(40) }, merge_base_commit: { sha: 'c'.repeat(40) } }),
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('give a reconcile note');
});

it('requires a reconcile note for a different reviewed head and passes that head to merge', () => {
  const reviewed = 'd'.repeat(40);
  const refused = release(['--reviewed', reviewed], undefined, ' ');
  expect(refused.code, refused.output).toBe(1);
  expect(refused.started).toEqual([]);
  expect(refused.output).toContain('reviewed head differs. Give a reconcile note');
  const reconciled = release(['--reviewed', reviewed], undefined, 'Repair reviewed.');
  expect(reconciled.code, reconciled.output).toBe(0);
  expect(reconciled.output).toContain(`merge.sh 1499 ${head} ${reviewed} `);
  expect(release(['--reviewed', 'short']).code).toBe(2);
});

it('requires a pass for each earlier stage unless --force is set', () => {
  expect(release([], 'staging').code).toBe(1);

  const blocked = release(['--from', 'merge']);
  expect([blocked.code, blocked.done]).toEqual([1, '1']);
  expect(blocked.started).toEqual([]);
  expect(blocked.output).toContain('staging has no pass');

  const forced = release(['--from', 'merge', '--force']);
  expect([forced.code, forced.done]).toEqual([0, '0']);
  expect(forced.started).toEqual(stages.slice(3));
  expect(forced.output).toContain('release: ci skipped\nrelease: staging skipped\nrelease: staging-checks skipped\n');
  expect(release(['--from', 'merge']).code).toBe(1);
  expect(release(['--from', 'merge', '--tweak']).code).toBe(0);
});

it('plans one release-log entry for a failed stage', () => {
  const stopped = release([], 'ci');
  const entries = stopped.output.split('\n').filter(line => line.includes('| PR #1499 |'));
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatch(new RegExp(`^- \\d{4}-\\d{2}-\\d{2}T[0-9:]+Z \\| PR #1499 \\| commit ${head} \\| ci failed \\(1\\)$`));
});

it('records bypassed stages as skipped after a forced restart with earlier passes', () => {
  expect(release().code).toBe(0);
  const forced = release(['--from', 'merge', '--force']);
  expect(forced.code, forced.output).toBe(0);
  expect(forced.output).toContain('| staging skipped |');
  expect(forced.output).toContain('| CI skipped |');
  expect(forced.output).toContain('| staging alias skipped | staging site skipped | staging history skipped |');
  const tweak = release(['--tweak']);
  expect(tweak.output).toContain('| staging alias skipped |');
});

it('writes and clears the lock PID and reports whether its owner is running', () => {
  const lock = join(folder, 'release-dry-active');
  const pid = join(lock, 'pid');
  const owner = run('bash', ['-c', 'source "$0" --dry-run --from log --force 1503 "$1" >/dev/null; cat "$lock/pid"; echo "$$"',
    'tools/release/release.sh', head]);
  const [recorded, shell] = owner.stdout.trim().split('\n');
  expect(recorded, owner.stdout + owner.stderr).toMatch(/^\d+$/);
  expect(recorded).toBe(shell);
  expect(existsSync(lock)).toBe(false);

  mkdirSync(lock);
  try {
    for (const [pidValue, state] of [[process.pid, 'is running'], [99_999_999, 'is not running']] as const) {
      writeFileSync(pid, String(pidValue) + '\n');
      const blocked = release();
      expect(blocked.code, blocked.output).toBe(2);
      expect(blocked.output).toContain(`PID ${pidValue} ${state}`);
    }
  } finally {
    rmSync(lock, { recursive: true });
  }
});

it('records the deploy receipt and fails publish when its commit differs', () => {
  const merged = 'b'.repeat(40);
  const published = 'c'.repeat(40);
  const result = run('bash', ['-c', `
source "$0" --dry-run --from log --force 1501 "$1" >/dev/null
printf '%s\\n' "$2" > "$run/main-commit"
printf 'deploy: published %s to kingdown; live checks pass\\n' "$2" > "$run/publish.log"
verify_publish
write_log
printf 'deploy: checks passed at %s; publishing the tested build\\ndeploy: step publish\\ndeploy: step live check\\n' "$3" > "$run/publish.log"
stage=publish
verify_publish
`, 'tools/release/release.sh', head, merged, published]);
  const entries = result.stdout.split('\n').filter(line => line.includes('| PR #1501 |'));
  expect(result.status, result.stdout + result.stderr).toBe(1);
  expect(entries).toHaveLength(2);
  expect(entries[0]).toContain(`| commit ${merged} | published commit ${merged} |`);
  expect(entries[1]).toContain(`| commit ${merged} | publish failed (1) | published commit ${published}`);
  expect(result.stdout).toContain(`publish failed (1). Expected ${merged}. Published ${published}.`);
});

it('plans one CI check for --ci-passed and a wait for regular staging', () => {
  const once = run('python3', ['tools/release/staging.py', '--dry-run', '--ci-passed', head]);
  expect(once.status, once.stdout + once.stderr).toBe(0);
  expect(once.stdout.match(new RegExp(`^dry-run: node .*ci-green\\.mjs'? ${head}$`, 'gm')) ?? []).toHaveLength(1);
  expect(once.stdout).not.toContain('ci-wait.sh');

  const wait = run('python3', ['tools/release/staging.py', '--dry-run', head]);
  expect(wait.status, wait.stdout + wait.stderr).toBe(0);
  expect(wait.stdout).toContain('ci-wait.sh');
  expect(wait.stdout).not.toContain('ci-green.mjs');
});

it('plans a preview build and aliases only to the preview host through the staging guard', () => {
  const result = run('python3', ['tools/release/staging.py', '--preview', '--dry-run', head]);
  const lines = result.stdout.trimEnd().split('\n');
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(lines.find(line => line.includes(' alias set '))).toMatch(/ kingdown-preview\.vercel\.app --scope /);
  expect(lines.find(line => line.includes(' alias set '))).not.toContain('kingdown-staging.vercel.app');
  expect(result.stdout).toContain('VITE_SUPABASE_URL=https://puhspsyjyzaghmgtkzqd.supabase.co');
  expect(result.stdout).toContain('node tools/deploy-staging.mjs --publish');
  expect(result.stdout).not.toMatch(/ci-wait|tools\/deploy\.sh|database|utqzovjmclfyojedmwok/);
  const steps = ['npm run typecheck', 'npm run build:vercel', 'SITE_ROOT=', 'deploy-staging.mjs --publish', ' alias set ', 'PLAYABLE_URL='];
  const order = steps.map(step => lines.findIndex(line => line.includes(step)));
  expect(order.every((pos, i) => pos >= 0 && (i === 0 || pos > order[i - 1]))).toBe(true);
  expect(lines.at(-1)).toBe('https://kingdown-preview.vercel.app');
});

it('sets test pages only for the preview build', () => {
  const preview = run('python3', ['tools/release/staging.py', '--dry-run', '--preview', head]);
  const staging = run('python3', ['tools/release/staging.py', '--dry-run', head], { KINGDOWN_TEST_PAGES: '1' });
  expect(preview.stdout.split('\n').find(line => line.includes('npm run build:vercel'))).toContain('env KINGDOWN_TEST_PAGES=1');
  expect(staging.stdout.split('\n').find(line => line.includes('npm run build:vercel'))).toContain('env -u KINGDOWN_TEST_PAGES');
  expect(staging.stdout.split('\n').find(line => line.includes('npm run build:vercel'))).toContain('tools/test-lock.sh --machine');
  expect(readFileSync('tools/release/live.sh', 'utf8')).toMatch(/^unset KINGDOWN_STAGE VITE_KINGDOWN_STAGE KINGDOWN_TEST_PAGES$/m);
});

it('checks the served home of a solo build and rejects a Vercel sign-in redirect', () => {
  const result = run('python3', ['-B', '-c', `
import importlib.util
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('staging', 'tools/release/staging.py')
staging = importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)
out = Path(${JSON.stringify(folder)}) / 'output'
static = out / 'static'
static.mkdir(parents=True)
files = {'index.html': b'old page', 'next.html': b'new page', 'sw.js': b'worker', 'solo-launch.json': b'{}'}
for name, body in files.items():
    (static / name).write_bytes(body)
with patch.object(staging, 'get', side_effect=[
    (200, b'new page', ''), (200, b'old page', ''), (200, b'worker', ''),
    (200, b'{"account_access":"open"}', ''),
]):
    assert staging.verify_alias(out, staging.STAGING, 1)['/']['file'] == 'next.html'
with patch.object(staging, 'get', return_value=(302, b'', 'https://vercel.com/login')):
    try:
        staging.verify_alias(out, staging.PREVIEW, 1)
    except RuntimeError as error:
        assert 'redirects to Vercel sign-in' in str(error)
    else:
        raise AssertionError('Expected Vercel sign-in refusal')
`]);
  expect(result.status, result.stdout + result.stderr).toBe(0);
});

it('reruns failed jobs on the exact main CI run once and stops if the retry fails', () => {
  const bin = join(folder, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'node'), '#!/bin/bash\nexit 2\n', { mode: 0o755 });
  writeFileSync(join(bin, 'gh'), `#!/bin/bash
case "$1 $2" in
  'run list') [[ " $* " == *" --commit ${head} "* ]] && echo 987 ;;
  'run watch') exit 0 ;;
  'run view') [[ " $* " == *" conclusion "* ]] && echo failure || echo job ;;
  'run rerun') [[ " $* " == *" --failed "* ]] || exit 2; echo rerun >> "$RESULT" ;;
  api*) if [ -f "$RESULT" ]; then echo 2; else echo 1; fi ;;
  *) exit 2 ;;
esac
`, { mode: 0o755 });
  const record = join(folder, 'rerun');
  const result = run('bash', ['tools/release/ci-wait.sh', head, '0', '--retry-failed'],
    { PATH: bin + ':' + process.env.PATH, RESULT: record });
  expect(result.status, result.stdout + result.stderr).toBe(2);
  expect(readFileSync(record, 'utf8')).toBe('rerun\n');
});
