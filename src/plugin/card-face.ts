import { cardPicture } from '../card-symbol';
import type { CardName } from '../rules/rules';
import { art } from '../account-game/art';
import { RELEASED_CARDS } from '../content/cards';

/** Use a painting or a small rule picture. A New game tile (New game builds every card at start) loads its painting only
 * when it shows, as the small thumbnail of tools/card-thumbs.ts; the full card keeps the full painting. */
export function cardArt(card: CardName, tile = false): string {
  const entry = RELEASED_CARDS.find(entry => entry.id === card);
  const path = entry ? entry.art : `ui/cards/${card.toLowerCase()}.webp`;
  const face = path && art(tile ? path.replace('ui/cards/', 'assets/card-thumbs/') : path);
  if (face) return `<img src="${face}" alt=""${tile ? ' loading="lazy" decoding="async"' : ''}>`;
  return cardPicture(card);
}
