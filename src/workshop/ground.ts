/**
 * The Workshop (docs/WORKSHOP.md): the Proving Ground, view A of docs/specs/workshop-proving-ground.
 * The open piece stands on its example board with its marks; the plinth shows its name, its figure and its rules;
 * the ledge opens the pool pieces and the designs on the shelf. The board is the editor (ticket 02): the brushes
 * paint squares, the nubs switch lines, and the first edit on a pool piece makes the player's private copy. In look mode a
 * tap on a square opens its Why tag (ticket 05). The board is also the test (Try with, ticket 06): the player lifts and
 * places the piece, adds friends and enemies, sees threats, and plays a move with the engine's makeMove. The Kings tab and
 * the tray's King socket seat a king and arm one of his powers on an unchanged pool piece (ticket 13, powers.ts). The Cards
 * tab (LAB) shows the test deck, and the tray's card slot lays a LAB card on an unchanged pool piece (ticket 14). Mockup:
 * docs/research/rules-ui-2026-10-10/mockups/proving-ground.html (its line numbers in the comments).
 * Loaded on demand (main.ts `import()`).
 */
import './ground.css';
import { BLACK, K, KINGS, NAMES as PIECE, P, T, USES_RULE, WHITE, colorOf, file, isMarkTag, makeMove, parseSq, piece, rank, sq, sqName, typeOf, type CardName, type KingName, type Move, type PieceType, type Position, type PowerName } from '../rules/engine';
import { POWER_NAME, cardText, coinState, coinWords, powerText } from '../powers-ui';
import { coinRow } from '../ui/coin';
import { pieceIcon } from '../piece-icons';
import { pieceArt } from '../ui/guide';
import { FIGURES, FIGURE_TAGS, figureUrl, selectedFigure, suggestedFigures, type Figure } from './figures';
import { faceHtml } from './face';
import { autoBody, bandOf, judge } from './judge';
import { NAMES, chip, countRing, diagram, drawString, effect, ensureDefs, impression, knot, mirrorIcon, nub, pill, plaque, seal, sigil, tagYours, tile, viewBox, whySum } from './marks';
import {
  BLANK, DIR, DIRS, FULL, MAX_RULES, PRESETS, brushMark, canonical, designCode, empty, fromPreset, likeAlways, limit, lineOrbit, orbit, parseDesign, presetOf, validName,
  type Ability, type Body, type Brush, type Dir, type LikeAs, type PaintOn, type PieceDesign, type Preset, type Rule, type When,
} from './model';
import { BODY_TYPE, START, holds, movesOf, step, type TryState } from './moves';
import { autoName, copyName, letterFollows, letterOf, saveName } from './names';
import {
  actOf, boardOf, clear, diffOf, examplesOf, piecesOf, sceneOf, stir, tapOf, threatsOf, wakeSquare, type Act, type Kind, type Scene, type ScenePiece,
} from './scene';
import { MAX, deleteDesign, loadShelf, saveDesign, type SaveResult } from './store';
import { LIKE_ADDED, LIKE_CLASH, brief, cap, designText, esc, lineParts, lineWords, pawns, ruleText, whenLabel } from './text';
import { BLOCKS, BODY, GROUPS, blockOf, whenChoices, whenWords, type Part } from './vocab';
import { traceOf, whyWords } from './why';
import { cardMarks, cardRules, enginePos, kingRules, playCard, playPower, powerLayer, powerMarks, seated } from './powers';
// @ts-expect-error The approved gait curves are shared browser JavaScript, without declarations.
import { GAITS, GAIT_OF } from '../../docs/2d-first-pieces/board/gait.mjs';

/** What the board and the plinth show: a pool piece, a design on the shelf (or the player's new copy), a new piece before its
 *  first change (key `new`), or a design from a link. */
interface Item { key: string; d: PieceDesign; yours: boolean }
const pool = (key: string): Item => { const p = PRESETS.find(x => x.key === key) ?? PRESETS[0]; return { key: `piece:${p.key}`, d: { ...fromPreset(p), name: p.name, letter: letterOf(p.name) }, yours: false }; };
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const FILES = 'abcdefgh';
const BRUSHES: [Kind & Brush, string][] = [['move', 'Move'], ['take', 'Take'], ['both', 'Both']];
/** The key row's short words (proving-ground.html:1187). */
const SHORT: Record<string, string> = {
  asleep: 'Asleep', cond: 'Sometimes', blocked: 'Refused', shot: 'Shot', moveshot: 'Move or shot', line: 'Line', arch: 'Hops', removed: 'Removed', push: 'Push', swap: 'Swap',
  threat: 'Threat', tstop: 'Stopped', becomes: 'Becomes', power: 'Power', frost: 'Frozen', rune: 'Card pick',
};
/** The six kings in the ledge's order (KING_ORDER, proving-ground.html:618), each with his art name. */
const KING_LIST = (Object.keys(KINGS) as KingName[]).sort();
const kingArt = (k: KingName): string => `${import.meta.env.BASE_URL}ui/kings/${k.toLowerCase()}.webp`;
/** The king who has power `p`. */
const kingOf = (p: PowerName): KingName => KING_LIST.find(k => KINGS[k].includes(p))!;
/** The LAB deck (CARDS and VARIANTS, proving-ground.html:643-679): the cards with art make the fan, the rest wait in a
 *  stack; a B form shows inside its parent card. The tray's slot lays six of them (decision 30). */
const DECK: readonly CardName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'Mimic', 'Vault', 'Curse', 'SkyLift', 'Salvation',
  'Rescue', 'Firewall', 'EarthQuake', 'Burn', 'FireStarter', 'Control', 'Growth', 'Rally', 'Spawn2', 'SpawnK', 'MorphP', 'MirrorB'];
const SECOND: Partial<Record<CardName, CardName>> = { Firewall: 'FirewallB', EarthQuake: 'EarthQuakeB', Growth: 'GrowthB', SpawnK: 'SpawnK2' };
const ART: readonly CardName[] = ['Freeze', 'IceWall', 'Sacrifice', 'March', 'Leap', 'Mimic', 'Vault', 'SkyLift', 'Salvation', 'Rescue'];
const LAY: readonly CardName[] = ['Freeze', 'IceWall', 'Leap', 'March', 'Mimic', 'Vault'];
const cardArt = (c: CardName): string => `${import.meta.env.BASE_URL}ui/cards/${ART.includes(c) ? c.toLowerCase() : 'back'}.webp`;
/** "Ice Wall", "Sky Lift", "Spawn K2". */
const cardName = (c: CardName): string => (c in USES_RULE ? POWER_NAME[c as PowerName] : c.replace(/([a-z])([A-Z0-9])/g, '$1 $2'));
/** A card's sentence in the web's words (powerText's webWords). */
const cardWords = (c: CardName): string => cap(cardText(c, cardRules(c)).replace(/captur(ed|es|e)/g, (_, e: string) => ({ ed: 'taken', es: 'takes', e: 'take' })[e]!));
const ROMAN = ['I', 'II', 'III'];
/** The Mirror tool's words for each "Paint on" (renderTools, proving-ground.html:1287). */
const MIRROR: Record<PaintOn, string> = { lr: 'Mirror', all: 'All 8', one: 'One' };
/** The words of a move's button in the Why tag (proving-ground.html:1351): a take moves there, a shot takes from there. */
const ACT: Record<Act, string> = { move: 'Move here', take: 'Move here', shot: 'Take from here', push: 'Push', swap: 'Swap' };
/** Try with: the board, the piece's square (where it was, once a move removed it: `gone`), the move state, a chain in
 *  progress (its takes so far and the longer moves of its turn), the piece that a "becomes" made it, and the game: the uses
 *  of each power, the Freeze marks, and the laid card played (1). */
interface Try { board: Uint8Array; from: number; st: TryState; gone: boolean; chain: { caps: number[]; more: Move[] } | null; became: PieceType | 0; game: { uses?: Partial<Record<PowerName, number>>; marks?: Position['marks']; played?: number } }
const MEDAL = '<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><path d="M16 2l8 14 8-14" fill="none" stroke="#842c21" stroke-width="5"/><circle cx="24" cy="30" r="15" fill="#e9c071" stroke="#7a5712" stroke-width="2"/>'
  + '<circle cx="24" cy="30" r="10" fill="none" stroke="#7a5712" stroke-width="1.2"/><path d="M24 23l2 4.5 5 .5-3.8 3.3 1.1 4.9L24 33.7l-4.3 2.5 1.1-4.9L17 28l5-.5z" fill="#7a5712"/></svg>';
/** The NEW tile: a dashed figure outline with a quill (GHOST_FIG, proving-ground.html:1439). */
const GHOST = '<svg viewBox="0 0 44 62" aria-hidden="true"><path d="M22 4a7 7 0 1 1-.01 0zM13 24c2-4 16-4 18 0l2 14h-4l1 10h6l2 10H8l2-10h6l1-10h-4z" fill="rgba(255,255,255,.25)" stroke="var(--stone-500)" stroke-width="1.5" stroke-dasharray="4 3" stroke-linejoin="round"/>'
  + '<g transform="translate(24 30) scale(.8)"><circle cx="12" cy="12" r="12" fill="var(--vellum)" stroke="var(--gold-ink)" stroke-width="1.5"/><path d="M18 5C12 5.5 8 9.5 7 18M7 18l2.4-.9M9.8 12.5h4" fill="none" stroke="var(--gold-ink)" stroke-width="2" stroke-linecap="round"/></g></svg>';
/** The words of a name that validName refuses. */
const BAD_NAME = "A name uses letters, digits, spaces, - and ', up to 18.";

/** The figure of a design: the pool art of its body, unless it has its own figure or is a token. */
const figureOf = (d: PieceDesign): string =>
  (!d.look.figure && d.look.body !== 'token' && pieceArt(BODY_TYPE[d.look.body], !!d.look.army)) || figureUrl(selectedFigure(d).id, d.look.army);
const link = (d: PieceDesign): string => `${location.origin}${location.pathname}?design=${designCode(d)}`;
/** Brush mode paints on d4: the reach ends 3 squares out (proving-ground.html:1763). */
const out = (q: string): boolean => { const s = parseSq(q); return Math.max(Math.abs(file(s) - 3), Math.abs(rank(s) - 3)) > 3; };
/** A rule of a design by its block: a design holds each block once (limit, model.ts). */
const ruleIn = (d: PieceDesign, a: Ability['a']): Rule | undefined => d.rules.find(r => r.does.a === a);
/** Motion (ticket 10, decision 27): none under reduced motion or Animations Off; Fast halves each duration. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionless = (): boolean => reduced.matches || document.documentElement.dataset.pace === 'off';
const pace = (): number => (document.documentElement.dataset.pace === 'fast' ? 0.5 : 1);
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)', SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)';
/** The end of a puff (proving-ground.html:420). */
const PUFF: Keyframe = { opacity: 0, transform: 'translateY(-10px) scale(1.6)' };
/** A gait of docs/2d-first-pieces/board/gait.mjs: the pose at progress u, which ends at rest. */
interface Gait { at(u: number, squares: number): { travel: number; lift: number; sx: number; sy: number; tilt: number } }
/** The gait of a design's body: its own, the pawn's for the token, else a hop. */
const gaitOf = (d: PieceDesign): Gait => GAITS[GAIT_OF[d.look.body === 'token' ? 'pawn' : BODY[d.look.body].name] ?? 'hop'];
/** One choice of an open row (a pill's value or a When): its words, whether the rule has it now, what it does to a design,
 *  and why the design cannot take it. `w` is the When; `like`, the piece that "Always" adds to Moves. */
interface Choice { v: string; words: string; on: boolean; off: string | null; apply: (d: PieceDesign) => void; w?: When; like?: LikeAs }

export function groundDialog(): { open(): void; openDesign(code: string): void } {
  const dlg = document.createElement('dialog');
  dlg.id = 'workshop';
  dlg.className = 'pg';
  dlg.setAttribute('aria-labelledby', 'pg-h');
  const chev = '<svg class="pg-chev" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 10l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 13l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/></svg>';
  const rows = Array.from({ length: 8 }, (_, i) => `<div role="row">${[...FILES].map(f => `<button type="button" class="sq" role="gridcell" data-sq="${f}${8 - i}" tabindex="-1"></button>`).join('')}</div>`).join('');
  dlg.innerHTML = `<header class="pg-top"><button type="button" class="pg-menu" aria-label="Menu"><span aria-hidden="true">‹</span> <span class="pg-word">Menu</span></button>`
    + '<button type="button" class="pg-pieces" data-act="pieces" aria-expanded="false" aria-controls="pg-ledge">Pieces</button>'
    + '<h2 id="pg-h" class="pg-title" tabindex="-1"><i></i>Workshop<i class="r"></i></h2><div class="pg-acts"></div><div class="pg-morepop" id="pg-morepop" hidden></div></header>'
    + '<div class="pg-main"><section class="pg-plinth" aria-label="The open piece"></section>'
    + `<section class="pg-boardcol" aria-label="Try board"><div class="pg-rim"><div class="pg-files" aria-hidden="true">${[...FILES].map(f => `<span>${f}</span>`).join('')}</div>`
    + `<div class="pg-ranks" aria-hidden="true">${[8, 7, 6, 5, 4, 3, 2, 1].map(r => `<span>${r}</span>`).join('')}</div>${chev}<span class="pg-notch" hidden></span><span class="pg-plaque" hidden>${plaque()}</span>`
    + '<div class="pg-field"><svg class="pg-board" aria-hidden="true"></svg><div class="pg-coords" aria-hidden="true">'
    + [...FILES].map((f, i) => `<span style="left:calc(${(i + 1) * 12.5}% - 9px);bottom:3px">${f}</span>`).join('')
    + [8, 7, 6, 5, 4, 3, 2, 1].map((r, i) => `<span style="left:3px;top:calc(${i * 12.5}% + 3px)">${r}</span>`).join('')
    + `</div><div class="pg-hits" role="grid" aria-label="Board">${rows}</div><div class="pg-paint"></div></div></div></section>`
    + '<section class="pg-right" aria-label="Key"><div class="pg-brushes"></div><div class="pg-tools" hidden></div><p class="pg-hint"></p><div class="pg-keyrow" aria-label="Also on the board"></div><div class="pg-why" aria-live="polite" hidden></div>'
    + '<div class="pg-tray" role="group" aria-labelledby="pg-tray-h" hidden></div></section>'
    + '<aside class="pg-shelf" aria-labelledby="pg-shelf-h" hidden></aside></div>'
    + '<footer class="pg-ledge" id="pg-ledge"><div class="ltabs" role="tablist" aria-label="Library"></div>'
    + '<div class="lrow" id="pg-row" role="tabpanel" aria-labelledby="pg-tab-pieces"><div class="inner lip"></div></div><div class="pg-boardtab" id="pg-boardtab" role="tabpanel" aria-labelledby="pg-tab-board" hidden></div></footer>'
    + '<div class="pg-alert" role="alert" hidden></div><p class="pg-toast" role="status" aria-live="polite"></p><div class="pg-reachpop" aria-hidden="true"></div>';
  document.body.append(dlg);
  const q = <T extends Element = HTMLElement>(s: string): T => dlg.querySelector(s) as T;
  const plinthEl = q('.pg-plinth'), fieldEl = q('.pg-field'), boardEl = q<SVGSVGElement>('.pg-board'), hitsEl = q('.pg-hits'), paintEl = q('.pg-paint');
  const actsEl = q('.pg-acts'), moreEl = q('.pg-morepop'), brushesEl = q('.pg-brushes'), toolsEl = q('.pg-tools'), hintEl = q('.pg-hint'), keyEl = q('.pg-keyrow');
  const rowEl = q('.lrow'), slotsEl = q('.lrow .inner'), alertEl = q('.pg-alert'), toastEl = q('.pg-toast'), shelfEl = q('.pg-shelf'), whyEl = q('.pg-why'), notchEl = q('.pg-notch');
  const trayEl = q('.pg-tray'), tabsEl = q('.ltabs'), boardTabEl = q('.pg-boardtab'), reachEl = q('.pg-reachpop'), ledgeEl = q('.pg-ledge');
  /** The narrow layout (ground.css): the phone form of the mockup. Short landscape (a phone held sideways) keeps the phone
   *  form on its own grid: the tray in the column, the ledge a sheet from Pieces, the Why tag and the shelf side sheets. */
  const sideways = '(orientation: landscape) and (max-height: 500px)', narrow = matchMedia(`(max-width: 999px), ${sideways}`), short = matchMedia(sideways);
  /** The phone held upright: the tray in the ledge's Board tab. */
  const upright = (): boolean => narrow.matches && !short.matches;

  let cur = pool('pawn'), shelf: PieceDesign[] = [], sc: Scene, board: Uint8Array = new Uint8Array(64), from = 0, st = START, kbd = 'd4', drawnAt = 0;
  /** Brush mode while a brush or tool is armed (proving-ground.html:1742); "Paint on" (the Mirror tool). */
  let brush: Brush | null = null, mirror: PaintOn = 'all';
  /** Undo steps of the open item, each with its scope; the design the last save refused, and why. */
  let undos: { item: Item; label: string }[] = [], unsaved: { id: string; why: Exclude<SaveResult, 'saved'> } | null = null;
  /** The open popovers. */
  let weighOpen = false, moreOpen = false, toolsOpen = false;
  /** The rules (ticket 03): the open row of choices (rule `a`'s pill, or its When, with "More choices" open or not), the
   *  design under a choice that has the pointer or the focus, the Rules shelf and its chosen seal, the phone's rule card. */
  let row: { a: Ability['a']; when: boolean; more: boolean } | null = null, peek: PieceDesign | null = null;
  let shelfOpen = false, pick: Ability['a'] | null = null, card: Ability['a'] | null = null, added = 0;
  /** Isolate (proving-ground.html:1141, :1632-1645): the rule that a tap keeps, the rule under the pointer or the keyboard focus, and the knot that a tap keeps. */
  let focus: number | null = null, hover: number | null = null, knotAt: number | null = null;
  /** The square of the open Why tag, and the square under the pointer and the one with the keyboard focus that have hover-only parts (spec decision 37). */
  let why: string | null = null, near: string | null = null, keyed: string | null = null;
  /** Try with (ticket 06): the board now and the boards before each move (Take back); the lifted piece; the armed token;
   *  the eye; the "becomes" choice; the phone's ledge tab; the items opened, and whether the player tapped a square or
   *  changed a design (from then on the tray and the plaque show, proving-ground.html:1179, :1372). */
  let pos: Try = { board, from, st, gone: false, chain: null, became: 0, game: {} }, backs: Try[] = [];
  let lifted = false, token: 'friend' | 'enemy' | null = null, threats = false, promo: Move[] | null = null, tab: 'pieces' | 'kings' | 'cards' | 'board' = 'pieces';
  /** The kings (ticket 13): the king open on the plinth (the Kings tab), the seated king and his armed power (one at a
   *  time), and the open SEAT A KING picker. The uses spent and the Freeze marks are in the Try state (`pos.game`). */
  let kingOpen: KingName | null = null, king: KingName | null = null, armed: PowerName | null = null, seating = false;
  /** The LAB cards (ticket 14): the card open on the plinth (the Cards tab), the card laid in the tray's slot, the open LAY A
   *  LAB CARD picker, and the Cards tab's stack spread out. One card or one power at a time, as card mode plays (setRules). */
  let labOpen: CardName | null = null, laid: CardName | null = null, laying = false, spread = false;
  /** Short landscape: the ledge's sheet is open. */
  let ledgeOpen = false;
  let opened = 0, tapped = false, edited = false;

  let toastTimer = 0;
  function toast(text: string, icon?: 'lock' | 'lockOpen'): void {
    toastEl.innerHTML = `${icon ? sigil(icon, 16) : ''}<span>${esc(text)}</span>`;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('on'), 3600);
  }

  /* ---- motion (ticket 10; proving-ground.html:57-108, :1520-1548, :1700-1725, :1796-1802): each ends at its still pose by 600 ms ---- */

  /** Plays `frames` on `el`, one motion at a time on it. It fills backwards only, so it ends at the still style; a `temp` element goes with its motion. */
  function run(el: Element | null, frames: Keyframe[], ms: number, easing = 'linear', temp = false): void {
    if (!el) return;
    if (motionless() || !el.getClientRects().length) return void (temp && el.remove());
    for (const a of el.getAnimations()) a.cancel();
    const a = el.animate(frames, { duration: ms * pace(), easing, fill: 'backwards' });
    if (temp) a.onfinish = a.oncancel = () => el.remove();
  }
  /** The next action, a close and a change of the motion setting stop each running motion at its still pose. A transition
   *  (a button's press) is not one of the motions: it goes on. */
  const stop = (): void => { for (const a of dlg.getAnimations({ subtree: true })) if (!(a instanceof CSSTransition)) a.cancel(); };
  dlg.addEventListener('pointerdown', stop, true);
  dlg.addEventListener('keydown', stop, true);
  dlg.addEventListener('close', stop);
  reduced.addEventListener('change', stop);
  new MutationObserver(stop).observe(document.documentElement, { attributes: true, attributeFilter: ['data-pace'] });
  /** The box of a figure on square `s` (figRectIn, proving-ground.html:1520). */
  const figBox = (s: number): DOMRect => {
    const r = boardEl.getBoundingClientRect(), w = r.width / 8;
    return new DOMRect(r.x + (file(s) + 0.05) * w, r.y + (7 - rank(s) + 0.025) * w, 0.9 * w, 0.9 * w);
  };
  /** A figure `src` over the dialog in box `b`, for one motion. */
  const overlay = (src: string, b: DOMRect): HTMLImageElement => {
    const img = document.createElement('img');
    img.className = 'pg-fly';
    img.src = src;
    img.alt = '';
    Object.assign(img.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.width}px`, height: `${b.height}px` });
    dlg.append(img);
    return img;
  };
  /** A figure flies from box `a` to box `b` in 320 ms (flyEl, :1524): by gait `g`, else straight; `gone` ends it in a puff. */
  function fly(src: string, a: DOMRect, b: DOMRect, g?: Gait, gone = false): void {
    const k = a.height / b.height, dx = a.x + a.width / 2 - b.x - b.width / 2, dy = a.bottom - b.bottom, end = gone ? 320 / 520 : 1;
    const at = (t: number, p = { lift: 0, sx: 1, sy: 1, tilt: 0 }, offset?: number): Keyframe => ({ offset, opacity: 1,
      transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t) - p.lift}px) scale(${(k + (1 - k) * t) * p.sx}, ${(k + (1 - k) * t) * p.sy}) rotate(${p.tilt}rad)` });
    const frames = g ? Array.from({ length: 25 }, (_, i) => { const p = g.at(i / 24, 1); return at(p.travel, p, (i / 24) * end); }) : [{ ...at(0), opacity: 0.9, easing: EASE }, at(1, undefined, end)];
    if (gone) frames.push({ ...PUFF, easing: EASE });
    run(overlay(src, b), frames, gone ? 520 : 320, 'linear', true);
  }
  /** The figure `src` on square `s` goes in a puff after `hold` ms (a taken piece). */
  const puff = (src: string, s: number, hold: number): void =>
    run(overlay(src, figBox(s)), [{ opacity: 1 }, { opacity: 1, transform: 'none', offset: hold / (hold + 200), easing: EASE }, PUFF], hold + 200, 'linear', true);
  /** Hides the open piece on the board while it flies there. */
  const land = (): void => run(boardEl.querySelector('[data-open]'), [{ opacity: 0 }, { opacity: 0 }], 320);
  /** The board ripple (marks.js:1028-1033), after this action's last draw: the marks pop ring by ring out from the open
   *  piece; after a paint, the painted squares `at` only. */
  const ripple = (at?: string[]): void => queueMicrotask(() => {
    for (const g of boardEl.querySelectorAll<SVGGElement>('[data-sq]:not(.kdm-ghost)')) {
      const t = parseSq(g.dataset.sq!);
      if (at && !at.includes(g.dataset.sq!)) continue;
      g.classList.add('kdm-ripple');
      if (!at) g.style.setProperty('--ring', `${Math.max(Math.abs(file(t) - file(from)), Math.abs(rank(t) - rank(from)))}`);
    }
  });
  /** An item opens (enterPiece, :1541-1549): its figure fades in on the plinth, the board ripples, and the piece comes from its ledge slot by its gait. */
  const arrive = (): void => queueMicrotask(() => {
    run(q('.pg-figure img'), [{ opacity: 0, transform: 'translateY(14px) scale(0.96)' }, {}], 480, EASE);
    ripple();
    const fig = q<HTMLImageElement>('.slot.open .fig');
    if (brush || !fig?.getClientRects().length || !boardEl.querySelector('[data-open]')) return;
    fly(fig.src, fig.getBoundingClientRect(), figBox(from), gaitOf(cur.d));
    land();
  });
  /** The first change makes a copy (flyToYours, :1796-1802): the name stamps, the figure flies to its slot in Yours, and the slot flashes (:366). */
  const copied = (): void => queueMicrotask(() => {
    run(q('.pg-name h3'), [{ opacity: 0, transform: 'scale(1.18) rotate(-2deg)' }, { opacity: 1, offset: 0.6 }, {}], 320, SPRING);
    const fig = q<HTMLImageElement>('.pg-figure img'), slot = q('.slot.open .fig');
    if (!fig || !slot?.getClientRects().length) return;
    fly(fig.src, fig.getBoundingClientRect(), slot.getBoundingClientRect());
    run(slot, [{ opacity: 0 }, { opacity: 0, offset: 0.62 }, { opacity: 1, offset: 0.62 },
      { filter: 'drop-shadow(0 0 0.75px rgba(43, 38, 33, 0.7)) drop-shadow(0 0 12px rgb(233, 192, 113))', offset: 0.77 }], 520);
  });
  /** A stamp (:81-108): the seal stamps with its wax ring, the stone shakes, the new line unrolls, and the board ripples. */
  const stamped = (a: Ability['a']): void => queueMicrotask(() => {
    const i = canonical(cur.d).rules.findIndex(r => r.does.a === a), seal = q(`.sline[data-seal="${i}"] .sl-seal, .pg-pseal[data-seal="${i}"]`), wax = document.createElement('span');
    wax.className = 'pg-wax';
    seal?.append(wax);
    run(seal, [{ transform: 'scale(1.35) rotate(-8deg)' }, {}], 320, SPRING);
    run(wax, [{ opacity: 0.9, transform: 'scale(0.9)' }, { opacity: 0, transform: 'scale(1.8)' }], 420, EASE, true);
    run(q('.pg-stone .front'), [{ transform: 'translateX(-1px)', offset: 0.25 }, { transform: 'translateX(1px)', offset: 0.75 }], 160);
    run(q(`.sline[data-seal="${i}"] .txt`), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], 200, EASE);
    ripple();
  });

  /** A nested modal sheet; `wire` gets its body. A tap on the backdrop closes it (src/dialog-dismiss.ts).
   *  A change under the sheet can redraw the control that opened it: the focus then goes back to its new copy. */
  function sheet(title: string, html: string, wire: (body: HTMLElement, close: () => void) => void): void {
    const s = document.createElement('dialog'), opener = document.activeElement as HTMLElement | null, act = opener?.dataset.act;
    s.className = 'pg-sheet';
    s.setAttribute('aria-labelledby', 'pg-sheet-h');
    s.innerHTML = `<header><h2 id="pg-sheet-h" tabindex="-1" autofocus>${esc(title)}</h2><button type="button" class="pg-x" aria-label="Close">×</button></header><div class="pg-sheet-body">${html}</div>`;
    dlg.append(s);
    const close = (): void => s.close();
    s.addEventListener('close', () => { s.remove(); if (act && !opener!.isConnected) q<HTMLElement>(`[data-act="${act}"]`)?.focus(); });
    s.querySelector<HTMLButtonElement>('.pg-x')!.onclick = close;
    wire(s.querySelector('.pg-sheet-body')!, close);
    s.showModal();
  }
  /** Copies `text`; where the device refuses, a sheet shows it, selected, to copy by hand. */
  async function copyText(text: string, done: string): Promise<void> {
    try { await navigator.clipboard.writeText(text); toast(done); } catch {
      sheet('Copy this', '<p>This device did not let the game copy. Select the text and copy it.</p><textarea class="pg-copybox" readonly rows="5" aria-label="The text to copy"></textarea>', body => {
        const t = body.querySelector('textarea')!;
        t.value = text;
        requestAnimationFrame(() => { t.focus(); t.select(); });
      });
    }
  }

  /* ---- change, save and undo ---- */

  /** Saves the open design; a refusal stays on screen while it is the open design. */
  function save(): void {
    cur.d.updated = Date.now();
    const r = saveDesign(cur.d);
    unsaved = r === 'saved' ? null : { id: cur.d.id, why: r };
    shelf = loadShelf().designs;
  }
  /** One undo step with its scope: `f` changes a copy of the design; nothing happens when it changes nothing or breaks a
   *  hard limit. The first change on a pool piece makes the private copy "My <Name>" (spec decisions 6 and 7). */
  function change(label: string, f: (d: PieceDesign) => void): boolean {
    const d = clone(cur.d);
    f(d);
    if (same(d, cur.d)) return false;
    const why = limit(d);
    if (why) { toast(why); return false; }
    undos.push({ item: clone(cur), label });
    if (undos.length > 50) undos.shift();
    // A rule that comes or goes moves the rule numbers: the kept rule and knot let go. On the Try board a chain or a choice
    // in progress ends, and a removed or changed piece comes back as the design.
    if (d.rules.length !== cur.d.rules.length) focus = knotAt = null;
    edited = true;
    setUp(restored());
    // A pool piece's copy is "My <Name>" unless the change names it, and a link's copy keeps its name unless the shelf has
    // it; an unnamed design's name follows it, and the letter follows the name until the player sets it (names.ts).
    const names = shelf.map(x => x.name);
    if (cur.key.startsWith('piece:') && !d.named) Object.assign(d, { name: copyName(`My ${d.name}`, names), named: true });
    else if (cur.key === 'link') d.name = copyName(d.name, names);
    if (!d.named) d.name = autoName(d, autoBody(d));
    if (letterFollows(cur.d)) d.letter = letterOf(d.name);
    cur = { key: `design:${d.id}`, d, yours: true };
    save();
    render();
    if (!undos[undos.length - 1].item.yours) { revealOpenSlot(); copied(); }
    return true;
  }
  /** Undo: back to the step before, and on the Try board as an edit does (change). Back before the first edit, the copy
   *  goes from the shelf (the mockup's undo); where the device refuses to delete it, the copy and its undo step stay. */
  function undo(): void {
    const u = undos[undos.length - 1];
    if (!u) return;
    if (!u.item.yours && shelf.some(x => x.id === cur.d.id) && !deleteDesign(cur.d.id)) return toast('Could not undo: this device refused.');
    undos.pop();
    if (u.item.d.rules.length !== cur.d.rules.length) focus = knotAt = null;
    setUp(restored());
    cur = u.item;
    if (u.item.yours) save(); else { unsaved = null; shelf = loadShelf().designs; }
    render();
    toast(`Undone: ${u.label}.`);
  }
  function drawAlert(): void {
    const u = unsaved && unsaved.id === cur.d.id ? unsaved.why : null;
    const html = !u ? '' : (u === 'full'
      ? `<p>Not saved: your shelf is full (${MAX} designs). Delete one to keep this piece.</p><button type="button" data-act="room">Choose one to delete</button>`
      : '<p>Not saved: this device did not keep the design.</p><button type="button" data-act="retry">Try again</button>') + '<button type="button" data-act="copy">Copy link</button>';
    alertEl.hidden = !u;
    if (alertEl.dataset.html !== html) { alertEl.innerHTML = html; alertEl.dataset.html = html; }
  }
  /** A full shelf: the player deletes one design, then the open one is saved. */
  function makeRoom(): void {
    sheet('Delete one design', `<p>Your shelf holds ${MAX} designs. Delete one, and ${esc(cur.d.name)} is saved in its place.</p>`
      + shelf.map(d => `<div class="pg-room-row"><span>${esc(d.name)}</span><button type="button" class="pg-room-del" data-id="${esc(d.id)}" aria-label="Delete ${esc(d.name)}">Delete</button></div>`).join(''), (body, close) => {
      for (const b of body.querySelectorAll<HTMLButtonElement>('.pg-room-del')) b.onclick = () => {
        const name = shelf.find(d => d.id === b.dataset.id)?.name ?? '';
        if (!deleteDesign(b.dataset.id!)) return toast('Could not delete: this device refused.');
        close();
        save();
        render();
        toast(unsaved ? `Deleted ${name}.` : `Deleted ${name}. ${cur.d.name} is saved.`);
      };
    });
  }
  /** Every design the editor makes fits a share code; this guard says so if one ever does not. */
  const shareable = (): boolean => !!parseDesign(designCode(cur.d)) || (toast('This design cannot be shared: it breaks a limit.'), false);
  const face = (): string => faceHtml(cur.d, judge(cur.d, false), figureOf(cur.d));
  /** The Share sheet (ticket 08): the card face, then Send link (the device's share), Copy link and Copy as text; with no
   *  device share, one Copy link. A device that refuses the copy gets the copy sheet (copyText). */
  function share(): void {
    if (!shareable()) return;
    const send = !!navigator.share;
    sheet('Share this piece', `<p class="pg-note">Your friend opens this card. It opens read only.</p>${face()}<div class="pg-ask">`
      + `${send ? '<button type="button" class="primary" data-send>Send link</button>' : ''}<button type="button"${send ? '' : ' class="primary"'} data-copy>Copy link</button>`
      + '<button type="button" data-text>Copy as text</button></div>', (body, close) => {
      const d = cur.d, on = (k: string, f: () => unknown): void => { body.querySelector<HTMLButtonElement>(`[data-${k}]`)!.onclick = () => { close(); void f(); }; };
      if (send) on('send', () => navigator.share({ title: d.name, text: `${d.name}: a King Down piece.`, url: link(d) })
        .catch((e: Error) => { if (e.name !== 'AbortError') void copyText(link(d), 'Link copied.'); }));
      on('copy', () => copyText(link(d), 'Link copied.'));
      on('text', () => copyText(designText(d, judge(d, false), link(d)), 'Copied as text.'));
    });
  }
  /** A design link (decision 25): its card face first, read only. Keep a copy saves it and opens it on the board;
   *  Open on the board, × and Esc show it on the board, where the first edit keeps a copy, as for a pool piece. */
  function linkCard(): void {
    sheet('A shared piece', `<p class="pg-note">It opens read only. Keep a copy to change it.</p>${face()}`
      + '<div class="pg-ask"><button type="button" class="primary" data-keep>Keep a copy</button><button type="button" data-board>Open on the board</button></div>', (body, close) => {
      body.querySelector<HTMLButtonElement>('[data-keep]')!.onclick = () => { close(); makeCopy(); };
      body.querySelector<HTMLButtonElement>('[data-board]')!.onclick = close;
    });
  }
  /** Weigh (decision 13): the worth, the band word and the like line. `false` skips the Why parts, the fixes and the deltas. */
  function weighWords(): [string, string] {
    const v = judge(cur.d, false);
    return empty(cur.d) ? [v.line, ''] : [`About ${pawns(v.worth.point)} (estimate). ${bandOf(v)}.`, v.like];
  }

  /* ---- new piece, rename, look and the design menu (ticket 07; spec decisions 16 to 18) ---- */

  /** NEW: a blank piece alone on d4, named by autoName, in brush mode; it saves on its first change (proving-ground.html:2007). */
  function newPiece(): void {
    const d = fromPreset(BLANK);
    d.name = autoName(d, autoBody(d));
    d.letter = letterOf(d.name);
    show({ key: 'new', d, yours: false });
    arm('move');
  }
  /** Make a copy: a new id and the name with the next free number, saved and opened. A pool piece's copy is "My <Name>". */
  function makeCopy(): void {
    const d: PieceDesign = { ...clone(cur.d), id: fromPreset(BLANK).id, named: true };
    d.name = copyName(cur.key.startsWith('piece:') ? `My ${d.name}` : d.name, shelf.map(x => x.name));
    if (letterFollows(cur.d)) d.letter = letterOf(d.name);
    show({ key: `design:${d.id}`, d, yours: true });
    save();
    render();
    revealOpenSlot();
    copied();
    if (!unsaved) toast('A copy is on your shelf.');
  }
  /** Delete asks first; then the ledge drops the design, and the pool piece it came from opens (else the Pawn). */
  function remove(): void {
    const d = cur.d;
    sheet(`Delete ${d.name}?`, '<p>This cannot be undone.</p><div class="pg-ask"><button type="button" class="primary" data-yes>Delete</button><button type="button" data-no>Keep</button></div>', (body, close) => {
      body.querySelector<HTMLButtonElement>('[data-no]')!.onclick = close;
      body.querySelector<HTMLButtonElement>('[data-yes]')!.onclick = () => {
        close();
        if (!deleteDesign(d.id)) return toast('Could not delete: this device refused.');
        shelf = loadShelf().designs;
        show(pool(d.from[0] ?? ''));
        q<HTMLElement>('.pg-more').focus();
        toast(`Deleted ${d.name}.`);
      };
    });
  }
  /** The pen: the name becomes a field. Enter or a blur keeps a valid name (" (yours)" after a pool or card name); Esc keeps the old one.
   *  The focus then goes back to the pen, or on the phone to ⋯. */
  function rename(): void {
    const h = q('.pg-name h3');
    h.innerHTML = `<input class="pg-name-in" type="text" maxlength="18" aria-label="Name" value="${esc(cur.d.name)}">`;
    const inp = h.querySelector('input')!;
    let done = false;
    /** `key`: Enter or Esc ended the field, so the focus goes back to the pen; after a blur it stays where it went. */
    const end = (keep: boolean, key = true): void => {
      if (done) return;
      done = true;
      const s = inp.value.trim(), next = keep && s && s !== cur.d.name;
      if (next && !validName(s)) toast(BAD_NAME);
      if (!next || !validName(s) || !change('name', d => { d.name = saveName(s); d.named = true; })) renderPlinth();
      if (key) (q('.pg-pen') ?? q('.pg-more'))?.focus();
    };
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); end(true); }
      // Esc ends the field only: not the dialog, not a popover.
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); }
    };
    // A press elsewhere blurs the field before its click, and the save redraws the control it pressed: so the field ends in
    // that click, before the click acts. A blur from the keyboard ends it at once.
    inp.onblur = () => (pressing ? addEventListener('click', () => end(true, false), { capture: true, once: true }) : end(true, false));
    inp.focus();
    inp.select();
  }
  /** A mouse press, or a tap's, is in progress: a blur in it comes before its click (rename). */
  let pressing = false;
  dlg.addEventListener('mousedown', () => { pressing = true; }, true);
  addEventListener('mouseup', () => { pressing = false; }, true);
  /** A figure as a look choice: pressed while the piece shows it. */
  const figureButton = (f: Figure, cls: string): string =>
    `<button type="button" class="${cls}" data-figure="${f.id}" aria-pressed="${figureOf(cur.d) === figureUrl(f.id, cur.d.look.army)}" aria-label="${f.name}" title="${f.name}"><img src="${esc(figureUrl(f.id, cur.d.look.army))}" alt="" loading="lazy">${cls === 'pg-fig' ? `<b>${f.name}</b>` : ''}</button>`;
  /** "More" (decision 17): the 34 figures with the tag filter, and the army. Each choice is a look step; the sheet stays open. */
  function looks(): void {
    let tag = 'All';
    sheet('Look', '', body => {
      const draw = (focus?: string): void => {
        body.innerHTML = `<fieldset class="pg-army"><legend>Army</legend>${['Ivory', 'Charcoal'].map((w, i) => `<label><input type="radio" name="pg-army" value="${i}"${cur.d.look.army === i ? ' checked' : ''}>${w}</label>`).join('')}</fieldset>`
          + `<label class="pg-filter">Show <select data-tag aria-label="Figure type">${['All', ...FIGURE_TAGS].map(t => `<option${t === tag ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`
          + `<div class="pg-figs">${FIGURES.filter(f => tag === 'All' || (f.tags as readonly string[]).includes(tag)).map(f => figureButton(f, 'pg-fig')).join('')}</div>`;
        if (focus) body.querySelector<HTMLElement>(focus)?.focus();
      };
      // The sheet's own choices: the dialog's handlers do not see them.
      body.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-figure]');
        if (!b) return;
        e.stopPropagation();
        change('look', d => { d.look.figure = b.dataset.figure; });
        draw(`[data-figure="${b.dataset.figure}"]`);
      });
      body.addEventListener('change', e => {
        const t = e.target as HTMLInputElement;
        e.stopPropagation();
        if (t.matches('[data-tag]')) { tag = t.value; return draw('[data-tag]'); }
        change('look', d => { d.look.army = +t.value as 0 | 1; });
        draw(`[name="pg-army"][value="${t.value}"]`);
      });
      draw();
    });
  }

  /* ---- brush mode (enterBrush, paint and toggleLine, proving-ground.html:1742-1808) ---- */

  function arm(b: Brush): void {
    brush = b;
    lifted = seating = laying = false;
    token = kingOpen = labOpen = null;
    row = peek = pick = card = focus = knotAt = why = null;
    shelfOpen = false;
    render();
  }
  function leave(): void {
    brush = null;
    toolsOpen = false;
    render();
    ripple();
  }
  function paint(q: string): void {
    const s = parseSq(q), x = file(s) - 3, y = rank(s) - 3;
    if (!x && !y) return;
    if (out(q)) {
      const lock = document.createElement('span');
      lock.className = 'pg-lock';
      lock.style.cssText = `left:${file(s) * 12.5}%;top:${(7 - rank(s)) * 12.5}%`;
      lock.innerHTML = sigil('lock', 26);
      paintEl.append(lock);
      run(lock, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], 420, 'ease', true);
      return toast('Reach ends 3 squares out.', 'lock');
    }
    // A mark that the paint alone does not make: a rule makes it.
    if (sc.marks.some(m => m.sq === q && m.diff !== '-') && !sceneOf({ squares: cur.d.squares, lines: cur.d.lines, rules: [] }, board, from).marks.some(m => m.sq === q))
      return toast('A rule makes this mark. Tap its seal.', 'lockOpen');
    const pts = orbit(x, y, mirror), b = brush!;
    const painted = change('paint', d => {
      for (const [a, c] of pts) {
        const i = d.squares.findIndex(t => t.x === a && t.y === c), m = brushMark(d.squares[i]?.mark, b);
        if (m && i >= 0) d.squares[i].mark = m; else if (m) d.squares.push({ x: a, y: c, mark: m }); else if (i >= 0) d.squares.splice(i, 1);
      }
    });
    // The same paint again: nothing changes, the tiles pulse.
    if (!painted) render();
    ripple(pts.map(([a, c]) => sqName(sq(3 + a, 3 + c))));
  }
  /** A nub switches its line with its Mirror partners (spec decision 35). */
  function toggleLine(l: Dir): void {
    const on = !cur.d.lines.includes(l), set = lineOrbit(l, mirror);
    change('line', d => { d.lines = DIRS.filter(x => (set.includes(x) ? on : d.lines.includes(x))); });
  }

  /* ---- the top bar (renderTop, proving-ground.html:952-969): Undo and Share once the piece is the player's, and ⋯ ---- */

  /** The ⋯ design menu (decision 16): on the phone Share and Weigh after the first edit, and Rename (the wide layout's
   *  pen); Look where no look row shows; Copy as text and Make a copy of a piece that moves; Delete of a design on the shelf. */
  function menuItems(): [string, string, Parameters<typeof sigil>[0]?][] {
    const phone = narrow.matches, items: [string, string, Parameters<typeof sigil>[0]?][] = [];
    if (phone && cur.yours) items.push(['share', 'Share', 'quill'], ['weigh', 'Weigh', 'scale']);
    if (phone) items.push(['rename', 'Rename']);
    if (phone || cur.d.from.length) items.push(['looks', 'Look']);
    if (!empty(cur.d)) items.push(['astext', 'Copy as text'], ['copydesign', 'Make a copy']);
    if (shelf.some(x => x.id === cur.d.id)) items.push(['delete', 'Delete']);
    return items;
  }
  function renderTop(): void {
    const u = undos[undos.length - 1], items = menuItems();
    actsEl.innerHTML = (!cur.yours ? '' : `<button type="button" class="pg-undo" data-act="undo" aria-label="${u ? `Undo ${u.label}` : 'Undo'}"${u ? '' : ' disabled'}><span aria-hidden="true">↶</span><span class="pg-word"> Undo${u ? ` ${u.label}` : ''}</span></button>`
      + '<button type="button" class="pg-share" data-act="share">Share</button>')
      + (items.length ? `<button type="button" class="pg-more" data-act="more" aria-label="More" aria-expanded="${moreOpen}" aria-controls="pg-morepop">⋯</button>` : '');
    moreEl.hidden = !(items.length && moreOpen);
    moreEl.innerHTML = moreEl.hidden ? '' : items.map(([act, words, icon]) => `<button type="button" data-act="${act}">${icon ? sigil(icon, 18) : '<i class="pg-noic"></i>'}${words}</button>`).join('');
  }

  /* ---- the plinth (renderPlinth and sealLineHTML, proving-ground.html:979-1006, :1030-1098) ---- */

  /** A state rule sleeps while its When does not hold here: its seal is grey and its chip hollow. */
  const asleepOf = (r: Rule): boolean => !blockOf(r.does.a).event && r.when.on !== 'always' && !holds(r.when, board, from, st);
  /** The rule has When choices (decision 10): not "takes again" and "removed too", whose only When is "when it takes". */
  const hasWhens = (a: Ability['a']): boolean => { const w = whenChoices(a); return w.top.length + w.more.length > 0; };
  /** A button with a 44 px hit area round a pill or a chip; `aria-expanded` while its row is open. */
  const hit = (attr: string, a: string, open: boolean, inner: string, label = ''): string =>
    `<button type="button" class="pg-hit" ${attr}="${a}" aria-expanded="${open}"${label ? ` aria-label="${esc(label)}"` : ''}>${inner}</button>`;
  /** The When button of an "always" rule, which has no chip. */
  const whenButton = (r: Rule): string =>
    (r.when.on === 'always' && hasWhens(r.does.a) ? hit('data-when', r.does.a, row?.a === r.does.a && row.when, pill('When'), 'When: always') : '');
  /** The words of a seal that isolates rule `i` (a tap keeps it). */
  const press = (i: number, what: string): string => `aria-pressed="false" aria-label="Rule ${ROMAN[i]}: ${esc(what)}. Show only its marks."`;
  /** A rule line: the seal, the When chip (a button that opens the When choices), the short line with its pill (spec
   *  decision 38), and on the wide layout the × that removes the rule. A tap on the line or its seal isolates rule `i`
   *  (the seal is the button, for the keyboard). The phone's card shows the line with no seal and no `i`. */
  function lineHtml(r: Rule, i?: number): string {
    const a = r.does.a, P = lineParts(r), asleep = asleepOf(r), c = chip(r.when, { hollow: asleep }), inCard = i === undefined;
    const part = (p: Part): string => (typeof p === 'string' ? esc(p) : hit('data-pill', a, row?.a === a && !row.when, pill(p.text)));
    const l1 = (c && hasWhens(a) ? hit('data-when', a, row?.a === a && row.when, c, `When: ${whenWords(r.when)}`) : c) + P.after.map(part).join('');
    return `<div class="sline"${inCard ? '' : ` data-seal="${i}"`}>${inCard ? '' : `<button type="button" class="sl-seal" ${press(i, blockOf(a).title)}>${seal(a, 44, { asleep })}</button>`}<span class="txt">${l1 ? `<span class="l1">${l1}</span>` : ''}<span class="l2">${P.line.map(part).join('')}</span></span>`
      + (!inCard ? `<span class="acts">${whenButton(r)}<button type="button" class="pg-rm" data-rm="${a}" aria-label="Remove ${esc(blockOf(a).label.replace('…', ''))}">×</button></span>` : '') + '</div>';
  }
  /** The choices of the open row: a pill's values, or the When choices of whenChoices. */
  function choicesOf(): Choice[] {
    const { a, when } = row!, r = ruleIn(cur.d, a)!, at = (d: PieceDesign): Rule => ruleIn(d, a)!;
    const make = (c: Omit<Choice, 'off'>, clash?: string): Choice => ({ ...c, off: c.on ? null : clash ?? limit(tried(c.apply)) });
    if (!when) {
      const { key, choices } = blockOf(a).pill!, now = (r.does as unknown as Record<string, string>)[key];
      return choices.map(([k, words]) => make({ v: k, words: brief(words), on: k === now, apply: d => { (at(d).does as unknown as Record<string, string>)[key] = k; } }));
    }
    const { top, more } = whenChoices(a), as = r.does.a === 'movesLike' ? r.does.as : undefined;
    return [...top, ...more].map((w, i) => {
      // "Always" for "moves like" adds that piece's squares to Moves and takes the rule away (likeAlways, model.ts).
      const like = as && w.on === 'always' ? as : undefined, merged = like && likeAlways(cur.d, like);
      const apply = like ? (d: PieceDesign) => { Object.assign(d, likeAlways(d, like)); d.rules = d.rules.filter(x => x.does.a !== a); } : (d: PieceDesign) => { at(d).when = clone(w); };
      return make({ v: String(i), w, like, words: whenLabel(w, !!as), on: same(w, r.when), apply }, like && !merged ? LIKE_CLASH : undefined);
    });
  }
  /** The open row under its line (desktop) or in the phone's card: the choices, then the words of each that the design cannot take. */
  function rowHtml(): string {
    const cs = choicesOf(), top = row!.when ? whenChoices(row!.a).top.length : cs.length, rest = cs.slice(top);
    const btn = (c: Choice, text = c.words, label = ''): string => `<button type="button" class="pg-hit" data-choice="${c.v}"${c.off ? ' aria-disabled="true"' : ''}`
      + `${label ? ` aria-label="${esc(label)}"` : ''}>${pill(text, { choice: true, on: c.on })}</button>`;
    // The rest of the When choices: plain ones, then "Next to your" with a piece list, then the move numbers (the When sheet's order).
    const kind = (c: Choice): string => (c.w!.on === 'near' && c.w!.who.length === 1 ? 'body' : c.w!.on === 'fromMove' || c.w!.on === 'beforeMove' ? c.w!.on : '');
    const bodies = rest.filter(c => kind(c) === 'body'), near = bodies.find(c => c.on);
    const nums = (on: string, words: string): string => {
      const ws = rest.filter(c => kind(c) === on);
      return ws.length ? `<span class="pg-nums">${words}${ws.map(c => btn(c, String((c.w as { n: number }).n), `${words} ${(c.w as { n: number }).n}`)).join('')}</span>` : '';
    };
    const more = !rest.length ? '' : !row!.more ? `<button type="button" class="pg-hit" data-act="morewhen">${pill('More choices', { choice: true })}</button>`
      : rest.filter(c => !kind(c)).map(c => btn(c)).join('')
        + (bodies.length ? `<label class="pg-near${near ? ' is-on' : ''}">Next to your <select data-near aria-label="Next to your piece"><option value=""${near ? '' : ' selected'} disabled>piece</option>`
          + bodies.map(c => { const who = (c.w as { who: Body }).who; return `<option value="${c.v}"${c === near ? ' selected' : ''}>${BODY[who].name}</option>`; }).join('') + '</select></label>' : '')
        + nums('fromMove', 'From move') + nums('beforeMove', 'Before move');
    const offs = [...new Set(cs.flatMap(c => (c.off ? [c.off] : [])))];
    return `<div class="choices" role="group" aria-label="${row!.when ? 'When' : 'Choices'}">${cs.slice(0, top).map(c => btn(c)).join('')}${more}</div>`
      + offs.map(o => `<p class="pg-off">${esc(o)}</p>`).join('');
  }

  function renderPlinth(): void {
    // An open king (renderPlinth, proving-ground.html:1062-1066): his name and his figure on the stone.
    if (kingOpen) {
      plinthEl.innerHTML = `<div class="pg-name"><div class="row"><h3>${kingOpen} King</h3></div></div>`
        + `<div class="pg-figure"><span class="halo"></span><img src="${kingArt(kingOpen)}" alt="${kingOpen} king"></div><div class="pg-stone"><div class="top"></div><div class="front"></div></div>`;
      return;
    }
    // An open card (renderPlinth, proving-ground.html:1067-1070): its name, and on the plinth its art, title and sentence with the LAB ribbon.
    if (labOpen) {
      const n = cardName(labOpen);
      plinthEl.innerHTML = `<div class="pg-name"><div class="row"><h3${n.length > 9 ? ' class="long"' : ''}>${n}</h3></div></div>`
        + `<div class="pg-bigcard lab-host"><img class="art" src="${cardArt(labOpen)}" alt=""><b class="ttl">${n}</b><span class="rule"></span><p>${esc(cardWords(labOpen))}.</p><span class="lab-ribbon" aria-hidden="true">LAB</span></div>`;
      return;
    }
    const d = cur.d, name = d.name || 'Piece', origin = cur.key.startsWith('piece:') ? undefined : PRESETS.find(p => d.from.length === 1 && p.key === d.from[0]);
    const rules = canonical(d).rules, room = rules.length < MAX_RULES;
    const [head, like] = weighOpen ? weighWords() : ['', ''], mine = cur.yours || cur.key === 'new';
    plinthEl.innerHTML = `<div class="pg-name${mine ? ' is-copy' : ''}"><div class="row"><h3${name.length > 9 ? ' class="long"' : ''}>${esc(name)}</h3>${mine ? tagYours() : ''}`
      // On the phone, the plaque is a lock icon in the name row (proving-ground.html:1039).
      + (narrow.matches ? `<span class="plock" role="img" aria-label="Try board" title="An example board. No check test. The other side does not move.">${sigil('lockOpen', 18)}</span>` : '')
      + `${cur.yours ? `<button type="button" class="pg-weigh" data-act="weigh" aria-expanded="${weighOpen}">${sigil('scale', 16)}Weigh</button>` : ''}</div>`
      + `${origin ? `<div class="from">from ${esc(origin.name)}</div>` : ''}`
      // The pen rests at the end of the name's rule line (wide layout); on the phone, Rename is in ⋯.
      + `${!narrow.matches ? `<button type="button" class="pg-pen" data-act="rename" aria-label="Rename" title="Rename">${sigil('quill', 18)}</button>` : ''}</div>`
      + (weighOpen ? `<div class="pg-weighpop">${MEDAL}<b>${esc(head)}</b><small>${esc(like)}</small></div>` : '')
      + `<div class="pg-figure"><span class="halo"></span><img src="${esc(figureOf(d))}" alt=""></div><div class="pg-stone"><div class="top"></div><div class="front"></div></div>`
      + (narrow.matches
        // The narrow layout shows the seals in a row beside the name: a tap keeps the rule, a tap on the kept seal opens its card; + opens the shelf.
        ? `<div class="pg-pseals">${rules.map((r, i) => `<button type="button" class="pg-pseal" data-seal="${i}" data-card="${r.does.a}" aria-expanded="${card === r.does.a}" ${press(i, ruleText(r))}>${seal(r.does.a, 42, { asleep: asleepOf(r) })}</button>`).join('')}`
          + `${room ? '<button type="button" class="padd" data-act="shelf" aria-label="Add a rule">+</button>' : ''}</div>`
        // The lines, the Add row, and dotted rows up to 3 once the piece is the player's (:1044-1051).
        : `<div class="pg-lines">${rules.length ? `<ol aria-label="Rules">${rules.map((r, i) => `<li>${lineHtml(r, i)}${row?.a === r.does.a ? rowHtml() : ''}</li>`).join('')}</ol>` : ''}`
          + (room ? '<button type="button" class="sline add" data-act="shelf"><span class="sl-seal" aria-hidden="true">+</span><b>Add a rule</b></button>'
            + '<div class="sline empty" aria-hidden="true"><span class="sl-seal"></span><span class="txt"></span></div>'.repeat(cur.yours && rules.length ? MAX_RULES - 1 - rules.length : 0) : '')
          // The look row of a piece made with NEW (decision 17; LOOKS, proving-ground.html:733, :1052): the suggested figures,
          // then "More". A pool piece and its copy have Look in ⋯.
          + '</div>' + (d.from.length ? '' : `<div class="pg-looks" role="group" aria-label="Look">${suggestedFigures(d).map(f => figureButton(f, 'pg-look')).join('')}`
            + '<button type="button" class="pg-look pg-lookmore" data-act="looks" aria-haspopup="dialog">More</button></div>'));
    placeKnots();
    isolate();
  }
  /** The knots in the lines' 22 px gutter, from the middle of one rule line to the middle of the other (placeKnots, :1009-1022). Wide layout only.
   *  A knot from rule I to rule III beside another knot gets a second gutter, so each knot keeps its own 24 px hit area. */
  function placeKnots(): void {
    plinthEl.querySelectorAll('.knot').forEach(k => k.remove());
    if (narrow.matches || !sc || kingOpen || labOpen) return;
    const line = (i: number) => q<HTMLElement>(`.sline[data-seal="${i}"]`), mid = (l: HTMLElement) => l.offsetTop + l.offsetHeight / 2;
    const far = (k: Scene['knots'][number]) => k.b - k.a === 2 && sc.knots.length > 1;
    plinthEl.querySelector('.pg-lines')?.classList.toggle('far', sc.knots.some(far));
    sc.knots.forEach((k, i) => {
      const a = line(k.a), len = mid(line(k.b)) - mid(a);
      a.insertAdjacentHTML('beforeend', `<button type="button" class="knot${far(k) ? ' far' : ''}" data-knot="${i}" aria-pressed="${knotAt === i}" aria-label="${esc(k.words)}" title="${esc(k.words)}" style="top:${a.offsetHeight / 2}px;height:${len}px">${knot(k.type, len)}</button>`);
    });
  }
  /** Shows the isolated rule or knot on the plinth; the classes change in place, so the keyboard focus stays. */
  function isolate(): void {
    for (const l of plinthEl.querySelectorAll<HTMLElement>('[data-seal]')) {
      const i = +l.dataset.seal!;
      l.classList.toggle('is-focus', focus === i);
      l.classList.toggle('is-other', focus !== null && focus !== i);
      (l.matches('button') ? l : l.querySelector('.sl-seal'))!.setAttribute('aria-pressed', `${focus === i}`);
    }
    for (const k of plinthEl.querySelectorAll<HTMLElement>('[data-knot]')) k.setAttribute('aria-pressed', `${knotAt === +k.dataset.knot!}`);
  }
  // A pill, a chip and × keep their own taps; brush mode isolates nothing (isolate, proving-ground.html:1634).
  plinthEl.addEventListener('click', e => {
    if (brush) return;
    const t = e.target as Element, k = t.closest<HTMLElement>('[data-knot]'), l = t.closest('[data-pill], [data-when], [data-rm]') ? null : t.closest<HTMLElement>('[data-seal]');
    if (k) {
      knotAt = knotAt === +k.dataset.knot! ? null : +k.dataset.knot!;
      focus = null;
      if (why) { why = null; renderWhy(); }
      if (knotAt !== null) toast(sc.knots[knotAt].words);
    } else if (l) {
      const i = +l.dataset.seal!, gold = sc.knots.find(x => x.type === 'gold' && (x.a === i || x.b === i));
      // On the phone, a tap on the kept seal opens its card (:1938); while a card is open, a tap on a seal opens that rule's card.
      if (l.dataset.card && (focus === i || card)) { focus = i; return openCard(l.dataset.card as Ability['a']); }
      // A second tap lets the rule go, and the hover or keyboard focus on it too, until a new one.
      if (focus === i) focus = hover = null; else focus = i;
      knotAt = null;
      if (why) { why = null; renderWhy(); }
      // A desktop tap names what the rule makes with another one.
      if (focus !== null && gold && !narrow.matches) toast(gold.words);
    } else return;
    isolate();
    drawBoard();
    // The kept rule's pill pulses once (:1640, :1646).
    if (l && focus !== null) run(l.querySelector('.pill'), [{ boxShadow: '0 0 0 5px rgba(233, 192, 113, 0.9)', offset: 0.5 }], 480);
  });
  /** Hover or keyboard focus on a rule line shows that rule alone until the pointer or the focus goes; a kept rule or knot wins. */
  const hoverOn = (t: EventTarget | null): void => {
    const l = t instanceof Element && !t.closest('.knot') ? t.closest<HTMLElement>('[data-seal]') : null, i = l ? +l.dataset.seal! : null;
    if (i === hover) return;
    hover = i;
    if (focus === null && knotAt === null) drawBoard();
  };
  plinthEl.addEventListener('pointerover', e => hoverOn(e.target));
  plinthEl.addEventListener('pointerleave', () => hoverOn(null));
  plinthEl.addEventListener('focusin', e => { if ((e.target as Element).matches(':focus-visible')) hoverOn(e.target); });
  plinthEl.addEventListener('focusout', e => hoverOn(e.relatedTarget));
  // Esc stops the isolate before it closes the dialog (wherever the focus is).
  dlg.addEventListener('cancel', e => {
    if (focus === null && knotAt === null) return;
    e.preventDefault();
    focus = knotAt = hover = null;
    isolate();
    drawBoard();
  });

  /* ---- the Rules shelf (renderShelf, :1406-1432) and the phone's rule card (showPhoneSentence, :2099-2104) ---- */

  /** Why the open design cannot take block `a`'s rule now, or null. */
  const notNow = (a: Ability['a']): string | null =>
    (ruleIn(cur.d, a) ? 'Already in this piece.' : blockOf(a).needs?.(cur.d) ?? limit({ ...cur.d, rules: [...cur.d.rules, blockOf(a).rule] }));
  function renderShelf(): void {
    shelfEl.hidden = !shelfOpen && !card;
    // The shelf covers the right column, and on the phone the ledge too (renderWhy): the covered controls leave the Tab order.
    q('.pg-right').inert = !shelfEl.hidden;
    const r = card && ruleIn(cur.d, card);
    if (r) {
      const b = blockOf(r.does.a);
      shelfEl.className = 'pg-shelf pg-card';
      shelfEl.innerHTML = `<header>${seal(b.a, 40, { asleep: asleepOf(r) })}<h3 id="pg-shelf-h">${esc(b.label)}</h3><button type="button" class="pg-x" data-act="closecard" aria-label="Close">×</button></header>`
        + lineHtml(r) + (row ? rowHtml() : '') + `<p class="pg-ex">${esc(b.example)}</p>`
        + `<div class="pg-act">${whenButton(r)}<button type="button" class="pg-remove" data-rm="${b.a}">Remove</button></div>`;
      return;
    }
    shelfEl.className = 'pg-shelf';
    if (!shelfOpen) { shelfEl.innerHTML = ''; return; }
    const sealButton = (a: Ability['a']): string => {
      const b = blockOf(a), has = !!ruleIn(cur.d, a), need = !has && b.needs?.(cur.d);
      return `<button type="button" class="sbtn${has ? ' has' : ''}${need ? ' dim' : ''}" data-sealitem="${a}" aria-pressed="${pick === a}" aria-label="${esc(b.title)}${has ? ', already in this piece' : need ? `. ${esc(need)}` : ''}">${seal(a, 48)}<span>${esc(b.label)}</span></button>`;
    };
    let h = '<header><h3 id="pg-shelf-h">Rules</h3><button type="button" class="pg-x" data-act="closeshelf" aria-label="Close">×</button></header><div class="groups">'
      + GROUPS.map(g => { const bs = BLOCKS.filter(b => b.group === g); return `<div class="grp${bs.length > 2 ? ' wide' : ''}"><h4>${g}</h4><div class="seals">${bs.map(b => sealButton(b.a)).join('')}</div></div>`; }).join('')
      + `${pick ? '' : '<p class="pg-shint">Tap a seal. The board shows what it does.</p>'}</div>`;
    if (pick) {
      // The sentence card: the seal, the When chip, the sentence with the default pill, why it cannot go on now, and Stamp.
      const b = blockOf(pick), P = lineParts(b.rule), why = notNow(pick), still = (p: Part): string => (typeof p === 'string' ? esc(p) : pill(p.text));
      const l1 = chip(b.rule.when) + P.after.map(still).join('');
      h += `<div class="sentence">${seal(pick, 44)}<p class="say">${l1 ? `<span class="l1">${l1}</span>` : ''}${P.say.map(still).join('')}</p>`
        // An event rule can change no square on this board: then the example says what it does (ticket 03, Risks).
        + (why ? `<p class="needs">${esc(why)}</p>` : added ? '' : `<p class="pg-ex">${esc(b.example)}</p>`)
        + `<div class="pg-act"><button type="button" class="pg-stamp" data-act="stamp"${why ? ' disabled' : ''}>Stamp</button></div></div>`;
    }
    shelfEl.innerHTML = h;
  }
  /** S, the Add row and the phone's +: the shelf opens (no more than 3 rules: the limit words). */
  function openShelf(): void {
    // At 3 of 3 the lines shake (:97-98, :1815).
    if (cur.d.rules.length >= MAX_RULES) {
      run(q('.pg-lines, .pg-pseals'), [-4, 4, -4, 4].map((x, i) => ({ transform: `translateX(${x}px)`, offset: (i + 1) / 5 })), 260);
      return toast(FULL, 'lock');
    }
    brush = row = peek = pick = card = focus = knotAt = why = kingOpen = labOpen = null;
    toolsOpen = false;
    shelfOpen = true;
    render();
    q<HTMLElement>('.pg-shelf .sbtn').focus();
  }
  function closeShelf(): void {
    shelfOpen = false;
    pick = peek = null;
    render();
    q<HTMLElement>('[data-act="shelf"]')?.focus();
  }
  /** Gives the focus to the first control of rule `a`'s line or seal, or else to the Add row or the title. */
  const focusRule = (a: string): void =>
    (q<HTMLElement>(`[data-when="${a}"], [data-pill="${a}"], [data-rm="${a}"], [data-card="${a}"]`) ?? q<HTMLElement>('[data-act="shelf"]') ?? q<HTMLElement>('#pg-h')).focus();
  function stamp(): void {
    const b = blockOf(pick!);
    if (!change('rule', d => { d.rules.push(clone(b.rule)); })) return;
    shelfOpen = false;
    pick = null;
    render();
    stamped(b.a);
    focusRule(b.a);
  }
  function removeRule(a: Ability['a']): void {
    change('rule', d => { d.rules = d.rules.filter(r => r.does.a !== a); });
    card = null;
    render();
    focusRule(a);
  }
  /** A tap on a pill or a When chip opens its row, with the focus on the choice that the rule has now; a second tap closes it. */
  function toggleRow(a: Ability['a'], when: boolean): void {
    const r = ruleIn(cur.d, a)!;
    row = row?.a === a && row.when === when ? null : { a, when, more: when && !whenChoices(a).top.some(w => same(w, r.when)) };
    peek = pick = why = null;
    shelfOpen = false;
    render();
    const on = q<HTMLElement>('.choices .is-on');
    if (row) (on?.closest<HTMLElement>('button') ?? on?.querySelector('select') ?? q<HTMLElement>('.choices button')).focus();
  }
  /** A tap or Enter on a choice commits it through change('rule', …). A choice that the design cannot take shows its words. */
  function choose(v: string): void {
    const c = choicesOf().find(x => x.v === v), { a, when } = row!;
    if (!c) return;
    if (c.off) return toast(c.off);
    row = peek = null;
    if (change('rule', c.apply)) ripple(); else render();
    if (c.like) toast(`Added to Moves: ${LIKE_ADDED[c.like]}.`);
    (q<HTMLElement>(`[data-${when ? 'when' : 'pill'}="${a}"]`) ?? q<HTMLElement>('[data-act="shelf"]') ?? q<HTMLElement>('#pg-h')).focus();
  }
  function openCard(a: Ability['a']): void {
    card = card === a ? null : a;
    row = peek = pick = why = null;
    shelfOpen = false;
    render();
    if (card) q<HTMLElement>('.pg-card .pg-x').focus();
  }
  function closeCard(): void {
    const a = card;
    card = row = peek = null;
    render();
    q<HTMLElement>(`[data-card="${a}"]`)?.focus();
  }
  /** Copies the open design and changes the copy: the preview of a choice. */
  const tried = (f: (d: PieceDesign) => void): PieceDesign => { const d = clone(cur.d); f(d); return d; };

  /* ---- the board (renderBoard, renderPaintFx, renderHits and squareLabel, proving-ground.html:1161, :1222-1281) ---- */

  const art = (p: ScenePiece): string => (p.open ? (pos.became && !brush ? pieceArt(pos.became) ?? '' : figureOf(cur.d))
    : king && p.k === 'king' && p.side === 'w' ? kingArt(king) : pieceArt((PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b') ?? '');
  function drawBoard(): void {
    const s = fieldEl.clientWidth / 8;
    if (!s) return;
    drawnAt = s;
    boardEl.setAttribute('viewBox', viewBox(s));
    // A preview and brush mode show every mark: the rule numbers of a preview's `by` are those of the design under preview.
    const look = !brush && !peek && !pick, k = look && knotAt !== null ? sc.knots[knotAt] : undefined, i = look ? focus ?? hover : null;
    const iso = k ? (by: readonly number[]) => by.includes(k.a) && by.includes(k.b) : i === null ? undefined : (by: readonly number[]) => by.includes(i);
    // The phone shows the stamps of the kept rule only (boardOpts, :1149).
    // The hover-only parts of the open tag's square, else of the square under the pointer, else of the focus (proving-ground.html:1144).
    // A lifted piece stands raised and faint in a frame until it is placed.
    // While an open card is laid and not played, the piece's own marks step back (proving-ground.html:1142-1143); so do they
    // after a Freeze or an Ice Wall card just played, which is the turn's move in card mode (scenes.js freeze-card, dim).
    const back = !brush && !!laid && poolPiece() && (pos.game.played ? !backs.at(-1)?.game.played && (laid === 'Freeze' || laid === 'IceWall') : labOpen === laid || sc.effects.some(e => e.k === 'rune'));
    boardEl.innerHTML = drawString(sc, {
      s, art, focus: iso ?? (back ? () => false : undefined), stamps: narrow.matches ? x => look && x === focus : undefined, hover: why ?? near ?? keyed, select: why ?? (lifted ? sqName(from) : null), lift: lifted,
    });
  }
  function squareLabel(at: string): string {
    const m = sc.marks.find(x => x.sq === at && !x.on), occ = sc.pieces.find(p => p.sq === at);
    const who = occ ? `${occ.side === 'b' ? 'black' : 'white'} ${occ.open ? (cur.d.name || 'piece').toLowerCase() : occ.k}` : '';
    const kind = m && [NAMES[m.k], m.byWords].filter(Boolean).join(', ').toLowerCase();
    const what = !m ? (occ ? '' : 'empty') : m.diff === '-' ? `was ${kind}` : `${m.cond === 'asleep' ? 'asleep here' : kind}${m.diff ? ', changed' : ''}`;
    return `${at}: ${[what, who].filter(Boolean).join(', ')}.`;
  }
  function renderHits(): void {
    hitsEl.classList.toggle('armed', !!brush);
    for (const b of hitsEl.querySelectorAll<HTMLButtonElement>('.sq')) {
      b.setAttribute('aria-label', squareLabel(b.dataset.sq!));
      b.tabIndex = b.dataset.sq === kbd ? 0 : -1;
      // The open piece's square takes a drag, so a drag on a touch screen does not scroll the page (ground.css).
      b.classList.toggle('is-open', !brush && !pos.gone && b.dataset.sq === sqName(pos.from));
    }
  }
  /** Brush mode: the squares out of reach are dark, the reach has a gold frame, and 8 nubs round d4 switch the lines. */
  function renderPaint(): void {
    paintEl.innerHTML = !brush ? '' : '<svg class="pg-reach" viewBox="0 0 8 8" preserveAspectRatio="none" aria-hidden="true"><path d="M7 0h1v8H7zM0 0h7v1H0z" fill="rgba(43,38,33,.32)"/>'
      + '<rect x="0" y="1" width="7" height="7" fill="none" stroke="rgba(233,192,113,.65)" stroke-width="3" vector-effect="non-scaling-stroke"/>'
      + '<rect x="0" y="1" width="7" height="7" fill="none" stroke="var(--gold-ink)" stroke-width="1.5" opacity=".9" vector-effect="non-scaling-stroke"/></svg>'
      + DIRS.map(l => {
        const [x, y] = DIR[l], k = x && y ? 0.42 : 0.4, on = cur.d.lines.includes(l);
        return `<button type="button" class="nub${on ? ' on' : ''}" data-nub="${l}" aria-pressed="${on}" aria-label="${cap(lineWords([l]))}" title="${on ? 'Remove this line' : 'Add a line'}"`
          + ` style="--x:${x * k};--y:${y * k}">${nub(on, (Math.atan2(-y, x) * 180) / Math.PI)}</button>`;
      }).join('');
  }
  // One tab stop; the arrow keys move over the squares (forward is up).
  hitsEl.addEventListener('keydown', e => {
    const step = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<string, number[]>)[e.key];
    const at = (e.target as HTMLElement).dataset.sq;
    if (!step || !at) return;
    e.preventDefault();
    const s = parseSq(at), edge = (v: number) => Math.min(7, Math.max(0, v));
    kbd = sqName(sq(edge(file(s) + step[0]), edge(rank(s) + step[1])));
    renderHits();
    q<HTMLButtonElement>(`.sq[data-sq="${kbd}"]`).focus();
  });
  /** The pointer or the keyboard focus (`key`) on a square with hover-only parts shows them (proving-ground.html:2047-2060);
   *  the open tag wins, then the pointer. Each keeps its own square, so the pointer does not take the focus's parts away. */
  const nearAt = (t: EventTarget | null, key = false): void => {
    const at = t instanceof Element ? t.closest<HTMLElement>('.pg-hits .sq')?.dataset.sq : undefined;
    const n = at && [...sc.marks, ...sc.effects, ...sc.impressions].some(x => x.on === at) ? at : null;
    if (n === (key ? keyed : near)) return;
    if (key) keyed = n; else near = n;
    if (!why) drawBoard();
  };
  hitsEl.addEventListener('pointerover', e => nearAt(e.target));
  hitsEl.addEventListener('pointerleave', () => nearAt(null));
  hitsEl.addEventListener('focusin', e => { if ((e.target as Element).matches(':focus-visible')) nearAt(e.target, true); });
  hitsEl.addEventListener('focusout', () => nearAt(null, true));
  /** The drag (proving-ground.html:2062-2080): a drag of more than 8 px lifts the open piece, and its figure follows the
   *  pointer; the release places it on the square under the pointer, as a tap and a tap do; off the board it goes back. */
  let drag: { x: number; y: number; img?: HTMLImageElement } | null = null, noClick = false;
  hitsEl.addEventListener('pointerdown', e => { if (!brush && (e.target as Element).closest('.sq.is-open')) drag = { x: e.clientX, y: e.clientY }; });
  document.addEventListener('pointermove', e => {
    if (!drag || (!drag.img && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) <= 8)) return;
    const w = fieldEl.clientWidth / 8;
    if (!drag.img) {
      lift(false);
      drag.img = Object.assign(document.createElement('img'), { className: 'pg-drag', alt: '', src: art({ sq: '', k: 'design', side: 'w', open: true }) });
      dlg.append(drag.img);
    }
    Object.assign(drag.img.style, { width: `${w}px`, height: `${w}px`, left: `${e.clientX - w / 2}px`, top: `${e.clientY - w * 0.8}px` });
  });
  const drop = (e: PointerEvent): void => {
    const img = drag?.img;
    drag = null;
    if (!img) return;
    img.remove();
    noClick = true;
    setTimeout(() => { noClick = false; }, 0);
    const at = e.type === 'pointerup' ? document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.pg-hits .sq')?.dataset.sq : undefined;
    if (at) place(parseSq(at)); else { lifted = false; render(); }
  };
  document.addEventListener('pointerup', drop);
  document.addEventListener('pointercancel', drop);
  // The click that ends a drag does not also tap.
  dlg.addEventListener('click', e => { if (noClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  /* ---- the Why tag (renderWhy and renderNotch, proving-ground.html:1217-1223, :1330-1364) ---- */

  /** A tap or Enter on a square in look mode opens its tag, and lets the kept rule go; a tap on its square closes it. */
  function openWhy(at: string): void {
    why = why === at ? null : at;
    row = peek = pick = card = focus = knotAt = promo = null;
    shelfOpen = false;
    kbd = at;
    render();
  }
  /** ×, Esc: the tag closes, and the focus goes back to its square. */
  function closeWhy(): void {
    const at = why;
    why = promo = null;
    render();
    q<HTMLElement>(`.pg-hits .sq[data-sq="${at}"]`).focus();
  }
  /** The tag: the square, its occupant and the count ring; the sum (48 px tiles and 34 px stamps on the phone); the note under it.
   *  Desktop: under the key row, with a pointer and a rim notch at the square's row. Phone: a bottom sheet over the brushes and the ledge. */
  function renderWhy(): void {
    const phone = narrow.matches;
    whyEl.hidden = notchEl.hidden = !why;
    // On the phone the shelf, the card and the tag cover the ledge, and the tag the brushes too; in short landscape they are
    // side sheets that cover the plinth strip, and the tag the tray, and the ledge's sheet from Pieces goes over them.
    const sheet = !!why || !shelfEl.hidden;
    ledgeEl.inert = upright() && sheet;
    plinthEl.inert = short.matches && sheet;
    brushesEl.inert = trayEl.inert = phone && !!why;
    if (!why) { whyEl.innerHTML = ''; return; }
    const w = whyWords(now(), sc, traceOf(now(), board, from, st), why), p = w.piece, T = phone ? 48 : 52;
    const icon = !p ? '' : pieceIcon(p.open ? pos.became || BODY_TYPE[cur.d.look.body as Body] : (PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b' ? 1 : 0);
    whyEl.innerHTML = `<div class="tag"><div class="why-h">${icon}<span class="sqn">${why}</span><span class="occ">${esc(w.occupant)}</span>${w.count ? countRing(w.count) : ''}`
      + `<button type="button" class="x" data-act="closewhy" aria-label="Close">×</button></div>`
      + `<div class="why-sumrow">${w.sum ? whySum(w.sum, T, phone ? 34 : 40) : `<div class="why-solo"><small>${esc(w.solo!)}</small></div>`}</div>`
      + `${w.foot ? `<p class="why-foot">${esc(w.foot)}</p>` : ''}${footHtml(why)}</div>${phone ? '' : '<span class="pointer"></span>'}`;
    notchEl.style.setProperty('--row', String(8 - +why[1]));
    placePointer();
  }
  /** The tag's pointer looks at the row of its square. */
  function placePointer(): void {
    const p = whyEl.querySelector<HTMLElement>('.pointer');
    if (!p || !why) return;
    const t = whyEl.getBoundingClientRect(), r = q(`.pg-hits .sq[data-sq="${why}"]`).getBoundingClientRect();
    p.style.top = `${Math.max(18, Math.min(t.height - 18, r.top + r.height / 2 - t.top))}px`;
  }

  /* ---- Try with (renderTray, placeLifted, placeEnemy, doMoveHere and takeBack, proving-ground.html:1369-1396, :1655-1738) ---- */

  /** The design whose moves the piece has now: the piece that a "becomes" made it, else the open design. */
  const now = (): PieceDesign | Preset => (pos.became && !brush ? presetOf(PIECE[pos.became]) : cur.d);
  /** The moves that a tap plays now: the next takes of a chain in progress, else the moves of the turn less the longer chains. */
  const movesNow = (): Move[] => (pos.gone ? [] : pos.chain ? pos.chain.more.filter(m => m.captures.length === pos.chain!.caps.length + 1)
    : movesOf(now(), pos.board, pos.from, pos.st).filter(m => m.captures.length <= 1));
  const movesAt = (q: string): Move[] => movesNow().filter(m => sqName(pos.chain ? m.to : tapOf(m)) === q);
  const plaqueOn = (): boolean => tapped || edited || opened > 1;

  /* ---- the kings (ticket 13): the King socket, the coins, and the armed power's marks on an unchanged pool piece ---- */

  /** Powers work on the pool pieces only, as the engine makes their moves (decision 31). */
  const poolPiece = (): boolean => cur.key.startsWith('piece:');
  /** The Try board as the engine's position: the open pool piece as its own type, with the uses of power `p` spent (each
   *  power of a king counts its own uses; the engine counts one power for each side) and the marks. */
  const poolType = (): PieceType => (poolPiece() ? (PIECE as readonly string[]).indexOf(cur.key.slice(6)) as PieceType : T);
  const kingPos = (p = armed): Position => enginePos(pos.board, pos.from, poolType(), { used: [(p && pos.game.uses?.[p]) || 0, 0], marks: pos.game.marks });
  /** A power or a card shows its marks on a pool piece: not in brush mode, after a removal, a "becomes" or during a chain. */
  const live = (): boolean => poolPiece() && !brush && !pos.gone && !pos.became && !pos.chain;
  const powerLive = (): boolean => !!king && !!armed && live();
  const powerNow = (): Move[] => (powerLive() ? powerMarks(kingPos(), pos.from, king!, armed!) : []);
  /** The armed power adds no mark: the echo. */
  const echo = (): boolean => powerLive() && !powerNow().length;
  /** The coin of power `p` (coinState): its uses spent and left. */
  const coinOf = (p: PowerName) => coinState(kingPos(p), WHITE, kingRules(kingOf(p), p), [], armed === p)!;
  /** The game coin (src/ui/coin.ts) of power `p` as a picture in a button of ours, with "=" on an echo. */
  function coinHtml(p: PowerName): string {
    const c = coinOf(p), b = coinRow(document.createElement('span'), WHITE, c, kingPos(p)).querySelector<HTMLElement>('.coin')!, eq = armed === p && echo();
    return `<span class="coin" data-state="${eq ? 'echo' : c.state}" aria-hidden="true">${b.innerHTML}${eq ? '<span class="echo-eq">=</span>' : ''}</span>`;
  }
  /** A coin's button: a tap arms its power; its words are the game's (coinWords). */
  const coinButton = (p: PowerName, inner = ''): string =>
    `<button type="button" class="pg-coin" data-power="${p}" aria-pressed="${armed === p}" aria-label="${esc(coinWords(coinOf(p), kingPos()).replace(' · ', ', '))}">${coinHtml(p)}${inner}</button>`;
  /** Seats king `k` (seatKing, proving-ground.html:1585): on a pool piece's board he stands where a white king stands, else
   *  on b1, and walks there (kingWalk, :1879). No power is armed yet. */
  function seat(k: KingName): void {
    king = k;
    armed = null;
    seating = false;
    if (poolPiece()) setUp(seated(restored()));
    pos = { ...pos, game: {} };
    render();
    const s = pos.board.findIndex(v => v === piece(K, WHITE));
    if (s < 0 || !poolPiece()) return;
    const b = figBox(s);
    fly(kingArt(k), new DOMRect(b.x + b.width * 2.2, b.y, b.width, b.height), b, GAITS.walk);
    run(boardEl.querySelector(`image[href="${kingArt(k)}"]`), [{ opacity: 0 }, { opacity: 0 }], 320);
  }
  /** A king of the Kings tab opens on the plinth with his powers, and takes his seat (openKing, :1579). The board keeps the open piece. */
  function openKing(k: KingName): void {
    if (kingOpen !== k) opened++;
    brush = row = peek = pick = card = focus = knotAt = why = token = promo = labOpen = null;
    shelfOpen = lifted = ledgeOpen = false;
    kingOpen = k;
    if (king !== k) seat(k); else render();
    run(q('.pg-figure img'), [{ opacity: 0, transform: 'translateY(14px) scale(0.96)' }, {}], 480, EASE);
  }
  /** A tap on a coin (tapPower, :1889): it seats the power's king, then arms the power, or lets it go; with no use left, it says so. */
  function tapPower(p: PowerName): void {
    if (!poolPiece()) return toast('Powers work on the pool pieces for now.', 'lock');
    if (king !== kingOf(p)) seat(kingOf(p));
    if (armed !== p && coinOf(p).left === 0) return toast(`No ${POWER_NAME[p]} uses left.`, 'lock');
    armed = armed === p ? null : p;
    // One power or one card at a time (card mode plays kings with no spendable power).
    if (armed) laid = null;
    why = promo = null;
    render();
    ripple();
  }
  /** The Try board for the laid card: the open pool piece as its own type, the card played or not, and the marks. */
  const labPos = (): Position => enginePos(pos.board, pos.from, poolType(), { used: [pos.game.played ?? 0, 0], marks: pos.game.marks });
  /** The picks of the laid card until it is played (ticket 14): the six of LAY only. */
  const labNow = (): Move[] => (laid && LAY.includes(laid) && !pos.game.played && live() ? cardMarks(labPos(), pos.from, laid) : []);
  /** The king that a Freeze or an Ice Wall may not pick: the king of its targets' side, else -1. */
  const barred = (ms: Move[]): number => (ms[0] && isMarkTag(ms[0].power) ? pos.board.indexOf(piece(K, colorOf(pos.board[ms[0].to]))) : -1);
  /** Plays power move `m` with the engine (makeMove under the king's rules), or the laid card's move: it spends a use (or the
   *  card), and a Freeze leaves its mark. The other side never moves, so the mark stays. With no use left, the power lets go. */
  function usePower(m: Move): void {
    const p = armed, next = p ? playPower(kingPos(), m, king!, p) : playCard(labPos(), m, laid!), to = m.from === pos.from ? m.to : pos.from, b = new Uint8Array(next.board);
    const who = (s: number): string => `the ${colorOf(pos.board[s]) ? 'enemy' : 'your'} ${PIECE[typeOf(pos.board[s])]} on ${sqName(s)}`;
    const said = `${p ? POWER_NAME[p] : cardName(laid!)}: ${isMarkTag(m.power) ? `${who(m.to)}.` : m.captures.length ? `took ${who(m.captures[0])}.` : `moved to ${sqName(m.to)}.`}`;
    b[to] = piece(T, WHITE);
    backs.push(pos);
    pos = { ...pos, board: b, from: to, chain: null, game: { ...pos.game, ...(p ? { uses: { ...pos.game.uses, [p]: next.used?.[0] ?? 0 } } : { played: 1 }), marks: next.marks },
      st: { ...pos.st, captured: pos.st.captured || m.captures.length > 0, move: pos.st.move + (isMarkTag(m.power) ? 0 : 1) } };
    if (p && coinOf(p).left === 0) armed = null;
    toast(said);
    render();
    ripple();
  }
  /** Lays LAB card `c` in the tray's slot (layCard, proving-ground.html:1908): its picks show on the board, and an armed power lets go. */
  function lay(c: CardName): void {
    laid = c;
    laying = false;
    armed = why = promo = null;
    pos = { ...pos, game: { ...pos.game, played: 0 } };
    render();
    ripple();
  }
  /** A card of the Cards tab opens on the plinth and, on a pool piece, goes in the slot (openCard, :1597-1602). The board
   *  keeps the open piece; only the six of LAY have picks (decision 30). */
  function openLab(c: CardName): void {
    if (labOpen !== c) opened++;
    brush = row = peek = pick = card = focus = knotAt = why = token = promo = kingOpen = null;
    shelfOpen = lifted = ledgeOpen = false;
    labOpen = c;
    if (poolPiece() && laid !== c) lay(c); else render();
    run(q('.pg-bigcard'), [{ opacity: 0, transform: 'translateY(14px) scale(0.96)' }, {}], 480, EASE);
  }
  /** A new set-up (a lift, a token, the die, the broom, "Show on"): no move to take back. */
  function setUp(b: Uint8Array, s = pos.from): void {
    pos = { ...pos, board: b, from: s, chain: null };
    backs = [];
    promo = null;
  }
  /** A tap or Enter on a square in look mode: it places the lifted piece or the armed token, or lifts the open piece, or else
   *  opens the square's Why tag (proving-ground.html:1655-1666). */
  function tapSquare(q: string): void {
    const s = parseSq(q);
    tapped = true;
    if (lifted) return place(s);
    if (token) return putToken(s);
    // A tap on a mark of the armed power, or on a pick of the laid card, plays it.
    const lm = labNow(), pm = [...powerNow(), ...lm].find(m => (m.captures[0] ?? m.to) === s);
    if (pm) return usePower(pm);
    if (s === barred(lm)) return toast('Not the king.', 'lock');
    if (s === pos.from && !pos.gone) return lift();
    openWhy(q);
  }
  /** Lifts the open piece; a drag needs no words. */
  function lift(say = true): void {
    lifted = true;
    token = promo = why = null;
    render();
    if (say) toast('Tap a square to place it. Esc puts it back.');
  }
  /** Places the lifted piece on empty square `s` (its own square puts it back); the scene is made again for its new square. */
  function place(s: number): void {
    if (s !== pos.from && pos.board[s]) return toast('Place it on an empty square.');
    lifted = false;
    toastEl.classList.remove('on');
    if (s !== pos.from) {
      const b = new Uint8Array(pos.board);
      b[s] = b[pos.from];
      b[pos.from] = 0;
      setUp(b, s);
    }
    kbd = sqName(s);
    render();
    ripple();
  }
  /** The armed token: a tap on an empty square puts its pawn there, a tap on another piece takes that piece away. */
  function putToken(s: number): void {
    if (s === pos.from && !pos.gone) return;
    const b = new Uint8Array(pos.board);
    b[s] = b[s] ? 0 : piece(P, token === 'enemy' ? BLACK : WHITE);
    setUp(b);
    render();
    ripple();
  }
  /** The board with the piece back on its square as the design, after a removal or a "becomes": for the die, the broom, an edit and Undo. */
  function restored(): Uint8Array {
    const b = new Uint8Array(pos.board);
    b[pos.from] = piece(T, WHITE);
    pos = { ...pos, gone: false, became: 0 };
    return b;
  }
  /** The moves of one action of the open tag's square: a "becomes" asks which piece, else it plays the move. */
  function playOne(ms: Move[]): void {
    if (ms.length > 1 && ms.every(m => m.promo)) { promo = ms; render(); return; }
    play(ms[0]);
  }
  /** Plays `m` with the engine (makeMove, as boardAfter does), White each time: the other side never moves. A chain's next
   *  take removes only its new piece; after a take the chain goes on while a longer move of the turn starts with its takes. */
  function play(m: Move): void {
    const fresh = m.captures.slice(pos.chain?.caps.length ?? 0), all = pos.chain?.more ?? movesOf(now(), pos.board, pos.from, pos.st);
    const who = (s: number): string => `${colorOf(pos.board[s]) ? 'enemy' : 'your'} ${PIECE[typeOf(pos.board[s])]}`;
    const said = m.shove ? `Pushed the ${who(m.shove.from)} from ${sqName(m.shove.from)} to ${sqName(m.shove.to)}.` : m.swap ? `Swapped places with the ${who(m.to)} on ${sqName(m.to)}.`
      : fresh.length ? `${actOf(m) === 'shot' ? 'Shot' : 'Took'} the ${fresh.map(s => `${who(s)} on ${sqName(s)}`).join(' and the ')}.` : `Moved to ${sqName(m.to)}.`;
    const was = pos.from, src = boardEl.querySelector('[data-open]')?.getAttribute('href'), taken = fresh.map(s => [s, pieceArt(typeOf(pos.board[s]), colorOf(pos.board[s]) === BLACK)] as const);
    const board = makeMove({ board: pos.board, turn: WHITE, halfmove: 0, ply: 0 }, { ...m, from: pos.from, captures: fresh }).board;
    const more = m.selfRemove || m.promo || !fresh.length || m.to === m.from ? [] : all.filter(x => x.captures.length > m.captures.length && m.captures.every((c, i) => x.captures[i] === c));
    backs.push(pos);
    pos = {
      board, from: m.to, gone: !!m.selfRemove, became: m.promo ?? pos.became, chain: more.length ? { caps: m.captures, more } : null, game: pos.game,
      st: { ...pos.st, captured: pos.st.captured || m.captures.length > 0, move: pos.st.move + (more.length ? 0 : 1) },
    };
    promo = null;
    toast(`${said}${m.promo ? ` It became a ${PIECE[m.promo]}.` : ''}${m.selfRemove ? ' It is removed too.' : ''}${more.length ? ' It may take again, or Finish.' : ''}`);
    render();
    // Move here (doMoveHere, :1700-1725): the piece goes by its gait; a taken piece, and a piece removed too, goes in a puff.
    const flies = !!src && m.to !== was && !m.swap;
    if (flies) { fly(src, figBox(was), figBox(m.to), gaitOf(cur.d), !!m.selfRemove); land(); } else if (src && m.selfRemove) puff(src, was, 0);
    for (const [s, art] of taken) if (art) puff(art, s, flies ? 320 : 0);
  }
  /** The foot of the Why tag on square `q` (proving-ground.html:1346-1352): the "becomes" choice; else a button for each
   *  action that a tap there plays (two actions ask which one), "Put an enemy here" on an empty take, "Show on <square>"
   *  on an asleep mark, Finish during a chain, and Take back after a move. */
  function footHtml(q: string): string {
    if (promo) return `<p class="why-ask">It becomes which piece?</p><div class="why-act">${promo.map((m, i) => `<button type="button" class="quiet" data-promo="${i}">${pieceIcon(m.promo!)}${cap(PIECE[m.promo!])}</button>`).join('')}</div>`;
    const acts = [...new Set(movesAt(q).map(actOf))], m = sc.marks.find(x => x.sq === q && !x.on && x.diff !== '-');
    const asleep = m?.cond === 'asleep' && m.by ? canonical(now()).rules[m.by[0]] : undefined, wake = asleep && !pos.gone ? wakeSquare(board, from, asleep, st) : null;
    const h = acts.map((a, i) => `<button type="button" class="${i ? 'quiet' : 'primary'}" data-try="${a}">${ACT[a]}</button>`).join('')
      + (!acts.length && !pos.gone && (m?.k === 'take' || m?.k === 'shot') && !m.cond && !board[parseSq(q)]
        ? `<button type="button" class="quiet ghost-enemy" data-act="putenemy"><img src="${esc(pieceArt(P, true) ?? '')}" alt="">Put an enemy here</button>` : '')
      + (wake !== null ? `<button type="button" class="quiet" data-act="showon" data-on="${sqName(wake)}">Show on ${sqName(wake)}</button>` : '')
      + (pos.chain ? '<button type="button" class="primary" data-act="finish">Finish</button>' : '')
      + (backs.length ? '<button type="button" class="quiet" data-act="takeback">Take back</button>' : '');
    return h ? `<div class="why-act">${h}</div>` : '';
  }
  /** "Show on": the piece goes to the square that wakes the asleep mark's rule, and the tag opens on that mark there. */
  function showOn(to: number): void {
    const s = parseSq(why!), b = new Uint8Array(pos.board), at = step(to, file(s) - file(pos.from), rank(s) - rank(pos.from));
    b[to] = b[pos.from];
    b[pos.from] = 0;
    setUp(b, to);
    why = at >= 0 ? sqName(at) : null;
    kbd = why ?? sqName(to);
    render();
    ripple();
  }
  /** The tray (renderTray, :1369-1396): the Friend and Enemy tokens, the eye, the die, the broom, and the move number or the
   *  card only when a rule reads them (decision 24). On the desktop and in short landscape it stands at the foot of the right
   *  column in look mode, less on the first open of a pool piece before an edit; on the phone, in the ledge's Board tab. */
  function renderTray(): void {
    const phone = upright(), on = phone ? tab === 'board' : !brush && !shelfOpen && (opened > 1 || edited || !cur.key.startsWith('piece:')), reads = (...w: When['on'][]) => cur.d.rules.some(r => w.includes(r.when.on));
    (phone ? boardTabEl : q('.pg-right')).append(trayEl);
    trayEl.hidden = !on;
    const tok = (k: 'friend' | 'enemy', words: string): string => `<button type="button" class="tok" data-tok="${k}" aria-pressed="${token === k}" aria-label="${cap(k)}" title="${words}">`
      + `<img class="fig" src="${esc(pieceArt(P, k === 'enemy') ?? '')}" alt=""><span class="base"></span></button>`;
    // The King socket (ticket 13; renderTray, :1374-1391): on a copy or a new piece it says that powers wait; empty, it opens
    // SEAT A KING; with a king, his figure (a tap seats another) and his two coins. An armed power that adds nothing is an echo.
    const empty = `<span class="sockc"><img src="${import.meta.env.BASE_URL}ui/emblems/spirit.webp" alt=""></span>`;
    // The card slot (ticket 14; :1383-1384) waits on a copy or a new piece too; else it opens LAY A LAB CARD.
    const slot = `<button type="button" class="tok cardslot${laid && poolPiece() ? ' on' : ''}" ${poolPiece() ? `data-act="lay" aria-expanded="${laying}"` : 'data-act="nocard" aria-disabled="true"'} title="Card: lay a LAB card"`
      + ` aria-label="${!poolPiece() ? 'Card. Cards work on the pool pieces for now.' : laid ? `${cardName(laid)} card (LAB): lay another` : 'Card: lay a LAB card'}"><span class="cs${laid ? ' filled' : ''}"${laid ? ` style="background-image:url(${cardArt(laid)})"` : ''}><i></i></span></button>`;
    const socket = !poolPiece() ? `<button type="button" class="tok pg-socket" data-act="nosocket" aria-disabled="true" aria-label="King. Powers work on the pool pieces for now.">${empty}</button>${slot}<span class="pg-kingnote">Powers work on the pool pieces for now.</span>`
      : !king ? `<button type="button" class="tok pg-socket" data-act="seat" aria-expanded="${seating}" aria-label="King: seat a king and his powers" title="King: seat a king and his powers">${empty}</button>${slot}`
      : `<span class="tok kingseat"><button type="button" class="pg-kingfig" data-act="seat" aria-expanded="${seating}" aria-label="${king} king: seat another king" title="${king} king"><img src="${kingArt(king)}" alt=""></button>`
        + `<span class="coins">${KINGS[king].map(p => coinButton(p)).join('')}</span></span>${slot}`;
    trayEl.innerHTML = !on ? '' : `<h3 id="pg-tray-h">Try with</h3>`
      + (echo() ? `<p class="echo-note"><span class="echo-eq" aria-hidden="true">=</span> ${POWER_NAME[armed!]} adds nothing to the ${esc(cur.d.name)}. No mark changes.</p>` : '')
      + `<div class="tokens">${tok('friend', 'Friend: one of your pieces')}${tok('enemy', 'Enemy: tap, then tap a square')}${socket}</div>`
      + (seating ? `<div class="picker" role="group" aria-labelledby="pg-seat-h"><h4 id="pg-seat-h">SEAT A KING</h4><div class="row">${KING_LIST.map(k => `<button type="button" data-seat="${k}" aria-pressed="${king === k}"><img src="${kingArt(k)}" alt="">${k}</button>`).join('')}</div></div>` : '')
      + (laying ? `<div class="picker" role="group" aria-labelledby="pg-lay-h"><h4 id="pg-lay-h">LAY A LAB CARD</h4><div class="row">${LAY.map(c => `<button type="button" data-lay="${c}" aria-pressed="${laid === c}">`
        + `<span class="mini-card lab-host" style="background-image:url(${cardArt(c)})"><i></i></span>${cardName(c)}</button>`).join('')}</div></div>` : '')
      + `<div class="trow2"><button type="button" data-act="threats" aria-pressed="${threats}" aria-label="Threats" title="Threats: what can hit your piece">${sigil('eye', 22)}</button>`
      + `<button type="button" data-act="stir" aria-label="Stir" title="Stir: another board">${sigil('die', 22)}</button>`
      + `<button type="button" data-act="clear" aria-label="Clear" title="Clear: the piece alone">${sigil('broom', 22)}</button>`
      + (pos.game.played && backs.length ? '<button type="button" class="quiet tb" data-act="takeback">Take back</button>' : '')
      + (reads('fromMove', 'beforeMove') ? `<span class="pg-moven">Move ${pos.st.move}</span><button type="button" class="pg-plus" data-act="plus5">+5 moves</button>` : '') + '</div>'
      + (reads('afterCard') ? `<label class="pg-cardon"><input type="checkbox" data-cardon${pos.st.card ? ' checked' : ''}>Pretend your opponent played a card</label>` : '');
  }

  /* ---- the right column: the brushes (also the key), the tools, the hint, the live key row (renderBrushes, renderTools and keyKinds, :1184-1216, :1283-1295) ---- */

  function renderRight(): void {
    const phone = narrow.matches;
    // An open king's words take the place of the brushes (renderInfo, proving-ground.html:1106-1117): each power with its
    // coin and its line; a tap arms it. The phone shows the board only (the mockup's phone state kings).
    brushesEl.classList.toggle('pg-powers', !!(kingOpen || labOpen) && !brush);
    // An open card's words (renderInfo, :1118-1123): the LAB note, its king for a power card, its second form, and what to do.
    if (labOpen && !brush) {
      const c = labOpen, twin = c in USES_RULE ? kingOf(c as PowerName) : null, b = SECOND[c];
      brushesEl.innerHTML = phone ? '' : '<p class="lab-note"><i>LAB</i>Test deck. Not in the game.</p>'
        + (twin ? `<h4 class="info-h">Also a king's power</h4><p class="twin"><button type="button" data-twin="${twin}" aria-label="Open the ${twin} king">${coinHtml(c as PowerName)}</button>${POWER_NAME[c as PowerName]}, a power of the ${twin} king.</p>` : '')
        + (b ? `<h4 class="info-h">Second form</h4><p class="variant"><b>${cardName(b)}</b>${esc(cardWords(b))}.</p>` : '')
        + `<p class="info-p">${!LAY.includes(c) ? 'No test board for this card yet.' : !poolPiece() ? 'Cards work on the pool pieces for now.' : laid !== c ? 'Lay it from the card slot.'
          : labNow().length ? 'Tap a blue ring on the board.' : pos.game.played ? `${cardName(c)} is played.` : `${cardName(c)} has no target on this board.`}</p>`;
    } else if (kingOpen && !brush) brushesEl.innerHTML = phone ? '' : KINGS[kingOpen].map(p => `<button type="button" class="pline" data-power="${p}" aria-pressed="${poolPiece() && king === kingOpen && armed === p}"${poolPiece() ? '' : ' aria-disabled="true"'}>`
      + `${coinHtml(p)}<span><b>${POWER_NAME[p]}</b><span class="pt">${esc(cap(powerText(p, kingRules(kingOpen!, p), true)))}.</span></span></button>`).join('');
    else brushesEl.innerHTML = BRUSHES.map(([k, w], i) => `<button type="button" class="brush${brush === k ? ' armed' : ''}" data-brush="${k}" aria-pressed="${brush === k}" title="${NAMES[k]}. Tap to paint (${i + 1})">`
      + `<span class="tile">${tile(k, phone ? 40 : 80)}</span><span class="w">${w}</span></button>`).join('') + (phone && brush ? `<span class="phint">Tap a square.</span><button type="button" class="pg-moretools" data-act="tools" aria-label="More tools" aria-expanded="${toolsOpen}">⋯</button>` : '');
    toolsEl.hidden = !brush || (phone && !toolsOpen);
    toolsEl.innerHTML = !brush ? '' : `<button type="button" class="tool" data-brush="shot" aria-pressed="${brush === 'shot'}" title="Shot: takes from where it stands"><span class="tb">${tile('shot', 44)}</span><small>Shot</small></button>`
      + `<button type="button" class="tool" data-brush="erase" aria-pressed="${brush === 'erase'}" title="Eraser"><span class="tb">${sigil('eraser', 24)}</span><small>Eraser</small></button>`
      + `<button type="button" class="tool" data-act="mirror" aria-label="Paint on: ${MIRROR[mirror]}"><span class="tb">${mirrorIcon(mirror)}</span><small>${MIRROR[mirror]}</small></button>`
      + '<button type="button" class="pg-done" data-act="done">Done</button>';
    hintEl.textContent = brush && !phone ? (brush === 'erase' ? 'Tap a square to clear it.' : 'Tap a square to paint it.') : '';
    const kinds = new Map<string, [string, string]>();
    const add = (k: string, svg: () => string, w: string): void => { if (!kinds.has(k)) kinds.set(k, [svg(), w]); };
    for (const m of sc.marks) {
      if (m.diff === '-') continue;
      if (m.cond === 'asleep') add('asleep', () => tile('move', 36, { cond: 'asleep' }), NAMES.asleep);
      else if (m.cond) add('cond', () => tile('move', 36, { cond: 'awake' }), NAMES.cond);
      else if (m.k.startsWith('blocked')) add('blocked', () => tile(m.k, 36), 'Blocked by a rule');
      else if (m.k === 'shot' || m.k === 'moveshot') add(m.k, () => tile(m.k, 36), NAMES[m.k]);
    }
    if (sc.rails.length) add('line', () => tile('move', 36, { rail: 'e' }), NAMES.line);
    if (sc.arches.some(a => !a.power)) add('arch', () => effect('arch', 36), NAMES.arch);
    if (sc.marks.some(m => m.power)) add('power', () => tile('move', 36, { power: true }), "King's power");
    if (sc.impressions.some(im => im.list.some(x => x.a === 'removedAfter'))) add('removed', () => impression('removedAfter', 26), NAMES.removed);
    for (const e of sc.effects) {
      if (e.k === 'push' || e.k === 'swap') add(e.k, () => effect(e.k as 'push' | 'swap', 36), NAMES[e.k]);
      else if (e.k === 'becomes') add(e.k, () => impression('becomes', 26), NAMES.becomes);
      else if (e.k === 'threat') { const k = e.stopped ? 'tstop' : 'threat'; add(k, () => effect(k, 36), NAMES[k]); }
      else if (e.k === 'frost') add('frost', () => effect('frost', 36), 'Frozen');
      else if (e.k === 'rune' && !e.barred) add('rune', () => effect('rune', 36), 'LAB card pick');
    }
    keyEl.innerHTML = phone || brush ? '' : [...kinds].slice(0, 6).map(([k, [svg, w]]) => `<span class="k" title="${w}">${svg}<span>${SHORT[k]}</span></span>`).join('');
  }

  /* ---- the ledge: the Pieces tab, and on the phone the Board tab with the tray (renderLedge and slotHTML, :1435-1486);
     in short landscape a sheet from Pieces in the top bar, with the Pieces tab only ---- */

  function renderLedge(): void {
    if (!narrow.matches && tab === 'board') tab = 'pieces';
    const t = upright() || tab !== 'board' ? tab : 'pieces', tabs: [typeof tab, string][] = [['pieces', 'Pieces'], ['kings', 'Kings'], ['cards', 'Cards'], ...(upright() ? [['board', 'Board'] as [typeof tab, string]] : [])];
    // While the sheet shows, the board and the column under it leave the Tab order and take no taps (a tap there closes it).
    ledgeEl.hidden = short.matches && !ledgeOpen;
    q('.pg-main').inert = short.matches && ledgeOpen;
    q('.pg-pieces').setAttribute('aria-expanded', `${ledgeOpen}`);
    tabsEl.innerHTML = tabs.map(([k, w]) => `<button type="button" class="ltab${t === k ? ' on' : ''}" role="tab" id="pg-tab-${k}" data-tab="${k}" aria-selected="${t === k}" aria-controls="pg-${k === 'board' ? 'boardtab' : 'row'}">${w}${k === 'cards' ? ' <span class="lab" title="A test deck. Not in the game.">LAB</span>' : ''}</button>`).join('');
    rowEl.hidden = t === 'board';
    rowEl.setAttribute('aria-labelledby', `pg-tab-${t}`);
    boardTabEl.hidden = t !== 'board';
    slotsEl.classList.toggle('lip', t !== 'cards');
    // The Cards tab (renderLedge, :1459-1465): the cards with art make a fan; the others wait in a stack, which a tap spreads.
    if (t === 'cards') {
      const rest = DECK.filter(c => !ART.includes(c)), face = (c: CardName): string => `<button type="button" class="cface lab-host${labOpen === c ? ' open' : ''}" data-lab="${c}"${labOpen === c ? ' aria-current="true"' : ''} aria-label="${cardName(c)} (LAB)">`
        + `<img class="art" src="${cardArt(c)}" alt=""><span class="t">${cardName(c)}</span>${c in USES_RULE ? `<span class="badge"><img src="${import.meta.env.BASE_URL}ui/emblems/${kingOf(c as PowerName).toLowerCase()}.webp" alt=""></span>` : ''}<span class="lab-ribbon" aria-hidden="true">LAB</span></button>`;
      slotsEl.innerHTML = `<div class="cfan">${(spread ? rest : ART).map(face).join('')}</div>` + (spread ? '<button type="button" class="quiet cback" data-act="cardsback">‹ Back</button>'
        : `<button type="button" class="cstack" data-act="cardsall" aria-label="${rest.length} more cards"><span class="c"></span><span class="c"></span><span class="c"></span><b>+${rest.length}</b></button>`);
      return;
    }
    // The Kings tab: the six kings (renderLedge, proving-ground.html:1455-1457).
    if (t === 'kings') {
      slotsEl.innerHTML = KING_LIST.map(k => `<button type="button" class="slot${kingOpen === k ? ' open' : ''}" data-king="${k}"${kingOpen === k ? ' aria-current="true"' : ''}>`
        + `<img class="fig" src="${kingArt(k)}" alt=""><span class="nm">${k}</span></button>`).join('');
      return;
    }
    const slot = (attr: string, key: string, d: PieceDesign, yours: boolean): string => {
      const open = cur.key === key;
      return `<button type="button" class="slot${open ? ' open' : ''}" ${attr}${open ? ' aria-current="true"' : ''}><img class="fig" src="${esc(figureOf(d))}" alt="">`
        + `${yours ? `<span class="qt">${sigil('quill', 16)}</span>` : ''}<span class="nm">${esc(d.name || 'Piece')}</span></button>`;
    };
    slotsEl.innerHTML = PRESETS.map(p => slot(`data-piece="${p.key}"`, `piece:${p.key}`, pool(p.key).d, false)).join('')
      + (shelf.length ? '<span class="lsep" aria-hidden="true"></span><span class="lhead">Yours</span>' : '')
      + shelf.map(d => slot(`data-design="${esc(d.id)}"`, `design:${d.id}`, d, true)).join('')
      // NEW at the end of the row (proving-ground.html:1453).
      + `<button type="button" class="slot newtile${cur.key === 'new' ? ' open' : ''}"${cur.key === 'new' ? ' aria-current="true"' : ''} aria-label="New piece" title="Make a new piece">`
      + `<span class="ghostfig">${GHOST}</span><span class="nm">New</span></button>`;
  }
  /** Short landscape: Esc, Pieces or a tap outside the ledge's sheet closes it, and the focus goes back to Pieces. */
  function closeLedge(): void {
    ledgeOpen = false;
    render();
    q<HTMLElement>('.pg-pieces').focus({ preventScroll: true });
  }
  const revealOpenSlot = (): void => {
    const open = q<HTMLElement>('.slot.open');
    if (open) rowEl.scrollLeft = Math.max(0, open.offsetLeft - rowEl.clientWidth / 2 + open.offsetWidth / 2);
  };
  slotsEl.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.slot');
    if (!b) return;
    const d = shelf.find(x => x.id === b.dataset.design);
    if (b.dataset.king) openKing(b.dataset.king as KingName);
    else if (b.matches('.newtile')) newPiece(); else show(d ? { key: `design:${d.id}`, d, yours: true } : pool(b.dataset.piece!));
    if (!b.dataset.king) arrive();
    // renderLedge replaced the slot: give the focus to its new copy, with no scroll away from the board. In short landscape
    // the choice closed the sheet (show): the focus goes back to Pieces.
    q<HTMLElement>(short.matches ? '.pg-pieces' : '.slot.open').focus({ preventScroll: true });
  });
  /** Hover or focus on a ledge figure shows its reach in a 96 px diagram over it; the wide layout only (showReach, proving-ground.html:1487-1497). */
  const reach = (t: EventTarget | null): void => {
    const b = t instanceof Element ? t.closest<HTMLElement>('.slot[data-piece], .slot[data-design]') : null;
    const d = b && !narrow.matches ? (b.dataset.piece ? pool(b.dataset.piece).d : shelf.find(x => x.id === b.dataset.design)) : undefined;
    reachEl.classList.toggle('on', !!d);
    if (!d) return;
    const r = b!.getBoundingClientRect();
    reachEl.innerHTML = diagram(d, { s: 96 / 7, cells: true });
    Object.assign(reachEl.style, { left: `${r.left + r.width / 2 - 54}px`, top: `${r.top - 116}px` });
  };
  slotsEl.addEventListener('pointerover', e => reach(e.target));
  slotsEl.addEventListener('pointerleave', () => reach(null));
  slotsEl.addEventListener('focusin', e => reach(e.target));
  slotsEl.addEventListener('focusout', () => reach(null));

  /** The scene of the open design on its board, or of the design under preview (a choice that has the pointer or the
   *  focus, or the shelf's new rule), with `pv` on each part that the preview adds (`sceneOf` of both). Then the board and the right column. */
  function drawScene(): void {
    // In brush mode the design stands alone on d4; in look mode it stands on the board of Try with. A copy shows its paint diff against its pool piece.
    ({ board, from, st } = brush ? { board: boardOf(examplesOf({ from: [] })), from: parseSq('d4'), st: START } : pos);
    const of = (d: PieceDesign): Scene => (d.from[0] ? diffOf(d, presetOf(d.from[0]), board, from, st) : sceneOf(d, board, from, st));
    const next = peek ?? (shelfOpen && pick && !notNow(pick) ? { ...cur.d, rules: [...cur.d.rules, blockOf(pick).rule] } : null);
    // The knots belong to the design: they come from its example board, so a lift or a move keeps them (the mockup's asleep-b4).
    const home = examplesOf(cur.d);
    sc = { ...of(cur.d), knots: traceOf(cur.d, boardOf(home), parseSq(home[0].sq)).knots };
    added = 0;
    if (!brush && (pos.became || pos.chain || pos.gone)) {
      // After a "becomes" the piece moves as that piece. A chain in progress shows only its next takes, from the chain itself:
      // the scene of the new square may not have them (a When that held at the start). A removed piece shows none, and no piece is open.
      const knots = sc.knots;
      sc = { ...(pos.became ? sceneOf(now(), board, from, st) : sc), knots };
      if (!pos.became) sc = { ...sc, pieces: piecesOf(board, pos.gone ? -1 : from), marks: movesNow().map(m => ({ sq: sqName(m.to), k: 'take' })), rails: [], arches: [], effects: [], impressions: [] };
    }
    if (next) {
      // A part is new when it differs in more than its rule numbers (`by`); the knots stay those of the rule lines on the plinth.
      const key = (x: object): string => JSON.stringify(x, (k, v) => (k === 'by' ? undefined : v)), was = new Set(Object.values(sc).flat().map(key));
      sc = { ...of(next), knots: sc.knots };
      for (const x of [...sc.marks, ...sc.rails, ...sc.arches, ...sc.effects]) if (!was.has(key(x))) { x.pv = true; added++; }
      // The zone of the previewed When shows in chalk (proving-ground.html:1147).
      for (const z of sc.chalk) if (!was.has(key(z))) z.pv = true;
    }
    if (!brush && !next) {
      // The armed power's marks take the place of the marks on their squares; its arch takes the place of the line that a
      // passed piece stops. A Freeze mark shows frost with its turns left (ticket 13).
      const pm = powerNow(), l = king && pm.length ? powerLayer(pm, board, from, king.toLowerCase()) : null, at = new Set(l?.marks.map(m => m.sq));
      if (l) sc = { ...sc, marks: [...sc.marks.filter(m => !at.has(m.sq)), ...l.marks], arches: [...sc.arches, ...l.arches], rails: [...sc.rails.filter(r => !(r.end === 'stop' && l.arches.some(a => a.over === r.to))), ...l.rails] };
      for (const mk of pos.game.marks ?? []) if (mk && board[mk.sq]) sc.effects.push({ k: 'frost', sq: sqName(mk.sq), turns: mk.left ?? 1 });
      // The laid card's picks are runes, barred on the king that it may not pick (ticket 14).
      const lm = labNow(), no = barred(lm);
      for (const m of lm) sc.effects.push({ k: 'rune', sq: sqName(m.captures[0] ?? m.to) });
      if (no >= 0) sc.effects.push({ k: 'rune', sq: sqName(no), barred: true });
    }
    if (brush) {
      // The reach ends 3 squares out: a line shows 3 squares, then its arrow (designScene, proving-ground.html:781-797).
      sc.marks = sc.marks.filter(m => !out(m.sq));
      sc.impressions = sc.impressions.filter(m => !out(m.sq));
      for (const r of sc.rails) if (out(r.to)) { const t = parseSq(r.to); r.to = sqName(sq(3 + 3 * Math.sign(file(t) - 3), 3 + 3 * Math.sign(rank(t) - 3))); r.end = 'arrow'; }
    } else if (threats && !pos.gone) sc.effects.push(...threatsOf(now(), board, from, st));
    drawBoard();
    renderHits();
    renderPaint();
    renderRight();
  }
  /** Draws everything for the open item. A control that a part replaced gets the focus back (the card box has an empty value). */
  function render(): void {
    const a = document.activeElement as HTMLElement | null;
    const keep = ['brush', 'act', 'nub', 'piece', 'design', 'pill', 'when', 'choice', 'sealitem', 'seal', 'rm', 'tok', 'tab', 'try', 'promo', 'cardon', 'figure', 'king', 'power', 'seat', 'lay', 'lab', 'twin']
      .map(k => a?.dataset?.[k] !== undefined && `[data-${k}="${a.dataset[k]}"]`).find(Boolean);
    // A row or a card of a rule that is gone closes.
    if (row && !ruleIn(cur.d, row.a)) row = null;
    if (card && !ruleIn(cur.d, card)) card = row = null;
    renderTop();
    drawScene();
    renderPlinth();
    renderShelf();
    renderLedge();
    renderTray();
    // With a laid card the plaque turns burgundy: "LAB card" (proving-ground.html:1177-1179).
    const lab = !!laid && poolPiece();
    q('.pg-plaque').hidden = !plaqueOn() && !lab;
    q('.pg-plaque').innerHTML = lab ? `<span class="plaque lab" title="A test card. It is not in the game.">${sigil('card', 13)}LAB card</span>` : plaque();
    drawAlert();
    renderWhy();
    // A short right column has no room for the tray under the tag: the tray waits until the tag closes.
    const col = q('.pg-right');
    if (why && !narrow.matches && col.scrollHeight > col.clientHeight) trayEl.hidden = true;
    if (keep && !dlg.contains(document.activeElement)) (q<HTMLElement>(keep) ?? q<HTMLElement>('.pg-brushes button'))?.focus({ preventScroll: true });
  }
  /** Opens `item` on the plinth and the board, in look mode. On a short screen the narrow layout scrolls: go back to the top, to the board. */
  function show(item: Item): void {
    if (item.key !== cur.key) undos = [];
    // NEW is not an item to look around: it does not count as an open (S.opened, proving-ground.html:2008).
    if (item.key !== 'new' && (!opened || item.key !== cur.key)) opened++;
    cur = item;
    brush = row = peek = pick = card = focus = hover = knotAt = why = token = promo = kingOpen = labOpen = null;
    weighOpen = moreOpen = toolsOpen = shelfOpen = lifted = ledgeOpen = seating = laying = false;
    // A design with no pool piece paints with Mirror (the mockup's S0).
    mirror = item.d.from[0] ? presetOf(item.d.from[0]).paintOn : 'lr';
    const pieces = examplesOf(item.d);
    // The seated king stays: he stands on the board of a pool piece (ticket 13).
    pos = { board: king && item.key.startsWith('piece:') ? seated(boardOf(pieces)) : boardOf(pieces), from: parseSq(pieces[0].sq), st: START, gone: false, chain: null, became: 0, game: {} };
    backs = [];
    // The eye starts on for a piece that a rule keeps safe (the Guard, proving-ground.html:1564).
    threats = !!ruleIn(item.d, 'cannotBeTaken');
    kbd = pieces[0].sq;
    dlg.scrollTop = 0;
    render();
  }
  new ResizeObserver(() => { if (fieldEl.clientWidth / 8 !== drawnAt) drawBoard(); placePointer(); }).observe(fieldEl);
  new ResizeObserver(placeKnots).observe(plinthEl);
  // A resize sends no pointer event in WebKit: the popover of the wide layout hides here.
  narrow.addEventListener('change', () => { row = peek = card = null; reach(null); if (dlg.open) render(); });
  // A turn of the phone moves the tray and the ledge (renderTray, renderLedge); the design, the brush, the tag and the shelf stay.
  short.addEventListener('change', () => { ledgeOpen = false; if (dlg.open) render(); });
  // With the ledge's sheet open, ‹ Menu is a tap outside it: it closes the sheet only.
  q<HTMLButtonElement>('.pg-menu').onclick = () => (ledgeOpen ? closeLedge() : dlg.close());

  dlg.addEventListener('click', e => {
    // A tap outside the ledge's sheet closes it, and does nothing else.
    if (ledgeOpen && !(e.target as Element).closest('.pg-ledge, [data-act="pieces"]')) return closeLedge();
    const t = (e.target as Element).closest<HTMLElement>('[data-act], [data-brush], [data-nub], .pg-hits .sq, [data-pill], [data-when], [data-choice], [data-sealitem], [data-rm], [data-tok], [data-tab], [data-try], [data-promo], [data-figure], [data-power], [data-seat], [data-lay], [data-lab], [data-twin]');
    if (!t) { if (moreOpen) { moreOpen = false; renderTop(); } return; }
    const { sq: at, nub: l, brush: b, pill: pa, when: wa, choice, sealitem: sa, rm, tok, tab: tb, try: tr, promo: pr, figure, power, seat: k, lay: lc, lab: oc, twin } = t.dataset;
    if (figure) return void change('look', d => { d.look.figure = figure; });
    if (power) return tapPower(power as PowerName);
    if (k) { seat(k as KingName); return q<HTMLElement>('[data-act="seat"]')?.focus(); }
    if (lc) { lay(lc as CardName); return q<HTMLElement>('[data-act="lay"]')?.focus(); }
    if (oc) { openLab(oc as CardName); return q<HTMLElement>('.cface.open')?.focus({ preventScroll: true }); }
    if (twin) { tab = 'kings'; return openKing(twin as KingName); }
    if (at) { if (brush) paint(at); else tapSquare(at); return; }
    if (tok) {
      token = token === tok ? null : tok as 'friend' | 'enemy';
      lifted = false;
      render();
      if (token) toast(`Tap a square to put a ${tok === 'friend' ? 'white' : 'black'} pawn there, or tap a piece to take it away.`);
      return;
    }
    // A new tab starts at the left of its row, with the open slot in view.
    if (tb) { tab = tb as typeof tab; render(); rowEl.scrollLeft = 0; return revealOpenSlot(); }
    if (tr) return playOne(movesAt(why!).filter(m => actOf(m) === tr));
    if (pr) return play(promo![+pr]);
    if (l) return toggleLine(l as Dir);
    if (b) return arm(b as Brush);
    if (pa || wa) return toggleRow((pa ?? wa) as Ability['a'], !!wa);
    if (choice) return choose(choice);
    // A chosen seal pulses once (:331).
    if (sa) { pick = sa as Ability['a']; render(); return run(q(`[data-sealitem="${sa}"] .kd-seal`), [{ opacity: 0.55, offset: 0.5 }], 400, 'ease-in-out'); }
    if (rm) return removeRule(rm as Ability['a']);
    const act = t.dataset.act;
    if (act === 'shelf') return openShelf();
    if (act === 'closeshelf') return closeShelf();
    if (act === 'closecard') return closeCard();
    if (act === 'closewhy') return closeWhy();
    if (act === 'stamp') return stamp();
    if (act === 'threats') { threats = !threats; return render(); }
    if (act === 'seat') { seating = !seating; laying = false; return render(); }
    if (act === 'lay') { laying = !laying; seating = false; return render(); }
    if (act === 'nosocket') return toast('Powers work on the pool pieces for now.', 'lock');
    if (act === 'nocard') return toast('Cards work on the pool pieces for now.', 'lock');
    if (act === 'cardsall' || act === 'cardsback') { spread = act === 'cardsall'; render(); rowEl.scrollLeft = 0; return q<HTMLElement>(spread ? '.cface' : '.cstack').focus({ preventScroll: true }); }
    if (act === 'stir' || act === 'clear') {
      // The seated king stays on the board; the Freeze marks go with the old enemies.
      const b = act === 'stir' ? stir(restored(), pos.from, Math.random) : clear(restored(), pos.from);
      setUp(king && poolPiece() ? seated(b) : b);
      pos = { ...pos, game: { uses: pos.game.uses } };
      why = null;
      render();
      return ripple();
    }
    if (act === 'plus5') { pos = { ...pos, st: { ...pos.st, move: pos.st.move + 5 } }; return render(); }
    if (act === 'putenemy') { const b = new Uint8Array(pos.board); b[parseSq(why!)] = piece(P, BLACK); setUp(b); render(); return ripple(); }
    if (act === 'showon') return showOn(parseSq(t.dataset.on!));
    if (act === 'finish') { pos = { ...pos, chain: null, st: { ...pos.st, move: pos.st.move + 1 } }; return render(); }
    if (act === 'takeback') { pos = backs.pop() ?? pos; promo = null; return render(); }
    if (act === 'morewhen') {
      row!.more = true;
      const n = whenChoices(row!.a).top.length;
      render();
      // The focus goes to the first of the choices that "More choices" shows.
      return q('.choices').querySelectorAll<HTMLElement>('button, select')[n]?.focus();
    }
    if (act === 'pieces') {
      if (ledgeOpen) return closeLedge();
      ledgeOpen = true;
      render();
      revealOpenSlot();
      return (q<HTMLElement>('.slot.open') ?? q<HTMLElement>('.slot')).focus({ preventScroll: true });
    }
    if (act === 'more' || act === 'tools' || act === 'mirror') {
      if (act === 'more') moreOpen = !moreOpen;
      if (act === 'tools') toolsOpen = !toolsOpen;
      if (act === 'mirror') mirror = ({ lr: 'all', all: 'one', one: 'lr' } as const)[mirror];
      return render();
    }
    moreOpen = false;
    // A choice in the ⋯ menu closes it and gives the focus back to ⋯.
    if (moreEl.contains(t)) { renderTop(); q<HTMLElement>('.pg-more').focus(); }
    if (act === 'undo') return undo();
    if (act === 'share') return share();
    if (act === 'rename') return rename();
    if (act === 'looks') return looks();
    if (act === 'astext') return void (shareable() && copyText(designText(cur.d, judge(cur.d, false), link(cur.d)), 'Copied as text.'));
    if (act === 'copydesign') return makeCopy();
    if (act === 'delete') return remove();
    if (act === 'done') return leave();
    if (act === 'room') return makeRoom();
    if (act === 'copy') return void copyText(link(cur.d), 'Link copied.');
    if (act === 'retry') { save(); render(); if (!unsaved) toast('Saved on this device.'); return; }
    // Weigh: a popover in the name band; on the phone, from the ⋯ menu, a toast (proving-ground.html:1993).
    if (act === 'weigh' && narrow.matches) return toast(weighWords().join(' ').trim());
    if (act === 'weigh') { weighOpen = !weighOpen; render(); }
  });
  // A choice that has the pointer or the focus: the board previews it (previewPill, proving-ground.html:1866, :2084-2085).
  const peekAt = (t: EventTarget | null): void => {
    const v = (t as Element | null)?.closest?.<HTMLElement>('.choices [data-choice]')?.dataset.choice, c = v && row ? choicesOf().find(x => x.v === v) : undefined;
    const d = c && !c.on && !c.off ? tried(c.apply) : null;
    if (!same(d, peek)) { peek = d; drawScene(); }
  };
  dlg.addEventListener('pointerover', e => peekAt(e.target));
  dlg.addEventListener('focusin', e => peekAt(e.target));
  dlg.addEventListener('change', e => {
    const s = e.target as HTMLInputElement;
    if (s.matches('[data-near]')) choose(s.value);
    if (s.matches('[data-cardon]')) { pos = { ...pos, st: { ...pos.st, card: s.checked } }; render(); }
  });
  // In a row the arrow keys move over the choices (up and down change a piece list, as a list does).
  dlg.addEventListener('keydown', e => {
    const box = (e.target as Element).closest('.choices'), step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!box || !step || ((e.target as Element).matches('select') && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))) return;
    e.preventDefault();
    const all = [...box.querySelectorAll<HTMLElement>('button, select')], i = all.indexOf(e.target as HTMLElement);
    all[Math.max(0, Math.min(all.length - 1, i + step))].focus();
  });
  // The keys (proving-ground.html:1957-1966): 1, 2 and 3 arm a brush, B goes in and out of brush mode, S opens and closes
  // the Rules shelf, Esc closes a row, a card, the shelf, a popover or the Why tag, or leaves brush mode, Ctrl or Cmd+Z undoes. None of
  // them acts under a sheet or in a text field; in a piece list and under the ledge's sheet only Esc acts.
  document.addEventListener('keydown', e => {
    const field = (e.target as Element).closest?.('input, textarea, select');
    if (!dlg.open || q('.pg-sheet[open]') || ((field || ledgeOpen) && e.key !== 'Escape')) return;
    if (e.key === 'Escape' && ledgeOpen) { e.preventDefault(); return closeLedge(); }
    if (e.key === 'Escape' && (row || card || shelfOpen || brush || moreOpen || weighOpen || why || lifted || token || seating || laying)) {
      e.preventDefault();
      // Esc closes SEAT A KING, and the focus goes back to the socket.
      if (seating) { seating = false; render(); return q<HTMLElement>('[data-act="seat"]')?.focus(); }
      if (laying) { laying = false; render(); return q<HTMLElement>('[data-act="lay"]')?.focus(); }
      // Esc puts the lifted piece back and lets the armed token go.
      if (lifted || token) { lifted = false; token = null; render(); }
      // Esc closes only the row, and the focus goes back to its pill or chip.
      else if (row) { const { a, when } = row; row = peek = null; render(); q<HTMLElement>(`[data-${when ? 'when' : 'pill'}="${a}"]`)?.focus(); }
      else if (card) closeCard();
      else if (shelfOpen) closeShelf();
      else if (moreOpen || weighOpen) { moreOpen = weighOpen = false; render(); } else if (why) closeWhy(); else leave();
      return;
    }
    if (field) return;
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const b = ({ 1: 'move', 2: 'take', 3: 'both' } as Record<string, Brush>)[e.key];
    if (b) arm(b);
    else if (e.key === 'b' || e.key === 'B') { if (brush) leave(); else arm('move'); }
    else if (e.key === 's' || e.key === 'S') { if (shelfOpen) closeShelf(); else openShelf(); }
  });

  /** Opens the dialog on `item`, with the shelf read again and the open slot in view. */
  function enter(item: Item): void {
    ensureDefs();
    shelf = loadShelf().designs;
    reachEl.classList.remove('on');
    if (!dlg.open) dlg.showModal();
    show(item);
    revealOpenSlot();
    arrive();
    q<HTMLElement>('#pg-h').focus();
  }

  return {
    open(): void {
      enter(cur);
      const { bad } = loadShelf(); // the note of fix 19: a damaged entry is not lost, only not shown
      if (bad) toast(`${bad === 1 ? '1 saved entry' : `${bad} saved entries`} could not be read. ${bad === 1 ? 'It stays' : 'They stay'} on this device; the other designs work.`);
    },
    openDesign(code: string): void {
      const d = parseDesign(code);
      if (!d) toast('This design link could not be read.');
      enter(d ? { key: 'link', d, yours: false } : pool('pawn'));
      if (d) linkCard();
    },
  };
}
