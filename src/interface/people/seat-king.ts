/** A pending game keeps the king accepted for this account and seat. */
import { accountData, AccountDataClosed, type AccountData, type AccountStore } from '../../account/data';
import type { View } from '../../match/protocol';
import type { KingChoice } from '../../rules/rules';
import { ObsoleteAction } from './server';
import { OPTIONS_KEY, readOptions, shownKing, kingChoices } from '../play/new-game';

type Store = AccountStore;
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
/** Read the accepted choice for a synchronous setup render; writes use bindSeatKing. */
export function readSeatKing(storage: Store, user: string, view: View, preferred = preferredKing(storage)): KingChoice | null {
  if (!view.options?.kingPowers) return null;
  const key = seatKingKey(user, view), type = view.options.cards ? 'both' : 'powers';
  try {
    const saved = JSON.parse(storage.getItem(key) ?? 'null');
    const king = kingChoices(type).find(k => k.king === saved?.king && k.power === saved?.power);
    if (king) return king;
  } catch { /* A refused read or invalid record uses this session's accepted choice. */ }
  return unsaved.get(storage)?.get(key) ?? shownKing(type, preferred);
}
export async function bindSeatKing(storage: Store, user: string, view: View, preferred = preferredKing(storage), onFailure?: () => void, gate: AccountData = accountData(user, storage), current?: () => void | Promise<void>): Promise<KingChoice | null> {
  if (!view.options?.kingPowers) { await gate.write(async () => { await current?.(); }); return null; }
  const key = seatKingKey(user, view);
  let king = readSeatKing(storage, user, view, preferred);
  try {
    await gate.write(async () => {
      await current?.();
      king = readSeatKing(storage, user, view, preferred);
      let saved;
      try { saved = JSON.parse(storage.getItem(key) ?? 'null'); } catch { /* A refused read still permits a save attempt. */ }
      if (saved?.king !== king?.king || saved?.power !== king?.power) storage.setItem(key, JSON.stringify(king));
      unsaved.get(storage)?.delete(key);
    });
  } catch (error) {
    if (error instanceof ObsoleteAction) throw error;
    if (error instanceof AccountDataClosed) { unsaved.get(storage)?.delete(key); throw error; }
    let kept = unsaved.get(storage);
    if (!kept) { kept = new Map(); unsaved.set(storage, kept); }
    kept.set(key, king!); onFailure?.();
  }
  return king;
}
export function seatKing(storage: Store, user: string, view: View, gate?: AccountData, current?: () => void | Promise<void>): Promise<KingChoice | null> {
  return bindSeatKing(storage, user, view, preferredKing(storage), undefined, gate, current);
}
