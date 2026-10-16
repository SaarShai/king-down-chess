import { expect, it, vi } from 'vitest';
import { DEAL_CARDS } from '../match/setup';
import { cardArt } from './card-face';

const painted = ['Freeze','IceWall','Sacrifice','March','Leap','Salvation','Mimic','Vault','SkyLift'];
vi.mock('./art', () => ({ art: (path: string) => ['freeze','icewall','sacrifice','march','leap','salvation','mimic','vault','skylift'].some(c => path === `ui/cards/${c}.webp`) ? path : undefined }));

it('uses the nine paintings, three power scenes and nine plain names', () => {
  for (const card of DEAL_CARDS) {
    const face = cardArt(card);
    if (painted.includes(card)) expect(face).toContain(`<img src="ui/cards/${card.toLowerCase()}.webp" alt="">`);
    else if (['Strike','Haste','Flight'].includes(card)) expect(face).toContain(`pm-${card}`);
    else expect(face).toMatch(/^<span class="cf-word">[^<]+<\/span>$/);
    expect(face).not.toContain('back.webp');
  }
  expect(cardArt('MirrorB')).toContain('>Mirror<');
  expect(cardArt('MorphP')).toContain('>Morph<');
});
