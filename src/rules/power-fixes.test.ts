/**
 * Balance-lab readings of three kings' powers (2026-10-03), each a toggle that is off in every
 * official set: Haste's limits on its moves (`hasteApart`, `hasteNoThreat`, `hasteNoForward`,
 * `hasteNoCheck`), Mercy's trims (`mercyAuraPawnsTake`, `mercyTakesPawns`, `mercyNoJump`) and
 * Darkness's diagonal shelter (`darknessShelter`, `darknessShelterPawnsTake`). The attack mirror for
 * the shelters is cross-checked in rules.test.ts.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  BLACK, Color, K, Move, P, Position, WHITE, colorOf, file, inCheck, isAttacked, legalMoves, makeMove, parseSq, piece, powerOf, rank, status, typeOf,
} from './engine';
import { fromFen, randomBackRank, startPosition, toFen, toLan } from './setup';
import { KingChoice, PowerName, RULES, Rules, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, searchLegal, setFastLegality } from '../ai/search';
import { RULE_POWERS } from '../sim/tournament';
import { powerText } from '../powers-ui';

const KING_OF: Partial<Record<PowerName, KingChoice['king']>> = { Haste: 'Flame', Strike: 'Flame', Mercy: 'Spirit', Darkness: 'Shadow' };
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

const NEW: [keyof Rules, PowerName][] = [
  ['hasteApart', 'Haste'], ['hasteNoThreat', 'Haste'], ['hasteNoForward', 'Haste'], ['hasteNoCheck', 'Haste'],
  ['mercyAuraPawnsTake', 'Mercy'], ['mercyTakesPawns', 'Mercy'], ['mercyNoJump', 'Mercy'],
  ['darknessShelter', 'Darkness'], ['darknessShelterPawnsTake', 'Darkness'],
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
