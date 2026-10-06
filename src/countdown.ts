/**
 * Turn countdowns (owner, 2026-10-06): everything in a game that happens on a certain turn, with
 * the turns left until it does, for a small clock ring where that thing is on screen. Pure: the
 * position and the rules in, the list out; main.ts places each ring by its scope (docs/MATRIX.md D.1–D.2).
 */
import { BLACK, K, NAMES, RULES, USES_RULE, WHITE, colorOf, moveNumber, typeOf, type CardName, type Color, type PowerName, type Position, type Rules } from './rules/engine';
import { POWER_NAME } from './powers-ui';

/** Where a ring goes: over a piece on the board, on the item's button (or card), or by the game's turn line. */
export type Scope = 'piece' | 'item' | 'game';

/** A pending turn trigger, as a source reports it. */
export interface Trigger {
  scope: Scope;
  /** Whose turns count; null = both sides alike, counted on the side to move. */
  side: Color | null;
  /** scope 'piece': the piece's square. */
  square?: number;
  /** The power or card it is about. */
  item?: CardName;
  /** What happens, in plain words: "Haste usable", "Rook unshackled". */
  what: string;
  /** The shorter name a visible line uses: "Rage", "White's Rage". Default `what`. */
  name?: string;
  /** The side's own move it happens on (`Position.move`, the full-move number). */
  at: number;
  /** The move before the wait began: the ring's empty point. Default 0, before the game's first move, so a wait's first turn already shows a sliver. */
  since?: number;
}

export interface Countdown extends Trigger {
  /** The side's own turns, from its current or next one, that still come before the trigger (always ≥ 1). */
  turnsLeft: number;
  /** The whole wait in the side's turns: the full ring. */
  total: number;
  /** "Haste usable in 3 turns": the ring's accessible name. */
  label: string;
  /** "in 3 turns". */
  when: string;
  /** "Rage in 3 turns": the visible line by the turn line. */
  text: string;
}

/** Items the game screen shows: a king power has its button; card mode has no screen yet (lab). Set `card` when it does. */
export const SHOWN = { power: true, card: false };

/** "Ice Wall", "Sky Lift", "Rage B". */
export const itemName = (c: CardName): string => POWER_NAME[c as PowerName] ?? c.replace(/([a-z])([A-Z])/g, '$1 $2');
const SIDE = ['White', 'Black'];

/** Side `c`'s current move if it is to move, else its next one. */
const nextOwn = (pos: Position, c: Color): number => moveNumber(pos) + (c === WHITE && pos.turn === BLACK ? 1 : 0);

/** Side `c`'s items that can still be spent, each with whether the screen shows it. */
function held(pos: Position, r: Rules, c: Color): Map<CardName, boolean> {
  const out = new Map<CardName, boolean>(), used = pos.used?.[c] ?? 0;
  const p = r.kings[c]?.power, key = p && USES_RULE[p];
  if (p && key) {
    const n = r[key] as number;
    const spendable = !((p === 'March' || p === 'Leap') && n === 0); // 0 uses: always on
    // March and Leap have no button even when counted (main.ts refreshPowers): their ring goes by the turn line.
    if (spendable && (n === 0 || used < n)) out.set(p, SHOWN.power && p !== 'March' && p !== 'Leap');
  }
  const hand = r.hands[c], n = hand.length + (pos.drawn?.[c] ?? 0);
  for (let k = 0; k < n; k++) if (!(used >> k & 1)) out.set(k < hand.length ? hand[k] : r.piles[c][k - hand.length], SHOWN.card);
  return out;
}

/**
 * `Rules.fromMove`: a power or card a side holds, not usable before its own move N. On screen it is
 * the item's; with no place on screen it goes by the game's turn line, once for both sides when both hold it.
 */
function fromMoveTriggers(pos: Position, r: Rules): Trigger[] {
  const sides = [held(pos, r, WHITE), held(pos, r, BLACK)];
  return (Object.entries(r.fromMove) as [CardName, number][]).flatMap(([item, at]) => {
    const name = itemName(item), what = `${name} usable`;
    if (sides[0].get(item) === false && sides[1].get(item) === false) return [{ scope: 'game', side: null, item, what, name, at }];
    return ([WHITE, BLACK] as const).flatMap((c): Trigger[] => {
      const shown = sides[c].get(item);
      return shown === undefined ? [] : [shown ? { scope: 'item', side: c, item, what, at } : { scope: 'game', side: c, item, what: `${SIDE[c]}'s ${what}`, name: `${SIDE[c]}'s ${name}`, at }];
    });
  });
}

/**
 * Every source of turn triggers, one function per rule. A new rule plugs in with one line here: a
 * shackled piece returns `{ scope: 'piece', side, square, what: 'Archer unshackled', at }`, a
 * game-wide rule `{ scope: 'game', side: null, what: 'Captures allowed', at }`.
 */
export const SOURCES: readonly ((pos: Position, r: Rules) => Trigger[])[] = [fromMoveTriggers];

/**
 * `?demo=countdown` (main.ts): a stand-in shackle, since no rule shackles a piece yet. Any piece but
 * a king on a corner square is "unshackled" on its side's move 5.
 */
export const demoShackle = (pos: Position): Trigger[] => [0, 7, 56, 63].flatMap((square): Trigger[] => {
  const p = pos.board[square], t = typeOf(p);
  if (!p || t === K) return [];
  const name = NAMES[t];
  return [{ scope: 'piece', side: colorOf(p), square, what: `${name[0].toUpperCase()}${name.slice(1)} unshackled`, at: 5 }];
});

/** Every pending turn trigger of `pos` (side `side`'s and the game's, if given), with its turns left. Nothing at 0. */
export function countdowns(pos: Position, r: Rules = RULES, side?: Color, sources = SOURCES): Countdown[] {
  return sources.flatMap(f => f(pos, r)).flatMap(t => {
    if (side !== undefined && t.side !== null && t.side !== side) return [];
    const turnsLeft = t.at - (t.side === null ? moveNumber(pos) : nextOwn(pos, t.side));
    if (turnsLeft <= 0) return [];
    const when = `in ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}`;
    return [{ ...t, turnsLeft, total: Math.max(turnsLeft, t.at - (t.since ?? 0)), when, label: `${t.what} ${when}`, text: `${t.name ?? t.what} ${when}` }];
  });
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The clock ring: a thin circle that fills clockwise as the trigger nears, the turns left inside
 * (drawn by CSS from `data-n`, so it never joins a button's text). Style: `.cd` in style.css.
 * `hidden`: a screen reader skips it, for a ring beside text that already says the count.
 */
export function ring(cd: Pick<Countdown, 'turnsLeft' | 'total' | 'label'>, { style = '', hidden = false } = {}): string {
  const done = Math.round(100 * (1 - cd.turnsLeft / cd.total));
  return `<span class="cd" ${hidden ? 'aria-hidden="true"' : 'role="img"'} aria-label="${esc(cd.label)}"${style ? ` style="${style}"` : ''}>`
    + `<svg viewBox="0 0 20 20" aria-hidden="true"><circle class="cd-track" cx="10" cy="10" r="8.5"/>`
    + (done > 0 ? `<circle class="cd-fill" cx="10" cy="10" r="8.5" pathLength="100" stroke-dasharray="${done} 100"/>` : '')
    + `</svg><b data-n="${cd.turnsLeft}"></b></span>`;
}
