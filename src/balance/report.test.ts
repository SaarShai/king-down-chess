import { mkdtempSync, readFileSync, rmSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { buildFramework, currentCheck } from './report';
import { readWorkbook } from './workbook';
import { DEFAULT_RULES } from '../rules/rules';
import type { BalanceDataset } from './dataset';

it('builds the real source report without mixing versions or treating a blank design as measured', () => {
  const output = mkdtempSync(join(tmpdir(), 'balance-report-'));
  try {
    const dataset: BalanceDataset = { schemaVersion: 1, measurements: [], sources: [], runs: [], warnings: [] };
    const workbook = readWorkbook('docs/status/king-down-status-2026-10-09.xlsx', 'docs/status/king-down-status-2026-10-09.xlsx');
    buildFramework(process.cwd(), dataset, workbook, output);
    const status = JSON.parse(readFileSync(join(output, 'status.json'), 'utf8'));
    expect(status.findings).toEqual([]);
    expect(status.newDesigns).toHaveLength(2);
    expect(status.newDesigns.every((d: { value: unknown; specified: number }) => d.value === null && d.specified === 0)).toBe(true);
    expect(status.statuses.some((s:any)=>s.element==='Guard' && s.criterion==='piece-worth' && s.evidence.some((id:string)=>/gain/.test(id)))).toBe(false);
    expect(status.statuses.some((s:any)=>['HolyLight','Mercy','DeathTouch','Darkness'].includes(s.element) && s.criterion==='power-field')).toBe(false);
    expect(status.statuses.every((s:any)=>Object.keys(s.diagnostics).join(',')==='paralysis,conditions,interactions')).toBe(true);
    expect(dataset.measurements.find(m=>m.id==='evidence:guard-king-p')?.measure).toBe('worthDifference');
    expect(status.statuses.find((s:any)=>s.element==='Haste' && s.criterion==='power-field')?.evidenceStatus).toBe('no-data');
    expect(status.models).toHaveLength(2);
    expect(status.models.every((m: { anchors: unknown[]; example: { value: number } }) => m.anchors.length === 5 && m.example.value > 0 && m.example.value < 1)).toBe(true);
    expect(status.statuses.find((s: Record<string, string>) => s.element === 'Archer' && s.criterion === 'piece-captures' && s.version.includes('far2'))).toMatchObject({ evidenceStatus: 'fail', status: 'no-data' });
    expect(status.statuses.find((s: Record<string, string>) => s.element === 'Archer' && s.criterion === 'piece-game')).toMatchObject({ evidenceStatus: 'fail' });
    expect(status.statuses.some((s: Record<string, string>) => s.element === 'MorphP' && s.criterion === 'card-worth')).toBe(true);
    expect(dataset.measurements.find(m => m.id === 'evidence:cards-d1-Rally-worth')).toMatchObject({ sample: 600, sampleUnit: 'games', calibration: { relativeError: 0.25 } });
    expect(readFileSync(join(output, 'FRAMEWORK.md'), 'utf8')).toContain('queue-four-card-approval');
    expect(dataset.measurements.find(m => m.id === 'evidence:far2-noadj-worth')?.sources).toContain('docs/QUEUE.md § Running and queued, 2026-10-06');
    const files = ['FRAMEWORK.md', 'status.json', 'workbook.json'];
    const before = files.map(file => readFileSync(join(output, file), 'utf8'));
    const ids = dataset.measurements.map(row => row.id);
    buildFramework(process.cwd(), dataset, workbook, output);
    expect(files.map(file => readFileSync(join(output, file), 'utf8'))).toEqual(before);
    expect(dataset.measurements.map(row => row.id)).toEqual(ids);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

it('keeps each proposed first wave small and each notebook below nine hours', () => {
  const { nextRuns } = JSON.parse(readFileSync('docs/balance/evidence.json', 'utf8'));
  for (const run of nextRuns) {
    expect(run.notebookMinutes).toBeLessThan(9 * 60);
    if (!run.machine.startsWith('Kaggle')) continue;
    const shards = Number(/--shards (\d+)/.exec(run.command)?.[1]);
    const first = Number(/--first (\d+)/.exec(run.command)?.[1] ?? 0);
    expect(shards - first).toBeGreaterThan(0);
    expect(shards - first).toBeLessThanOrEqual(5);
  }
});


it('joins completed rows into the report and removes only a proved target duplicate', () => {
  const root = mkdtempSync(join(tmpdir(), 'balance-completed-'));
  const output = join(root, 'out');
  try {
    mkdirSync(output); mkdirSync(join(root, 'docs/balance'), { recursive: true }); mkdirSync(join(root, 'src/rules'), { recursive: true });
    for (const file of ['docs/MATRIX.md', 'docs/RULES.md', 'src/rules/rules.ts', 'docs/balance/evidence.json']) copyFileSync(file, join(root, file));
    const evidence = JSON.parse(readFileSync(join(root, 'docs/balance/evidence.json'), 'utf8'));
    evidence.nextRuns[0].skipIfCompletedRunIds = ['deal-c4k'];
    evidence.nextRuns[0].games = 20;
    evidence.nextRuns[0].requirements = { mode: 'ordinary', criteria: ['piece-captures', 'piece-moves'], elements: ['Archer'] };
    writeFileSync(join(root, 'docs/balance/evidence.json'), JSON.stringify(evidence));
    const context = { flags: { ...DEFAULT_RULES }, flagsKind: 'full' as const, commit: 'engine', sourceHash: 'engine-hash', specKey: 'exact-spec', pool: 'QOLRRBBNNAAGMMS', depth: 3, machine: 'fixture', settings: { entrants: ['none'] }, variantScope: 'none' as const, population: 'run' as const };
    const target = { sourceHash: context.sourceHash, specKey: context.specKey, flags: context.flags, pool: context.pool, mode: 'ordinary' as const, priceReview: 'Fixture source prices checked.', reason: 'Fixture target checked.' };
    const measurement = { id: 'completed-ratio', run: 'deal-c4k', element: 'Archer', version: 'far2 target', context, measure: 'activity' as const, criterion: 'piece-captures', value: 1.2, error: 0.1, errorKind: '95% army report interval', sample: 20, sampleUnit: 'games' as const, unit: 'ratio', validity: 'valid' as const, reasons: [], sources: ['fixture'], method: 'fixture ratio' };
    const dataset: BalanceDataset = { schemaVersion: 1, measurements: [measurement], sources: [], runs: [{ run: 'deal-c4k', queue: [], sources: [], reasons: [], status: 'valid', lifecycle: 'complete', expectedGames: 20, selectedGames: 20, observedGames: 20 }], warnings: [] };
    const workbook = readWorkbook('docs/status/king-down-status-2026-10-09.xlsx', 'docs/status/king-down-status-2026-10-09.xlsx');
    writeFileSync(join(root, 'docs/balance/target-contexts.json'), JSON.stringify({ contexts: [] }));
    buildFramework(root, dataset, workbook, output);
    let status = JSON.parse(readFileSync(join(output, 'status.json'), 'utf8'));
    expect(status.nextRuns).toHaveLength(evidence.nextRuns.length);
    expect(status.reviewedRuns.find((r: { id: string }) => r.id === 'deal-c4k')).toMatchObject({ lifecycle: 'complete', evidence: ['completed-ratio'] });
    writeFileSync(join(root, 'docs/balance/target-contexts.json'), JSON.stringify({ contexts: [target] }));
    buildFramework(root, dataset, workbook, output);
    status = JSON.parse(readFileSync(join(output, 'status.json'), 'utf8'));
    expect(status.nextRuns).toHaveLength(evidence.nextRuns.length);
    dataset.measurements.push({ ...measurement, id: 'completed-moves', criterion: 'piece-moves' });
    buildFramework(root, dataset, workbook, output);
    status = JSON.parse(readFileSync(join(output, 'status.json'), 'utf8'));
    expect(status.nextRuns).toHaveLength(evidence.nextRuns.length - 1);
    expect(status.statuses.find((r: { element: string; criterion: string }) => r.element === 'Archer' && r.criterion === 'piece-captures')).toMatchObject({ status: 'pass', evidence: expect.arrayContaining(['completed-ratio']) });
    expect(readFileSync(join(output, 'FRAMEWORK.md'), 'utf8')).toContain('completed-ratio');
    const criterion = evidence.criteria.find((c: { id: string }) => c.id === 'piece-captures');
    expect(currentCheck([{ ...measurement, criterion: undefined }], [target], 'Archer', criterion).status).toBe('no-data');
    expect(currentCheck([{ ...measurement, unit: 'uses per side' }], [target], 'Archer', criterion).status).toBe('no-data');
    const gameCriterion = evidence.criteria.find((c: { id: string }) => c.id === 'piece-game');
    const comparison = { baseRun: 'control-A', variantRun: 'variant', kind: 'paired' as const };
    const draw = { ...measurement, id: 'draw', criterion: 'piece-game', measure: 'drawRate' as const, unit: 'fraction difference', value: 0, error: 0.01, comparison };
    const white = { ...draw, id: 'white', measure: 'whiteScore' as const };
    const length = { ...draw, id: 'length', measure: 'relativeLengthChange' as const, unit: 'fraction' };
    expect(currentCheck([draw, white, length], [target], 'Archer', gameCriterion).status).toBe('pass');
    expect(currentCheck([draw, white, { ...length, comparison: { ...comparison, baseRun: 'control-B' } }], [target], 'Archer', gameCriterion).status).toBe('no-data');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
