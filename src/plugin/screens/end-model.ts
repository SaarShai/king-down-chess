import type { View } from '../../match/protocol';
export function rematchChoices(view: View): ('offer' | 'accept' | 'decline')[] {
  if (view.status !== 'finished' || view.rematch_allowed === false || view.rematch_game_id || !view.opponent || view.opponent.deleted) return [];
  if (view.kind === 'solo' || view.rematch_offer == null) return ['offer'];
  return view.rematch_offer === view.seat ? [] : ['accept','decline'];
}
