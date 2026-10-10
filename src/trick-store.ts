import { TRICKS, type TrickId } from './tricks';

export const KEY = 'kingdown.tricks';
export interface Seals { found: TrickId[]; unseen: boolean }
type Box = Pick<Storage, 'getItem' | 'setItem'>;
const box = (): Box | null => { try { return localStorage; } catch { return null; } };

export function loadSeals(storage: Box | null = box()): Seals {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? 'null') as { found?: unknown; unseen?: unknown } | null;
    const ids: unknown[] = Array.isArray(saved?.found) ? saved.found : [];
    const found = [...new Set(ids.filter((id): id is TrickId => TRICKS.some(t => t.id === id)))];
    return { found, unseen: found.length > 0 && saved?.unseen === true };
  } catch { return { found: [], unseen: false }; }
}

/** True only when a new seal is saved. */
export function saveSeal(id: TrickId, storage: Box | null = box()): boolean {
  try {
    if (!storage) return false;
    const seals = loadSeals(storage);
    if (seals.found.includes(id)) return false;
    storage.setItem(KEY, JSON.stringify({ found: [id, ...seals.found], unseen: true }));
    return true;
  } catch { return false; }
}

/** Call when the Menu opens. The seals stay on the device. */
export function seeSeals(storage: Box | null = box()): boolean {
  try {
    if (!storage) return false;
    const seals = loadSeals(storage);
    storage.setItem(KEY, JSON.stringify({ ...seals, unseen: false }));
    return true;
  } catch { return false; }
}
