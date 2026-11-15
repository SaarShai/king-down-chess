/** A pending game keeps the king accepted for this account and seat. */
import type { View } from '../../match/protocol';
import type { KingChoice } from '../../rules/rules';
import { OPTIONS_KEY, readOptions, shownKing } from '../play/new-game';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export const seatKingKey = (user: string, view: Pick<View, 'game_id' | 'seat'>) => `kingdown.people-king.${user}.${view.game_id}.${view.seat}`;
export function preferredKing(storage: Pick<Storage, 'getItem'>): KingChoice | null {
  try { return readOptions(JSON.parse(storage.getItem(OPTIONS_KEY) ?? 'null')).king; }
  catch { return readOptions(null).king; }
}
export function bindSeatKing(storage: Store, user: string, view: View, preferred = preferredKing(storage)): KingChoice | null {
  const king = view.options?.kingPowers ? shownKing(view.options.cards ? 'both' : 'powers', preferred) : null;
  storage.setItem(seatKingKey(user, view), JSON.stringify(king));
  return king;
}
export function seatKing(storage: Store, user: string, view: View): KingChoice | null {
  const saved = storage.getItem(seatKingKey(user, view));
  if (saved === null) return bindSeatKing(storage, user, view);
  return JSON.parse(saved);
}
