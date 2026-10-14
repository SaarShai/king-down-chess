import { fromFen } from '../../src/rules/setup';
import { positionData } from '../../src/study/model';
import { describe, it, expect } from 'vitest';
import { exampleStudies } from '../../src/study/examples';
import { previewStudyMeasurements } from './study-measurements';
import { createMeasurementPlan, canonicalMeasurementJSON, type MeasurementRequest } from '../../src/study/measurement-plan';

const input = () => exampleStudies('test-engine')[0];
const request: MeasurementRequest = { recipe: 'activity', start: 'population', seed: 19, pairs: 2, depth: 1, pool: 'TTTTTTT' };
describe('study measurement previews', () => {
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
