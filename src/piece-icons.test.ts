import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ICON_PIECES, pieceIcon } from './piece-icons';
import { A, C, NAMES, O, P, T, V, type PieceType } from './rules/engine';

describe('piece icons', () => {
  it.each(ICON_PIECES)('%s: one 48-unit file that the page can paint', name => {
    const svg = readFileSync(new URL(`../public/ui/icons/${name}.svg`, import.meta.url), 'utf8');
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" id="icon" viewBox="0 0 48 48">/);
    expect(svg).toContain('var(--pi-disc,');
    expect(svg).toContain('stroke:var(--pi-ring,currentColor)');
    expect(svg).toContain('fill:var(--pi-glyph,currentColor)');
    // No fixed black anywhere: the game colours ring and glyph per army and background.
    expect(svg).not.toMatch(/#000|black/);
  });

  it('every piece of the game has one; the lab pieces have none', () => {
    for (let t = P; t <= O; t++) expect(pieceIcon(t as PieceType)).toContain(`ui/icons/${NAMES[t]}.svg#icon`);
    for (const t of [C, V, T] as PieceType[]) expect(pieceIcon(t)).toBe('');
  });

  it('is decoration, in its army colours when asked', () => {
    expect(pieceIcon(A)).toMatch(/^<svg class="pi" aria-hidden="true"/);
    expect(pieceIcon(A, 0)).toContain('class="pi pi-w"');
    expect(pieceIcon(A, 1)).toContain('class="pi pi-b"');
  });
});
