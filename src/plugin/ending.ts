/** How a game ended, in plain words, for the board line and the tool summary. */
import type { View } from '../match/protocol';

const WHY: Record<NonNullable<View['result']>['reason'], string> = {
  checkmate: 'Checkmate', stalemate: 'Stalemate', draw50: 'Fifty-move rule', drawRepetition: 'Repetition', drawMaterial: 'Insufficient material',
  resignation: 'Resignation', agreement: 'Agreement', timeout: 'Time', abort: 'Game aborted', no_start: 'No first move. No result.',
};
export function ending({ result, opponent, fen, kind }: Pick<View, 'result' | 'opponent' | 'fen' | 'kind'>): string {
  if (!result) return '';
  if (result.reason === 'no_start') return opponent === null ? kind === 'friend' ? 'The invitation expired. No result.' : 'No one took your open game. No result.' : !fen ? 'The setup time ran out. No result.' : 'No first move. No result.';
  const why = WHY[result.reason];
  return result.winner !== null ? `${result.winner === 0 ? 'White' : 'Black'} wins · ${why}` : result.reason === 'abort' ? why : `Draw · ${why}`;
}
