import { describe, expect, it } from 'vitest';
import { unknownContext } from '../balance/measurements';
import { exampleStudies } from './examples';
import { createMeasurementPlan } from './measurement-plan';
import { evidenceRelation, measurementSummary, parseEvidence, parseResearch, researchStatus } from './evidence';
import { service, studyOf, testOf, withChecks } from './browser-service';
import { loadStudies, saveStudyDocument } from './store';

function fixture() {
  const document = exampleStudies('source')[0]; document.study.actions = [];
  document.checks = document.checks.filter(c => c.after === 0); document.coverage[0].checks = document.checks.map(c => c.id);
  const definition = createMeasurementPlan(document, { recipe: 'activity', start: 'population', seed: 12, pairs: 2, depth: 1, pool: 'TTTTTTT' });
  const measurement = { id: 'old-worth', run: 'old', element: 'R', version: null, context: unknownContext(), measure: 'pawnWorth',
    value: 5.3, error: .4, errorKind: '95% interval half width', sample: 20, sampleUnit: 'arrangements', unit: 'pawns',
    validity: 'unverified', reasons: ['Raw source is not checked here.'], sources: ['old/report.md'], method: 'Paired worth' };
  return parseResearch({ schema: 'kingdown-research/1', document,
    plan: { definition, source: 'current-source', fingerprint: 'a'.repeat(64), games: 4, blocks: 2, measures: ['activity'], limits: ['Population only'],
      contexts: [{ sourceHash: 'current-source', specKey: 'key', specKeyVersion: 2, rules: document.study.rules, pool: 'TTTTTTT' }] },
    evidence: [{ schema: 'kingdown-evidence/1', source: { path: 'measurements.json', sha256: 'b'.repeat(64) }, measurements: [measurement], verification: 'measurement-export', approval: 'not-reviewed' }] });
}
describe('linked study evidence', () => {
  it('keeps historical validity, units, intervals and provenance without a balance pass', () => {
    const record = fixture(), m = record.evidence[0].measurements[0];
    expect(researchStatus(record)).toMatchObject({ plan: 'current', measurements: 1 });
    expect(evidenceRelation(record, m)).toContain('Historical evidence');
    expect(measurementSummary(m)).toContain('5.3 pawns ± 0.4');
    expect(measurementSummary(m)).toContain('20 arrangements · unverified');
    expect(parseResearch(JSON.parse(JSON.stringify(record)))).toEqual(record);
    const missing = parseResearch({ ...record, plan: null, evidence: [] });
    expect(researchStatus(missing)).toMatchObject({ plan: 'missing', measurements: 0 });
  });
  it('compares full source and settings, and refuses to bless a stale plan', () => {
    const record = fixture(), m = record.evidence[0].measurements[0], c = record.plan!.contexts[0];
    Object.assign(m.context, { flags: c.rules, flagsKind: 'full', stampSource: 'row', sourceHash: c.sourceHash, specKey: c.specKey, specKeyVersion: 2, pool: c.pool });
    expect(evidenceRelation(record, m)).toContain('unverified against the plan');
    delete m.context.specKeyVersion;
    expect(evidenceRelation(record, m)).toContain('Historical');
    for (const change of [(r: typeof record) => studyOf(r).rules.archerChecks = false,
      (r: typeof record) => { testOf(r)!.checks[0].label += ' changed'; }, (r: typeof record) => { studyOf(r).actions.push('Td4-e4'); }]) {
      const edited = structuredClone(record); change(edited);
      expect(researchStatus(edited).plan).toBe('stale');
    }
  });
  it('keeps the plan snapshot and fingerprint through save-only version changes', () => {
    const record = fixture(), original = structuredClone(record.plan);
    studyOf(record).parentVersion = studyOf(record).version;
    studyOf(record).version++;
    expect(researchStatus(record).plan).toBe('current');
    expect(record.plan).toEqual(original);
    studyOf(record).id += '-another-study';
    expect(researchStatus(record).plan).toBe('stale');
  });
  it('retains evidence through real play, undo, checks, save and reload', () => {
    const record = fixture(), played = service({ type: 'play', document: record, lan: 'Td4-e4' }, 'source').document;
    expect(played.schema).toBe('kingdown-research/1');
    if (played.schema !== 'kingdown-research/1') throw new Error('Missing research document');
    expect(researchStatus(played).plan).toBe('stale'); expect(played.evidence).toEqual(record.evidence);
    const undone = service({ type: 'undo', document: played }, 'source').document;
    expect(undone).toEqual(record);
    expect(service({ type: 'check', document: undone }, 'source').report?.status).toBe('passed');
    const changed = withChecks(record, [...testOf(record)!.checks, { id: 'new', kind: 'legal', label: 'A new check', after: 0, lan: 'Td4-e4', expected: true }]);
    expect(changed.schema === 'kingdown-research/1' && researchStatus(changed).plan).toBe('stale');
    let raw: string | null = null; const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; } };
    expect(saveStudyDocument(record, storage)).toEqual({ ok: true });
    expect(loadStudies(storage).documents).toEqual([record]);
  });
  it('rejects duplicate, malformed and unbounded evidence without changing its input', () => {
    const record = fixture(), evidence = record.evidence[0], before = structuredClone(record);
    expect(() => parseResearch({ ...record, evidence: [evidence, evidence] })).toThrow('Duplicate');
    expect(() => parseEvidence({ ...evidence, measurements: [] })).toThrow();
    expect(() => parseEvidence({ ...evidence, approval: 'approved' })).toThrow();
    expect(() => parseEvidence({ ...evidence, measurements: [{ ...evidence.measurements[0], interval: { low: 2, high: 1, kind: '95%' } }] })).toThrow();
    expect(() => parseEvidence({ ...evidence, source: { path: 'file', sha256: 'wrong' } })).toThrow();
    expect(record).toEqual(before);
  });
});
