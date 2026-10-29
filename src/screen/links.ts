import { copyText } from '../clipboard';
import type { Game } from '../game';
import { moveNumbers } from '../move-text';
import { kingsParam } from '../powers-ui';
import { RULES_2017, RULES_2021, type Rules } from '../rules/engine';
import { toFen } from '../rules/setup';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** The `?rules=` presets: each sets every rule but the game's kings and design. */
export const RULE_PRESETS: Readonly<Record<string, Readonly<Rules>>> = { 2017: RULES_2017, 2021: RULES_2021 };

/** The `?rules=` name of the preset that these rules play, or null for the current rules. */
export function rulesName(rules: Rules): string | null {
  const same = (preset: Rules): boolean => (Object.keys(preset) as (keyof Rules)[])
    .every(k => k === 'kings' || k === 'design' || JSON.stringify(preset[k]) === JSON.stringify(rules[k]));
  return Object.keys(RULE_PRESETS).find(name => same(RULE_PRESETS[name])) ?? null;
}

/**
 * A link that holds a whole game, for a friend to open and answer on their device (no server): this
 * page, its `?rules=` preset, the kings, the design's share code (ticket 17), the start (the army, else the position) and the moves.
 */
export function gameUrl(page: { origin: string; pathname: string }, rules: string | null, kings: Rules['kings'],
  start: { army: string } | { fen: string }, lans: readonly string[], design?: string): string {
  const url = new URL(page.pathname, page.origin);
  if (rules) url.searchParams.set('rules', rules);
  const k = kingsParam(kings);
  if (k) url.searchParams.set('kings', k);
  if (design) url.searchParams.set('design', design);
  if ('army' in start) url.searchParams.set('army', start.army);
  else url.searchParams.set('fen', start.fen);
  url.searchParams.set('moves', lans.join('_')); // '_' needs no escaping in a URL
  return url.href;
}

/** This page's URL without a game link's parameters. */
export function gameLinkless(): string {
  const url = new URL(location.href);
  for (const k of ['army', 'fen', 'moves', 'design']) url.searchParams.delete(k);
  return url.href;
}

/** Copies `text`, then says on `button` (its label) for 2.5 s what happened: `done` only after the copy succeeds. */
export async function copyAndSay(button: HTMLElement, text: string, done: string): Promise<void> {
  const label = button.querySelector<HTMLElement>('.label') ?? button, idle = label.dataset.idle ??= label.textContent ?? '';
  label.textContent = await copyText(text) ? done : 'Could not copy';
  setTimeout(() => { label.textContent = idle; }, 2500);
}

/**
 * Copy (the moves), and `gameLink`: the link of the game on the board, which names the preset of the live
 * game's rules. The Share button (Send the game link) is parked (docs/PARKED.md); an old save of a link game
 * still sends its turn with `gameLink`. `blocked` stays for Share's return.
 */
export function connectLinks(c: { game(): Game; turnStart(): number; blocked(): boolean }) {
  $('copy').onclick = () => {
    const history = c.game().history, numbers = moveNumbers(history.map(h => h.pos.turn));
    const text = history.map((h, i) => (i === 0 || numbers[i] !== numbers[i - 1] ? `${numbers[i]}${h.pos.turn ? '…' : '.'} ${h.lan}` : h.lan)).join(' ');
    void copyAndSay($('copy'), text, 'Moves copied');
  };

  /** A link that holds this whole game, for a friend to open and answer on their device (no server). */
  function gameLink(lans = c.game().history.slice(0, c.turnStart()).map(h => h.lan)): string {
    const game = c.game();
    return gameUrl(location, rulesName(game.rules), game.rules.kings,
      game.backRank ? { army: game.backRank } : { fen: toFen(game.history[0]?.pos ?? game.pos) }, lans, game.rules.design?.code);
  }

  return { gameLink };
}
