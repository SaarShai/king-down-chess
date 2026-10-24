import { describeMove } from '../../move-text';
import { GameRules } from '../../game-rules';
import type { Draft } from '../client';
import type { DraftPosition, DraftPreview, View } from '../../match/protocol';
import { TAG_POWER, type CardName, type Color, type Move, type Position, type Rules } from '../../rules/engine';
import { toFen, toLan } from '../../rules/setup';
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
  const context = new GameRules(rules);
  const move = context.legalMoves(pre).find(move => toLan(pre, move) === lan);
  return move && { pre, pos: context.makeMove(pre, move), move, lan, words: describeMove(context, pre, move, true) };
}

export function draftTurn(steps: readonly BoardMove[], pos: Position, mode: Exclude<Mode, 'device'>, seat: Color, context: GameRules = new GameRules(), preview?: DraftPosition) {
  const game = { history: steps.map(step => ({ pos: step.pre })), pos, status: preview ? preview.status : context.status(pos), legal: preview ? preview.moves.map(choice => choice.move) : context.legalMoves(pos), inCheck: preview ? preview.in_check : context.inCheck(pos) };
  const turn = turnOf(game, 0);
  if (!turn.staged && pos.turn === seat && turn.midWay && game.legal.some(move => move.pass)) turn.ready = true;
  const { staged, midWay, waits, ready } = turn;
  return { staged, midWay, waits, ready, line: turnLine(game, ready && !staged ? { ...turn, staged: 1 } : turn, mode) };
}

export function sendActions(steps: readonly BoardMove[], pos: Position, seat: Color, context: GameRules = new GameRules(), preview?: DraftPosition): string[] {
  const turn = draftTurn(steps, pos, 'computer', seat, context, preview), lans = steps.map(step => step.lan);
  return turn.ready && turn.midWay && !turn.waits ? [...lans, '--'] : lans;
}

export function draftChoices(view: View, pos: Position, steps: readonly BoardMove[], context: GameRules = new GameRules(view.rules), preview?: DraftPosition): { lan: string; move: Move }[] {
  if (draftTurn(steps, pos, 'computer', view.seat, context, preview).waits) return [];
  if (preview) return preview.moves;
  return context.legalMoves(pos).map(move => ({ lan: toLan(pos, move), move })).filter(({ lan }) => steps.length > 0 || view.legal.includes(lan));
}

type Choice = { lan: string; move: Move };
const symmetricSwap = (move: Move): boolean => !!move.swap && (move.power === 'skylift' || move.power === 'morphs');

/** A symmetric card pair has one server action, but either piece can start its UI selection. */
export function choicesFrom(choices: readonly Choice[], square: number | undefined): Choice[] {
  if (square === undefined) return [];
  return choices.flatMap(choice => choice.move.from === square ? [choice]
    : symmetricSwap(choice.move) && choice.move.to === square
      ? [{ ...choice, move: { ...choice.move, from: square, to: choice.move.from } }] : []);
}

export function choiceSources(choices: readonly Choice[]): number[] {
  return [...new Set(choices.flatMap(({ move }) => symmetricSwap(move) ? [move.from, move.to] : [move.from]))];
}

export function draftLans(view: View, saved: Draft | undefined, rules: Partial<Rules>, account: string): string[] | undefined {
  if (!saved || saved.game_tag !== view.game_id.slice(0, 8) || saved.fen !== view.fen || view.action !== 'ready' || view.status !== 'playing') return;
  const scope = saved.scope;
  if (!scope || scope.account !== account || scope.game !== view.game_id || scope.rules !== JSON.stringify(rules) || !view.engine_fingerprint || scope.engine !== view.engine_fingerprint || scope.revision > view.revision) return;
  // Hidden choices can exist until both seats are ready; afterward only presets are hidden (GameService.render).
  const nonBoard = (type: string) => type === 'draw' || type === 'say' || type === 'hidden' && view.ready?.every(Boolean);
  const changes = view.last_commands.filter(command => command.seq > scope.revision);
  if (changes.length !== view.revision - scope.revision || changes.some((command, index) => command.seq !== scope.revision + index + 1 || !nonBoard(command.action.type))) return;
  return saved.lans;
}

export function restoreDraft(view: View, saved: Draft | undefined, rules: Partial<Rules>, account: string): BoardMove[] | undefined {
  const lans = draftLans(view, saved, rules, account);
  if (!lans) return;
  const context = new GameRules(rules);
  let pos = context.fromFen(view.fen);
  const steps: BoardMove[] = [];
  for (const lan of lans) {
    const step = applyLan(pos, lan, rules, draftChoices(view, pos, steps, context).map(choice => choice.lan));
    if (!step) return;
    steps.push(step); pos = step.pos;
  }
  return steps;
}

/** Only parse positions and describe supplied moves; never enforce an archived draft in the page. */
export function previewSteps(view: View, preview: DraftPreview, context = new GameRules(view.rules)): BoardMove[] | undefined {
  if (preview.game_id !== view.game_id || preview.revision !== view.revision || preview.engine_fingerprint !== view.engine_fingerprint || preview.positions.length !== preview.actions.length + 1 || preview.positions[0]?.fen !== view.fen) return;
  const steps: BoardMove[] = [];
  for (const [index, lan] of preview.actions.entries()) {
    const before = preview.positions[index], after = preview.positions[index + 1];
    const move = before.moves.find(choice => choice.lan === lan)?.move;
    if (!move) return;
    const pre = context.fromFen(before.fen), pos = context.fromFen(after.fen);
    steps.push({ pre, pos, move, lan, words: describeMove(context, pre, move, true) });
  }
  return steps;
}

/** The acknowledgement can supply the final position of an automatic pass without local enforcement. */
export function committedPreview(before: View, next: View, preview: DraftPreview, context = new GameRules(before.rules)): BoardMove[] | undefined {
  if (next.game_id !== before.game_id || next.revision !== before.revision + 1 || next.engine_fingerprint !== before.engine_fingerprint) return;
  const command = next.last_commands.find(command => command.seq === next.revision && command.seat === before.seat);
  if (command?.action.type !== 'turn') return;
  const steps = previewSteps(before, preview, context), last = preview.positions.at(-1);
  if (!steps?.length || !last) return;
  if (JSON.stringify(command.action.actions) === JSON.stringify(preview.actions)) return last.fen === next.fen ? steps : undefined;
  const pass = last.moves.find(choice => choice.lan === '--')?.move;
  if (!pass?.pass || last.turn !== before.seat || next.turn === before.seat || JSON.stringify(command.action.actions) !== JSON.stringify([...preview.actions, '--'])) return;
  const pre = context.fromFen(last.fen), pos = context.fromFen(next.fen);
  return [...steps, { pre, pos, move: pass, lan: '--', words: describeMove(context, pre, pass, true) }];
}

export function replayLans(before: Pick<View, 'game_id' | 'revision' | 'fen'>, next: View, rules: Partial<Rules>): BoardMove[] | undefined {
  try {
    if (before.game_id !== next.game_id || !before.fen || next.revision < before.revision) return;
    const context = new GameRules(rules);
    let pos = context.fromFen(before.fen), revision = before.revision;
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
  } catch { return; }
}

export function replayHistory(next: View, rules: Partial<Rules>): BoardMove[] | undefined {
  try {
    if (!next.history) return;
    const context = new GameRules(rules);
    let pos = context.fromFen(next.history.initial_fen);
    const steps: BoardMove[] = [];
    for (const lan of next.history.actions) {
      const step = applyLan(pos, lan, rules);
      if (!step) return;
      steps.push(step); pos = step.pos;
    }
    return toFen(pos) === next.fen ? steps : undefined;
  } catch { return; }
}

export function boardActions(view: View, elapsed = 0): { abort: boolean; claim: 'win' | 'end' | null } {
  const playing = view.status === 'playing';
  const missed = playing && view.kind !== 'solo' && view.turn !== view.seat && view.deadline_at !== null
    && Date.parse(view.deadline_at) <= Date.parse(view.server_now) + elapsed;
  return { abort: view.abort_open, claim: missed ? view.abort_open ? 'end' : 'win' : null };
}
