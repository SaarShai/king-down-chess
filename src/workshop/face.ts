/**
 * The card face (docs/specs/workshop-proving-ground, ticket 08; pieceCardFront in mockup B,
 * docs/research/rules-ui-2026-10-10/mockups/binder-and-table.html:1252-1262): what a player shares, and what a design
 * link opens first. The icon and the name, the figure, the 7 × 7 reach diagram (its moves and takes in words for a screen
 * reader), up to 3 seals with their sentences, the worth and the band word. No control. `art` is the figure's image.
 * Pure, so the tests run it in Node.
 */
import { pieceIcon } from '../piece-icons';
import { bandOf, type Verdict } from './judge';
import { diagram, seal, tagYours } from './marks';
import { canonical, type PieceDesign } from './model';
import { describe, esc, pawns, ruleParts } from './text';
import { BODY } from './vocab';

/** The body icon, or a disc for a token. */
const icon = (d: PieceDesign): string => (d.look.body === 'token' ? '<span class="ic"></span>' : pieceIcon(BODY[d.look.body].type));

export function faceHtml(d: PieceDesign, v: Verdict, art: string): string {
  const rules = canonical(d).rules, name = esc(d.name), t = describe(d);
  const say = (r: (typeof rules)[number]): string => ruleParts(r).map(p => (typeof p === 'string' ? esc(p) : `<b>${esc(p.text)}</b>`)).join('');
  return `<article class="pg-face" aria-label="${name}, a Workshop piece"><div class="ct">${icon(d)}<b>${name}</b></div>`
    + `<div class="cart"><img src="${esc(art)}" alt=""></div><div class="cdg">${diagram(d, { s: 34 })}`
    + `<p class="sr-only">${esc(`Moves ${t.moves} ${t.takes.startsWith('Shoots') ? t.takes : `Takes ${t.takes}`}`)}</p></div>`
    + (rules.length ? `<ul class="cseals">${rules.map(r => `<li>${seal(r.does.a, 34)}<span>${say(r)}</span></li>`).join('')}</ul>` : '<p class="cseals none">No rules. Only its moves.</p>')
    + `<p class="cworth">About ${pawns(v.worth.point)} · <b>${esc(bandOf(v))}</b></p></article>`;
}

/** The small face of the See all grid (ticket 15; pieceThumb and copyThumb in mockup B, binder-and-table.html:1001-1016): the
 *  icon and the name, the figure, the reach diagram with its seals, the band word, and the Yours tag on a design. Phrasing
 *  content only, so ground.ts can put it in a button. */
export function thumbHtml(d: PieceDesign, v: Verdict, art: string, yours: boolean): string {
  const rules = canonical(d).rules;
  return `<span class="t">${icon(d)}<b>${esc(d.name)}</b></span><span class="art"><img src="${esc(art)}" alt=""></span>`
    + `<span class="dg">${diagram(d, { s: 14 })}${rules.length ? `<span class="sl">${rules.map(r => seal(r.does.a, 22)).join('')}</span>` : ''}</span>`
    + `<span class="band">${esc(bandOf(v))}</span>${yours ? tagYours() : ''}`;
}
