import { G, K, P, S, colorOf, piece, rank, typeOf, type Color, type Move } from '../../../rules/engine';
import { boardStates } from '../../../render/effects/states';
import { armKey, targetOf, type DraftTurn } from '../turn';
import { text } from '../texts';

const lines = {
  frozen: 'Frozen for its next turn.',
  'no-moves': 'No move now',
  'in-check': 'Choose a move that keeps your king safe.',
  'not-yours': 'Tap a piece of yours.',
  guard: 'Only a king can capture a Guard.',
  'card-used': 'You used this card.',
  'not-in-preview': 'Not in this preview.',
  'not-your-turn': 'Wait for your turn.',
} as const;

export type Refusal = { code: keyof typeof lines; line: string };
export type HelpTap =
  | { kind: 'board'; square: number; source: number | null }
  | { kind: 'card'; index: number; key: string }
  | { kind: 'end' };

const reason = (code: Refusal['code'], line: string = lines[code]): Refusal => ({ code, line });

/** Call before the tap changes the draft. A preview restriction is optional. */
export function refusalReason(
  { draft, player, inputLocked, previewBlocked }: { draft: DraftTurn; player: Color; inputLocked?: boolean; previewBlocked?: boolean },
  tap: HelpTap,
): Refusal | null {
  if (draft.game.status !== 'playing') return null;
  if (draft.base.turn !== player || inputLocked) return reason('not-your-turn');
  if (previewBlocked) return reason('not-in-preview');
  const context = draft.game.context, pos = draft.now;
  const checked = () => context.inCheck(pos);
  if (tap.kind === 'end') return draft.canFinish ? null : reason(checked() ? 'in-check' : 'no-moves');

  if (tap.kind === 'card') {
    if ((draft.base.used?.[player] ?? 0) & (1 << tap.index)) return reason('card-used');
    if (draft.armed === tap.key || draft.armable(tap.key)) return null;
    if (draft.length) {
      const playedFreeze = draft.steps.some(step => step.move.power === 'freeze');
      const line = playedFreeze ? `You played Freeze. ${text.undo} to play a card.`
        : draft.steps.some(step => !step.move.power) || draft.chain ? `You moved. ${text.undo} to play a card.` : undefined;
      return reason('card-used', line);
    }
    if (checked()) return reason('in-check', tap.key === 'freeze' ? 'Freeze cannot stop a check.' : undefined);
    if (tap.key === 'march' && !pos.board.some((code, square) => code === piece(P, player) && rank(square) !== (player ? 6 : 1))) {
      return reason('no-moves', 'March needs a pawn off its start rank.');
    }
    return reason('no-moves');
  }

  if (!draft.open && !draft.chain) return reason('no-moves');
  const { square, source } = tap;
  const target = draft.position.board[square];
  const enemy = !!target && colorOf(target) !== player;
  const frozen = (sq: number) => boardStates(context, draft.position).some(state => state.kind === 'freeze' && state.sq === sq);
  if (source != null && draft.at(source, square).length) return null;
  if (draft.armed === 'freeze') {
    if (draft.armedMoves.some(move => move.from === square)) return null;
    if (enemy && typeOf(target) === K) return reason('not-yours', 'Not the king.');
    if (enemy && frozen(square)) return reason('frozen', 'It is frozen already.');
    if (!enemy) return reason('not-yours', 'Choose an enemy piece.');
    return reason(checked() ? 'in-check' : 'no-moves', checked() ? 'Freeze cannot stop a check.' : undefined);
  }

  if (source === square && !draft.chain && !draft.armed) return null;
  if (!draft.chain && draft.options(square).length) return null;
  const actor = enemy || !target || draft.chain ? source : square;
  if (actor != null && !draft.chain && frozen(actor)) return reason('frozen');
  const type = source == null ? null : typeOf(pos.board[source]);
  if (enemy && type != null && type !== K && typeOf(target) === G && context.rules.guardImmune) return reason('guard');

  const matches = (move: Move) => !move.pass && move.from === actor && armKey(move) === draft.armed
    && (actor !== source || (draft.chain
      ? draft.captures.every((sq, i) => move.captures[i] === sq) && move.captures[draft.captures.length] === square
      : (type === S && move.captures.length ? move.captures[0] : targetOf(move)) === square));
  if (actor != null && (checked() || context.pseudoMoves(pos).some(move => matches(move)
    && context.inCheck({ ...context.makeMove(pos, move), turn: pos.turn })))) return reason('in-check');
  if (enemy) return reason('not-yours');
  return actor != null || draft.armed ? reason('no-moves') : null;
}
