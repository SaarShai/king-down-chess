// A designed piece in the engine (docs/specs/workshop-proving-ground ticket 16): `RULES.design` plays in the slot `T`.
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, K, P, SPENT, T, WHITE, colorOf, genPiece, inCheck, isAttacked, legalMoves, makeMove, parseSq, perft, piece, sqName, status, type Color, type GenMode, type Move, type PieceType, type Position } from './engine';
import { parseRule, setRules } from './rules';
import { fromFen, toFen, toLan } from './setup';
import type { DesignSpec, Rule, Square } from './design';
import { DIRS, KING_STEP, PRESETS, designCode, empty, fromPreset, limit, specOf, type PieceDesign } from '../workshop/model';
import { BLOCKS, whenChoices } from '../workshop/vocab';
import { BODY_TYPE } from '../workshop/moves';
import { searchLegal } from '../ai/search';

afterEach(() => setRules());

const key = (m: Move): string => [m.from, m.to, m.captures.join('.'), m.swap ? 's' : '', m.shove ? `${m.shove.from}>${m.shove.to}` : '', m.selfRemove ? 'x' : '', m.promo ?? ''].join(',');
const gen = (b: Uint8Array, from: number, mode: GenMode): string[] => { const out: Move[] = []; genPiece(b, from, mode, out); return out.map(key).sort(); };
// Mulberry32: the same boards every run.
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
const pick = <X>(r: () => number, xs: readonly X[]): X => xs[Math.floor(r() * xs.length)];
const TYPES: PieceType[] = [1, 1, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
const spec = (k: string, rules: Rule[] = []): DesignSpec => { const p = PRESETS.find(x => x.key === k)!; return specOf({ ...p, rules: [...p.rules, ...rules] }); };
/** A board with both kings and 4 to 17 pool pieces; `free` holds its empty squares. */
function board(r: () => number, types: readonly PieceType[] = TYPES, n = 4 + Math.floor(r() * 14)): { b: Uint8Array; take: () => number; free: number[] } {
  const b = new Uint8Array(64), free = [...Array(64).keys()], take = () => free.splice(Math.floor(r() * free.length), 1)[0];
  b[take()] = piece(K, WHITE); b[take()] = piece(K, BLACK);
  for (; n > 0; n--) { const t = pick(r, types), s = take(); if (t === P && (s < 8 || s >= 56)) { free.push(s); continue; } b[s] = piece(t, r() < 0.5 ? WHITE : BLACK); }
  return { b, take, free };
}
/** A random design that version 1 plays: inside the hard limits, never empty, no history When. */
function randomDesign(r: () => number): DesignSpec {
  const marks: Square['mark'][] = ['both', 'move', 'take', 'shoot', 'moveShoot'];
  for (;;) {
    const squares: Square[] = [];
    for (let i = Math.floor(r() * 7); i > 0; i--) {
      const x = Math.floor(r() * 7) - 3, y = Math.floor(r() * 7) - 3;
      if ((x || y) && !squares.some(s => s.x === x && s.y === y)) squares.push({ x, y, mark: pick(r, marks) });
    }
    const lines = DIRS.filter(() => r() < 0.2), rules: Rule[] = [];
    for (let i = Math.floor(r() * 4); i > 0; i--) {
      const b = pick(r, BLOCKS), { top, more } = whenChoices(b.a);
      rules.push({ when: pick(r, [b.rule.when, ...top, ...more]), does: b.pill ? { ...b.rule.does, [b.pill.key]: pick(r, b.pill.choices)[0] } as Rule['does'] : b.rule.does });
    }
    const d = { squares, lines, rules };
    if (!limit(d) && !empty(d) && !rules.some(x => ['fromMove', 'beforeMove', 'afterCard'].includes(x.when.on))) return specOf(d);
  }
}

describe('the design in the slot T', () => {
  it('plays each preset as its pool piece in all three modes on 500 random boards', () => {
    const r = rng(16);
    for (let i = 0; i < 500; i++) {
      const { b, take, free } = board(r);
      for (const p of PRESETS) {
        const at = take(), c = r() < 0.5 ? WHITE : BLACK;
        for (const mode of ['all', 'captures', 'attacks'] as const) {
          setRules();
          b[at] = piece(BODY_TYPE[p.body as keyof typeof BODY_TYPE], c);
          let want = gen(b, at, mode);
          // The Workshop's Maester never swaps with a king (its preset note: no long swap).
          if (p.key === 'maester') want = want.filter(k => !k.endsWith(',s,,,') || (b[+k.split(',')[1]] & 15) !== K);
          setRules({ design: specOf(p) });
          b[at] = piece(T, c);
          expect(gen(b, at, mode), `${p.key} ${mode} on board ${i}`).toEqual(want);
        }
        b[at] = 0; free.push(at);
      }
    }
  });

  it('keeps the perft numbers with the queen as T', () => {
    const fenT = (fen: string) => fen.split(' ').map((f, i) => (i === 0 ? f.replace(/q/g, 't').replace(/Q/g, 'T') : f)).join(' ');
    setRules({ design: spec('queen') });
    expect(perft(fromFen(fenT('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1')), 3)).toBe(8902);
    for (const fen of ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w - - 0 1', '4k3/8/8/3q4/8/8/2Q5/4K3 b - - 0 1']) {
      setRules();
      const want = perft(fromFen(fen), 2);
      setRules({ design: spec('queen') });
      expect(perft(fromFen(fenT(fen)), 2), fen).toBe(want);
    }
  });

  it('isAttacked agrees with genPiece("attacks") under seeded random designs', () => {
    const r = rng(1600);
    let shelters = 0;
    for (let trial = 0; trial < 400; trial++) {
      const d = randomDesign(r);
      setRules({ design: d });
      if (d.rules.some(x => x.does.a === 'cannotBeTaken' && x.when.on !== 'always')) shelters++;
      const b = new Uint8Array(64);
      for (let s = 0; s < 64; s++) {
        if (r() < 0.7) continue;
        const t = r() < 0.3 ? T : pick(r, [...TYPES, 6] as PieceType[]);
        if (t === P && (s < 8 || s >= 56)) continue;
        b[s] = piece(t, r() < 0.5 ? WHITE : BLACK) | (t === T && r() < 0.5 ? SPENT : 0); // half the designs have taken once
      }
      for (const by of [WHITE, BLACK] as const) {
        const out: Move[] = [];
        for (let s = 0; s < 64; s++) if (b[s] && colorOf(b[s]) === by) genPiece(b, s, 'attacks', out);
        const hit = new Set(out.map(m => m.captures[0]));
        for (let s = 0; s < 64; s++) if (b[s] && colorOf(b[s]) !== by) expect(isAttacked(b, s, by), `trial ${trial} ${sqName(s)} by ${by}`).toBe(hit.has(s));
      }
    }
    expect(shelters).toBeGreaterThan(0); // the random designs reach the shelter seam
  });

  it('the search plays the engine\'s legal moves with a design', () => {
    const r = rng(1601);
    let checked = 0, checks = 0;
    for (let trial = 0; trial < 1500; trial++) {
      setRules({ design: randomDesign(r) });
      const { b } = board(r, [...TYPES, T, T, T], 6 + Math.floor(r() * 14));
      const pos: Position = { board: b, turn: (r() < 0.5 ? WHITE : BLACK) as Color, halfmove: 0, ply: 0 };
      if (inCheck(pos, (pos.turn ^ 1) as Color)) continue;
      if (inCheck(pos)) checks++;
      expect(searchLegal(pos).map(m => toLan(pos, m)).sort(), toFen(pos)).toEqual(legalMoves(pos).map(m => toLan(pos, m)).sort());
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
    expect(checks).toBeGreaterThan(20);
  }, 120_000);

  it('gives mate; a design that cannot take a king never gives check', () => {
    setRules({ design: spec('queen') });
    expect(status(fromFen('7k/6T1/6K1/8/8/8/8/8 b - - 0 1'))).toBe('checkmate');
    setRules({ design: spec('rook') });
    expect(status(fromFen('T6k/8/6K1/8/8/8/8/8 b - - 0 1'))).toBe('checkmate');
    const noKing: Rule = { when: { on: 'always' }, does: { a: 'cannotTake', what: 'king' } };
    setRules({ design: spec('queen', [noKing]) });
    expect(inCheck(fromFen('7k/6T1/6K1/8/8/8/8/8 b - - 0 1'))).toBe(false);
    const r = rng(1602);
    for (let i = 0; i < 300; i++) {
      const d = randomDesign(r);
      setRules({ design: { ...d, rules: [...d.rules.filter(x => x.does.a !== 'cannotTake' && x.does.a !== 'cannotBeTaken'), noKing].slice(-3) } });
      const { b } = board(r, [T], 1 + Math.floor(r() * 8));
      for (let s = 0; s < 64; s++) if ((b[s] & 15) === T) for (const mode of ['all', 'attacks'] as const) {
        const out: Move[] = [];
        genPiece(b, s, mode, out);
        expect(out.some(m => m.captures.some(x => (b[x] & 15) === K)), `board ${i}`).toBe(false);
      }
    }
  });

  it('a design remembers its first take: a FEN round trip with a spent design', () => {
    // After its first capture it also moves like a knight.
    const d = spec('rook', [{ when: { on: 'afterFirstCapture' }, does: { a: 'movesLike', as: 'knight' } }]);
    setRules({ design: d });
    const pos = fromFen('4k3/8/8/8/8/8/p7/T3K3 w - - 0 1');
    expect(legalMoves(pos).some(m => m.from === parseSq('a1') && m.to === parseSq('b3'))).toBe(false);
    const after = makeMove(pos, legalMoves(pos).find(m => m.to === parseSq('a2'))!);
    expect(after.board[parseSq('a2')]).toBe(piece(T, WHITE) | SPENT);
    expect(toFen(after)).toBe('4k3/8/8/8/8/8/U7/4K3 b - - 0 1');
    expect(toFen(fromFen(toFen(after)))).toBe(toFen(after));
    expect(fromFen(toFen(after)).board).toEqual(after.board);
    const white = { ...after, turn: WHITE as Color };
    expect(legalMoves(white).some(m => m.from === parseSq('a2') && m.to === parseSq('b4'))).toBe(true);
    // A rule that no When reads keeps the byte plain.
    setRules({ design: spec('rook') });
    expect(makeMove(pos, legalMoves(pos).find(m => m.to === parseSq('a2'))!).board[parseSq('a2')]).toBe(piece(T, WHITE));
  });

  it('a "cannot be taken" When on its square shelters it, and the attack mirror follows', () => {
    // A king's step that never takes (a piece only a king can take cannot take, H12).
    setRules({ design: specOf({ squares: KING_STEP('move'), lines: [], rules: [{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'cannotBeTaken', by: 'allButKing' } }] }) });
    // The white design on e5 (the enemy half): only the black king takes it.
    const pos = fromFen('8/8/3k4/4T3/3q4/8/8/K7 b - - 0 1'), e5 = parseSq('e5');
    expect(legalMoves(pos).filter(m => m.captures.includes(e5)).map(m => sqName(m.from))).toEqual(['d6']);
    expect(isAttacked(pos.board, e5, BLACK)).toBe(true);
    const noKing = fromFen('8/8/8/4T3/3q4/8/8/K6k b - - 0 1');
    expect(isAttacked(noKing.board, e5, BLACK)).toBe(false);
    // On e4 (its own half) the queen takes it.
    const own = fromFen('8/8/8/8/3qT3/8/8/K6k b - - 0 1');
    expect(isAttacked(own.board, parseSq('e4'), BLACK)).toBe(true);
    expect(legalMoves(own).some(m => m.captures.includes(parseSq('e4')))).toBe(true);
  });

  it('a king power\'s shelter and the design\'s "cannot be taken" both hold', () => {
    // Mercy's balanced shelter (only a pawn takes) and "next to its king: no pawn takes it": nothing takes it.
    setRules({ ...parseRule('kingWhite=Spirit:Mercy'), mercyAura: true, mercyAuraPawnsTake: true,
      design: specOf({ squares: KING_STEP('both'), lines: [], rules: [{ when: { on: 'near', who: 'king' }, does: { a: 'cannotBeTaken', by: 'pawns' } }] }) });
    const pos = fromFen('7k/8/8/3p4/4T3/4K3/8/8 b - - 0 1'), e4 = parseSq('e4');
    expect(legalMoves(pos).some(m => m.captures.includes(e4))).toBe(false);
    expect(isAttacked(pos.board, e4, BLACK)).toBe(false);
  });

  it('the design\'s push obeys ogreShoveFriends only for an Ogre, and its swap obeys the guard\'s landing bans', () => {
    setRules({ design: spec('rook', [{ when: { on: 'always' }, does: { a: 'push', then: 'stay' } }]), ogreShoveFriends: 'enemies' });
    const b = fromFen('4k3/8/8/8/3PT3/8/8/K7 w - - 0 1').board;
    expect(gen(b, parseSq('e4'), 'all').some(k => k.includes(`${parseSq('d4')}>${parseSq('c4')}`))).toBe(true);
    setRules({ design: spec('rook', [{ when: { on: 'always' }, does: { a: 'swap', with: 'friend' } }]), guardNoCapital: true });
    const g = fromFen('4k3/8/8/8/3T4/2G5/8/K7 w - - 0 1').board;
    expect(gen(g, parseSq('d4'), 'all').some(k => k.endsWith(',s,,,') && k.startsWith(`${parseSq('d4')},${parseSq('c3')},`))).toBe(false);
  });

  it('with no design the Templar plays as before, and setRules refuses a design version 1 cannot play', () => {
    setRules();
    const out: Move[] = [], b = new Uint8Array(64);
    b[parseSq('d4')] = piece(T, WHITE);
    genPiece(b, parseSq('d4'), 'all', out);
    expect(out.length).toBe(27); // a queen from the capital
    expect(() => setRules({ design: spec('rook', [{ when: { on: 'fromMove', n: 10 }, does: { a: 'movesLike', as: 'knight' } }]) })).toThrow(/history/);
    expect(() => setRules({ design: spec('rook', [{ when: { on: 'beforeMove', n: 10 }, does: { a: 'cannotTake', what: 'king' } }]) })).toThrow(/history/);
    expect(() => setRules({ design: spec('rook', [{ when: { on: 'afterCard', card: 'any' }, does: { a: 'movesLike', as: 'knight' } }]) })).toThrow(/history/);
    expect(() => setRules({ design: spec('rook', [{ when: { on: 'always' }, does: { a: 'cannotBeTaken', by: 'allButKing' } }]) })).toThrow(/Only a king/);
  });

  it('parseRule reads a share code', () => {
    const d: PieceDesign = { ...fromPreset(PRESETS.find(p => p.key === 'beast')!), name: 'Test', letter: 'X' };
    expect(parseRule(`design=${designCode(d)}`)).toEqual({ design: { ...specOf(d), code: designCode(d) } }); // the code: the game's name and figure (ticket 17)
    expect(parseRule('design=')).toEqual({ design: null });
    expect(() => parseRule('design=nope')).toThrow(/share code/);
  });
});
