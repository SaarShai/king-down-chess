import type { CardName } from '../rules/rules';
import { art } from '../account-game/art';
import { RELEASED_CARDS } from '../content/cards';
import { motionTag } from './card-motion/tag';
import './card-motion/runtime';

/** Use the card's painting. A New game tile (New game builds every card at start) loads its painting only
 * when it shows, as the small thumbnail of tools/card-thumbs.ts; the full card keeps the full painting. */
export function cardArt(card: CardName, tile = false): string {
  const entry = RELEASED_CARDS.find(entry => entry.id === card);
  const path = entry ? entry.art : `ui/cards/${card.toLowerCase()}.webp`;
  const face = path && art(tile ? path.replace('ui/cards/', 'assets/card-thumbs/') : path);
  return face ? `<img src="${face}" alt=""${tile ? ' loading="lazy" decoding="async"' : ''}>${motionTag(card, face)}` : '';
}
