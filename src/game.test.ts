import { afterEach, describe, expect, it, vi } from 'vitest';
import { Engine, Game, resigningSide } from './game';
import { legalMoves, parseSq, setRules, RULES_2017, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, toFen, toLan } from './rules/setup';

/** Play the first legal move whose LAN matches, so the tests read like a score sheet. */
const play = (g: Game, ...lans: string[]): void => {
  for (const lan of lans) {
    const m = g.legal.find(x => toLan(g.pos, x) === lan);
    if (!m) throw new Error(`no legal move ${lan} in ${toFen(g.pos)}`);
    g.play(m);
  }
};

describe('Game history and undo', () => {
  it('reads the position after the last ply as well as earlier plies', () => {
    const g = new Game(CLASSIC_CHESS);
    play(g, 'e2-e4', 'e7-e5');
    expect(g.positionAfter(2)).toBe(g.pos);
    expect(g.positionAfter(1).board[parseSq('e7')]).not.toBe(0);
    expect(g.positionAfter(1).board[parseSq('e4')]).not.toBe(0);
  });
  it('undo on a fresh game reports nothing to take back', () => {
    const g = new Game(CLASSIC_CHESS);
    expect(g.undo()).toBe(false);
    expect(g.history).toHaveLength(0);
  });

  it('undo restores the exact position, turn and legal moves', () => {
    const g = new Game(CLASSIC_CHESS);
    const start = toFen(g.pos);
    const before = legalMoves(g.pos).length;
    play(g, 'e2-e4', 'e7-e5', 'Ng1-f3');
    expect(g.history).toHaveLength(3);
    expect(toFen(g.pos)).not.toBe(start);
    for (let i = 0; i < 3; i++) expect(g.undo()).toBe(true);
    expect(toFen(g.pos)).toBe(start);
    expect(g.pos.turn).toBe(0);
    expect(g.legal).toHaveLength(before);
    expect(g.history).toHaveLength(0);
    expect(g.undo()).toBe(false);
  });

  it('undo re-opens a game that ended in checkmate', () => {
    // Fool's mate; the mating move is the one taken back.
    const g = new Game(CLASSIC_CHESS);
    play(g, 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(g.status).toBe('checkmate');
    expect(g.undo()).toBe(true);
    expect(g.status).toBe('playing');
    expect(g.legal.length).toBeGreaterThan(0);
  });

  it('undo releases a threefold repetition draw and the draw returns on replay', () => {
    const g = new Game(CLASSIC_CHESS);
    const shuffle = ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'];
    play(g, ...shuffle, ...shuffle);
    expect(g.status).toBe('drawRepetition');
    expect(g.undo()).toBe(true);
    expect(g.status).toBe('playing');
    play(g, 'Nf6-g8');
    expect(g.status).toBe('drawRepetition');
  });

  it('undo keeps repetition counts honest: a taken-back visit is not counted', () => {
    const g = new Game(CLASSIC_CHESS);
    const shuffle = ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'];
    play(g, ...shuffle);
    play(g, 'Ng1-f3');
    g.undo(); // the second visit to the start position is undone, then made again
    play(g, 'Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8');
    expect(g.status).toBe('drawRepetition');
  });

  it('newGame clears the history and the repetition counts', () => {
    const g = new Game(CLASSIC_CHESS);
    const shuffle = ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'];
    play(g, ...shuffle, ...shuffle);
    expect(g.status).toBe('drawRepetition');
    g.newGame(CLASSIC_CHESS);
    expect(g.status).toBe('playing');
    expect(g.history).toHaveLength(0);
  });
});

describe('Game.playLan (autosave restore)', () => {

  it.each([
    ['Ogre push and promotion', '7k/P7/8/8/3p4/3O4/8/4K3 w - - 0 1', ['Od3>d4-d5', 'Kh8-h7', 'a7-a8=Q', 'Kh7-g7', 'Ke1-e2']],
    ['Archer shot', '7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1', ['Ac3*c5', 'Kh8-h7', 'Ac3-c4']],
    ['Maester swap', '7k/8/8/8/8/8/8/MN5K w - - 0 1', ['Ma1<>b1', 'Kh8-h7', 'Na1-c2']],
    ['Beast chain', 'k7/8/8/4r3/3p4/4S3/8/4K3 w - - 0 1', ['Se3xd4xe5']],
    ['Catapult lob', '8/8/4p3/8/4k3/8/4C3/7K w - - 0 1', ['Ce2*e6']],
    ['Paladin pawn survival', '8/8/3k4/4p3/4L3/8/8/4K3 w - - 0 1', ['Le4xe5']],
    ['Paladin self-removal', 'k7/8/8/8/8/8/3L2n1/K7 w - - 0 1', ['Ld2xg2']],
  ])('restores and undoes %s', (_name, fen, line) => {
    setRules();
    const original = new Game(); original.load(fromFen(fen));
    expect(original.playLan(line)).toBe(line.length);
    const restored = new Game(); restored.load(fromFen(fen));
    expect(restored.playLan(original.history.map(h => h.lan))).toBe(line.length);
    expect(toFen(restored.pos)).toBe(toFen(original.pos));
    expect(restored.status).toBe(original.status);
    for (const _ of line) expect(restored.undo()).toBe(true);
    expect(toFen(restored.pos)).toBe(fen);
    expect(restored.history).toHaveLength(0);
  });

  it('replays a saved move list back to the same position', () => {
    const g = new Game(CLASSIC_CHESS);
    play(g, 'e2-e4', 'c7-c5', 'Ng1-f3', 'd7-d6');
    const want = toFen(g.pos);
    const saved = g.history.map(h => h.lan);

    const restored = new Game(CLASSIC_CHESS);
    expect(restored.playLan(saved)).toBe(4);
    expect(toFen(restored.pos)).toBe(want);
    expect(restored.history.map(h => h.lan)).toEqual(saved);
  });

  it('stops at the first move that is not legal in the position', () => {
    const g = new Game(CLASSIC_CHESS);
    expect(g.playLan(['e2-e4', 'e7-e5', 'Qd1-d8', 'Ng1-f3'])).toBe(2);
    expect(g.history).toHaveLength(2);
    expect(g.status).toBe('playing');
  });

  it('replays fairy moves: an archer shot, a paladin that removes itself and a beast chain', () => {
    const FEN = '3r3k/8/2p3p1/5p2/A3S3/8/8/K2L4 w - - 0 1';
    const line = ['Ld1xd8', 'Kh8-h7', 'Aa4*c6', 'Kh7-h8', 'Se4xf5xg6'];
    const g = new Game();
    g.load(fromFen(FEN));
    expect(g.playLan(line)).toBe(5);
    expect(g.pos.board[parseSq('d8')]).toBe(0); // paladin took the rook, then left the board
    expect(g.pos.board[parseSq('d1')]).toBe(0);
    expect(g.pos.board[parseSq('c6')]).toBe(0); // shot from a distance; the archer never moved
    expect(g.pos.board[parseSq('a4')]).not.toBe(0);
    expect(g.pos.board[parseSq('f5')]).toBe(0); // both chain victims gone, beast on the last square
    expect(g.pos.board[parseSq('g6')]).not.toBe(0);
    expect(g.history.map(h => h.lan)).toEqual(line);

    for (let i = 0; i < 5; i++) expect(g.undo()).toBe(true);
    expect(toFen(g.pos)).toBe(FEN);
  });
});

describe('resigningSide', () => {
  it('against the computer resigns the person, on either turn', () => {
    for (const turn of [0, 1] as const) {
      expect(resigningSide(['human', 'ai'], turn, null)).toBe(0);
      expect(resigningSide(['ai', 'human'], turn, null)).toBe(1);
    }
  });

  it('two people on one device resign the side to move', () => {
    expect(resigningSide(['human', 'human'], 0, null)).toBe(0);
    expect(resigningSide(['human', 'human'], 1, null)).toBe(1);
  });

  it("a game link resigns this device's side, also on the friend's turn", () => {
    expect(resigningSide(['human', 'human'], 0, 1)).toBe(1);
    expect(resigningSide(['human', 'human'], 1, 0)).toBe(0);
  });

  it('nobody resigns when the computer plays both sides', () => {
    expect(resigningSide(['ai', 'ai'], 0, null)).toBeNull();
  });
});

/** Stands in for a real Worker: it records what it was sent and never answers. */
class FakeWorker {
  static made: FakeWorker[] = [];
  posted: unknown[] = [];
  terminated = false;
  constructor() { FakeWorker.made.push(this); }
  addEventListener(): void { /* the fake never fires one */ }
  removeEventListener(): void { /* ditto */ }
  postMessage(m: unknown): void { this.posted.push(m); }
  terminate(): void { this.terminated = true; }
}

describe('Engine.cancel', () => {
  const withWorkers = (fn: () => void): void => {
    const prev = (globalThis as Record<string, unknown>).Worker;
    (globalThis as Record<string, unknown>).Worker = FakeWorker;
    FakeWorker.made = [];
    try { fn(); } finally { (globalThis as Record<string, unknown>).Worker = prev; }
  };

  afterEach(() => { vi.useRealTimers(); });

  // Bug 1's engine half: after New game / Undo / Resign the search in flight must never answer,
  // or its move is played onto the position of a game that no longer exists.
  it('drops a cancelled search: its late result never resolves', async () => {
    const engine = new Engine(); // no Worker global here, so think() runs inline on a timer
    const g = new Game(CLASSIC_CHESS);
    let answered = false;
    void engine.think(g, { timeMs: 1 }).then(() => { answered = true; });
    engine.cancel();
    await new Promise(r => setTimeout(r, 120));
    expect(answered).toBe(false);
    const res = await engine.think(g, { timeMs: 1 }); // and the engine still works afterwards
    expect(res.move).toBeTruthy();
  });

  // Bug 3: the cancelled search's fallback timer used to null `this.worker`, which by then was the
  // replacement cancel() had just spawned — every later search then ran on the main thread.
  it('a cancelled search\'s fallback timer leaves the replacement worker alone', () => {
    withWorkers(() => {
      vi.useFakeTimers();
      const engine = new Engine();
      const g = new Game(CLASSIC_CHESS);
      void engine.think(g, { timeMs: 200 }); // the fake never replies
      engine.cancel();                           // terminates it; next think starts a replacement
      vi.advanceTimersByTime(10_000);            // the dead search's fallback fires
      void engine.think(g, { timeMs: 200 });
      expect(FakeWorker.made).toHaveLength(2);
      expect(FakeWorker.made[0].terminated).toBe(true);
      expect(FakeWorker.made[1].posted).toHaveLength(1); // still on the worker, not inline
    });
  });

  // The browser allows `?rules=2017|2021` and `?kings=…`; the board plays the variant, so the worker
  // must too. Sending it once at spawn is not enough: cancel() replaces the worker.
  it('sends the owned rules with every search, including to a replacement worker', () => {
    withWorkers(() => {
      vi.useFakeTimers();
      try {
        const engine = new Engine();
        const g = new Game(CLASSIC_CHESS, { paladinKamikaze: 'always' });
        setRules({ paladinKamikaze: 'never' });
        void engine.think(g, { timeMs: 200 });
        expect((FakeWorker.made[0].posted[0] as { rules: { paladinKamikaze?: string } }).rules.paladinKamikaze).toBe('always');
        engine.cancel();
        void engine.think(g, { timeMs: 200 });
        expect((FakeWorker.made[1].posted[0] as { rules: { paladinKamikaze?: string } }).rules.paladinKamikaze).toBe('always');
      } finally { setRules(); }
    });
  });

  it('reuses one worker within a game and replaces it for another game or a reset', () => {
    withWorkers(() => {
      vi.useFakeTimers();
      const engine = new Engine(), a = new Game(CLASSIC_CHESS), b = new Game(CLASSIC_CHESS, RULES_2017);
      void engine.think(a, { maxDepth: 3 });
      play(a, 'e2-e4');
      void engine.think(a, { maxDepth: 3 });
      expect(FakeWorker.made).toHaveLength(1);
      expect(FakeWorker.made[0].posted).toHaveLength(2);
      void engine.think(b, { maxDepth: 3 });
      expect(FakeWorker.made[0].terminated).toBe(true);
      expect(FakeWorker.made).toHaveLength(2);
      b.load(b.context.fromFen('7k/8/8/8/8/2A5/8/K7 w - - 0 1'));
      void engine.think(b, { maxDepth: 3 });
      expect(FakeWorker.made[1].terminated).toBe(true);
      expect(FakeWorker.made).toHaveLength(3);
      engine.cancel();
    });
  });

  it('captures the requested rules, position and options before inline work starts', async () => {
    const engine = new Engine(), game = new Game('RALSKMOG', RULES_2017);
    const position = structuredClone(game.pos), options = { maxDepth: 2, history: [] as number[] };
    const requested = engine.think(game, options, position);
    position.board.fill(0); options.history.push(123); options.maxDepth = 1;
    setRules();
    const result = await requested;
    expect(result.depth).toBe(2);
    expect(game.legal.some(move => toLan(game.pos, move) === toLan(game.pos, result.move!))).toBe(true);
    engine.cancel();
  });

  it('drops an inline result if its game is reset before the timer fires', async () => {
    const engine = new Engine(), game = new Game(CLASSIC_CHESS);
    let answered = false;
    void engine.think(game, { maxDepth: 1 }).then(() => { answered = true; });
    game.newGame(CLASSIC_CHESS);
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(answered).toBe(false);
    engine.cancel();
  });

  it('drops a cancelled inline search after its lazy module import starts', async () => {
    let release!: () => void, started!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const loading = new Promise<void>(resolve => { started = resolve; });
    const searchOwned = vi.fn(() => ({ move: null, score: 0, depth: 0, nodes: 0 }));
    vi.doMock('./ai/search', async () => { started(); await held; return { searchOwned }; });
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const { Engine: FreshEngine, Game: FreshGame } = await import('./game');
      const engine = new FreshEngine(), game = new FreshGame(CLASSIC_CHESS);
      let answered = false;
      void engine.think(game, { maxDepth: 1 }).then(() => { answered = true; });
      vi.advanceTimersByTime(30);
      await loading;
      engine.cancel();
      release();
      await vi.dynamicImportSettled();
      expect(searchOwned).not.toHaveBeenCalled();
      expect(answered).toBe(false);
    } finally { release(); vi.doUnmock('./ai/search'); vi.resetModules(); vi.useRealTimers(); }
  });

  // The page does not load the evaluation (and its net) at start, so the inline search sets the
  // adopted evaluator itself, in both entries: no worker at all, and a worker that stops replying.
  it('sets the residual evaluator before each inline search', async () => {
    const calls: string[] = [];
    const setEvaluator = vi.fn((e: string) => { calls.push(`setEvaluator:${e}`); });
    const searchOwned = vi.fn(() => { calls.push('searchOwned'); return { move: null, score: 0, depth: 0, nodes: 0 }; });
    vi.doMock('./ai/search', () => ({ searchOwned, setEvaluator }));
    vi.resetModules();
    try {
      const { Engine: FreshEngine, Game: FreshGame } = await import('./game');
      await new FreshEngine().think(new FreshGame(CLASSIC_CHESS), { maxDepth: 1 }); // no Worker global
      expect(calls).toEqual(['setEvaluator:residual', 'searchOwned']);

      calls.length = 0;
      const prev = (globalThis as Record<string, unknown>).Worker;
      (globalThis as Record<string, unknown>).Worker = FakeWorker;
      FakeWorker.made = [];
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        const answer = new FreshEngine().think(new FreshGame(CLASSIC_CHESS), { timeMs: 1 });
        expect(FakeWorker.made[0].posted).toHaveLength(1);
        vi.advanceTimersByTime(1 + 2500); // the fake never replies: the fallback searches inline
        await answer;
        expect(FakeWorker.made[0].terminated).toBe(true);
        expect(calls).toEqual(['setEvaluator:residual', 'searchOwned']);
      } finally { (globalThis as Record<string, unknown>).Worker = prev; vi.useRealTimers(); }
    } finally { vi.doUnmock('./ai/search'); vi.resetModules(); }
  });

  it('plays an inline search with the residual net', async () => {
    const { evaluatorName, setEvaluator } = await import('./ai/eval');
    setEvaluator('linear');
    try {
      const engine = new Engine(), game = new Game(CLASSIC_CHESS);
      const result = await engine.think(game, { maxDepth: 1 });
      expect(result.move).toBeTruthy();
      expect(evaluatorName()).toBe('residual');
    } finally { setEvaluator('linear'); }
  });

  it('refuses a callback before starting game search', () => {
    const engine = new Engine(), game = new Game(CLASSIC_CHESS);
    const rng = vi.fn(() => 0.5);
    expect(() => engine.think(game, { maxDepth: 1, rng } as { maxDepth: number })).toThrow('callbacks');
    expect(rng).not.toHaveBeenCalled();
  });
});

describe('Game owns its definition', () => {
  afterEach(() => setRules());

  it('copies nested configuration and keeps it fixed through another game and ambient edits', () => {
    const input: Partial<Rules> = { hands: [['Freeze'], []], fromMove: { Freeze: 2 } };
    const a = new Game(CLASSIC_CHESS, input);
    (input.hands![0] as string[]).push('Haste');
    (input.fromMove as { Freeze: number }).Freeze = 9;
    const b = new Game(CLASSIC_CHESS, RULES_2017);
    const before = a.legal;
    setRules(RULES_2017);
    b.playLan(['e2-e4']);
    expect(a.rules.hands[0]).toEqual(['Freeze']);
    expect(a.rules.fromMove.Freeze).toBe(2);
    expect(() => (a.rules.hands[0] as string[]).push('Haste')).toThrow();
    expect(a.legal).toEqual(before);
  });

  it('rejects an invalid reset without changing the accepted game', () => {
    const game = new Game(CLASSIC_CHESS);
    play(game, 'e2-e4');
    const before = { fen: toFen(game.pos), identity: game.identity, context: game.context, history: [...game.history] };
    expect(() => game.newGame(CLASSIC_CHESS, { hands: [['Haste'], []], kings: [{ king: 'Flame', power: 'Haste' }, null] })).toThrow('hand');
    expect(toFen(game.pos)).toBe(before.fen);
    expect(game.identity).toBe(before.identity);
    expect(game.context).toBe(before.context);
    expect(game.history).toEqual(before.history);
  });
});
