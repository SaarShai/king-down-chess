import { legalMoves, type Move } from '../rules/engine';
import { toLan } from '../rules/setup';
import { checkStudy, parseTest, type Fact, type Coverage, type StudyReport, type StudyTest } from './check';
import { positionOf, withRules, type Study } from './model';
import { openStudy, type StudySnapshot } from './session';
import { parseResearch, parseStudyInput, type ResearchDocument, type StudyInput } from './evidence';

export type StudyDocument = StudyInput | ResearchDocument;
export interface StudyRequest { type: 'inspect' | 'play' | 'undo' | 'check'; document: unknown; lan?: string }
export interface StudyResult { document: StudyDocument; snapshot: StudySnapshot; moves: { lan: string; move: Move }[]; report?: StudyReport }
export function parseDocument(input: unknown): StudyDocument {
  return input && typeof input === 'object' && 'schema' in input && input.schema === 'kingdown-research/1'
    ? parseResearch(input) : parseStudyInput(input);
}
export function baseDocument(document: StudyDocument): StudyInput { return document.schema === 'kingdown-research/1' ? document.document : document; }
export function studyOf(document: StudyDocument): Study { const d = baseDocument(document); return d.schema === 'kingdown-test/1' ? d.study : d; }
export function testOf(document: StudyDocument): StudyTest | null { const d = baseDocument(document); return d.schema === 'kingdown-test/1' ? d : null; }
/** Edit assertions without discarding challenge or coverage evidence. */
export function withChecks(document: StudyInput, checks: Fact[]): StudyTest;
export function withChecks(document: StudyDocument, checks: Fact[]): StudyDocument;
export function withChecks(document: StudyDocument, checks: Fact[]): StudyDocument {
  if (!checks.length) throw new Error('Add another check before removing the last check.');
  const previous = testOf(document);
  const ids = new Set(checks.map(c => c.id));
  const coverage: Coverage[] = (previous?.coverage ?? []).map(cell => {
    const kept = cell.checks.filter(id => ids.has(id));
    return { ...cell, checks: kept, state: cell.state === 'tested' && !kept.length ? 'untested' : cell.state };
  });
  const assigned = new Set(coverage.flatMap(cell => cell.checks));
  const added = checks.filter(c => !assigned.has(c.id));
  if (added.length) {
    let id = 'declared';
    while (coverage.some(cell => cell.id === id)) id += '-new';
    coverage.push({ id, items: ['designer assertions'], state: 'tested', reason: 'Declared checks at a saved position.', checks: added.map(c => c.id) });
  }
  const changed = parseTest({ schema: 'kingdown-test/1', study: studyOf(document), checks, coverage,
    ...(previous?.challenge ? { challenge: previous.challenge } : {}) });
  return document.schema === 'kingdown-research/1' ? parseResearch({ ...document, document: changed }) : changed;
}
export function service(request: StudyRequest, engine: string): StudyResult {
  const document = parseDocument(request.document), study = studyOf(document), test = testOf(document);
  const session = openStudy(study, engine);
  switch (request.type) {
    case 'inspect': break;
    case 'play': session.play(request.lan!); break;
    case 'undo':
      if (test?.checks.some(c => c.after > Math.max(0, study.actions.length - 1))) {
        throw new Error('Remove the check after the last action before undo.');
      }
      session.undo(); break;
    case 'check':
      if (!test) throw new Error('Add checks before running a test.');
      break;
    default: throw new Error('Unknown study request.');
  }
  study.actions = session.exportStudy().actions;
  const snapshot = session.snapshot();
  const moves = withRules(study.rules, () => {
    const position = positionOf(snapshot.position);
    return legalMoves(position).map(move => ({ lan: toLan(position, move), move })).filter(m => snapshot.legal.includes(m.lan));
  });
  return { document, snapshot, moves, ...(request.type === 'check' ? { report: checkStudy(test, engine) } : {}) };
}
