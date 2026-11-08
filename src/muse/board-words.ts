/** A position as short words that a voice agent can speak and a chat can show: never 64 squares read aloud. */
import { GameRules } from '../game-rules';
import type { PublicMatchRules } from '../match';
import type { Seat } from '../match/protocol';
import { checkCause, describeMove } from '../move-text';
import { cardName, cardText, POWER_NAME, powersRules, powerText, ruleLine } from '../powers-ui';
import { pieceGuide, pieceStates, readText } from '../read';
import { ALL_CARDS, DEFAULT_RULES, K, LETTERS, N, P, Q, R, B, colorOf, moveNumber, parseSq, sqName, typeOf, type PieceType, type PowerName, type Position } from '../rules/engine';
import { board } from './position';

export interface BoardWords { status: string; white: string; black: string; grid: string; legend: string }

const SIDE = ['White', 'Black'] as const;
/** King, queen, rooks, bishops, knights, the fairy pieces in LETTERS order, then pawns. */
const ORDER: readonly PieceType[] = [K, Q, R, B, N, 7, 8, 9, 10, 11, 12, 13, 14, 15, P];
const isFairy = (t: PieceType): boolean => t > K;
const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);
const key = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const END: Record<string, string> = {
  stalemate: 'Stalemate. The game is a draw.', draw50: 'Draw by the 50-move rule.',
  drawRepetition: 'Draw by repetition.', drawMaterial: 'Draw: not enough pieces to mate.',
};

function status(context: GameRules, pos: Position, viewer: Seat): string {
  const head = `You are ${SIDE[viewer]}. Move ${moveNumber(pos)}.`, end = context.status(pos);
  if (end === 'checkmate') return `${head} Checkmate. ${pos.turn === viewer ? 'You lose.' : 'You win.'}`;
  if (end !== 'playing') return `${head} ${END[end]}`;
  // A Haste second move or a free mark's move keeps the same turn.
  const mine = pos.turn === viewer ? (pos.haste !== undefined || pos.free ? 'Your turn goes on: move again or pass.' : 'Your move.') : `${SIDE[pos.turn]} to move.`;
  return `${head} ${context.inCheck(pos) ? 'Check! ' : ''}${mine}`;
}

function pieces(context: GameRules, pos: Position, side: Seat): string {
  const groups = ORDER.map(t => {
    const at = [...pos.board.keys()].filter(s => pos.board[s] && colorOf(pos.board[s]) === side && typeOf(pos.board[s]) === t);
    if (!at.length) return '';
    const marks = at.map(s => { const states = pieceStates(context, pos, s); return `${sqName(s)}${states.length ? ` (${states.join(', ').toLowerCase()})` : ''}`; });
    // shortcut: plural is the name plus "s"; a Workshop design name with another plural reads wrong.
    return `${context.nameOf(t)}${at.length > 1 ? 's' : ''} ${marks.join(', ')}`;
  }).filter(Boolean);
  return `${SIDE[side]}: ${groups.join('; ')}.`;
}

function grid(pos: Position, viewer: Seat): string {
  const ranks = viewer ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0], files = viewer ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cell = (p: number): string => !p ? '.' : colorOf(p) ? LETTERS[typeOf(p)].toLowerCase() : LETTERS[typeOf(p)];
  const rows = ranks.map(r => `${r + 1} ${files.map(f => cell(pos.board[r * 8 + f])).join(' ')}`);
  return [...rows, `  ${files.map(f => 'abcdefgh'[f]).join(' ')}`].join('\n');
}

function legend(context: GameRules, pos: Position): string {
  const present = new Set([...pos.board].filter(Boolean).map(typeOf));
  return ORDER.filter(t => isFairy(t) && present.has(t)).map(t => `${LETTERS[t]} ${context.nameOf(t)}`).join(', ');
}

export function boardWords(rules: PublicMatchRules, fen: string, viewer: Seat): BoardWords {
  const { context, pos } = board(rules, fen);
  return { status: status(context, pos, viewer), white: pieces(context, pos, 0), black: pieces(context, pos, 1), grid: grid(pos, viewer), legend: legend(context, pos) };
}

/** One sentence for the move. Throws when the rules do not make `lan` in `fenBefore`. */
export function moveWords(rules: PublicMatchRules, fenBefore: string, lan: string): string {
  const { context, pos, moves } = board(rules, fenBefore, [lan]);
  if (!moves.length) throw new Error(`${lan} is not a legal move`);
  // freePass: the pass after a free mark reads as the end of that turn, as the move list says it.
  return describeMove(context, pos, moves[0].move, true);
}

/** The cause of check from the viewer's side, or null when the side to move is not in check. */
export function checkWords(rules: PublicMatchRules, fen: string, viewer: Seat): string | null {
  const { context, pos } = board(rules, fen);
  return checkCause(context, pos, undefined, 'link', viewer) || null;
}

/** White's first rank from a to h. */
export function backRankWords(rules: PublicMatchRules, fen: string): string {
  const { context, pos } = board(rules, fen);
  const names = [0, 1, 2, 3, 4, 5, 6, 7].map(s => { const p = pos.board[s]; return !p ? 'empty' : `${colorOf(p) ? 'black ' : ''}${context.nameOf(typeOf(p))}`; });
  return `Back rank from a to h: ${names.join(', ')}.`;
}

const MOVES_SAID = 6;

/** What the viewer's pieces on `from` can do now, as short sentences; '' when it is not the viewer's turn. */
function nowWords(context: GameRules, pos: Position, viewer: Seat, moves: ReturnType<typeof board>['moves'], from: readonly number[]): string {
  if (pos.turn !== viewer || !from.length) return '';
  const mine = moves.filter(m => from.includes(m.move.from) && !m.move.pass && m.move.drop === undefined);
  if (!mine.length) return from.length > 1 ? 'None of them has a legal move now.' : 'It has no legal move now.';
  const said = mine.slice(0, MOVES_SAID).map(m => describeMove(context, pos, m.move));
  return [...said, ...(mine.length > MOVES_SAID ? [`Plus ${mine.length - MOVES_SAID} more moves.`] : [])].join(' ');
}

/**
 * The rule for a piece (name or letter), a square, a king power or a card, case-insensitive; null for an unknown topic.
 * With `at`, a square names its piece, and a square or piece of the viewer's adds its legal moves now.
 */
export function explainWords(rules: PublicMatchRules | null, topic: string, at?: { fen: string; viewer: Seat; legal: readonly string[] }): string | null {
  const r = rules ?? DEFAULT_RULES, t = topic.trim().toLowerCase();
  const { context, pos, moves } = at ? board(r, at.fen, at.legal) : { context: new GameRules(r), pos: undefined, moves: [] };
  if (/^[a-h][1-8]$/.test(t)) {
    if (!pos || !at) return null;
    const s = parseSq(t), p = pos.board[s];
    if (!p) return `${t} is empty.`;
    const states = pieceStates(context, pos, s), rule = readText(context, pos, s).split('\n')[0].split(' · ')[1];
    const line = `${SIDE[colorOf(p)]} ${context.nameOf(typeOf(p))} on ${t}${states.length ? ` (${states.join(', ').toLowerCase()})` : ''}: ${rule}`;
    return [line, colorOf(p) === at.viewer ? nowWords(context, pos, at.viewer, moves, [s]) : ''].filter(Boolean).join(' ');
  }
  const type = ORDER.find(x => { const name = context.nameOf(x).toLowerCase(); return t === LETTERS[x].toLowerCase() || t === name || t === `${name}s`; });
  if (type) {
    const g = pieceGuide(context, type), rule = `${cap(context.nameOf(type))}: ${[g.moves, g.captures, g.special].filter(Boolean).join(' ')}`;
    if (!pos || !at) return rule;
    const from = [...pos.board.keys()].filter(s => pos.board[s] && colorOf(pos.board[s]) === at.viewer && typeOf(pos.board[s]) === type);
    return [rule, nowWords(context, pos, at.viewer, moves, from)].filter(Boolean).join(' ');
  }
  const power = (Object.keys(POWER_NAME) as PowerName[]).find(p => key(p) === key(t) || key(POWER_NAME[p]) === key(t));
  // As the web Guide does: a game without king powers reads a power under the rules that powers play by.
  if (power) return `${POWER_NAME[power]}: ${ruleLine(powerText(power, rules?.kings.some(Boolean) ? context.rules : powersRules()))}`;
  const card = ALL_CARDS.find(c => key(c) === key(t) || key(cardName(c)) === key(t));
  return card ? `${cardName(card)}: ${ruleLine(cardText(card, context.rules))}` : null;
}
