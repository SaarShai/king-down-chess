/**
 * The Proving Ground: the Workshop's view A (docs/specs/workshop-proving-ground, ticket 01), behind `?workshop=a`.
 * The open piece stands on its example board with its marks; the plinth shows its name, its figure and its rules;
 * the ledge opens the pool pieces and the designs on the shelf. No edit yet. Mockup:
 * docs/research/rules-ui-2026-10-10/mockups/proving-ground.html (its line numbers in the comments).
 * Loaded on demand (main.ts `import()`), as the old Workshop is.
 */
import './ground.css';
import { NAMES as PIECE, file, parseSq, rank, sq, sqName, type PieceType } from '../rules/engine';
import { pieceArt } from '../ui/guide';
import { figureUrl, selectedFigure } from './figures';
import { NAMES, chip, drawString, effect, ensureDefs, seal, sigil, tagYours, tile, viewBox } from './marks';
import { PRESETS, canonical, fromPreset, parseDesign, type PieceDesign } from './model';
import { BODY_TYPE, START, holds } from './moves';
import { boardOf, examplesOf, sceneOf, type Kind, type Scene, type ScenePiece } from './scene';
import { loadShelf } from './store';
import { esc, partsText, ruleText } from './text';
import { blockOf, whenWords } from './vocab';

/** What the board and the plinth show: a pool piece, a design on the shelf, or a design from a link. */
interface Item { key: string; d: PieceDesign; yours: boolean }
const pool = (key: string): Item => { const p = PRESETS.find(x => x.key === key) ?? PRESETS[0]; return { key: `piece:${p.key}`, d: { ...fromPreset(p), name: p.name }, yours: false }; };
const FILES = 'abcdefgh';
const BRUSHES: [Kind, string][] = [['move', 'Move'], ['take', 'Take'], ['both', 'Both']];
/** The key row's short words (proving-ground.html:1187). */
const SHORT: Record<string, string> = { asleep: 'Asleep', cond: 'Sometimes', shot: 'Shot', moveshot: 'Move or shot', line: 'Line', arch: 'Hops', push: 'Push', swap: 'Swap' };

/** The figure of a design: the pool art of its body, unless it has its own figure or is a token (look.ts). */
const figureOf = (d: PieceDesign): string =>
  (!d.look.figure && d.look.body !== 'token' && pieceArt(BODY_TYPE[d.look.body], !!d.look.army)) || figureUrl(selectedFigure(d).id, d.look.army);

export function groundDialog(): { open(): void; openDesign(code: string): void } {
  const dlg = document.createElement('dialog');
  dlg.id = 'workshop';
  dlg.className = 'pg';
  dlg.setAttribute('aria-labelledby', 'pg-h');
  const chev = '<svg class="pg-chev" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 10l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 13l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/></svg>';
  const rows = Array.from({ length: 8 }, (_, i) => `<div role="row">${[...FILES].map(f => `<button type="button" class="sq" role="gridcell" data-sq="${f}${8 - i}" tabindex="-1"></button>`).join('')}</div>`).join('');
  dlg.innerHTML = `<header class="pg-top"><button type="button" class="pg-menu" aria-label="Menu"><span aria-hidden="true">‹</span> <span class="pg-word">Menu</span></button>`
    + '<h2 id="pg-h" class="pg-title" tabindex="-1"><i></i>Workshop<i class="r"></i></h2></header>'
    + '<div class="pg-main"><section class="pg-plinth" aria-label="The open piece"></section>'
    + `<section class="pg-boardcol" aria-label="Try board"><div class="pg-rim"><div class="pg-files" aria-hidden="true">${[...FILES].map(f => `<span>${f}</span>`).join('')}</div>`
    + `<div class="pg-ranks" aria-hidden="true">${[8, 7, 6, 5, 4, 3, 2, 1].map(r => `<span>${r}</span>`).join('')}</div>${chev}`
    + '<div class="pg-field"><svg class="pg-board" aria-hidden="true"></svg><div class="pg-coords" aria-hidden="true">'
    + [...FILES].map((f, i) => `<span style="left:calc(${(i + 1) * 12.5}% - 9px);bottom:3px">${f}</span>`).join('')
    + [8, 7, 6, 5, 4, 3, 2, 1].map((r, i) => `<span style="left:3px;top:calc(${i * 12.5}% + 3px)">${r}</span>`).join('')
    + `</div><div class="pg-hits" role="grid" aria-label="Board">${rows}</div></div></div></section>`
    + '<section class="pg-right" aria-label="Key"><div class="pg-brushes"></div><div class="pg-keyrow" aria-label="Also on the board"></div></section></div>'
    + '<footer class="pg-ledge"><div class="ltabs" role="tablist" aria-label="Library"><button type="button" class="ltab on" role="tab" id="pg-tab" aria-selected="true" aria-controls="pg-row">Pieces</button></div>'
    + '<div class="lrow" id="pg-row" role="tabpanel" aria-labelledby="pg-tab"><div class="inner lip"></div></div></footer>'
    + '<p class="pg-toast" role="status" aria-live="polite"></p>';
  document.body.append(dlg);
  const q = <T extends Element = HTMLElement>(s: string): T => dlg.querySelector(s) as T;
  const plinthEl = q('.pg-plinth'), fieldEl = q('.pg-field'), boardEl = q<SVGSVGElement>('.pg-board'), hitsEl = q('.pg-hits');
  const brushesEl = q('.pg-brushes'), keyEl = q('.pg-keyrow'), rowEl = q('.lrow'), slotsEl = q('.lrow .inner'), toastEl = q('.pg-toast');
  /** The narrow layout (ground.css): the phone form of the mockup. */
  const narrow = matchMedia('(max-width: 999px)');

  let cur = pool('pawn'), shelf: PieceDesign[] = [], sc: Scene, kbd = 'd4', drawnAt = 0;

  let toastTimer = 0;
  function toast(text: string): void {
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('on'), 3600);
  }

  /* ---- the plinth (renderPlinth and sealLineHTML, proving-ground.html:979-1006, :1030-1076) ---- */

  function renderPlinth(board: Uint8Array, from: number): void {
    const d = cur.d, name = d.name || 'Piece', origin = cur.key.startsWith('piece:') ? undefined : PRESETS.find(p => d.from.length === 1 && p.key === d.from[0]);
    const rules = canonical(d).rules.map(r => {
      const b = blockOf(r.does.a), asleep = !b.event && r.when.on !== 'always' && !holds(r.when, board, from, START);
      // The When as a chip (an event's head names it: "when it takes a piece, not a pawn"), then what the rule does.
      const words = b.head ? partsText(b.head(r)) : whenWords(r.when), l1 = chip(r.when, { hollow: asleep, words: words.charAt(0).toLowerCase() + words.slice(1) });
      return { r, asleep, line: `<li class="sline">${seal(r.does.a, 44, { asleep })}<span class="txt">${l1 ? `<span class="l1">${l1}</span>` : ''}<span class="l2">${esc(partsText(b.say(r)))}</span></span></li>` };
    });
    plinthEl.innerHTML = `<div class="pg-name${cur.yours ? ' is-copy' : ''}"><div class="row"><h3${name.length > 9 ? ' class="long"' : ''}>${esc(name)}</h3>${cur.yours ? tagYours() : ''}</div>`
      + `${origin ? `<div class="from">from ${esc(origin.name)}</div>` : ''}</div>`
      + `<div class="pg-figure"><span class="halo"></span><img src="${esc(figureOf(d))}" alt=""></div><div class="pg-stone"><div class="top"></div><div class="front"></div></div>`
      + (rules.length ? `<ol class="pg-lines" aria-label="Rules">${rules.map(x => x.line).join('')}</ol>` : '')
      // The narrow layout shows the seals in a row beside the name; each one names its rule.
      + `<div class="pg-pseals">${rules.map(x => seal(x.r.does.a, 42, { asleep: x.asleep, label: ruleText(x.r) })).join('')}</div>`;
  }

  /* ---- the board (renderBoard, renderHits and squareLabel, proving-ground.html:1161, :1244-1281) ---- */

  const art = (p: ScenePiece): string => (p.open ? figureOf(cur.d) : pieceArt((PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b') ?? '');
  function drawBoard(): void {
    const s = fieldEl.clientWidth / 8;
    if (!s) return;
    drawnAt = s;
    boardEl.setAttribute('viewBox', viewBox(s));
    boardEl.innerHTML = drawString(sc, { s, art });
  }
  function squareLabel(sq: string): string {
    const m = sc.marks.find(x => x.sq === sq), occ = sc.pieces.find(p => p.sq === sq);
    const who = occ ? `${occ.side === 'b' ? 'black' : 'white'} ${occ.open ? (cur.d.name || 'piece').toLowerCase() : occ.k}` : '';
    const what = m ? (m.cond === 'asleep' ? 'asleep here' : NAMES[m.k].toLowerCase()) : occ ? '' : 'empty';
    return `${sq}: ${[what, who].filter(Boolean).join(', ')}.`;
  }
  function renderHits(): void {
    for (const b of hitsEl.querySelectorAll<HTMLButtonElement>('.sq')) {
      b.setAttribute('aria-label', squareLabel(b.dataset.sq!));
      b.tabIndex = b.dataset.sq === kbd ? 0 : -1;
    }
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

  /* ---- the right column: the brushes as the key, and the live key row (renderBrushes and keyKinds, :1184-1216, :1283) ---- */

  function renderKey(): void {
    const size = narrow.matches ? 40 : 80;
    brushesEl.innerHTML = BRUSHES.map(([k, w]) => `<span class="brush" title="${NAMES[k]}"><span class="tile">${tile(k, size)}</span><span class="w">${w}</span></span>`).join('');
    const kinds = new Map<string, [string, string]>();
    const add = (k: string, svg: () => string, w: string): void => { if (!kinds.has(k)) kinds.set(k, [svg(), w]); };
    for (const m of sc.marks) {
      if (m.cond === 'asleep') add('asleep', () => tile('move', 36, { cond: 'asleep' }), NAMES.asleep);
      else if (m.cond) add('cond', () => tile('move', 36, { cond: 'awake' }), NAMES.cond);
      else if (m.k === 'shot' || m.k === 'moveshot') add(m.k, () => tile(m.k, 36), NAMES[m.k]);
    }
    if (sc.rails.length) add('line', () => tile('move', 36, { rail: true }), NAMES.line);
    if (sc.arches.length) add('arch', () => effect('arch', 36), NAMES.arch);
    for (const e of sc.effects) add(e.k, () => effect(e.k, 36), NAMES[e.k]);
    keyEl.innerHTML = narrow.matches ? '' : [...kinds].slice(0, 6).map(([k, [svg, w]]) => `<span class="k" title="${w}">${svg}<span>${SHORT[k]}</span></span>`).join('');
  }

  /* ---- the ledge: the Pieces tab (renderLedge and slotHTML, :1435-1486) ---- */

  function renderLedge(): void {
    const slot = (attr: string, key: string, d: PieceDesign, yours: boolean): string => {
      const open = cur.key === key;
      return `<button type="button" class="slot${open ? ' open' : ''}" ${attr}${open ? ' aria-current="true"' : ''}><img class="fig" src="${esc(figureOf(d))}" alt="">`
        + `${yours ? `<span class="qt">${sigil('quill', 16)}</span>` : ''}<span class="nm">${esc(d.name || 'Piece')}</span></button>`;
    };
    slotsEl.innerHTML = PRESETS.map(p => slot(`data-piece="${p.key}"`, `piece:${p.key}`, pool(p.key).d, false)).join('')
      + (shelf.length ? '<span class="lsep" aria-hidden="true"></span><span class="lhead">Yours</span>' : '')
      + shelf.map(d => slot(`data-design="${esc(d.id)}"`, `design:${d.id}`, d, true)).join('');
  }
  slotsEl.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.slot');
    if (!b) return;
    const d = shelf.find(x => x.id === b.dataset.design);
    show(d ? { key: `design:${d.id}`, d, yours: true } : pool(b.dataset.piece!));
    // renderLedge replaced the slot: give the focus to its new copy, with no scroll away from the board.
    q<HTMLElement>('.slot.open').focus({ preventScroll: true });
  });

  /** Opens `item` on the plinth and the board. On a short screen the narrow layout scrolls: go back to the top, to the board. */
  function show(item: Item): void {
    cur = item;
    dlg.scrollTop = 0;
    const pieces = examplesOf(item.d), board = boardOf(pieces), from = parseSq(pieces[0].sq);
    sc = sceneOf(item.d, board, from);
    kbd = pieces[0].sq;
    renderPlinth(board, from);
    drawBoard();
    renderHits();
    renderKey();
    renderLedge();
  }
  new ResizeObserver(() => { if (fieldEl.clientWidth / 8 !== drawnAt) drawBoard(); }).observe(fieldEl);
  narrow.addEventListener('change', renderKey);
  q<HTMLButtonElement>('.pg-menu').onclick = () => dlg.close();

  /** Opens the dialog on `item`, with the shelf read again and the open slot in view. */
  function enter(item: Item): void {
    ensureDefs();
    shelf = loadShelf().designs;
    if (!dlg.open) dlg.showModal();
    show(item);
    const open = q<HTMLElement>('.slot.open');
    if (open) rowEl.scrollLeft = Math.max(0, open.offsetLeft - rowEl.clientWidth / 2 + open.offsetWidth / 2);
    q<HTMLElement>('#pg-h').focus();
  }

  return {
    open: () => enter(cur),
    openDesign(code: string): void {
      const d = parseDesign(code);
      if (!d) toast('This design link could not be read.');
      enter(d ? { key: 'link', d, yours: false } : pool('pawn'));
    },
  };
}
