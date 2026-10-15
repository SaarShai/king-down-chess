import type { View } from '../../match/protocol';
import { legalMoves, makeMove, setRules, TAG_POWER, type CardName, type Color, type Move, type Position, type Rules } from '../../rules/engine';
import { fromFen, toFen, toLan } from '../../rules/setup';
import { describeMove } from '../../move-text';

export type BoardMove = { pre: Position; pos: Position; move: Move; lan: string; words: string };
export function stripLine(side: Color, rating?: NonNullable<View['opponent']>['rating'], level?: View['level']): string {
  if (level) return 'Computer · ' + level[0].toUpperCase() + level.slice(1);
  const colour = side === 0 ? 'White' : 'Black';
  return rating ? `${Math.round(rating.rating)}${rating.provisional ? '?' : ''} · ${colour}` : colour;
}
export function cardCoins(pos: Position, side: Color, hand: readonly CardName[], moves: readonly Move[]): { card: CardName; spent: boolean; moves: Move[] }[] {
  return hand.map((card, index) => {
    const spent = !!((pos.used?.[side] ?? 0) >> index & 1);
    return { card, spent, moves: spent ? [] : moves.filter(move => move.power && (move.via === 'mirrorb' ? card === 'MirrorB' : !move.via && TAG_POWER[move.power] === card)) };
  });
}
export function applyLan(pre: Position, lan: string, rules: Partial<Rules>, legal?: readonly string[]): BoardMove | undefined {
  if (legal && !legal.includes(lan)) return;
  setRules(rules);
  const move = legalMoves(pre).find(move => toLan(pre, move) === lan);
  return move && { pre, pos: makeMove(pre, move), move, lan, words: describeMove(pre, move, true) };
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
