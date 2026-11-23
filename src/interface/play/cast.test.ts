import { expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { parseSq, type Move } from '../../rules/engine';
import { ALL_CARDS, POWERS_BALANCED, type CardName } from '../../rules/rules';
import { CAST_FAMILY, castOf } from './cast';

it('gives every card of the rules a family', () => {
  expect(ALL_CARDS.filter(card => !CAST_FAMILY[card])).toEqual([]);
});

const sq = (names: string) => names.split(' ').map(parseSq);
/** The first legal card move of `card` from `fen` (White, card mode) that `pick` accepts. */
function cardMove(card: CardName, fen: string, pick: (m: Move) => boolean = () => true, more = {}): Move {
  const rules = new GameRules({ ...POWERS_BALANCED, kings: [null, null], hands: [[card], []], ...more });
  const move = rules.legalMoves(rules.fromFen(fen)).find(m => m.power && pick(m));
  if (!move) throw new Error(`no ${card} move`);
  return move;
}

it('starts each family at the squares the card changes', () => {
  const quiet = cardMove('Strike', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', m => m.to === parseSq('e5'));
  expect(castOf(quiet)).toEqual({ family: 'shift', squares: sq('a1 e5') });
  const lift = cardMove('SkyLift', '4k3/8/8/8/8/8/8/R1B1K3 w - - 0 1');
  expect(castOf(lift)).toEqual({ family: 'trade', squares: [lift.from, lift.to] });
  expect(castOf(cardMove('Freeze', '4k3/4p3/8/8/8/8/8/4K3 w - - 0 1', m => m.to === parseSq('e7')))).toEqual({ family: 'ward', squares: sq('e7') });
  expect(castOf(cardMove('Spawn', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', m => m.to === parseSq('d2')))).toEqual({ family: 'change', squares: sq('d2') });
  const two = cardMove('Spawn2', '4k3/8/8/8/8/8/8/4K3 w - - 0 1');
  expect(castOf(two)).toEqual({ family: 'change', squares: [two.to, two.drop2] });
  const quake = cardMove('EarthQuake', '4k3/8/8/8/3n4/8/8/4K3 w - - 0 1', m => !!m.pushes?.length);
  expect(castOf(quake)).toEqual({ family: 'quake', squares: [quake.from, ...quake.pushes!.map(p => p.to)] });
  expect(quake.pushes?.length).toBeGreaterThan(0);
  expect(castOf(cardMove('Growth', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', undefined, { piles: [['Freeze'], []] }))).toEqual({ family: 'rule', squares: [] });
});

it('plays no cast beat for a capture (the capture beat has the square), an ordinary move or a pass', () => {
  const take = cardMove('Burn', '4k3/8/8/8/3r4/8/8/R3K3 w - - 0 1', m => m.captures.length > 0);
  expect(castOf(take)).toBeUndefined();
  expect(castOf({ from: 8, to: 16, captures: [] })).toBeUndefined();
  expect(castOf({ from: 8, to: 8, captures: [], pass: true, power: 'haste' })).toBeUndefined();
});

it('gives a card with no family the small default beat', () => {
  expect(castOf({ from: 4, to: 4, captures: [], power: 'growth' })?.family).toBe('rule');
});
