import { describe, expect, it } from 'vitest';
import { emblemArt, powerArt } from './power-motion';
import { KINGS, type KingName, type PowerName } from './rules/engine';

const POWERS = Object.values(KINGS).flat() as PowerName[];
const ids = (s: string) => [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);

describe('power motion art', () => {
  it('draws a vignette for each of the twelve powers and for No power', () => {
    expect(POWERS).toHaveLength(12);
    for (const p of [...POWERS, null]) {
      const art = powerArt(p);
      expect(art).toMatch(new RegExp(`^<span class="pm pm-${p ?? 'none'}" aria-hidden="true"><svg viewBox="0 0 80 48" focusable="false">`));
      expect(art.match(/>[^<]+</g), 'no text, so the button\'s text stays its label').toBeNull();
      for (const id of ids(art)) expect(art).toContain(`url(#${id})`); // every gradient is used
    }
  });

  it('gives each copy its own gradient ids, so a hidden copy never paints another', () => {
    const a = ids(powerArt('Freeze')), b = ids(powerArt('Freeze'));
    expect(a.length).toBeGreaterThan(0);
    expect(a.filter(id => b.includes(id))).toEqual([]);
  });

  it('wraps each emblem with an effect behind and in front, hidden from screen readers', () => {
    for (const k of Object.keys(KINGS) as KingName[]) {
      const art = emblemArt(k, '<img alt="" />');
      expect(art).toMatch(new RegExp(`^<span class="em-art kx-${k.toLowerCase()}"><svg class="kx kx-back"[^>]* aria-hidden="true"`));
      expect(art).toContain('<img alt="" /><svg class="kx kx-front"');
      expect(art.match(/>[^<]+</g)).toBeNull();
    }
  });
});
