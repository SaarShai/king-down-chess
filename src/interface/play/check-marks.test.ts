import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED } from '../../rules/rules';
import { parseSq, type Move, type Position } from '../../rules/engine';
import type { PlainMarks } from '../../render/plain-marks';
import { actorMarks, mergeMarks, previewMarks, resultMarks, stateMarks } from './marks';

const filename = new URL(process.env.KINGDOWN_CHECK_MARKS_SOURCE ?? './main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['drawMarks', 'animate', 'newCheck'].includes(node.id?.name ?? ''));
// Run the play screen's real board marks and move playback with a recording board.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;
const rules = new GameRules({ ...POWERS_BALANCED, kings: [null, null] });

function screen(pos: Position, { ended = false, rules: context = rules } = {}) {
  const noop = () => {}, marks: PlainMarks[] = [], checks: string[] = [];
  const draft = { chain: false, captures: [], targets: () => [], options: () => [], armedMoves: [], at: () => [[]], now: pos, position: pos, open: false };
  const scope: Record<string, unknown> = {
    board: { select: noop, mark: (m: PlainMarks) => marks.push(m), setPosition: noop, play: (_: Move, _after: Position, land?: () => void) => { land?.(); return new Promise<void>(() => {}); } },
    arrangement: undefined, ended, draft, selected: null, thinking: false, playingAction: null, nextMarksAt: 0, performance: { now: () => 0 },
    game: { pos, context }, actorMarks, previewMarks, mergeMarks, resultMarks, stateMarks, isDirect: () => true, markFocus: undefined,
    routeLine: () => '', stateDescriptions: () => [], player: 0, cpu: () => 1, detail: { querySelector: () => null }, cells: [], lastActions: [], checkPulse: null,
    checkShown: false, cancelCheckPulse: noop, endSeal: noop, beat: undefined, casting: undefined, castBeat: noop, refuse: noop,
    finalCheckCue: (p: Position) => checks.push(`cue ${p.turn}`), drawCheckIn: (p: Position) => checks.push(`draw ${p.turn}`),
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  return { scope, marks, checks };
}

it('a finished checkmate (reload or History) keeps the check square and its threat line', () => {
  const pos = rules.fromFen('6Qk/8/6K1/8/8/8/8/8 b - - 0 1'), { scope, marks } = screen(pos, { ended: true });
  (scope.drawMarks as () => void)();
  expect(marks.at(-1)).toMatchObject({ check: parseSq('h8'), threats: [expect.objectContaining({ sq: parseSq('g8') })] });
});

it('a king that steps out of check takes its line and square away when the move lands', () => {
  const before = rules.fromFen('4r2k/8/8/8/8/8/8/4K3 w - - 0 1');
  const move = rules.legalMoves(before).find(m => m.from === parseSq('e1') && m.to === parseSq('d1'))!;
  const { scope, marks } = screen(before);
  void (scope.animate as (b: Position, m: Move, a: Position) => Promise<unknown>)(before, move, rules.makeMove(before, move));
  expect(marks.at(-1)?.check).toBeUndefined();
  expect(marks.at(-1)?.threats).toBeUndefined();
});

it('Haste: a first move that checks the side that does not move draws its line in', () => {
  const haste = new GameRules({ ...POWERS_BALANCED, kings: [{ king: 'Flame', power: 'Haste' }, null] }), before = haste.fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');
  const move = haste.legalMoves(before).find(m => m.from === parseSq('a1') && m.to === parseSq('a8') && m.power === 'haste')!;
  const after = haste.makeMove(before, move), { scope, marks, checks } = screen(before, { rules: haste });
  void (scope.animate as (b: Position, m: Move, a: Position) => Promise<unknown>)(before, move, after);
  expect(checks).toEqual(['draw 0']);
  expect(marks.at(-1)?.check).toBe(parseSq('e8'));
});
