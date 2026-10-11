import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../sim/rng';
import { DEAL_CARDS, DEFAULT_OPTIONS, draw, seatChoicesNeeded, validate, type Options } from './setup';

const opts = (over: Partial<Options>): Options => ({ ...DEFAULT_OPTIONS, ...over });

describe('game setup options', () => {
  it('defaults to fairy (all pieces), arrangement on, classic, cards and powers off (spec Q26)', () => {
    expect(DEFAULT_OPTIONS).toMatchObject({ fairy: true, arrangement: true, classic: false, cards: false, kingPowers: false });
    expect([...DEFAULT_OPTIONS.pool].sort().join('')).toBe('ABGLMNOQRS');
    expect(DEFAULT_OPTIONS.cardPool).toHaveLength(21);
    expect(validate(DEFAULT_OPTIONS)).toBeNull();
  });
  it('keeps at least 7 pool pieces, counted as in POOL', () => {
    expect(validate(opts({ pool: ['N', 'A', 'M', 'S'] }))).toBeNull(); // NNAAMMS
    expect(validate(opts({ pool: ['N', 'A', 'M'] }))).toMatch(/7/); // NNAAMM
    expect(validate(opts({ pool: ['Q', 'R', 'B', 'N'] }))).toBeNull(); // QRRBBNN
  });
  it('refuses the king, the pawn, lab pieces and repeated kinds in the pool', () => {
    for (const bad of ['K', 'P', 'C', 'T']) expect(validate(opts({ pool: [...DEFAULT_OPTIONS.pool, bad] }))).not.toBeNull();
    expect(validate(opts({ pool: [...DEFAULT_OPTIONS.pool, 'G'] }))).not.toBeNull();
    expect(validate(opts({ pool: [...DEFAULT_OPTIONS.pool, 'S'] }))).not.toBeNull();
  });
  it('ignores the pool with fairy off', () => {
    expect(validate(opts({ fairy: false, arrangement: false, pool: [] }))).toBeNull();
  });
  it('allows classic only with fairy off, and arrangement only with fairy on', () => {
    expect(validate(opts({ classic: true }))).toMatch(/Classic/);
    expect(validate(opts({ fairy: false, arrangement: false, classic: true }))).toBeNull();
    expect(validate(opts({ fairy: false, arrangement: true }))).toMatch(/Arrangement/);
  });
  it('keeps at least 4 cards from the 21 of the deal list (spec Q20)', () => {
    expect(validate(opts({ cards: true }))).toBeNull();
    expect(validate(opts({ cards: true, cardPool: ['Freeze', 'Haste', 'MirrorB', 'SkyLift'] }))).toBeNull();
    expect(validate(opts({ cards: true, cardPool: ['Freeze', 'Haste', 'MirrorB'] }))).toMatch(/4/);
    expect(validate(opts({ cards: true, cardPool: ['Freeze', 'Haste', 'MirrorB', 'Rage'] }))).not.toBeNull();
    expect(validate(opts({ cards: true, cardPool: ['Freeze', 'Haste', 'MirrorB', 'Freeze'] }))).not.toBeNull();
    expect(validate(opts({ cards: false, cardPool: [] }))).toBeNull();
  });
});

const sorted = (s: string) => [...s].sort().join('');
const bishopsOk = (row: string) => { const b = [...row].flatMap((p, i) => (p === 'B' ? [i] : [])); return b.length < 2 || (b[0] + b[1]) % 2 === 1; };
const guardOk = (row: string) => !row.includes('G') || Math.abs(row.indexOf('G') - row.indexOf('K')) === 1;

describe('the draw', () => {
  it('draws 7 pool pieces and the king in a legal order, the same seed giving the same draw', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { army, hand } = draw(DEFAULT_OPTIONS, mulberry32(seed));
      expect(army).toMatch(/^[QOLRBNAGMSK]{8}$/);
      expect(army.split('K')).toHaveLength(2);
      expect(bishopsOk(army) && guardOk(army)).toBe(true);
      expect(hand).toEqual([]);
      expect(draw(DEFAULT_OPTIONS, mulberry32(seed))).toEqual({ army, hand });
    }
  });
  it('draws only from the checked kinds', () => {
    for (let seed = 1; seed <= 50; seed++) expect(sorted(draw(opts({ pool: ['N', 'A', 'M', 'S'] }), mulberry32(seed)).army)).toBe('AAKMMNNS');
  });
  it('gives the chess pieces in a random order with fairy and classic off, and the chess start with classic', () => {
    const plain = opts({ fairy: false, arrangement: false });
    const armies = new Set(Array.from({ length: 30 }, (_, i) => draw(plain, mulberry32(i + 1)).army));
    for (const a of armies) expect(sorted(a)).toBe(sorted('RNBQKBNR'));
    expect(armies.size).toBeGreaterThan(1);
    expect(draw(opts({ fairy: false, arrangement: false, classic: true }), mulberry32(7)).army).toBe('RNBQKBNR');
  });
  it('deals 4 different cards from the checked cards with cards on', () => {
    const pool = DEAL_CARDS.slice(0, 6);
    const hands = Array.from({ length: 40 }, (_, i) => draw(opts({ cards: true, cardPool: pool }), mulberry32(i + 1)).hand);
    for (const h of hands) { expect(h).toHaveLength(4); expect(new Set(h).size).toBe(4); for (const c of h) expect(pool).toContain(c); }
    expect(new Set(hands.map(h => h.join())).size).toBeGreaterThan(1);
    expect(draw(opts({ cards: true, cardPool: ['Freeze', 'Haste', 'MirrorB', 'SkyLift'] }), mulberry32(3)).hand.slice().sort()).toEqual(['Freeze', 'Haste', 'MirrorB', 'SkyLift']);
  });
  it('refuses options that do not validate', () => {
    expect(() => draw(opts({ classic: true }), mulberry32(1))).toThrow(/Classic/);
  });
});

describe('seat choices', () => {
  it('asks for a king with powers on and an order with arrangement on', () => {
    expect(seatChoicesNeeded(DEFAULT_OPTIONS)).toEqual({ king: false, order: true });
    expect(seatChoicesNeeded(opts({ kingPowers: true, fairy: false, arrangement: false }))).toEqual({ king: true, order: false });
  });
});
