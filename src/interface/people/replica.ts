/**
 * The local copy of a game against a person, on the solo turn source (`Game` and `DraftTurn`). The server view is the
 * truth: the copy changes only by the moves that the server logs, and each change is checked against the view's FEN.
 */
import { Game } from '../../game';
import { needsServerPreview } from '../../account-game/engine-identity';
import type { LoggedCommand, View } from '../../match/protocol';
import { replayHistory } from '../../plugin/screens/board-model';
import type { Move, Position } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import type { DraftTurn } from '../play/turn';

/** One action of a turn: the position before it, the move and the position after it. */
export interface Step { before: Position; move: Move; after: Position; lan: string }
/** The opponent's last turn, for the arrival motion and its words. */
export interface ReceivedTurn { seq: number; at: string; steps: Step[] }

/** The copy from a full view (its rules and history); undefined when this page cannot replay it to the view's FEN. */
export function replicaOf(view: View): Game | undefined {
  if (!view.rules || !view.history) return;
  try {
    const game = new Game(undefined, view.rules);
    game.load(game.context.fromFen(view.history.initial_fen));
    if (game.playLan(view.history.actions) === view.history.actions.length && toFen(game.pos) === view.fen) return game;
    if (!view.engine_fingerprint || !needsServerPreview(view.engine_fingerprint)) return;
    const steps = replayHistory(view, view.rules);
    if (!steps?.length) return;
    game.load(steps[0].pre);
    for (const { move, pos } of steps) {
      if (game.status !== 'playing') return;
      game.play(move);
      if (game.pos.halfmove === pos.halfmove) continue;
      // The count changes the 50-move draw. It does not change the repetition key.
      game.pos.halfmove = pos.halfmove;
      const status = game.context.status(game.pos);
      if (status !== 'playing') game.status = status;
    }
    return game;
  } catch { return; }
}

/** A copy that knows only the view's position: an engine that cannot replay the history (M3, a second engine). */
export function positionOf(view: View): Game | undefined {
  if (!view.fen) return;
  try {
    const game = new Game(undefined, view.rules ?? undefined);
    game.load(game.context.fromFen(view.fen));
    return game;
  } catch { return; }
}

/** The moves of a logged command (a turn, or a computer turn). */
const movesOf = (command: LoggedCommand): string[] | undefined => {
  const action = command.action;
  return (action.type === 'turn' || action.type === 'computer') && 'actions' in action ? action.actions : undefined;
};

/**
 * Play the commands after `revision` on the copy. Returns the steps of each turn command, or undefined when the
 * commands have a gap, a move is not legal here, or the result is not the view's FEN (the caller then reads the
 * full game).
 */
export function playCommands(game: Game, revision: number, next: View): { seq: number; seat: number | null; at: string; steps: Step[] }[] | undefined {
  const fresh = next.last_commands.filter(command => command.seq > revision).sort((a, b) => a.seq - b.seq);
  if (fresh.length !== next.revision - revision || fresh.some((command, i) => command.seq !== revision + i + 1)) return;
  const turns: { seq: number; seat: number | null; at: string; steps: Step[] }[] = [];
  for (const command of fresh) {
    const lans = movesOf(command);
    if (!lans) continue;
    const steps: Step[] = [];
    for (const lan of lans) {
      const before = game.pos, move = game.legal.find(m => game.context.toLan(before, m) === lan);
      if (!move) return;
      game.play(move);
      steps.push({ before, move, after: game.pos, lan });
    }
    turns.push({ seq: command.seq, seat: command.seat, at: command.at, steps });
  }
  return toFen(game.pos) === next.fen ? turns : undefined;
}

/**
 * The opponent's last turn from a full view: the last turn command in the view's last commands, when it is the
 * opponent's and no turn came after it. Its steps are the last plies of the copy.
 */
export function lastTurnOf(game: Game, view: View): ReceivedTurn | undefined {
  const last = [...view.last_commands].sort((a, b) => b.seq - a.seq).find(command => movesOf(command));
  const lans = last && movesOf(last);
  if (!last || !lans || last.seat === view.seat || last.seat === null || lans.length > game.history.length) return;
  const tail = game.history.slice(game.history.length - lans.length);
  if (tail.some((ply, i) => ply.lan !== lans[i])) return;
  return { seq: last.seq, at: last.at, steps: tail.map((ply, i) => ({ before: ply.pos, move: ply.move, after: game.positionAfter(game.history.length - lans.length + i + 1), lan: ply.lan })) };
}

/**
 * The actions of one turn command for a finished draft: its steps, the move of an open Beast chain, and the pass
 * that ends a mid-way turn. The same moves as `DraftTurn.commit()`, with no change to the game.
 */
export function turnActions(draft: DraftTurn): string[] | undefined {
  if (!draft.canFinish) return;
  const context = draft.game.context;
  const lans = draft.steps.map(step => context.toLan(step.before, step.move));
  let pos = draft.now;
  const chain = draft.previewMove;
  if (chain) {
    const move = draft.legal.find(m => m.from === chain.from && m.captures.length === chain.captures.length && chain.captures.every((sq, i) => m.captures[i] === sq));
    if (!move) return;
    lans.push(context.toLan(pos, move)); pos = context.makeMove(pos, move);
  }
  if (pos.turn === draft.base.turn) {
    const pass = context.legalMoves(pos).find(m => m.pass);
    if (pass) lans.push(context.toLan(pos, pass));
  }
  return lans;
}

/** Stage the moves again on a new draft (after a refusal or a reread). Returns false at the first move that is not legal. */
export function restage(draft: DraftTurn, lans: readonly string[]): boolean {
  for (const lan of lans) {
    const move = draft.legal.find(m => !m.pass && draft.game.context.toLan(draft.now, m) === lan);
    if (!move || !draft.open) return false;
    draft.stage(move);
  }
  return true;
}
