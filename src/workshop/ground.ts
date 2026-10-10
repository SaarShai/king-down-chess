/**
 * The Proving Ground: the Workshop's view A (docs/specs/workshop-proving-ground), behind `?workshop=a`.
 * The open piece stands on its example board with its marks; the plinth shows its name, its figure and its rules;
 * the ledge opens the pool pieces and the designs on the shelf. The board is the editor (ticket 02): the brushes
 * paint squares, the nubs switch lines, and the first edit on a pool piece makes the player's private copy. In look mode a
 * tap on a square opens its Why tag (ticket 05). Mockup:
 * docs/research/rules-ui-2026-10-10/mockups/proving-ground.html (its line numbers in the comments).
 * Loaded on demand (main.ts `import()`), as the old Workshop is.
 */
import './ground.css';
import { NAMES as PIECE, file, parseSq, rank, sq, sqName, type PieceType } from '../rules/engine';
import { pieceIcon } from '../piece-icons';
import { pieceArt } from '../ui/guide';
import { figureUrl, selectedFigure } from './figures';
import { bandOf, judge } from './judge';
import { NAMES, chip, countRing, drawString, effect, ensureDefs, impression, knot, mirrorIcon, nub, pill, seal, sigil, tagYours, tile, viewBox, whySum } from './marks';
import {
  DIR, DIRS, FULL, MAX_RULES, PRESETS, brushMark, canonical, designCode, empty, fromPreset, likeAlways, limit, lineOrbit, orbit, parseDesign, presetOf,
  type Ability, type Body, type Brush, type Dir, type LikeAs, type PaintOn, type PieceDesign, type Rule, type When,
} from './model';
import { BODY_TYPE, START, holds } from './moves';
import { letterOf } from './names';
import { boardOf, diffOf, examplesOf, sceneOf, type Kind, type Scene, type ScenePiece } from './scene';
import { MAX, deleteDesign, loadShelf, saveDesign, type SaveResult } from './store';
import { LIKE_ADDED, LIKE_CLASH, brief, cap, esc, lineParts, lineWords, pawns, ruleText, whenLabel } from './text';
import { BLOCKS, BODY, GROUPS, blockOf, whenChoices, whenWords, type Part } from './vocab';
import { traceOf, whyWords } from './why';

/** What the board and the plinth show: a pool piece, a design on the shelf (or the player's new copy), or a design from a link. */
interface Item { key: string; d: PieceDesign; yours: boolean }
const pool = (key: string): Item => { const p = PRESETS.find(x => x.key === key) ?? PRESETS[0]; return { key: `piece:${p.key}`, d: { ...fromPreset(p), name: p.name }, yours: false }; };
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const FILES = 'abcdefgh';
const BRUSHES: [Kind & Brush, string][] = [['move', 'Move'], ['take', 'Take'], ['both', 'Both']];
/** The key row's short words (proving-ground.html:1187). */
const SHORT: Record<string, string> = { asleep: 'Asleep', cond: 'Sometimes', blocked: 'Refused', shot: 'Shot', moveshot: 'Move or shot', line: 'Line', arch: 'Hops', removed: 'Removed', push: 'Push', swap: 'Swap' };
const ROMAN = ['I', 'II', 'III'];
/** The Mirror tool's words for each "Paint on" (renderTools, proving-ground.html:1287). */
const MIRROR: Record<PaintOn, string> = { lr: 'Mirror', all: 'All 8', one: 'One' };
const MEDAL = '<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><path d="M16 2l8 14 8-14" fill="none" stroke="#842c21" stroke-width="5"/><circle cx="24" cy="30" r="15" fill="#e9c071" stroke="#7a5712" stroke-width="2"/>'
  + '<circle cx="24" cy="30" r="10" fill="none" stroke="#7a5712" stroke-width="1.2"/><path d="M24 23l2 4.5 5 .5-3.8 3.3 1.1 4.9L24 33.7l-4.3 2.5 1.1-4.9L17 28l5-.5z" fill="#7a5712"/></svg>';

/** The figure of a design: the pool art of its body, unless it has its own figure or is a token (look.ts). */
const figureOf = (d: PieceDesign): string =>
  (!d.look.figure && d.look.body !== 'token' && pieceArt(BODY_TYPE[d.look.body], !!d.look.army)) || figureUrl(selectedFigure(d).id, d.look.army);
const link = (d: PieceDesign): string => `${location.origin}${location.pathname}?design=${designCode(d)}`;
/** Brush mode paints on d4: the reach ends 3 squares out (proving-ground.html:1763). */
const out = (q: string): boolean => { const s = parseSq(q); return Math.max(Math.abs(file(s) - 3), Math.abs(rank(s) - 3)) > 3; };
/** A rule of a design by its block: a design holds each block once (limit, model.ts). */
const ruleIn = (d: PieceDesign, a: Ability['a']): Rule | undefined => d.rules.find(r => r.does.a === a);
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
    + '<h2 id="pg-h" class="pg-title" tabindex="-1"><i></i>Workshop<i class="r"></i></h2><div class="pg-acts"></div><div class="pg-morepop" id="pg-morepop" hidden></div></header>'
    + '<div class="pg-main"><section class="pg-plinth" aria-label="The open piece"></section>'
    + `<section class="pg-boardcol" aria-label="Try board"><div class="pg-rim"><div class="pg-files" aria-hidden="true">${[...FILES].map(f => `<span>${f}</span>`).join('')}</div>`
    + `<div class="pg-ranks" aria-hidden="true">${[8, 7, 6, 5, 4, 3, 2, 1].map(r => `<span>${r}</span>`).join('')}</div>${chev}<span class="pg-notch" hidden></span>`
    + '<div class="pg-field"><svg class="pg-board" aria-hidden="true"></svg><div class="pg-coords" aria-hidden="true">'
    + [...FILES].map((f, i) => `<span style="left:calc(${(i + 1) * 12.5}% - 9px);bottom:3px">${f}</span>`).join('')
    + [8, 7, 6, 5, 4, 3, 2, 1].map((r, i) => `<span style="left:3px;top:calc(${i * 12.5}% + 3px)">${r}</span>`).join('')
    + `</div><div class="pg-hits" role="grid" aria-label="Board">${rows}</div><div class="pg-paint"></div></div></div></section>`
    + '<section class="pg-right" aria-label="Key"><div class="pg-brushes"></div><div class="pg-tools" hidden></div><p class="pg-hint"></p><div class="pg-keyrow" aria-label="Also on the board"></div><div class="pg-why" aria-live="polite" hidden></div></section>'
    + '<aside class="pg-shelf" aria-labelledby="pg-shelf-h" hidden></aside></div>'
    + '<footer class="pg-ledge"><div class="ltabs" role="tablist" aria-label="Library"><button type="button" class="ltab on" role="tab" id="pg-tab" aria-selected="true" aria-controls="pg-row">Pieces</button></div>'
    + '<div class="lrow" id="pg-row" role="tabpanel" aria-labelledby="pg-tab"><div class="inner lip"></div></div></footer>'
    + '<div class="pg-alert" role="alert" hidden></div><p class="pg-toast" role="status" aria-live="polite"></p>';
  document.body.append(dlg);
  const q = <T extends Element = HTMLElement>(s: string): T => dlg.querySelector(s) as T;
  const plinthEl = q('.pg-plinth'), fieldEl = q('.pg-field'), boardEl = q<SVGSVGElement>('.pg-board'), hitsEl = q('.pg-hits'), paintEl = q('.pg-paint');
  const actsEl = q('.pg-acts'), moreEl = q('.pg-morepop'), brushesEl = q('.pg-brushes'), toolsEl = q('.pg-tools'), hintEl = q('.pg-hint'), keyEl = q('.pg-keyrow');
  const rowEl = q('.lrow'), slotsEl = q('.lrow .inner'), alertEl = q('.pg-alert'), toastEl = q('.pg-toast'), shelfEl = q('.pg-shelf'), whyEl = q('.pg-why'), notchEl = q('.pg-notch');
  /** The narrow layout (ground.css): the phone form of the mockup. */
  const narrow = matchMedia('(max-width: 999px)');

  let cur = pool('pawn'), shelf: PieceDesign[] = [], sc: Scene, board: Uint8Array = new Uint8Array(64), from = 0, kbd = 'd4', drawnAt = 0;
  /** Brush mode while a brush or tool is armed (proving-ground.html:1742); "Paint on" (the Mirror tool). */
  let brush: Brush | null = null, mirror: PaintOn = 'all';
  /** Undo steps of the open item, each with its scope (dialog.ts:315-331); the design the last save refused, and why. */
  let undos: { item: Item; label: string }[] = [], unsaved: { id: string; why: Exclude<SaveResult, 'saved'> } | null = null;
  /** The squares that pulse on the next draw; the open popovers. */
  let pulse: string[] = [], weighOpen = false, moreOpen = false, toolsOpen = false;
  /** The rules (ticket 03): the open row of choices (rule `a`'s pill, or its When, with "More choices" open or not), the
   *  design under a choice that has the pointer or the focus, the Rules shelf and its chosen seal, the phone's rule card. */
  let row: { a: Ability['a']; when: boolean; more: boolean } | null = null, peek: PieceDesign | null = null;
  let shelfOpen = false, pick: Ability['a'] | null = null, card: Ability['a'] | null = null, added = 0;
  /** Isolate (proving-ground.html:1141, :1632-1645): the rule that a tap keeps, the rule under the pointer or the keyboard focus, and the knot that a tap keeps. */
  let focus: number | null = null, hover: number | null = null, knotAt: number | null = null;
  /** The square of the open Why tag, and the square under the pointer or the keyboard focus that has hover-only parts (spec decision 37). */
  let why: string | null = null, near: string | null = null;
  /** A design from a link stays read only. */
  const editable = (): boolean => cur.key !== 'link';

  let toastTimer = 0;
  function toast(text: string, icon?: 'lock' | 'lockOpen'): void {
    toastEl.innerHTML = `${icon ? sigil(icon, 16) : ''}<span>${esc(text)}</span>`;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('on'), 3600);
  }

  /** A nested modal sheet (dialog.ts sheet()); `wire` gets its body. A tap on the backdrop closes it (src/dialog-dismiss.ts). */
  function sheet(title: string, html: string, wire: (body: HTMLElement, close: () => void) => void): void {
    const s = document.createElement('dialog');
    s.className = 'pg-sheet';
    s.setAttribute('aria-labelledby', 'pg-sheet-h');
    s.innerHTML = `<header><h2 id="pg-sheet-h" tabindex="-1" autofocus>${esc(title)}</h2><button type="button" class="pg-x" aria-label="Close">×</button></header><div class="pg-sheet-body">${html}</div>`;
    dlg.append(s);
    const close = (): void => s.close();
    s.addEventListener('close', () => s.remove());
    s.querySelector<HTMLButtonElement>('.pg-x')!.onclick = close;
    wire(s.querySelector('.pg-sheet-body')!, close);
    s.showModal();
  }
  /** Copies `text`; where the device refuses, a sheet shows it, selected, to copy by hand (dialog.ts copyText()). */
  async function copyText(text: string, done: string): Promise<void> {
    try { await navigator.clipboard.writeText(text); toast(done); } catch {
      sheet('Copy this', '<p>This device did not let the game copy. Select the text and copy it.</p><textarea class="pg-copybox" readonly rows="5" aria-label="The text to copy"></textarea>', body => {
        const t = body.querySelector('textarea')!;
        t.value = text;
        requestAnimationFrame(() => { t.focus(); t.select(); });
      });
    }
  }

  /* ---- change, save and undo (spec decision 33: its own copy of dialog.ts:132-178, :315-331 until the cutover) ---- */

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
    // A rule that comes or goes moves the rule numbers: the kept rule and knot let go.
    if (d.rules.length !== cur.d.rules.length) focus = knotAt = null;
    if (!cur.yours) {
      const base = `My ${d.name}`;
      let name = base;
      for (let i = 2; shelf.some(x => x.name === name); i++) name = `${base} ${i}`;
      Object.assign(d, { name, named: true, letter: letterOf(name), ownLetter: false });
    }
    cur = { key: `design:${d.id}`, d, yours: true };
    save();
    render();
    if (!undos[undos.length - 1].item.yours) revealOpenSlot();
    return true;
  }
  /** Undo: back to the step before. Back before the first edit, the copy goes from the shelf (the mockup's undo); where
   *  the device refuses to delete it, the copy and its undo step stay. */
  function undo(): void {
    const u = undos[undos.length - 1];
    if (!u) return;
    if (!u.item.yours && shelf.some(x => x.id === cur.d.id) && !deleteDesign(cur.d.id)) return toast('Could not undo: this device refused.');
    undos.pop();
    if (u.item.d.rules.length !== cur.d.rules.length) focus = knotAt = null;
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
  function share(): void {
    // Every design the editor makes fits a share code; this guard says so if one ever does not (dialog.ts share()).
    if (!parseDesign(designCode(cur.d))) return toast('This design cannot be shared: it breaks a limit.');
    void copyText(link(cur.d), 'Link copied.');
  }
  /** Weigh (decision 13): the worth, the band word and the like line. `false` skips the Why parts, the fixes and the deltas. */
  function weighWords(): [string, string] {
    const v = judge(cur.d, false);
    return empty(cur.d) ? [v.line, ''] : [`About ${pawns(v.worth.point)} (estimate). ${bandOf(v)}.`, v.like];
  }

  /* ---- brush mode (enterBrush, paint and toggleLine, proving-ground.html:1742-1808) ---- */

  function arm(b: Brush): void {
    if (!editable()) return;
    brush = b;
    row = peek = pick = card = focus = knotAt = why = null;
    shelfOpen = false;
    render();
  }
  function leave(): void {
    brush = null;
    toolsOpen = false;
    render();
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
      setTimeout(() => lock.remove(), 450);
      return toast('Reach ends 3 squares out.', 'lock');
    }
    // A mark that the paint alone does not make: a rule makes it.
    if (sc.marks.some(m => m.sq === q && m.diff !== '-') && !sceneOf({ squares: cur.d.squares, lines: cur.d.lines, rules: [] }, board, from).marks.some(m => m.sq === q))
      return toast('A rule makes this mark. Tap its seal.', 'lockOpen');
    const pts = orbit(x, y, mirror), b = brush!;
    pulse = pts.map(([a, c]) => sqName(sq(3 + a, 3 + c)));
    const painted = change('paint', d => {
      for (const [a, c] of pts) {
        const i = d.squares.findIndex(t => t.x === a && t.y === c), m = brushMark(d.squares[i]?.mark, b);
        if (m && i >= 0) d.squares[i].mark = m; else if (m) d.squares.push({ x: a, y: c, mark: m }); else if (i >= 0) d.squares.splice(i, 1);
      }
    });
    // The same paint again: nothing changes, the tiles pulse.
    if (!painted) render();
  }
  /** A nub switches its line with its Mirror partners (spec decision 35). */
  function toggleLine(l: Dir): void {
    const on = !cur.d.lines.includes(l), set = lineOrbit(l, mirror);
    change('line', d => { d.lines = DIRS.filter(x => (set.includes(x) ? on : d.lines.includes(x))); });
  }

  /* ---- the top bar (renderTop, proving-ground.html:952-969): Undo and Share once the piece is the player's ---- */

  function renderTop(): void {
    const u = undos[undos.length - 1];
    actsEl.innerHTML = !cur.yours ? '' : `<button type="button" class="pg-undo" data-act="undo" aria-label="${u ? `Undo ${u.label}` : 'Undo'}"${u ? '' : ' disabled'}><span aria-hidden="true">↶</span><span class="pg-word"> Undo${u ? ` ${u.label}` : ''}</span></button>`
      + '<button type="button" class="pg-share" data-act="share">Share</button>'
      + `<button type="button" class="pg-more" data-act="more" aria-label="More" aria-expanded="${moreOpen}" aria-controls="pg-morepop">⋯</button>`;
    moreEl.hidden = !(cur.yours && moreOpen);
    moreEl.innerHTML = moreEl.hidden ? '' : `<button type="button" data-act="share">${sigil('quill', 18)}Share</button><button type="button" data-act="weigh">${sigil('scale', 18)}Weigh</button>`;
  }

  /* ---- the plinth (renderPlinth and sealLineHTML, proving-ground.html:979-1006, :1030-1098) ---- */

  /** A state rule sleeps while its When does not hold here: its seal is grey and its chip hollow. */
  const asleepOf = (r: Rule): boolean => !blockOf(r.does.a).event && r.when.on !== 'always' && !holds(r.when, board, from, START);
  /** The rule has When choices (decision 10): not "takes again" and "removed too", whose only When is "when it takes". */
  const hasWhens = (a: Ability['a']): boolean => { const w = whenChoices(a); return editable() && w.top.length + w.more.length > 0; };
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
    const a = r.does.a, ed = editable(), P = lineParts(r), asleep = asleepOf(r), c = chip(r.when, { hollow: asleep }), inCard = i === undefined;
    const part = (p: Part): string => (typeof p === 'string' ? esc(p) : ed ? hit('data-pill', a, row?.a === a && !row.when, pill(p.text)) : esc(p.text));
    const l1 = (c && hasWhens(a) ? hit('data-when', a, row?.a === a && row.when, c, `When: ${whenWords(r.when)}`) : c) + P.after.map(part).join('');
    return `<div class="sline"${inCard ? '' : ` data-seal="${i}"`}>${inCard ? '' : `<button type="button" class="sl-seal" ${press(i, blockOf(a).title)}>${seal(a, 44, { asleep })}</button>`}<span class="txt">${l1 ? `<span class="l1">${l1}</span>` : ''}<span class="l2">${P.line.map(part).join('')}</span></span>`
      + (ed && !inCard ? `<span class="acts">${whenButton(r)}<button type="button" class="pg-rm" data-rm="${a}" aria-label="Remove ${esc(blockOf(a).label.replace('…', ''))}">×</button></span>` : '') + '</div>';
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
    const d = cur.d, name = d.name || 'Piece', origin = cur.key.startsWith('piece:') ? undefined : PRESETS.find(p => d.from.length === 1 && p.key === d.from[0]);
    const rules = canonical(d).rules, ed = editable(), room = ed && rules.length < MAX_RULES;
    const [head, like] = weighOpen ? weighWords() : ['', ''];
    plinthEl.innerHTML = `<div class="pg-name${cur.yours ? ' is-copy' : ''}"><div class="row"><h3${name.length > 9 ? ' class="long"' : ''}>${esc(name)}</h3>${cur.yours ? tagYours() : ''}`
      + `${cur.yours ? `<button type="button" class="pg-weigh" data-act="weigh" aria-expanded="${weighOpen}">${sigil('scale', 16)}Weigh</button>` : ''}</div>`
      + `${origin ? `<div class="from">from ${esc(origin.name)}</div>` : ''}</div>`
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
          + '</div>');
    placeKnots();
    isolate();
  }
  /** The knots in the lines' 22 px gutter, from the middle of one rule line to the middle of the other (placeKnots, :1009-1022). Wide layout only.
   *  A knot from rule I to rule III beside another knot gets a second gutter, so each knot keeps its own 24 px hit area. */
  function placeKnots(): void {
    plinthEl.querySelectorAll('.knot').forEach(k => k.remove());
    if (narrow.matches || !sc) return;
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
        + (editable() ? `<div class="pg-act">${whenButton(r)}<button type="button" class="pg-remove" data-rm="${b.a}">Remove</button></div>` : '');
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
    if (!editable()) return;
    if (cur.d.rules.length >= MAX_RULES) return toast(FULL, 'lock');
    brush = row = peek = pick = card = focus = knotAt = why = null;
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
    if (!change('rule', c.apply)) render();
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

  const art = (p: ScenePiece): string => (p.open ? figureOf(cur.d) : pieceArt((PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b') ?? '');
  function drawBoard(): void {
    const s = fieldEl.clientWidth / 8;
    if (!s) return;
    drawnAt = s;
    boardEl.setAttribute('viewBox', viewBox(s));
    // A preview and brush mode show every mark: the rule numbers of a preview's `by` are those of the design under preview.
    const look = !brush && !peek && !pick, k = look && knotAt !== null ? sc.knots[knotAt] : undefined, i = look ? focus ?? hover : null;
    const iso = k ? (by: readonly number[]) => by.includes(k.a) && by.includes(k.b) : i === null ? undefined : (by: readonly number[]) => by.includes(i);
    // The phone shows the stamps of the kept rule only (boardOpts, :1149).
    // The hover-only parts of the open tag's square, else of the square under the pointer or the focus (proving-ground.html:1144).
    boardEl.innerHTML = drawString(sc, { s, art, focus: iso, stamps: narrow.matches ? x => look && x === focus : undefined, hover: why ?? near, select: why });
    for (const p of pulse) boardEl.querySelector(`[data-sq="${p}"]:not(.kdm-ghost)`)?.classList.add('kdm-ripple');
    pulse = [];
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
          + ` style="left:${(3.5 + x * k) * 12.5}%;top:${(4.5 - y * k) * 12.5}%">${nub(on, (Math.atan2(-y, x) * 180) / Math.PI)}</button>`;
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
  /** The pointer or the keyboard focus on a square with hover-only parts shows them (proving-ground.html:2047-2060); the open tag wins. */
  const nearAt = (t: EventTarget | null): void => {
    const at = t instanceof Element ? t.closest<HTMLElement>('.pg-hits .sq')?.dataset.sq : undefined;
    const n = at && [...sc.marks, ...sc.effects, ...sc.impressions].some(x => x.on === at) ? at : null;
    if (n === near) return;
    near = n;
    if (!why) drawBoard();
  };
  hitsEl.addEventListener('pointerover', e => nearAt(e.target));
  hitsEl.addEventListener('pointerleave', () => nearAt(null));
  hitsEl.addEventListener('focusin', e => { if ((e.target as Element).matches(':focus-visible')) nearAt(e.target); });
  hitsEl.addEventListener('focusout', e => nearAt(e.relatedTarget));

  /* ---- the Why tag (renderWhy and renderNotch, proving-ground.html:1217-1223, :1330-1364) ---- */

  /** A tap or Enter on a square in look mode opens its tag, and lets the kept rule go; a tap on its square closes it. */
  function openWhy(at: string): void {
    why = why === at ? null : at;
    row = peek = pick = card = focus = knotAt = null;
    shelfOpen = false;
    kbd = at;
    render();
  }
  /** ×, Esc: the tag closes, and the focus goes back to its square. */
  function closeWhy(): void {
    const at = why;
    why = null;
    render();
    q<HTMLElement>(`.pg-hits .sq[data-sq="${at}"]`).focus();
  }
  /** The tag: the square, its occupant and the count ring; the sum (48 px tiles and 34 px stamps on the phone); the note under it.
   *  Desktop: under the key row, with a pointer and a rim notch at the square's row. Phone: a bottom sheet over the brushes and the ledge. */
  function renderWhy(): void {
    const phone = narrow.matches;
    whyEl.hidden = notchEl.hidden = !why;
    // On the phone the shelf, the card and the tag cover the ledge, and the tag the brushes too.
    q('.pg-ledge').inert = phone && (!!why || !shelfEl.hidden);
    brushesEl.inert = phone && !!why;
    if (!why) { whyEl.innerHTML = ''; return; }
    const w = whyWords(cur.d, sc, traceOf(cur.d, board, from), why), p = w.piece, T = phone ? 48 : 52;
    const icon = !p ? '' : pieceIcon(p.open ? BODY_TYPE[cur.d.look.body as Body] : (PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b' ? 1 : 0);
    whyEl.innerHTML = `<div class="tag"><div class="why-h">${icon}<span class="sqn">${why}</span><span class="occ">${esc(w.occupant)}</span>${w.count ? countRing(w.count) : ''}`
      + `<button type="button" class="x" data-act="closewhy" aria-label="Close">×</button></div>`
      + `<div class="why-sumrow">${w.sum ? whySum(w.sum, T, phone ? 34 : 40) : `<div class="why-solo"><small>${esc(w.solo!)}</small></div>`}</div>`
      + `${w.foot ? `<p class="why-foot">${esc(w.foot)}</p>` : ''}</div>${phone ? '' : '<span class="pointer"></span>'}`;
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

  /* ---- the right column: the brushes (also the key), the tools, the hint, the live key row (renderBrushes, renderTools and keyKinds, :1184-1216, :1283-1295) ---- */

  function renderRight(): void {
    const phone = narrow.matches;
    brushesEl.innerHTML = BRUSHES.map(([k, w], i) => {
      const inner = `<span class="tile">${tile(k, phone ? 40 : 80)}</span><span class="w">${w}</span>`;
      return editable() ? `<button type="button" class="brush${brush === k ? ' armed' : ''}" data-brush="${k}" aria-pressed="${brush === k}" title="${NAMES[k]}. Tap to paint (${i + 1})">${inner}</button>`
        : `<span class="brush" title="${NAMES[k]}">${inner}</span>`;
    }).join('') + (phone && brush ? `<span class="phint">Tap a square.</span><button type="button" class="pg-moretools" data-act="tools" aria-label="More tools" aria-expanded="${toolsOpen}">⋯</button>` : '');
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
    if (sc.arches.length) add('arch', () => effect('arch', 36), NAMES.arch);
    if (sc.impressions.some(im => im.list.some(x => x.a === 'removedAfter'))) add('removed', () => impression('removedAfter', 26), NAMES.removed);
    for (const { k } of sc.effects) if (k === 'push' || k === 'swap') add(k, () => effect(k, 36), NAMES[k]);
    keyEl.innerHTML = phone || brush ? '' : [...kinds].slice(0, 6).map(([k, [svg, w]]) => `<span class="k" title="${w}">${svg}<span>${SHORT[k]}</span></span>`).join('');
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
  const revealOpenSlot = (): void => {
    const open = q<HTMLElement>('.slot.open');
    if (open) rowEl.scrollLeft = Math.max(0, open.offsetLeft - rowEl.clientWidth / 2 + open.offsetWidth / 2);
  };
  slotsEl.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.slot');
    if (!b) return;
    const d = shelf.find(x => x.id === b.dataset.design);
    show(d ? { key: `design:${d.id}`, d, yours: true } : pool(b.dataset.piece!));
    // renderLedge replaced the slot: give the focus to its new copy, with no scroll away from the board.
    q<HTMLElement>('.slot.open').focus({ preventScroll: true });
  });

  /** The scene of the open design on its board, or of the design under preview (a choice that has the pointer or the
   *  focus, or the shelf's new rule), with `pv` on each part that the preview adds (`sceneOf` of both). Then the board and the right column. */
  function drawScene(): void {
    // In brush mode the design stands alone on d4; a copy shows its paint diff against its pool piece.
    const pieces = examplesOf(brush ? { from: [] } : cur.d);
    board = boardOf(pieces);
    from = parseSq(pieces[0].sq);
    const of = (d: PieceDesign): Scene => (d.from[0] ? diffOf(d, presetOf(d.from[0]), board, from) : sceneOf(d, board, from));
    const next = peek ?? (shelfOpen && pick && !notNow(pick) ? { ...cur.d, rules: [...cur.d.rules, blockOf(pick).rule] } : null);
    sc = of(cur.d);
    added = 0;
    if (next) {
      // A part is new when it differs in more than its rule numbers (`by`); the knots stay those of the rule lines on the plinth.
      const key = (x: object): string => JSON.stringify(x, (k, v) => (k === 'by' ? undefined : v)), was = new Set(Object.values(sc).flat().map(key));
      sc = { ...of(next), knots: sc.knots };
      for (const x of [...sc.marks, ...sc.rails, ...sc.arches, ...sc.effects]) if (!was.has(key(x))) { x.pv = true; added++; }
    }
    if (brush) {
      // The reach ends 3 squares out: a line shows 3 squares, then its arrow (designScene, proving-ground.html:781-797).
      sc.marks = sc.marks.filter(m => !out(m.sq));
      sc.impressions = sc.impressions.filter(m => !out(m.sq));
      for (const r of sc.rails) if (out(r.to)) { const t = parseSq(r.to); r.to = sqName(sq(3 + 3 * Math.sign(file(t) - 3), 3 + 3 * Math.sign(rank(t) - 3))); r.end = 'arrow'; }
    }
    drawBoard();
    renderHits();
    renderPaint();
    renderRight();
  }
  /** Draws everything for the open item. A control that a part replaced gets the focus back. */
  function render(): void {
    const a = document.activeElement as HTMLElement | null;
    const keep = ['brush', 'act', 'nub', 'piece', 'design', 'pill', 'when', 'choice', 'sealitem', 'seal', 'rm'].map(k => a?.dataset?.[k] && `[data-${k}="${a.dataset[k]}"]`).find(Boolean);
    // A row or a card of a rule that is gone closes.
    if (row && !ruleIn(cur.d, row.a)) row = null;
    if (card && !ruleIn(cur.d, card)) card = row = null;
    renderTop();
    drawScene();
    renderPlinth();
    renderShelf();
    renderLedge();
    drawAlert();
    renderWhy();
    if (keep && !dlg.contains(document.activeElement)) (q<HTMLElement>(keep) ?? q<HTMLElement>('.pg-brushes button'))?.focus({ preventScroll: true });
  }
  /** Opens `item` on the plinth and the board, in look mode. On a short screen the narrow layout scrolls: go back to the top, to the board. */
  function show(item: Item): void {
    if (item.key !== cur.key) undos = [];
    cur = item;
    brush = row = peek = pick = card = focus = hover = knotAt = why = null;
    weighOpen = moreOpen = toolsOpen = shelfOpen = false;
    mirror = presetOf(item.d.from[0] ?? '').paintOn;
    kbd = examplesOf(item.d)[0].sq;
    dlg.scrollTop = 0;
    render();
  }
  new ResizeObserver(() => { if (fieldEl.clientWidth / 8 !== drawnAt) drawBoard(); placePointer(); }).observe(fieldEl);
  new ResizeObserver(placeKnots).observe(plinthEl);
  narrow.addEventListener('change', () => { row = peek = card = null; if (dlg.open) render(); });
  q<HTMLButtonElement>('.pg-menu').onclick = () => dlg.close();

  dlg.addEventListener('click', e => {
    const t = (e.target as Element).closest<HTMLElement>('[data-act], [data-brush], [data-nub], .pg-hits .sq, [data-pill], [data-when], [data-choice], [data-sealitem], [data-rm]');
    if (!t) { if (moreOpen) { moreOpen = false; renderTop(); } return; }
    const { sq: at, nub: l, brush: b, pill: pa, when: wa, choice, sealitem: sa, rm } = t.dataset;
    if (at) { if (brush) paint(at); else openWhy(at); return; }
    if (l) return toggleLine(l as Dir);
    if (b) return arm(b as Brush);
    if (pa || wa) return toggleRow((pa ?? wa) as Ability['a'], !!wa);
    if (choice) return choose(choice);
    if (sa) { pick = sa as Ability['a']; return render(); }
    if (rm) return removeRule(rm as Ability['a']);
    const act = t.dataset.act;
    if (act === 'shelf') return openShelf();
    if (act === 'closeshelf') return closeShelf();
    if (act === 'closecard') return closeCard();
    if (act === 'closewhy') return closeWhy();
    if (act === 'stamp') return stamp();
    if (act === 'morewhen') {
      row!.more = true;
      const n = whenChoices(row!.a).top.length;
      render();
      // The focus goes to the first of the choices that "More choices" shows.
      return q('.choices').querySelectorAll<HTMLElement>('button, select')[n]?.focus();
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
  dlg.addEventListener('change', e => { const s = e.target as HTMLSelectElement; if (s.matches('[data-near]')) choose(s.value); });
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
  // them acts under a sheet or in a text field; in a piece list only Esc acts.
  document.addEventListener('keydown', e => {
    const field = (e.target as Element).closest?.('input, textarea, select');
    if (!dlg.open || q('.pg-sheet[open]') || (field && e.key !== 'Escape')) return;
    if (e.key === 'Escape' && (row || card || shelfOpen || brush || moreOpen || weighOpen || why)) {
      e.preventDefault();
      // Esc closes only the row, and the focus goes back to its pill or chip.
      if (row) { const { a, when } = row; row = peek = null; render(); q<HTMLElement>(`[data-${when ? 'when' : 'pill'}="${a}"]`)?.focus(); }
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
    if (!dlg.open) dlg.showModal();
    show(item);
    revealOpenSlot();
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
