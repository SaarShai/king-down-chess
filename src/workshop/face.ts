/**
 * The card face (docs/specs/workshop-proving-ground, ticket 08; pieceCardFront in mockup B,
 * docs/research/rules-ui-2026-10-10/mockups/binder-and-table.html:1252-1262): what a player shares, and what a design
 * link opens first. The icon and the name, the figure, the 7 × 7 reach diagram, up to 3 seals with their sentences, the
 * worth and the band word. No control. `art` is the figure's image. Pure, so the tests run it in Node.
 */
import { pieceIcon } from '../piece-icons';
import { bandOf, type Verdict } from './judge';
import { diagram, seal } from './marks';
import { canonical, type PieceDesign } from './model';
import { esc, pawns, ruleParts } from './text';
import { BODY } from './vocab';

export function faceHtml(d: PieceDesign, v: Verdict, art: string): string {
  const rules = canonical(d).rules, name = esc(d.name), body = d.look.body;
  const say = (r: (typeof rules)[number]): string => ruleParts(r).map(p => (typeof p === 'string' ? esc(p) : `<b>${esc(p.text)}</b>`)).join('');
  return `<article class="pg-face" aria-label="${name}, a Workshop piece"><div class="ct">${body === 'token' ? '<span class="ic"></span>' : pieceIcon(BODY[body].type)}<b>${name}</b></div>`
    + `<div class="cart"><img src="${esc(art)}" alt=""></div><div class="cdg">${diagram(d, { s: 34 })}</div>`
    + (rules.length ? `<ul class="cseals">${rules.map(r => `<li>${seal(r.does.a, 34)}<span>${say(r)}</span></li>`).join('')}</ul>` : '<p class="cseals none">No rules. Only its moves.</p>')
    + `<p class="cworth">About ${pawns(v.worth.point)} · <b>${esc(bandOf(v))}</b></p></article>`;
}
