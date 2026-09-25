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
  deathTouch: ['The king captured without moving.', 'Capture this piece without moving the king.'],
  reaver: ['The reaver captured, then stepped aside.', 'Capture, then step onto the chosen empty square.'],
} as const;

export function momentKind(pre: Position, m: Move): keyof typeof LINES | null {
  const t = typeOf(pre.board[m.from]);
  if (m.strike) return m.to === m.from ? 'strikeCapture' : 'strike';
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
