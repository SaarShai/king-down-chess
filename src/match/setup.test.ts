import { afterEach, describe, expect, it } from 'vitest';
import { choiceSchema, optionsSchema } from './setup-schema';
import { createMatch, type LocalMatch, type MatchSetup } from './index';
import { mulberry32 } from '../sim/rng';
import { KINGS, POWERS_BALANCED, setRules, type PowerName } from '../rules/rules';
import { ALWAYS_ON, DEAL_CARDS, DEFAULT_OPTIONS, buildSetup, defaultChoice, draw, seatChoicesNeeded, validate, validateChoice, type Choice, type Options } from './setup';

const opts = (over: Partial<Options>): Options => ({ ...DEFAULT_OPTIONS, ...over });

describe('game setup options', () => {
  it('defaults to fairy (all pieces), arrangement on, classic, cards and powers off (spec Q26)', () => {
    expect(DEFAULT_OPTIONS).toMatchObject({ fairy: true, arrangement: true, classic: false, cards: false, kingPowers: false });
    expect([...DEFAULT_OPTIONS.pool].sort().join('')).toBe('ABGLMNOQRS');
    expect(DEFAULT_OPTIONS.cardPool).toHaveLength(21);
    expect(validate(DEFAULT_OPTIONS)).toBeNull();
  });
  it('keeps the default pool and card pool safe from a caller that edits a copy', () => {
    const o = { ...DEFAULT_OPTIONS };
    expect(() => (o.pool as string[]).splice(0, 3)).toThrow(TypeError);
    expect(() => (o.cardPool as string[]).push('Rage')).toThrow(TypeError);
    expect(DEFAULT_OPTIONS.pool).toHaveLength(10);
    expect(DEFAULT_OPTIONS.cardPool).toHaveLength(21);
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

const ARMY = 'QRNAKBBS';
const D = { army: ARMY, hand: [] };
const powers = opts({ kingPowers: true });
const choice = (order: string, king: Choice['king'] = null): Choice => ({ king, order });

describe('validating a seat choice', () => {
  it('takes any legal order of the drawn pieces with arrangement on', () => {
    expect(validateChoice(DEFAULT_OPTIONS, D, choice('SBBKANRQ'))).toBeNull();
    expect(validateChoice(DEFAULT_OPTIONS, D, choice('QRNAKBBN'))).toMatch(/same pieces/);
    expect(validateChoice(DEFAULT_OPTIONS, D, choice('QRNAKBSB'))).toMatch(/[Bb]ishops/);
  });
  it('keeps the guard next to the king', () => {
    const d = { army: 'GRNAKBBQ', hand: [] };
    expect(validateChoice(DEFAULT_OPTIONS, d, choice('RNAGKBBQ'))).toBeNull();
    expect(validateChoice(DEFAULT_OPTIONS, d, choice('GRNAKBBQ'))).toMatch(/[Gg]uard/);
  });
  it('takes only the drawn order with arrangement off', () => {
    const o = opts({ fairy: false, arrangement: false }), d = { army: 'RNBQKBNR', hand: [] };
    expect(validateChoice(o, d, choice('RNBQKBNR'))).toBeNull();
    expect(validateChoice(o, d, choice('RNBKQBNR'))).not.toBeNull();
  });
  it('needs a king with one of its own two powers when powers are on, and none when off', () => {
    expect(validateChoice(powers, D, choice(ARMY, { king: 'Frost', power: 'Freeze' }))).toBeNull();
    expect(validateChoice(powers, D, choice(ARMY, { king: 'Frost', power: 'Mercy' }))).not.toBeNull();
    expect(validateChoice(powers, D, choice(ARMY))).not.toBeNull();
    expect(validateChoice(DEFAULT_OPTIONS, D, choice(ARMY, { king: 'Spirit', power: 'Mercy' }))).not.toBeNull();
  });
  it('refuses a king name that is an Object.prototype key with an error string, not a throw', () => {
    for (const king of ['constructor', 'toString', '__proto__'])
      expect(validateChoice(powers, D, choice(ARMY, { king, power: 'Mercy' } as unknown as Choice['king']))).toMatch(/king/);
  });
  it('offers only the always-on powers with cards on (spec Q19)', () => {
    const o = opts({ kingPowers: true, cards: true });
    for (const [king, power] of [['Spirit', 'HolyLight'], ['Spirit', 'Mercy'], ['Shadow', 'DeathTouch'], ['Shadow', 'Darkness'], ['Mud', 'March']] as const)
      expect(validateChoice(o, D, choice(ARMY, { king, power }))).toBeNull();
    for (const [king, power] of [['Frost', 'Freeze'], ['Frost', 'IceWall'], ['Flame', 'Strike'], ['Flame', 'Haste'], ['Stratus', 'Flight'], ['Stratus', 'Sacrifice'], ['Mud', 'Leap']] as const)
      expect(validateChoice(o, D, choice(ARMY, { king, power }))).toMatch(/cards/);
  });
});

describe('ALWAYS_ON and the engine', () => {
  afterEach(() => { setRules(); });
  it('lists exactly the powers that the engine allows next to a full hand (the readings the match worker plays)', () => {
    const hand = DEAL_CARDS.slice(0, 4);
    for (const [king, two] of Object.entries(KINGS)) for (const power of two as readonly PowerName[]) {
      const start = () => setRules({ ...POWERS_BALANCED, kings: [{ king, power } as never, null], hands: [hand, hand] });
      if (ALWAYS_ON.includes(power)) expect(start, power).not.toThrow(); else expect(start, power).toThrow(/hand/);
    }
  });
});

describe('the default seat choice', () => {
  it('gives White Spirit with Mercy and Black Shadow with Darkness when powers are on (spec Q9)', () => {
    expect(defaultChoice(powers, D, 0, mulberry32(1), false)).toEqual(choice(ARMY, { king: 'Spirit', power: 'Mercy' }));
    expect(defaultChoice(powers, D, 1, mulberry32(1), false)).toEqual(choice(ARMY, { king: 'Shadow', power: 'Darkness' }));
    expect(defaultChoice(DEFAULT_OPTIONS, D, 1, mulberry32(1), false)).toEqual(choice(ARMY));
  });
  it('gives a computer a random legal order with arrangement on', () => {
    const d = { army: 'GRNAKBBQ', hand: [] };
    const orders = new Set(Array.from({ length: 30 }, (_, i) => defaultChoice(DEFAULT_OPTIONS, d, 1, mulberry32(i + 1), true).order));
    for (const order of orders) expect(validateChoice(DEFAULT_OPTIONS, d, choice(order))).toBeNull();
    expect(orders.size).toBeGreaterThan(1);
    expect(defaultChoice(opts({ fairy: false, arrangement: false }), d, 1, mulberry32(1), true).order).toBe('GRNAKBBQ');
  });
});

describe('the built setup', () => {
  const matches: LocalMatch[] = [];
  afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); });
  const start = async (setup: MatchSetup) => { const m = await createMatch(setup); matches.push(m); return m.snapshot(); };

  it('mirrors one back rank when both orders match, with no powers', async () => {
    const built = buildSetup(DEFAULT_OPTIONS, D, [choice(ARMY), choice(ARMY)]);
    expect(built).toEqual({ backRank: ARMY, kings: 'none,none' });
    expect((await start(built)).fen).toBe('qrnakbbs/pppppppp/8/8/8/8/PPPPPPPP/QRNAKBBS w - - 0 1');
  });
  it('gives each side its own rank by a FEN when the orders differ', async () => {
    const built = buildSetup(DEFAULT_OPTIONS, D, [choice(ARMY), choice('SBBKANRQ')]);
    expect(built).toEqual({ fen: 'sbbkanrq/pppppppp/8/8/8/8/PPPPPPPP/QRNAKBBS w - - 0 1', kings: 'none,none' });
    expect((await start(built)).fen).toBe(built.fen);
  });
  it('carries both kings and powers', async () => {
    const built = buildSetup(powers, D, [choice(ARMY, { king: 'Frost', power: 'Freeze' }), choice(ARMY, { king: 'Shadow', power: 'Darkness' })]);
    expect(built.kings).toBe('Frost:Freeze,Shadow:Darkness');
    expect((await start(built)).rules.kings).toEqual([{ king: 'Frost', power: 'Freeze' }, { king: 'Shadow', power: 'Darkness' }]);
  });
  it('builds a game the match module starts for each toggle mix', async () => {
    const mixes: Options[] = [DEFAULT_OPTIONS, opts({ pool: ['N', 'A', 'M', 'S'] }), opts({ fairy: false, arrangement: false }), opts({ fairy: false, arrangement: false, classic: true }), opts({ kingPowers: true, cards: true }), opts({ arrangement: false, kingPowers: true })];
    for (const [i, o] of mixes.entries()) {
      const d = draw(o, mulberry32(i + 1)), seats = [defaultChoice(o, d, 0, mulberry32(10 + i), true), defaultChoice(o, d, 1, mulberry32(20 + i), true)] as const;
      const built = buildSetup(o, d, seats);
      const m = await createMatch(built); matches.push(m);
      const s = await m.snapshot();
      expect(s.status).toBe('playing');
      expect(s.fen.split(' ')[0].split('/')[7]).toBe(seats[0].order);
      expect(s.fen.split(' ')[0].split('/')[0]).toBe(seats[1].order.toLowerCase());
      expect(s.rules.hands).toEqual(o.cards ? [d.hand, d.hand] : [[], []]);
      if (o.cards) expect(d.hand).toHaveLength(4);
      if (!o.classic) continue;
      for (const [r, lan] of ['e2-e4', 'e7-e5', 'Ng1-f3', 'Nb8-c6', 'Bf1-c4', 'Ng8-f6'].entries()) await m.apply({ id: `c${r}`, expectedRevision: r, lan });
      expect((await m.snapshot()).legal).toContain('O-O');
    }
  });
  it('refuses a seat choice that does not validate', () => {
    expect(() => buildSetup(DEFAULT_OPTIONS, D, [choice(ARMY), choice('QRNAKBSB')])).toThrow(/[Bb]ishops/);
  });
});

describe('the schemas', () => {
  it('parse the defaults and refuse a bad shape or a broken rule', () => {
    expect(optionsSchema.parse(DEFAULT_OPTIONS)).toEqual(DEFAULT_OPTIONS);
    expect(optionsSchema.safeParse({ ...DEFAULT_OPTIONS, extra: 1 }).success).toBe(false);
    expect(optionsSchema.safeParse({ ...DEFAULT_OPTIONS, pool: ['K'] }).success).toBe(false);
    expect(optionsSchema.safeParse(opts({ classic: true })).error?.issues[0].message).toMatch(/Classic/);
    expect(choiceSchema.parse(choice(ARMY, { king: 'Mud', power: 'March' }))).toEqual(choice(ARMY, { king: 'Mud', power: 'March' }));
    expect(choiceSchema.safeParse(choice('QRNAKBB', null)).success).toBe(false);
  });
});
