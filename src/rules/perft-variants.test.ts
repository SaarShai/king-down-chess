import { afterEach, describe, expect, it } from 'vitest';
import { probeApply, probeLegalAfter, searchLegal } from '../ai/search';
import { RELEASED_CARDS } from '../content/cards';
import { B, G, N, Q, R, S, Move, Position, inCheck, legalMoves, makeMove, parseSq, perft } from './engine';
import { positionKey } from './position-key';
import { BUILT, DEFAULT_RULES, KINGS, POWERS_BALANCED, RULES, RULES_2017, RULES_2021, type CardName, type KingChoice, type PowerName, type Rules, setRules } from './rules';
import { POOL, fromFen, startPosition, toFen, toLan } from './setup';

afterEach(() => setRules());

interface Row {
  name: string;
  fen?: string;
  army?: string;
  rules?: Partial<Rules>;
  counts: number[];
  has?: Partial<Move>[];
  lacks?: Partial<Move>[];
  check?: boolean;
}

const move = (from: string, to: string, more: Partial<Move> = {}): Partial<Move> => ({ from: parseSq(from), to: parseSq(to), ...more });
const take = (from: string, to: string, ...victims: string[]): Partial<Move> => move(from, to, { captures: victims.map(parseSq) });
const powerRules = (power: PowerName): Partial<Rules> => ({
  ...POWERS_BALANCED,
  kings: [{ king: Object.keys(KINGS).find(k => KINGS[k as KingChoice['king']].includes(power)) as KingChoice['king'], power }, null],
});
const hand = (...cards: CardName[]): Partial<Rules> => ({ hands: [cards, cards] });

// Counts freeze this branch's engine. They are not published chess reference counts.
const BASE: Row[] = [
  // These two fixed armies hold every kind in POOL, with the guard next to the king.
  { name: 'pool army one', army: 'QOLRKGBN', counts: [29, 819, 26562] },
  { name: 'pool army two', army: 'AAMSKGNR', counts: [24, 576, 14262] },
  // The pawn steps once or twice and takes on a forward diagonal.
  { name: 'pawn', fen: 'k7/8/8/8/8/2p5/3P4/7K w - - 0 1', counts: [6, 26, 167],
    has: [move('d2', 'd3'), move('d2', 'd4'), take('d2', 'c3', 'c3')] },
  // The knight jumps and takes on its landing square.
  { name: 'knight', fen: '7k/8/8/5p2/3N4/8/8/K7 w - - 0 1', counts: [11, 41, 447],
    has: [move('d4', 'b5'), take('d4', 'f5', 'f5')] },
  // The bishop slides and takes on its diagonal.
  { name: 'bishop', fen: '7k/6p1/8/8/3B4/8/8/K7 w - - 0 1', counts: [14, 42, 513],
    has: [move('d4', 'b6'), take('d4', 'g7', 'g7')] },
  // The rook slides and takes on its file.
  { name: 'rook', fen: '7k/3p4/8/8/3R4/8/8/K7 w - - 0 1', counts: [16, 68, 1135],
    has: [move('d4', 'a4'), take('d4', 'd7', 'd7')] },
  // The queen uses both kinds of line.
  { name: 'queen', fen: '7k/3p2p1/8/8/3Q4/8/8/K7 w - - 0 1', counts: [27, 130, 3281],
    has: [take('d4', 'd7', 'd7'), take('d4', 'g7', 'g7')] },
  // Only a king can take a guard. The king can also step to an empty square.
  { name: 'king takes guard', fen: 'k7/8/8/8/8/5g2/6K1/8 w - - 0 1', counts: [8, 78, 437],
    has: [take('g2', 'f3', 'f3'), move('g2', 'h2')] },
  // The archer shoots through blockers in all six directions and spares its neighbours.
  { name: 'archer shots', fen: '7k/8/1p1p1p2/2PpP3/1pPAPp2/2pP4/3p4/7K w - - 0 1', counts: [18, 293, 4295],
    has: ['b6', 'd6', 'f6', 'b4', 'f4', 'd2'].map(s => take('d4', 'd4', s)),
    lacks: [take('d4', 'd4', 'c3'), take('d4', 'd4', 'd5')] },
  // Black's archer shoots on its forward diagonal, towards rank 1.
  { name: 'black archer', fen: '7k/8/8/8/3a4/4p3/5P2/K7 b - - 0 1', counts: [13, 60, 783],
    has: [take('d4', 'd4', 'f2'), move('d4', 'c3')] },
  // The paladin jumps friends, survives a pawn capture, and dies on a piece capture.
  { name: 'paladin', fen: '7k/3p4/8/3P4/3L1Pn1/8/8/K7 w - - 0 1', counts: [26, 251, 6380],
    has: [move('d4', 'd6'), take('d4', 'd7', 'd7'), { ...take('d4', 'g4', 'g4'), selfRemove: true }],
    lacks: [move('d4', 'h4'), move('d4', 'd7', { selfRemove: true })] },
  // A guard steps to empty squares, takes nothing, and stops an enemy rook.
  { name: 'guard', fen: '7k/8/8/3r4/3G4/2p5/8/3K4 w - - 0 1', counts: [5, 70, 740],
    has: [move('d4', 'd3')],
    lacks: [take('d4', 'd5', 'd5'), take('d4', 'c3', 'c3')],
    check: false },
  // A rook cannot take the enemy guard or pass through it.
  { name: 'guard immunity', fen: '7k/8/8/3g4/3R4/8/8/K7 w - - 0 1', counts: [13, 127, 2017],
    has: [move('d4', 'e4')],
    lacks: [take('d4', 'd5', 'd5'), move('d4', 'd6')] },
  // The maester steps, takes an enemy, swaps a friend, and swaps its distant home-rank king.
  { name: 'maester', fen: '7k/8/8/8/8/8/1n6/MN5K w - - 0 1', counts: [10, 66, 783],
    has: [move('a1', 'a2'), take('a1', 'b2', 'b2'), move('a1', 'b1', { swap: true }), move('a1', 'h1', { swap: true })] },
  // The beast can stop after one capture or continue, including a forward capture.
  { name: 'beast chain', fen: '7k/8/4p3/3p4/3S4/8/8/K7 w - - 0 1', counts: [12, 56, 662],
    has: [move('d4', 'c4'), take('d4', 'd5', 'd5'), take('d4', 'e6', 'd5', 'e6')] },
  // The beast cannot take the king as the second link of a chain.
  { name: 'beast spares king', fen: '8/8/4k3/3p4/3S4/8/8/K7 w - - 0 1', counts: [11, 75, 847],
    has: [take('d4', 'd5', 'd5')],
    lacks: [take('d4', 'e6', 'd5', 'e6')] },
  // The ogre steps, takes, and pushes friends, enemies, and an immune guard.
  { name: 'ogre', fen: '7k/8/8/3p4/2POg3/8/8/K7 w - - 0 1', counts: [14, 150, 2030],
    has: [move('d4', 'd3'), take('d4', 'd5', 'd5'), move('d4', 'd5', { shove: { from: parseSq('d5'), to: parseSq('d6') } }), move('d4', 'c4', { shove: { from: parseSq('c4'), to: parseSq('b4') } }), move('d4', 'e4', { shove: { from: parseSq('e4'), to: parseSq('f4') } })] },
  // The ogre cannot push a king, although the square beyond the king is empty.
  { name: 'ogre spares kings', fen: '7k/8/8/8/8/3K4/3O4/8 w - - 0 1', counts: [14, 42, 597],
    has: [move('d2', 'c2')],
    lacks: [{ shove: { from: parseSq('d3'), to: parseSq('d4') } }] },
  // Quiet and capture promotions offer the four standard pieces.
  { name: 'promotion', fen: 'k3r3/3P4/8/8/8/8/8/7K w - - 0 1', counts: [11, 91, 849],
    has: ([N, B, R, Q] as const).flatMap(promo => [move('d7', 'd8', { promo }), { ...take('d7', 'e8', 'e8'), promo }]) },
  // The archer gives check through a blocker; the king must evade it.
  { name: 'archer check', fen: '7k/8/8/8/4a3/4P3/4K3/8 w - - 0 1', counts: [7, 68, 386],
    has: [move('e2', 'd2')],
    lacks: [move('e3', 'e4')],
    check: true },
  // A maester swap can move the king out of a rook check.
  { name: 'swap evades check', fen: '4r2k/8/8/8/8/8/8/M3K3 w - - 0 1', counts: [5, 80, 609],
    has: [move('a1', 'e1', { swap: true })],
    check: true },
  // The paladin cannot take a king and gives no check on its line.
  { name: 'paladin gives no check', fen: '7k/8/8/8/8/8/8/l6K w - - 0 1', counts: [3, 67, 404],
    has: [move('h1', 'g1')],
    check: false },
];

const POWERS: Row[] = ([
  // Free Freeze holds the turn; depth 3 reaches the bound enemy's reply.
  { name: 'Freeze', fen: '7k/8/8/3n4/8/8/3R4/K7 w - - 0 1', counts: [15, 150, 2324],
    has: [{ power: 'freeze' }] },
  // Free Ice Wall protects a piece during the enemy reply.
  { name: 'IceWall', fen: '7k/8/8/3r4/8/8/3N4/K7 w - - 0 1', counts: [10, 160, 1596],
    has: [{ power: 'ward' }] },
  // Strike lends the knight a queen move to an empty square.
  { name: 'Strike', fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1', counts: [36, 104, 1749],
    has: [move('d4', 'd6', { power: 'strike' })] },
  // Haste offers a quiet first move and a second move by that piece.
  { name: 'Haste', fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1', counts: [22, 114, 917],
    has: [{ power: 'haste' }] },
  // Flight moves a piece to an empty square in its own half.
  { name: 'Flight', fen: '7k/8/8/8/3N4/4P3/8/K7 w - - 0 1', counts: [63, 187],
    has: [move('d4', 'h2', { power: 'flight' }), move('d4', 'h1', { power: 'flight' }), move('e3', 'h2', { power: 'flight' })],
    // A pawn cannot land on its own back rank.
    lacks: [move('e3', 'h1', { power: 'flight' })] },
  // Sacrifice replaces a pawn with a piece in its reserve.
  { name: 'Sacrifice', fen: '7k/8/8/8/8/3P4/8/K7 w - - 0 1 lRNG', counts: [6, 18, 183],
    has: [{ power: 'sacrifice', promo: R }],
    // A lost guard stays in the reserve.
    lacks: [{ power: 'sacrifice', promo: G }] },
  // The always-on March lets a pawn double-step away from its start rank.
  { name: 'March', fen: '7k/8/8/8/8/3P4/8/K7 w - - 0 1', counts: [5, 15, 102],
    has: [move('d3', 'd5', { captures: [] })] },
  // Counted Leap moves a rook beyond its own pawn.
  { name: 'Leap', fen: '7k/8/8/3p4/3P4/3R4/8/K7 w - - 0 1', counts: [13, 36, 570],
    has: [{ ...take('d3', 'd5', 'd5'), power: 'leap' }] },
  // Holy Light lets the king take a pawn and shelters its orthogonal neighbour.
  { name: 'HolyLight', fen: '7k/8/8/8/3r4/8/2pN4/3K4 w - - 0 1', counts: [4, 70, 705],
    has: [take('d1', 'c2', 'c2')] },
  // Mercy jumps a friend, steps two squares, and can take a pawn.
  { name: 'Mercy', fen: '7k/8/8/8/8/8/2pP4/3K4 w - - 0 1', counts: [7, 41, 469],
    has: [move('d1', 'd3'), take('d1', 'c2', 'c2')] },
  // Death Touch takes next to the king or two squares forward without moving.
  { name: 'DeathTouch', fen: '7k/8/8/3n4/8/3Kp3/8/8 w - - 0 1', counts: [7, 69, 442],
    has: [take('d3', 'd3', 'e3'), take('d3', 'd3', 'd5')] },
  // Darkness keeps straight pawn steps, adds diagonal steps and forward takes, and extends the king's step.
  { name: 'Darkness', fen: '7k/8/8/3pp3/3P4/8/5P2/3K4 w - - 0 1', counts: [16, 80, 1178],
    has: [move('f2', 'f4'), move('f2', 'e3'), take('d4', 'd5', 'd5'), move('d1', 'f1')],
    // The enemy pawn on e5 is safe: a Darkness pawn takes only straight forward.
    lacks: [take('d4', 'e5', 'e5')] },
] satisfies Row[]).map(row => ({ ...row, rules: powerRules(row.name as PowerName) }));

const CARDS: Row[] = [
  // Each released card has a legal action; the hands are equal, as in the game deal.
  ...([
    ['Freeze', 'freeze', [15, 152]], ['IceWall', 'ward', [10, 175]],
    ['Strike', 'strike', [36, 104]], ['Haste', 'haste', [22, 145]],
    ['Flight', 'flight', [63, 187]], ['Sacrifice', 'sacrifice', [6, 18]],
    ['March', 'march', [5, 15]], ['Leap', 'leap', [13, 36]],
  ] as const).map(([name, power, counts]) => ({
    ...POWERS.find(row => row.name === name)!, name: `card ${name}`, rules: hand(name),
    counts: [...counts], has: [{ power }],
  })),
  // Salvation drops a lost piece on its home rank.
  { name: 'card Salvation', fen: '7k/8/8/8/8/3P4/8/K7 w - - 0 1 lRNG', rules: hand('Salvation'), counts: [18, 51],
    has: [{ power: 'salvation', drop: R }],
    // A lost guard stays in the reserve.
    lacks: [{ power: 'salvation', drop: G }] },
  // Mirror spends itself to copy another card that stays in the hand.
  { name: 'card MirrorB', fen: '7k/8/8/3n4/8/8/3R4/K7 w - - 0 1', rules: hand('MirrorB', 'Freeze'), counts: [16, 171],
    has: [{ power: 'freeze', via: 'mirrorb' }] },
  // Firewall protects all friends during the enemy reply.
  { name: 'card Firewall', fen: '7k/8/8/3r4/8/8/3N4/K7 w - - 0 1', rules: hand('Firewall'), counts: [10, 175],
    has: [{ power: 'firewall' }] },
  // Earth Quake pushes pieces away from its centre.
  { name: 'card EarthQuake', fen: '7k/8/8/3p4/2NR4/8/8/K7 w - - 0 1', rules: hand('EarthQuake'), counts: [30, 519],
    has: [{ power: 'quake', from: parseSq('d4') }] },
  // Burn takes a piece in the four central squares with a queen move.
  { name: 'card Burn', fen: '7k/8/8/8/3p4/8/3N4/K7 w - - 0 1', rules: hand('Burn'), counts: [10, 39],
    has: [{ power: 'burn' }] },
  // Fire Starter takes a piece on the enemy back rank.
  { name: 'card FireStarter', fen: '3n3k/8/8/8/8/8/3N4/K7 w - - 0 1', rules: hand('FireStarter'), counts: [10, 66],
    has: [{ power: 'firestarter' }] },
  // Control borrows the move of an adjacent friend.
  { name: 'card Control', fen: '7k/8/8/8/8/3RN3/8/K7 w - - 0 1', rules: hand('Control'), counts: [39, 110],
    has: [{ power: 'control' }] },
  // Rally moves one piece, then a different piece in the same turn.
  { name: 'card Rally', fen: '7k/8/8/8/8/3RN3/8/K7 w - - 0 1', rules: hand('Rally'), counts: [42, 432],
    has: [{ power: 'rally' }] },
  // MorphP changes a pawn to a knight or bishop.
  { name: 'card MorphP', fen: '7k/8/8/8/8/3P4/8/K7 w - - 0 1', rules: hand('MorphP'), counts: [6, 17],
    has: [{ power: 'morphp', promo: N }, { power: 'morphp', promo: B }] },
  // Mimic gives a rook the move of its friendly knight.
  { name: 'card Mimic', fen: '7k/8/8/8/8/3RN3/8/K7 w - - 0 1', rules: hand('Mimic'), counts: [39, 110],
    has: [{ power: 'mimic' }] },
  // Vault lets a rook pass one enemy on its line.
  { name: 'card Vault', fen: '7k/8/8/3p4/8/3R4/8/K7 w - - 0 1', rules: hand('Vault'), counts: [17, 58],
    has: [move('d3', 'd6', { power: 'vault' })] },
  // Curse moves an enemy piece to an empty adjacent square.
  { name: 'card Curse', fen: '7k/8/8/3n4/8/8/3R4/K7 w - - 0 1', rules: hand('Curse'), counts: [22, 382],
    has: [{ power: 'curse' }] },
  // Sky Lift swaps two friendly pieces of different kinds.
  { name: 'card SkyLift', fen: '7k/8/8/8/8/3RN3/8/K7 w - - 0 1', rules: hand('SkyLift'), counts: [22, 62],
    has: [{ power: 'skylift', swap: true }] },
  // The full Morph card can make a guard when the side has none.
  { name: 'card Morph', fen: '7k/8/8/8/8/3N4/8/K7 w - - 0 1', rules: hand('Morph'), counts: [20, 58],
    has: [{ power: 'morph', promo: G }] },
  // A four-card deal with an always-on king power combines both move sources.
  { name: 'mixed hand and power', fen: '7k/8/8/5n2/8/3P4/3N4/K7 w - - 0 1', rules: { ...powerRules('March'), ...hand('Freeze', 'MorphP', 'Haste', 'MirrorB') }, counts: [39, 715],
    has: [move('d3', 'd5'), { power: 'morphp' }, { power: 'haste' }, { via: 'mirrorb' }] },
];

const STATES: Row[] = [
  // Both sides keep a separate mark. The enemy Freeze stops this knight.
  { name: 'two freezes', fen: '7k/8/8/3n4/8/8/3N4/K7 w - - 0 2 md5w/md2b/u1.1', rules: { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] }, counts: [3, 9, 102],
    lacks: [move('d2', 'f3')],
    has: [move('a1', 'b1')] },
  // A walled piece cannot be taken by the enemy rook.
  { name: 'active wall', fen: '7k/8/8/3r4/8/8/3N4/K7 b - - 0 2 md2w', rules: powerRules('IceWall'), counts: [15, 140, 2300],
    lacks: [take('d5', 'd2', 'd2')],
    has: [move('d5', 'e5')] },
  // A free Freeze follows an enemy pawn when the ogre pushes it.
  { name: 'push carries freeze', fen: '7k/8/8/8/3Op3/8/8/K7 w - - 0 2 me4w/f/u1.0', rules: powerRules('Freeze'), counts: [13, 39, 483],
    has: [move('d4', 'e4', { shove: { from: parseSq('e4'), to: parseSq('f4') } })] },
  // A Haste follow-up offers the same piece's quiet moves and a pass.
  { name: 'Haste follow-up', fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 2 hd4/u1.0', rules: powerRules('Haste'), counts: [9, 25, 245],
    has: [{ pass: true }, move('d4', 'f5')] },
  // The enemy rook cannot take a knight in Holy Light's shelter.
  { name: 'HolyLight shelter', fen: '7k/8/8/3r4/8/8/3N4/3K4 b - - 0 2', rules: powerRules('HolyLight'), counts: [15, 98, 1630],
    lacks: [take('d5', 'd2', 'd2')],
    has: [move('d5', 'e5')] },
  // Mercy stops a rook capture, but permits a pawn capture of the same neighbour.
  { name: 'Mercy shelter', fen: '7k/8/8/3r4/8/2p5/3N4/3K4 b - - 0 2', rules: powerRules('Mercy'), counts: [17, 174, 3124],
    lacks: [take('d5', 'd2', 'd2')],
    has: [take('c3', 'd2', 'd2')] },
  // Classic enables both castle moves; other base rows keep it off.
  { name: 'Classic option', fen: '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1', rules: { classicChess: true }, counts: [26, 112, 3189],
    has: [{ castle: { from: parseSq('h1'), to: parseSq('f1') } }, { castle: { from: parseSq('a1'), to: parseSq('d1') } }] },
  // The 2017 URL preset keeps the old archer shot and move sets.
  { name: '2017 preset', fen: '7k/8/8/4p3/3A4/8/8/K7 w - - 0 1', rules: RULES_2017, counts: [8, 33, 266],
    has: [take('d4', 'd4', 'e5')],
    lacks: [move('d4', 'c3')] },
  // The 2021 URL preset permits only the archer's three forward shots.
  { name: '2021 preset', fen: '7k/8/3p4/8/3A4/8/8/K7 w - - 0 1', rules: RULES_2021, counts: [6, 22, 150],
    has: [take('d4', 'd4', 'd6')],
    lacks: [move('d4', 'c4')] },
  // Morph cannot make a second guard or a second beast.
  { name: 'Morph limits', fen: '7k/8/8/8/8/3N4/3GS3/K7 w - - 0 1', rules: hand('Morph'), counts: [46, 136],
    has: [{ power: 'morph', from: parseSq('d3'), promo: Q }],
    lacks: [{ power: 'morph', promo: G }, { power: 'morph', promo: S }] },
  // Both sides keep an Ice Wall mark. The black rook stays immune on White's turn.
  { name: 'two walls', fen: '7k/8/8/3r4/8/3R4/3N4/K7 w - - 0 2 md2w/md5b/u1.1', rules: { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'IceWall' }, { king: 'Frost', power: 'IceWall' }] }, counts: [19, 292, 5967],
    lacks: [take('d3', 'd5', 'd5')],
    has: [move('d3', 'e3')] },
  // A free wall follows a knight through a maester swap.
  { name: 'swap carries wall', fen: '7k/8/8/3r4/8/8/3N4/K3M3 w - - 0 2 md2w/f/u1.0', rules: powerRules('IceWall'), counts: [16, 253, 4018],
    has: [move('e1', 'd2', { swap: true })] },
  // Classic offers en passant beside a fairy piece.
  { name: 'Classic en passant', fen: '7k/8/8/3pP3/8/8/1A6/K7 w - d6 0 2', rules: { classicChess: true }, counts: [11, 43, 443],
    has: [take('e5', 'd6', 'd5')] },
  // The 2017 preset permits a guard promotion.
  { name: '2017 promotion', fen: '7k/3P4/8/8/8/8/8/K7 w - - 0 1', rules: RULES_2017, counts: [12, 34, 413],
    has: [move('d7', 'd8', { promo: G })] },
  // Black keeps the turn after its first move. That first move must not give check.
  { name: 'double first turn', fen: '7k/8/8/8/8/8/7r/K7 b - - 0 1', rules: { secondPlayerDoubleFirstTurn: true }, counts: [14, 239, 477],
    has: [move('h2', 'g2')],
    lacks: [move('h2', 'a2')] },
];

const TABLE = [...BASE, ...POWERS, ...CARDS, ...STATES];
const load = (row: Row): Position => {
  // Default rows do not set rules. afterEach restores the module for the next row.
  if (row.rules) setRules(row.rules);
  else expect(RULES).toEqual(DEFAULT_RULES);
  return row.army ? startPosition(row.army) : fromFen(row.fen!);
};
const list = (pos: Position, moves: Move[]) => moves.map(m => [toLan(pos, m), m] as const).sort(([a], [b]) => a.localeCompare(b));

// The probes expose position keys, not a complete scratch Position. Check the next legal list too.
const agree = (pos: Position, depth: number): void => {
  const moves = legalMoves(pos);
  expect(list(pos, searchLegal(pos)), toFen(pos)).toEqual(list(pos, moves));
  for (const m of moves) {
    const next = makeMove(pos, m), label = `${toFen(pos)}: ${toLan(pos, m)}`;
    expect(probeApply(pos, m), label).toEqual({ after: positionKey(next), back: positionKey(pos) });
    expect(list(next, probeLegalAfter(pos, m)), label).toEqual(list(next, legalMoves(next)));
    if (depth > 1) agree(next, depth - 1);
  }
};

describe('King Down: frozen perft counts', () => {
  for (const row of TABLE) it(row.name, () => {
    const pos = load(row), moves = legalMoves(pos);
    const counts = row.counts.map((_, d) => perft(pos, d + 1));
    // The runner hides console logs from passed tests. Print with KINGDOWN_PERFT_PRINT=1.
    if (process.env.KINGDOWN_PERFT_PRINT) process.stdout.write(`${row.name}: ${JSON.stringify(counts)}\n`);
    expect(counts).toEqual(row.counts);
    for (const m of row.has ?? []) expect(moves, row.name).toContainEqual(expect.objectContaining(m));
    for (const m of row.lacks ?? []) expect(moves, row.name).not.toContainEqual(expect.objectContaining(m));
    if (row.check !== undefined) expect(inCheck(pos)).toBe(row.check);
  });

  it('keeps every pool kind, king power, and released card in the table', () => {
    const armies = BASE.flatMap(row => [...(row.army ?? '')]);
    expect([...new Set(POOL)].every(letter => armies.includes(letter))).toBe(true);
    expect(POWERS.map(row => row.name).sort()).toEqual([...BUILT].sort());
    expect(RELEASED_CARDS.every(card => CARDS.some(row => row.name === `card ${card.id}`))).toBe(true);
  });
});

describe('King Down: search and engine paths', () => {
  for (const row of TABLE.filter(row => row.name !== 'double first turn')) it(row.name, () => {
    agree(load(row), 2);
  });

  // The search changes the mover after Black's first move. The engine keeps Black's turn.
  it.fails('double first turn: Black keeps the turn after its first move', () => {
    setRules({ secondPlayerDoubleFirstTurn: true });
    const pos = fromFen('7k/8/8/8/8/8/8/K7 b - - 0 1');
    const m = legalMoves(pos).find(m => m.to === parseSq('g8'))!;
    expect(probeApply(pos, m)).toEqual({ after: positionKey(makeMove(pos, m)), back: positionKey(pos) });
  });

  // The search permits a check on the first of Black's two opening moves.
  it.fails('double first turn: legal moves omit the first-move check', () => {
    const pos = load(STATES.find(row => row.name === 'double first turn')!);
    expect(list(pos, searchLegal(pos))).toEqual(list(pos, legalMoves(pos)));
  });
});
