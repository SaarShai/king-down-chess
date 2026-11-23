import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import { parseSq, type Move, type Position } from '../../rules/engine';
import { POWERS_BALANCED } from '../../rules/rules';
import { castOf } from './cast';

const filename = new URL('./main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['animate', 'castBeat', 'skipBoard', 'closeStaleDialogs', 'undo'].includes(node.id?.name ?? ''));
// Run the play screen's real move playback, board skip, game end and Undo with a recording effect layer.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;

const rules = new GameRules({ ...POWERS_BALANCED, kings: [null, null], hands: [['SkyLift', 'Haste'], []] });
const before = rules.fromFen('4k3/8/8/8/8/8/8/R1B1K3 w - - 0 1');
const lift = rules.legalMoves(before).find(m => m.power === 'skylift')!;
const haste = rules.legalMoves(before).find(m => m.power === 'haste' && m.from === parseSq('a1'))!;

function screen({ hidden = false } = {}) {
  const noop = () => {}, cancel = vi.fn(), cells = Array.from({ length: 64 }, (_, i) => ({ square: i }));
  const castIn = vi.fn(() => ({ cancel, finish: noop }));
    const draft = { length: 1, steps: [{ before, move: lift }], previewMove: undefined, chain: false, open: false, now: before, position: before, undo: noop };
  const scope: Record<string, unknown> = {
    document: { hidden }, castIn, castOf, cells, detail: { querySelectorAll: () => [] }, nodes: { title: {} }, casting: undefined,
    board: { setPosition: noop, skip: noop, play: (_m: Move, _a: Position, land?: () => void) => { land?.(); return new Promise<void>(() => {}); } },
    game: { context: { inCheck: () => false } }, newCheck: () => false, nextMarksAt: 0, checkShown: false, cancelCheckPulse: noop, playingAction: null,
    endSeal: noop, beat: undefined, rewind: undefined, boardReplay: { cancel: noop }, endCardFlight: noop, endReply: null, drawMarks: noop, refuse: noop,
    gameDialog: undefined, resignDialog: undefined, draft, thinking: false, ended: false, onlineActive: false, writer: { blocked: false }, gameHelp: undefined,
    clearChoice: noop, shown: null, resources: [], selected: null, inspected: null, notice: '', lastActions: [], save: noop, update: noop, announce: noop,
    text: {}, cue: noop, pulse: noop, edgeLight: noop, controls: { undo: { querySelector: () => null } }, tween: noop, ease: {}, reducedMotion: () => true, colorOf: () => 0,
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  const animate = (m: Move, from = before) => { void (scope.animate as (b: Position, m: Move, a: Position) => Promise<unknown>)(from, m, rules.makeMove(from, m)); };
  return { scope, castIn, cancel, animate };
}

it('the caster sees the beat of the card family at the landing, at the squares the card changes', () => {
  const { castIn, animate } = screen();
  animate(lift);
  expect(castIn).toHaveBeenCalledOnce();
  expect(castIn).toHaveBeenCalledWith('trade', [{ square: lift.from }, { square: lift.to }], expect.any(Function));
  animate(rules.legalMoves(before).find(m => !m.power)!);
  expect(castIn).toHaveBeenCalledOnce();
});

it('a board tap, a reply and the game end clear the beat at once', () => {
  for (const end of ['tap', 'reply', 'game end'] as const) {
    const { scope, cancel, animate } = screen();
    animate(lift);
    if (end === 'tap') (scope.skipBoard as () => void)();
    else if (end === 'reply') animate(rules.legalMoves(before).find(m => !m.power)!);
    else (scope.closeStaleDialogs as () => void)();
    expect(cancel, end).toHaveBeenCalled();
  }
});

it('Undo of a card clears its beat and plays none', () => {
  const { scope, castIn, cancel, animate } = screen();
  animate(lift);
  (scope.undo as () => void)();
  expect(cancel).toHaveBeenCalledOnce();
  expect(castIn).toHaveBeenCalledOnce();
});

it('a hidden page plays no beat', () => {
  const { castIn, animate } = screen({ hidden: true });
  animate(lift);
  expect(castIn).not.toHaveBeenCalled();
});

it('Haste: the card beat plays at the first move only; the second move clears it', () => {
  const { castIn, cancel, animate } = screen();
  animate(haste);
  expect(castIn).toHaveBeenCalledWith('shift', [{ square: haste.from }, { square: haste.to }], expect.any(Function));
  const hasted = rules.makeMove(before, haste), second = rules.legalMoves(hasted).find(m => !m.pass)!;
  expect(second.power).toBeUndefined();
  animate(second, hasted);
  expect(castIn).toHaveBeenCalledOnce();
  expect(cancel).toHaveBeenCalled();
});
