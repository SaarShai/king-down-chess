/**
 * The Proving Ground: the Workshop's view A (docs/specs/workshop-proving-ground), behind `?workshop=a`.
 * The open piece stands on its example board with its marks; the plinth shows its name, its figure and its rules;
 * the ledge opens the pool pieces and the designs on the shelf. The board is the editor (ticket 02): the brushes
 * paint squares, the nubs switch lines, and the first edit on a pool piece makes the player's private copy. Mockup:
 * docs/research/rules-ui-2026-10-10/mockups/proving-ground.html (its line numbers in the comments).
 * Loaded on demand (main.ts `import()`), as the old Workshop is.
 */
import './ground.css';
import { NAMES as PIECE, file, parseSq, rank, sq, sqName, type PieceType } from '../rules/engine';
import { pieceArt } from '../ui/guide';
import { figureUrl, selectedFigure } from './figures';
import { bandOf, judge } from './judge';
import { NAMES, chip, drawString, effect, ensureDefs, mirrorIcon, nub, seal, sigil, tagYours, tile, viewBox } from './marks';
import {
  DIR, DIRS, PRESETS, brushMark, canonical, designCode, empty, fromPreset, limit, lineOrbit, orbit, parseDesign, presetOf,
  type Brush, type Dir, type PaintOn, type PieceDesign,
} from './model';
import { BODY_TYPE, START, holds } from './moves';
import { letterOf } from './names';
import { boardOf, diffOf, examplesOf, sceneOf, type Kind, type Scene, type ScenePiece } from './scene';
import { MAX, deleteDesign, loadShelf, saveDesign, type SaveResult } from './store';
import { cap, esc, lineWords, partsText, pawns, ruleText } from './text';
import { blockOf, whenWords } from './vocab';

/** What the board and the plinth show: a pool piece, a design on the shelf (or the player's new copy), or a design from a link. */
interface Item { key: string; d: PieceDesign; yours: boolean }
const pool = (key: string): Item => { const p = PRESETS.find(x => x.key === key) ?? PRESETS[0]; return { key: `piece:${p.key}`, d: { ...fromPreset(p), name: p.name }, yours: false }; };
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const FILES = 'abcdefgh';
const BRUSHES: [Kind & Brush, string][] = [['move', 'Move'], ['take', 'Take'], ['both', 'Both']];
/** The key row's short words (proving-ground.html:1187). */
const SHORT: Record<string, string> = { asleep: 'Asleep', cond: 'Sometimes', shot: 'Shot', moveshot: 'Move or shot', line: 'Line', arch: 'Hops', push: 'Push', swap: 'Swap' };
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
    + `<div class="pg-ranks" aria-hidden="true">${[8, 7, 6, 5, 4, 3, 2, 1].map(r => `<span>${r}</span>`).join('')}</div>${chev}`
    + '<div class="pg-field"><svg class="pg-board" aria-hidden="true"></svg><div class="pg-coords" aria-hidden="true">'
    + [...FILES].map((f, i) => `<span style="left:calc(${(i + 1) * 12.5}% - 9px);bottom:3px">${f}</span>`).join('')
    + [8, 7, 6, 5, 4, 3, 2, 1].map((r, i) => `<span style="left:3px;top:calc(${i * 12.5}% + 3px)">${r}</span>`).join('')
    + `</div><div class="pg-hits" role="grid" aria-label="Board">${rows}</div><div class="pg-paint"></div></div></div></section>`
    + '<section class="pg-right" aria-label="Key"><div class="pg-brushes"></div><div class="pg-tools" hidden></div><p class="pg-hint"></p><div class="pg-keyrow" aria-label="Also on the board"></div></section></div>'
    + '<footer class="pg-ledge"><div class="ltabs" role="tablist" aria-label="Library"><button type="button" class="ltab on" role="tab" id="pg-tab" aria-selected="true" aria-controls="pg-row">Pieces</button></div>'
    + '<div class="lrow" id="pg-row" role="tabpanel" aria-labelledby="pg-tab"><div class="inner lip"></div></div></footer>'
    + '<div class="pg-alert" role="alert" hidden></div><p class="pg-toast" role="status" aria-live="polite"></p>';
  document.body.append(dlg);
  const q = <T extends Element = HTMLElement>(s: string): T => dlg.querySelector(s) as T;
  const plinthEl = q('.pg-plinth'), fieldEl = q('.pg-field'), boardEl = q<SVGSVGElement>('.pg-board'), hitsEl = q('.pg-hits'), paintEl = q('.pg-paint');
  const actsEl = q('.pg-acts'), moreEl = q('.pg-morepop'), brushesEl = q('.pg-brushes'), toolsEl = q('.pg-tools'), hintEl = q('.pg-hint'), keyEl = q('.pg-keyrow');
  const rowEl = q('.lrow'), slotsEl = q('.lrow .inner'), alertEl = q('.pg-alert'), toastEl = q('.pg-toast');
  /** The narrow layout (ground.css): the phone form of the mockup. */
  const narrow = matchMedia('(max-width: 999px)');

  let cur = pool('pawn'), shelf: PieceDesign[] = [], sc: Scene, board: Uint8Array = new Uint8Array(64), from = 0, kbd = 'd4', drawnAt = 0;
  /** Brush mode while a brush or tool is armed (proving-ground.html:1742); "Paint on" (the Mirror tool). */
  let brush: Brush | null = null, mirror: PaintOn = 'all';
  /** Undo steps of the open item, each with its scope (dialog.ts:315-331); the design the last save refused, and why. */
  let undos: { item: Item; label: string }[] = [], unsaved: { id: string; why: Exclude<SaveResult, 'saved'> } | null = null;
  /** The squares that pulse on the next draw; the open popovers. */
  let pulse: string[] = [], weighOpen = false, moreOpen = false, toolsOpen = false;
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
  /** Undo: back to the step before. Back before the first edit, the copy goes from the shelf (the mockup's undo). */
  function undo(): void {
    const u = undos.pop();
    if (!u) return;
    if (u.item.yours) { cur = u.item; save(); } else {
      deleteDesign(cur.d.id);
      cur = u.item;
      unsaved = null;
      shelf = loadShelf().designs;
    }
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

  function renderPlinth(): void {
    const d = cur.d, name = d.name || 'Piece', origin = cur.key.startsWith('piece:') ? undefined : PRESETS.find(p => d.from.length === 1 && p.key === d.from[0]);
    const rules = canonical(d).rules.map(r => {
      const b = blockOf(r.does.a), asleep = !b.event && r.when.on !== 'always' && !holds(r.when, board, from, START);
      // The When as a chip (an event's head names it: "when it takes a piece, not a pawn"), then what the rule does.
      const words = b.head ? partsText(b.head(r)) : whenWords(r.when), l1 = chip(r.when, { hollow: asleep, words: words.charAt(0).toLowerCase() + words.slice(1) });
      return { r, asleep, line: `<li class="sline">${seal(r.does.a, 44, { asleep })}<span class="txt">${l1 ? `<span class="l1">${l1}</span>` : ''}<span class="l2">${esc(partsText(b.say(r)))}</span></span></li>` };
    });
    const [head, like] = weighOpen ? weighWords() : ['', ''];
    plinthEl.innerHTML = `<div class="pg-name${cur.yours ? ' is-copy' : ''}"><div class="row"><h3${name.length > 9 ? ' class="long"' : ''}>${esc(name)}</h3>${cur.yours ? tagYours() : ''}`
      + `${cur.yours ? `<button type="button" class="pg-weigh" data-act="weigh" aria-expanded="${weighOpen}">${sigil('scale', 16)}Weigh</button>` : ''}</div>`
      + `${origin ? `<div class="from">from ${esc(origin.name)}</div>` : ''}</div>`
      + (weighOpen ? `<div class="pg-weighpop">${MEDAL}<b>${esc(head)}</b><small>${esc(like)}</small></div>` : '')
      + `<div class="pg-figure"><span class="halo"></span><img src="${esc(figureOf(d))}" alt=""></div><div class="pg-stone"><div class="top"></div><div class="front"></div></div>`
      + (rules.length ? `<ol class="pg-lines" aria-label="Rules">${rules.map(x => x.line).join('')}</ol>` : '')
      // The narrow layout shows the seals in a row beside the name; each one names its rule.
      + `<div class="pg-pseals">${rules.map(x => seal(x.r.does.a, 42, { asleep: x.asleep, label: ruleText(x.r) })).join('')}</div>`;
  }

  /* ---- the board (renderBoard, renderPaintFx, renderHits and squareLabel, proving-ground.html:1161, :1222-1281) ---- */

  const art = (p: ScenePiece): string => (p.open ? figureOf(cur.d) : pieceArt((PIECE as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b') ?? '');
  function drawBoard(): void {
    const s = fieldEl.clientWidth / 8;
    if (!s) return;
    drawnAt = s;
    boardEl.setAttribute('viewBox', viewBox(s));
    boardEl.innerHTML = drawString(sc, { s, art });
    for (const p of pulse) boardEl.querySelector(`[data-sq="${p}"]:not(.kdm-ghost)`)?.classList.add('kdm-ripple');
    pulse = [];
  }
  function squareLabel(at: string): string {
    const m = sc.marks.find(x => x.sq === at), occ = sc.pieces.find(p => p.sq === at);
    const who = occ ? `${occ.side === 'b' ? 'black' : 'white'} ${occ.open ? (cur.d.name || 'piece').toLowerCase() : occ.k}` : '';
    const kind = m && NAMES[m.k].toLowerCase();
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
      else if (m.k === 'shot' || m.k === 'moveshot') add(m.k, () => tile(m.k, 36), NAMES[m.k]);
    }
    if (sc.rails.length) add('line', () => tile('move', 36, { rail: true }), NAMES.line);
    if (sc.arches.length) add('arch', () => effect('arch', 36), NAMES.arch);
    for (const e of sc.effects) add(e.k, () => effect(e.k, 36), NAMES[e.k]);
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

  /** Draws everything for the open item. A control that a part replaced gets the focus back. */
  function render(): void {
    const a = document.activeElement as HTMLElement | null, keep = ['brush', 'act', 'nub', 'piece', 'design'].map(k => a?.dataset?.[k] && `[data-${k}="${a.dataset[k]}"]`).find(Boolean);
    // In brush mode the design stands alone on d4; a copy shows its paint diff against its pool piece.
    const pieces = examplesOf(brush ? { from: [] } : cur.d), d = cur.d;
    board = boardOf(pieces);
    from = parseSq(pieces[0].sq);
    sc = d.from[0] ? diffOf(d, presetOf(d.from[0]), board, from) : sceneOf(d, board, from);
    if (brush) {
      // The reach ends 3 squares out: a line shows 3 squares, then its arrow (designScene, proving-ground.html:781-797).
      sc.marks = sc.marks.filter(m => !out(m.sq));
      for (const r of sc.rails) if (out(r.to)) { const t = parseSq(r.to); r.to = sqName(sq(3 + 3 * Math.sign(file(t) - 3), 3 + 3 * Math.sign(rank(t) - 3))); r.end = 'arrow'; }
    }
    renderTop();
    renderPlinth();
    drawBoard();
    renderHits();
    renderPaint();
    renderRight();
    renderLedge();
    drawAlert();
    if (keep && !dlg.contains(document.activeElement)) (q<HTMLElement>(keep) ?? q<HTMLElement>('.pg-brushes button'))?.focus({ preventScroll: true });
  }
  /** Opens `item` on the plinth and the board, in look mode. On a short screen the narrow layout scrolls: go back to the top, to the board. */
  function show(item: Item): void {
    if (item.key !== cur.key) undos = [];
    cur = item;
    brush = null;
    weighOpen = moreOpen = toolsOpen = false;
    mirror = presetOf(item.d.from[0] ?? '').paintOn;
    kbd = examplesOf(item.d)[0].sq;
    dlg.scrollTop = 0;
    render();
  }
  new ResizeObserver(() => { if (fieldEl.clientWidth / 8 !== drawnAt) drawBoard(); }).observe(fieldEl);
  narrow.addEventListener('change', () => { if (dlg.open) render(); });
  q<HTMLButtonElement>('.pg-menu').onclick = () => dlg.close();

  dlg.addEventListener('click', e => {
    const t = (e.target as Element).closest<HTMLElement>('[data-act], [data-brush], [data-nub], .pg-hits .sq');
    if (!t) { if (moreOpen) { moreOpen = false; renderTop(); } return; }
    if (t.dataset.sq) { if (brush) paint(t.dataset.sq); return; }
    if (t.dataset.nub) return toggleLine(t.dataset.nub as Dir);
    if (t.dataset.brush) return arm(t.dataset.brush as Brush);
    const act = t.dataset.act;
    if (act === 'more' || act === 'tools' || act === 'mirror') {
      if (act === 'more') moreOpen = !moreOpen;
      if (act === 'tools') toolsOpen = !toolsOpen;
      if (act === 'mirror') mirror = ({ lr: 'all', all: 'one', one: 'lr' } as const)[mirror];
      return render();
    }
    moreOpen = false;
    if (act === 'undo') return undo();
    if (act === 'share') { renderTop(); return share(); }
    if (act === 'done') return leave();
    if (act === 'room') return makeRoom();
    if (act === 'copy') return void copyText(link(cur.d), 'Link copied.');
    if (act === 'retry') { save(); render(); if (!unsaved) toast('Saved on this device.'); return; }
    // Weigh: a popover in the name band; on the phone, from the ⋯ menu, a toast (proving-ground.html:1993).
    if (act === 'weigh' && narrow.matches) { renderTop(); return toast(weighWords().join(' ').trim()); }
    if (act === 'weigh') { weighOpen = !weighOpen; render(); }
  });
  // The keys (proving-ground.html:1957-1966): 1, 2 and 3 arm a brush, B goes in and out of brush mode, Esc closes a
  // popover or leaves brush mode, Ctrl or Cmd+Z undoes. None of them acts under a sheet or in a text field.
  document.addEventListener('keydown', e => {
    if (!dlg.open || q('.pg-sheet[open]') || (e.target as Element).closest?.('input, textarea, select')) return;
    if (e.key === 'Escape' && (brush || moreOpen || weighOpen)) {
      e.preventDefault();
      if (moreOpen || weighOpen) { moreOpen = weighOpen = false; render(); } else leave();
      return;
    }
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const b = ({ 1: 'move', 2: 'take', 3: 'both' } as Record<string, Brush>)[e.key];
    if (b) arm(b);
    else if (e.key === 'b' || e.key === 'B') { if (brush) leave(); else arm('move'); }
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
