import { GameRules } from '../../../../../src/game-rules';
import { parseSq, type Move, type Position } from '../../../../../src/rules/engine';
import { POWERS_BALANCED, type CardName, type Rules } from '../../../../../src/rules/rules';

export const at = parseSq;
export interface Fixture { rules: GameRules; before: Position; after: Position; moves: Move[]; move?: Move; expired?: Position }
// These inputs come from tools/fixtures/shared-mechanics.ts; keep Node assertions out of the browser.
function fixture(fen: string, action?: string, hand: CardName[] = [], more: Partial<Rules> = {}): Fixture {
  const rules = new GameRules({ ...(more.kings?.some(Boolean) ? POWERS_BALANCED : {}), hands: [hand, hand], ...more });
  const before = rules.fromFen(fen), moves = rules.legalMoves(before);
  const move = action ? moves.find(m => rules.toLan(before, m) === action) : undefined;
  if (action && !move) throw new Error(`Fixture action is not legal: ${action}`);
  return { rules, before, after: move ? rules.makeMove(before, move) : before, moves, move };
}
export const fixtures = {
  freeze: fixture('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', '!F:d5', ['Freeze'], { markFree: false }),
  guard: fixture('3r4/8/8/4k3/8/3G4/8/K7 w - - 0 1', 'Gd3-d4'),
  holyLight: fixture('4r2k/8/8/8/3p4/4N3/8/4K3 w - - 0 1', 'Ke1-e2', [], { kings: [{ king: 'Spirit', power: 'HolyLight' }, null] }),
  mercy: fixture('3r3k/8/8/8/2p5/3N4/8/4K3 w - - 0 1', 'Ke1-e2', [], { kings: [{ king: 'Spirit', power: 'Mercy' }, null] }),
  archer: fixture('7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1', 'Ac3*c5'),
  ward: fixture('4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1', '!W:a4', ['IceWall'], { markFree: false }),
  firewall: fixture('4k3/8/8/3r4/8/1n6/R7/N3K3 w - - 0 1', '!P', ['Firewall'], { markFree: true }),
  haste: fixture('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', 'Ra1-a4!H', [], { kings: [{ king: 'Flame', power: 'Haste' }, null] }),
  rook: fixture('7k/8/3p4/8/3R4/8/P7/4K3 w - - 0 1', 'Rd4-d5'),
  swap: fixture('7k/8/8/8/8/8/pN6/M3K3 w - - 0 1', 'Ma1<>e1'),
  shove: fixture('k7/8/8/2p5/1pOPn3/8/8/7K w - - 0 1', 'Oc4>c5-c6'),
  beast: fixture('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1', 'Sd4xc4xd5xe5xf6'),
  check: fixture('7k/8/8/8/8/4r3/8/4K2R w - - 0 1'),
  threats: fixture('7k/8/8/3r4/3R4/8/P7/4K3 w - - 0 1'),
  reserve: fixture('4k3/8/8/8/8/8/P7/N3K3 w - - 3 9 lPRQG', 'R@h1!R', ['Salvation']),
};

function play(f: Fixture, pos: Position, lan: string): Position {
  const move = f.rules.legalMoves(pos).find(m => f.rules.toLan(pos, m) === lan);
  if (!move) throw new Error(`Expiry action is not legal: ${lan}`);
  return f.rules.makeMove(pos, move);
}
fixtures.freeze.expired = play(fixtures.freeze, fixtures.freeze.after, 'Ke8-f8');
fixtures.ward.expired = play(fixtures.ward, fixtures.ward.after, 'Ke8-f8');
fixtures.firewall.expired = play(fixtures.firewall, play(fixtures.firewall, fixtures.firewall.after, 'Ra2-d2'), 'Ke8-f8');

export function checkFixtures(): void {
  const f = fixtures.freeze, a = fixtures.archer, h = fixtures.haste;
  if (f.rules.legalMoves(f.after).some(m => m.from === at('d5'))) throw new Error('Freeze must stop knight moves.');
  if (a.after.board[at('c3')] !== a.before.board[at('c3')] || a.after.board[at('c5')]) throw new Error('Archer must shoot from its source.');
  if (a.before.board[at('c4')] === 0) throw new Error('Archer fixture must have a blocker.');
  if (h.rules.legalMoves(h.after).some(m => m.captures.length)) throw new Error('Haste second move must not capture.');
  if (h.after.haste !== at('a4') || h.after.turn !== 0) throw new Error('Haste must keep the turn.');
  if (!fixtures.ward.after.marks?.[0]?.ward) throw new Error('Ward must prevent a capture.');
  if (!fixtures.firewall.after.marks?.[0]?.all) throw new Error('Firewall must cover the army.');
  for (const key of ['freeze', 'ward', 'firewall'] as const) if (fixtures[key].expired?.marks?.[0]) throw new Error(`${key} must end after the opponent turn.`);
  const guardMoves = fixtures.guard.rules.legalMoves(fixtures.guard.after).map(m => fixtures.guard.rules.toLan(fixtures.guard.after, m));
  if (guardMoves.includes('Rd8xd4') || !guardMoves.includes('Ke5xd4')) throw new Error('Only a king can take this Guard.');
  const mercyMoves = fixtures.mercy.rules.legalMoves(fixtures.mercy.after).map(m => fixtures.mercy.rules.toLan(fixtures.mercy.after, m));
  if (mercyMoves.includes('Rd8xd3') || !mercyMoves.includes('c4xd3')) throw new Error('Mercy must keep the pawn exception.');
  if (fixtures.holyLight.rules.legalMoves(fixtures.holyLight.after).some(m => m.captures.includes(at('e3')))) throw new Error('Holy Light must shelter the knight.');
  const swap = fixtures.swap;
  if (!swap.move?.swap || swap.move.captures.length || swap.after.board[at('a1')] !== swap.before.board[at('e1')] || swap.after.board[at('e1')] !== swap.before.board[at('a1')]) throw new Error('Swap must exchange the pair without a capture.');
  // Six far2 directions: four orthogonal and two forward diagonal, each exactly two squares away.
  const far = new GameRules({ archerShots: 'far2' }), pos = far.fromFen('7k/8/1p1p1p2/8/1p1A1p2/8/3p4/K7 w - - 0 1');
  const shots = far.legalMoves(pos).filter(m => m.from === at('d4') && m.from === m.to).map(m => m.captures[0]).sort((x, y) => x - y);
  const expected = ['b4', 'f4', 'd2', 'd6', 'b6', 'f6'].map(at).sort((x, y) => x - y);
  if (shots.join() !== expected.join()) throw new Error('Archer far2 pattern has changed.');
}
checkFixtures();
