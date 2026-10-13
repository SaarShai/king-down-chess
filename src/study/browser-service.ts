import { legalMoves, type Move } from '../rules/engine';
import { toLan } from '../rules/setup';
import { checkStudy, parseTest, type StudyReport, type StudyTest } from './check';
import { parseStudy, positionOf, withRules, type Study } from './model';
import { openStudy, type StudySnapshot } from './session';

export type StudyDocument = Study | StudyTest;
export interface StudyRequest { type: 'inspect' | 'play' | 'undo' | 'check'; document: unknown; lan?: string }
export interface StudyResult { document: StudyDocument; snapshot: StudySnapshot; moves: { lan: string; move: Move }[]; report?: StudyReport }
export function parseDocument(input: unknown): StudyDocument {
  return input && typeof input === 'object' && 'schema' in input && input.schema === 'kingdown-test/1'
    ? parseTest(input) : parseStudy(input);
}
export function studyOf(document: StudyDocument): Study { return document.schema === 'kingdown-test/1' ? document.study : document; }
export function service(request: StudyRequest, engine: string): StudyResult {
  const document = parseDocument(request.document), study = studyOf(document);
  const session = openStudy(study, engine);
  switch (request.type) {
    case 'inspect': break;
    case 'play': session.play(request.lan!); break;
    case 'undo':
      if (document.schema === 'kingdown-test/1' && document.checks.some(c => c.after > Math.max(0, study.actions.length - 1))) {
        throw new Error('Remove the check after the last action before undo.');
      }
      session.undo(); break;
    case 'check':
      if (document.schema !== 'kingdown-test/1') throw new Error('Add checks before running a test.');
      break;
    default: throw new Error('Unknown study request.');
  }
  study.actions = session.exportStudy().actions;
  const snapshot = session.snapshot();
  const moves = withRules(study.rules, () => {
    const position = positionOf(snapshot.position);
    return legalMoves(position).map(move => ({ lan: toLan(position, move), move })).filter(m => snapshot.legal.includes(m.lan));
  });
  return { document, snapshot, moves, ...(request.type === 'check' ? { report: checkStudy(document, engine) } : {}) };
}
