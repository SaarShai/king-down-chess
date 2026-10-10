/** How a game ended, in plain words, for the board line and the tool summary. */
import type { View } from '../match/protocol';

const WHY: Record<NonNullable<View['result']>['reason'], string> = {
  checkmate: 'Checkmate', stalemate: 'Stalemate', draw50: 'Fifty-move rule', drawRepetition: 'Repetition', drawMaterial: 'Insufficient material',
  resignation: 'Resignation', agreement: 'Agreement', timeout: 'Time', abort: 'Game aborted', no_start: 'Game cancelled: no first move',
};
export function ending({ result }: Pick<View, 'result'>): string {
  if (!result) return '';
  const why = WHY[result.reason];
  return result.winner !== null ? `${result.winner === 0 ? 'White' : 'Black'} wins · ${why}` : result.reason === 'abort' || result.reason === 'no_start' ? why : `Draw · ${why}`;
}
