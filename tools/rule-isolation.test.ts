// U04: exercise the production game-owned boundary with the existing continuation corpus.
import { afterEach, describe, expect, it } from 'vitest';
import { Game } from '../src/game';
import { GameRules } from '../src/game-rules';
import { DEFAULT_RULES, POWERS_BALANCED, RULES, RULES_2017, parseKings, setRules, type Rules } from '../src/rules/rules';
import { parseSq, type Move } from '../src/rules/engine';
import { toFen } from '../src/rules/setup';
import { resetSearchState, searchOwned } from '../src/ai/search';
import { setDesignValue, VALUES } from '../src/ai/eval';
import { draftTurn, applyLan } from '../src/plugin/screens/board-model';
import { PRESETS, specOf } from '../src/workshop/model';
import { CARD_CASES, ORDINARY_CASES } from './fixtures/engine-continuation';

function owned(rules: Partial<Rules>, fen: string) {
  const game = new Game('RNBQKBNR', rules), context = game.context;
  game.load(context.fromFen(fen));
  return {
    view: () => ({ fen: toFen(game.pos), status: game.status, check: game.inCheck,
      legal: game.legal.map(m => context.toLan(game.pos, m)).sort(), draft: draftTurn([], game.pos, 'link', game.pos.turn, context),
      key: context.positionKey(game.pos) }),
    play: (lan: string) => game.playLan([lan]),
    undo: () => game.undo(),
    preview: (lan: string) => applyLan(game.pos, lan, game.rules),
    setup: () => toFen(context.startPosition('RNBQKBNR')),
  };
}

afterEach(() => { setRules(structuredClone(DEFAULT_RULES)); setDesignValue(null); resetSearchState(); });

describe('U04 production rule ownership', () => {
  it('keeps cached and uncached Game helpers under their owning rules after interleaving', () => {
    const fen = '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1';
    const a = new Game('RNBQKBNR', DEFAULT_RULES); a.load(a.context.fromFen(fen));
    const current = a.legal.map(m => a.context.toLan(a.pos, m));
    setRules(RULES_2017);
    const b = new Game('RNBQKBNR', RULES_2017); b.load(b.context.fromFen(fen));
    expect(b.legal.map(m => b.context.toLan(b.pos, m))).not.toEqual(current);
    expect(a.legal.map(m => a.context.toLan(a.pos, m))).toEqual(current);
    expect(a.context.legalMoves(a.pos).map(m => a.context.toLan(a.pos, m))).toEqual(current);
    const before = structuredClone(RULES);
    expect(a.playLan(['Ac3-b2'])).toBe(1);
    a.undo();
    expect(a.legal.map(m => a.context.toLan(a.pos, m))).toEqual(current);
    expect(RULES).toEqual(before);
  });

  it('owns deep immutable definitions and restores rules after validation, nested calls and helper errors', () => {
    const input: Partial<Rules> = { hands: [['Freeze'], []], fromMove: { Freeze: 3 } };
    const a = new GameRules(input), b = new GameRules({ freezeUses: 5, design: specOf(PRESETS.find(p => p.key === 'rook')!) });
    expect('scoped' in a).toBe(false);
    expect('withRules' in a).toBe(false);
    (input.hands![0] as string[]).push('Haste');
    expect(a.rules.hands[0]).toEqual(['Freeze']);
    expect(() => (a.rules.fromMove as { Freeze: number }).Freeze = 1).toThrow();
    const before = structuredClone(RULES), values = { ...VALUES };
    expect(() => new GameRules({ hands: [['Haste'], []], kings: [{ king: 'Flame', power: 'Haste' }, null] })).toThrow('hand');
    expect(RULES).toEqual(before);
    const pos = a.fromFen('7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1'), out: Move[] = [];
    out.push = () => {
      expect(RULES).toEqual(a.rules);
      b.legalMoves(pos);
      expect(RULES).toEqual(a.rules);
      throw new Error('nested helper');
    };
    expect(() => a.genPiece(pos.board, parseSq('c3'), 'all', out)).toThrow('nested helper');
    expect(RULES).toEqual(before);
    expect(() => searchOwned({}, b.rules, pos, { get maxDepth(): number { throw new Error('search options'); } })).toThrow('search options');
    expect(RULES).toEqual(before);
    expect(VALUES).toEqual(values);
  });

  it.each([...ORDINARY_CASES, ...CARD_CASES])('alternates and independently replays existing corpus: $name', row => {
    const context = new GameRules({ ...(row.setup.kings ? POWERS_BALANCED : {}), kings: row.setup.kings ? parseKings(row.setup.kings) : [null, null],
      hands: [row.setup.hand ?? [], row.setup.hand ?? []] });
    const fen = row.setup.fen ?? toFen(context.startPosition('RNBQKBNR'));
    const a = owned(context.rules, fen), replay = owned(context.rules, fen);
    const b = owned(RULES_2017, '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1');
    for (const lan of row.actions) {
      const before = a.view();
      expect(a.preview(lan)).toBeDefined();
      expect(a.view()).toEqual(before);
      b.view(); b.setup();
      expect(a.play(lan)).toBe(1);
      expect(replay.play(lan)).toBe(1);
      expect(a.view()).toEqual(replay.view());
      const continued = a.view();
      expect(a.undo()).toBe(true);
      expect(a.view()).toEqual(before);
      expect(a.play(lan)).toBe(1);
      expect(a.view()).toEqual(continued);
    }
    if (row.status) expect(a.view().status).toBe(row.status);
  });
});
