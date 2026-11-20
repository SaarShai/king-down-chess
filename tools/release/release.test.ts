import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';

const head = 'a'.repeat(40);
const stages = ['ci', 'staging', 'staging-checks', 'merge', 'main-ci', 'engines', 'publish', 'live-check', 'log'];
const evidence = process.env.KINGDOWN_RELEASE_EVIDENCE || tmpdir();
mkdirSync(evidence, { recursive: true });
const folder = mkdtempSync(join(evidence, 'kingdown-release-test-'));
afterAll(() => rmSync(folder, { recursive: true, force: true }));
const run = (command: string, args: string[], settings: NodeJS.ProcessEnv = {}) => {
  return spawnSync(command, args, {
    encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, KINGDOWN_RELEASE_WORKTREE: join(folder, 'worktree'), KINGDOWN_RELEASE_EVIDENCE: folder, ...settings },
  });
};

function release(args: string[] = [], fail?: string) {
  const result = run('bash', ['tools/release/release.sh', '--dry-run', ...args, '1499', head, 'dry-run fixture'], { KINGDOWN_RELEASE_FAIL_STAGE: fail });
  const progress = result.stdout.match(/^release: progress (.+)$/m)?.[1];
  return {
    code: result.status,
    output: result.stdout + result.stderr,
    started: [...result.stdout.matchAll(/^release: (\S+) start$/gm)].map(match => match[1]),
    done: progress && readFileSync(progress + '.done', 'utf8').trim(),
  };
}

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
  expect([resumed.code, resumed.done]).toEqual([0, '0']);
  expect(release(['--tweak']).started).toEqual(stages.filter(stage => !stage.startsWith('staging')));
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
