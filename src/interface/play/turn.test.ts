import { expect, it } from 'vitest';
import { Game } from '../../game';
import { armKey, DraftTurn, isDirect } from './turn';
import { parseSq } from '../../rules/engine';
import { POWERS_BALANCED, type Rules } from '../../rules/rules';

function setup(fen = '7k/8/8/8/8/8/P7/K7 w - - 0 1') {
  const game = new Game('RNBQKBNR'); game.load(game.context.fromFen(fen)); return { game, draft: new DraftTurn(game) };
}
it('keeps a move private, then commits it once and removes Undo', () => {
  const { game, draft } = setup(), from = parseSq('a2'), to = parseSq('a3');
  expect(draft.canFinish).toBe(false);
  expect(() => draft.commit()).toThrow();
  const move = draft.at(from, to)[0]; draft.stage(move);
  expect(game.history).toHaveLength(0); expect(game.pos.board[from]).toBeTruthy();
  expect(draft.position.board[to]).toBeTruthy(); expect(draft.canFinish).toBe(true);
  expect(draft.options(from)).toEqual([]);
  draft.commit(); draft.undo(); expect(game.history).toHaveLength(1); expect(game.pos.turn).toBe(1);
  expect(() => draft.stage(move)).toThrow(); expect(draft.canFinish).toBe(false);
});
it('Undo restores the exact position and all legal actions', () => {
  const { game, draft } = setup(); const before = structuredClone(game.pos), moves = game.legal;
  draft.stage(moves[0]); draft.undo();
  expect(draft.position).toEqual(before); expect(game.legal).toBe(moves); expect(draft.length).toBe(0);
});
it('shows every legal Ogre action at a shared target', () => {
  const { draft } = setup('7k/8/8/4p3/3O4/8/8/K7 w - - 0 1');
  const options = draft.at(parseSq('d4'), parseSq('e5'));
  expect(options.some(m => m.shove)).toBe(true); expect(options.some(m => m.captures.length)).toBe(true);
  const push = options.find(m => m.shove)!; draft.stage(push);
  expect(draft.position.board[parseSq('f6')]).toBeTruthy(); expect(draft.canFinish).toBe(true);
});
it('takes a Beast chain one capture at a time and enables each engine-approved stop', () => {
  const { game, draft } = setup('7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1');
  const source = parseSq('d4'); draft.bite(source, parseSq('e5'));
  expect(draft.canFinish).toBe(true); expect(draft.targets(source)).toContain(parseSq('f6'));
  draft.bite(source, parseSq('f6')); expect(draft.length).toBe(2); expect(draft.canFinish).toBe(true);
  expect(game.pos.board[parseSq('e5')]).toBeTruthy();
  draft.undo(); expect(draft.length).toBe(1); expect(draft.position.board[parseSq('f6')]).toBeTruthy();
  draft.commit(); expect(game.history[0].move.captures).toEqual([parseSq('e5')]);
});
it('does not invent a legal stop when the chain must continue to protect the king', () => {
  const { draft } = setup('7k/8/8/r7/1p6/S7/8/K7 w - - 0 1');
  const source = parseSq('a3'), first = parseSq('b4'), second = parseSq('a5');
  expect(draft.at(source, first).length).toBeGreaterThan(0);
  draft.bite(source, first); expect(draft.canFinish).toBe(false); expect(() => draft.commit()).toThrow();
  expect(draft.targets(source)).toContain(second); draft.bite(source, second); expect(draft.canFinish).toBe(true);
});
it('keeps all promotion choices and stages mate until finish', () => {
  const { game, draft } = setup('7k/P7/8/8/8/8/8/K7 w - - 0 1');
  expect(draft.at(48,56).length).toBeGreaterThan(1);
  const mate = setup('7k/8/5KQ1/8/8/8/8/8 w - - 0 1');
  const move = mate.game.legal.find(m => mate.game.context.status(mate.game.context.makeMove(mate.game.pos, m)) === 'checkmate')!;
  expect(move).toBeTruthy(); mate.draft.stage(move);
  expect(mate.game.status).toBe('playing'); expect(mate.draft.canFinish).toBe(true);
  mate.draft.commit(); expect(mate.game.status).toBe('checkmate'); expect(game.history).toHaveLength(0);
});

function powered(fen: string, rules: Partial<Rules>) {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, ...rules }); game.load(game.context.fromFen(fen)); return { game, draft: new DraftTurn(game) };
}
it('arms a power with one tap and cancels it with a second tap', () => {
  const { draft } = powered('7k/7p/n7/8/8/8/7P/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  expect(draft.options(parseSq('a1')).some(m => m.power)).toBe(false);
  draft.arm('freeze'); expect(draft.armed).toBe('freeze');
  expect(draft.armedMoves.map(m => m.from).sort()).toEqual([parseSq('a6'), parseSq('h7')]);
  draft.arm('freeze'); expect(draft.armed).toBeNull(); expect(draft.length).toBe(0);
  expect(() => draft.arm('haste')).toThrow();
});
it('stages a Freeze at the target tap, allows End turn, and Undo restores the use', () => {
  const { game, draft } = powered('7k/7p/n7/8/8/8/7P/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  draft.arm('freeze'); const [freeze] = draft.at(parseSq('a6'), parseSq('a6')); expect(isDirect(freeze)).toBe(true);
  draft.stage(freeze); expect(draft.armed).toBeNull();
  expect(draft.position.marks?.[0]?.sq).toBe(parseSq('a6')); expect(draft.position.used?.[0]).toBe(1);
  expect(draft.canFinish).toBe(true); expect(draft.open).toBe(true);
  expect(game.history).toHaveLength(0);
  draft.undo(); expect(draft.length).toBe(0); expect(draft.position.used?.[0] ?? 0).toBe(0); expect(draft.armable('freeze')).toBe(true);
  draft.arm('freeze'); draft.stage(draft.at(parseSq('a6'), parseSq('a6'))[0]);
  const played = draft.commit(); expect(played.at(-1)!.pass).toBe(true); expect(game.pos.turn).toBe(1);
});
it('stops a Haste turn after its first move or takes the optional second move', () => {
  const rules = { kings: [{ king: 'Flame', power: 'Haste' }, null] } as Partial<Rules>, fen = '7k/7p/8/8/8/8/7P/KN6 w - - 0 1';
  const early = powered(fen, rules);
  early.draft.arm('haste'); early.draft.stage(early.draft.at(parseSq('b1'), parseSq('c3'))[0]);
  expect(early.draft.canFinish).toBe(true); expect(early.draft.open).toBe(true);
  expect(early.draft.targets(parseSq('c3')).length).toBeGreaterThan(0);
  expect(early.draft.commit().map(m => !!m.pass)).toEqual([false, true]); expect(early.game.pos.turn).toBe(1);
  const full = powered(fen, rules);
  full.draft.arm('haste'); full.draft.stage(full.draft.at(parseSq('b1'), parseSq('c3'))[0]);
  full.draft.stage(full.draft.at(parseSq('c3'), parseSq('d5'))[0]);
  expect(full.draft.length).toBe(2); expect(full.draft.open).toBe(false); expect(full.draft.canFinish).toBe(true);
  full.draft.undo(); expect(full.draft.length).toBe(1); expect(full.draft.position.board[parseSq('c3')]).toBeTruthy();
  full.draft.undo(); expect(full.draft.length).toBe(0); expect(full.draft.position.board[parseSq('b1')]).toBeTruthy();
});
it('spends a card through the draft only', () => {
  const { game, draft } = powered('7k/7p/8/3n4/8/8/7P/K7 w - - 0 1', { kings: [null, null], hands: [['Curse'], ['Curse']] });
  draft.arm('curse'); const [curse] = draft.options(parseSq('d5')); expect(curse.power).toBe('curse');
  draft.stage(curse); expect(draft.position.used?.[0]).toBe(1); expect(draft.canFinish).toBe(true);
  expect(game.pos.used?.[0] ?? 0).toBe(0);
  draft.undo(); expect(draft.position.used?.[0] ?? 0).toBe(0);
});
it('Sky Lift selects either piece of a pair first and stages the one engine action (rules-round page 1)', () => {
  const fen = '4k3/8/5N2/8/8/8/8/1R2K3 w - - 0 1', b1 = parseSq('b1'), f6 = parseSq('f6');
  for (const card of ['skylift', 'mirrorb']) {
    const engine = powered(fen, { kings: [null, null], hands: [['SkyLift', 'MirrorB'], []] }).draft;
    engine.arm(card); const [one] = engine.armedMoves.filter(m => m.swap); expect([one.from, one.to]).toEqual([b1, f6]);
    for (const [first, second] of [[b1, f6], [f6, b1]]) {
      const { draft } = powered(fen, { kings: [null, null], hands: [['SkyLift', 'MirrorB'], []] });
      draft.arm(card);
      expect(draft.armedMoves.some(m => m.from === first)).toBe(true);
      expect(draft.targets(first)).toEqual([second]);
      const [move] = draft.at(first, second); draft.stage(move);
      expect(draft.steps[0].move).toBe(draft.game.legal.find(m => m.swap && armKey(m) === card));
      expect(draft.game.context.toLan(draft.game.pos, draft.steps[0].move)).toBe(engine.game.context.toLan(engine.game.pos, one));
    }
  }
});
it('a Maester swap keeps its one direction', () => {
  const { draft } = powered('4k3/8/8/8/8/8/8/1M2K3 w - - 0 1', { kings: [null, null], hands: [[], []] });
  expect(draft.targets(parseSq('b1'))).toContain(parseSq('e1')); expect(draft.targets(parseSq('e1'))).not.toContain(parseSq('b1'));
});
it('a free action or a Haste step that reaches the 50-move draw ends the turn there (rules-round page 2)', () => {
  for (const [king, power, fen, from, to] of [['Frost', 'Freeze', '4k3/r7/8/8/8/8/P7/4K3 w - - 99 60', 'a7', 'a7'], ['Frost', 'IceWall', '4k3/r7/8/8/8/8/P6N/4K3 w - - 99 60', 'h2', 'h2'], ['Flame', 'Haste', '4k3/r7/8/8/8/8/P7/4K2N w - - 99 60', 'h1', 'g3']] as const) {
    const { game, draft } = powered(fen, { kings: [{ king, power }, null] });
    draft.arm(power === 'IceWall' ? 'ward' : power.toLowerCase()); draft.stage(draft.at(parseSq(from), parseSq(to))[0]);
    expect(game.context.status(draft.now)).toBe('draw50');
    expect(draft.open).toBe(false); expect(draft.options(parseSq('a2'))).toEqual([]);
    expect(() => draft.stage(draft.legal.find(m => m.from === parseSq('a2'))!)).toThrow();
    expect(draft.canFinish).toBe(true);
    expect(draft.commit().map(m => !!m.pass)).toEqual([false]);
    expect(game.status).toBe('draw50'); expect(game.pos.halfmove).toBe(100);
  }
});
