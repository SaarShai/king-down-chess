import type { Draft } from '../client';
import type { View } from '../../match/protocol';
import { inCheck, legalMoves, makeMove, setRules, status, TAG_POWER, type CardName, type Color, type Move, type Position, type Rules } from '../../rules/engine';
import { fromFen, toFen, toLan } from '../../rules/setup';
import { describeMove } from '../../move-text';
import { turnLine, turnOf, type Mode } from '../../turn';
import { pendingHere, staleRead, type Page } from '../../account-game/state';

export type BoardMove = { pre: Position; pos: Position; move: Move; lan: string; words: string };
export function stripLine(side: Color, rating?: NonNullable<View['opponent']>['rating'], level?: View['level']): string {
  if (level) return level[0].toUpperCase() + level.slice(1);
  const colour = side === 0 ? 'White' : 'Black';
  return rating ? `${rating.provisional ? 'New player' : Math.round(rating.rating)} · ${colour}` : colour;
}
export function timeLeft(view: View, elapsed = 0): string {
  if (view.status !== 'playing' || !view.deadline_at) return '';
  const ms = Date.parse(view.deadline_at) - Date.parse(view.server_now) - elapsed;
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'Time is up';
  return ms >= 3600000 ? `${Math.ceil(ms / 3600000)} h left` : `${Math.ceil(ms / 60000)} min left`;
}
export function cardCoins(pos: Position, side: Color, hand: readonly CardName[], moves: readonly Move[]): { card: CardName; spent: boolean; moves: Move[] }[] {
  return hand.map((card, index) => {
    const spent = !!((pos.used?.[side] ?? 0) >> index & 1);
    return { card, spent, moves: spent ? [] : moves.filter(move => move.power && (move.via === 'mirrorb' ? card === 'MirrorB' : !move.via && TAG_POWER[move.power] === card)) };
  });
}
/** An empty line means that the card can be used now. */
export function cardUseReason(coin: { spent: boolean; moves: readonly Move[] }, side: Color, view: Pick<View, 'seat' | 'status' | 'turn'>, pos: Pick<Position, 'turn'>, ready: boolean, page: Page): string {
  if (coin.spent) return 'This card is spent.';
  if (side !== view.seat) return "This is your opponent's card.";
  if (view.status !== 'playing') return 'This game has ended.';
  if (!ready) {
    if (page.writing || page.mounting || pendingHere(page) && !page.pending?.error) return 'Wait for the current action to finish.';
    if (pendingHere(page) && page.pending?.error) return 'Close this sheet and select Retry.';
    if (staleRead(page) || !page.connected) return 'Close this sheet and select Try again.';
  }
  if (view.turn !== view.seat) return 'Use this card on your turn.';
  if (pos.turn !== view.seat || !ready) return 'Finish your turn before you use this card.';
  return coin.moves.length ? '' : 'This card has no move now.';
}
export function applyLan(pre: Position, lan: string, rules: Partial<Rules>, legal?: readonly string[]): BoardMove | undefined {
  if (legal && !legal.includes(lan)) return;
  setRules(rules);
  const move = legalMoves(pre).find(move => toLan(pre, move) === lan);
  return move && { pre, pos: makeMove(pre, move), move, lan, words: describeMove(pre, move, true) };
}

export function draftTurn(steps: readonly BoardMove[], pos: Position, mode: Exclude<Mode, 'device'>, seat: Color) {
  const game = { history: steps.map(step => ({ pos: step.pre })), pos, status: status(pos), legal: legalMoves(pos), inCheck: inCheck(pos) };
  const turn = turnOf(game, 0);
  if (!turn.staged && pos.turn === seat && turn.midWay && game.legal.some(move => move.pass)) turn.ready = true;
  const { staged, midWay, waits, ready } = turn;
  return { staged, midWay, waits, ready, line: turnLine(game, ready && !staged ? { ...turn, staged: 1 } : turn, mode) };
}

export function sendActions(steps: readonly BoardMove[], pos: Position, seat: Color): string[] {
  const turn = draftTurn(steps, pos, 'computer', seat), lans = steps.map(step => step.lan);
  return turn.ready && turn.midWay && !turn.waits ? [...lans, '--'] : lans;
}

export function draftChoices(view: View, pos: Position, steps: readonly BoardMove[]): { lan: string; move: Move }[] {
  if (draftTurn(steps, pos, 'computer', view.seat).waits) return [];
  return legalMoves(pos).map(move => ({ lan: toLan(pos, move), move })).filter(({ lan }) => steps.length > 0 || view.legal.includes(lan));
}

export function restoreDraft(view: View, saved: Draft | undefined, rules: Partial<Rules>, account?: string): BoardMove[] | undefined {
  if (!saved || saved.game_tag !== view.game_id.slice(0, 8) || saved.fen !== view.fen || view.action !== 'ready' || view.status !== 'playing') return;
  if (account !== undefined && (!saved.scope || saved.scope.account !== account || saved.scope.game !== view.game_id || saved.scope.revision !== view.revision || saved.scope.rules !== JSON.stringify(rules))) return;
  setRules(rules);
  let pos = fromFen(view.fen);
  const steps: BoardMove[] = [];
  for (const lan of saved.lans) {
    const step = applyLan(pos, lan, rules, draftChoices(view, pos, steps).map(choice => choice.lan));
    if (!step) return;
    steps.push(step); pos = step.pos;
  }
  return steps;
}

export function replayLans(before: Pick<View, 'game_id' | 'revision' | 'fen'>, next: View, rules: Partial<Rules>): BoardMove[] | undefined {
  if (before.game_id !== next.game_id || !before.fen || next.revision < before.revision) return;
  setRules(rules);
  let pos = fromFen(before.fen), revision = before.revision;
  const steps: BoardMove[] = [];
  for (const command of next.last_commands.filter(command => command.seq > before.revision)) {
    if (command.seq !== ++revision) return;
    const action = command.action;
    if (action.type !== 'turn' && action.type !== 'computer') continue;
    if (!('actions' in action)) return;
    for (const lan of action.actions) {
      const step = applyLan(pos, lan, rules);
      if (!step) return;
      steps.push(step); pos = step.pos;
    }
  }
  return revision === next.revision && toFen(pos) === next.fen ? steps : undefined;
}

export function replayHistory(next: View, rules: Partial<Rules>): BoardMove[] | undefined {
  if (!next.history) return;
  let pos = fromFen(next.history.initial_fen);
  const steps: BoardMove[] = [];
  for (const lan of next.history.actions) {
    const step = applyLan(pos, lan, rules);
    if (!step) return;
    steps.push(step); pos = step.pos;
  }
  return toFen(pos) === next.fen ? steps : undefined;
}

export function boardActions(view: View, elapsed = 0): { abort: boolean; claim: 'win' | 'end' | null } {
  const playing = view.status === 'playing';
  const missed = playing && view.kind !== 'solo' && view.turn !== view.seat && view.deadline_at !== null
    && Date.parse(view.deadline_at) <= Date.parse(view.server_now) + elapsed;
  return { abort: view.abort_open, claim: missed ? view.abort_open ? 'end' : 'win' : null };
}
