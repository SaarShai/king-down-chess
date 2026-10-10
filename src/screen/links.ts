import { kingsParam } from '../powers-ui';
import type { Rules } from '../rules/engine';

/**
 * A link that holds a whole game, for a friend to open and answer on their device (no server): this
 * page, its `?rules=` preset, the kings, the start (the army, else the position) and the moves.
 */
export function gameUrl(page: { origin: string; pathname: string }, rules: string | null, kings: Rules['kings'],
  start: { army: string } | { fen: string }, lans: readonly string[]): string {
  const url = new URL(page.pathname, page.origin);
  if (rules) url.searchParams.set('rules', rules);
  const k = kingsParam(kings);
  if (k) url.searchParams.set('kings', k);
  if ('army' in start) url.searchParams.set('army', start.army);
  else url.searchParams.set('fen', start.fen);
  url.searchParams.set('moves', lans.join('_')); // '_' needs no escaping in a URL
  return url.href;
}
