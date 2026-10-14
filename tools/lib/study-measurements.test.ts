import { createHash } from 'node:crypto';
import { previewStudyMeasurements as browserPreview, savedPlanOf } from '../../src/study/measurement-preview';
import { fromFen } from '../../src/rules/setup';
import { positionData } from '../../src/study/model';
import { describe, it, expect } from 'vitest';
import { exampleStudies } from '../../src/study/examples';
import { previewStudyMeasurements } from './study-measurements';
import { createMeasurementPlan, canonicalMeasurementJSON, type MeasurementRequest } from '../../src/study/measurement-plan';

const input = () => exampleStudies('test-engine')[0];
const request: MeasurementRequest = { recipe: 'activity', start: 'population', seed: 19, pairs: 2, depth: 1, pool: 'TTTTTTT' };
describe('study measurement previews', () => {
  it('keeps the saved schedules from before the pure-core extraction', () => {
    const cases = [
      [{ recipe: 'activity' }, '39488001d3bedd116825171be11691cb3ea33f308f8258a7742835b9fa26f27a'],
      [{ recipe: 'worth', pieces: 'T' }, 'baca109c356233155df53f03d28dfff6959ff69797f4bb281f5b554a3d144cae'],
      [{ recipe: 'field', entrants: ['none', 'Haste'] }, '475eafa956207123fb8946ecb73bab2ed1905b9ea6d426ff316e8deba8ad8818'],
      [{ recipe: 'cross-play', entrants: ['none', 'Haste', 'Flight'] }, '1ea0e940b46b52f64e9c746a39e48752bd84f0f9763e272b70f03240ddd016a4'],
    ] as const;
    for (const [overrides, hash] of cases) {
      const p = previewStudyMeasurements(input(), { ...request, ...overrides, ...('entrants' in overrides ? { entrants: [...overrides.entrants] } : {}) });
      expect(createHash('sha256').update(JSON.stringify(p.jobs)).digest('hex')).toBe(hash);
    }
  });
  it('matches the browser hashes, jobs and saved plans for all recipes', async () => {
    const policy = { powerPlies: 3, powerHold: { Haste: 17 }, powerHoldSides: [{ Haste: 9 }, {}] as [Record<string, number>, Record<string, number>], values: { T: 450 }, maxPlies: 30, openingRandomPlies: 0, adjudicate: false as const };
    const recipes: MeasurementRequest[] = [
      { ...request, ...policy }, { ...request, ...policy, recipe: 'worth', pieces: 'T' },
      { ...request, ...policy, recipe: 'cross-play', entrants: ['none', 'Haste', 'Flight'] },
      { ...request, ...policy, recipe: 'field', entrants: ['none', 'Haste'] },
    ];
    for (const r of recipes) {
      const cli = previewStudyMeasurements(input(), r), browser = await browserPreview(input(), r, cli.source);
      expect(browser).toEqual(cli); expect(savedPlanOf(browser)).toEqual(savedPlanOf(cli));
    }
    const plain = input().study; delete plain.design; plain.rules.design = null;
    plain.start = positionData(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'));
    const r: MeasurementRequest = { ...request, recipe: 'four-cell', pool: 'ABNNRRQ', cardPool: ['Haste'], factors: [{ kind: 'piece', piece: 'A', replacement: 'N' }, { kind: 'card', card: 'Haste' }] };
    const cli = previewStudyMeasurements(plain, r);
    expect(await browserPreview(plain, r, cli.source)).toEqual(cli);
  });
  it('builds frozen deterministic custom jobs without playing a game', () => {
    const a = previewStudyMeasurements(input(), request), b = previewStudyMeasurements(input(), request);
    expect(a).toEqual(b); expect(a.preview).toMatchObject({ games: 4, blocks: 2, missingResults: 4 });
    expect(a.jobs[0].job.backRankWhite).toContain('T');
    expect(a.jobs[0].spec.rules).toEqual(input().study.rules);
    expect(a.execution.contexts[0].rules).toEqual(input().study.rules);
    expect(Object.isFrozen(a.jobs[0].spec.rules)).toBe(true);
  });
  it('binds checks, history, design version and full search context', () => {
    const base = previewStudyMeasurements(input(), request).fingerprint;
    const variants = [
      { ...request, seed: 20 }, { ...request, depth: 2 }, { ...request, values: { T: 500 } },
      { ...request, powerHold: { Haste: 30 } }, { ...request, powerHoldSides: [{ Haste: 20 }, {}] as [Record<string, number>, Record<string, number>] },
      { ...request, openingRandomPlies: 0 }, { ...request, maxPlies: 10 },
    ];
    for (const variant of variants) expect(previewStudyMeasurements(input(), variant).fingerprint).not.toBe(base);
    const changed = input(); changed.checks[0].expected = false;
    expect(previewStudyMeasurements(changed, request).fingerprint).not.toBe(base);
    const version = input(); version.study.design!.version++;
    expect(previewStudyMeasurements(version, request).fingerprint).not.toBe(base);
    expect(canonicalMeasurementJSON({ b: 2, a: 1 })).toBe(canonicalMeasurementJSON({ a: 1, b: 2 }));
  });
  it('uses value experiment calibration and power tournament schedules', () => {
    const worth = previewStudyMeasurements(input(), { ...request, recipe: 'worth', pieces: 'T' });
    expect(worth.preview).toMatchObject({ games: 16, blocks: 8 });
    expect(worth.jobs.some(g => g.spec.id.endsWith('.pawn') && !!g.job.fen)).toBe(true);
    const cross = previewStudyMeasurements(input(), { ...request, recipe: 'cross-play', entrants: ['none', 'Haste', 'Flight'] });
    expect(cross.preview).toMatchObject({ games: 12, blocks: 6 });
    const field = previewStudyMeasurements(input(), { ...request, recipe: 'field', entrants: ['none', 'Haste'] });
    expect(field.preview.games).toBe(4);
    expect(cross.jobs.every(g => g.spec.rules?.design?.code === input().study.design?.code)).toBe(true);
  });
  it('builds four-cell blocks from declared named factors', () => {
    const plain = input().study; delete plain.design; plain.rules.design = null; plain.start = positionData(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'));
    const four = previewStudyMeasurements(plain, { ...request, recipe: 'four-cell', pool: 'ABNNRRQ', cardPool: ['Haste'], factors: [{ kind: 'piece', piece: 'A', replacement: 'N' }, { kind: 'card', card: 'Haste' }] });
    expect(four.preview).toMatchObject({ games: 24, blocks: 2 });
    expect(() => createMeasurementPlan(plain, { ...request, recipe: 'four-cell', pairs: 715, pool: 'ABNNRRQ', cardPool: ['Haste', 'Rage'], factors: [{ kind: 'card', card: 'Haste' }, { kind: 'card', card: 'Rage' }] })).toThrow('Preview exceeds 10000 games');
    expect(four.jobs.every(g => !g.job.fen)).toBe(true);
    expect(four.execution.contexts.every(c => c.pool === 'ABNNRRQ')).toBe(true);
    expect(four.jobs.every(g => !Array.isArray(g.spec.backRanks) && g.spec.backRanks?.pool === 'ABNNRRQ')).toBe(true);
  });
  it('rejects repeated worth pieces and large previews before schedule allocation', () => {
    expect(() => createMeasurementPlan(input(), { ...request, recipe: 'worth', pieces: 'TT' })).toThrow('Duplicate worth piece');
    expect(() => createMeasurementPlan(input(), { ...request, recipe: 'worth', pieces: 'T'.repeat(1000) })).toThrow();
    expect(() => previewStudyMeasurements(input(), { ...request, pairs: 10000, recipe: 'field', entrants: Array.from({ length: 30 }, (_, i) => `entrant-${i}`) })).toThrow('Preview exceeds 10000 games');
    expect(() => createMeasurementPlan(input(), { ...request, pairs: 5001 })).toThrow('Preview exceeds');
    expect(() => createMeasurementPlan(input(), { ...request, pairs: 5000 })).not.toThrow();
    expect(() => createMeasurementPlan(input(), { ...request, recipe: 'worth', pieces: 'T', pairs: 1251 })).toThrow('Preview exceeds');
  });
  it('refuses unsupported starts, recipes, inputs and missing custom design', () => {
    expect(() => createMeasurementPlan(input(), { ...request, start: 'saved-state' })).toThrow('PositionData');
    expect(() => createMeasurementPlan(input(), { ...request, recipe: 'field' })).toThrow('requires entrants');
    expect(() => createMeasurementPlan(input(), { ...request, pieces: 'T' })).toThrow();
    expect(() => createMeasurementPlan(input(), { ...request, unexpected: true } as MeasurementRequest)).toThrow();
    expect(() => previewStudyMeasurements(input(), { ...request, recipe: 'cross-play', entrants: ['none', 'made-up'] })).toThrow('Unsupported entrant');
    const plain = input().study; delete plain.design; plain.rules.design = null; plain.start = positionData(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'));
    expect(() => createMeasurementPlan(plain, request)).toThrow('saved design');
  });
});
