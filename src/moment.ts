import { C, G, K, Move, Position, V, typeOf } from './rules/engine';

/** Completed-move captions and prospective hover text for the same move. */
const LINES = {
  shoveGuard: ['The ogre shoved the guard.', 'Shove the guard one square away.'],
  shove: ['The ogre shoved a piece.', 'Shove this piece one square away.'],
  shot: ['The archer shot without moving.', 'Shoot without moving the archer.'],
  lob: ['The catapult lobbed over a screen.', 'Lob over the screen to capture the piece beyond it.'],
  chain: ['The beast captured several pieces in one move.', 'Capture these pieces in one beast chain.'],
  swapKing: ['The maester swapped with the king.', 'Swap the maester and its king.'],
  swap: ['The maester swapped places.', 'Swap these two pieces.'],
  paladin: ['The paladin captured and left the board.', 'Capture this piece; the paladin will also leave the board.'],
  strike: ['A piece used its one-time queen move.', 'Spend the one-time Strike to move this piece like a queen.'],
  strikeCapture: ['A piece used its one-time Strike to capture without moving.', 'Spend the one-time Strike to capture without moving.'],
  freeze: ['The king froze an enemy piece for one turn.', 'Freeze this piece: it cannot move on its next turn.'],
  ward: ['The king put an ice wall on a piece for one turn.', 'Ice Wall: this piece cannot be captured next turn.'],
  haste: ['A piece used Haste: it may move again.', 'Haste: move this piece, then move it again (or end the turn).'],
  pass: ['The hasted piece stayed put.', 'End the turn without the second move.'],
  flight: ['A piece took Flight to its own half.', 'Fly this piece to any empty square in your half.'],
  sacrifice: ['A pawn was sacrificed to bring a lost piece back.', 'Sacrifice this pawn to return a lost piece here.'],
  march: ['A pawn marched two squares.', 'March: two squares from any rank.'],
  leap: ['A piece leapt over its own pawns.', 'Leap over your own pawns.'],
  mimic: ['A piece moved the way another of its army moves.', 'Mimic: move this piece the way another of your pieces moves.'],
  vault: ['A piece vaulted over another piece.', 'Vault over one piece on the line.'],
  curse: ['An enemy piece was moved one square.', 'Curse: move this enemy piece one square.'],
  skylift: ['Two pieces traded squares.', 'Sky Lift: trade the squares of these two pieces.'],
  salvation: ['A captured piece returned to its first rank.', 'Salvation: return this captured piece to this square.'],
  rage: ['A piece raged: it may move again, and take.', 'Rage: move this piece, then move it again (or end the turn); either move may take.'],
  rageb: ['A piece raged: its second move must take.', 'Rage: move this piece, then take with it (or end the turn).'],
  firewall: ['A firewall: no piece of that side can be taken next turn.', 'Firewall: none of your pieces can be taken next turn.'],
  firewallb: ['A piece traded squares with an enemy piece.', 'Firewall: trade the squares of this piece and the enemy piece next to it.'],
  quake: ['An earthquake pushed the pieces around a square.', 'Earth Quake: push the pieces next to this square one square away.'],
  quakeb: ['An earthquake pushed the pieces around a square.', 'Earth Quake: push the pieces next to this square one square away.'],
  burn: ['A piece burned an enemy piece in the centre.', 'Burn: take this centre piece as a queen would.'],
  firestarter: ['A piece took on the back rank as a queen would.', 'Fire Starter: take this back-rank piece as a queen would.'],
  control: ['A piece moved the way a friendly piece next to it moves.', 'Control: move this piece the way the friendly piece next to it moves.'],
  rescue: ['A mark was kept for one more turn.', 'Rescue: your last Freeze, Ice Wall or Firewall binds one more turn.'],
  growth: ['A card was drawn.', 'Growth: draw the next card.'],
  growthb: ['A card was drawn.', 'Growth: draw the next card, then make your move.'],
  mirror: ['A card was copied from the opponent.', 'Mirror: play the card your opponent played last.'],
  mirrorb: ['A card was played twice.', 'Mirror: play this card and keep it.'],
  deathTouch: ['The king captured without moving.', 'Capture this piece without moving the king.'],
  reaver: ['The reaver captured, then stepped aside.', 'Capture, then step onto the chosen empty square.'],
} as const;

export function momentKind(pre: Position, m: Move): keyof typeof LINES | null {
  const t = typeOf(pre.board[m.from]);
  if (m.pass) return 'pass';
  if (m.via) return m.via;
  if (m.power === 'strike') return m.to === m.from ? 'strikeCapture' : 'strike';
  if (m.power) return m.power;
  if (m.shove) return typeOf(pre.board[m.shove.from]) === G ? 'shoveGuard' : 'shove';
  if (m.swap) return typeOf(pre.board[m.to]) === K ? 'swapKing' : 'swap';
  if (m.selfRemove) return 'paladin';
  if (t === V && m.captures.length === 1 && m.to !== m.captures[0]) return 'reaver';
  if (t === C && m.captures.length) return 'lob';
  if (m.to === m.from && m.captures.length) return t === K ? 'deathTouch' : 'shot';
  if (m.captures.length > 1) return 'chain';
  return null;
}

export function momentText(pre: Position, m: Move, seen: Set<string>, preview = false): string | null {
  const kind = momentKind(pre, m);
  if (!kind || (!preview && seen.has(kind))) return null;
  if (!preview) seen.add(kind);
  return LINES[kind][preview ? 1 : 0];
}

/** A played move that gave away much of its mover's position (centipawns), or a forced mate. */
export interface KeyMoment { ply: number; loss: number; kind: 'loss' | 'missedMate' | 'allowedMate' }

/**
 * `before[k]`: the search score of the position before ply k, for its mover. `after[k]`: the score
 * of the position after it, for the opponent, searched one ply shallower so both see the same horizon.
 * Move k gave away before[k] + after[k]. Returns up to `limit` moves that gave away `threshold`
 * or more, largest first, then in game order.
 */
export function keyMoments(before: readonly number[], after: readonly number[], limit = 3, threshold = 200): KeyMoment[] {
  const MATED = 99_000, CAP = 1500; // search.ts: MATE − 1000 bounds the mate scores
  const cap = (s: number): number => Math.max(-CAP, Math.min(CAP, s));
  const found: KeyMoment[] = [];
  for (let k = 0; k < before.length; k++) {
    const loss = cap(before[k]) + cap(after[k]);
    if (loss < threshold) continue;
    found.push({ ply: k, loss, kind: after[k] >= MATED ? 'allowedMate' : before[k] >= MATED ? 'missedMate' : 'loss' });
  }
  return found.sort((a, b) => b.loss - a.loss).slice(0, limit).sort((a, b) => a.ply - b.ply);
}
