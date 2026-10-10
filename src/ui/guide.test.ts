import { afterEach, describe, expect, it } from 'vitest';
import { C, K, N, P, parseKings, setRules } from '../rules/engine';
import { kingArt, pieceArt } from './guide';

const base = import.meta.env.BASE_URL;
afterEach(() => { setRules(); });

describe('piece art', () => {
  it('is the figure of the piece in its colour; a lab piece has none', () => {
    expect(pieceArt(P)).toBe(`${base}ui/pieces/pawn-w.webp`);
    expect(pieceArt(N, true)).toBe(`${base}ui/pieces/knight-b.webp`);
    expect(pieceArt(C)).toBeNull();
  });

  it('draws each king as the king its side plays: Spirit and Shadow without powers', () => {
    expect(kingArt(0)).toBe(`${base}ui/kings/spirit.webp`);
    expect(pieceArt(K, true)).toBe(`${base}ui/kings/shadow-b.webp`);
    setRules({ kings: parseKings('mud:march,none') });
    expect(kingArt(0)).toBe(`${base}ui/kings/mud.webp`);
    expect(pieceArt(K)).toBe(`${base}ui/kings/mud.webp`);
    expect(kingArt(1)).toBe(`${base}ui/kings/shadow-b.webp`);
  });
});
