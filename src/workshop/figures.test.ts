import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { FIGURES, selectedFigure, suggestedFigures } from './figures';
import { designCode, fromPreset, keyOf, parseDesign, presetOf, validStored } from './model';
import { judge } from './judge';
import { lookOf } from './look';
import { modelHtml } from './art';

describe('Workshop cast', () => {
  it('ships both armies for every approved identity, with no rejected or pending figures', () => {
    expect(FIGURES).toHaveLength(34);
    expect(new Set(FIGURES.map(f => f.id)).size).toBe(34);
    for (const f of FIGURES) for (const army of ['w', 'b'])
      expect(existsSync(`public/ui/workshop/${f.id}-${army}.webp`), f.id).toBe(true);
    expect(FIGURES.some(f => ['wind-cart', 'ring-thrower', 'moth-oracle'].includes(f.id))).toBe(false);
  });
  it('suggests ranged art for shots, but a chosen look stays fixed and does not change rules or worth', () => {
    const d = fromPreset(presetOf('archer'));
    expect(suggestedFigures(d)).toHaveLength(3);
    expect(suggestedFigures(d).every(f => f.tags.includes('Ranged'))).toBe(true);
    const before = [keyOf(d), judge(d).worth.point];
    d.look.figure = 'clay-golem';
    expect(selectedFigure(d).id).toBe('clay-golem');
    expect([keyOf(d), judge(d).worth.point]).toEqual(before);
    d.squares = [];
    expect(selectedFigure(d).id).toBe('clay-golem');
  });
  it('keeps every figure in saves and share links, renders the right army, and rejects unknown IDs', () => {
    const d = fromPreset(presetOf('knight'));
    d.name = 'New piece'; d.letter = 'D';
    for (const f of FIGURES) {
      d.look.figure = f.id; d.look.army = 1;
      expect(validStored(d)).toBe(true);
      const back = parseDesign(designCode(d))!;
      expect(back.look.figure).toBe(f.id);
      expect(modelHtml(lookOf(back, judge(back)))).toContain(`/ui/workshop/${f.id}-b.webp`);
    }
    d.look.figure = '../unknown';
    expect(validStored(d)).toBe(false);
    expect(parseDesign(designCode(d))).toBeNull();
  });
});
