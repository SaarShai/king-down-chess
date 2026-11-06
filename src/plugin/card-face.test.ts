import { expect, it, vi } from 'vitest';
import { DEAL_CARDS } from '../match/setup';
import { cardArt } from './card-face';

vi.mock('../account-game/art', () => ({ art: (path: string) => path }));

it('uses a painting for every card', () => {
  for (const card of DEAL_CARDS) {
    const face = cardArt(card);
    expect(face).toContain(`<img src="ui/cards/${card.toLowerCase()}.webp" alt="">`);
    expect(face).not.toContain('back.webp');
  }
});

it('gives a New game tile the lazy thumbnail and the full card the full painting', () => {
  for (const card of DEAL_CARDS) expect(cardArt(card, true)).toContain(`<img src="assets/card-thumbs/${card.toLowerCase()}.webp" alt="" loading="lazy" decoding="async">`);
});
