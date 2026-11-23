import { expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { parseSq, type Move } from '../../rules/engine';
import { ALL_CARDS, POWERS_BALANCED, type CardName } from '../../rules/rules';
import { CAST_FAMILY, castOf } from './cast';

it('gives every card of the rules a family', () => {
  expect(ALL_CARDS.filter(card => !CAST_FAMILY[card])).toEqual([]);
});

const sq = (names: string) => names.split(' ').map(parseSq);
const rules = new GameRules(POWERS_BALANCED), before = rules.fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
/** The first legal card move of `card` from `fen` (White, card mode) that `pick` accepts. */
function cardMove(card: CardName, fen: string, pick: (m: Move) => boolean = () => true, more = {}): Move {
  const rules = new GameRules({ ...POWERS_BALANCED, kings: [null, null], hands: [[card], []], ...more });
  const move = rules.legalMoves(rules.fromFen(fen)).find(m => m.power && pick(m));
  if (!move) throw new Error(`no ${card} move`);
  return move;
}

it('starts each family at the squares the card changes', () => {
  const quiet = cardMove('Strike', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', m => m.to === parseSq('e5'));
  expect(castOf(quiet, before)).toEqual({ family: 'shift', squares: sq('a1 e5') });
  const lift = cardMove('SkyLift', '4k3/8/8/8/8/8/8/R1B1K3 w - - 0 1');
  expect(castOf(lift, before)).toEqual({ family: 'trade', squares: [lift.from, lift.to] });
  expect(castOf(cardMove('Freeze', '4k3/4p3/8/8/8/8/8/4K3 w - - 0 1', m => m.to === parseSq('e7')), before)).toEqual({ family: 'ward', squares: sq('e7') });
  expect(castOf(cardMove('Spawn', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', m => m.to === parseSq('d2')), before)).toEqual({ family: 'change', squares: sq('d2') });
  const two = cardMove('Spawn2', '4k3/8/8/8/8/8/8/4K3 w - - 0 1');
  expect(castOf(two, before)).toEqual({ family: 'change', squares: [two.to, two.drop2] });
  const quake = cardMove('EarthQuake', '4k3/8/8/8/3n4/8/8/4K3 w - - 0 1', m => !!m.pushes?.length);
  expect(castOf(quake, before)).toEqual({ family: 'quake', squares: [quake.from, ...quake.pushes!.map(p => p.to)] });
  expect(quake.pushes?.length).toBeGreaterThan(0);
  expect(castOf(cardMove('Growth', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', undefined, { piles: [['Freeze'], []] }), before)).toEqual({ family: 'rule', squares: [] });
});

it('plays no cast beat for a capture (the capture beat has the square), an ordinary move or a pass', () => {
  const take = cardMove('Burn', '4k3/8/8/8/3r4/8/8/R3K3 w - - 0 1', m => m.captures.length > 0);
  expect(castOf(take, before)).toBeUndefined();
  expect(castOf({ from: 8, to: 16, captures: [] }, before)).toBeUndefined();
  expect(castOf({ from: 8, to: 8, captures: [], pass: true, power: 'haste' }, before)).toBeUndefined();
});

it('gives a card with no family the small default beat', () => {
  const freeze = cardMove('Freeze', '4k3/4p3/8/8/8/8/8/4K3 w - - 0 1');
  const family = CAST_FAMILY.Freeze;
  delete CAST_FAMILY.Freeze;
  try { expect(castOf(freeze, before)?.family).toBe('rule'); } finally { CAST_FAMILY.Freeze = family; }
});

it('draws the path of a piece that an Ogre pushes with Haste or Rally', () => {
  for (const card of ['Haste', 'Rally'] as const) {
    const push = cardMove(card, '4k3/8/8/8/8/8/1OP5/4K3 w - - 0 1', m => m.shove?.from === parseSq('c2'));
    expect(castOf(push, before), card).toEqual({ family: 'shift', squares: [push.from, push.to, ...sq('c2 d2')] });
  }
});

it('rings each protected piece for Firewall and for a Rescue that renews it', () => {
  const fen = '4k3/8/8/8/8/8/PP6/4K3 w - - 0 1';
  const wall = cardMove('Firewall', fen), at = rules.fromFen(fen);
  expect(castOf(wall, at)).toEqual({ family: 'ward', squares: sq('e1 a2 b2') });
  const rescue: Move = { from: parseSq('e1'), to: parseSq('e1'), captures: [], power: 'rescue' };
  expect(castOf(rescue, { ...at, marks: [{ sq: parseSq('e1'), all: true }, undefined] })).toEqual({ family: 'ward', squares: sq('e1 a2 b2') });
  expect(castOf(rescue, { ...at, marks: [{ sq: parseSq('e1') }, undefined] })).toEqual({ family: 'ward', squares: sq('e1') });
});
