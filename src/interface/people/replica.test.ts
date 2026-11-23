import { expect, it } from 'vitest';
import { Game } from '../../game';
import type { LoggedCommand, View } from '../../match/protocol';
import { parseSq } from '../../rules/engine';
import { POWERS_BALANCED, type Rules } from '../../rules/rules';
import { toFen } from '../../rules/setup';
import { DraftTurn } from '../play/turn';
import { lastTurnOf, playCommands, replicaOf, restage, turnActions } from './replica';

function setup(fen: string, rules: Partial<Rules> = {}) {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, ...rules }); game.load(game.context.fromFen(fen)); return { game, draft: new DraftTurn(game) };
}
/** The LANs that `commit()` plays, on a second copy of the same game. */
function committed(fen: string, rules: Partial<Rules>, act: (draft: DraftTurn) => void): string[] {
  const { game, draft } = setup(fen, rules); act(draft);
  const start = game.history.length; draft.commit();
  return game.history.slice(start).map(ply => ply.lan);
}
const HASTE = { kings: [{ king: 'Flame', power: 'Haste' }, null] } as Partial<Rules>;

it('gives the same turn actions as commit, with no change to the game', () => {
  const cases: [string, Partial<Rules>, (draft: DraftTurn) => void][] = [
    ['7k/8/8/8/8/8/P7/K7 w - - 0 1', {}, d => d.stage(d.at(parseSq('a2'), parseSq('a3'))[0])],
    ['7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE, d => { d.arm('haste'); d.stage(d.at(parseSq('b1'), parseSq('c3'))[0]); }],
    ['7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE, d => { d.arm('haste'); d.stage(d.at(parseSq('b1'), parseSq('c3'))[0]); d.stage(d.at(parseSq('c3'), parseSq('d5'))[0]); }],
    ['7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1', {}, d => { d.bite(parseSq('d4'), parseSq('e5')); d.bite(parseSq('d4'), parseSq('f6')); }],
    ['7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1', {}, d => d.bite(parseSq('d4'), parseSq('e5'))],
  ];
  for (const [fen, rules, act] of cases) {
    const { game, draft } = setup(fen, rules); act(draft);
    const before = toFen(game.pos), lans = turnActions(draft);
    expect(lans).toEqual(committed(fen, rules, act));
    expect(toFen(game.pos)).toBe(before); expect(game.history).toHaveLength(0);
  }
  // A Haste turn after one move ends with the pass.
  expect(committed(cases[1][0], HASTE, cases[1][2]).at(-1)).toBe('--');
  expect(turnActions(setup('7k/8/8/8/8/8/P7/K7 w - - 0 1').draft)).toBeUndefined();
});

it('stages moves again only while they are legal', () => {
  const { draft } = setup('7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE);
  draft.arm('haste'); draft.stage(draft.at(parseSq('b1'), parseSq('c3'))[0]);
  const lans = draft.steps.map(s => draft.game.context.toLan(s.before, s.move));
  const again = new DraftTurn(draft.game); expect(restage(again, lans)).toBe(true); expect(again.length).toBe(1);
  expect(restage(new DraftTurn(draft.game), ['a1a8'])).toBe(false);
});

function viewOf(game: Game, initial: string, actions: string[], extra: Partial<View> = {}): View {
  return { game_id: 'g', revision: actions.length, seat: 0, fen: toFen(game.pos), rules: game.rules, history: { initial_fen: initial, actions }, last_commands: [], status: 'playing', action: 'ready', turn: game.pos.turn, ...extra } as unknown as View;
}

it('builds the copy from the history and refuses a copy that does not reach the view FEN', () => {
  const initial = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', { game } = setup(initial);
  game.play(game.legal.find(m => m.from === parseSq('e2') && m.to === parseSq('e3'))!); expect(game.history).toHaveLength(1);
  const lans = game.history.map(h => h.lan), view = viewOf(game, initial, lans);
  expect(toFen(replicaOf(view)!.pos)).toBe(view.fen);
  expect(replicaOf({ ...view, fen: initial })).toBeUndefined();
  expect(replicaOf({ ...view, history: undefined })).toBeUndefined();
});

it.each([[10, 11, 'playing'], [99, 100, 'draw50']] as const)('restores the opponent turn after an archived Maester pawn swap at count %i', (before, after, status) => {
  const initial = `7k/8/8/8/3P4/3M4/8/K7 w - - ${before} 50`, { game } = setup(initial);
  const actions = ['Md3<>d4'];
  const view = viewOf(game, initial, actions, {
    engine_fingerprint: 'sha256:3643657990973c8678d687f60f1ff630b5cf6046183b19673094d62db38916bf',
    fen: `7k/8/8/8/3M4/3P4/8/K7 b - - ${after} 50`, status: status === 'draw50' ? 'finished' : 'playing', turn: 1, seat: 1,
    last_commands: [{ seq: 1, seat: 0, at: 'a', action: { type: 'turn', actions } }],
  });
  const copy = replicaOf(view);
  expect(copy).toBeDefined();
  expect(toFen(copy!.pos)).toBe(view.fen);
  expect(copy!.status).toBe(status);
  expect(lastTurnOf(copy!, view)?.steps.map(step => step.lan)).toEqual(actions);
});

it('plays new commands in order and refuses a gap or another FEN', () => {
  const initial = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';
  const server = setup(initial).game, local = setup(initial).game;
  const e3 = server.legal.find(m => m.from === parseSq('e2') && m.to === parseSq('e3'))!; const lan = server.context.toLan(server.pos, e3); server.play(e3);
  const commands: LoggedCommand[] = [{ seq: 1, seat: 1, action: { type: 'draw', choice: 'offer' }, at: 'a' }, { seq: 2, seat: 0, action: { type: 'turn', actions: [lan] }, at: 'b' }];
  const next = { revision: 2, fen: toFen(server.pos), last_commands: commands } as unknown as View;
  expect(playCommands(setup(initial).game, 0, { ...next, last_commands: [commands[1]] })).toBeUndefined();
  expect(playCommands(setup(initial).game, 0, { ...next, fen: initial })).toBeUndefined();
  const turns = playCommands(local, 0, next)!;
  expect(turns).toHaveLength(1); expect(turns[0]).toMatchObject({ seq: 2, seat: 0 }); expect(turns[0].steps.map(s => s.lan)).toEqual([lan]);
  expect(toFen(local.pos)).toBe(next.fen);
});

it('finds the opponent turn at the end of the history', () => {
  const initial = '4k3/4p3/8/8/8/8/4P3/4K3 w - - 0 1', { game } = setup(initial);
  game.playLan([game.context.toLan(game.pos, game.legal.find(m => m.from === parseSq('e2') && m.to === parseSq('e3'))!)]);
  game.playLan([game.context.toLan(game.pos, game.legal.find(m => m.from === parseSq('e7') && m.to === parseSq('e6'))!)]);
  const lans = game.history.map(h => h.lan);
  const commands: LoggedCommand[] = [{ seq: 1, seat: 0, action: { type: 'turn', actions: [lans[0]] }, at: 'a' }, { seq: 2, seat: 1, action: { type: 'turn', actions: [lans[1]] }, at: 'b' }, { seq: 3, seat: 1, action: { type: 'draw', choice: 'offer' }, at: 'c' }];
  const turn = lastTurnOf(game, viewOf(game, initial, lans, { seat: 0, last_commands: commands }))!;
  expect(turn).toMatchObject({ seq: 2, at: 'b' }); expect(turn.steps.map(s => s.lan)).toEqual([lans[1]]);
  expect(toFen(turn.steps[0].after)).toBe(toFen(game.pos));
  expect(lastTurnOf(game, viewOf(game, initial, lans, { seat: 1, last_commands: commands }))).toBeUndefined();
});
