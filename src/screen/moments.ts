import type { SkillName } from '../ai/skill';
import type { Side } from '../game';
import { momentText, type momentKind } from '../moment';
import { findKing, type Color, type Move, type Position, type Status } from '../rules/engine';

/** The result line: who resigned, or who won and how, or the draw; empty while the game plays. */
export function resultText(status: Status, pos: Position, resigned: Color | null): string {
  if (resigned != null) return `${resigned ? 'Black' : 'White'} resigns — ${resigned ? 'White' : 'Black'} wins.`;
  return {
    playing: '',
    checkmate: `${pos.turn ? 'White' : 'Black'} wins ${findKing(pos.board, pos.turn) < 0 ? 'by taking the king' : 'by checkmate'}.`,
    stalemate: 'Draw by stalemate.',
    draw50: 'Draw by the 50-move rule.',
    drawRepetition: 'Draw by repetition.',
    drawMaterial: 'Draw by insufficient material.',
  }[status];
}

/** Why the game ended, for the result dialog; `said` (the last moment line) when no rule ended it. */
export function endReason(status: Status, pos: Position, resigned: Color | null, said: string): string {
  return (status === 'checkmate' ? (findKing(pos.board, pos.turn) < 0 ? 'The king was taken.' : 'The king is in check and no legal move escapes it.') : '')
    || (status === 'stalemate' ? 'No legal move, and the king is not in check.' : '')
    || (status === 'draw50' ? 'Fifty moves with no take and no pawn move.' : '')
    || (status === 'drawRepetition' ? 'The same position came up three times.' : '')
    || (status === 'drawMaterial' ? 'Neither side has enough material to mate.' : '')
    || (resigned != null ? 'That side gave up.' : '')
    || said;
}

/**
 * Today's result to share: the day, its army, won, lost or drew against the computer (between two people,
 * the result line), the moves and this page.
 */
export function shareResultText(r: {
  sides: readonly Side[]; resigned: Color | null; status: Status; turn: Color; result: string;
  skill: SkillName; daily: string | null; army: string; moves: number; page: string;
}): string {
  const n = r.moves, people = r.sides.filter(s => s === 'human').length;
  const me = r.sides.indexOf('human') as Color, winner = r.resigned != null ? 1 - r.resigned : r.status === 'checkmate' ? 1 - r.turn : -1;
  const outcome = people !== 1 ? r.result.slice(0, -1).toLowerCase() : winner < 0 ? 'drew' : winner === me ? 'won' : 'lost';
  const vs = people === 1 ? ` against the ${r.skill} computer` : '';
  return `King Down daily ${r.daily} (${r.army}): ${outcome} in ${n} move${n === 1 ? '' : 's'}${vs}. ${r.page}`;
}

/** The moment line while the pointer is on a square: the moment of the one move that a tap there finishes, else `said`. */
export const previewText = (pos: Position, ready: readonly Move[], seen: Set<string>, said: string): string =>
  (ready.length === 1 ? momentText(pos, ready[0], seen, true) : null) ?? said;

/**
 * A move's sounds. `now` plays as the move starts: a launch (shot, swap) or a quiet move. `hit` plays
 * when the board shows the contact: a shove, a chain or a capture.
 */
export function soundsFor(kind: ReturnType<typeof momentKind>, m: Move): { now: 'shot' | 'swap' | 'move' | null; hit: 'shove' | 'chain' | 'capture' | null } {
  const hit = kind === 'shove' || kind === 'shoveGuard' ? 'shove'
    : kind === 'chain' || kind === 'reaver' ? 'chain'
    : m.captures.length || m.selfRemove ? 'capture' : null;
  const now = kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike' ? 'shot'
    : kind === 'swap' || kind === 'swapKing' ? 'swap'
    : !hit ? 'move' : null;
  return { now, hit };
}
