/** How a game ended, in plain words, for the board line and the tool summary. */
import type { View } from '../match/protocol';

const WHY: Record<NonNullable<View['result']>['reason'], string> = {
  checkmate: 'Checkmate', stalemate: 'Stalemate', draw50: 'Fifty-move rule', drawRepetition: 'Repetition', drawMaterial: 'Insufficient material',
  resignation: 'Resignation', agreement: 'Agreement', timeout: 'Time', abort: 'Game aborted', no_start: 'No first move. No result.',
};
export { WHY };
export function endReason(view: View): string {
  const result = view.result;
  if (!result) return '';
  switch (result.reason) {
    case 'resignation': return result.winner === view.seat ? 'Your opponent resigned.' : 'You resigned.';
    case 'timeout': return result.winner === view.seat ? 'Your opponent ran out of time.' : 'You ran out of time.';
    case 'agreement': return 'Draw by agreement.';
    case 'stalemate': return 'Draw by stalemate.';
    case 'draw50': return 'Draw by the fifty-move rule.';
    case 'drawRepetition': return 'Draw by repetition.';
    case 'drawMaterial': return 'Neither side has enough pieces to give checkmate.';
    case 'checkmate': return result.winner === view.seat ? 'You gave checkmate.' : 'Your opponent gave checkmate.';
    case 'abort': case 'no_start': return '';
  }
}
export function ending({ result, opponent, fen, kind }: Pick<View, 'result' | 'opponent' | 'fen' | 'kind'>): string {
  if (!result) return '';
  if (result.reason === 'no_start') return opponent === null ? kind === 'friend' ? 'The invitation expired. No result.' : 'No one took your open game. No result.' : !fen ? 'The setup time ran out. No result.' : 'No first move. No result.';
  const why = WHY[result.reason];
  return result.winner !== null ? `${result.winner === 0 ? 'White' : 'Black'} wins · ${why}` : result.reason === 'abort' ? why : `Draw · ${why}`;
}
