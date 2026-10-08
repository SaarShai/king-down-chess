import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { FIGURES, selectedFigure, suggestedFigures, type Figure } from './figures';
import { designCode, fromPreset, keyOf, parseDesign, presetOf, validStored } from './model';
import { judge } from './judge';
import { lookOf } from './look';
import { modelHtml } from './art';

describe('Workshop cast', () => {
  const ids = FIGURES.map(f => f.id);
  it('keeps the cast list equal to the figure module', () => {
    const cast = JSON.parse(readFileSync('docs/visual-design/workshop/cast.json', 'utf8')) as Figure[];
    expect(cast.map(({ id, name, tags }) => ({ id, name, tags }))).toEqual(FIGURES);
  });
  it('ships only the two armies of each approved identity, with no rejected or pending figures', () => {
    expect(new Set(ids).size).toBe(ids.length);
    expect(readdirSync('public/ui/workshop').sort()).toEqual(ids.flatMap(id => [`${id}-w.webp`, `${id}-b.webp`]).sort());
    expect(ids.some(id => ['wind-cart', 'ring-thrower', 'moth-oracle'].includes(id))).toBe(false);
  });
  it('lists one source PNG per figure in the workshop section of the art manifest', () => {
    const manifest = readFileSync('art-src/MANIFEST.md', 'utf8');
    const start = manifest.search(/^## workshop — /m);
    expect(start).toBeGreaterThan(-1);
    const section = manifest.slice(start).split(/\n(?=#{1,2} )/)[0];
    expect(Number(/^## workshop — (\d+) files, [\d.]+ MB$/m.exec(section)?.[1])).toBe(2 * ids.length);
    const rows = [...section.matchAll(/^\| `([a-z0-9-]+)\.png` \|/gm)].map(m => m[1]);
    expect(rows.sort()).toEqual([...ids].sort());
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
  it('suggests strong art for a piece that becomes another on its first take (review F13)', () => {
    const d = { squares: [{ x: 0, y: 1, mark: 'both' as const }], lines: [], rules: [{ when: { on: 'firstTake' as const }, does: { a: 'becomes' as const, into: 'Q' as const } }] };
    expect(suggestedFigures(d).every(f => f.tags.includes('Strong'))).toBe(true);
  });
  it('keeps every figure in saves and share links, renders the right army, and rejects unknown IDs', () => {
    const d = fromPreset(presetOf('knight'));
    d.name = 'New piece'; d.letter = 'D';
    for (const f of FIGURES) {
      d.look.figure = f.id; d.look.army = 1;
      expect(validStored(d)).toBe(true);
      const back = parseDesign(designCode(d))!;
      expect(back.look.figure).toBe(f.id);
      expect(modelHtml(lookOf(back))).toContain(`/ui/workshop/${f.id}-b.webp`);
    }
    d.look.figure = '../unknown';
    expect(validStored(d)).toBe(false);
    expect(parseDesign(designCode(d))).toBeNull();
  });
});
