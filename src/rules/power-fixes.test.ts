/**
 * Balance-lab readings of three kings' powers (2026-10-03), each a toggle that is off in every
 * official set: Haste's limits on its moves (`hasteApart`, `hasteNoThreat`, `hasteNoForward`,
 * `hasteNoCheck`), Mercy's trims (`mercyAuraPawnsTake`, `mercyTakesPawns`, `mercyNoJump`) and
 * Darkness's diagonal shelter (`darknessShelter`, `darknessShelterPawnsTake`). The attack mirror for
 * the shelters is cross-checked in rules.test.ts. Death Touch's trims of its two-square reach
 * (`deathTouchReachNoBack`, `deathTouchReachForwardBack`, `deathTouchReachPieces`, round 14) are
 * cross-checked here.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  B, BLACK, Color, K, Move, N, P, PieceType, Position, Q, R, WHITE, colorOf, file, genPiece, inCheck, isAttacked, legalMoves, makeMove, parseSq, piece, powerOf, rank,
  sqName, status, typeOf,
} from './engine';
import { fromFen, randomBackRank, startPosition, toFen, toLan } from './setup';
import { KingChoice, PowerName, RULES, Rules, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, searchLegal, setFastLegality } from '../ai/search';
import { RULE_POWERS } from '../sim/tournament';
import { powerText } from '../powers-ui';

const KING_OF: Partial<Record<PowerName, KingChoice['king']>> = { Haste: 'Flame', Strike: 'Flame', Mercy: 'Spirit', Darkness: 'Shadow', DeathTouch: 'Shadow' };
const k = (power: PowerName | null): KingChoice | null => (power ? { king: KING_OF[power]!, power } : null);
const powers = (white: PowerName | null, black: PowerName | null, more: Partial<Rules> = {}): void => {
  setRules({ kings: [k(white), k(black)], ...more });
};
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const sq = parseSq;

afterEach(() => { setRules(); setFastLegality(true); resetSearchState(); });

describe('Haste readings (the official Haste: neither move captures)', () => {
  const haste = (more: Partial<Rules>): void => powers('Haste', null, { hasteCaptures: false, ...more });

  it('hasteApart: the second move may not end next to an enemy piece', () => {
    const fen = '7k/8/8/4p3/8/8/8/R5K1 w - - 0 1'; // black pawn e5
    haste({});
    expect(lans(play(fromFen(fen), 'Ra1-a4!H'))).toEqual(expect.arrayContaining(['Ra4-d4', 'Ra4-e4', 'Ra4-f4']));
    haste({ hasteApart: true });
    const p = play(fromFen(fen), 'Ra1-a4!H');
    const second = lans(p);
    for (const l of ['Ra4-d4', 'Ra4-e4', 'Ra4-f4']) expect(second).not.toContain(l);
    expect(second).toEqual(expect.arrayContaining(['Ra4-c4', 'Ra4-g4', 'Ra4-a8', '--']));
    expect(lans(fromFen('7k/8/8/4p3/8/8/8/3R2K1 w - - 0 1'))).toContain('Rd1-d4!H'); // the first move may
    // The board after the move: a pushing Ogre always ends next to the piece it shoved.
    const ogre = play(fromFen('7k/8/8/3n4/8/3O4/8/K7 w - - 0 1'), 'Od3-d4!H');
    expect(lans(ogre)).not.toContain('Od4>d5-d6');
    haste({});
    expect(lans(play(fromFen('7k/8/8/3n4/8/3O4/8/K7 w - - 0 1'), 'Od3-d4!H'))).toContain('Od4>d5-d6');
  });

  it('hasteNoThreat: the second move may not end where the piece could capture or give check', () => {
    const fen = '7k/8/8/4n3/8/8/8/R5K1 w - - 0 1'; // black knight e5, king h8
    haste({});
    expect(lans(play(fromFen(fen), 'Ra1-a4!H'))).toEqual(expect.arrayContaining(['Ra4-a5', 'Ra4-e4', 'Ra4-h4', 'Ra4-a8']));
    haste({ hasteNoThreat: true });
    const second = lans(play(fromFen(fen), 'Ra1-a4!H'));
    expect(second).not.toContain('Ra4-a5'); // would take the knight along rank 5
    expect(second).not.toContain('Ra4-e4'); // … along the e-file
    expect(second).not.toContain('Ra4-h4'); // check on the h-file
    expect(second).not.toContain('Ra4-a8'); // check on rank 8
    expect(second).toEqual(expect.arrayContaining(['Ra4-c4', 'Ra4-b4', '--']));
    // An archer's shot is a capture too: from e5 it shoots two squares diagonally forward to g7.
    const archer = lans(play(fromFen('7k/6n1/8/8/8/2A5/8/K7 w - - 0 1'), 'Ac3-d4!H'));
    expect(archer).not.toContain('Ad4-e5');
    expect(archer).toContain('Ad4-d3');
    // The capture rules include the shelters: a piece in a Mercy shelter is no target.
    const sheltered = '6nk/8/8/8/8/8/8/R5K1 w - - 0 1'; // Rg4 would see the knight g8, next to its king
    expect(lans(play(fromFen(sheltered), 'Ra1-a4!H'))).not.toContain('Ra4-g4');
    powers('Haste', 'Mercy', { hasteCaptures: false, hasteNoThreat: true, mercyAura: true });
    expect(lans(play(fromFen(sheltered), 'Ra1-a4!H'))).toContain('Ra4-g4');
  });

  it('hasteNoForward: the second move may not go toward the enemy, for either colour', () => {
    haste({ hasteNoForward: true });
    const w = lans(play(fromFen('7k/8/8/8/8/8/8/R5K1 w - - 0 1'), 'Ra1-a4!H')); // the first move may go forward
    expect(w).not.toContain('Ra4-a5');
    expect(w).toEqual(expect.arrayContaining(['Ra4-a3', 'Ra4-e4', '--']));
    powers(null, 'Haste', { hasteCaptures: false, hasteNoForward: true });
    const b = lans(play(fromFen('r3k3/8/8/8/8/8/8/4K3 b - - 0 1'), 'Ra8-a5!H'));
    expect(b).not.toContain('Ra5-a4');
    expect(b).toEqual(expect.arrayContaining(['Ra5-a6', 'Ra5-b5', '--']));
    haste({});
    expect(lans(play(fromFen('7k/8/8/8/8/8/8/R5K1 w - - 0 1'), 'Ra1-a4!H'))).toContain('Ra4-a5');
  });

  it('hasteNoCheck: neither move of a Haste gives check; an ordinary move still may', () => {
    const fen = '4k3/8/8/8/8/8/8/R5K1 w - - 0 1';
    haste({});
    expect(lans(fromFen(fen))).toEqual(expect.arrayContaining(['Ra1-a8!H', 'Ra1-e1!H']));
    haste({ hasteNoCheck: true });
    const first = lans(fromFen(fen));
    expect(first).not.toContain('Ra1-a8!H');
    expect(first).not.toContain('Ra1-e1!H');
    expect(first).toEqual(expect.arrayContaining(['Ra1-a4!H', 'Ra1-a8', 'Ra1-e1'])); // ordinary checks stay
    const second = lans(play(fromFen(fen), 'Ra1-a4!H'));
    expect(second).not.toContain('Ra4-e4');
    expect(second).not.toContain('Ra4-a8');
    expect(second).toEqual(expect.arrayContaining(['Ra4-c4', '--']));
  });

  it('the rule text names each limit', () => {
    const r = (more: Partial<Rules>): Rules => setRules({ hasteCaptures: false, ...more });
    expect(powerText('Haste', r({}))).toBe('move one piece twice in one turn (the second move is optional); neither move captures');
    expect(powerText('Haste', r({ hasteApart: true }))).toContain('may not end next to an enemy piece');
    expect(powerText('Haste', r({ hasteNoThreat: true }))).toContain('may not end where the piece could capture');
    expect(powerText('Haste', r({ hasteNoForward: true }))).toContain('may not go forward');
    expect(powerText('Haste', r({ hasteNoCheck: true }))).toContain('neither move may give check');
  });
});

describe('Mercy readings (the official Mercy: the shelter on)', () => {
  // White Mercy king e2; knights d3 (next to it) and b3; Black rook d8, bishop a4, pawn c4.
  const fen = '3r3k/8/8/8/b1p5/1N1N4/4K3/8 b - - 0 1';

  it('mercyAuraPawnsTake: a pawn takes in the shelter, nothing else does', () => {
    powers('Mercy', null, { mercyAura: true });
    expect(lans(fromFen(fen))).not.toContain('c4xd3');
    powers('Mercy', null, { mercyAura: true, mercyAuraPawnsTake: true });
    const moves = lans(fromFen(fen));
    expect(moves).toContain('c4xd3');
    expect(moves).not.toContain('Rd8xd3');
    expect(isAttacked(fromFen(fen).board, sq('d3'), BLACK)).toBe(true);
    const noPawn = fromFen('3r3k/8/8/8/8/3N4/4K3/8 b - - 0 1');
    expect(isAttacked(noPawn.board, sq('d3'), BLACK)).toBe(false); // the rook alone does not reach it
    expect(lans(noPawn)).not.toContain('Rd8xd3');
    // It only trims the shelter: without `mercyAura` it changes nothing.
    powers('Mercy', null);
    const plain = lans(fromFen(fen));
    powers('Mercy', null, { mercyAuraPawnsTake: true });
    expect(lans(fromFen(fen))).toEqual(plain);
  });

  it('mercyTakesPawns: the king takes an adjacent pawn, and nothing else but a guard', () => {
    powers('Mercy', null);
    expect(lans(fromFen('k7/8/8/8/3Kp3/8/8/8 w - - 0 1'))).not.toContain('Kd4xe4');
    powers('Mercy', null, { mercyTakesPawns: true });
    const pawn = fromFen('k7/8/8/8/3Kp3/8/8/8 w - - 0 1');
    expect(lans(pawn)).toContain('Kd4xe4');
    expect(isAttacked(pawn.board, sq('e4'), WHITE)).toBe(true);
    const knight = fromFen('k7/8/8/8/3Kn3/8/8/8 w - - 0 1');
    expect(lans(knight)).not.toContain('Kd4xe4');
    expect(isAttacked(knight.board, sq('e4'), WHITE)).toBe(false);
    const far = lans(fromFen('k7/8/8/8/3K1p2/8/8/8 w - - 0 1'));
    expect(far.some(l => l.includes('f4'))).toBe(false); // the two-square step stays move-only
  });

  it('M2 (both): the king takes back the pawn that took in the shelter', () => {
    powers('Mercy', null, { mercyAura: true, mercyAuraPawnsTake: true, mercyTakesPawns: true });
    expect(lans(play(fromFen('7k/8/8/8/2p5/3N4/4K3/8 b - - 0 1'), 'c4xd3'))).toContain('Ke2xd3');
    powers('Mercy', null, { mercyAura: true, mercyAuraPawnsTake: true });
    expect(lans(play(fromFen('7k/8/8/8/2p5/3N4/4K3/8 b - - 0 1'), 'c4xd3'))).not.toContain('Ke2xd3');
  });

  it('mercyNoJump: the two-square step needs an empty square between', () => {
    const pos = fromFen('k7/8/8/8/8/8/4P3/4K3 w - - 0 1');
    powers('Mercy', null);
    expect(lans(pos)).toEqual(expect.arrayContaining(['Ke1-e3', 'Ke1-c3']));
    powers('Mercy', null, { mercyNoJump: true });
    expect(lans(pos)).not.toContain('Ke1-e3'); // over its own pawn
    expect(lans(pos)).toContain('Ke1-c3');     // over the empty d2
  });

  it('the rule text follows each toggle', () => {
    const r = (more: Partial<Rules>): Rules => setRules({ mercyAura: true, ...more });
    expect(powerText('Mercy', r({}))).toBe('your king steps 1–2 squares and jumps your pieces, but takes only a guard; your pieces next to it cannot be taken');
    expect(powerText('Mercy', r({ mercyAuraPawnsTake: true }))).toContain('cannot be taken except by pawns');
    expect(powerText('Mercy', r({ mercyTakesPawns: true }))).toContain('takes only a pawn or a guard');
    expect(powerText('Mercy', r({ mercyNoJump: true }))).not.toContain('jumps');
  });
});

describe('Darkness readings: the diagonal shelter', () => {
  // White Darkness king e2; knights d3 (diagonal neighbour) and e3 (straight ahead); Black rooks a3
  // and e8, pawn c4 (it takes d3).
  const fen = '4r2k/8/8/8/2p5/r2NN3/4K3/8 b - - 0 1';

  it('darknessShelter: no capture takes a piece diagonally next to the king', () => {
    powers('Darkness', null, { darknessMoves: true });
    expect(lans(fromFen(fen))).toEqual(expect.arrayContaining(['Ra3xd3', 'c4xd3', 'Re8xe3']));
    powers('Darkness', null, { darknessMoves: true, darknessShelter: true });
    const moves = lans(fromFen(fen));
    expect(moves).not.toContain('Ra3xd3');
    expect(moves).not.toContain('c4xd3');
    expect(moves).toContain('Re8xe3'); // the straight neighbour is not sheltered
    expect(isAttacked(fromFen(fen).board, sq('d3'), BLACK)).toBe(false);
    expect(isAttacked(fromFen(fen).board, sq('e3'), BLACK)).toBe(true);
    // The other side's Darkness does not shelter White's pieces.
    powers(null, 'Darkness', { darknessShelter: true });
    expect(lans(fromFen(fen))).toContain('Ra3xd3');
  });

  it('darknessShelterPawnsTake (D2): only a pawn takes in the shelter', () => {
    powers('Darkness', null, { darknessMoves: true, darknessShelter: true, darknessShelterPawnsTake: true });
    const moves = lans(fromFen(fen));
    expect(moves).toContain('c4xd3');
    expect(moves).not.toContain('Ra3xd3');
    expect(isAttacked(fromFen(fen).board, sq('d3'), BLACK)).toBe(true);
    expect(isAttacked(fromFen('4r2k/8/8/8/8/r2NN3/4K3/8 b - - 0 1').board, sq('d3'), BLACK)).toBe(false);
    // It only trims the shelter: without `darknessShelter` it changes nothing.
    powers('Darkness', null, { darknessMoves: true });
    const plain = lans(fromFen(fen));
    powers('Darkness', null, { darknessMoves: true, darknessShelterPawnsTake: true });
    expect(lans(fromFen(fen))).toEqual(plain);
  });

  it('the shelter holds against power moves and cards', () => {
    // A black knight b5 strikes as a queen along b5-c4-d3.
    const strike = '7k/8/8/1n6/8/3N4/4K3/8 b - - 0 1';
    powers('Darkness', 'Strike');
    expect(lans(fromFen(strike))).toContain('Nb5xd3!');
    powers('Darkness', 'Strike', { darknessShelter: true });
    expect(lans(fromFen(strike)).some(l => l.includes('xd3'))).toBe(false);
    setRules({ kings: [k('Darkness'), null], hands: [[], ['Strike']], darknessShelter: true });
    expect(lans(fromFen(strike)).some(l => l.includes('xd3'))).toBe(false);
    setRules({ kings: [k('Darkness'), null], hands: [[], ['Strike']] });
    expect(lans(fromFen(strike))).toContain('Nb5xd3!');
  });

  it('the rule text names the shelter', () => {
    expect(powerText('Darkness', setRules({ darknessMoves: true }))).toBe('your pawns may also step diagonally, and take only straight ahead');
    expect(powerText('Darkness', setRules({ darknessMoves: true, darknessShelter: true }))).toBe('your pawns may also step diagonally, and take only straight ahead; your pieces diagonally next to your king cannot be taken');
    expect(powerText('Darkness', setRules({ darknessShelter: true, darknessShelterPawnsTake: true }))).toContain('cannot be taken except by pawns');
  });
});

/** The Death Touch shots (`to === from`) of the side to move, by victim square. */
const shots = (pos: Position): string[] => legalMoves(pos).filter(m => m.to === m.from && m.captures.length === 1).map(m => sqName(m.captures[0])).sort();

/**
 * The reach's attack mirror: on random boards with a Death Touch king of each colour, `isAttacked`
 * answers on every occupied enemy square exactly what `genPiece('attacks')` generates. Returns the
 * two-square shots it saw, so a caller can tell the check is not vacuous.
 */
function crossCheckTouch(seed: number, trials: number): number {
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const types: PieceType[] = [P, N, B, R, Q];
  let reach = 0;
  for (let trial = 0; trial < trials; trial++) {
    const board = new Uint8Array(64);
    for (const c of [WHITE, BLACK]) board[Math.floor(rng() * 64)] = piece(K, c);
    for (let s = 0; s < 64; s++) {
      if (board[s] || rng() < 0.6) continue;
      const t = types[Math.floor(rng() * types.length)];
      if (t === P && (s < 8 || s >= 56)) continue;
      board[s] = piece(t, rng() < 0.5 ? WHITE : BLACK);
    }
    for (const by of [WHITE, BLACK]) {
      const out: Move[] = [];
      for (let s = 0; s < 64; s++) if (board[s] && colorOf(board[s]) === by) genPiece(board, s, 'attacks', out);
      const attacked = new Set(out.map(m => m.captures[0]));
      reach += out.filter(m => m.to === m.from && Math.max(Math.abs(file(m.captures[0]) - file(m.from)), Math.abs(rank(m.captures[0]) - rank(m.from))) === 2).length;
      for (let s = 0; s < 64; s++) {
        if (!board[s] || colorOf(board[s]) === by) continue;
        expect(isAttacked(board, s, by), `trial ${trial} ${sqName(s)} by ${by}`).toBe(attacked.has(s));
      }
    }
  }
  return reach;
}

describe('Death Touch readings: trims of the two-square reach (official: straight forward, back or sideways)', () => {
  const touch = (white: boolean, black: boolean, more: Partial<Rules> = {}): void => {
    powers(white ? 'DeathTouch' : null, black ? 'DeathTouch' : null, { deathTouchReach: true, deathTouchReachOrtho: true, ...more });
  };
  // White Death Touch king d4; Black knights d6 (ahead), d2 (behind), b4 and f4 (beside), pawn c3
  // (next to it). The same board turned round for Black: king e5, ahead is e3.
  const white = '7k/8/3n4/8/1n1K1n2/2p5/3n4/8 w - - 0 1';
  const black = '8/4N3/5P2/2N1k1N1/8/4N3/8/7K b - - 0 1';

  it('deathTouchReachNoBack: the reach goes forward or sideways, never back', () => {
    touch(true, false);
    expect(shots(fromFen(white))).toEqual(['b4', 'c3', 'd2', 'd6', 'f4']);
    touch(true, false, { deathTouchReachNoBack: true });
    expect(shots(fromFen(white))).toEqual(['b4', 'c3', 'd6', 'f4']);
    expect(isAttacked(fromFen(white).board, sq('d2'), WHITE)).toBe(false);
    expect(isAttacked(fromFen(white).board, sq('d6'), WHITE)).toBe(true);
    touch(false, true);
    expect(shots(fromFen(black))).toEqual(['c5', 'e3', 'e7', 'f6', 'g5']);
    touch(false, true, { deathTouchReachNoBack: true });
    expect(shots(fromFen(black))).toEqual(['c5', 'e3', 'f6', 'g5']); // e7 is behind a Black king
    expect(isAttacked(fromFen(black).board, sq('e7'), BLACK)).toBe(false);
    expect(isAttacked(fromFen(black).board, sq('e3'), BLACK)).toBe(true);
  });

  it('deathTouchReachForwardBack: the reach goes straight forward or back, never sideways', () => {
    touch(true, false, { deathTouchReachForwardBack: true });
    expect(shots(fromFen(white))).toEqual(['c3', 'd2', 'd6']);
    expect(isAttacked(fromFen(white).board, sq('f4'), WHITE)).toBe(false);
    expect(isAttacked(fromFen(white).board, sq('d2'), WHITE)).toBe(true);
    touch(false, true, { deathTouchReachForwardBack: true });
    expect(shots(fromFen(black))).toEqual(['e3', 'e7', 'f6']);
    expect(isAttacked(fromFen(black).board, sq('c5'), BLACK)).toBe(false);
    // Both trims leave the one line straight ahead.
    touch(true, true, { deathTouchReachNoBack: true, deathTouchReachForwardBack: true });
    expect(shots(fromFen(white))).toEqual(['c3', 'd6']);
    expect(shots(fromFen(black))).toEqual(['e3', 'f6']);
    // Without the reach, neither trim changes anything: the adjacent touch only.
    powers('DeathTouch', null, { deathTouchReachNoBack: true, deathTouchReachForwardBack: true, deathTouchReachPieces: true });
    expect(shots(fromFen(white))).toEqual(['c3']);
  });

  it('deathTouchReachPieces: the reach takes no pawn; the adjacent touch still does', () => {
    // As above, with pawns on d6, b4 and f4 (Black) and e3, c5 and g5 (White); a knight stays behind.
    const wp = '7k/8/3p4/8/1p1K1p2/2p5/3n4/8 w - - 0 1', bp = '8/4N3/5P2/2P1k1P1/8/4P3/8/7K b - - 0 1';
    touch(true, true);
    expect(shots(fromFen(wp))).toEqual(['b4', 'c3', 'd2', 'd6', 'f4']);
    expect(shots(fromFen(bp))).toEqual(['c5', 'e3', 'e7', 'f6', 'g5']);
    touch(true, true, { deathTouchReachPieces: true });
    expect(shots(fromFen(wp))).toEqual(['c3', 'd2']);
    expect(shots(fromFen(bp))).toEqual(['e7', 'f6']);
    expect(isAttacked(fromFen(wp).board, sq('d6'), WHITE)).toBe(false);
    expect(isAttacked(fromFen(wp).board, sq('c3'), WHITE)).toBe(true);
    expect(isAttacked(fromFen(bp).board, sq('e3'), BLACK)).toBe(false);
    expect(isAttacked(fromFen(bp).board, sq('e7'), BLACK)).toBe(true);
    expect(isAttacked(fromFen(wp).board, sq('d5'), WHITE)).toBe(true); // an empty square: a piece may land there
  });

  it('the reach gives check only along the lines it keeps', () => {
    // Black kings two squares behind (d2), ahead (d6) and beside (f4) a White Death Touch king d4.
    const at = (s: string): Position => fromFen(`8/8/${s === 'd6' ? '3k4' : '8'}/8/3K${s === 'f4' ? '1k2' : '4'}/8/${s === 'd2' ? '3k4' : '8'}/8 b - - 0 1`);
    const checks = (more: Partial<Rules>): boolean[] => { touch(true, false, more); return ['d2', 'd6', 'f4'].map(s => inCheck(at(s))); };
    expect(checks({})).toEqual([true, true, true]);
    expect(checks({ deathTouchReachNoBack: true })).toEqual([false, true, true]);
    expect(checks({ deathTouchReachForwardBack: true })).toEqual([true, true, false]);
    expect(checks({ deathTouchReachPieces: true })).toEqual([true, true, true]); // a king is a piece
    // Black's view: a White king behind it (e7) is safe under NoBack.
    touch(false, true, { deathTouchReachNoBack: true });
    expect(inCheck(fromFen('8/4K3/8/4k3/8/8/8/8 w - - 0 1'))).toBe(false);
    expect(inCheck(fromFen('8/8/8/4k3/8/4K3/8/8 w - - 0 1'))).toBe(true);
  });

  it('isAttacked agrees with the generated touches on random boards under each trim', () => {
    const sets: Partial<Rules>[] = [
      {}, { deathTouchReachNoBack: true }, { deathTouchReachForwardBack: true }, { deathTouchReachPieces: true },
      { deathTouchReachNoBack: true, deathTouchReachForwardBack: true, deathTouchReachPieces: true },
      { deathTouchReachOrtho: false, deathTouchReachNoBack: true }, { deathTouchReachOrtho: false, deathTouchReachForwardBack: true },
    ];
    sets.forEach((more, i) => {
      touch(true, true, more);
      expect(crossCheckTouch(400 + i, 300), JSON.stringify(more)).toBeGreaterThan(30);
    });
  });

  it('the rule text follows each trim', () => {
    const r = (more: Partial<Rules>): Rules => setRules({ deathTouchReach: true, deathTouchReachOrtho: true, ...more });
    const base = 'your king takes an enemy next to it, or two squares away straight forward, back or sideways over an empty square, without moving \u2014 it can only take this way';
    expect(powerText('DeathTouch', r({}))).toBe(base);
    expect(powerText('DeathTouch', r({ deathTouchReachNoBack: true }))).toBe(base.replace('forward, back or sideways', 'forward or sideways'));
    expect(powerText('DeathTouch', r({ deathTouchReachForwardBack: true }))).toBe(base.replace('forward, back or sideways', 'forward or back'));
    expect(powerText('DeathTouch', r({ deathTouchReachNoBack: true, deathTouchReachForwardBack: true }))).toContain('two squares away straight forward over');
    expect(powerText('DeathTouch', r({ deathTouchReachPieces: true }))).toBe(base.replace('or two squares', 'or a piece (not a pawn) two squares'));
  });
});

/** The reach rules, checked from outside the generator on one legal move `m` of `pos`. */
function touchObeys(pos: Position, m: Move): string {
  if (m.to !== m.from || m.captures.length !== 1 || typeOf(pos.board[m.from]) !== K || powerOf(pos.turn) !== 'DeathTouch') return '';
  const s = m.captures[0], df = file(s) - file(m.from), dr = rank(s) - rank(m.from);
  if (Math.max(Math.abs(df), Math.abs(dr)) !== 2) return '';
  if (pos.board[(m.from + s) >> 1]) return 'over a piece';
  if (RULES.deathTouchReachOrtho && df !== 0 && dr !== 0) return 'diagonal';
  if (RULES.deathTouchReachNoBack && dr * (pos.turn === WHITE ? 1 : -1) < 0) return 'backward';
  if (RULES.deathTouchReachForwardBack && df !== 0) return 'sideways';
  if (RULES.deathTouchReachPieces && typeOf(pos.board[s]) === P) return 'a pawn';
  return '';
}

describe('random games under the Death Touch trims', () => {
  const sets: [PowerName | null, PowerName | null, Partial<Rules>][] = [
    ['DeathTouch', 'DeathTouch', { deathTouchReachNoBack: true }],
    ['DeathTouch', 'Mercy', { deathTouchReachForwardBack: true, mercyAura: true }],
    ['Darkness', 'DeathTouch', { deathTouchReachPieces: true, darknessMoves: true }],
    ['DeathTouch', 'DeathTouch', { deathTouchReachNoBack: true, deathTouchReachForwardBack: true, deathTouchReachPieces: true }],
  ];
  it('the engine and the search offer the same legal moves, every shot obeys the trims, and the keys stay in step', () => {
    let seed = 1414;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const reach = { deathTouchReach: true, deathTouchReachOrtho: true };
    let reachSeen = 0, dropped = 0;
    for (let g = 0; g < sets.length * 6; g++) {
      const [w, b, more] = sets[g % sets.length];
      let pos = startPosition(randomBackRank(rng));
      for (let ply = 0; ply < 100; ply++) {
        powers(w, b, { ...reach, ...more, deathTouchReachNoBack: false, deathTouchReachForwardBack: false, deathTouchReachPieces: false });
        const before = lans(pos);
        powers(w, b, { ...reach, ...more });
        if (status(pos) !== 'playing') break;
        const moves = legalMoves(pos);
        const engine = lans(pos, moves);
        dropped += before.filter(l => !engine.includes(l)).length;
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(false);
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(true);
        for (const m of moves) {
          expect(touchObeys(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toBe('');
          if (m.to === m.from && m.captures.length && Math.max(Math.abs(file(m.captures[0]) - file(m.from)), Math.abs(rank(m.captures[0]) - rank(m.from))) === 2) reachSeen++;
        }
        // Half the turns take something, so the board opens and the kings meet.
        const takes = moves.filter(x => x.captures.length);
        const pick = takes.length && rng() < 0.5 ? takes : moves, m = pick[Math.floor(rng() * pick.length)];
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        pos = next;
      }
    }
    // The games reach the trims (2026-10-03: 140 two-square shots offered, 37 moves the trims
    // dropped), so the checks above are not vacuous.
    expect(reachSeen).toBeGreaterThan(60);
    expect(dropped).toBeGreaterThan(15);
  }, 120_000);
});

const NEW: [keyof Rules, PowerName][] = [
  ['hasteApart', 'Haste'], ['hasteNoThreat', 'Haste'], ['hasteNoForward', 'Haste'], ['hasteNoCheck', 'Haste'],
  ['mercyAuraPawnsTake', 'Mercy'], ['mercyTakesPawns', 'Mercy'], ['mercyNoJump', 'Mercy'],
  ['darknessShelter', 'Darkness'], ['darknessShelterPawnsTake', 'Darkness'],
  ['deathTouchReachNoBack', 'DeathTouch'], ['deathTouchReachForwardBack', 'DeathTouch'], ['deathTouchReachPieces', 'DeathTouch'],
];

describe('the new readings as tournament variants', () => {
  it('each parses as a rule, is off by default and belongs to its own power only', () => {
    const r = setRules();
    for (const [key, power] of NEW) {
      expect(parseRule(`${key}=true`)).toEqual({ [key]: true });
      expect(r[key], key).toBe(false);
      expect(RULE_POWERS[key], key).toEqual([power]);
    }
  });
});

/** Is the piece on `s` next to its own king (`diagOnly`: diagonally)? */
function nextToOwnKing(board: Uint8Array, s: number, diagOnly: boolean): boolean {
  const own = colorOf(board[s]);
  for (let t = 0; t < 64; t++) {
    if (board[t] !== piece(K, own)) continue;
    const df = Math.abs(file(t) - file(s)), dr = Math.abs(rank(t) - rank(s));
    if (Math.max(df, dr) === 1 && (!diagOnly || (df === 1 && dr === 1))) return true;
  }
  return false;
}

/** The new rules, checked from outside the generator on one legal move `m` of `pos`. */
function obeys(pos: Position, m: Move): string {
  const c = pos.turn, o = (c ^ 1) as Color, next = makeMove(pos, m);
  const pawn = typeOf(pos.board[m.from]) === P;
  for (const s of m.captures) {
    const v = pos.board[s], side = colorOf(v);
    if (typeOf(v) === K) continue;
    if (powerOf(side) === 'Darkness' && RULES.darknessShelter && nextToOwnKing(pos.board, s, true) && !(RULES.darknessShelterPawnsTake && pawn)) return 'darkness shelter';
    if (powerOf(side) === 'Mercy' && RULES.mercyAura && nextToOwnKing(pos.board, s, false) && !(RULES.mercyAuraPawnsTake && pawn)) return 'mercy shelter';
  }
  if (m.pass) return '';
  const hasteMove = m.power === 'haste' || pos.haste !== undefined;
  if (hasteMove && RULES.hasteNoCheck && inCheck(next, o)) return 'haste check';
  if (pos.haste === undefined) return '';
  if (RULES.hasteNoForward && (rank(m.to) - rank(m.from)) * (c === WHITE ? 1 : -1) > 0) return 'haste forward';
  if (RULES.hasteApart) for (let t = 0; t < 64; t++) {
    const v = next.board[t];
    if (v && colorOf(v) === o && Math.max(Math.abs(file(t) - file(m.to)), Math.abs(rank(t) - rank(m.to))) === 1) return 'haste apart';
  }
  return '';
}

describe('random games under the new readings', () => {
  const sets: [PowerName | null, PowerName | null, Partial<Rules>][] = [
    // Unlimited Haste (0 uses), so most games hold many Haste turns.
    ['Haste', 'Darkness', { hasteUses: 0, hasteCaptures: false, hasteApart: true, darknessMoves: true, darknessShelter: true }],
    ['Haste', 'Mercy', { hasteUses: 0, hasteCaptures: false, hasteNoThreat: true, mercyAura: true, mercyAuraPawnsTake: true, mercyTakesPawns: true }],
    ['Darkness', 'Haste', { hasteUses: 0, hasteCaptures: false, hasteNoForward: true, hasteNoCheck: true, darknessShelter: true, darknessShelterPawnsTake: true }],
    ['Mercy', 'Haste', { hasteUses: 0, hasteApart: true, hasteNoThreat: true, hasteNoForward: true, hasteNoCheck: true, mercyAura: true, mercyNoJump: true }],
    ['Mercy', 'Darkness', { mercyAura: true, mercyAuraPawnsTake: true, mercyTakesPawns: true, mercyNoJump: true, darknessShelter: true }],
    ['Strike', 'Darkness', { darknessShelter: true, darknessShelterPawnsTake: true }],
    [null, 'Darkness', { hands: [['Strike', 'Leap', 'Haste', 'Haste'], []], markFree: true, hasteCaptures: false, hasteApart: true, hasteNoCheck: true, darknessShelter: true }],
  ];
  it('the engine and the search offer the same legal moves, every move obeys the readings, and the keys stay in step', () => {
    let seed = 2026;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const off = Object.fromEntries(NEW.map(([key]) => [key, false])) as Partial<Rules>;
    let hasteTurns = 0, dropped = 0, droppedTakes = 0, added = 0;
    for (let g = 0; g < sets.length * 3; g++) {
      const [w, b, more] = sets[g % sets.length];
      let pos = startPosition(randomBackRank(rng));
      for (let ply = 0; ply < 70; ply++) {
        // What the new readings change here: the moves they drop and the ones they add.
        setRules({ kings: [k(w), k(b)], ...more, ...off });
        const before = new Set(lans(pos));
        setRules({ kings: [k(w), k(b)], ...more });
        if (status(pos) !== 'playing') break;
        const moves = legalMoves(pos);
        const engine = lans(pos, moves);
        const gone = [...before].filter(l => !engine.includes(l));
        dropped += gone.length;
        droppedTakes += gone.filter(l => l.includes('x')).length;
        added += engine.filter(l => !before.has(l)).length;
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(false);
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(true);
        if (pos.haste !== undefined) { hasteTurns++; expect(engine, toFen(pos)).toContain('--'); }
        for (const m of moves) expect(obeys(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toBe('');
        const powered = moves.filter(m => m.power || m.pass);
        const m = powered.length && rng() < 0.4 ? powered[Math.floor(rng() * powered.length)] : moves[Math.floor(rng() * moves.length)];
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        pos = next;
      }
    }
    // The games reach the readings (2026-10-03: 219 Haste turns, 758 moves dropped, 83 of them
    // captures, 22 added), so the checks above are not vacuous.
    expect(hasteTurns).toBeGreaterThan(100);
    expect(dropped).toBeGreaterThan(300);
    expect(droppedTakes).toBeGreaterThan(30);
    expect(added).toBeGreaterThan(5);
  }, 120_000);
});
