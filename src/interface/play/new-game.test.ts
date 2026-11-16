import { expect, it } from 'vitest';
import { armyTypes, cardLocked, changeDraft, createDraft, dealArmy, kingChoices, poolLetters, poolLocked, levelKey, readPanel, restorePanel, shownKing, readOptions, rulesFor, startOf, DEFAULT_OPTIONS, type Choices } from './new-game';
import { gameType } from './saved';
import { A, G, K, M, N, O, P, R, colorOf } from '../../rules/engine';

const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };
const choices = (over: Partial<Choices> = {}): Choices => ({ setup: 'both', level: 'casual', sideChoice: 'light', ...over });
const sameStart = (a: { pos: { board: ArrayLike<number> } }, b: { pos: { board: ArrayLike<number> } }) => expect(Array.from(a.pos.board)).toEqual(Array.from(b.pos.board));

it('launch decision 26: the previewed deal is the started deal', () => {
  for (const setup of ['pieces', 'powers', 'cards', 'both'] as const) for (const sideChoice of ['light', 'dark', 'random'] as const) {
    const draft = createDraft(choices({ setup, sideChoice }));
    const live = startOf(draft);
    expect(live).not.toBe(draft.game);
    sameStart(live, draft.game);
    expect(live.backRank).toBe(draft.back);
    expect(live.rules.kings).toEqual(draft.game.rules.kings);
    expect(live.rules.hands).toEqual(draft.game.rules.hands);
    expect(gameType(live.rules)).toBe(setup);
    expect(live.history).toHaveLength(0);
  }
  // Random resolves once, when the candidate is made: both outcomes, and the start does not draw again.
  expect(createDraft(choices({ sideChoice: 'random' }), seq(.1)).player).toBe(0);
  expect(createDraft(choices({ sideChoice: 'random' }), seq(.9)).player).toBe(1);
  const random = createDraft(choices({ sideChoice: 'random' }), seq(.9));
  expect(startOf(random).backRank).toBe(random.back);
  expect(random.player).toBe(1);
});
it('launch decision 26: a level or an unchanged value changes nothing; the side keeps the deal; the type keeps the army', () => {
  const draft = createDraft(choices({ setup: 'powers' }));
  const level = changeDraft(draft, { level: 'club' });
  expect(level.game).toBe(draft.game); expect(level.rules).toBe(draft.rules); expect(level.level).toBe('club');
  expect(changeDraft(draft, { setup: 'powers', sideChoice: 'light' }).game).toBe(draft.game);
  const dark = changeDraft(draft, { sideChoice: 'dark' });
  expect(dark.game.rules.kings[1]).toEqual(DEFAULT_OPTIONS.king); expect(dark.player).toBe(1); expect(dark.back).toBe(draft.back);
  const cards = changeDraft(dark, { setup: 'both' });
  expect(cards.back).toBe(draft.back); expect(gameType(cards.game.rules)).toBe('both'); expect(cards.game.rules.hands[0]).toHaveLength(4);
  expect(cards.player).toBe(1);
  // The candidate does not change in place: Close keeps the first one.
  expect(draft.level).toBe('casual'); expect(draft.sideChoice).toBe('light'); expect(gameType(draft.game.rules)).toBe('powers');
});
it('deals the kings and the four shared cards of each of the four games', () => {
  expect(rulesFor('pieces')).toEqual({ kings: [null, null], hands: [[], []] });
  const both = rulesFor('both', seq(.3, .6, .1));
  expect(both.kings!.every(king => king && ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'].includes(king.power))).toBe(true);
  expect(both.hands![0]).toEqual(both.hands![1]); expect(both.hands![0]).toHaveLength(4);
  expect(rulesFor('powers', seq(0)).hands).toEqual([[], []]);
  // Cards with no king powers (owner playtest section 2): no king, the same four cards for both sides.
  const cards = rulesFor('cards', seq(.3, .6, .1));
  expect(cards.kings).toEqual([null, null]); expect(cards.hands![0]).toHaveLength(4); expect(cards.hands![0]).toEqual(cards.hands![1]);
  expect(gameType(cards as never)).toBe('cards');
});
it('owner playtest section 2: your king, the card pool and the piece kinds', () => {
  // Your king goes to your seat; with cards, a king that is not always on deals at random.
  const mercy = { king: 'Spirit', power: 'Mercy' } as const, freeze = { king: 'Frost', power: 'Freeze' } as const;
  expect(rulesFor('powers', seq(.9), { ...DEFAULT_OPTIONS, king: freeze }, 1).kings![1]).toEqual(freeze);
  expect(rulesFor('both', seq(.9), { ...DEFAULT_OPTIONS, king: mercy }, 0).kings![0]).toEqual(mercy);
  expect(rulesFor('both', seq(.0), { ...DEFAULT_OPTIONS, king: freeze }, 0).kings![0]).not.toEqual(freeze);
  expect(kingChoices('both').map(k => k.power).sort()).toEqual(['Darkness', 'DeathTouch', 'HolyLight', 'March', 'Mercy']);
  expect(kingChoices('cards')).toEqual([]); expect(kingChoices('powers')).toHaveLength(12);
  // Pick four: the hand is the four picked cards.
  const four = ['Freeze', 'Haste', 'Flight', 'Mirror'] as never[];
  expect([...rulesFor('cards', Math.random, { ...DEFAULT_OPTIONS, cardPool: four }).hands![0]].sort()).toEqual([...four].sort());
  // The piece kinds: the army uses only them; the pool keeps 7 pieces or more.
  const kinds = ['Q', 'R', 'B', 'N', 'A'];
  for (let i = 0; i < 20; i++) expect(dealArmy(kinds).split('').every(letter => letter === 'K' || kinds.includes(letter))).toBe(true);
  expect(poolLetters(kinds)).toBe('QRRBBNNAA');
  expect(readOptions({ pool: ['Q', 'R', 'B'] }).pool).toEqual(DEFAULT_OPTIONS.pool);
  expect(readOptions({ cardPool: ['Freeze'] }).cardPool).toEqual(DEFAULT_OPTIONS.cardPool);
  expect(readOptions({ cardPool: DEFAULT_OPTIONS.cardPool.slice(0, 5) }).cardPool).toEqual(DEFAULT_OPTIONS.cardPool);
  expect(readOptions({ king: { king: 'Nobody', power: 'Mercy' }, arrangement: 'manual' })).toMatchObject({ king: null, arrangement: 'manual' });
  expect(readOptions(null)).toEqual(DEFAULT_OPTIONS);
  // A changed king deals again; a changed piece pool deals a new army.
  const draft = createDraft(choices({ setup: 'powers' }));
  expect(changeDraft(draft, { options: { ...draft.options, king: freeze } }).game.rules.kings[0]).toEqual(freeze);
  const small = changeDraft(draft, { options: { ...draft.options, pool: kinds } });
  expect(small.back.split('').every(letter => letter === 'K' || kinds.includes(letter))).toBe(true);
});
it('the army row: each type of the side one time, the king first, the pawn last', () => {
  const draft = createDraft(choices({ setup: 'pieces' }));
  for (const side of [0, 1] as const) {
    const row = armyTypes(draft.game, side);
    expect(row[0]).toEqual({ type: K, count: 1 }); expect(row.at(-1)).toEqual({ type: P, count: 8 });
    expect(new Set(row.map(item => item.type)).size).toBe(row.length);
    expect(row.reduce((sum, item) => sum + item.count, 0)).toBe(draft.game.pos.board.filter(code => code && colorOf(code) === side).length);
  }
  // A known army: the king, the new pieces in the Guide's order, the chess pieces by type, the pawns last.
  const known = createDraft(choices({ setup: 'pieces' }), Math.random, 'ROGAKMNR');
  expect(armyTypes(known.game, 0)).toEqual([[K, 1], [A, 1], [G, 1], [M, 1], [O, 1], [N, 1], [R, 2], [P, 8]].map(([type, count]) => ({ type, count })));
});

it('first use has playable options and Spirit with Mercy', () => {
  expect(readOptions(null)).toEqual(DEFAULT_OPTIONS);
  expect(DEFAULT_OPTIONS.king).toEqual({ king: 'Spirit', power: 'Mercy' });
  expect(DEFAULT_OPTIONS.arrangement).toBe('random');
  const draft = createDraft(choices({ setup: 'pieces' }));
  expect(draft.game.rules.hands).toEqual([[], []]); expect(draft.game.rules.kings).toEqual([null, null]);
});
it('pool locks use piece counts and free a box when another kind joins', () => {
  const pool = ['R', 'B', 'N', 'G']; // Seven pieces from four kinds.
  expect(poolLetters(pool)).toHaveLength(7);
  expect(poolLocked(pool, 'G')).toBe(true); expect(poolLocked(pool, 'R')).toBe(true);
  expect(poolLocked([...pool, 'A'], 'G')).toBe(false);
  expect(poolLocked(pool, 'A')).toBe(false);
});
it('cards use a legal king and keep the preferred power for cards off', () => {
  const freeze = { king: 'Frost', power: 'Freeze' } as const, leap = { king: 'Mud', power: 'Leap' } as const;
  expect(shownKing('both', freeze)).toEqual(DEFAULT_OPTIONS.king);
  expect(shownKing('both', leap)).toEqual({ king: 'Mud', power: 'March' });
  let draft = createDraft(choices({ setup: 'powers', options: { ...DEFAULT_OPTIONS, king: freeze } }));
  draft = changeDraft(draft, { setup: 'both' }); expect(draft.options.king).toEqual(freeze); expect(draft.game.rules.kings[0]).toEqual(DEFAULT_OPTIONS.king);
  draft = changeDraft(draft, { setup: 'powers' }); expect(draft.game.rules.kings[0]).toEqual(freeze);
});
it('Pick four caps the choice and leaves selected cards free to go off', () => {
  const four = DEFAULT_OPTIONS.cardPool.slice(0, 4);
  expect(cardLocked(four, DEFAULT_OPTIONS.cardPool[4])).toBe(true);
  expect(cardLocked(four, four[0])).toBe(false);
  expect(cardLocked(four.slice(0, 2), DEFAULT_OPTIONS.cardPool[4])).toBe(false);
});
it('slider keys reach all three stops and stay at the ends', () => {
  expect(levelKey('casual', 'ArrowLeft')).toBe('casual'); expect(levelKey('casual', 'ArrowRight')).toBe('clever');
  expect(levelKey('clever', 'ArrowUp')).toBe('club'); expect(levelKey('club', 'ArrowDown')).toBe('clever');
  expect(levelKey('club', 'End')).toBe('club'); expect(levelKey('club', 'Home')).toBe('casual'); expect(levelKey('casual', 'Tab')).toBe('casual');
});
it('sign-in return keeps the draft and an incomplete Pick four choice', () => {
  const memory = { ...choices({ setup: 'both', level: 'club', sideChoice: 'dark' }), options: { ...DEFAULT_OPTIONS, arrangement: 'manual' }, opponent: 'person', section: 'cards', cardMode: 'four', picked: ['Freeze', 'Haste'] };
  expect(readPanel(JSON.parse(JSON.stringify(memory)))).toEqual(memory);
  expect(readPanel(null)).toBeNull(); expect(readPanel({ ...memory, setup: 'other' })).toBeNull();
});

it('a sign-in reload keeps the exact dealt army, seats, kings and shared cards', () => {
  const draft = createDraft(choices());
  const memory = readPanel(JSON.parse(JSON.stringify({ ...choices(), options: draft.options, opponent: 'person', section: null, cardMode: 'all', picked: [], deal: { back: draft.back, rules: draft.rules, player: draft.player } })))!;
  const restored = restorePanel(memory);
  expect(restored.player).toBe(draft.player); expect(restored.back).toBe(draft.back); expect(restored.rules).toEqual(draft.rules); sameStart(restored.game, draft.game);
  expect(readPanel({ ...memory, deal: { ...memory.deal, back: '<bad>' } })!.deal).toBeUndefined();
});
