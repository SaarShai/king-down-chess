import { cardName } from '../powers-ui';
import { powerArt } from '../power-motion';
import type { CardName } from '../rules/rules';
import { art } from './art';

/** Use a painting, an existing power scene, or a plain name. */
export function cardArt(card: CardName): string {
  const face = art(`ui/cards/${card.toLowerCase()}.webp`);
  if (face) return `<img src="${face}" alt="">`;
  if (card === 'Strike' || card === 'Haste' || card === 'Flight') return powerArt(card);
  return `<span class="cf-word" aria-hidden="true">${cardName(card)}</span>`;
}
