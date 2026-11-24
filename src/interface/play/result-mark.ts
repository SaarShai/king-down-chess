/**
 * The solo result card that is open in this tab. A reload opens it again: one exception to decision 6 of
 * interface-playable issue 01 (a finished game has no Continue). The mark names the game of the card. No DOM.
 */
import { gameJSON, savedGame } from '../../screen/save';
import { DraftTurn } from './turn';
import { levelOf, playerOf, savedPlayTime, type Stored } from './saved';

const KEY = 'kingdown.result';
const marked = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
/** Mark the game of the open card. True: the mark was there before, so the card comes back after a reload. */
export function markResult(save: Stored['save']): boolean {
  const game = gameJSON(save), back = marked() === game;
  try { sessionStorage.setItem(KEY, game); } catch { /* The reload then opens Home. */ }
  return back;
}
export function clearResult(): void { try { sessionStorage.removeItem(KEY); } catch { /* There is no mark. */ } }
/** The finished game of the marked card, from the stored save; null for any other game. */
export function markedResult({ kind, save }: Stored) {
  const player = kind === 'finished' && save && marked() === gameJSON(save) ? playerOf(save) : null;
  if (player === null) return null;
  const game = savedGame(save);
  return { game, draft: new DraftTurn(game), level: levelOf(save!.skill), player, playedMs: savedPlayTime(save), finished: { resigned: save!.resigned ?? null } };
}
