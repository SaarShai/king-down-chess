import { afterEach, describe, expect, it, vi } from 'vitest';
import { RELEASED_CARDS } from '../../../content/cards';
import { Game } from '../../../game';
import { GameRules } from '../../../game-rules';
import { ALWAYS_ON } from '../../../match/setup';
import { B, BUILT, N, POWERS_BALANCED, Q, R, parseSq, type PieceType, type Rules } from '../../../rules/engine';
import { diagramFor } from '../learning-diagrams';
import { learningEntry, type LearnSubject } from '../learning';
import { pieces, powerLines, text } from '../texts';
import { DraftTurn } from '../turn';
import { alwaysOnLabel, helpTopic } from './content';
import { hintLines, resetHints, startHints, type Hint } from './hints';
import { promotionChoices } from './promotion';
import { refusalReason } from './reasons';

const subjects: LearnSubject[] = [
  ...Object.keys(pieces).map(type => ({ kind: 'piece' as const, type: Number(type) as PieceType })),
  ...RELEASED_CARDS.map(card => ({ kind: 'card' as const, id: card.id })),
  ...BUILT.map(id => ({ kind: 'power' as const, id })),
];
describe('Daylight topics', () => {
  const rules = new GameRules();
  it.each(subjects)('uses the game line and has a legal example for %j', subject => {
    const entry = learningEntry(subject, rules);
    const expected = subject.kind === 'piece' ? pieces[subject.type].short : powerLines[subject.id];
    expect(expected).toBeTruthy();
    expect(helpTopic(subject, rules)).toMatchObject({ name: entry.name, line: expected, detail: entry.full });
    for (const side of [0, 1] as const) expect(diagramFor(subject, side).frames.length).toBeGreaterThan(0);
  });

  it('reads the live game text when a power changes a piece', () => {
    const rules = new GameRules({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null] });
    const subject: LearnSubject = { kind: 'piece', type: 1 };
    expect(helpTopic(subject, rules).line).toBe(learningEntry(subject, rules).short);
    expect(helpTopic(subject, rules).line).not.toBe(pieces[1].short);
  });

  it('uses the setup list for the always-on badge', () => {
    for (const id of BUILT) {
      const label = ALWAYS_ON.includes(id) ? text.alwaysOnShort : '';
      expect(alwaysOnLabel(id)).toBe(label);
      expect(helpTopic({ kind: 'power', id }).badge).toBe(label);
    }
    expect(helpTopic({ kind: 'card', id: 'March' }).badge).toBe('');
  });
});

const sq = parseSq;
function draftAt(fen: string, rules?: Partial<Rules>) {
  const game = new Game('RNBQKBNR', rules);
  game.load(game.context.fromFen(fen));
  return new DraftTurn(game);
}

describe('Refused taps', () => {
  const board = (draft: DraftTurn, target: string, source?: string) => refusalReason({ draft, player: 0 }, {
    kind: 'board', square: sq(target), source: source ? sq(source) : null,
  });
  const card = (draft: DraftTurn, index = 0, key = 'freeze') => refusalReason({ draft, player: 0 }, { kind: 'card', index, key });

  it('checks the turn and the preview before a move', () => {
    const draft = draftAt('4k3/8/8/8/8/8/P7/4K3 w - - 0 5');
    const tap = { kind: 'board', square: sq('a2'), source: null } as const;
    expect(refusalReason({ draft, player: 1 }, tap)?.code).toBe('not-your-turn');
    expect(refusalReason({ draft, player: 0, inputLocked: true }, tap)?.code).toBe('not-your-turn');
    expect(refusalReason({ draft, player: 0, previewBlocked: true }, tap)?.code).toBe('not-in-preview');
    expect(refusalReason({ draft, player: 0 }, tap)).toBeNull();
  });

  it('recognizes a frozen piece and follows the legal Freeze targets', () => {
    const draft = draftAt('4k3/7r/8/8/8/8/R7/4K3 b - - 0 5', { ...POWERS_BALANCED, hands: [['Freeze'], ['Freeze']] });
    draft.stage(draft.legal.find(m => m.power === 'freeze' && m.from === sq('a2'))!);
    draft.commit();
    expect(draft.options(sq('a2'))).toHaveLength(0);
    expect(board(draft, 'a2')?.code).toBe('frozen');
    draft.arm('freeze');
    expect(board(draft, 'e8')?.line).toBe('Not the king.');
    expect(board(draft, 'e1')?.line).toBe('Choose an enemy piece.');
    expect(board(draft, 'h7')).toBeNull();
    const mark = draft.game.context.makeMove(draft.now, draft.armedMoves.find(m => m.from === sq('h7'))!);
    draft.game.load({ ...draft.now, marks: mark.marks });
    expect(draft.armedMoves.some(move => move.from === sq('h7'))).toBe(true);
    expect(board(draft, 'h7')).toBeNull();
  });

  it('tells a blocked piece from a legal move or an enemy selection', () => {
    const draft = draftAt('4k3/8/p7/P7/8/8/8/4K3 w - - 0 5');
    expect(board(draft, 'a5')?.code).toBe('no-moves');
    expect(board(draft, 'a6')?.code).toBe('not-yours');
    expect(board(draft, 'e2', 'e1')).toBeNull();
    expect(refusalReason({ draft, player: 0 }, { kind: 'end' })?.code).toBe('no-moves');
    draft.stage(draft.at(sq('e1'), sq('e2'))[0]);
    expect(refusalReason({ draft, player: 0 }, { kind: 'end' })).toBeNull();
  });

  it('leaves a legal check reply alone and refuses Freeze and unsafe moves', () => {
    const draft = draftAt('k3r3/8/8/8/8/8/P7/4K3 w - - 0 5', { ...POWERS_BALANCED, hands: [['Freeze'], []] });
    expect(draft.game.inCheck).toBe(true);
    expect(board(draft, 'a2')?.code).toBe('in-check');
    expect(board(draft, 'd1', 'e1')).toBeNull();
    expect(card(draft)).toMatchObject({ code: 'in-check', line: 'Freeze cannot stop a check.' });
    const pinned = draftAt('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 5');
    expect(pinned.game.inCheck).toBe(false);
    expect(board(pinned, 'd2', 'e2')?.code).toBe('in-check');
  });

  it('refuses a Guard capture by a Rook and allows a King capture', () => {
    const draft = draftAt('4k3/8/8/8/g7/8/R7/1K6 w - - 0 5');
    expect(draft.at(sq('a2'), sq('a4'))).toHaveLength(0);
    expect(board(draft, 'a4', 'a2')?.code).toBe('guard');
    const king = draftAt('4k3/8/8/8/g7/1K6/R7/8 w - - 0 5');
    expect(board(king, 'a4', 'b3')).toBeNull();
  });

  it('reads a spent card and the staged card slot, and recovers on Undo', () => {
    const draft = draftAt('4k3/7r/8/8/8/8/R7/4K3 w - - 0 5', { ...POWERS_BALANCED, hands: [['Freeze', 'IceWall'], []] });
    expect(card(draft)).toBeNull();
    draft.stage(draft.legal.find(m => m.power === 'freeze')!);
    expect(card(draft, 1, 'ward')).toMatchObject({ code: 'card-used', line: 'You played Freeze. Undo to play a card.' });
    draft.undo();
    expect(card(draft, 1, 'ward')).toBeNull();
    draft.stage(draft.at(sq('a2'), sq('a3'))[0]);
    expect(card(draft)).toMatchObject({ code: 'card-used', line: 'You moved. Undo to play a card.' });
    draft.undo();
    const spent = draft.game.context.makeMove(draft.now, draft.legal.find(m => m.power === 'freeze')!);
    draft.game.load({ ...draft.now, used: spent.used });
    expect(card(draft)).toMatchObject({ code: 'card-used', line: 'You used this card.' });
  });
});

describe('First-game hints', () => {
  afterEach(() => { resetHints(); vi.unstubAllGlobals(); });
  it('shows each hint once, saves the flag, and allows a reset', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key), setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
    expect(startHints(false).take('piece')).toBeNull();
    const hints = startHints(true);
    for (const hint of Object.keys(hintLines) as Hint[]) {
      expect(hints.take(hint)).toBe(hintLines[hint]);
      expect(hints.take(hint)).toBeNull();
    }
    expect(data.get('daylight.hints')).toBe('1');
    expect(startHints(true).take('piece')).toBeNull();
    expect(resetHints()).toBe(true);
    expect(startHints(true).take('piece')).toBe(hintLines.piece);
  });

  it('honors an existing flag and works for the visit when storage fails', () => {
    vi.stubGlobal('localStorage', { getItem: () => '1' });
    expect(startHints(true).take('piece')).toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Blocked'); } });
    expect(startHints(true).take('piece')).toBe(hintLines.piece);
    expect(startHints(true).take('ring')).toBeNull();
    expect(resetHints()).toBe(false);
    expect(startHints(true).take('ring')).toBe(hintLines.ring);
  });
});

it('passes the four legal promotion moves through in engine order', () => {
  const draft = draftAt('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 5');
  for (const target of ['a8', 'b8']) {
    const moves = draft.at(sq('a7'), sq(target));
    const choices = promotionChoices(moves);
    expect(choices.map(choice => choice.type)).toEqual([Q, R, B, N]);
    expect(choices.map(choice => choice.name)).toEqual(['Queen', 'Rook', 'Bishop', 'Knight']);
    choices.forEach((choice, index) => expect(choice.move).toBe(moves[index]));
  }
  expect(promotionChoices(draft.at(sq('e1'), sq('e2')))).toEqual([]);
});
