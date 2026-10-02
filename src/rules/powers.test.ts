/**
 * The spendable kings' powers (docs/RULES.md §4): Freeze, Ice Wall, Haste, Flight, Sacrifice and
 * the counted March and Leap — generation, the state they leave on `Position`, notation, undo and
 * repetition, and the search's incremental key for every one of their moves.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  BLACK, K, Move, N, P, Position, Q, R, WHITE, inCheck, isAttacked, legalMoves, makeMove, parseSq, piece, status, typeOf,
} from './engine';
import { fromFen, toFen, toLan } from './setup';
import { KingChoice, PowerName, Rules, parseKings, setRules } from './rules';
import { Game } from '../game';
import { positionKey, probeApply, resetSearchState, search } from '../ai/search';

const KING_OF: Record<PowerName, KingChoice['king']> = {
  Freeze: 'Frost', IceWall: 'Frost', Strike: 'Flame', Haste: 'Flame', Flight: 'Stratus', Sacrifice: 'Stratus',
  March: 'Mud', Leap: 'Mud', HolyLight: 'Spirit', Mercy: 'Spirit', DeathTouch: 'Shadow', Darkness: 'Shadow',
};
const k = (power: PowerName): KingChoice => ({ king: KING_OF[power], power });
const powers = (white: PowerName | null, black: PowerName | null, more: Partial<Rules> = {}): void => {
  setRules({ kings: [white ? k(white) : null, black ? k(black) : null], ...more });
};
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const at = (pos: Position, name: string): number => pos.board[parseSq(name)];

afterEach(() => setRules());

describe('Freeze (Frost A)', () => {
  it('names any enemy piece but the king, as the whole turn, twice a game', () => {
    powers('Freeze', null);
    const pos = fromFen('4k3/8/3p4/3n4/8/8/8/4K3 w - - 0 1');
    const freezes = lans(pos).filter(l => l.startsWith('!F:'));
    expect(freezes).toEqual(['!F:d5', '!F:d6']);
    let p = play(pos, '!F:d5');
    expect(toFen(p)).toBe('4k3/8/3p4/3n4/8/8/8/4K3 b - - 1 1 u1.0/md5'); // no square changed
    expect(p.used).toEqual([1, 0]);
    p = play(p, 'Ke8-f8');
    p = play(p, '!F:d5');
    p = play(p, 'Kf8-e8');
    expect(lans(p).some(l => l.startsWith('!F:'))).toBe(false); // both uses spent
  });

  it('stops the piece for one turn: no move, no swap by its own maester, no shove by its own ogre', () => {
    powers('Freeze', null);
    const pos = fromFen('4k3/8/3m4/3n4/3o4/8/8/4K3 w - - 0 1');
    const p = play(pos, '!F:d5');
    const black = lans(p);
    expect(black.some(l => l.startsWith('Nd5'))).toBe(false);
    expect(black.some(l => l.includes('<>d5'))).toBe(false);   // Md6<>d5
    expect(black.some(l => l.includes('>d5'))).toBe(false);    // Od4>d5-…
    expect(black).toContain('Md6-c6');                         // the rest of the army moves
    const next = play(play(p, 'Ke8-f8'), 'Ke1-f1');            // the mark ends with Black's turn
    expect(next.mark).toBeUndefined();
    expect(lans(next).some(l => l.startsWith('Nd5'))).toBe(true);
  });

  it('cannot answer a check, and a frozen piece still gives check', () => {
    powers('Freeze', null);
    const inCheckPos = fromFen('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
    expect(lans(inCheckPos).some(l => l.startsWith('!F:'))).toBe(false);
    const p = play(fromFen('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1'), '!F:d2');
    expect(isAttacked(p.board, parseSq('d1'), BLACK)).toBe(true); // a frozen rook still attacks
  });

  it('keeps its state through FEN, undo and the repetition key', () => {
    powers('Freeze', null);
    const g = new Game();
    g.load(fromFen('4k3/8/8/3n4/8/8/8/4K3 w - - 0 1'));
    const before = toFen(g.pos);
    g.play(g.legal.find(m => toLan(g.pos, m) === '!F:d5')!);
    const round = fromFen(toFen(g.pos));
    expect(round.mark).toBe(parseSq('d5'));
    expect(round.used).toEqual([1, 0]);
    expect(positionKey(round)).toBe(positionKey(g.pos));
    expect(positionKey(g.pos)).not.toBe(positionKey({ ...g.pos, mark: undefined }));
    expect(g.undo()).toBe(true);
    expect(toFen(g.pos)).toBe(before);
  });
});

describe('Ice Wall (Frost B)', () => {
  it('makes an own piece uncapturable for the opponent’s next turn', () => {
    powers('IceWall', null);
    const pos = fromFen('4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1');
    expect(lans(pos).filter(l => l.startsWith('!W:'))).toEqual(['!W:a4']); // never the king
    const p = play(pos, '!W:a4');
    expect(lans(p)).not.toContain('Bc2xa4');
    const back = play(play(p, 'Ke8-f8'), 'Ke1-f1');
    expect(lans(back)).toContain('Bc2xa4');
  });

  it('a beast chain stops short of the warded piece', () => {
    powers('IceWall', null);
    const pos = fromFen('4k3/8/8/2PP4/2s5/8/8/4K3 w - - 0 1'); // black beast c4; white pawns c5 d5
    const p = play(pos, '!W:d5');
    const chains = lans(p).filter(l => l.startsWith('Sc4x'));
    expect(chains).toContain('Sc4xc5');
    expect(chains.some(l => l.includes('xd5'))).toBe(false);
  });

  it('a warded piece may still be shoved', () => {
    powers('IceWall', null);
    const p = play(fromFen('4k3/8/8/8/3o4/3N4/8/4K3 w - - 0 1'), '!W:d3');
    expect(lans(p)).toContain('Od4>d3-d2');
  });
});

describe('Haste (Flame B)', () => {
  it('moves one piece twice in a turn; the second move is optional and never takes a king', () => {
    powers('Haste', null);
    const pos = fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1');
    const p = play(pos, 'Ra1xa5!H');
    expect(p.turn).toBe(WHITE);              // the turn holds
    expect(p.haste).toBe(parseSq('a5'));
    expect(p.used).toEqual([1, 0]);
    const second = lans(p);
    expect(second).toContain('Ra5xe5');
    expect(second).toContain('--');
    expect(second.every(l => l === '--' || l.startsWith('Ra5'))).toBe(true); // only the hasted piece
    const done = play(p, 'Ra5xe5');
    expect(done.turn).toBe(BLACK);
    expect(done.haste).toBeUndefined();
    expect(lans(done).some(l => l.endsWith('!H'))).toBe(false);

    const check = play(fromFen('4k3/8/8/8/8/8/8/R5K1 w - - 0 1'), 'Ra1-a8!H');
    expect(lans(check).some(l => l.includes('xe8'))).toBe(false); // the king is never taken
    expect(status(check)).toBe('playing');
  });

  it('a mark binds both halves of a Haste turn', () => {
    powers('Haste', 'Freeze');
    let p = fromFen('4k3/8/8/8/8/8/8/R3K2N b - - 0 1');
    p = play(p, '!F:h1');
    p = play(p, 'Ra1-a2!H');
    expect(p.mark).toBe(parseSq('h1'));
    expect(lans(p).some(l => l.startsWith('Nh1'))).toBe(false);
  });

  it('survives FEN, undo and replay by notation', () => {
    powers('Haste', null);
    const g = new Game();
    g.load(fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'));
    expect(g.playLan(['Ra1xa5!H', '--', 'Kh8-g8'])).toBe(3);
    expect(g.pos.turn).toBe(WHITE);
    const mid = new Game();
    mid.load(fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'));
    mid.playLan(['Ra1xa5!H']);
    expect(toFen(mid.pos)).toBe('7k/8/8/R3r3/8/8/8/6K1 w - - 0 1 u1.0/ha5');
    expect(fromFen(toFen(mid.pos)).haste).toBe(parseSq('a5'));
    expect(mid.undo()).toBe(true);
    expect(toFen(mid.pos)).toBe('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1');
  });

  it('the search finds the double capture', () => {
    powers('Haste', null);
    resetSearchState();
    const pos = fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1');
    const r = search(pos, { maxDepth: 3 });
    expect(r.move && toLan(pos, r.move)).toBe('Ra1xa5!H');
    const mid = makeMove(pos, r.move!);
    const r2 = search(mid, { maxDepth: 3 });
    expect(r2.move && toLan(mid, r2.move)).toBe('Ra5xe5');
  }, 30_000);
});

describe('Flight (Stratus A)', () => {
  it('moves any own piece but the king to any empty square of its own half, once', () => {
    powers('Flight', null);
    const pos = fromFen('4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1');
    const flights = lans(pos).filter(l => l.includes('~'));
    expect(flights).toContain('Ra1~h4');
    expect(flights).toContain('Nb1~d3');
    expect(flights).toContain('b2~h4');
    expect(flights.some(l => l.startsWith('b2~') && l.endsWith('1'))).toBe(false); // no pawn on its back rank
    expect(flights.some(l => l.startsWith('Ke1'))).toBe(false);
    expect(flights.some(l => /~[a-h][5-8]$/.test(l))).toBe(false);
    const p = play(pos, 'Nb1~d3');
    expect(typeOf(at(p, 'd3'))).toBe(N);
    expect(lans(play(p, 'Ke8-f8')).some(l => l.includes('~'))).toBe(false);
  });

  it('may block a check, never leave the king in one', () => {
    powers('Flight', null);
    const pos = fromFen('4r1k1/8/8/8/8/8/8/R3K3 w - - 0 1');
    expect(lans(pos)).toContain('Ra1~e2');
    expect(lans(pos)).not.toContain('Ra1~d2');
  });
});

describe('Sacrifice (Stratus B)', () => {
  it('keeps a reserve of lost pieces and returns one on a pawn’s square, once', () => {
    powers('Sacrifice', null);
    let p = fromFen('4k3/8/8/8/8/2b5/1P1N4/4K3 b - - 0 1');
    p = play(p, 'Bc3xd2');                       // Black takes the knight
    expect(p.lost?.[WHITE * 16 + N]).toBe(1);
    p = play(p, 'Ke1xd2');
    p = play(p, 'Ke8-f8');
    expect(lans(p).filter(l => l.startsWith('!S:'))).toEqual(['!S:b2=N']);
    const back = play(p, '!S:b2=N');
    expect(at(back, 'b2')).toBe(piece(N, WHITE));
    expect(back.lost?.[WHITE * 16 + N]).toBe(0);
    expect(toFen(back).split(' ')[6]).toBe('u1.0/lb');           // the black bishop in Black's count
    expect(lans(play(back, 'Kf8-e8')).some(l => l.startsWith('!S:'))).toBe(false);
  });

  it('never returns a guard, and a paladin that removes itself joins the reserve', () => {
    powers('Sacrifice', null);
    const pos = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lGQ');
    expect(lans(pos).filter(l => l.startsWith('!S:'))).toEqual(['!S:a2=Q']);
    const pal = play(fromFen('4k3/8/8/8/3n4/8/P7/3LK3 w - - 0 1 l'), 'Ld1xd4');
    expect(pal.lost?.[WHITE * 16 + 8]).toBe(1); // L = 8
  });

  it('the search returns the queen', () => {
    powers('Sacrifice', null);
    resetSearchState();
    const pos = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQ');
    const r = search(pos, { maxDepth: 3 });
    expect(r.move && toLan(pos, r.move)).toBe('!S:a2=Q');
  });
});

describe('March and Leap, counted (the rulebook’s 3 uses)', () => {
  it('March: a double step from any rank is a power move; the start-rank step is not', () => {
    powers('March', null);
    const pos = fromFen('4k3/8/8/8/8/4P3/3P4/4K3 w - - 0 1');
    expect(lans(pos)).toContain('e3-e5!M');
    expect(lans(pos)).toContain('d2-d4');
    let p = play(pos, 'e3-e5!M');
    p = play(play(p, 'Ke8-f8'), 'e5-e7!M');
    expect(p.used).toEqual([2, 0]);
    expect(isAttacked(pos.board, parseSq('e5'), WHITE)).toBe(false);
    setRules({ kings: parseKings('mud:march,none'), marchUses: 1 });
    const once = play(fromFen('4k3/8/8/8/8/4P3/8/4K3 w - - 0 1'), 'e3-e5!M');
    expect(lans(play(once, 'Ke8-f8')).some(l => l.endsWith('!M'))).toBe(false);
  });

  it('Leap: a slider passes its own pawns as a power move, which never checks or takes a king', () => {
    powers('Leap', null);
    const pos = fromFen('7k/8/8/p7/8/8/P7/R6K w - - 0 1');
    expect(lans(pos)).toEqual(expect.arrayContaining(['Ra1-a3!L', 'Ra1-a4!L', 'Ra1xa5!L']));
    expect(isAttacked(pos.board, parseSq('a3'), WHITE)).toBe(false); // no attack through the pawn
    const king = fromFen('k7/8/8/8/8/8/P7/R6K b - - 0 1');
    expect(inCheck(king)).toBe(false);
    expect(lans(fromFen('k7/8/8/8/8/8/P7/R6K w - - 0 1')).some(l => l.includes('xa8'))).toBe(false);
  });
});

describe('the search keeps the power state exactly as positionKey does', () => {
  const cases: [string, PowerName | null, PowerName | null, string][] = [
    ['freeze', 'Freeze', 'IceWall', '4k3/8/3m4/3n4/3o4/8/3P4/4K3 w - - 0 1'],
    ['ward', 'IceWall', 'Freeze', '4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1'],
    ['haste', 'Haste', 'Strike', '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'],
    ['haste second', 'Haste', null, '7k/8/8/R3r3/8/8/8/6K1 w - - 0 1 u1.0/ha5'],
    ['flight', 'Flight', 'Sacrifice', '4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1 l'],
    ['sacrifice', 'Sacrifice', 'Haste', '4k3/8/8/8/3b4/8/P1N5/4K3 w - - 0 1 lQr'],
    ['march', 'March', 'Leap', '4k3/p7/8/8/8/4P3/3P4/4K3 w - - 0 1'],
    ['leap', 'Leap', 'March', '7k/8/8/p7/8/8/P7/R6K w - - 0 1'],
    ['frozen side', null, 'Freeze', '4k3/8/8/3n4/8/8/8/4K3 b - - 1 1 u0.1/md5'],
  ];
  for (const [name, white, black, fen] of cases) {
    it(name, () => {
      powers(white, black);
      const pos = fromFen(fen);
      const moves = legalMoves(pos);
      expect(moves.length).toBeGreaterThan(0);
      for (const m of moves) {
        const { after, back } = probeApply(pos, m);
        expect(after, toLan(pos, m)).toBe(positionKey(makeMove(pos, m)));
        expect(back, toLan(pos, m)).toBe(positionKey(pos));
      }
    });
  }

  it('random games with every pair of spendable powers keep the keys in step', () => {
    const spend: PowerName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap'];
    let seed = 11;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 16; g++) {
      powers(spend[g % 8], spend[(g * 3 + 1) % 8]);
      let pos = fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
      for (let ply = 0; ply < 60 && status(pos) === 'playing'; ply++) {
        const moves = legalMoves(pos);
        const powered = moves.filter(m => m.power || m.pass);
        const m = powered.length && rng() < 0.4 ? powered[Math.floor(rng() * powered.length)] : moves[Math.floor(rng() * moves.length)];
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        // FEN keeps everything but the exact ply: after a Haste turn the side to move no longer
        // follows the ply's parity, and FEN's move number cannot say so (nothing reads it but the
        // lab's secondPlayerDoubleFirstTurn).
        expect({ ...fromFen(toFen(next)), ply: 0 }, toFen(next)).toEqual({ ...normalised(next), ply: 0 });
        pos = next;
      }
    }
  });
});

/** `fromFen(toFen(p))` writes the reserve only when kept, and drops an all-zero use count. */
function normalised(p: Position): Position {
  const out: Position = { board: p.board, turn: p.turn, halfmove: p.halfmove, ply: p.ply };
  if (p.used && (p.used[0] || p.used[1])) out.used = p.used;
  if (p.mark !== undefined) out.mark = p.mark;
  if (p.haste !== undefined) out.haste = p.haste;
  if (p.lost) out.lost = p.lost;
  return out;
}

describe('rule sets of the powers', () => {
  it('default use counts are the rulebook’s', () => {
    setRules();
    const r = setRules();
    expect([r.freezeUses, r.iceWallUses, r.strikeUses, r.hasteUses, r.flightUses, r.sacrificeUses, r.marchUses, r.leapUses])
      .toEqual([2, 2, 1, 1, 1, 1, 3, 3]);
  });

  it('a plain game carries no power state', () => {
    setRules();
    let pos = fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    for (const lan of ['e2-e4', 'd7-d5', 'e4xd5', 'Qd8xd5']) pos = play(pos, lan);
    expect(pos.used ?? pos.mark ?? pos.haste ?? pos.lost).toBeUndefined();
    expect(toFen(pos).split(' ')).toHaveLength(6);
    expect(typeOf(at(pos, 'd5'))).toBe(Q);
    expect([K, R, P].length).toBe(3);
  });
});
