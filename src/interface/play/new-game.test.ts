import { expect, it } from 'vitest';
import { armyTypes, changeDraft, createDraft, rulesFor, startOf, type Choices } from './new-game';
import { gameType } from './saved';
import { A, G, K, M, N, O, P, R, colorOf } from '../../rules/engine';

const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };
const choices = (over: Partial<Choices> = {}): Choices => ({ setup: 'cards', level: 'casual', sideChoice: 'light', ...over });
const sameStart = (a: { pos: { board: ArrayLike<number> } }, b: { pos: { board: ArrayLike<number> } }) => expect(Array.from(a.pos.board)).toEqual(Array.from(b.pos.board));

it('launch decision 26: the previewed deal is the started deal', () => {
  for (const setup of ['pieces', 'powers', 'cards'] as const) for (const sideChoice of ['light', 'dark', 'random'] as const) {
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
  expect(dark.game).toBe(draft.game); expect(dark.player).toBe(1); expect(dark.back).toBe(draft.back);
  const cards = changeDraft(dark, { setup: 'cards' });
  expect(cards.back).toBe(draft.back); expect(gameType(cards.game.rules)).toBe('cards'); expect(cards.game.rules.hands[0]).toHaveLength(4);
  expect(cards.player).toBe(1);
  // The candidate does not change in place: Close keeps the first one.
  expect(draft.level).toBe('casual'); expect(draft.sideChoice).toBe('light'); expect(gameType(draft.game.rules)).toBe('powers');
});
it('deals the kings and the four shared cards of a game type', () => {
  expect(rulesFor('pieces')).toEqual({ kings: [null, null], hands: [[], []] });
  const cards = rulesFor('cards', seq(.3, .6, .1));
  expect(cards.kings!.every(king => king && ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'].includes(king.power))).toBe(true);
  expect(cards.hands![0]).toEqual(cards.hands![1]); expect(cards.hands![0]).toHaveLength(4);
  expect(rulesFor('powers', seq(0)).hands).toEqual([[], []]);
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
