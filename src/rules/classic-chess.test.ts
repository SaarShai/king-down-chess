import { afterEach, describe, expect, it } from 'vitest';
import { Move, Position, legalMoves, makeMove, parseSq, perft } from './engine';
import { POWERS_BALANCED, RULES, setRules } from './rules';
import { CLASSIC_CHESS, fromFen, startPosition, toFen, toLan } from './setup';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { describeMove } from '../move-text';
import { Game } from '../game';

afterEach(() => setRules());

const classic = (more = {}) => setRules({ classicChess: true, ...more });
const lans = (pos: Position) => legalMoves(pos).map(m => toLan(pos, m)).sort();
const play = (pos: Position, ...seq: string[]): Position => seq.reduce((p, lan) => {
  const m = legalMoves(p).find(x => toLan(p, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(p)}`);
  return makeMove(p, m);
}, pos);
const find = (pos: Position, lan: string): Move => legalMoves(pos).find(m => toLan(pos, m) === lan)!;

/** The Chess Programming Wiki perft page: each position and its published counts from depth 1. */
const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
const PERFT: [string, number[]][] = [
  ['start', [20, 400, 8902, 197281, 4865609]],
  [KIWIPETE, [48, 2039, 97862, 4085603]],
  ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238, 674624]],
  ['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467, 422333]],
  ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379, 2103487]],
];

describe('classic chess (classicChess): perft', () => {
  for (const [fen, counts] of PERFT) it(`${fen === 'start' ? 'the start position' : fen} gives the published counts`, () => {
    classic();
    const pos = fen === 'start' ? startPosition(CLASSIC_CHESS) : fromFen(fen);
    expect(counts.map((_, d) => perft(pos, d + 1))).toEqual(counts);
  }, 60_000);

  it('with the flag off, the FEN fields are ignored and nothing castles', () => {
    const pos = fromFen(KIWIPETE);
    expect(pos.castle).toBeUndefined();
    expect(toFen(pos)).toBe('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w - - 0 1');
    expect(lans(pos)).not.toContain('O-O');
    expect(startPosition(CLASSIC_CHESS).castle).toBeUndefined();
  });
});

describe('classic chess: castling', () => {
  it('starts with all four rights and writes them in the FEN', () => {
    classic();
    expect(toFen(startPosition(CLASSIC_CHESS))).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(toFen(fromFen(KIWIPETE))).toBe(KIWIPETE);
  });

  it('is refused through an attacked square and out of check, and allowed on the other side', () => {
    classic();
    expect(lans(fromFen('4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1'))).toEqual(expect.arrayContaining(['O-O-O']));
    expect(lans(fromFen('4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1'))).not.toContain('O-O');
    const check = lans(fromFen('4r1k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'));
    expect(check).not.toContain('O-O');
    expect(check).not.toContain('O-O-O');
    // b1 may be attacked on the long side: only the king's squares count.
    expect(lans(fromFen('1r2k3/8/8/8/8/8/8/R3K3 w Q - 0 1'))).toContain('O-O-O');
  });

  it('moves the rook too', () => {
    classic();
    const after = makeMove(fromFen(KIWIPETE), find(fromFen(KIWIPETE), 'O-O'));
    expect(toFen(after)).toBe('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R4RK1 b kq - 1 1');
  });

  it('ends a right when the king or the rook moves, or the rook is taken', () => {
    classic();
    const start = fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(toFen(play(start, 'Ke1-e2', 'Ke8-e7', 'Ke2-e1', 'Ke7-e8')).split(' ')[2]).toBe('-');
    expect(toFen(play(start, 'Rh1-h2', 'Ra8-a7')).split(' ')[2]).toBe('Qk');
    expect(toFen(play(start, 'Rh1xh8')).split(' ')[2]).toBe('Qq');
    expect(lans(play(start, 'Rh1-h2', 'Ra8-a7', 'Rh2-h1', 'Ra7-a8'))).not.toContain('O-O');
  });

  it('ends a right when a maester swaps the rook, and it does not come back', () => {
    classic();
    const pos = fromFen('4k3/8/8/8/8/8/6M1/R3K2R w KQ - 0 1');
    const swap = legalMoves(pos).find(m => m.swap && m.from === parseSq('g2') && m.to === parseSq('h1'))!;
    const after = makeMove(pos, swap);
    expect(after.castle).toBe(2);
    expect(toFen(after).split(' ')[2]).toBe('Q');
  });

  it('a frozen rook does not castle', () => {
    classic({ ...POWERS_BALANCED, kings: [null, { king: 'Frost', power: 'Freeze' }] });
    const pos = fromFen('4k3/8/8/8/8/8/8/R3K2R b KQ - 0 1');
    const freeze = legalMoves(pos).find(m => m.power === 'freeze' && m.to === parseSq('h1'))!;
    const done = legalMoves(makeMove(pos, freeze)).find(m => !m.power)!;
    const after = makeMove(makeMove(pos, freeze), done);
    expect(lans(after)).not.toContain('O-O');
    expect(lans(after)).toContain('O-O-O');
  });

  it('positions that differ only in their rights are not the same position', () => {
    classic();
    expect(positionKey(fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'))).not.toBe(positionKey(fromFen('r3k2r/8/8/8/8/8/8/R3K2R w Qkq - 0 1')));
    const game = new Game(CLASSIC_CHESS, RULES);
    game.load(fromFen('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'));
    const before = positionKey(game.pos);
    for (const l of ['Ke1-e2', 'Ke8-e7', 'Ke2-e1', 'Ke7-e8']) game.play(game.legal.find(m => toLan(game.pos, m) === l)!);
    expect(toFen(game.pos).split(' ')[0]).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR');
    expect(positionKey(game.pos)).not.toBe(before);
  });
});

describe('classic chess: castling has its own move text', () => {
  const KINGS_STEP2 = [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }] as const;
  for (const king of KINGS_STEP2) it(`is O-O and O-O-O, apart from a ${king.power} king's two-square step`, () => {
    classic({ ...POWERS_BALANCED, kings: [king, null] });
    const pos = fromFen('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1'), all = lans(pos);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toEqual(expect.arrayContaining(['O-O', 'O-O-O', 'Ke1-g1']));
    expect(toFen(makeMove(pos, find(pos, 'O-O'))).split(' ')[0]).toBe('4k3/8/8/8/8/8/8/R4RK1');
    expect(toFen(makeMove(pos, find(pos, 'Ke1-g1'))).split(' ')[0]).toBe('4k3/8/8/8/8/8/8/R5KR');
    // The search lists the same moves by the same text.
    expect(searchLegal(pos).map(m => toLan(pos, m)).sort()).toEqual(all);
    // An autosave restore (Game.playLan) castles, and does not take the king's step.
    const game = new Game(CLASSIC_CHESS, RULES);
    game.load(pos);
    expect(game.playLan(['O-O', 'Ke8-d8', 'Rf1-f2'])).toBe(3);
    expect(toFen(game.pos).split(' ')[0]).toBe('3k4/8/8/8/8/8/5R2/R5K1');
  });

  it('a Death Touch shot from the king square and an Earth Quake on it keep the rights', () => {
    classic({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'DeathTouch' }, null] });
    const shot = fromFen('4k3/8/8/8/8/4n3/8/R3K2R w KQ - 0 1');
    const m = legalMoves(shot).find(x => x.from === parseSq('e1') && x.to === parseSq('e1') && x.captures[0] === parseSq('e3'))!;
    expect(m).toBeDefined();
    expect(makeMove(shot, m).castle).toBe(3);
    classic({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null], hands: [['EarthQuake'], []] });
    const quake = fromFen('4k3/8/8/8/8/8/3P2P1/R3K2R w KQ - 0 1');
    for (const centre of ['e1', 'h1']) {
      const q = legalMoves(quake).find(x => x.power === 'quake' && x.from === parseSq(centre))!;
      expect(q, centre).toBeDefined();
      expect(makeMove(quake, q).castle, centre).toBe(3);
    }
  });

  it('a morph of the rook on its square ends that right', () => {
    classic({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null], hands: [['Morph'], []] });
    const pos = fromFen('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
    const morph = legalMoves(pos).find(x => x.power === 'morph' && x.from === parseSq('h1'))!;
    expect(morph).toBeDefined();
    expect(makeMove(pos, morph).castle).toBe(2);
  });

  it('threefold repetition counts a position only with the same rights', () => {
    classic();
    const loop = ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'];
    const kept = new Game(CLASSIC_CHESS, RULES);
    kept.playLan([...loop, ...loop]);
    expect(kept.status).toBe('drawRepetition');
    // The kings walk once: the position after e4 e5 comes back with no rights, so it counts anew; with the rights left out of the key, the first loop would draw.
    const lost = new Game(CLASSIC_CHESS, RULES);
    lost.playLan(['e2-e4', 'e7-e5', 'Ke1-e2', 'Ke8-e7', 'Ke2-e1', 'Ke7-e8']);
    expect(lost.history).toHaveLength(6);
    lost.playLan(loop);
    expect(lost.status).toBe('playing');
    lost.playLan(loop);
    expect(lost.status).toBe('drawRepetition');
  });
});

describe('classic chess: en passant', () => {
  it('is offered only on the next move', () => {
    classic();
    const pos = play(startPosition(CLASSIC_CHESS), 'e2-e4', 'a7-a6', 'e4-e5', 'd7-d5');
    expect(toFen(pos)).toBe('rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
    const ep = find(pos, 'e5xd6');
    expect(ep.captures).toEqual([parseSq('d5')]);
    expect(toFen(makeMove(pos, ep)).split(' ')[0]).toBe('rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR');
    expect(lans(play(pos, 'a2-a3', 'a6-a5'))).not.toContain('e5xd6');
  });

  it('gives no square without an enemy pawn beside the landing square', () => {
    classic();
    expect(toFen(play(startPosition(CLASSIC_CHESS), 'e2-e4')).split(' ')[3]).toBe('-');
  });

  it('is gone with Darkness: that side neither takes nor gives it', () => {
    classic({ ...POWERS_BALANCED, kings: [null, { king: 'Shadow', power: 'Darkness' }] });
    const white = fromFen('4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1');
    const black = play(white, 'd7-d5');
    expect(black.ep).toBeUndefined();
    expect(lans(black)).not.toContain('e5xd6');
    const fromWhite = play(fromFen('4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1'), 'e2-e4');
    expect(fromWhite.ep).toBeUndefined();
    expect(lans(fromWhite)).not.toContain('d4xe3');
  });

  it('a March step away from the start rank gives none; the start rank double step does', () => {
    classic({ ...POWERS_BALANCED, kings: [{ king: 'Mud', power: 'March' }, null] });
    expect(play(fromFen('4k3/8/8/8/3p4/4P3/8/4K3 w - - 0 1'), 'e3-e5').ep).toBeUndefined();
    const start = play(fromFen('4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1'), 'e2-e4');
    expect(start.ep).toBe(parseSq('e3'));
    expect(lans(start)).toContain('d4xe3');
  });

  it('removes a checking pawn: the only move, and the search plays it', () => {
    classic();
    const pos = fromFen('5r1k/8/2p5/3pP3/4K3/r7/8/3r4 w - d6 0 2');
    expect(lans(pos)).toEqual(['e5xd6']);
    resetSearchState();
    const best = search(pos, { maxDepth: 2 }).move!;
    expect(toLan(pos, best)).toBe('e5xd6');
    expect(best.captures).toEqual([parseSq('d5')]);
  });

  it('positions that differ only in the en-passant square are not the same position', () => {
    classic();
    expect(positionKey(fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'))).not.toBe(positionKey(fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1')));
  });
});

describe('classic chess: the search', () => {
  /** Walk `depth` plies: the search's own legal list equals the engine's, and its incremental key equals `positionKey`. */
  const agree = (pos: Position, depth: number): void => {
    expect(searchLegal(pos).map(m => toLan(pos, m)).sort()).toEqual(lans(pos));
    for (const m of legalMoves(pos)) {
      const next = makeMove(pos, m);
      expect(probeApply(pos, m)).toEqual({ after: positionKey(next), back: positionKey(pos) });
      if (depth > 1) agree(next, depth - 1);
    }
  };
  it('generates and makes castling and en passant as the engine does', () => {
    classic();
    agree(fromFen(KIWIPETE), 2);
    agree(fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'), 3);
  }, 60_000);
});

describe('classic chess: the move text', () => {
  it('names castling and en passant', () => {
    classic();
    const pos = fromFen(KIWIPETE);
    expect(describeMove(pos, find(pos, 'O-O'))).toBe('White castles short.');
    expect(describeMove(pos, find(pos, 'O-O-O'))).toBe('White castles long.');
    const ep = play(startPosition(CLASSIC_CHESS), 'e2-e4', 'a7-a6', 'e4-e5', 'd7-d5');
    expect(describeMove(ep, find(ep, 'e5xd6'))).toBe('White pawn e5 to d6, taking the pawn on d5 en passant.');
  });
});
