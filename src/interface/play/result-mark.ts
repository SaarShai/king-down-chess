/**
 * The solo result card that is open in this tab. A reload opens it again: one exception to decision 6 of
 * interface-playable issue 01 (a finished game has no Continue). The mark names the saved game of the card by its time
 * and its data, so the same moves in a later game are another game. No DOM.
 */
import { gameTime } from '../../account/local';
import { gameJSON, readSave, savedGame } from '../../screen/save';
import { DraftTurn } from './turn';
import { levelOf, playerOf, savedPlayTime, type Stored } from './saved';

const KEY = 'kingdown.result';
const marked = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
const markOf = (save: Stored['save']) => `${gameTime(save)}|${gameJSON(save)}`;
/** Mark the saved game of the open card. True: the mark was there before, so the card comes back. */
export function markResult(game: Stored['save']): boolean {
  if (marked() !== null) return true;
  const { save } = readSave();
  if (gameJSON(save) === gameJSON(game)) try { sessionStorage.setItem(KEY, markOf(save)); } catch { /* The reload then opens Home. */ }
  return false;
}
export function clearResult(): void { try { sessionStorage.removeItem(KEY); } catch { /* There is no mark. */ } }
/** The finished game of the marked card, from the stored save; null for any other game. A resignation before the first move has kind `empty`. */
export function markedResult({ kind, save }: Stored) {
  const ended = kind === 'finished' || kind === 'empty' && save?.resigned != null;
  const player = ended && save && marked() === markOf(save) ? playerOf(save) : null;
  if (player === null) return null;
  const game = savedGame(save);
  return { game, draft: new DraftTurn(game), level: levelOf(save!.skill), player, playedMs: savedPlayTime(save), finished: { resigned: save!.resigned ?? null } };
}
