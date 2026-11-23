import { TAG_POWER, type Move } from '../../rules/engine';
import type { CardName } from '../../rules/rules';

/**
 * The card families by what a card does to the board; each has one cast beat on the effect layer (`castIn`):
 * shift, a piece moves in a new way; trade, two pieces change squares; ward, a mark binds or guards a piece;
 * change, a piece comes or takes a new type; quake, pieces are pushed; rule, no square changes.
 */
export type CastFamily = 'shift' | 'trade' | 'ward' | 'change' | 'quake' | 'rule';
export const CAST_FAMILY: Partial<Record<CardName, CastFamily>> = {
  Strike: 'shift', Haste: 'shift', Flight: 'shift', March: 'shift', Leap: 'shift', Mimic: 'shift', Vault: 'shift', Curse: 'shift',
  Rage: 'shift', RageB: 'shift', Burn: 'shift', FireStarter: 'shift', Control: 'shift', Rally: 'shift',
  SkyLift: 'trade', FirewallB: 'trade', MorphS: 'trade',
  Freeze: 'ward', IceWall: 'ward', Firewall: 'ward', Rescue: 'ward',
  Sacrifice: 'change', Salvation: 'change', Morph: 'change', MorphB: 'change', MorphP: 'change', Spawn: 'change', SpawnK: 'change', Spawn2: 'change', SpawnK2: 'change',
  EarthQuake: 'quake', EarthQuakeB: 'quake',
  // A Mirror move carries the copied card's tag, so it plays that card's beat.
  Growth: 'rule', GrowthB: 'rule', Mirror: 'rule', MirrorB: 'rule',
};

/**
 * The cast beat of a card move and its squares: shift and trade [from, to], ward [the marked piece], change [each new
 * piece], quake [the centre, then each pushed piece], rule none. A card that captures has none: the capture beat wins.
 */
export function castOf(move: Move): { family: CastFamily; squares: number[] } | undefined {
  if (!move.power || move.pass || move.captures.length) return undefined;
  const family = CAST_FAMILY[TAG_POWER[move.power]] ?? 'rule';
  const squares = family === 'rule' ? [] : family === 'ward' ? [move.to]
    : family === 'change' ? [move.to, ...move.drop2 != null ? [move.drop2] : []]
    : family === 'quake' ? [move.from, ...(move.pushes ?? []).map(p => p.to)] : [move.from, move.to];
  return { family, squares };
}
