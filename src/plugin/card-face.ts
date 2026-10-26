import { cardPicture } from '../card-symbol';
import type { CardName } from '../rules/rules';
import { art } from '../account-game/art';
import { RELEASED_CARDS } from '../content/cards';

/** Use a painting or a small rule picture. A lazy painting loads only when it shows (New game builds every card at start). */
export function cardArt(card: CardName, lazy = false): string {
  const entry = RELEASED_CARDS.find(entry => entry.id === card);
  const path = entry ? entry.art : `ui/cards/${card.toLowerCase()}.webp`;
  const face = path && art(path);
  if (face) return `<img src="${face}" alt=""${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
  return cardPicture(card);
}
