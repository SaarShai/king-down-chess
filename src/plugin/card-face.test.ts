import { expect, it, vi } from 'vitest';
import { DEAL_CARDS } from '../match/setup';
import { cardArt } from './card-face';

const painted = ['Freeze','IceWall','Strike','Haste','Flight','Sacrifice','March','Leap','Salvation','Mimic','Vault','SkyLift'];
vi.mock('../account-game/art', () => ({ art: (path: string) => ['freeze','icewall','strike','haste','flight','sacrifice','march','leap','salvation','mimic','vault','skylift'].some(c => [`ui/cards/${c}.webp`, `assets/card-thumbs/${c}.webp`].includes(path)) ? path : undefined }));

it('uses twelve paintings and nine rule pictures', () => {
  for (const card of DEAL_CARDS) {
    const face = cardArt(card);
    if (painted.includes(card)) expect(face).toContain(`<img src="ui/cards/${card.toLowerCase()}.webp" alt="">`);
    else expect(face).toContain(`class="card-picture" data-card-picture="${card}"`);
    expect(face).not.toContain('back.webp');
  }
  expect(cardArt('MirrorB')).not.toContain('<text');
  expect(cardArt('MorphP')).not.toContain('<text');
});

it('gives a New game tile the lazy thumbnail and the full card the full painting', () => {
  for (const card of DEAL_CARDS) {
    const tile = cardArt(card, true);
    if (painted.includes(card)) expect(tile).toBe(`<img src="assets/card-thumbs/${card.toLowerCase()}.webp" alt="" loading="lazy" decoding="async">`);
    else expect(tile).toBe(cardArt(card));
  }
});
