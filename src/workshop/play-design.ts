/**
 * "Bring a design" (ticket 17), parked with the Workshop: New game no longer offers a design. These
 * helpers came out of new-game.ts so that the New game dialog loads no Workshop module.
 */
import { HISTORY_WHENS, LETTERS } from '../rules/engine';
import { SHIPPED_VALUES } from '../ai/piece-values';
import { empty, limit, type PieceDesign } from './model';

/** Why a game cannot play design `d` yet, or '' (version 1: no When that counts moves or cards; `setRules`). */
export const refusal = (d: PieceDesign): string =>
  empty(d) ? 'it has no move' : limit(d) ? 'it breaks a Workshop limit' : d.rules.some(r => HISTORY_WHENS.includes(r.when.on)) ? 'a rule counts moves or cards' : '';

/** Back rank `back` with a design worth `worth` pawns in place of one piece: not the king, the one nearest that worth (the left one on a tie). */
export function withDesign(back: string, worth: number): string {
  if (back.includes('T')) return back; // a custom back rank from a design game already holds it
  const gap = (i: number): number => (back[i] === 'K' ? Infinity : Math.abs(SHIPPED_VALUES[LETTERS.indexOf(back[i])] / 100 - worth));
  const i = [...Array(back.length).keys()].reduce((a, b) => (gap(b) < gap(a) ? b : a));
  return back.slice(0, i) + 'T' + back.slice(i + 1);
}
