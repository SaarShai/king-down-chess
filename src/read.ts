import { A, B, C, G, K, L, M, N, NAMES, O, P, Q, R, RULES as GAME_RULES, S, T, V, colorOf, file, findKing, rank, legalMoves, pseudoMoves, sqName, markKind, type Color, typeOf, type PieceType, type Position } from './rules/engine';
import { needsArming, offered } from './powers-ui';
import { POOL } from './rules/setup';

export interface Reach {
  step: Set<number>;
  take: Set<number>;
  shot: Set<number>;
  swap: Set<number>;
  push: { from: number; to: number }[];
}

/** Read ordinary legal moves from the piece's side, outside a held turn. */
export function reachOf(pos: Position, sq: number): Reach {
  const reach: Reach = { step: new Set(), take: new Set(), shot: new Set(), swap: new Set(), push: [] };
  const cell = pos.board[sq];
  if (!cell) return reach;
  const side = { ...pos, turn: colorOf(cell), haste: undefined, rage: undefined, free: undefined };
  for (const m of legalMoves(side).filter(m => m.from === sq && !needsArming(m) && !m.drop)) {
    if (m.to === m.from && m.captures.length) reach.shot.add(m.captures[0]);
    else if (m.shove) {
      if (!reach.push.some(p => p.from === m.shove!.from)) reach.push.push(m.shove);
    } else if (m.swap) reach.swap.add(m.to);
    else if (m.captures.length) reach.take.add(m.captures[0]);
    else reach.step.add(m.to);
  }
  return reach;
}

/** Player-facing columns for one piece under the live `GAME_RULES` (and `POOL`). */
type GuideRow = { moves: string; captures: string; special: string };

const ARCHER_SHOT_TEXT: Record<string, string> = {
  classic: 'Shoots without moving: an enemy diagonally adjacent, or exactly 2 squares away orthogonally, through blockers.',
  plusDiag2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus any enemy exactly 2 squares away diagonally, through blockers.',
  ring2: 'Shoots without moving: any enemy on a diagonally adjacent square or anywhere on the ring 2 squares away, through blockers.',
  forward3: 'Shoots without moving: an enemy on either forward diagonal, or the square exactly 2 ahead, through blockers.',
  plusDiagFwd2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus either forward diagonal at distance 2, through blockers.',
  plusDiagFwd2Clear: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2, through blockers) plus either forward diagonal at distance 2, over an empty square.',
  fwd2NoBack: 'Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or to the side, or either forward diagonal at distance 2, through blockers.',
  fwd2NoSide: 'Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or behind, or either forward diagonal at distance 2, through blockers.',
};

/** One guide for both the dialog table and the hover card — reads live rules and POOL. */
export function pieceGuide(t: PieceType): GuideRow {
  const r = GAME_RULES;
  switch (t) {
    case P:
      return {
        moves: 'Moves 1 square forward. Moves 2 from its start rank.',
        captures: 'Takes 1 square diagonally forward.',
        special: 'Promotes on the last rank.',
      };
    case N:
      return { moves: 'Moves in an L, over any piece. Moves 2 squares, then 1 across.', captures: 'Takes by moving onto the enemy.', special: '' };
    case B:
      return { moves: 'Moves any distance diagonally.', captures: 'Takes by moving onto the enemy.', special: '' };
    case R:
      return { moves: 'Moves any distance orthogonally.', captures: 'Takes by moving onto the enemy.', special: '' };
    case Q:
      return { moves: 'Moves any distance in a straight line.', captures: 'Takes by moving onto the enemy.', special: '' };
    case K:
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes by moving onto the enemy.',
        special: 'Only a king can take a guard.',
      };
    case A: {
      const step = r.archerMove === 'ortho' ? 'Moves 1 square orthogonally.'
        : r.archerMove === 'fwdBack' ? 'Moves 1 square ahead or back.'
        : 'Moves 1 square in any direction.';
      return {
        moves: step,
        captures: ARCHER_SHOT_TEXT[r.archerShots] ?? ARCHER_SHOT_TEXT.classic,
        special: 'Never captures by moving onto a piece. ' + (r.archerChecks ? 'Gives check the same way it shoots.' : 'Cannot capture a king or give check.'),
      };
    }
    case L: {
      const die = r.paladinKamikaze === 'always' ? 'Removed after capturing anything.'
        : r.paladinKamikaze === 'never' ? 'Survives its own captures.'
        : 'Removed after capturing anything but a pawn.';
      const check = r.paladinChecks
        ? 'May capture a king (gives check).'
        : 'Cannot capture a king (never gives check).';
      const promo = r.promotionSet === 'anyNonKing' || r.promotionSet === 'anyNonKingNoGuard';
      const draw = POOL.includes('L')
        ? 'In the random draw.'
        : promo
          ? 'Not in the random draw. Custom setup, FEN, and promotion can still use it.'
          : 'Not in the random draw. Custom setup and FEN can still place it. A pawn does not promote to it.';
      return {
        moves: 'Moves like a queen, jumping own pieces.',
        captures: 'Takes by moving onto the enemy.',
        special: `${check} ${die} ${draw}`,
      };
    }
    case G:
      return {
        moves: 'Steps to empty squares beside it.',
        captures: 'Cannot capture.',
        special: 'Immortal wall: cannot be captured, except by a king.',
      };
    case M: {
      const long = r.maesterLongSwap
        ? ' Maester + own king both on their home rank: swap at any distance.'
        : '';
      const any = r.maesterSwapAny ? ' Swaps with any friendly piece anywhere.' : '';
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes an adjacent enemy.',
        special: `Onto an own piece = swap places.${long}${any}`,
      };
    }
    case S: {
      const step = r.beastMove === 'forward' ? 'Moves 1 square straight ahead, empty only.'
        : r.beastMove === 'diagFwdBack' ? 'Steps on four diagonals, empty squares only.'
        : 'Steps to empty squares beside it.';
      let take: string;
      if (r.beastCapture === 'diagForward') take = 'Takes on either forward diagonal.';
      else if (r.beastCapture === 'diagonal') take = 'Takes on any of the four diagonals.';
      else take = r.beastCaptureForward
        ? 'Takes on any adjacent square.'
        : 'Takes on any adjacent square but straight ahead.';
      return {
        moves: step,
        captures: take,
        special: r.beastChains ? 'May keep capturing from each new square (never a king as a continuation). Click victims in order; "Finish chain" ends early.' : 'One capture per turn.',
      };
    }
    case O: {
      const shove = r.ogreMode === 'push'
        ? 'Push: the ogre steps into the square the neighbour left.'
        : 'Repel: the neighbour moves away and the ogre stays.';
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes by moving onto the enemy (a guard excepted).',
        special: `Instead it may shove an adjacent piece 1 square away. Tap the neighbour; choose Capture or Push when both are legal. Shift-click is a push shortcut. ${shove} Kings are never shoved. Guards can be shoved. A shove is not a capture.`,
      };
    }
    case C:
      return {
        moves: 'Moves like a rook. Never takes by moving.',
        captures: 'Lobs along a rank or file over one enemy screen and takes the first piece beyond it.',
        special: '',
      };
    case V:
      return {
        moves: 'Moves like a knight. After a capture it may step one square onto an empty square as part of the same move.',
        captures: 'Takes like a knight; the step after never captures.',
        special: 'Click the victim, then the landing square.',
      };
    case T:
      return {
        moves: 'Moves 1 square in any direction. On a capital square (d4 e4 d5 e5) it moves and captures like a queen.',
        captures: 'Takes by moving onto the enemy.',
        special: '',
      };
    default:
      return { moves: '', captures: '', special: '' };
  }
}


/** The first guide sentence, for the fixed read line. */
export function readText(pos: Position, sq: number): string {
  const code = pos.board[sq];
  if (!code) return '';
  const t = typeOf(code), first = pieceGuide(t).moves.split(/(?<=[.!?])\s/)[0];
  const states = pieceStates(pos, sq);
  return `${NAMES[t]} · ${first}` + (states.length ? `\n${states.join(' · ')}` : '');
}

/** Live state words, also used for a refused move. */
export function pieceStates(pos: Position, sq: number): string[] {
  const code = pos.board[sq], states: string[] = [];
  if (!code) return states;
  for (const by of [0, 1] as const) {
    const mark = pos.marks?.[by];
    if (!mark || mark.left === 0) continue;
    const kind = markKind((by ^ 1) as Color, by, mark.ward);
    if (kind === 'frozen' && mark.sq === sq && colorOf(code) !== by) states.push('Frozen');
    if (kind === 'warded' && colorOf(code) === by && (mark.all || mark.sq === sq)) states.push('Ice Wall');
  }
  return states;
}

/** Why a tap on `to` did not play a move for the piece on `from` (only exported engine functions). */
export function whyNot(pos: Position, from: number, to: number, tag: string | null = null, bites: readonly number[] = []): string {
  const mover = pos.board[from], name = NAMES[typeOf(mover)], target = pos.board[to];
  if (bites.length && typeOf(mover) === S && target && typeOf(target) === K) return 'A bite chain cannot take a king.';
  if (pieceStates(pos, from).includes('Frozen')) return 'Frozen: it cannot move this turn.';
  if (pieceStates(pos, to).includes('Ice Wall')) return 'Ice Wall: nothing can take it now.';
  if (target && colorOf(target) !== colorOf(mover)) {
    if (tag === 'strike' && !GAME_RULES.strikeCaptures) return 'Strike cannot take this turn.';
    const quietHaste = !GAME_RULES.hasteCaptures || GAME_RULES.hasteSecond === 'quiet';
    if ((tag === 'haste' && !GAME_RULES.hasteCaptures) || (pos.haste !== undefined && pos.rage === undefined && quietHaste)) return 'Haste cannot take this turn.';
  }
  if (target && colorOf(target) !== colorOf(mover) && typeOf(target) !== K) {
    const side = colorOf(target), power = GAME_RULES.kings[side]?.power, king = findKing(pos.board, side);
    const df = Math.abs(file(to) - file(king)), dr = Math.abs(rank(to) - rank(king));
    const beside = king >= 0 && Math.max(df, dr) === 1;
    if (power === 'HolyLight' && beside && GAME_RULES.holyLightShelter && (!GAME_RULES.holyLightShelterOrtho || df === 0 || dr === 0)) {
      return 'Holy Light: this piece cannot be taken.';
    }
    if (power === 'Mercy' && beside && GAME_RULES.mercyAura && (!GAME_RULES.mercyAuraOrtho || df === 0 || dr === 0)) {
      const pawn = typeOf(mover) === P;
      if (GAME_RULES.mercyAuraPawns && pawn) return 'Mercy: pawns cannot take beside this king.';
      if (!GAME_RULES.mercyAuraPawns && GAME_RULES.mercyAuraPawnsTake && !pawn) return 'Only a pawn can take beside Mercy.';
      if (!GAME_RULES.mercyAuraPawns && !GAME_RULES.mercyAuraPawnsTake) return 'Mercy: nothing can take beside this king.';
    }
  }
  // Only the moves a click can reach (candidates()): an unarmed power move is not "a move into check".
  if (pseudoMoves(pos).some(m => m.from === from && offered(m, tag) && (m.shove?.from ?? m.captures[0] ?? m.to) === to)) {
    return 'That leaves your king in check.';
  }
  if (GAME_RULES.guardImmune && target && typeOf(target) === G && colorOf(target) !== pos.turn && typeOf(mover) !== K) return 'Only a king can take a guard.';
  return `The ${name} cannot ${target ? `take the ${NAMES[typeOf(target)]} on` : 'reach'} ${sqName(to)}.`;
}
