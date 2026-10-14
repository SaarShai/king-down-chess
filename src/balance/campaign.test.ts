import { it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { importCampaign } from './campaign';
import { DEFAULT_RULES, RULES, setRules } from '../rules/rules';
import { withRules } from '../study/model';
import { schedule, gameRules, type TournamentSpec } from '../sim/tournament';
import type { BalanceDataset } from './dataset';

it('restores caller rules after a tournament import and activity replay errors', () => {
  const dir = mkdtempSync(join(tmpdir(), 'campaign-rules-'));
  const previous = structuredClone(RULES);
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  const save = (path: string, value: unknown) => writeFileSync(join(dir, path), JSON.stringify(value));
  try {
    mkdirSync(join(dir, 'analysis-source'));
    mkdirSync(join(dir, 'kaggle/activity-s0of1'), { recursive: true });
    const id = 'activity-fixture';
    const spec: TournamentSpec = { id, entrants: ['none'], mirror: true, pairs: 1, depth: 1, seed: 8, pool: 'NNBBRRQ', guardNextToKing: true, rules: structuredClone(DEFAULT_RULES), maxPlies: 10, openingRandomPlies: 0 };
    const jobs = withRules(DEFAULT_RULES, () => schedule(spec));
    const bytes = JSON.stringify(spec), archive = 'fixture';
    writeFileSync(join(dir, 'source.tar'), archive);
    writeFileSync(join(dir, 'analysis-source/fixture.txt'), archive);
    save('campaign.json', { commit: 'fixture', sourceArchiveSha256: hash(archive), files: { 'fixture.txt': hash(archive) }, runs: [{ id, kind: 'kaggle', shards: 1, expectedGames: jobs.length, args: [] }] });
    const provenance = { commit: 'fixture', sourceArchiveSha256: hash(archive), command: [], specSha256: hash(bytes), spec, jobs, contexts: Object.fromEntries(jobs.map(j => [`${j.white}|${j.black}`, { ...DEFAULT_RULES, ...gameRules(spec, j.white, j.black) }])), shardCounts: [jobs.length] };
    save(`${id}.provenance.json`, provenance);
    writeFileSync(join(dir, `${id}.tournament.json`), bytes);
    const shard = 'kaggle/activity-s0of1/';
    writeFileSync(join(dir, shard, `${id}.tournament.json`), bytes);
    save(shard + 'status.json', { seconds: 1, exit: 0, sha: 'fixture', shard: '0/1' });
    const writeRows = (bad: boolean) => {
      const rows = jobs.map(j => ({ ...j, result: .5, plies: bad ? 1 : 0, lans: bad ? ['invalid'] : [] }));
      const raw = rows.map(r => JSON.stringify(r) + '\n').join('');
      writeFileSync(join(dir, shard, `${id}.shard0of1.jsonl`), raw);
      save(shard + 'validation.json', { sha256: hash(raw) });
    };
    const dataset = (): BalanceDataset => ({ schemaVersion: 1, measurements: [], sources: [], runs: [], warnings: [] });
    setRules({ ...DEFAULT_RULES, guardNextToKing: !DEFAULT_RULES.guardNextToKing });
    const caller = structuredClone(RULES);
    writeRows(false);
    const d = dataset();
    importCampaign(dir, d);
    expect(d.runs).toHaveLength(1);
    expect(RULES).toEqual(caller);
    writeRows(true);
    expect(() => importCampaign(dir, dataset())).toThrow('Activity replay failed');
    expect(RULES).toEqual(caller);
    save(`${id}.provenance.json`, { ...provenance, jobs: [] });
    expect(() => importCampaign(dir, dataset())).toThrow('regenerated tournament schedule');
    expect(RULES).toEqual(caller);
  } finally {
    Object.assign(RULES, previous);
    rmSync(dir, { recursive: true, force: true });
  }
});

it('checks worth schedules under each arm rules and restores caller rules', async () => {
  const { buildJobs } = await import('../sim/spec');
  const { stampOf } = await import('../sim/run');
  const root = mkdtempSync(join(tmpdir(), 'campaign-worth-rules-'));
  const dir = join(root, 'campaign'), out = join(root, 'm1/kd-balance-20261009');
  const previous = structuredClone(RULES);
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  const save = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
  try {
    mkdirSync(join(dir, 'analysis-source'), { recursive: true }); mkdirSync(out, { recursive: true });
    const id = 'worth-rules', archive = 'fixture', pool = 'GNNBRRQ';
    const arms = [true, false].map((guardNextToKing, i) => {
      const spec = { id: `${id}.${i ? 'pawn' : 'N'}`, games: 2, seed: 8, ai: { depth: 1 }, pairs: true, backRanks: { sample: 1, pool }, rules: { ...DEFAULT_RULES, guardNextToKing } };
      return { spec, jobs: withRules(spec.rules, () => buildJobs(spec)), stamp: stampOf(spec) };
    });
    // The two arms place the guard by different rules, so the schedule must read each arm.
    expect(arms[0].jobs).not.toEqual(arms[1].jobs);
    const checks = arms.map(a => {
      const raw = a.jobs.map(j => JSON.stringify({ ...j, ...a.stamp, result: .5, plies: 0 }) + '\n').join('');
      writeFileSync(join(out, `${a.spec.id}.jsonl`), raw);
      return { id: a.spec.id, sha256: hash(raw) };
    });
    writeFileSync(join(dir, 'source.tar'), archive); writeFileSync(join(dir, 'analysis-source/fixture.txt'), archive);
    save(join(dir, 'campaign.json'), { commit: 'fixture', sourceArchiveSha256: hash(archive), files: { 'fixture.txt': hash(archive) }, runs: [{ id, kind: 'm1', args: [], expectedGames: 4 }] });
    save(join(dir, `${id}.provenance.json`), { commit: 'fixture', sourceArchiveSha256: hash(archive), command: [], src: arms[0].stamp.src, pool, arms });
    save(join(dir, 'worth-counts-stamps-check.json'), { arms: checks });
    save(join(out, `${id}.status.json`), { state: 'finished', exitCode: 0, commit: 'fixture' });
    setRules({ ...DEFAULT_RULES, guardNextToKing: false });
    const caller = structuredClone(RULES);
    const d: BalanceDataset = { schemaVersion: 1, measurements: [], sources: [], runs: [], warnings: [] };
    importCampaign(dir, d);
    expect(d.runs).toHaveLength(1); expect(RULES).toEqual(caller);
  } finally {
    Object.assign(RULES, previous); rmSync(root, { recursive: true, force: true });
  }
});
