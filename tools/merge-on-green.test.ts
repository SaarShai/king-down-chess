import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { mergeOnGreen, REUSE_SHAPE } from './merge-on-green.mjs';

vi.setConfig({ testTimeout: 60_000 });
const head = 'a'.repeat(40), base = 'b'.repeat(40);
const dirs: string[] = [];
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

function record(result = 'complete') {
  return { pr: 158, head, base, reviews: [
    { id: 'review-1', head, base, result, openFindings: [] as string[], reconcile: undefined as undefined | { head: string; base: string; result: string; note: string } },
  ] };
}

function fixture(value: unknown = record()) {
  const dir = mkdtempSync(join(tmpdir(), 'kingdown-merge-'));
  dirs.push(dir);
  const file = join(dir, 'review.json');
  writeFileSync(file, JSON.stringify(value));
  const checks = Array.from({ length: 11 }, (_, id) => ({ id, head_sha: head, status: 'completed', conclusion: 'success' }));
  const status = { sha: head, total_count: 1, state: 'success' };
  const current = { number: 158, state: 'OPEN', headRefOid: head, baseRefOid: base };
  const gh = vi.fn((args: string[], _options?: { timeout: number }) => {
    if (args[0] === 'api' && args[1].endsWith('/status')) return JSON.stringify(status);
    if (args[0] === 'api') return JSON.stringify([{ total_count: checks.length, check_runs: checks }]);
    if (args[1] === 'view') return JSON.stringify(current);
    if (args[1] === 'merge') return 'merged';
    throw new Error(`unexpected call: ${args}`);
  });
  let clock = 0;
  const advance = (ms: number) => { clock += ms; };
  const pause = vi.fn(async (ms: number) => { advance(ms); });
  const options = { gh, pause, now: () => clock };
  const run = () => mergeOnGreen(158, head, file, options);
  const merges = () => gh.mock.calls.filter(([args]) => args[1] === 'merge');
  return { dir, file, checks, status, current, gh, pause, advance, run, merges };
}

function runCli(value: ReturnType<typeof record>) {
  const { dir, file, current, checks, status } = fixture(value);
  const calls = join(dir, 'calls.jsonl');
  writeFileSync(join(dir, 'gh'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify(args) + '\\n');
if (args[0] === 'pr' && args[1] === 'view') console.log(${JSON.stringify(JSON.stringify(current))});
if (args[0] === 'api' && args[1].endsWith('/status')) console.log(${JSON.stringify(JSON.stringify(status))});
else if (args[0] === 'api') console.log(${JSON.stringify(JSON.stringify([{ total_count: 11, check_runs: checks }]))});
`, { mode: 0o755 });
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('./merge-on-green.mjs', import.meta.url)),
    '158', head, file,
  ], { encoding: 'utf8', timeout: 10_000, env: { ...process.env, PATH: `${dir}:${process.env.PATH}` } });
  const commands: string[][] = existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [];
  return { result, commands };
}

it('refuses a merge with passing CI while a requested review runs', () => {
  const { result, commands } = runCli(record('running'));
  expect(commands.filter(args => args[0] === 'pr' && args[1] === 'merge'), result.stdout + result.stderr).toEqual([]);
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('result is not complete');
});

it('runs the CLI with local GitHub stand-ins and permits a complete record', () => {
  const { result, commands } = runCli(record());
  expect(result.status, result.stderr).toBe(0);
  expect(commands.map(args => args.slice(0, 2))).toEqual([
    ['pr', 'view'], ['api', '--paginate'], ['api', `repos/SaarShai/king-down-chess/commits/${head}/status`], ['pr', 'view'], ['pr', 'merge'],
  ]);
  expect(commands[4].slice(-2)).toEqual(['--match-head-commit', head]);
});

it.each(['pending', 'running', 'failed', 'cancelled', ''])('refuses review result %s', async result => {
  const f = fixture(record(result));
  await expect(f.run()).rejects.toThrow('result is not complete');
  expect(f.merges()).toEqual([]);
});

it('refuses when any requested review still runs', async () => {
  const value = record();
  value.reviews.push({ ...value.reviews[0], id: 'review-2', result: 'running' });
  const f = fixture(value);
  await expect(f.run()).rejects.toThrow('review-2');
  expect(f.merges()).toEqual([]);
});

it('refuses an open finding', async () => {
  const value = record();
  value.reviews[0].openFindings.push('finding-1');
  const f = fixture(value);
  await expect(f.run()).rejects.toThrow('open findings');
  expect(f.merges()).toEqual([]);
});

it.each(['head', 'base'] as const)('refuses a changed review %s without a reconcile', async key => {
  const value = record();
  value.reviews[0][key] = 'c'.repeat(40);
  const f = fixture(value);
  await expect(f.run()).rejects.toThrow('record a reconcile');
  expect(f.merges()).toEqual([]);
});

it.each([
  { head: 'c'.repeat(40), base, result: 'pass', note: 'Findings checked.' },
  { head, base: 'c'.repeat(40), result: 'pass', note: 'Findings checked.' },
  { head, base, result: 'pass', note: '' },
  { head, base, result: 'fail', note: 'Finding is still present.' },
])('refuses an incomplete or stale reconcile: %j', async reconcile => {
  const value = record();
  value.reviews[0].head = 'd'.repeat(40);
  value.reviews[0].reconcile = reconcile;
  const f = fixture(value);
  await expect(f.run()).rejects.toThrow('record a reconcile');
  expect(f.merges()).toEqual([]);
});

it.each([false, true])('permits complete reviews with no open findings (reconcile=%s)', async reconciled => {
  const value = record();
  if (reconciled) {
    value.reviews[0].head = 'c'.repeat(40);
    value.reviews[0].base = 'd'.repeat(40);
    value.reviews[0].reconcile = { head, base, result: 'pass', note: 'Check finding-1 against the current diff. The fix is present.' };
  }
  const f = fixture(value);
  await expect(f.run()).resolves.toBe('merged');
  expect(f.merges()).toEqual([[['pr', 'merge', '158', '--repo', 'SaarShai/king-down-chess', '--merge', '--match-head-commit', head], { timeout: 60_000 }]]);
  expect(f.gh.mock.calls[1][0]).toEqual(['api', '--paginate', '--slurp', `repos/SaarShai/king-down-chess/commits/${head}/check-runs?per_page=100`]);
});

it.each([null, {}, { ...record(), pr: 159 }, { ...record(), head: 'c'.repeat(40) }, { ...record(), base: 'short' },
  { ...record(), reviews: [] }, { ...record(), reviews: [record().reviews[0], record().reviews[0]] },
  { ...record(), reviews: [{ id: 'review-1', head, base }] },
])('refuses an invalid review record: %j', async value => {
  const f = fixture(value);
  await expect(f.run()).rejects.toThrow();
  expect(f.gh).not.toHaveBeenCalled();
});

it.each(['missing', 'invalid JSON'])('refuses a %s record', async kind => {
  const f = fixture();
  if (kind === 'missing') rmSync(f.file);
  else writeFileSync(f.file, '{');
  await expect(f.run()).rejects.toThrow('cannot read the review record');
  expect(f.gh).not.toHaveBeenCalled();
});

it.each(['state', 'headRefOid', 'baseRefOid', 'number'])('refuses a changed PR %s', async key => {
  const f = fixture();
  Object.assign(f.current, { [key]: key === 'number' ? 159 : 'c'.repeat(40) });
  await expect(f.run()).rejects.toThrow('recorded head and base');
  expect(f.merges()).toEqual([]);
});

it('waits for every check to complete', async () => {
  const f = fixture();
  f.checks[0].status = 'in_progress';
  f.pause.mockImplementationOnce(async () => { f.checks[0].status = 'completed'; });
  await expect(f.run()).resolves.toBe('merged');
  expect(f.pause).toHaveBeenCalledExactlyOnceWith(60_000);
});

it('refuses commit status failure beside eleven successful check-runs', async () => {
  const f = fixture();
  f.status.state = 'failure';
  f.status.total_count = 101;
  await expect(f.run()).rejects.toThrow();
  expect(f.merges()).toEqual([]);
});

it.each(['state', 'headRefOid', 'baseRefOid', 'number'])('reads the current PR %s again after CI', async key => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => {
    const output = gh(args);
    if (args[0] === 'api') Object.assign(f.current, { [key]: key === 'number' ? 159 : 'c'.repeat(40) });
    return output;
  });
  await expect(f.run()).rejects.toThrow();
  expect(f.merges()).toEqual([]);
});

it('counts slow requests in the four-hour deadline', async () => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  let polls = 0;
  f.gh.mockImplementation(args => {
    f.advance(30_000);
    if (args[0] === 'api' && args.at(-1)!.includes('/check-runs?')) f.checks[0].status = ++polls === 240 ? 'completed' : 'queued';
    return gh(args);
  });
  await expect(f.run()).rejects.toThrow('four hours');
  expect(f.merges()).toEqual([]);
});

it('waits for a pending commit status', async () => {
  const f = fixture();
  f.status.state = 'pending';
  f.pause.mockImplementationOnce(async ms => { f.advance(ms); f.status.state = 'success'; });
  await expect(f.run()).resolves.toBe('merged');
  expect(f.pause).toHaveBeenCalledExactlyOnceWith(60_000);
});

it('permits passing checks when there are no commit statuses', async () => {
  const f = fixture();
  Object.assign(f.status, { state: 'pending', total_count: 0 });
  await expect(f.run()).resolves.toBe('merged');
});

it.each(['head', 'count', 'state', 'api'])('refuses invalid or unreadable commit status: %s', async fault => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => {
    if (args[0] === 'api' && args[1].endsWith('/status')) {
      if (fault === 'api') throw new Error('status request fails');
      if (fault === 'head') f.status.sha = 'c'.repeat(40);
      if (fault === 'count') f.status.total_count = -1;
      if (fault === 'state') f.status.state = 'unknown';
    }
    return gh(args);
  });
  await expect(f.run()).rejects.toThrow();
  expect(f.merges()).toEqual([]);
});

it('reads the review record after the final PR request', async () => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  let views = 0;
  f.gh.mockImplementation(args => {
    const output = gh(args);
    if (args[1] === 'view' && ++views === 2) writeFileSync(f.file, JSON.stringify(record('running')));
    return output;
  });
  await expect(f.run()).rejects.toThrow('result is not complete');
  expect(f.merges()).toEqual([]);
});

it.each([1, 2, 3, 4])('refuses merge when read request %s reaches the deadline', async request => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  let reads = 0;
  f.gh.mockImplementation(args => {
    if (++reads === request) f.advance(4 * 60 * 60 * 1000);
    return gh(args);
  });
  await expect(f.run()).rejects.toThrow('four hours');
  expect(f.gh).toHaveBeenCalledTimes(request);
  expect(f.merges()).toEqual([]);
});

it('limits the final pause to the remaining time', async () => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  f.checks[0].status = 'queued';
  f.gh.mockImplementation(args => {
    if (args[0] === 'api' && args[1].endsWith('/status')) f.advance(4 * 60 * 60 * 1000 - 25);
    return gh(args);
  });
  await expect(f.run()).rejects.toThrow('four hours');
  expect(f.pause).toHaveBeenCalledExactlyOnceWith(25);
  expect(f.gh).toHaveBeenCalledTimes(3);
  expect(f.merges()).toEqual([]);
});

it('limits every request, including merge, to the remaining time', async () => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => {
    const output = gh(args);
    if (args[1] === 'view') f.advance(f.gh.mock.calls.length === 1 ? 4 * 60 * 60 * 1000 - 50 : 25);
    return output;
  });
  await expect(f.run()).resolves.toBe('merged');
  expect(f.gh.mock.calls.map(([, options]) => options?.timeout)).toEqual([60_000, 50, 50, 50, 25]);
});

it.each(['running', 'finding', 'base'])('reads the record again before merge: %s', async change => {
  const value = record(), f = fixture(value);
  const gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => {
    const output = gh(args);
    if (args[0] === 'api') {
      if (change === 'running') value.reviews.push({ ...value.reviews[0], id: 'review-2', result: 'running' });
      if (change === 'finding') value.reviews[0].openFindings.push('finding-1');
      if (change === 'base') {
        value.base = 'c'.repeat(40);
        value.reviews[0].base = value.base;
      }
      writeFileSync(f.file, JSON.stringify(value));
    }
    return output;
  });
  await expect(f.run()).rejects.toThrow();
  expect(f.merges()).toEqual([]);
});

it('checks the review record again after each CI wait', async () => {
  const f = fixture();
  f.checks[0].status = 'queued';
  f.pause.mockImplementationOnce(async () => { writeFileSync(f.file, JSON.stringify(record('running'))); });
  await expect(f.run()).rejects.toThrow('result is not complete');
  expect(f.merges()).toEqual([]);
});

/** The check runs of a reused run: reuse passed, every other job skipped (one run per job, matrix jobs included). */
const reuseShape = () => REUSE_SHAPE.map((name, id) => ({ id, name, head_sha: head, status: 'completed', conclusion: name === 'reuse' ? 'success' : 'skipped' }));
type Check = ReturnType<typeof reuseShape>[number];

it('merges the reuse shape: reuse passed and every other job skipped, because a green run checked the same tree', async () => {
  const f = fixture();
  f.checks.splice(0, f.checks.length, ...reuseShape());
  await f.run();
  expect(f.merges()).toHaveLength(1);
});

it('judges each check suite of the head alone: a full staging push run beside a reused release PR run', async () => {
  const f = fixture();
  const push = f.checks.map(check => ({ ...check, check_suite: { id: 1 } }));
  const pr = reuseShape().map(check => ({ ...check, check_suite: { id: 2 } }));
  f.checks.splice(0, f.checks.length, ...push, ...pr);
  await f.run();
  expect(f.merges()).toHaveLength(1);
  f.gh.mockClear();
  push[3].conclusion = 'failure';
  await expect(f.run()).rejects.toThrow('CI check does not pass');
  expect(f.merges()).toEqual([]);
});

it.each<[string, (check: Check) => Check | null]>([
  ['a job is missing', check => check.name === 'verify' ? null : check],
  ['reuse itself is skipped', check => check.name === 'reuse' ? { ...check, conclusion: 'skipped' } : check],
  ['one skipped job is beside passing jobs', check => check.name === 'browser-web' ? check : { ...check, conclusion: 'success' }],
])('refuses skipped checks when %s', async (_name, change) => {
  const f = fixture();
  f.checks.splice(0, f.checks.length, ...reuseShape().map(change).filter((check): check is Check => check !== null));
  await expect(f.run()).rejects.toThrow(/CI check does not pass|reuse shape/);
  expect(f.merges()).toEqual([]);
});

it.each(['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', null])('refuses CI conclusion %s', async conclusion => {
  const f = fixture();
  Object.assign(f.checks[0], { conclusion });
  await expect(f.run()).rejects.toThrow('CI check does not pass');
  expect(f.merges()).toEqual([]);
});

it.each([0, 9])('times out without a merge with only %s checks', async count => {
  const f = fixture();
  f.checks.splice(count);
  await expect(f.run()).rejects.toThrow('four hours');
  expect(f.pause).toHaveBeenCalledTimes(240);
  expect(f.merges()).toEqual([]);
});

it('times out when a check never ends', async () => {
  const f = fixture();
  f.checks[0].status = 'queued';
  await expect(f.run()).rejects.toThrow('four hours');
  expect(f.merges()).toEqual([]);
});

it('uses every page of CI checks, including a failure on the last page', async () => {
  const f = fixture();
  f.checks[10].conclusion = 'failure';
  const gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => args[0] === 'api' ? JSON.stringify([
    { total_count: 11, check_runs: f.checks.slice(0, 10) }, { total_count: 11, check_runs: f.checks.slice(10) },
  ]) : gh(args));
  await expect(f.run()).rejects.toThrow('CI check does not pass');
  expect(f.merges()).toEqual([]);
});

it.each(['head', 'pages', 'status', 'api'])('refuses invalid or unreadable CI: %s', async fault => {
  const f = fixture(), gh = f.gh.getMockImplementation()!;
  f.gh.mockImplementation(args => {
    if (args[0] !== 'api') return gh(args);
    if (fault === 'api') throw new Error('API request fails');
    if (fault === 'head') f.checks[0].head_sha = 'c'.repeat(40);
    if (fault === 'status') f.checks[0].status = 'unknown';
    return JSON.stringify([{ total_count: fault === 'pages' ? 12 : 11, check_runs: f.checks }]);
  });
  await expect(f.run()).rejects.toThrow();
  expect(f.merges()).toEqual([]);
});
