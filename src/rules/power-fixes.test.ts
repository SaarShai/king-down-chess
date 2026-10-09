/**
 * Balance-lab readings of three kings' powers (2026-10-03), each a toggle that is off in every
 * official set: Haste's limits on its moves (`hasteApart`, `hasteNoThreat`, `hasteNoForward`,
 * `hasteNoCheck`), Mercy's trims (`mercyAuraPawnsTake`, `mercyTakesPawns`, `mercyNoJump`) and
 * Darkness's diagonal shelter (`darknessShelter`, `darknessShelterPawnsTake`). The attack mirror for
 * the shelters is cross-checked in rules.test.ts. Death Touch's trims of its two-square reach
 * (`deathTouchReachNoBack`, `deathTouchReachForwardBack`, `deathTouchReachPieces`, round 14) are
 * cross-checked here. Mercy's M2 (`mercyAuraPawnsTake`, `mercyTakesPawns`) is official since
 * 2026-10-03. Round 16 adds three one-sentence Darkness readings (`darknessPawnArmor`,
 * `darknessAuraPawns`, `darknessKingStep2`), and round 17 two more versions of the king step
 * (`darknessKingStepSafe`, `darknessKingStepTakes`). The king step is official since 2026-10-04.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  B, BLACK, Color, K, Move, N, P, PieceType, Position, Q, R, WHITE, colorOf, file, genPiece, inCheck, isAttacked, legalMoves, makeMove, parseSq, piece, powerOf, rank,
  sqName, status, typeOf,
} from './engine';
import { fromFen, randomBackRank, startPosition, toFen, toLan } from './setup';
import { KingChoice, POWERS_BALANCED, PowerName, RULES, RULES_2017, RULES_2021, Rules, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, searchLegal, setFastLegality } from '../ai/search';
import { RULE_POWERS } from '../sim/tournament';
import { powerText } from '../powers-ui';

const KING_OF: Partial<Record<PowerName, KingChoice['king']>> = { IceWall: 'Frost', Haste: 'Flame', Strike: 'Flame', March: 'Mud', HolyLight: 'Spirit', Mercy: 'Spirit', Darkness: 'Shadow', DeathTouch: 'Shadow' };
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

  it('the official Mercy is M2 (owner, 2026-10-03): pawns take in the shelter, and the king takes pawns', () => {
    setRules({ ...POWERS_BALANCED, kings: [k('Mercy'), null] });
    expect(RULES.mercyAura && RULES.mercyAuraPawnsTake && RULES.mercyTakesPawns).toBe(true);
    const moves = lans(fromFen(fen));
    expect(moves).toContain('c4xd3');
    expect(moves).not.toContain('Rd8xd3');
    expect(moves).toContain('Ba4xb3'); // b3 is not next to the king
    expect(lans(play(fromFen('7k/8/8/8/2p5/3N4/4K3/8 b - - 0 1'), 'c4xd3'))).toContain('Ke2xd3');
    expect(lans(fromFen('k7/8/8/8/3Kn3/8/8/8 w - - 0 1'))).not.toContain('Kd4xe4'); // no piece but a pawn or a guard
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

describe('Darkness readings, round 16: one sentence each (owner, 2026-10-03)', () => {
  const dark = (more: Partial<Rules> = {}): void => powers('Darkness', null, { darknessMoves: true, ...more });

  it('darknessPawnArmor: enemy pawns cannot take your pawns; any other piece still can', () => {
    // White Darkness pawn d4 and knight f4; Black pawn e5 (it takes d4 or f4) and knight b5 (it takes d4).
    const fen = '7k/8/8/1n2p3/3P1N2/8/8/K7 b - - 0 1';
    dark();
    expect(lans(fromFen(fen))).toEqual(expect.arrayContaining(['e5xd4', 'e5xf4', 'Nb5xd4']));
    dark({ darknessPawnArmor: true });
    const moves = lans(fromFen(fen));
    expect(moves).not.toContain('e5xd4');
    expect(moves).toEqual(expect.arrayContaining(['e5xf4', 'Nb5xd4'])); // a pawn takes a piece, a knight takes the pawn
    const pawnOnly = fromFen('7k/8/8/4p3/3P4/8/8/K7 b - - 0 1');
    expect(isAttacked(pawnOnly.board, sq('d4'), BLACK)).toBe(false);
    expect(inCheck(fromFen('7k/8/8/8/8/3p4/4K3/8 w - - 0 1'))).toBe(true); // the king is no pawn: a pawn still gives check
    // Your pawns still take enemy pawns (straight ahead, under Darkness).
    expect(lans(fromFen('7k/8/8/3p4/3P4/8/8/K7 w - - 0 1'))).toContain('d4xd5');
    dark();
    expect(isAttacked(pawnOnly.board, sq('d4'), BLACK)).toBe(true);
    // Only the Darkness side's pawns: with Black's Darkness, White's pawn d4 may not take e5, and
    // Black's pawn d5 still takes White's d4.
    powers(null, 'Darkness', { darknessMoves: true, darknessPawnArmor: true });
    expect(lans(fromFen('7k/8/8/4p3/3P4/8/8/K7 w - - 0 1'))).not.toContain('d4xe5');
    expect(lans(fromFen('7k/8/8/3p4/3P4/8/8/K7 b - - 0 1'))).toContain('d5xd4');
  });

  it('darknessAuraPawns: enemy pawns cannot take your pieces next to your king', () => {
    // White Darkness king e2; knights d3 (diagonal), e3 (in front) and b3 (not next to it), pawn f2
    // (beside); Black pawns c4, f4 and g3, rooks d8 and e8.
    const fen = '3rr2k/8/8/8/2p2p2/1N1NN1p1/4KP2/8 b - - 0 1';
    dark();
    expect(lans(fromFen(fen))).toEqual(expect.arrayContaining(['c4xd3', 'f4xe3', 'g3xf2', 'c4xb3', 'Rd8xd3', 'Re8xe3']));
    dark({ darknessAuraPawns: true });
    const moves = lans(fromFen(fen));
    for (const l of ['c4xd3', 'f4xe3', 'g3xf2']) expect(moves).not.toContain(l); // all 8 neighbours, a pawn too
    expect(moves).toEqual(expect.arrayContaining(['c4xb3', 'Rd8xd3', 'Re8xe3'])); // further away, or not a pawn
    const board = fromFen(fen).board;
    expect(isAttacked(board, sq('f2'), BLACK)).toBe(false); // only the pawn g3 reaches it
    expect(isAttacked(board, sq('d3'), BLACK)).toBe(true);  // the rook d8
    expect(isAttacked(board, sq('b3'), BLACK)).toBe(true);  // the pawn c4
    expect(inCheck(fromFen('7k/8/8/8/8/3p4/4K3/8 w - - 0 1'))).toBe(true); // the king itself is not covered
    // `darknessShelter` takes precedence: d3 is out of every capture, e3 and f2 out of none.
    dark({ darknessShelter: true, darknessAuraPawns: true });
    const both = lans(fromFen(fen));
    expect(both).not.toContain('Rd8xd3');
    expect(both).not.toContain('c4xd3');
    expect(both).toEqual(expect.arrayContaining(['f4xe3', 'g3xf2']));
    // Black's Darkness does not cover White's pieces: Black's pawn e4 takes the knight e3 straight ahead.
    powers(null, 'Darkness', { darknessAuraPawns: true });
    expect(lans(fromFen('7k/8/8/8/4p3/4N3/4K3/8 b - - 0 1'))).toContain('e4xe3');
  });

  it('darknessKingStep2: the king may also step two squares in a straight line, over an empty square, to an empty square', () => {
    const open = fromFen('7k/8/8/8/3K4/8/8/8 w - - 0 1');
    const one = ['Kd4-c3', 'Kd4-c4', 'Kd4-c5', 'Kd4-d3', 'Kd4-d5', 'Kd4-e3', 'Kd4-e4', 'Kd4-e5'];
    dark();
    expect(lans(open)).toEqual([...one].sort());
    dark({ darknessKingStep2: true });
    expect(lans(open)).toEqual([...one, 'Kd4-b2', 'Kd4-b4', 'Kd4-b6', 'Kd4-d2', 'Kd4-d6', 'Kd4-f2', 'Kd4-f4', 'Kd4-f6'].sort());
    // White pawn d5 and knight b4, Black knight e5 and pawn f2: the step passes over no piece and lands on none.
    const moves = lans(fromFen('7k/8/8/3Pn3/1N1K4/8/5p2/8 w - - 0 1'));
    expect(moves).not.toContain('Kd4-d6'); // over its own pawn (a Mercy king jumps it)
    expect(moves).not.toContain('Kd4-f6'); // over the enemy knight ...
    expect(moves).toContain('Kd4xe5');     // ... which it takes as before
    expect(moves.filter(l => /^Kd4.(b4|f2)$/.test(l))).toEqual([]); // onto a piece: never, so it never captures
    expect(moves).toEqual(expect.arrayContaining(['Kd4-b2', 'Kd4-b6', 'Kd4-d2', 'Kd4-f4']));
    // A move only: it adds no attacked square, so a king two squares away is not in check.
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 b - - 0 1'))).toBe(false);
    expect(isAttacked(fromFen('8/8/3n4/8/3K4/8/8/k7 b - - 0 1').board, sq('d6'), WHITE)).toBe(false);
    // The king may not end in check: the Black rook a6 holds rank 6. The middle square may be attacked.
    const check = lans(fromFen('7k/8/r7/8/3K4/8/8/8 w - - 0 1'));
    for (const l of ['Kd4-b6', 'Kd4-d6', 'Kd4-f6']) expect(check).not.toContain(l);
    expect(check).toEqual(expect.arrayContaining(['Kd4-b4', 'Kd4-d2', 'Kd4-f4']));
    expect(lans(fromFen('7k/8/8/r7/3K4/8/8/8 w - - 0 1'))).toContain('Kd4-d6'); // over d5, which the rook a5 holds
    // Black's Darkness king steps too; White's plain king does not.
    powers(null, 'Darkness', { darknessKingStep2: true });
    expect(lans(fromFen('8/8/8/4k3/8/8/8/K7 b - - 0 1'))).toEqual(expect.arrayContaining(['Ke5-e3', 'Ke5-c7', 'Ke5-g5']));
    expect(lans(open)).toEqual([...one].sort());
  });

  it('the official Darkness has the king step (owner, 2026-10-04): over an attacked square too, never onto a piece', () => {
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null] });
    expect(RULES.darknessMoves && RULES.darknessKingStep2).toBe(true);
    expect(RULES.darknessKingStepSafe || RULES.darknessKingStepTakes).toBe(false);
    expect(lans(fromFen('7k/8/8/r7/3K4/8/8/8 w - - 0 1'))).toContain('Kd4-d6'); // over d5, which the rook a5 holds
    expect(lans(fromFen('7k/8/3n4/8/3K4/8/8/8 w - - 0 1')).filter(l => l.startsWith('Kd4') && l.endsWith('d6'))).toEqual([]); // no take
    expect(powerText('Darkness')).toBe('your pawns may also step diagonally, and take only straight ahead; your king may also step two squares in a straight line, over an empty square');
    // An older preset plays the printed Darkness: it overrides the official readings, as main.ts applies them.
    for (const preset of [RULES_2017, RULES_2021]) {
      setRules({ ...POWERS_BALANCED, ...preset, kings: [{ king: 'Shadow', power: 'Darkness' }, null] });
      expect(RULES.darknessKingStep2 || RULES.darknessMoves).toBe(false);
      expect(lans(fromFen('7k/8/8/8/3K4/8/8/8 w - - 0 1')).filter(far)).toEqual([]);
    }
  });

  /** A king move of two squares (`Kd4-d6`, `Kd4xd6`): the step, and under `darknessKingStepTakes` the take. */
  const far = (l: string): boolean => l[0] === 'K' && Math.max(Math.abs(l.charCodeAt(1) - l.charCodeAt(4)), Math.abs(l.charCodeAt(2) - l.charCodeAt(5))) === 2;
  const step2 = { darknessKingStep2: true }, safe = { ...step2, darknessKingStepSafe: true }, takes = { ...step2, darknessKingStepTakes: true };

  it('darknessKingStepSafe (round 17): the step may not pass over a square an enemy attacks', () => {
    // The Black rook a5 holds rank 5, so the steps over c5, d5 and e5 go; the pawn e3 is still taken.
    const rook = fromFen('7k/8/8/r7/3K4/4p3/8/8 w - - 0 1');
    dark(step2);
    const before = lans(rook);
    expect(before.filter(far)).toEqual(['Kd4-b2', 'Kd4-b4', 'Kd4-b6', 'Kd4-d6', 'Kd4-f4', 'Kd4-f6']);
    dark(safe);
    expect(lans(rook).filter(far)).toEqual(['Kd4-b2', 'Kd4-b4', 'Kd4-f4']);
    expect(lans(rook).filter(l => !far(l))).toEqual(before.filter(l => !far(l))); // the one-square steps and Kd4xe3
    expect(before).toContain('Kd4xe3');
    // A knight (e1 holds d3), a pawn (f5 holds e4) and an archer through a blocker (c6 shoots c4 over
    // the pawn c5, and holds e4 as well): each takes away the steps over the squares it holds.
    const cases: [string, string, string[]][] = [
      ['7k/8/8/8/3K4/8/8/4n3 w - - 0 1', 'd3', ['Kd4-d2']],
      ['7k/8/8/5p2/3K4/8/8/8 w - - 0 1', 'e4', ['Kd4-f4']],
      ['7k/8/2a5/2P5/3K4/8/8/8 w - - 0 1', 'c4', ['Kd4-b4', 'Kd4-f4']],
    ];
    for (const [fen, mid, gone] of cases) {
      const pos = fromFen(fen);
      dark(step2);
      const all = lans(pos);
      expect(all, fen).toEqual(expect.arrayContaining(gone));
      expect(isAttacked(pos.board, sq(mid), BLACK), fen).toBe(true);
      dark(safe);
      expect(lans(pos).filter(far), fen).toEqual(all.filter(l => far(l) && !gone.includes(l)));
      expect(lans(pos).filter(l => !far(l)), fen).toEqual(all.filter(l => !far(l)));
    }
    // On an open board every step stays.
    const open = fromFen('7k/8/8/8/3K4/8/8/8 w - - 0 1');
    dark(safe);
    expect(lans(open).filter(far)).toHaveLength(8);
    // The test reads the board before the move, the king still on its square: the catapult d1 lobs
    // over the king onto d5, so the step to d6 goes, though d6 itself is safe.
    const lob = fromFen('7k/8/8/8/3K4/8/8/3c4 w - - 0 1');
    expect(lans(lob)).not.toContain('Kd4-d6');
    dark(step2);
    expect(lans(lob)).toContain('Kd4-d6');
    dark(safe);
    // It adds no attacked square, and a king two squares away is not in check.
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 b - - 0 1'))).toBe(false);
  });

  it('darknessKingStepTakes (round 17): the step may also end on an enemy piece and take it', () => {
    const knight = fromFen('7k/8/3n4/8/3K4/8/8/8 w - - 0 1');
    dark(step2);
    expect(lans(knight)).not.toContain('Kd4xd6');
    expect(isAttacked(knight.board, sq('d6'), WHITE)).toBe(false);
    dark(takes);
    expect(lans(knight)).toContain('Kd4xd6');
    expect(isAttacked(knight.board, sq('d6'), WHITE)).toBe(true);
    expect(lans(knight).filter(l => far(l) && l.includes('-'))).toHaveLength(7); // the steps stay
    // Not over a piece of either side (the pawn c5, the knight e5, which it takes as before).
    const over = lans(fromFen('7k/8/1n3n2/2P1n3/3K4/8/8/8 w - - 0 1'));
    expect(over).not.toContain('Kd4xb6');
    expect(over).not.toContain('Kd4xf6');
    expect(over).toContain('Kd4xe5');
    // Not into check: the rook d8 guards d6.
    expect(lans(fromFen('3r3k/8/3n4/8/3K4/8/8/8 w - - 0 1'))).not.toContain('Kd4xd6');
    // Not a sheltered piece. Mercy's aura: the knight d6 stands next to the Mercy king d7 (which takes no king).
    const mercyNext = fromFen('8/3k4/3n4/8/3K4/8/8/8 w - - 0 1');
    powers('Darkness', 'Mercy', { darknessMoves: true, ...takes });
    expect(lans(mercyNext)).toContain('Kd4xd6');
    powers('Darkness', 'Mercy', { darknessMoves: true, ...takes, mercyAura: true, mercyAuraPawnsTake: true });
    expect(lans(mercyNext)).not.toContain('Kd4xd6');
    expect(isAttacked(mercyNext.board, sq('d6'), WHITE)).toBe(false);
    // Holy Light's shelter: the knight d6 in front of the Holy Light king d7 (pseudo-moves, since that king gives check).
    const takesOf = (pos: Position): string[] => { const out: Move[] = []; genPiece(pos.board, sq('d4'), 'all', out); return lans(pos, out.filter(m => m.captures.length)); };
    powers('Darkness', 'HolyLight', { darknessMoves: true, ...takes });
    expect(takesOf(mercyNext)).toEqual(['Kd4xd6']);
    powers('Darkness', 'HolyLight', { darknessMoves: true, ...takes, holyLightShelter: true, holyLightShelterOrtho: true });
    expect(takesOf(mercyNext)).toEqual([]);
    expect(isAttacked(mercyNext.board, sq('d6'), WHITE)).toBe(false);
    // Not a piece the enemy's Ice Wall wards, like the adjacent capture.
    const warded = fromFen('7k/8/3n4/4n3/3K4/8/8/8 w - - 0 1');
    powers('Darkness', 'IceWall', { darknessMoves: true, ...takes });
    expect(lans(warded)).toEqual(expect.arrayContaining(['Kd4xd6', 'Kd4xe5']));
    expect(lans({ ...warded, marks: [undefined, { sq: sq('d6') }] })).not.toContain('Kd4xd6');
    expect(lans({ ...warded, marks: [undefined, { sq: sq('e5') }] })).not.toContain('Kd4xe5');
    // The take gives check to a king two squares away, not over a blocked middle square, so that king
    // may not step there either.
    dark(takes);
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 b - - 0 1'))).toBe(true);
    expect(inCheck(fromFen('8/8/3k4/3p4/3K4/8/8/8 b - - 0 1'))).toBe(false);
    expect(lans(fromFen('8/3k4/8/8/3K4/8/8/8 b - - 0 1'))).not.toContain('Kd7-d6');
    dark(step2);
    expect(lans(fromFen('8/3k4/8/8/3K4/8/8/8 b - - 0 1'))).toContain('Kd7-d6');
    // A piece between a king and an enemy Darkness king two squares away is pinned, and the search's
    // fast legality path sees it: the knight d5 may not move.
    const pinned = fromFen('8/8/3k4/3N4/3K4/8/8/8 w - - 0 1');
    powers(null, 'Darkness', { darknessMoves: true, ...step2 });
    expect(lans(pinned).filter(l => l[0] === 'N')).toHaveLength(8);
    powers(null, 'Darkness', { darknessMoves: true, ...takes });
    expect(lans(pinned).filter(l => l[0] === 'N')).toEqual([]);
    expect(lans(pinned, searchLegal(pinned))).toEqual(lans(pinned));
    // It takes precedence over the safe step: with both on, the rook a5 no longer stops the steps over rank 5.
    dark({ ...takes, darknessKingStepSafe: true });
    expect(lans(fromFen('7k/8/8/r7/3K4/4p3/8/8 w - - 0 1')).filter(far)).toEqual(['Kd4-b2', 'Kd4-b4', 'Kd4-b6', 'Kd4-d6', 'Kd4-f4', 'Kd4-f6']);
  });

  it('the round-17 readings need the king step and a Darkness king; the other side is unaffected', () => {
    const fens = ['7k/8/3n4/8/3K4/8/8/8 w - - 0 1', '7k/8/8/r7/3K4/4p3/8/8 w - - 0 1', '7k/8/3g4/8/3K4/8/8/8 w - - 0 1'];
    const both = { darknessKingStepSafe: true, darknessKingStepTakes: true };
    for (const fen of fens) {
      const pos = fromFen(fen);
      dark();
      const plain = lans(pos);
      dark(both); // no `darknessKingStep2`: nothing
      expect(lans(pos), fen).toEqual(plain);
      // A Mercy king keeps its own step: it takes no guard two squares away and steps over d5 under the rook.
      for (const power of ['Mercy', null] as const) {
        powers(power, null, {});
        const own = lans(pos);
        powers(power, null, { ...step2, ...both });
        expect(lans(pos), `${fen} ${power}`).toEqual(own);
      }
    }
    dark(both);
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 b - - 0 1'))).toBe(false); // and no attack
    // Black's Darkness: its king takes two squares away, White's plain king does not.
    powers(null, 'Darkness', { darknessMoves: true, ...takes });
    expect(lans(fromFen(fens[0]))).not.toContain('Kd4xd6');
    expect(lans(fromFen('8/8/8/4k3/8/4N3/8/K7 b - - 0 1'))).toContain('Ke5xe3');
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 b - - 0 1'))).toBe(false);
    expect(inCheck(fromFen('8/8/3k4/8/3K4/8/8/8 w - - 0 1'))).toBe(true);
  });

  it('on random boards each reading changes exactly what its sentence says, no more and no less', () => {
    // From the moves with the reading off: the armour and the aura drop the pawn captures they name,
    // and the step adds every straight two-square king step over and onto an empty square that does
    // not end in check; the safe step only those over a square the enemy does not attack, and the
    // take also those onto an enemy piece that no shelter covers (and the enemy's take may drop our
    // moves). `obeys` (below) checks only the moves offered; this also finds a missing one.
    let seed = 1604;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const dark: KingChoice = { king: 'Shadow', power: 'Darkness' };
    const types: PieceType[] = [P, P, P, N, B, R, Q];
    const near = (a: number, b: number): boolean => a !== b && Math.max(Math.abs(file(a) - file(b)), Math.abs(rank(a) - rank(b))) === 1;
    const diag = (a: number, b: number): boolean => Math.abs(file(a) - file(b)) === 1 && Math.abs(rank(a) - rank(b)) === 1;
    const changed = { darknessPawnArmor: 0, darknessAuraPawns: 0, darknessKingStep2: 0, darknessKingStepSafe: 0, darknessKingStepTakes: 0 };
    const STEPS: readonly string[] = ['darknessKingStep2', 'darknessKingStepSafe', 'darknessKingStepTakes'];
    const seen = { refused: 0, taken: 0, dropped: 0 }; // safe steps refused, takes offered, our moves the enemy's take drops
    for (let trial = 0; trial < 4000; trial++) {
      const board = new Uint8Array(64);
      const kw = Math.floor(rng() * 64);
      let kb = kw;
      while (Math.max(Math.abs(file(kb) - file(kw)), Math.abs(rank(kb) - rank(kw))) < 2) kb = Math.floor(rng() * 64);
      board[kw] = piece(K, WHITE); board[kb] = piece(K, BLACK);
      for (let s = 0; s < 64; s++) {
        if (board[s] || rng() < 0.6) continue;
        const t = types[Math.floor(rng() * types.length)];
        if (t !== P || (s >= 8 && s < 56)) board[s] = piece(t, rng() < 0.5 ? WHITE : BLACK);
      }
      const pos: Position = { board, turn: (rng() < 0.5 ? WHITE : BLACK) as Color, halfmove: 0, ply: 0 };
      const c = pos.turn, o = (c ^ 1) as Color;
      const kings: Rules['kings'] = rng() < 0.3 ? [dark, dark] : rng() < 0.5 ? [dark, null] : [null, dark];
      const base: Partial<Rules> = { kings, darknessMoves: rng() < 0.7, darknessShelter: rng() < 0.2 };
      // The side not to move may not be in check, under the take too (it only adds attacks).
      setRules({ ...base, darknessKingStep2: true, darknessKingStepTakes: true });
      if (inCheck(pos, o)) continue;
      setRules(base);
      const offMoves = legalMoves(pos), off = lans(pos, offMoves);
      const ko = board.indexOf(piece(K, o));
      for (const key of Object.keys(changed) as (keyof typeof changed)[]) {
        setRules({ ...base, darknessKingStep2: STEPS.includes(key), [key]: true });
        let expected = off;
        if (STEPS.includes(key)) {
          const takes = key === 'darknessKingStepTakes';
          const kept = takes ? offMoves.filter(m => !inCheck(makeMove(pos, m), c)) : offMoves;
          seen.dropped += offMoves.length - kept.length;
          const k = board.indexOf(piece(K, c)), steps: Move[] = [];
          if (powerOf(c) === 'Darkness') for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const f = file(k) + 2 * df, r = rank(k) + 2 * dr, mid = k + df + 8 * dr, to = k + 2 * (df + 8 * dr);
            if (f < 0 || f > 7 || r < 0 || r > 7 || board[mid]) continue;
            const v = board[to];
            // `base` holds one shelter: the enemy's Darkness shelter, the diagonal neighbours of its king.
            if (v && (!takes || colorOf(v) === c || (powerOf(o) === 'Darkness' && base.darknessShelter && diag(to, ko)))) continue;
            if (!v && key === 'darknessKingStepSafe' && isAttacked(board, mid, o)) { seen.refused++; continue; }
            const m: Move = { from: k, to, captures: v ? [to] : [] };
            if (!inCheck(makeMove(pos, m), c)) { steps.push(m); if (v) seen.taken++; }
          }
          expected = [...lans(pos, kept), ...lans(pos, steps)].sort();
        } else if (powerOf(o) === 'Darkness' && !(key === 'darknessAuraPawns' && base.darknessShelter)) {
          const named = (s: number): boolean => colorOf(board[s]) === o
            && (key === 'darknessPawnArmor' ? typeOf(board[s]) === P : typeOf(board[s]) !== K && near(s, ko));
          expected = lans(pos, offMoves.filter(m => !(typeOf(board[m.from]) === P && m.captures.some(named))));
        }
        const where = `${toFen(pos)} ${key} ${JSON.stringify(base)}`;
        expect(lans(pos), where).toEqual(expected);
        expect(lans(pos, searchLegal(pos)), where).toEqual(expected);
        if (expected.join() !== off.join()) changed[key]++;
      }
    }
    // Not vacuous (2026-10-04: 113, 25, 431, 252 and 594 boards; 1,114 safe steps refused, 158 takes,
    // 622 moves dropped by the enemy's take).
    expect(Math.min(...Object.values(changed), ...Object.values(seen))).toBeGreaterThan(15);
  });

  it('the rule text names each reading', () => {
    const base = 'your pawns may also step diagonally, and take only straight ahead';
    const r = (more: Partial<Rules>): Rules => setRules({ darknessMoves: true, ...more });
    expect(powerText('Darkness', r({}))).toBe(base);
    expect(powerText('Darkness', r({ darknessPawnArmor: true }))).toBe(`${base}; enemy pawns cannot take your pawns`);
    expect(powerText('Darkness', r({ darknessAuraPawns: true }))).toBe(`${base}; enemy pawns cannot take your pieces next to your king`);
    expect(powerText('Darkness', r({ darknessKingStep2: true }))).toBe(`${base}; your king may also step two squares in a straight line, over an empty square`);
    expect(powerText('Darkness', r({ darknessKingStep2: true, darknessKingStepSafe: true }))).toBe(`${base}; your king may also step two squares in a straight line, over an empty square that no enemy attacks, to an empty square`);
    const take = `${base}; your king may also move two squares in a straight line over an empty square, and may take there`;
    expect(powerText('Darkness', r({ darknessKingStep2: true, darknessKingStepTakes: true }))).toBe(take);
    expect(powerText('Darkness', r({ darknessKingStep2: true, darknessKingStepTakes: true, darknessKingStepSafe: true }))).toBe(take);
    expect(powerText('Darkness', r({ darknessKingStepTakes: true, darknessKingStepSafe: true }))).toBe(base);
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
    let seed = 1415;
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
  ['darknessPawnArmor', 'Darkness'], ['darknessAuraPawns', 'Darkness'], ['darknessKingStep2', 'Darkness'],
  ['darknessKingStepSafe', 'Darkness'], ['darknessKingStepTakes', 'Darkness'],
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
    if (powerOf(side) === 'Darkness' && RULES.darknessPawnArmor && pawn && typeOf(v) === P) return 'darkness pawn armour';
    if (powerOf(side) === 'Darkness' && RULES.darknessAuraPawns && !RULES.darknessShelter && pawn && nextToOwnKing(pos.board, s, false)) return 'darkness aura';
  }
  // A two-square king move of a Darkness side is the step: under its toggle, straight, over an empty
  // square onto an empty one, taking nothing (a Haste may repeat it). Round 17: the safe step passes
  // over no square the enemy attacks; the take may end on an enemy piece and take only that.
  const df = file(m.to) - file(m.from), dr = rank(m.to) - rank(m.from);
  if (pos.board[m.from] === piece(K, c) && powerOf(c) === 'Darkness' && (!m.power || m.power === 'haste') && Math.max(Math.abs(df), Math.abs(dr)) === 2) {
    if (!RULES.darknessKingStep2) return 'darkness step';
    if ((df !== 0 && Math.abs(df) !== 2) || (dr !== 0 && Math.abs(dr) !== 2)) return 'darkness step: not straight';
    const mid = m.from + df / 2 + 8 * (dr / 2);
    if (pos.board[mid]) return 'darkness step: not empty';
    if (pos.board[m.to] || m.captures.length) {
      if (!RULES.darknessKingStepTakes || m.captures.join() !== String(m.to)) return 'darkness step: takes';
    } else if (RULES.darknessKingStepSafe && !RULES.darknessKingStepTakes && isAttacked(pos.board, mid, o)) return 'darkness step: over an attacked square';
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
    let seed = 2028;
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

describe('random games under the round-16 Darkness readings', () => {
  const m2 = { mercyAura: true, mercyAuraPawnsTake: true, mercyTakesPawns: true };
  const sets: [PowerName | null, PowerName | null, Partial<Rules>][] = [
    ['Darkness', 'Haste', { darknessMoves: true, darknessPawnArmor: true, hasteUses: 0, hasteCaptures: false }],
    ['March', 'Darkness', { marchUses: 0, darknessMoves: true, darknessAuraPawns: true, darknessKingStep2: true }], // marching pawns meet the king sooner
    ['Darkness', 'Darkness', { darknessMoves: true, darknessKingStep2: true }],
    ['Strike', 'Darkness', { darknessMoves: true, darknessPawnArmor: true, darknessAuraPawns: true, darknessKingStep2: true }],
    ['Darkness', 'DeathTouch', { darknessMoves: true, darknessShelter: true, darknessAuraPawns: true, darknessKingStep2: true, deathTouchReach: true, deathTouchReachOrtho: true }],
    [null, 'Darkness', { hands: [['Strike', 'Haste'], []], markFree: true, hasteCaptures: false, darknessMoves: true, darknessPawnArmor: true, darknessKingStep2: true }],
    ['Mercy', 'Darkness', { ...m2, darknessMoves: true, darknessAuraPawns: true, darknessKingStep2: true }],
    // Round 17: the safe step, and the take (against itself, Mercy's shelter and a Haste's two moves).
    ['Darkness', 'Haste', { darknessMoves: true, darknessKingStep2: true, darknessKingStepSafe: true, hasteUses: 0, hasteCaptures: false }],
    ['Darkness', 'Darkness', { darknessMoves: true, darknessShelter: true, darknessKingStep2: true, darknessKingStepTakes: true }],
    ['Mercy', 'Darkness', { ...m2, darknessMoves: true, darknessKingStep2: true, darknessKingStepTakes: true }],
    ['Haste', 'Darkness', { hasteUses: 0, darknessMoves: true, darknessKingStep2: true, darknessKingStepTakes: true }],
  ];
  const off = { darknessPawnArmor: false, darknessAuraPawns: false, darknessKingStep2: false, darknessKingStepSafe: false, darknessKingStepTakes: false };
  it('the engine and the search offer the same legal moves, every move obeys the readings, and the keys stay in step', () => {
    let seed = 1616;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const dropped = sets.map(() => 0), added = sets.map(() => 0); // captures dropped, moves added, per set
    let farTakes = 0; // the Darkness king's two-square takes offered (round 17)
    for (let g = 0; g < sets.length * 8; g++) {
      const [w, b, more] = sets[g % sets.length];
      let pos = startPosition(randomBackRank(rng));
      for (let ply = 0; ply < 100; ply++) {
        setRules({ kings: [k(w), k(b)], ...more, ...off });
        const before = new Set(lans(pos));
        setRules({ kings: [k(w), k(b)], ...more });
        if (status(pos) !== 'playing') break;
        const moves = legalMoves(pos);
        const engine = lans(pos, moves);
        dropped[g % sets.length] += [...before].filter(l => !engine.includes(l) && l.includes('x')).length;
        added[g % sets.length] += engine.filter(l => !before.has(l)).length;
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(false);
        expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(engine);
        setFastLegality(true);
        for (const m of moves) expect(obeys(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toBe('');
        farTakes += moves.filter(x => typeOf(pos.board[x.from]) === K && x.captures.length && Math.max(Math.abs(file(x.to) - file(x.from)), Math.abs(rank(x.to) - rank(x.from))) === 2).length;
        // Half the turns take something, so the board opens and the kings come out.
        const takes = moves.filter(x => x.captures.length);
        const pick = takes.length && rng() < 0.5 ? takes : moves, m = pick[Math.floor(rng() * pick.length)];
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        pos = next;
      }
    }
    // The games reach the readings, so the checks above are not vacuous (2026-10-03: the armour alone
    // dropped 209 captures, the aura alone 14, and the king step added 590–1,384 moves a set; 2026-10-04,
    // round 17: 497–1,443 moves a set, and 93 two-square takes offered). The aura acts rarely in games
    // from the start; the random boards of legality.test.ts hold many.
    expect(dropped[0]).toBeGreaterThan(100);
    expect(dropped[1] + dropped[6]).toBeGreaterThan(5);
    expect(Math.min(...added.slice(1))).toBeGreaterThan(200);
    expect(farTakes).toBeGreaterThan(20);
  }, 120_000);

  it('without a Darkness king the readings change nothing', () => {
    let seed = 616;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const others: (PowerName | null)[] = [null, 'Mercy', 'HolyLight', 'DeathTouch', 'Haste', 'March'];
    for (let g = 0; g < 12; g++) {
      const w = others[g % others.length], b = others[(g * 5 + 1) % others.length];
      let pos = startPosition(randomBackRank(rng));
      for (let ply = 0; ply < 60 && status(pos) === 'playing'; ply++) {
        powers(w, b, off);
        const plain = lans(pos);
        powers(w, b, { darknessPawnArmor: true, darknessAuraPawns: true, darknessKingStep2: true, darknessKingStepTakes: g % 2 === 0, darknessKingStepSafe: true });
        expect(lans(pos), toFen(pos)).toEqual(plain);
        const moves = legalMoves(pos);
        pos = makeMove(pos, moves[Math.floor(rng() * moves.length)]);
      }
    }
  });
});
