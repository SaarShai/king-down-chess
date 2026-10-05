import { afterEach, describe, expect, it } from 'vitest';
import { Game } from './game';
import { archerParam, linkArcher } from './link';
import { RULES, RULES_2017, setRules } from './rules/rules';
import { fromFen } from './rules/setup';

afterEach(() => setRules());

// A game a friend sent before 2026-10-05: the archer on d4 shoots its diagonal neighbour on c5,
// which the over-a-piece Archer cannot.
const FEN = '7k/8/8/2p5/3A4/8/8/K7 w - - 0 1';
const MOVES = ['Ad4*c5', 'Kh8-h7'];
const replay = (): number => { const g = new Game(); g.load(fromFen(FEN)); return g.playLan(MOVES); };

describe('a game link keeps the Archer its game began with', () => {
  it('a link without `archer` was made before 2026-10-05 and replays under the old Archer', () => {
    expect(replay()).toBe(0); // under today's rules the first move is not legal
    setRules(linkArcher(new URLSearchParams('fen=x&moves=y'), false));
    expect(RULES.archerShots).toBe('plusDiagFwd2');
    expect(replay()).toBe(MOVES.length);
    // Its answer names that Archer, so the friend's device opens it the same way.
    expect(archerParam(RULES, false)).toBe('plusDiagFwd2');
  });

  it('a new link names today\'s Archer, and opens under it', () => {
    const archer = archerParam(setRules(), false)!;
    expect(archer).toBe('over2');
    expect(linkArcher(new URLSearchParams({ archer }), false)).toEqual({ archerShots: 'over2' });
  });

  it('a `?rules=` preset sets its own Archer: the link names none and reads none', () => {
    expect(archerParam(setRules(RULES_2017), true)).toBeNull();
    expect(linkArcher(new URLSearchParams('archer=over2'), true)).toEqual({});
    expect(() => linkArcher(new URLSearchParams('archer=lasers'), false)).toThrow(/bad archerShots/);
  });
});
