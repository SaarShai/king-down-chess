import { cardPicture } from '../card-symbol';
import type { CardName } from '../rules/rules';
import { art } from '../account-game/art';
import { RELEASED_CARDS } from '../content/cards';

/** Use a painting or a small rule picture. */
export function cardArt(card: CardName): string {
  const entry = RELEASED_CARDS.find(entry => entry.id === card);
  const path = entry ? entry.art : `ui/cards/${card.toLowerCase()}.webp`;
  const face = path && art(path);
  if (face) return `<img src="${face}" alt="">`;
  return cardPicture(card);
}
