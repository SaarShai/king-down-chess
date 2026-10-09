import type { Game } from './game';
import { A, NAMES, TAG_POWER, sqName, typeOf, type Color, type Move, type Position } from './rules/engine';

export interface PreviouslyTurn {
  from: number;
  to: number;
  line: string;
  detail: string;
  before: string | null;
}

/** The last friend turn uses the side before each move, not ply parity. */
export function previouslyTurn(history: Readonly<Game['history']>, side: Color): PreviouslyTurn | null {
  const last = history.at(-1);
  if (!last || last.pos.turn === side) return null;
  let from = history.length - 1;
  while (from > 0 && history[from - 1].pos.turn !== side) from--;
  let beforeFrom = from;
  while (beforeFrom > 0 && history[beforeFrom - 1].pos.turn === side) beforeFrom--;
  const friend = history.slice(from).reverse(), lastAct = friend.find(h => !h.move.pass)!;
  const main = friend.find(h => h.move.captures.length) ?? lastAct;
  const { pos, move } = main, name = NAMES[typeOf(pos.board[move.from])];
  const victim = (sq: number) => NAMES[typeOf(pos.board[sq])];
  const summary = move.captures.length
    ? `their ${name} ${typeOf(pos.board[move.from]) === A && move.from === move.to ? 'shot' : 'took'} ${move.captures.length > 1 ? `${move.captures.length} pieces` : `your ${victim(move.captures[0])}`}.`
    : move.shove ? `their ${name} shoved your ${victim(move.shove.from)}.`
    : move.swap ? `their ${name} swapped places.`
    : move.power === 'freeze' ? `they froze your ${victim(move.to)}.`
    : move.power === 'ward' ? `they used Ice Wall.`
    : `their ${name} moved to ${sqName(move.to)}.`;
  const words = (start: number, end: number): string => history.slice(start, end)
    .map((ply, i, plies) => {
      const text = compactPly(ply.pos, ply.move, i > 0 && plies[i - 1].move.to === ply.move.from);
      return i === 0 ? text[0].toUpperCase() + text.slice(1) : text[0].toLowerCase() + text.slice(1);
    }).join(', then ') + '.';
  return {
    from, to: history.length,
    line: summary,
    detail: words(from, history.length),
    before: beforeFrom < from ? words(beforeFrom, from) : null,
  };
}

/** Each ply names the act and squares, without a rule or repeated mover. */
function compactPly(pos: Position, m: Move, continued: boolean): string {
  const name = NAMES[typeOf(pos.board[m.from])], subject = continued ? '' : `${name} ${sqName(m.from)} `;
  let words = m.pass ? 'end turn'
    : m.power === 'freeze' ? `Freeze on ${sqName(m.to)}`
    : m.power === 'ward' ? `Ice Wall on ${sqName(m.to)}`
    : m.power === 'sacrifice' ? `Sacrifice on ${sqName(m.from)} for ${NAMES[m.promo!]}`
    : m.swap ? `${subject}swaps with ${sqName(m.to)}`
    : m.shove ? `${subject}shoves ${sqName(m.shove.from)} to ${sqName(m.shove.to)}`
    : m.from === m.to && m.captures.length ? `${subject}shoots ${m.captures.map(sqName).join(' and ')}`
    : `${subject}${m.captures.length ? 'takes' : 'to'} ${sqName(m.to)}${m.promo ? `, becomes ${NAMES[m.promo]}` : ''}`;
  if (m.power && !['freeze', 'ward', 'sacrifice'].includes(m.power)) words += ` with ${TAG_POWER[m.power]}`;
  return words;
}

/** Keep `played` for this open link; a later render does not play it again. */
export function previouslyPlayback(turn: PreviouslyTurn | null, options: {
  played: boolean;
  motion: boolean;
  reducedMotion: boolean;
  complete: boolean;
}): { play: boolean; seeAgain: boolean; played: boolean } {
  const seeAgain = turn !== null && options.complete && options.motion && !options.reducedMotion;
  return { play: seeAgain && !options.played, seeAgain, played: true };
}
