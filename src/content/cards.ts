import type { CardName } from '../rules/rules';

export interface ReleasedCard {
  id: CardName;
  name: string;
  availability: 'released';
  /** The approved painting. Null uses the rule picture named by this card's ID. */
  art: `ui/cards/${string}.webp` | null;
  fixtureId: `card-${string}`;
}

/** The released deal order (Q20). Mechanics and contextual rule text stay in their own modules. */
export const RELEASED_CARDS: readonly ReleasedCard[] = [
  { id: 'Freeze', name: 'Freeze', availability: 'released', art: 'ui/cards/freeze.webp', fixtureId: 'card-freeze' },
  { id: 'IceWall', name: 'Ice Wall', availability: 'released', art: 'ui/cards/icewall.webp', fixtureId: 'card-icewall' },
  { id: 'Strike', name: 'Strike', availability: 'released', art: 'ui/cards/strike.webp', fixtureId: 'card-strike' },
  { id: 'Haste', name: 'Haste', availability: 'released', art: 'ui/cards/haste.webp', fixtureId: 'card-haste' },
  { id: 'Flight', name: 'Flight', availability: 'released', art: 'ui/cards/flight.webp', fixtureId: 'card-flight' },
  { id: 'Sacrifice', name: 'Sacrifice', availability: 'released', art: 'ui/cards/sacrifice.webp', fixtureId: 'card-sacrifice' },
  { id: 'March', name: 'March', availability: 'released', art: 'ui/cards/march.webp', fixtureId: 'card-march' },
  { id: 'Leap', name: 'Leap', availability: 'released', art: 'ui/cards/leap.webp', fixtureId: 'card-leap' },
  { id: 'Salvation', name: 'Salvation', availability: 'released', art: 'ui/cards/salvation.webp', fixtureId: 'card-salvation' },
  { id: 'MirrorB', name: 'Mirror', availability: 'released', art: 'ui/cards/mirrorb.webp', fixtureId: 'card-mirrorb' },
  { id: 'Firewall', name: 'Firewall', availability: 'released', art: 'ui/cards/firewall.webp', fixtureId: 'card-firewall' },
  { id: 'EarthQuake', name: 'Earth Quake', availability: 'released', art: 'ui/cards/earthquake.webp', fixtureId: 'card-earthquake' },
  { id: 'Burn', name: 'Burn', availability: 'released', art: 'ui/cards/burn.webp', fixtureId: 'card-burn' },
  { id: 'FireStarter', name: 'Fire Starter', availability: 'released', art: 'ui/cards/firestarter.webp', fixtureId: 'card-firestarter' },
  { id: 'Control', name: 'Control', availability: 'released', art: 'ui/cards/control.webp', fixtureId: 'card-control' },
  { id: 'Rally', name: 'Rally', availability: 'released', art: 'ui/cards/rally.webp', fixtureId: 'card-rally' },
  { id: 'MorphP', name: 'Morph', availability: 'released', art: 'ui/cards/morphp.webp', fixtureId: 'card-morphp' },
  { id: 'Mimic', name: 'Mimic', availability: 'released', art: 'ui/cards/mimic.webp', fixtureId: 'card-mimic' },
  { id: 'Vault', name: 'Hop', availability: 'released', art: 'ui/cards/vault.webp', fixtureId: 'card-vault' },
  { id: 'Curse', name: 'Curse', availability: 'released', art: 'ui/cards/curse.webp', fixtureId: 'card-curse' },
  { id: 'SkyLift', name: 'Sky Lift', availability: 'released', art: 'ui/cards/skylift.webp', fixtureId: 'card-skylift' },
];
