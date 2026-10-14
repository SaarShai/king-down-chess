import { z } from 'zod';
import { stable, type Measurement } from '../balance/measurements';
import { parseStudy, type Study } from './model';
import { parseTest, type StudyTest } from './check';
import { parseMeasurementPlan } from './measurement-plan';

const text = z.string().min(1).max(10000);
export const MAX_STUDY_BYTES = 1024 * 1024;
const nullableText = text.nullable();
const jsonObject = z.record(z.string(), z.json());
export const measurementSchema = z.strictObject({
  id: text, run: text, element: text, version: nullableText,
  context: z.strictObject({
    flags: jsonObject.nullable(), flagsKind: z.enum(['full', 'diff', 'unknown']), commit: nullableText,
    commitSource: z.enum(['row', 'spec', 'override', 'queue']).optional(), stampSource: z.enum(['row', 'derived']).optional(),
    sourceArchiveSha256: text.optional(), sourceHash: nullableText, specKey: nullableText, specKeyVersion: z.number().int().optional(),
    pool: nullableText, depth: z.number().nullable(), machine: nullableText, settings: jsonObject.nullable(),
    variantScope: z.enum(['none', 'matchup', 'mixed', 'unknown']), population: z.enum(['run', 'field', 'mirror', 'report']),
  }),
  measure: z.enum(['whiteScore', 'score', 'drawRate', 'meanPlies', 'meanTurns', 'relativeLengthChange', 'pawnWorth', 'worthDifference', 'elo', 'activity']),
  value: z.number().nullable(), error: z.number().nonnegative().nullable(), errorKind: nullableText,
  sample: z.number().int().nonnegative().nullable(), sampleUnit: z.enum(['games', 'pairs', 'arrangements', 'openings', 'unknown']),
  unit: text, validity: z.enum(['valid', 'pending', 'incomplete', 'void', 'conflict', 'unverified']),
  // A conflict export can retain one audit reason per game. File and store byte limits bound it.
  reasons: z.array(text), sources: z.array(text).min(1).max(100), method: text,
  bound: z.enum(['lessThan', 'greaterThan']).optional(), reference: text.optional(), denominator: text.optional(), criterion: text.optional(),
  comparison: z.strictObject({ baseRun: text, variantRun: text, kind: z.enum(['paired', 'with-without']) }).optional(),
  calibration: z.strictObject({ eloPerPawn: z.number(), relativeError: z.number().nullable() }).optional(),
  interval: z.strictObject({ low: z.number(), high: z.number(), kind: text }).refine(v => v.low <= v.high, 'Interval bounds are reversed.').optional(),
});
const evidenceSchema = z.strictObject({
  schema: z.literal('kingdown-evidence/1'),
  source: z.strictObject({ path: text, sha256: z.string().regex(/^[a-f0-9]{64}$/) }),
  measurements: z.array(measurementSchema).min(1).max(500),
  // This is an export of existing measurements, not a new raw-game audit or an adoption decision.
  verification: z.literal('measurement-export'), approval: z.literal('not-reviewed'),
});
export type MeasurementEvidence = z.infer<typeof evidenceSchema>;
export type StudyInput = Study | StudyTest;
const savedPlanSchema = z.strictObject({
  definition: z.unknown(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), source: text,
  games: z.number().int().positive(), blocks: z.number().int().positive(),
  measures: z.array(text), limits: z.array(text),
  contexts: z.array(z.strictObject({ sourceHash: text, specKey: text, specKeyVersion: z.literal(2), rules: jsonObject, pool: text })).min(1).max(20000),
});
export function parseSavedPlan(input: unknown) {
  const plan = savedPlanSchema.parse(input);
  return { ...plan, definition: parseMeasurementPlan(plan.definition) };
}
export type SavedMeasurementPlan = ReturnType<typeof parseSavedPlan>;
export interface ResearchDocument {
  schema: 'kingdown-research/1'; document: StudyInput; plan: SavedMeasurementPlan | null; evidence: MeasurementEvidence[];
}
export function parseStudyInput(input: unknown): StudyInput {
  return input && typeof input === 'object' && 'schema' in input && input.schema === 'kingdown-test/1' ? parseTest(input) : parseStudy(input);
}
export function parseEvidence(input: unknown): MeasurementEvidence {
  const evidence = evidenceSchema.parse(input);
  if (new Set(evidence.measurements.map(m => m.id)).size !== evidence.measurements.length) throw new Error('Duplicate measurement ID.');
  return evidence;
}
export function parseResearch(input: unknown): ResearchDocument {
  const record = z.strictObject({ schema: z.literal('kingdown-research/1'), document: z.unknown(), plan: z.unknown().nullable(), evidence: z.array(z.unknown()).max(20) }).parse(input);
  const evidence = record.evidence.map(parseEvidence);
  const ids = evidence.flatMap(e => e.measurements.map(m => m.id));
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate linked measurement ID.');
  return { ...record, document: parseStudyInput(record.document), plan: record.plan === null ? null : parseSavedPlan(record.plan), evidence };
}
export function researchStatus(record: ResearchDocument): { plan: 'missing' | 'current' | 'stale'; measurements: number; limits: string[] } {
  const content = (input: StudyInput): string => {
    const copy = structuredClone(input), study = copy.schema === 'kingdown-test/1' ? copy.study : copy;
    // A save adds a version. Keep the plan's original snapshot and fingerprint intact.
    study.version = 1; study.parentVersion = null;
    return stable(copy);
  };
  return {
    plan: !record.plan ? 'missing' : content(record.document) === content(record.plan.definition.input) ? 'current' : 'stale',
    measurements: record.evidence.reduce((n, e) => n + e.measurements.length, 0),
    limits: ['Measurements retain their original rules, source, policy and population.', 'Plan status compares study content and checks. Save version numbers do not change that content. Source and full settings require regenerated plan verification.', 'An imported result is related evidence, not proof for this design or position.', 'No raw games are audited in the browser. No rule adoption or balance pass is implied.'],
  };
}
export function evidenceRelation(record: ResearchDocument, measurement: Measurement): string {
  if (researchStatus(record).plan !== 'current') return 'Historical evidence · no current plan';
  const c = measurement.context;
  const match = c.flagsKind === 'full' && c.stampSource === 'row' && c.specKeyVersion === 2 &&
    record.plan!.contexts.some(p => p.sourceHash === c.sourceHash && p.specKey === c.specKey && p.pool === c.pool && stable(p.rules) === stable(c.flags));
  return match ? 'Imported context keys match · unverified against the plan' : 'Historical evidence · source or settings do not match';
}
/** Keep unknown and invalid evidence visible; do not convert it into a current pass. */
export function measurementSummary(m: Measurement): string {
  const value = m.value === null ? 'missing' : String(m.value);
  const interval = m.interval ? ` [${m.interval.low}, ${m.interval.high}] (${m.interval.kind})` : m.error !== null ? ` ± ${m.error} (${m.errorKind ?? 'error type unknown'})` : ' · no interval';
  return `${m.element} · ${m.criterion ?? m.measure}: ${m.bound === 'lessThan' ? '< ' : m.bound === 'greaterThan' ? '> ' : ''}${value} ${m.unit}${interval} · ${m.sample ?? 'unknown'} ${m.sampleUnit} · ${m.validity}`;
}
