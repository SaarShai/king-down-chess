import { z } from 'zod';
import { parseStudy, type PositionData, type Study } from './model';
import { openStudy, type StudySnapshot } from './session';

const text = z.string().min(1).max(2000);
const base = { id: text, label: text, after: z.number().int().min(0).max(1000) };
const fields = ['turn', 'halfmove', 'ply', 'move', 'used', 'marks', 'free', 'haste', 'rage', 'last', 'drawn', 'lost', 'waiting', 'castle', 'ep'] as const;
const factSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...base, kind: z.literal('legal'), lan: text, expected: z.boolean() }),
  z.strictObject({ ...base, kind: z.literal('piece'), square: z.number().int().min(0).max(63), expected: z.number().int().min(0).max(63) }),
  z.strictObject({ ...base, kind: z.literal('state'), field: z.enum(fields), expected: z.json() }),
  z.strictObject({ ...base, kind: z.literal('status'), expected: z.enum(['playing', 'checkmate', 'stalemate', 'draw50', 'drawRepetition', 'drawMaterial']) }),
]);
const coverageSchema = z.strictObject({
  id: text, items: z.array(text).min(1).max(10), state: z.enum(['tested', 'unsupported', 'untested']),
  reason: text, checks: z.array(text).max(500),
});
const challengeSchema = z.strictObject({
  goal: text, horizon: z.number().int().min(1).max(100),
  solutions: z.array(z.array(text).min(1).max(100)).min(1).max(20),
  difficulty: z.literal('unmeasured'), claim: z.literal('suggested'),
});
const testSchema = z.strictObject({
  schema: z.literal('kingdown-test/1'), study: z.unknown(), checks: z.array(factSchema).min(1).max(500),
  coverage: z.array(coverageSchema).min(1).max(100), challenge: challengeSchema.optional(),
});
export type Fact = z.infer<typeof factSchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type StudyTest = Omit<z.infer<typeof testSchema>, 'study'> & { study: Study };
export interface FactResult { id: string; label: string; after: number; passed: boolean; expected: unknown; actual: unknown }
export interface StateChange { field: keyof PositionData; before: unknown; after: unknown }
export interface StudyReport {
  status: 'passed' | 'failed' | 'invalid'; error?: string;
  facts: FactResult[];
  coverage: (Omit<Coverage, 'state'> & { state: 'passed' | 'failed' | 'unsupported' | 'untested' })[];
  trace: { after: number; action: string; changes: StateChange[] }[];
  challenge?: { claim: 'suggested'; difficulty: 'unmeasured'; legalLines: number };
}
function unique(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label} id`);
}
export function parseTest(input: unknown): StudyTest {
  if ((JSON.stringify(input)?.length ?? Infinity) > 1_000_000) throw new Error('Test size limit');
  const parsed = testSchema.parse(input);
  const test = { ...parsed, study: parseStudy(parsed.study) };
  unique(test.checks.map(c => c.id), 'check'); unique(test.coverage.map(c => c.id), 'coverage');
  if (test.checks.some(c => c.after > test.study.actions.length)) throw new Error('Check is past the last action');
  const ids = new Set(test.checks.map(c => c.id));
  for (const cell of test.coverage) {
    if (cell.checks.some(id => !ids.has(id))) throw new Error('Coverage names a missing check');
    if (cell.state === 'tested' ? !cell.checks.length : cell.checks.length) throw new Error('Coverage state and checks differ');
  }
  if (test.challenge?.solutions.some(line => line.length > test.challenge!.horizon)) throw new Error('Solution exceeds challenge horizon');
  return test;
}
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) => v && !Array.isArray(v) && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
}
function actual(f: Fact, snapshot: StudySnapshot): unknown {
  if (f.kind === 'legal') return snapshot.legal.includes(f.lan);
  if (f.kind === 'piece') return snapshot.position.board[f.square];
  if (f.kind === 'status') return snapshot.status;
  return snapshot.position[f.field] ?? null;
}
/** The trace reports observed state changes. It does not infer piece identity or rule causation. */
export function checkStudy(input: unknown, engine: string): StudyReport {
  try {
    const test = parseTest(input);
    const session = openStudy({ ...test.study, actions: [] }, engine);
    const report: StudyReport = { status: 'passed', facts: [], coverage: [], trace: [] };
    let before = session.snapshot();
    for (let after = 0; after <= test.study.actions.length; after++) {
      if (after) {
        const action = test.study.actions[after - 1], next = session.play(action);
        const keys = new Set([...Object.keys(before.position), ...Object.keys(next.position)] as (keyof PositionData)[]);
        const changes = [...keys].filter(k => canonical(before.position[k] ?? null) !== canonical(next.position[k] ?? null))
          .map(field => ({ field, before: before.position[field] ?? null, after: next.position[field] ?? null }));
        report.trace.push({ after, action, changes }); before = next;
      }
      for (const fact of test.checks.filter(f => f.after === after)) {
        const value = actual(fact, before);
        report.facts.push({ id: fact.id, label: fact.label, after, passed: canonical(value) === canonical(fact.expected), expected: fact.expected, actual: value });
      }
    }
    report.coverage = test.coverage.map(cell => ({ ...cell, state: cell.state === 'tested'
      ? cell.checks.every(id => report.facts.find(f => f.id === id)!.passed) ? 'passed' : 'failed' : cell.state }));
    if (test.challenge) {
      for (const line of test.challenge.solutions) {
        const branch = openStudy({ ...test.study, actions: [] }, engine);
        for (const lan of line) branch.play(lan);
      }
      report.challenge = { claim: 'suggested', difficulty: 'unmeasured', legalLines: test.challenge.solutions.length };
    }
    if (report.facts.some(f => !f.passed)) report.status = 'failed';
    return report;
  } catch (error) {
    return { status: 'invalid', error: error instanceof Error ? error.message : String(error), facts: [], coverage: [], trace: [] };
  }
}
