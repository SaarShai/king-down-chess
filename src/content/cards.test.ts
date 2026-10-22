import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { RELEASED_CARDS } from './cards';
import { ALL_CARDS } from '../rules/rules';
import { DEAL_CARDS, DEFAULT_OPTIONS, validate } from '../match/setup';
import { cardName } from '../powers-ui';
import { cardPicture } from '../card-symbol';
import { SHARED_MECHANICS } from '../../tools/fixtures/shared-mechanics';

it('preserves the released deal order and admits exactly those cards', () => {
  const released = 'Freeze IceWall Strike Haste Flight Sacrifice March Leap Salvation MirrorB Firewall EarthQuake Burn FireStarter Control Rally MorphP Mimic Vault Curse SkyLift'.split(' ');
  expect(RELEASED_CARDS.map(card => card.id)).toEqual(released);
  expect(DEAL_CARDS).toEqual(released);
  expect(DEFAULT_OPTIONS.cardPool).toEqual(released);
  for (const card of ALL_CARDS) {
    const pool = [card, ...DEAL_CARDS.filter(other => other !== card).slice(0, 3)];
    expect(validate({ ...DEFAULT_OPTIONS, cards: true, cardPool: pool }) === null, card).toBe(released.includes(card));
  }
});

it('links each released card to its signature fixture and current display name', () => {
  expect(new Set(RELEASED_CARDS.map(card => card.name)).size).toBe(21);
  expect(new Set(RELEASED_CARDS.map(card => card.fixtureId)).size).toBe(21);
  for (const card of RELEASED_CARDS) {
    expect(card.availability).toBe('released');
    expect(cardName(card.id)).toBe(card.name);
    expect(SHARED_MECHANICS.find(row => row.id === card.fixtureId)).toMatchObject({ family: 'card', item: card.id });
  }
  expect(['MirrorB', 'MorphP', 'EarthQuake', 'SkyLift'].map(id => RELEASED_CARDS.find(card => card.id === id)?.name)).toEqual(['Mirror', 'Morph', 'Earth Quake', 'Sky Lift']);
});

it('keeps twelve real paintings and nine existing rule pictures', () => {
  expect(RELEASED_CARDS.filter(card => card.art)).toHaveLength(12);
  for (const card of RELEASED_CARDS) {
    if (card.art) expect(readFileSync(new URL(`../../public/${card.art}`, import.meta.url)).toString('ascii', 8, 12), card.id).toBe('WEBP');
    else {
      const picture = cardPicture(card.id);
      expect(picture).toContain(`data-card-picture="${card.id}"`);
      expect(picture).not.toMatch(/undefined|<text|back.webp/);
    }
  }
});
