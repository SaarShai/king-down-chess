/**
 * The piece card in its read-only form (web redesign ticket 22): the card of a design from a link and
 * of the Share sheet. It is the editor's card (the figure, the name, the move and take grids, the worth)
 * with no control. Pure, so the tests run it in Node.
 */
import { figureHtml, modelHtml } from './art';
import { bandOf, type Verdict } from './judge';
import { lookOf, lookWords } from './look';
import { DIR, DIRS, empty, type Dir, type PieceDesign } from './model';
import { describe, esc, pawns, ruleText } from './text';

/** The ray from the piece through (x, y), or null when (x, y) is on none of the 8. */
const rayOf = (x: number, y: number): Dir | null =>
  x && y && Math.abs(x) !== Math.abs(y) ? null : DIRS.find(d => DIR[d][0] === Math.sign(x) && DIR[d][1] === Math.sign(y)) ?? null;

/** The mark classes of the square (x, y) on the move grid or the take grid ('shoot' is the take grid of a shooter):
 * the light or dark square, the move, take or shot mark, and the slide line with its arrow on the edge. */
export function cellMarks(d: Pick<PieceDesign, 'squares' | 'lines'>, grid: 'move' | 'take' | 'shoot', x: number, y: number): string {
  const s = d.squares.find(s => s.x === x && s.y === y), ray = rayOf(x, y), line = !!ray && d.lines.includes(ray);
  const active = grid === 'move' ? s && ['move', 'both', 'moveShoot'].includes(s.mark) : s && ['take', 'both', 'shoot', 'moveShoot'].includes(s.mark);
  const shot = s && ['shoot', 'moveShoot'].includes(s.mark);
  return `${(x + y) & 1 ? ' dk' : ''}${active ? grid === 'move' ? ' c-move' : shot ? ' c-shoot' : ' c-take' : ''}${line ? ` ln ln-${ray}${Math.max(Math.abs(x), Math.abs(y)) === 3 ? ' ln-end' : ''}` : ''}`;
}

/** The words of the card for a screen reader: the look, the piece in words, the worth and its band. */
export const summaryOf = (d: PieceDesign, v: Verdict): string =>
  `${lookWords(lookOf(d))} ${describe(d).summary} About ${pawns(v.worth.point)}, ${bandOf(v).toLowerCase()}.`;

/** One read-only grid: 7 by 7, the piece in the centre, forward up. */
function gridHtml(d: PieceDesign, grid: 'move' | 'take', figure: string): string {
  let cells = '';
  for (let y = 3; y >= -3; y--) for (let x = -3; x <= 3; x++) {
    cells += x || y ? `<i class="ws-grid-cell${cellMarks(d, grid, x, y)}" data-x="${x}" data-y="${y}"><i class="ws-arrow"></i></i>`
      : `<i class="ws-grid-cell ws-grid-me">${figure}</i>`;
  }
  return `<div class="ws-grid" data-grid="${grid}">${cells}</div>`;
}

/** The editor's piece card. Its read-only form adds the move and take grids, with no controls. */
export function cardHtml(d: PieceDesign, v: Verdict, editor = false): string {
  const l = lookOf(d), none = empty(d), name = esc(d.name), words = describe(d);
  const me = figureHtml(l, 'ws-me-fig');
  const worth = `<p class="ws-worth">${none ? editor ? 'Add moves and takes on the boards.' : 'It has no moves and no takes.' : `Estimated worth · ${pawns(v.worth.point)}`}</p>`;
  const band = `<div class="ws-bottom"><span class="ws-learn">${none ? '' : bandOf(v)}</span></div>`;
  return `<article class="ws-piece-card${editor ? '' : ' ws-read'}" aria-label="${editor ? 'Your piece' : `${name}, a Workshop piece`}"><div class="ws-card-border">`
    + `<div class="ws-portrait"><div class="ws-model-box" aria-hidden="true">${modelHtml(l)}</div>${editor ? '<div class="ws-gauge-box"></div>' : ''}</div>`
    + `<div class="ws-name-row">${editor ? '' : `<span class="ws-name-t">${name}</span>`}</div>`
    + (editor ? worth + band + '<div class="ws-appearance" hidden></div>'
      : `<div class="ws-reach"><p class="ws-fwd" aria-hidden="true">Forward ↑</p><div class="ws-grids">`
        + `<div><p class="ws-grid-h">Moves</p><div aria-hidden="true">${gridHtml(d, 'move', me)}</div><p class="ws-caption">${esc(`Moves ${words.moves}`)}</p></div>`
        + `<div><p class="ws-grid-h">Takes</p><div aria-hidden="true">${gridHtml(d, 'take', me)}</div><p class="ws-caption">${esc(words.takes.startsWith('Shoots') ? words.takes : `Takes ${words.takes}`)}</p></div></div></div>`
        + (d.rules.length ? `<ul class="ws-read-rules">${d.rules.map(r => `<li>${esc(ruleText(r))}</li>`).join('')}</ul>` : '') + band + worth)
    + `<p class="sr-only ws-summary">${esc(summaryOf(d, v))}</p>${editor ? '<p class="sr-only ws-live" role="status"></p>' : ''}</div></article>`;
}
