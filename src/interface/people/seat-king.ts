/** A pending game keeps the king accepted for this account and seat. */
import type { View } from '../../match/protocol';
import type { KingChoice } from '../../rules/rules';
import { OPTIONS_KEY, readOptions, shownKing, kingChoices } from '../play/new-game';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export const seatKingKey = (user: string, view: Pick<View, 'game_id' | 'seat'>) => `kingdown.people-king.${user}.${view.game_id}.${view.seat}`;
export function preferredKing(storage: Pick<Storage, 'getItem'>): KingChoice | null {
  try { return readOptions(JSON.parse(storage.getItem(OPTIONS_KEY) ?? 'null')).king; }
  catch { return readOptions(null).king; }
}
// A refused write keeps the accepted choice for this storage session and retries on the next read.
const unsaved = new WeakMap<Store, Map<string, KingChoice>>();
export function seatKingUnsaved(storage: Store, user: string, view: Pick<View, 'game_id' | 'seat'>): boolean {
  return unsaved.get(storage)?.has(seatKingKey(user, view)) ?? false;
}
export function bindSeatKing(storage: Store, user: string, view: View, preferred = preferredKing(storage), onFailure?: () => void): KingChoice | null {
  if (!view.options?.kingPowers) return null;
  const key = seatKingKey(user, view), type = view.options.cards ? 'both' : 'powers';
  try {
    const saved = JSON.parse(storage.getItem(key) ?? 'null');
    const king = kingChoices(type).find(k => k.king === saved?.king && k.power === saved?.power);
    if (king) { unsaved.get(storage)?.delete(key); return king; }
  } catch { /* A refused read or invalid record uses this session's accepted choice. */ }
  const king = unsaved.get(storage)?.get(key) ?? shownKing(type, preferred);
  try { storage.setItem(key, JSON.stringify(king)); unsaved.get(storage)?.delete(key); }
  catch {
    let kept = unsaved.get(storage);
    if (!kept) { kept = new Map(); unsaved.set(storage, kept); }
    kept.set(key, king); onFailure?.();
  }
  return king;
}
export function seatKing(storage: Store, user: string, view: View): KingChoice | null {
  return bindSeatKing(storage, user, view);
}
