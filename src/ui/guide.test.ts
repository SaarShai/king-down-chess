import { GameRules } from '../game-rules';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { C, K, N, P, parseKings } from '../rules/engine';
import { connectGuide, kingArt, pieceArt } from './guide';

const base = import.meta.env.BASE_URL;
afterEach(() => vi.unstubAllGlobals());


describe('piece art', () => {
  it('is the figure of the piece in its colour; a lab piece has none', () => {
    expect(pieceArt(P)).toBe(`${base}ui/pieces/pawn-w.webp`);
    expect(pieceArt(N, true)).toBe(`${base}ui/pieces/knight-b.webp`);
    expect(pieceArt(C)).toBeNull();
  });

  it('draws each king as the king its side plays: Spirit and Shadow without powers', () => {
    expect(kingArt(0)).toBe(`${base}ui/kings/spirit.webp`);
    expect(pieceArt(K, true)).toBe(`${base}ui/kings/shadow-b.webp`);
    const context = new GameRules({ kings: parseKings('mud:march,none') });
    expect(kingArt(0, context)).toBe(`${base}ui/kings/mud.webp`);
    expect(pieceArt(K, false, context)).toBe(`${base}ui/kings/mud.webp`);
    expect(kingArt(1)).toBe(`${base}ui/kings/shadow-b.webp`);
  });
});

it('fills promotion and White power text from the retained game context', () => {
  const nodes = new Map<string, { innerHTML: string; textContent: string; appendChild: () => void }>();
  const node = (id: string) => {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', appendChild: () => {} });
    return nodes.get(id)!;
  };
  vi.stubGlobal('document', { getElementById: node, createElement: () => ({ dataset: {} }) });
  const retained = new GameRules({ promotionSet: 'anyNonKing', freezeUses: 5, kings: parseKings('frost:freeze,none') });
  let context = retained;
  const guide = connectGuide({ context: () => context, shownPos: () => context.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1') });
  guide.fill();
  expect(node('rules-lead').textContent).toContain('A pawn promotes to any piece but a king.');
  expect(node('powers-list').innerHTML).toContain('5 times a game');
  context = new GameRules(); guide.fill();
  expect(node('rules-lead').textContent).toContain('A pawn promotes to a queen, rook, bishop, or knight.');
  expect(node('powers-list').innerHTML).not.toContain('5 times a game');
  context = retained; guide.fill();
  expect(node('powers-list').innerHTML).toContain('5 times a game');
});
