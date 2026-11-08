import { describe, expect, it } from 'vitest';
import { GameRules } from '../game-rules';
import { DEFAULT_RULES, POWERS_BALANCED } from '../rules/engine';
import { backRankWords, boardWords, checkWords, explainWords, moveWords } from './board-words';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
const FAIRY = 'rsakgqob/pppppppp/8/8/8/8/PPPPPPPP/RSAKGQOB w - - 0 1';
const CHECK = '7k/p7/8/8/8/5n2/8/4K3 w - - 0 1';
const FROST = { ...DEFAULT_RULES, ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] } as const;
const legal = (fen: string, rules = DEFAULT_RULES): string[] => {
  const context = new GameRules(rules), pos = context.fromFen(fen);
  return context.legalMoves(pos).map(m => context.toLan(pos, m));
};
const words = (s: string): number => s.split(/\s+/).length;

describe('board words', () => {
  it('draws the start grid with the viewer at the bottom', () => {
    expect(boardWords(DEFAULT_RULES, START, 0).grid).toBe([
      '8 r n b q k b n r', '7 p p p p p p p p', '6 . . . . . . . .', '5 . . . . . . . .',
      '4 . . . . . . . .', '3 . . . . . . . .', '2 P P P P P P P P', '1 R N B Q K B N R', '  a b c d e f g h',
    ].join('\n'));
    expect(boardWords(DEFAULT_RULES, START, 1).grid).toBe([
      '1 R N B K Q B N R', '2 P P P P P P P P', '3 . . . . . . . .', '4 . . . . . . . .',
      '5 . . . . . . . .', '6 . . . . . . . .', '7 p p p p p p p p', '8 r n b k q b n r', '  h g f e d c b a',
    ].join('\n'));
  });

  it.each([
    [START, 0, 'You are White. Move 1. Your move.'],
    [START, 1, 'You are Black. Move 1. White to move.'],
    ['rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b - - 0 12', 0, 'You are White. Move 12. Black to move.'],
    [CHECK, 0, 'You are White. Move 1. Check! Your move.'],
    ['rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w - - 1 3', 0, 'You are White. Move 3. Checkmate. You lose.'],
    ['rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w - - 1 3', 1, 'You are Black. Move 3. Checkmate. You win.'],
  ] as const)('says the status of %s for seat %i', (fen, viewer, status) => {
    const said = boardWords(DEFAULT_RULES, fen, viewer).status;
    expect(said).toBe(status);
    expect(words(said)).toBeLessThan(20);
  });

  it('lists pieces king first, fairy pieces in letter order, pawns last', () => {
    expect(boardWords(DEFAULT_RULES, START, 0).white).toBe('White: king e1; queen d1; rooks a1, h1; bishops c1, f1; knights b1, g1; pawns a2, b2, c2, d2, e2, f2, g2, h2.');
    const fairy = boardWords(DEFAULT_RULES, FAIRY, 0);
    expect(fairy.white).toBe('White: king d1; queen f1; rook a1; bishop h1; archer c1; guard e1; beast b1; ogre g1; pawns a2, b2, c2, d2, e2, f2, g2, h2.');
    expect(fairy.black).toBe('Black: king d8; queen f8; rook a8; bishop h8; archer c8; guard e8; beast b8; ogre g8; pawns a7, b7, c7, d7, e7, f7, g7, h7.');
  });

  it('marks a frozen piece', () => {
    expect(boardWords(FROST, '4k3/8/8/4n3/8/8/8/4K3 b - - 0 1 me5w', 1).black).toBe('Black: king e8; knight e5 (frozen).');
  });

  it('names only the fairy letters on the board', () => {
    expect(boardWords(DEFAULT_RULES, FAIRY, 0).legend).toBe('A archer, G guard, S beast, O ogre');
    expect(boardWords(DEFAULT_RULES, '4k3/8/8/8/8/8/8/4KS2 w - - 0 1', 0).legend).toBe('S beast');
    expect(boardWords(DEFAULT_RULES, START, 0).legend).toBe('');
  });

  it('says the check cause from the viewer side, and null without check', () => {
    expect(checkWords(DEFAULT_RULES, CHECK, 0)).toBe('Their knight attacks your king.');
    expect(checkWords(DEFAULT_RULES, CHECK, 1)).toBe('Your knight attacks their king.');
    expect(checkWords(DEFAULT_RULES, START, 0)).toBeNull();
  });

  it('reads the back rank from a to h', () => {
    expect(backRankWords(DEFAULT_RULES, FAIRY)).toBe('Back rank from a to h: rook, beast, archer, king, guard, queen, ogre, bishop.');
    expect(backRankWords(DEFAULT_RULES, '4k3/8/8/8/8/8/8/r3K3 w - - 0 1')).toBe('Back rank from a to h: black rook, empty, empty, empty, king, empty, empty, empty.');
  });

  it('says a move in one sentence and refuses an illegal one', () => {
    const lan = legal(START).find(l => l.includes('e2') && l.includes('e4'))!;
    expect(moveWords(DEFAULT_RULES, START, lan)).toBe('White pawn e2 to e4.');
    expect(() => moveWords(DEFAULT_RULES, START, 'e2-e5')).toThrow('not a legal move');
  });
});

describe('explain words', () => {
  const at = (fen: string, viewer: 0 | 1 = 0) => ({ fen, viewer, legal: legal(fen) });

  it('explains a fairy piece by name or letter', () => {
    const archer = explainWords(null, 'Archer')!;
    expect(archer).toMatch(/^Archer: Moves 1 square/);
    expect(archer).toContain('Shoots without moving');
    expect(explainWords(null, 'a')).toBe(archer);
    expect(explainWords(DEFAULT_RULES, ' beasts ')).toMatch(/^Beast: /);
  });

  it('explains a square in a game with the moves of the viewer piece', () => {
    const knight = explainWords(DEFAULT_RULES, 'G1', at(START))!;
    expect(knight).toMatch(/^White knight on g1: Moves in an L/);
    expect(knight).toContain('White knight g1 to f3.');
    expect(knight).toContain('White knight g1 to h3.');
    expect(explainWords(DEFAULT_RULES, 'c1', at(FAIRY))).toBe('White archer on c1: Shoots 2 squares straight or diagonally forward. It has no legal move now.');
    expect(explainWords(DEFAULT_RULES, 'g8', at(START))).toBe('Black knight on g8: Moves in an L, over any piece.');
    expect(explainWords(DEFAULT_RULES, 'e4', at(START))).toBe('e4 is empty.');
    expect(explainWords(DEFAULT_RULES, 'e4')).toBeNull();
  });

  it('adds at most six moves for a piece the viewer has', () => {
    const pawn = explainWords(DEFAULT_RULES, 'pawn', at(START))!;
    expect(pawn.match(/White pawn \w\d to \w\d\./g)).toHaveLength(6);
    expect(pawn).toContain('Plus 10 more moves.');
    expect(explainWords(DEFAULT_RULES, 'pawn', at(START, 1))).toBe(explainWords(DEFAULT_RULES, 'pawn'));
  });

  it('explains a power and a card by name or id', () => {
    const wall = explainWords(null, 'ice wall')!;
    expect(wall).toMatch(/^Ice Wall: Wall one of your pieces/);
    expect(explainWords(null, 'IceWall')).toBe(wall);
    expect(explainWords(FROST, 'freeze')).toMatch(/^Freeze: Freeze an enemy piece/);
    expect(explainWords(null, 'skylift')).toMatch(/^Sky ?Lift: Two of your pieces/);
  });

  it.each(['dragon', 'z9', ''])('returns null for the unknown topic %j', topic => {
    expect(explainWords(null, topic)).toBeNull();
  });
});
