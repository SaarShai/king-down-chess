/**
 * The turn rule (web redesign spec §4.2): one button hands the turn over, and Undo works only
 * before the press. screen/play.ts keeps one number, the turn start: the count of plies that are handed
 * over. This module reads the game against it, with no DOM.
 */
import type { Game } from './game';
import type { Color, Move, Position, Status } from './rules/engine';
import { toLan } from './rules/setup';

/** Who hands the turn to whom: the computer, two people on one device, or a friend by link. */
export type Mode = 'computer' | 'device' | 'link';

const SIDE = ['White', 'Black'] as const;

/** What the turn rule reads of a game (`Game` gives all of it). */
export interface TurnGame {
  readonly history: readonly { readonly pos: Pick<Position, 'turn'> }[];
  readonly pos: Pick<Position, 'turn' | 'haste' | 'free' | 'rage'>;
  readonly status: Status;
  readonly legal: readonly Pick<Move, 'pass'>[];
  readonly inCheck: boolean;
}

export interface Turn {
  /** The side that plays the turn in progress: the side to move at the turn start. */
  activeSide: Color;
  /** Plies after the turn start: Undo takes them back, one for each press. */
  staged: number;
  /** The side still has its follow-up move or the pass (Haste, Rage, Rally, a free mark, GrowthB). */
  midWay: boolean;
  /** End turn is on. */
  ready: boolean;
  /** The board takes no move until the press: the turn passed, or a staged move ended the game. */
  waits: boolean;
}

/**
 * The turn at `turnStart` handed-over plies. `open` is true while a Beast chain, a choice or a move
 * animation is open: End turn is off then.
 */
export function turnOf(game: TurnGame, turnStart: number, open = false): Turn {
  const staged = game.history.length - turnStart;
  const activeSide = staged > 0 ? game.history[turnStart].pos.turn : game.pos.turn;
  const midWay = game.pos.haste !== undefined || !!game.pos.free;
  const waits = staged > 0 && (game.pos.turn !== activeSide || game.status !== 'playing');
  const ready = staged > 0 && !open && (waits || (midWay && game.legal.some(m => m.pass)));
  return { activeSide, staged, midWay, ready, waits };
}

/** A staged end waits for the press. A handed-over result or resignation ends the game. */
export const turnEnded = (game: TurnGame, start: number, resigned: Color | null = null): boolean =>
  (resigned != null || game.status !== 'playing') && !turnOf(game, start).staged;

/** The mode of a game: a link game when this device plays one side of it (`linkSide`). */
export const modeOf = (sides: readonly [string, string], linkSide: Color | null): Mode =>
  linkSide != null ? 'link' : sides[0] === 'human' && sides[1] === 'human' ? 'device' : 'computer';

/** The words of the turn button's press in a line: "tap End turn", or "tap Send your turn" in a link game. */
const tap = (mode: Mode): string => (mode === 'link' ? 'tap Send your turn' : 'tap End turn');

/**
 * The line beside the board for the turn in progress (spec §4.9, ranks 9, 11 and 13): a mid-way
 * turn, a staged end, a turn that waits. Empty when nothing is staged. Each line has 8 words or fewer.
 */
export function turnLine(game: TurnGame, turn: Turn, mode: Mode): string {
  if (!turn.staged) return '';
  if (turn.waits && game.status !== 'playing') {
    const end = game.status === 'checkmate' ? 'Checkmate.' : game.status === 'stalemate' ? 'Stalemate.' : 'Draw.';
    return mode === 'link' ? `${end} Tap Send your turn.` : `${end} Tap End turn to finish.`;
  }
  if (turn.waits) {
    const ready = mode === 'device' ? `${SIDE[turn.activeSide]}'s turn is ready.` : 'Your turn is ready.';
    if (mode === 'link') return game.inCheck ? 'Check. Tap Send your turn.' : `${ready} Tap Send your turn.`;
    return `${game.inCheck ? 'Check. ' : ''}${ready} Tap End turn.`;
  }
  if (!turn.midWay) return '';
  const next = game.pos.haste === undefined ? (mode === 'link' ? 'Make your move' : 'Now make your move')
    : game.pos.rage === 3 ? 'Move another piece' : 'Move it again';
  return turn.ready ? `${next}, or ${tap(mode)}.` : `${next}.`;
}

/** The refusal of a tap while the turn waits. On one device the next person can reach Undo, so the line names the side and does not offer it. */
export const waitNotice = (mode: Mode, activeSide: Color): string =>
  mode === 'device' ? `${SIDE[activeSide]}: tap End turn.` : `${tap(mode)[0].toUpperCase()}${tap(mode).slice(1)}, or Undo.`;

/** Keep the move in the spoken notice, then say how to hand it over. */
export function turnAnnouncement(game: TurnGame, turn: Turn, mode: Mode, moveLine: string): string {
  const line = game.status === 'playing' ? moveLine
    : game.status === 'checkmate' ? 'Checkmate.' : game.status === 'stalemate' ? 'Stalemate.' : 'Draw.';
  const press = mode === 'device' ? `${SIDE[turn.activeSide]}: End turn.`
    : mode === 'link' ? 'Send your turn, or Undo.' : 'End turn, or Undo.';
  return `${line} ${press}`.trim();
}

export interface TurnButton { label: 'End turn' | 'Send your turn' | 'Send again'; on: boolean; primary: boolean }

/**
 * The turn button (spec §4.3). "End turn" against the computer and on one device. In a link game
 * "Send your turn"; after the send (or after the end of a link game) "Send again", quiet and on, so a
 * lost link can go again. `over`: the game ended and is handed over; `open`: a chain, a choice, an
 * animation, a send or a review is open.
 */
export function turnButton(game: TurnGame, turn: Turn, mode: Mode, { linkSide, over, open }: { linkSide: Color | null; over: boolean; open: boolean }): TurnButton {
  if (mode === 'link' && !turn.staged && game.history.length && (game.pos.turn !== linkSide || over)) return { label: 'Send again', on: !open, primary: false };
  return { label: mode === 'link' ? 'Send your turn' : 'End turn', on: turn.ready, primary: turn.ready };
}

/** The pass that the press plays first: a mid-way turn ends with it. */
export const pressPass = (game: Game, turn: Turn): Move | undefined =>
  turn.ready && turn.midWay && !turn.waits ? game.legal.find(m => m.pass) : undefined;

/** The moves (LAN) of the link that the press sends: the history through the staged turn, and the pass of a mid-way turn. */
export function sendLans(game: Game, turn: Turn): string[] {
  const lans = game.history.map(h => h.lan), pass = pressPass(game, turn);
  return pass ? [...lans, toLan(game.pos, pass)] : lans;
}

/** Undo takes back one staged ply. The UI also checks its open choice and review. */
export const canUndoTurn = (game: TurnGame, start: number): boolean => game.history.length > start;

/** The press and a computer ply hand over all recorded plies. */
export const handOver = (game: TurnGame): number => game.history.length;

/** An old link can stop after a free mark or first move. Finish it for its sender. */
export function finishLinkedTurn(game: Game): void {
  if (game.pos.haste !== undefined || game.pos.free) {
    const pass = game.legal.find(m => m.pass);
    if (pass) game.play(pass);
  }
}

/** Resign removes the unsubmitted turn first. */
export function dropTurn(game: Game, start: number): void {
  while (game.history.length > start) game.undo();
}
