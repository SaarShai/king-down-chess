import { KINGS } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
const KEY = 'kingdown.hints';
const allowed = new Set(['view:symbols', ...Object.values(KINGS).flat().map(id => `power:${id}`), ...RELEASED_CARDS.map(card => `card:${card.id}`)]);
let memory = new Set<string>(), localOnly = false;
/** A storage error uses this visit's memory. Read no other device key. */
export function readHints(): Set<string> {
  if (!localOnly) try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data?.version === 1 && Array.isArray(data.seen) && data.seen.every((key: unknown) => typeof key === 'string' && allowed.has(key))) memory = new Set(data.seen);
  } catch { localOnly = true; }
  return new Set(memory);
}
export function markHintSeen(key: string): void {
  if (!allowed.has(key)) return;
  memory = readHints(); memory.add(key);
  if (!localOnly) try { localStorage.setItem(KEY, JSON.stringify({ version: 1, seen: [...memory] })); } catch { localOnly = true; }
}
/** False means that the reset lasts for this visit. */
export function resetHints(): boolean {
  memory.clear();
  try { localStorage.removeItem(KEY); localOnly = false; return true; } catch { localOnly = true; return false; }
}
