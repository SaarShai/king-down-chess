import { copyText } from '../clipboard';
import type { Game } from '../game';
import { kingsParam } from '../powers-ui';
import { RULES as GAME_RULES, type Rules } from '../rules/engine';
import { toFen } from '../rules/setup';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

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

/** This page's URL without a game link's parameters. */
export function gameLinkless(): string {
  const url = new URL(location.href);
  for (const k of ['army', 'fen', 'moves']) url.searchParams.delete(k);
  return url.href;
}

/** Copies `text`, then says on `button` (its label) for 2.5 s what happened: `done` only after the copy succeeds. */
export async function copyAndSay(button: HTMLElement, text: string, done: string): Promise<void> {
  const label = button.querySelector<HTMLElement>('.label') ?? button, idle = label.dataset.idle ??= label.textContent ?? '';
  label.textContent = await copyText(text) ? done : 'Could not copy';
  setTimeout(() => { label.textContent = idle; }, 2500);
}

/**
 * Copy (the moves) and Share (a link to the game). `gameLink` makes the link of the game on the board.
 * `rules`: the page's `?rules=` preset. `blocked`: Share does nothing now.
 */
export function connectLinks(c: { game(): Game; turnStart(): number; rules: string | null; blocked(): boolean }) {
  $('copy').onclick = () => {
    const text = c.game().history.map((h, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${h.lan}` : h.lan)).join(' ');
    void copyAndSay($('copy'), text, 'Moves copied');
  };

  /** A link that holds this whole game, for a friend to open and answer on their device (no server). */
  function gameLink(lans = c.game().history.slice(0, c.turnStart()).map(h => h.lan)): string {
    const game = c.game();
    return gameUrl(location, c.rules, GAME_RULES.kings,
      game.backRank ? { army: game.backRank } : { fen: toFen(game.history[0]?.pos ?? game.pos) }, lans);
  }

  $('share').onclick = async () => {
    if (c.blocked()) return;
    const url = gameLink(), button = $('share');
    // A phone opens its share sheet (chat apps); elsewhere the link goes to the clipboard.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: 'King Down Chess', text: `King Down Chess: ${c.game().pos.turn ? 'Black' : 'White'} to move`, url }); return; }
      catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    await copyAndSay(button, url, 'Link copied. Paste it to your friend.');
  };
  return { gameLink };
}
