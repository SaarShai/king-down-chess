import { cardPicture } from '../card-symbol';
import type { CardName } from '../rules/rules';
import { art } from './art';

/** Use a painting or a small rule picture. */
export function cardArt(card: CardName): string {
  const face = art(`ui/cards/${card.toLowerCase()}.webp`);
  if (face) return `<img src="${face}" alt="">`;
  return cardPicture(card);
}
