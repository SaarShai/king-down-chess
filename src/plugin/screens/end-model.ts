import type { View } from '../../match/protocol';
export function rematchChoices(view: View): ('offer' | 'accept' | 'decline')[] {
  if (view.status !== 'finished' || view.rematch_allowed === false || view.rematch_game_id || !view.opponent || view.opponent.deleted) return [];
  if (view.kind === 'solo' || view.rematch_offer == null) return ['offer'];
  return view.rematch_offer === view.seat ? [] : ['accept','decline'];
}
/** The line under a rematch choice. Only a ranked result points back to Ranked, where the build offers it (`ranked`). */
export function rematchNote(view: Pick<View, 'kind' | 'rating_policy'>, ranked: boolean): string {
  if (view.kind === 'solo') return 'Play again with the same rules and colour.';
  return `A rematch is Casual. It keeps the features and swaps the colours.${ranked && view.rating_policy === 'ranked-v1' ? ' Return to Ranked to find another ranked opponent.' : ''}`;
}
