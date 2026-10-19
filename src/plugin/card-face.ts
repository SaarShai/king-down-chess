import { cardName } from '../powers-ui';
import type { CardName } from '../rules/rules';
import { art } from './art';

/** Use a painting or a plain name. */
export function cardArt(card: CardName): string {
  const face = art(`ui/cards/${card.toLowerCase()}.webp`);
  if (face) return `<img src="${face}" alt="">`;
  return `<span class="cf-word" aria-hidden="true">${cardName(card)}</span>`;
}
