import assert from 'node:assert/strict';
import { GameRules } from '../../src/game-rules';
import type { MatchSetup, MatchSnapshot } from '../../src/match';
import type { Rules } from '../../src/rules/rules';

export interface MechanicMark { sq: string; ward?: boolean; all?: boolean; left?: number }
export interface MechanicExpected {
  /** FEN letters, with null for an empty square. These effects are hand-authored. */
  board?: Record<string, string | null>;
  turn?: 0 | 1;
  used?: readonly [number, number];
  marks?: readonly [MechanicMark | null, MechanicMark | null];
  free?: boolean;
  haste?: string | null;
  lost?: Record<string, number>;
  halfmove?: number;
  legalIncludes?: readonly string[];
  legalExcludes?: readonly string[];
  rules?: Partial<Rules>;
}
export interface SharedMechanic {
  id: string;
  family: 'fairy' | 'card' | 'power' | 'interaction';
  item: string;
  setup: MatchSetup;
  /** Exactly one complete White turn unless turns supplies explicit seat boundaries. */
  actions: string[];
  turns?: string[][];
  expected: MechanicExpected;
  checkpoints?: { after: number; expected: MechanicExpected }[];
}

/** Shared by the worker check and the compiled surface runner; expected effects stay literal. */
export function assertMechanicExpected(snapshot: Pick<MatchSnapshot, 'fen' | 'rules' | 'turn' | 'legal'>, expected: MechanicExpected, message = ''): void {
  const pos = new GameRules(snapshot.rules).fromFen(snapshot.fen);
  const letters = ' PNBRQKALGMSOCVT';
  const square = (name: string): number => name.charCodeAt(0) - 97 + (Number(name[1]) - 1) * 8;
  const name = (index: number): string => String.fromCharCode(97 + index % 8) + (1 + Math.floor(index / 8));
  for (const [sq, want] of Object.entries(expected.board ?? {})) {
    const p = pos.board[square(sq)], letter = letters[p & 15];
    assert.equal(p ? (p & 16 ? letter.toLowerCase() : letter) : null, want, `${message} board ${sq}`);
  }
  if (expected.turn !== undefined) assert.equal(snapshot.turn, expected.turn, `${message} turn`);
  if (expected.used) assert.deepEqual(pos.used ?? [0, 0], expected.used, `${message} spent uses`);
  if (expected.marks) {
    const normalize = (mark: MechanicMark | null) => mark ? { sq: mark.sq, ward: !!mark.ward, all: !!mark.all, left: mark.left ?? 1 } : null;
    const actual = [0, 1].map(side => { const mark = pos.marks?.[side]; return normalize(mark ? { ...mark, sq: name(mark.sq) } : null); });
    assert.deepEqual(actual, expected.marks.map(normalize), `${message} marks`);
  }
  if (expected.free !== undefined) assert.equal(!!pos.free, expected.free, `${message} free continuation`);
  if (expected.haste !== undefined) assert.equal(pos.haste === undefined ? null : name(pos.haste), expected.haste, `${message} second move`);
  for (const [letter, count] of Object.entries(expected.lost ?? {})) {
    const slot = (letter === letter.toLowerCase() ? 16 : 0) + letters.indexOf(letter.toUpperCase());
    assert.equal(pos.lost?.[slot] ?? 0, count, `${message} reserve ${letter}`);
  }
  if (expected.halfmove !== undefined) assert.equal(pos.halfmove, expected.halfmove, `${message} clock`);
  for (const lan of expected.legalIncludes ?? []) assert(snapshot.legal.includes(lan), `${message} permits ${lan}`);
  for (const lan of expected.legalExcludes ?? []) assert(!snapshot.legal.includes(lan), `${message} refuses ${lan}`);
  for (const [key, value] of Object.entries(expected.rules ?? {})) assert.deepEqual(snapshot.rules[key as keyof typeof snapshot.rules], value, `${message} rule ${key}`);
}

// Reuse the positions in rules/{rules,powers,cards,cards-2014,rally,morph-soft}.test.ts.
// A card's hand position is its spent bit. Keep these small hands explicit.
export const SHARED_MECHANICS: readonly SharedMechanic[] = [
  { id: 'fairy-archer-shot', family: 'fairy', item: 'A',
    setup: { fen: '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1' }, actions: ['Ac3*c5'],
    expected: { board: { c3: 'A', c4: 'P', c5: null }, turn: 1 } },
  { id: 'fairy-guard-wall', family: 'fairy', item: 'G',
    setup: { fen: '3r4/8/8/4k3/8/3G4/8/K7 w - - 0 1' }, actions: ['Gd3-d4'],
    expected: { board: { d3: null, d4: 'G' }, turn: 1, legalIncludes: ['Ke5xd4'], legalExcludes: ['Rd8xd4'] } },
  { id: 'fairy-paladin-pawn', family: 'fairy', item: 'L',
    setup: { fen: '7k/8/r7/8/p7/2g5/P7/L6K w - - 0 1' }, actions: ['La1xa4'],
    expected: { board: { a1: null, a2: 'P', a4: 'L', a6: 'r', c3: 'g' }, turn: 1 } },
  { id: 'fairy-maester-swap', family: 'fairy', item: 'M',
    setup: { fen: '7k/8/8/8/8/8/pN6/M3K3 w - - 0 1' }, actions: ['Ma1<>e1'],
    expected: { board: { a1: 'K', e1: 'M', b2: 'N' }, turn: 1 } },
  { id: 'fairy-ogre-push', family: 'fairy', item: 'O',
    setup: { fen: 'k7/8/8/2p5/1pOPn3/8/8/7K w - - 0 1' }, actions: ['Oc4>c5-c6'],
    expected: { board: { c4: null, c5: 'O', c6: 'p', d4: 'P', e4: 'n' }, turn: 1 } },
  { id: 'fairy-beast-chain', family: 'fairy', item: 'S',
    setup: { fen: '7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1' }, actions: ['Sd4xc4xd5xe5xf6'],
    expected: { board: { d4: null, c4: null, d5: null, e5: null, f6: 'S' }, turn: 1 } },

  { id: 'card-freeze', family: 'card', item: 'Freeze',
    setup: { fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', hand: ['Freeze'] }, actions: ['!F:d5'],
    expected: { board: { d5: 'n' }, turn: 1, used: [1, 0], marks: [{ sq: 'd5' }, null], legalExcludes: ['Nd5-c3'], rules: { markFree: false } } },
  { id: 'card-icewall', family: 'card', item: 'IceWall',
    setup: { fen: '4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1', hand: ['IceWall'] }, actions: ['!W:a4'],
    expected: { board: { a4: 'R', c2: 'b' }, turn: 1, used: [1, 0], marks: [{ sq: 'a4', ward: true }, null], legalExcludes: ['Bc2xa4'] } },
  { id: 'card-strike', family: 'card', item: 'Strike',
    setup: { fen: '4k3/8/8/8/7p/8/3P4/4K3 w - - 0 1', hand: ['Strike'] }, actions: ['d2-d6!'],
    expected: { board: { d2: null, d6: 'P' }, turn: 1, used: [1, 0], rules: { strikePawns: true, strikeCaptures: true } } },
  { id: 'card-haste', family: 'card', item: 'Haste',
    setup: { fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1', hand: ['Haste'] }, actions: ['Ra1xa5!H', 'Ra5xe5'],
    checkpoints: [{ after: 1, expected: { turn: 0, haste: 'a5', used: [1, 0], legalIncludes: ['Ra5xe5', '--'] } }],
    expected: { board: { a1: null, a5: null, e5: 'R' }, turn: 1, used: [1, 0], haste: null, rules: { hasteCaptures: true } } },
  { id: 'card-flight', family: 'card', item: 'Flight',
    setup: { fen: '4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1', hand: ['Flight'] }, actions: ['Nb1~d3'],
    expected: { board: { b1: null, d3: 'N' }, turn: 1, used: [1, 0] } },
  { id: 'card-sacrifice', family: 'card', item: 'Sacrifice',
    setup: { fen: '4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQG', hand: ['Sacrifice'] }, actions: ['!S:a2=Q'],
    expected: { board: { a2: 'Q' }, turn: 1, used: [1, 0], lost: { Q: 0, G: 1 } } },
  { id: 'card-march', family: 'card', item: 'March',
    setup: { fen: '7k/8/8/8/8/4P3/8/K7 w - - 0 1', hand: ['March'] }, actions: ['e3-e5!M'],
    expected: { board: { e3: null, e5: 'P' }, turn: 1, used: [1, 0] } },
  { id: 'card-leap', family: 'card', item: 'Leap',
    setup: { fen: '7k/8/8/p7/8/8/P7/R6K w - - 0 1', hand: ['Leap'] }, actions: ['Ra1-a3!L'],
    expected: { board: { a1: null, a2: 'P', a3: 'R' }, turn: 1, used: [1, 0] } },
  { id: 'card-salvation', family: 'card', item: 'Salvation',
    setup: { fen: '4k3/8/8/8/8/8/P7/N3K3 w - - 3 9 lPRQG', hand: ['Salvation'] }, actions: ['R@h1!R'],
    expected: { board: { a1: 'N', h1: 'R' }, turn: 1, used: [1, 0], lost: { P: 1, Q: 1, R: 0, G: 1 } } },
  { id: 'card-mirrorb', family: 'card', item: 'MirrorB',
    setup: { fen: '4k3/8/3n4/8/8/8/P7/4K3 w - - 0 1', hand: ['MirrorB', 'Freeze'], kings: 'Mud:March,none' }, actions: ['!F:d6!Z', 'a2-a3'],
    expected: { board: { a2: null, a3: 'P', d6: 'n' }, turn: 1, used: [1, 0], marks: [{ sq: 'd6' }, null] } },
  { id: 'card-firewall', family: 'card', item: 'Firewall',
    setup: { fen: '4k3/8/8/3r4/8/1n6/R7/N3K3 w - - 0 1', hand: ['Firewall'], kings: 'Mud:March,none' }, actions: ['!P', 'Ra2-d2'],
    checkpoints: [{ after: 1, expected: { turn: 0, free: true, marks: [{ sq: 'e1', ward: true, all: true }, null] } }],
    expected: { board: { a2: null, d2: 'R' }, turn: 1, used: [1, 0], free: false, marks: [{ sq: 'e1', ward: true, all: true }, null], legalExcludes: ['Rd5xd2', 'Nb3xa1'] } },
  { id: 'card-earthquake', family: 'card', item: 'EarthQuake',
    setup: { fen: '4k3/8/8/3p4/2N5/4B3/5P2/4K3 w - - 0 1', hand: ['EarthQuake'] }, actions: ['!Q:d4'],
    expected: { board: { c4: null, b4: 'N', d5: null, d6: 'p', e3: 'B', f2: 'P' }, turn: 1, used: [1, 0], halfmove: 0 } },
  { id: 'card-burn', family: 'card', item: 'Burn',
    setup: { fen: '4k3/8/8/3n4/8/8/R7/3QK3 w - - 0 1', hand: ['Burn'] }, actions: ['Ra2xd5!N'],
    expected: { board: { a2: null, d5: 'R', d1: 'Q' }, turn: 1, used: [1, 0] } },
  { id: 'card-firestarter', family: 'card', item: 'FireStarter',
    setup: { fen: '1n2k2r/8/8/8/8/8/8/R2QK3 w - - 0 1', hand: ['FireStarter'] }, actions: ['Ra1xh8!T'],
    expected: { board: { a1: null, h8: 'R', b8: 'n' }, turn: 1, used: [1, 0] } },
  { id: 'card-control', family: 'card', item: 'Control',
    setup: { fen: '4k3/1p6/8/8/8/8/8/RN2K3 w - - 0 1', hand: ['Control'] }, actions: ['Nb1xb7!O'],
    expected: { board: { b1: null, b7: 'N', a1: 'R' }, turn: 1, used: [1, 0] } },
  { id: 'card-rally', family: 'card', item: 'Rally',
    setup: { fen: '4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1', hand: ['Rally'] }, actions: ['Ra1-a5!J', 'Nb1-d2'],
    checkpoints: [{ after: 1, expected: { turn: 0, haste: 'a5', legalIncludes: ['Nb1-d2', '--'], legalExcludes: ['Ra5-a4', 'Nb1xc3'] } }],
    expected: { board: { a1: null, a5: 'R', b1: null, d2: 'N', c3: 'p' }, turn: 1, used: [1, 0], haste: null } },
  { id: 'card-morphp', family: 'card', item: 'MorphP',
    setup: { fen: '4k3/8/8/8/8/8/PP6/R3K3 w - - 7 12', hand: ['MorphP'] }, actions: ['!IP:b2=N'],
    expected: { board: { a2: 'P', b2: 'N' }, turn: 1, used: [1, 0], halfmove: 0 } },
  { id: 'card-mimic', family: 'card', item: 'Mimic',
    setup: { fen: '4k3/8/8/1n6/8/8/8/RN2K3 w - - 0 1', hand: ['Mimic'] }, actions: ['Nb1-b4!X'],
    expected: { board: { b1: null, b4: 'N', b5: 'n', a1: 'R' }, turn: 1, used: [1, 0] } },
  { id: 'card-vault', family: 'card', item: 'Vault',
    setup: { fen: '4k3/8/r7/8/8/n7/8/R3K3 w - - 0 1', hand: ['Vault'] }, actions: ['Ra1xa6!V'],
    expected: { board: { a1: null, a3: 'n', a6: 'R' }, turn: 1, used: [1, 0] } },
  { id: 'card-curse', family: 'card', item: 'Curse',
    setup: { fen: '4k3/8/8/3n4/8/8/P7/4K3 w - - 0 1', hand: ['Curse'] }, actions: ['!C:d5-e5'],
    expected: { board: { d5: null, e5: 'n' }, turn: 1, used: [1, 0] } },
  { id: 'card-skylift', family: 'card', item: 'SkyLift',
    setup: { fen: '4k3/8/8/8/8/8/P7/RNB1K1N1 w - - 0 1', hand: ['SkyLift'] }, actions: ['!K:a1<>g1'],
    expected: { board: { a1: 'N', g1: 'R', b1: 'N', c1: 'B' }, turn: 1, used: [1, 0] } },

  { id: 'power-freeze', family: 'power', item: 'Freeze',
    setup: { fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', kings: 'Frost:Freeze,none' }, actions: ['!F:d5', 'a2-a3'],
    checkpoints: [{ after: 1, expected: { turn: 0, free: true, used: [1, 0], legalIncludes: ['a2-a3', '--'] } }],
    expected: { board: { a2: null, a3: 'P', d5: 'n' }, turn: 1, used: [1, 0], free: false, marks: [{ sq: 'd5' }, null], legalExcludes: ['Nd5-c3'] } },
  { id: 'power-icewall', family: 'power', item: 'IceWall',
    setup: { fen: '4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1', kings: 'Frost:IceWall,none' }, actions: ['!W:a4', '--'],
    expected: { board: { a4: 'R' }, turn: 1, used: [1, 0], free: false, marks: [{ sq: 'a4' }, null], legalExcludes: ['Bc2xa4'] } },
  { id: 'power-strike', family: 'power', item: 'Strike',
    setup: { fen: '4k3/8/8/8/8/8/8/RN2K3 w - - 0 1', kings: 'Flame:Strike,none' }, actions: ['Nb1-b4!'],
    expected: { board: { b1: null, b4: 'N', a1: 'R' }, turn: 1, used: [1, 0], rules: { strikePawns: false, strikeCaptures: false } } },
  { id: 'power-haste', family: 'power', item: 'Haste',
    setup: { fen: '7k/p7/8/8/8/8/8/R5K1 w - - 0 1', kings: 'Flame:Haste,none' }, actions: ['Ra1-a4!H', '--'],
    checkpoints: [{ after: 1, expected: { turn: 0, haste: 'a4', legalIncludes: ['Ra4-e4', '--'], legalExcludes: ['Ra4xa7'] } }],
    expected: { board: { a1: null, a4: 'R', a7: 'p' }, turn: 1, used: [1, 0], haste: null, rules: { hasteCaptures: false } } },
  { id: 'power-flight', family: 'power', item: 'Flight',
    setup: { fen: '4r1k1/8/8/8/8/8/8/R3K3 w - - 0 1', kings: 'Stratus:Flight,none' }, actions: ['Ra1~e2'],
    expected: { board: { a1: null, e2: 'R', e1: 'K' }, turn: 1, used: [1, 0] } },
  { id: 'power-sacrifice', family: 'power', item: 'Sacrifice',
    setup: { fen: '4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQG', kings: 'Stratus:Sacrifice,none' }, actions: ['!S:a2=Q'],
    expected: { board: { a2: 'Q' }, turn: 1, used: [1, 0], lost: { Q: 0, G: 1 } } },
  { id: 'power-march', family: 'power', item: 'March',
    setup: { fen: '7k/8/8/8/8/4P3/8/K7 w - - 0 1', kings: 'Mud:March,none' }, actions: ['e3-e5'],
    expected: { board: { e3: null, e5: 'P' }, turn: 1, used: [0, 0], rules: { marchUses: 0 } } },
  { id: 'power-leap', family: 'power', item: 'Leap',
    setup: { fen: '7k/8/8/p7/8/8/P7/R6K w - - 0 1', kings: 'Mud:Leap,none' }, actions: ['Ra1-a3!L'],
    expected: { board: { a1: null, a2: 'P', a3: 'R' }, turn: 1, used: [1, 0] } },
  { id: 'power-holylight', family: 'power', item: 'HolyLight',
    setup: { fen: '7k/8/5p2/4p3/3K4/8/8/R7 w - - 0 1', kings: 'Spirit:HolyLight,none' }, actions: ['Kd4xe5'],
    expected: { board: { d4: null, e5: 'K', f6: 'p' }, turn: 1, used: [0, 0], legalExcludes: ['f6xe5'] } },
  { id: 'power-mercy', family: 'power', item: 'Mercy',
    setup: { fen: 'k7/8/8/3P4/3K4/8/8/R7 w - - 0 1', kings: 'Spirit:Mercy,none' }, actions: ['Kd4-d6'],
    expected: { board: { d4: null, d5: 'P', d6: 'K' }, turn: 1, used: [0, 0], rules: { mercyAura: true, mercyAuraPawnsTake: true } } },
  { id: 'power-deathtouch', family: 'power', item: 'DeathTouch',
    setup: { fen: '7k/8/3r4/8/3K4/8/8/R7 w - - 0 1', kings: 'Shadow:DeathTouch,none' }, actions: ['Kd4*d6'],
    expected: { board: { d4: 'K', d6: null }, turn: 1, used: [0, 0], rules: { deathTouchReachForwardBack: true } } },
  { id: 'power-darkness', family: 'power', item: 'Darkness',
    setup: { fen: '7k/8/8/3p4/3P4/8/8/K7 w - - 0 1', kings: 'Shadow:Darkness,none' }, actions: ['d4xd5'],
    expected: { board: { d4: null, d5: 'P' }, turn: 1, used: [0, 0], rules: { darknessMoves: true, darknessKingStep2: true } } },

  { id: 'option-cards-no-powers', family: 'interaction', item: 'Cards × powers off',
    setup: { fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', hand: ['Freeze', 'Haste', 'Strike', 'MorphP'], kings: 'none,none' }, actions: ['!F:d5'],
    expected: { board: { d5: 'n', a2: 'P' }, turn: 1, used: [1, 0], free: false, rules: { markFree: false, hasteCaptures: true, strikeCaptures: true, strikePawns: true } } },
  { id: 'option-cards-with-powers', family: 'interaction', item: 'Cards × always-on power',
    setup: { fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', hand: ['Freeze', 'Haste', 'Strike', 'MorphP'], kings: 'Mud:March,none' }, actions: ['!F:d5', '--'],
    expected: { board: { d5: 'n', a2: 'P' }, turn: 1, used: [1, 0], free: false, rules: { markFree: true, hasteCaptures: false, strikeCaptures: false, strikePawns: false } } },
  { id: 'mark-two-sides', family: 'interaction', item: 'Two-sided mark lifetime',
    setup: { fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', hand: ['Freeze'], kings: 'Mud:March,none' },
    actions: ['!F:d5', '--', '!F:a2', '--'], turns: [['!F:d5', '--'], ['!F:a2', '--']],
    checkpoints: [{ after: 3, expected: { turn: 1, free: true, marks: [{ sq: 'd5' }, { sq: 'a2' }], legalExcludes: ['Nd5-c3'] } }],
    expected: { board: { a2: 'P', d5: 'n' }, turn: 0, used: [1, 1], marks: [null, { sq: 'a2' }], legalExcludes: ['a2-a3', 'a2-a4'] } },
  { id: 'mark-icewall-beast', family: 'interaction', item: 'IceWall × Beast chain',
    setup: { fen: '4k3/8/8/2PP4/2s5/8/8/R3K3 w - - 0 1', kings: 'Frost:IceWall,none' }, actions: ['!W:d5', '--'],
    expected: { board: { c5: 'P', d5: 'P', c4: 's' }, turn: 1, used: [1, 0], legalIncludes: ['Sc4xc5'], legalExcludes: ['Sc4xd5', 'Sc4xc5xd5'] } },
  { id: 'mark-icewall-shove', family: 'interaction', item: 'IceWall × Ogre displacement',
    setup: { fen: '4k3/8/8/8/3o4/3N4/8/R3K3 w - - 0 1', kings: 'Frost:IceWall,none' }, actions: ['!W:d3', '--'],
    expected: { board: { d3: 'N', d4: 'o' }, turn: 1, used: [1, 0], legalIncludes: ['Od4>d3-d2'], legalExcludes: ['Od4xd3'] } },
  { id: 'mark-firewall-expiry', family: 'interaction', item: 'Firewall expiry after opponent turn',
    setup: { fen: '4k3/8/8/3r4/8/1n6/R7/N3K3 w - - 0 1', hand: ['Firewall'], kings: 'Mud:March,none' },
    actions: ['!P', 'Ra2-d2', 'Ke8-f8'], turns: [['!P', 'Ra2-d2'], ['Ke8-f8']],
    checkpoints: [{ after: 2, expected: { turn: 1, marks: [{ sq: 'e1', ward: true, all: true }, null], legalExcludes: ['Rd5xd2'] } }],
    expected: { board: { d2: 'R', f8: 'k' }, turn: 0, marks: [null, null], used: [1, 0] } },
  { id: 'promotion-standard', family: 'interaction', item: 'Standard promotion',
    setup: { fen: '7k/P7/8/8/8/8/8/K7 w - - 0 1' }, actions: ['a7-a8=N'],
    expected: { board: { a7: null, a8: 'N' }, turn: 1, halfmove: 0 } },
  { id: 'promotion-darkness', family: 'interaction', item: 'Darkness capture promotion',
    setup: { fen: '1r5k/1P6/8/8/8/8/8/K7 w - - 0 1', kings: 'Shadow:Darkness,none' }, actions: ['b7xb8=Q'],
    expected: { board: { b7: null, b8: 'Q' }, turn: 1, halfmove: 0 } },
  { id: 'promotion-march', family: 'interaction', item: 'March double-step promotion',
    setup: { fen: '7k/8/P7/8/8/8/8/K7 w - - 0 1', kings: 'Mud:March,none' }, actions: ['a6-a8=R'],
    expected: { board: { a6: null, a8: 'R' }, turn: 1, used: [0, 0], halfmove: 0 } },
  { id: 'paladin-reserve', family: 'interaction', item: 'Paladin self-removal enters reserve',
    setup: { fen: '4k3/8/8/8/3n4/8/P7/3LK3 w - - 0 1 l', hand: ['Salvation'] }, actions: ['Ld1xd4'],
    expected: { board: { d1: null, d4: null }, turn: 1, lost: { L: 1, n: 1 } } },
  { id: 'reserve-morphp-salvation', family: 'interaction', item: 'MorphP captured as new type',
    setup: { fen: '4k3/8/8/8/8/1r6/1P6/R3K3 w - - 0 1 l', hand: ['MorphP', 'Salvation'] },
    actions: ['!IP:b2=N', 'Rb3xb2', 'N@h1!R'], turns: [['!IP:b2=N'], ['Rb3xb2'], ['N@h1!R']],
    checkpoints: [{ after: 2, expected: { turn: 0, lost: { N: 1, P: 0 }, legalIncludes: ['N@h1!R'] } }],
    expected: { board: { b2: 'r', h1: 'N' }, turn: 1, used: [3, 0], lost: { N: 0, P: 0 } } },
  { id: 'classic-mercy-castle', family: 'interaction', item: 'Classic × Mercy castling',
    setup: { fen: '4k3/8/8/8/8/8/P7/R3K2R w KQ - 0 1', classic: true, kings: 'Spirit:Mercy,none' }, actions: ['O-O'],
    expected: { board: { e1: null, f1: 'R', g1: 'K', h1: null }, turn: 1, rules: { classicChess: true } } },
  { id: 'shelter-mercy-pawn-exception', family: 'interaction', item: 'Mercy shelter pawn exception',
    setup: { fen: '3r3k/8/8/8/2p5/3N4/8/4K3 w - - 0 1', kings: 'Spirit:Mercy,none' }, actions: ['Ke1-e2'],
    expected: { board: { e2: 'K', d3: 'N' }, turn: 1, legalIncludes: ['c4xd3'], legalExcludes: ['Rd8xd3'] } },
  { id: 'shelter-holylight-orthogonal', family: 'interaction', item: 'HolyLight orthogonal shelter',
    setup: { fen: '4r2k/8/8/8/3p4/4N3/8/4K3 w - - 0 1', kings: 'Spirit:HolyLight,none' }, actions: ['Ke1-e2'],
    expected: { board: { e2: 'K', e3: 'N' }, turn: 1, legalExcludes: ['Re8xe3', 'd4xe3'] } },
  { id: 'mark-haste-lifetime', family: 'interaction', item: 'Freeze binds both Haste actions',
    setup: { fen: 'r3k2n/8/8/8/8/8/P7/R3K3 w - - 0 1', hand: ['Freeze', 'Haste'], kings: 'Mud:March,none' },
    actions: ['!F:h8', '--', 'Ra8-a7!H', '--'], turns: [['!F:h8', '--'], ['Ra8-a7!H', '--']],
    checkpoints: [{ after: 3, expected: { turn: 1, haste: 'a7', marks: [{ sq: 'h8' }, null], used: [1, 2], legalExcludes: ['Nh8-f7', 'Nh8-g6'] } }],
    expected: { board: { a8: null, a7: 'r', h8: 'n' }, turn: 0, haste: null, marks: [null, null], used: [1, 2] } },
  { id: 'rally-pass', family: 'interaction', item: 'Rally optional second move',
    setup: { fen: '4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1', hand: ['Rally'] }, actions: ['Ra1-a5!J', '--'],
    expected: { board: { a1: null, a5: 'R', b1: 'N' }, turn: 1, used: [1, 0], haste: null } },
];
