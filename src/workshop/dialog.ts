/**
 * The Workshop dialog (revision 3 §2): HOME, START A PIECE, the piece editor (Moves, Rules,
 * Look), its sheets (the rule book, a pill's choices, Why?), sharing and Try it. One full-screen
 * `<dialog id="workshop">` that opens over its caller; Back closes it and the caller is still there.
 * Loaded on demand (main.ts `await import`), so none of it is in the main chunk.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import './workshop.css';
import { FIGURES, FIGURE_TAGS, selectedFigure, suggestedFigures, figureUrl, type Figure } from './figures';
import { snd } from '../render/sfx';
import { pieceIcon } from '../piece-icons';
import {
  BLANK, DIR, DIRS, MAX_RULES, PRESETS, designCode, empty, fromPreset, likeAlways, limit, orbit, setMark,
  parseDesign, presetOf, validName, type Body, type Dir, type Mark, type PaintOn, type PieceDesign, type Rule, type When,
} from './model';
import { BLOCKS, BODY, GROUPS, MORE_WHENS, TOP_WHENS, EVENT_WHENS, blockOf, takesAny, whenWords, type Block } from './vocab';
import { BAND_WORD, autoBody, badgeText, bandOf, judge, shelfOf, whyHead, whyTitle, type Label, type Verdict } from './judge';
import { lookOf, lookWords, type StageLook } from './look';
import { figureHtml, gaugeHtml, modelHtml } from './art';
import { cap, describe, dirWords, esc, pawns, ruleParts, ruleText } from './text';
import { autoName, letterFollows, letterOf, rollName, saveName } from './names';
import { MAX, deleteDesign, loadDesigns, loadShelf, saveDesign, type SaveResult } from './store';
import { sandbox } from './sandbox';
import { cancel, react } from './motion';

type Screen = 'home' | 'start' | 'editor' | 'try';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const rand = (n: number): number => Math.floor(Math.random() * n);
const pick = <T>(xs: readonly T[]): T => xs[rand(xs.length)];
const icon = (path: string): string => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
const DIE = icon('M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01');
const PEN = icon('M4 20l4-1 11-11-3-3L5 16zM14 6l3 3');
const UNDO = '<svg class="icon" aria-hidden="true"><use href="#i-undo"/></svg>';
const BACK = (to: string): string => `<button type="button" class="quiet ws-back">${icon('M15 5l-7 7 7 7')}<span>${to}</span></button>`;
const bar = (back: string, title: string, end = ''): string =>
  `<header class="ws-bar">${BACK(back)}<h2 id="ws-h" tabindex="-1">${esc(title)}</h2>${end}</header>`;

const PAINT: [PaintOn, string][] = [['all', 'All sides'], ['lr', 'Left and right'], ['one', 'One square']];
const PILL_WORD: Record<string, string> = { when: 'When', as: 'Like', over: 'Over', by: 'Taken', then: 'Then', with: 'With', into: 'Becomes', what: 'What' };
const PILL_TITLE: Record<string, string> = { as: 'Moves like which piece?', over: 'Passes over what?', by: 'Who cannot take it?', then: 'After the push', with: 'Swaps with whom?', into: 'Becomes what?', what: 'Which pieces?' };
const LIKE_ADDED: Record<string, string> = { king: "the king's squares", knight: "the knight's squares", bishop: "the bishop's lines", rook: "the rook's lines", queen: "the queen's lines" };
const DISCLAIMER = 'This is a guess from computer games with the pieces we know. A new mix can play stronger or weaker. You can keep it.';

/** The ray from the piece through (x, y), or null when (x, y) is on none of the 8. */
const rayOf = (x: number, y: number): Dir | null =>
  x && y && Math.abs(x) !== Math.abs(y) ? null : DIRS.find(d => DIR[d][0] === Math.sign(x) && DIR[d][1] === Math.sign(y)) ?? null;
const NEVER = 'never tested in computer games';

export function workshopDialog(): { open(): void; openDesign(code: string): void } {
  const dlg = document.createElement('dialog');
  dlg.id = 'workshop';
  dlg.setAttribute('aria-labelledby', 'ws-h');
  dlg.innerHTML = '<div class="ws-screen"></div><div class="ws-alert" role="alert" hidden></div><p class="ws-toast" role="status" aria-live="polite"></p>';
  document.body.append(dlg);
  const screenEl = dlg.querySelector<HTMLElement>('.ws-screen')!, toastEl = dlg.querySelector<HTMLElement>('.ws-toast')!, alertEl = dlg.querySelector<HTMLElement>('.ws-alert')!;
  const q = <T extends Element = HTMLElement>(s: string, root: ParentNode = dlg): T => root.querySelector(s) as T;
  const qa = <T extends Element = HTMLElement>(s: string, root: ParentNode = dlg): T[] => [...root.querySelectorAll<T>(s)];

  let screen: Screen = 'home';
  let cur: PieceDesign = fromPreset(BLANK), v: Verdict = judge(cur), fromLink = false, onShelf = false;
  let undos: { d: PieceDesign; label: string }[] = [], paintOn: PaintOn = 'all', takeMethod: 'take' | 'shoot' = 'take';
  let lastLabel: Label | '' = '';
  /** The look and verdict that the card shows: the start of the next reaction. */
  let shown: { look: StageLook; verdict: Verdict } | null = null;
  /** The design the last save refused, and why: the alert stays while it is the open design. */
  let unsaved: { id: string; why: Exclude<SaveResult, 'saved'> } | null = null;

  /* ---- small shared parts ---- */

  let toastTimer = 0;
  function toast(text: string): void {
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('on'), 3600);
  }
  let lastSound = 0;
  const sound = (f: () => void): void => { const t = performance.now(); if (t - lastSound >= 120) { lastSound = t; f(); } };
  const focusTitle = (): void => q<HTMLElement>('#ws-h')?.focus();
  /** Sets the HTML only when it changed (so focus and images stay); true when it did. */
  const put = (el: HTMLElement, html: string): boolean => { if (el.dataset.html === html) return false; el.innerHTML = html; el.dataset.html = html; return true; };

  /** A nested modal sheet; `wire` gets its body. */
  function sheet(title: string, html: string, wire: (body: HTMLElement, close: () => void) => void): void {
    const s = document.createElement('dialog');
    s.className = 'ws-sheet';
    s.setAttribute('aria-labelledby', 'ws-sheet-h');
    s.innerHTML = `<header class="ws-sheet-bar"><h2 id="ws-sheet-h" tabindex="-1" autofocus>${esc(title)}</h2><button type="button" class="quiet ws-close">Close</button></header><div class="ws-sheet-body">${html}</div>`;
    dlg.append(s);
    const close = (): void => s.close();
    s.addEventListener('close', () => s.remove());
    q<HTMLButtonElement>('.ws-close', s).onclick = close;
    // A tap on the backdrop closes it: src/dialog-dismiss.ts, for every dialog.
    wire(q('.ws-sheet-body', s), close);
    s.showModal();
  }

  /** The board cell: up to 44 px, as wide as the board column allows, and 24 px or more. A board is 7 cells plus 8 px of
   * lines. In short landscape (workshop.css) the whole board must also fit the height of the workspace. */
  const shortLandscape = matchMedia('(orientation: landscape) and (max-height: 500px)');
  function fit(): void {
    const board = q<HTMLElement>('.ws-board');
    if (!board) return;
    let cell = Math.min(44, Math.floor((board.parentElement!.clientWidth - 8) / 7));
    const area = board.closest<HTMLElement>('.ws-workspace');
    if (shortLandscape.matches && area) {
      const room = area.getBoundingClientRect().bottom - parseFloat(getComputedStyle(area).paddingBottom) - board.getBoundingClientRect().top - area.scrollTop;
      cell = Math.min(cell, Math.floor((room - 8) / 7));
    }
    dlg.style.setProperty('--cell', `${Math.max(24, cell)}px`);
  }
  addEventListener('resize', () => { if (dlg.open && !(document.activeElement as HTMLElement | null)?.matches('input[type="text"]')) fit(); });
  // A turn of the phone refits the boards, also while the name field has the focus.
  matchMedia('(orientation: landscape)').addEventListener('change', () => { if (dlg.open) fit(); });

  function show(s: Screen): void {
    clearTimeout(toastTimer);
    toastEl.classList.remove('on');
    cancel(screenEl);
    dlg.append(alertEl);
    for (const modal of qa<HTMLDialogElement>('.ws-sheet')) { modal.close(); modal.remove(); }
    screen = s;
    dlg.dataset.screen = s;
    ({ home, start, editor, try: tryIt })[s]();
    fit();
    drawAlert();
    focusTitle();
  }

  /* ---- saving (§2.2): every change; a refusal stays on screen until a save works ---- */

  /** Saves the open design; true when the device kept it. */
  function store(): boolean {
    cur.updated = Date.now();
    const r = saveDesign(cur);
    onShelf = r === 'saved';
    unsaved = r === 'saved' ? null : { id: cur.id, why: r };
    drawAlert();
    return onShelf;
  }
  function drawAlert(): void {
    const u = unsaved && unsaved.id === cur.id ? unsaved : null;
    alertEl.hidden = !u;
    dlg.append(alertEl);
    const status = q('.ws-save-state');
    if (status) status.textContent = fromLink ? 'From a link' : u ? 'Not saved' : onShelf ? 'Saved on this device' : 'New piece';
    if (!u) { alertEl.innerHTML = ''; delete alertEl.dataset.html; return; }
    const html = u.why === 'full'
      ? `<p>Not saved: your shelf is full (${MAX} designs). Delete one to keep this piece.</p><button type="button" class="ws-alert-del">Choose one to delete</button>`
      : '<p>Not saved: this device did not keep the design.</p><button type="button" class="ws-alert-retry">Try again</button>';
    if (!put(alertEl, `${html}<button type="button" class="quiet ws-alert-copy">Copy link</button>`)) return;
    q<HTMLButtonElement>('.ws-alert-retry', alertEl)?.addEventListener('click', () => { if (store()) toast('Saved on this device.'); });
    q<HTMLButtonElement>('.ws-alert-del', alertEl)?.addEventListener('click', makeRoom);
    q<HTMLButtonElement>('.ws-alert-copy', alertEl).onclick = () => void copyText(link(cur), 'Link copied.');
  }
  /** A full shelf: the player deletes one design, then the open one is saved. The open design stays as it is. */
  function makeRoom(): void {
    const list = loadDesigns();
    sheet('Delete one design', `<p>Your shelf holds ${MAX} designs. Delete one, and ${esc(cur.name)} is saved in its place.</p>`
      + list.map(d => `<div class="ws-room-row"><span>${esc(d.name)}</span><button type="button" class="ws-room-del" data-id="${esc(d.id)}" aria-label="Delete ${esc(d.name)}">Delete</button></div>`).join(''), (body, close) => {
      for (const b of qa<HTMLButtonElement>('.ws-room-del', body)) b.onclick = () => {
        const name = list.find(d => d.id === b.dataset.id)?.name ?? '';
        if (!deleteDesign(b.dataset.id!)) return toast('Could not delete: this device refused.');
        close();
        toast(store() ? `Deleted ${name}. ${cur.name} is saved.` : `Deleted ${name}.`);
      };
    });
  }
  const link = (d: PieceDesign): string => `${location.origin}${location.pathname}?design=${designCode(d)}`;
  /** Copies `text`; where the device refuses, a sheet shows it, selected, to copy by hand. */
  async function copyText(text: string, done: string): Promise<void> {
    try { await navigator.clipboard.writeText(text); toast(done); } catch {
      sheet('Copy this', '<p>This device did not let the game copy. Select the text and copy it.</p><textarea class="ws-copy-box" readonly rows="5" aria-label="The text to copy"></textarea>', body => {
        const t = q<HTMLTextAreaElement>('textarea', body);
        t.value = text;
        requestAnimationFrame(() => { t.focus(); t.select(); });
      });
    }
  }

  /* ---- HOME (W1) ---- */

  function home(): void {
    const { designs: list, bad } = loadShelf();
    screenEl.innerHTML = bar('Back', 'Workshop') + '<div class="ws-scroll">'
      + '<div class="ws-doors">'
      + `<button type="button" class="ws-door" data-door="piece"><img src="${figureUrl('wind-courier')}" alt="" /><b>New piece</b></button>`
      + `</div><button type="button" class="ws-surprise">${DIE}<span>Surprise me</span></button>`
      + `<h3>Your designs (${list.length}), on this device</h3>`
      + (list.length ? `<div class="ws-shelf">${list.map((d, i) => { const jv = judge(d, false); return `<button type="button" class="ws-tile${jv.warn ? ' warn' : ''}" data-i="${i}">`
        + `<span class="ws-tile-art" aria-hidden="true">${modelHtml(lookOf(d))}</span><b>${esc(d.name)}</b><small>${shelfOf(jv)}</small></button>`; }).join('')}</div>`
        : '<p class="ws-empty">Your pieces will appear here. They are saved on this device.</p>')
      + (bad ? `<p class="ws-note">${bad === 1 ? '1 saved entry' : `${bad} saved entries`} could not be read. ${bad === 1 ? 'It stays' : 'They stay'} on this device; the other designs work.</p>` : '')
      + '</div>';
    q<HTMLButtonElement>('.ws-back').onclick = () => dlg.close();
    q<HTMLButtonElement>('[data-door="piece"]').onclick = () => show('start');
    q<HTMLButtonElement>('.ws-surprise').onclick = surpriseMe;
    for (const b of qa<HTMLButtonElement>('.ws-tile')) b.onclick = () => edit(list[+b.dataset.i!], { shelf: true });
  }

  /* ---- START A PIECE (W2) ---- */

  function start(): void {
    screenEl.innerHTML = bar('Workshop', 'New piece') + '<div class="ws-scroll">'
      + '<p class="ws-lead">Choose a character. Then add its moves and rules.</p>'
      + `<div class="ws-figure-grid ws-cast-start">${FIGURES.map(f => `<button type="button" class="ws-body ws-figure-choice" data-new-figure="${f.id}"><img src="${figureUrl(f.id)}" alt="" loading="lazy" /><b>${f.name}</b></button>`).join('')}</div></div>`;
    q<HTMLButtonElement>('.ws-back').onclick = () => show('home');
    for (const b of qa<HTMLButtonElement>('[data-new-figure]')) b.onclick = () => {
      const f = FIGURES.find(f => f.id === b.dataset.newFigure)!;
      const d = fromPreset(BLANK);
      d.look.figure = f.id;
      d.name = f.name;
      d.named = true;
      d.letter = letterOf(d.name);
      edit(d);
    };
  }

  /** The name and letter follow the design until the player names it. */
  function named(d: PieceDesign): PieceDesign {
    if (!d.named) {
      const follows = letterFollows(d);
      d.name = autoName(d, autoBody(d));
      if (follows) d.letter = letterOf(d.name);
    }
    if (!d.letter) d.letter = letterOf(d.name);
    return d;
  }

  /* ---- Surprise me (§4.8) ---- */

  function randomEdit(d: PieceDesign): void {
    const k = rand(3);
    if (k === 0) {
      const x = rand(7) - 3, y = rand(7) - 3;
      if (!x && !y) return;
      const pts = orbit(x, y, 'all'), had = d.squares.some(s => s.x === x && s.y === y), mark = pick<Mark>(['both', 'both', 'move', 'take', 'shoot']);
      d.squares = d.squares.filter(s => !pts.some(([a, b]) => a === s.x && b === s.y));
      if (!had) d.squares.push(...pts.map(([a, b]) => ({ x: a, y: b, mark })));
    } else if (k === 1) {
      const dir = pick(DIRS), pair = [dir, DIRS[(DIRS.indexOf(dir) + 4) % 8]];
      d.lines = d.lines.includes(dir) ? d.lines.filter(l => !pair.includes(l)) : DIRS.filter(l => d.lines.includes(l) || pair.includes(l));
    } else if (d.rules.length < MAX_RULES) {
      const b = BLOCKS.filter(x => !d.rules.some(r => r.does.a === x.a) && !x.needs?.(d));
      if (b.length) { const rules = [...d.rules, clone(pick(b).rule)]; if (!limit({ ...d, rules })) d.rules = rules; }
    }
  }
  function surpriseMe(): void {
    let d: PieceDesign | null = null, base: PieceDesign | null = null;
    for (let i = 0; i < 20 && !d; i++) {
      const b = fromPreset(pick(PRESETS)), x = clone(b);
      for (let n = 1 + rand(3); n > 0; n--) randomEdit(x);
      if (limit(x) || empty(x)) continue;
      const jv = judge(x, false);
      if (jv.label === 'fair' && !jv.flags.some(f => f.level === 'warn') && jv.memory.level <= 1) { d = x; base = b; }
    }
    if (!d) d = base = fromPreset(presetOf('knight')); // ponytail: 20 rolls almost always find one; the knight is the fallback
    d.name = rollName(d, autoBody(d));
    d.named = true;
    d.letter = letterOf(d.name);
    d.ownLetter = false;
    const back = { ...clone(d), squares: base!.squares, lines: base!.lines, rules: base!.rules };
    edit(d, { paintOn: 'all', undo: same(back, d) ? undefined : { d: back, label: 'the surprise' } });
    toast(`A surprise: ${d.name}. Change anything.`);
  }

  /* ---- the editor (W3–W8, W15) ---- */

  function edit(d: PieceDesign, o: { paintOn?: PaintOn; shelf?: boolean; undo?: { d: PieceDesign; label: string } } = {}): void {
    cur = d; onShelf = !!o.shelf; fromLink = false;
    undos = o.undo ? [o.undo] : [];
    takeMethod = 'take'; paintOn = o.paintOn ?? presetOf(d.from[0] ?? 'blank').paintOn;
    lastLabel = '';
    show('editor');
    if (!onShelf) store();
  }

  function editor(): void {
    screenEl.innerHTML = '<div class="ws-editor ws-dashboard">'
      + bar('Workshop', 'Your piece', '<span class="ws-save-state" role="status"></span><button type="button" class="ws-share">Share</button>')
      + '<div class="ws-workspace"><article class="ws-piece-card" aria-label="Your piece"><div class="ws-card-border"><div class="ws-portrait"><div class="ws-model-box" aria-hidden="true"></div><div class="ws-gauge-box"></div></div><div class="ws-name-row"></div><p class="ws-worth"></p><div class="ws-bottom"></div><div class="ws-appearance" hidden></div>'
      + (fromLink ? '<button type="button" class="primary ws-keep-copy">Keep a copy</button>' : '')
      + '<p class="sr-only ws-summary"></p><p class="sr-only ws-live" role="status"></p></div></article>'
      + '<div class="ws-properties"><div class="ws-patterns"></div><section class="ws-rules-panel" aria-label="Properties"></section><section class="ws-property-options" hidden></section></div></div>'
      + '<footer class="ws-footer"><button type="button" class="quiet ws-undo" aria-label="Undo">'+UNDO+'</button><button type="button" class="quiet ws-why">Why this estimate?</button><button type="button" class="primary ws-try">Try it</button></footer></div>';
    q<HTMLButtonElement>('.ws-back').onclick = () => show('home');
    q<HTMLButtonElement>('.ws-share').onclick = share;
    q<HTMLButtonElement>('.ws-why').onclick = why;
    q<HTMLButtonElement>('.ws-try').onclick = () => {
      if (empty(cur)) return toast('Add a move or a take first.');
      if (!fromLink && !onShelf) store();
      show('try');
    };
    q<HTMLButtonElement>('.ws-keep-copy')?.addEventListener('click', keepCopy);
    movesTab(q('.ws-patterns'));
    update(true);
  }

  /** The choices panel; `opener` selects the button that opened it, and the focus goes back to it on close (Esc: the dialog's keydown). */
  function propertySheet(title: string, html: string, wire: (body: HTMLElement, close: () => void) => void, opener = '.ws-add'): void {
    const host = q<HTMLElement>('.ws-property-options');
    host.hidden = false;
    host.innerHTML = `<header><h3 tabindex="-1">${esc(title)}</h3><button type="button" class="quiet ws-property-close" aria-label="Close choices">×</button></header><div class="ws-property-body">${html}</div>`;
    const close = () => { host.hidden = true; host.innerHTML = ''; (q<HTMLButtonElement>(opener) ?? q<HTMLButtonElement>('.ws-add'))?.focus({ preventScroll: true }); };
    q<HTMLButtonElement>('.ws-property-close', host).onclick = close;
    // The + picker and the keyboard: ArrowDown and ArrowUp move the focus along the rules that can be added; Enter adds one.
    host.onkeydown = e => {
      const step = ({ ArrowDown: 1, ArrowUp: -1 } as Record<string, number>)[e.key], rows = qa<HTMLButtonElement>('.ws-book-row:not([disabled])', host);
      if (!step || !rows.length) return;
      e.preventDefault();
      const i = rows.indexOf(document.activeElement as HTMLButtonElement);
      rows[i < 0 ? (step > 0 ? 0 : rows.length - 1) : (i + step + rows.length) % rows.length].focus();
    };
    wire(q('.ws-property-body', host), close);
    q<HTMLElement>('h3', host).focus();
  }

  /** One undo step: `f` changes the design; nothing happens when it changes nothing. */
  function change(label: string, f: (d: PieceDesign) => void, o: { merge?: boolean; noise?: () => void } = {}): boolean {
    const before = clone(cur);
    f(cur);
    if (same(before, cur)) return false;
    if (!o.merge) { undos.push({ d: before, label }); if (undos.length > 50) undos.shift(); }
    named(cur);
    store();
    update(false, o.noise);
    return true;
  }
  function undo(): void {
    const u = undos.pop();
    if (!u) return;
    cur = u.d;
    store();
    update(false);
  }

  /** The stage, the side column and the open tab, after a change. The render ends with the Set A reaction, except on a first render. */
  function update(first: boolean, noise?: () => void): void {
    cancel(screenEl);
    v = judge(cur);
    const l = lookOf(cur), d = describe(cur), w = v.worth.point;
    put(q('.ws-model-box'), modelHtml(l));
    const nameRow = q('.ws-name-row');
    if (!q('input', nameRow) && put(nameRow, `<span class="ws-name-t">${esc(cur.name)}</span><button type="button" class="quiet ws-name" aria-label="Change name"${fromLink ? ' disabled' : ''}>${PEN}</button><button type="button" class="quiet ws-eye" aria-label="Choose appearance" aria-expanded="${!q<HTMLElement>('.ws-appearance').hidden}"${fromLink ? ' hidden' : ''}>${icon('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0')}</button>`)) {
      q<HTMLButtonElement>('.ws-name').onclick = rename;
      q<HTMLButtonElement>('.ws-eye').onclick = () => {
        const box = q<HTMLElement>('.ws-appearance'); box.hidden = !box.hidden;
        q('.ws-eye').setAttribute('aria-expanded', String(!box.hidden));
        if (!box.hidden) lookTab(box);
      };
    }
    q('.ws-worth').textContent = empty(cur) ? 'Add moves and takes on the boards.' : `Estimated worth · ${pawns(w)}`;
    q('.ws-gauge-box').innerHTML = gaugeHtml(v);
    put(q('.ws-bottom'), empty(cur) ? '' : `<span class="ws-learn">${bandOf(v)}</span>`);
    rulesTab(q('.ws-rules-panel'));
    paintBoard();
    const appearance = q<HTMLElement>('.ws-appearance');
    if (!appearance.hidden) lookTab(appearance);
    q('.ws-summary').textContent = `${lookWords(l)} ${d.summary} About ${pawns(w)}, ${bandOf(v).toLowerCase()}.`;
    const live = q('.ws-live'), say = `About ${pawns(w)}. ${bandOf(v)}.`;
    if (!first && v.label !== lastLabel && live.textContent !== say) live.textContent = say;
    lastLabel = v.label;
    if (!first) sound(noise ?? snd.move);
    for (const ub of qa<HTMLButtonElement>('.ws-undo')) {
      ub.disabled = !undos.length || fromLink; ub.onclick = undo;
    }
    drawAlert();
    fit();
    if (!first && shown) react(screenEl, shown.look, l, shown.verdict, v);
    shown = { look: l, verdict: v };
  }
  function rename(): void {
    const row = q('.ws-name-row');
    row.innerHTML = `<input class="ws-name-in" type="text" maxlength="18" aria-label="Name" value="${esc(cur.name)}" />`;
    const inp = q<HTMLInputElement>('input', row);
    let done = false;
    const end = (keep: boolean): void => {
      if (done) return;
      done = true;
      const s = inp.value.trim();
      row.innerHTML = '';
      delete row.dataset.html; // so update() draws the name again, changed or not
      let changed = false;
      if (keep && s && s !== cur.name) {
        if (!validName(s)) toast("A name uses letters, digits, spaces, - and ', up to 18.");
        else changed = change('rename', x => { const follows = letterFollows(x); x.name = saveName(s); x.named = true; if (follows) x.letter = letterOf(x.name); });
      }
      // One render: the change renders the edit (and its reaction); else the name row needs the full render.
      if (!changed) update(true);
      q<HTMLButtonElement>('.ws-name').focus();
    };
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); end(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); }
    };
    inp.onblur = () => end(true);
    inp.focus();
    inp.select();
  }

  /* ---- the panel: Moves, Rules, Look ---- */

  const guardType = (): boolean => cur.rules.some(r => r.does.a === 'cannotBeTaken' && r.does.by === 'allButKing');
  const H2B = 'Only a king can take this piece, so it cannot take. Remove that rule first.';

  function movesTab(p: HTMLElement): void {
    const grid = (mode: 'move' | 'take'): string => {
      let cells = '';
      for (let y = 3; y >= -3; y--) for (let x = -3; x <= 3; x++) cells += `<button type="button" class="ws-cell${x || y ? '' : ' ws-me'}" data-x="${x}" data-y="${y}" tabindex="${x || y ? -1 : 0}"${fromLink ? ' disabled' : ''}><i class="ws-arrow" aria-hidden="true"></i></button>`;
      return `<section class="ws-pattern"><h3>${mode === 'move' ? 'Moves' : 'Takes'}</h3><p class="ws-mode">${mode === 'move' ? 'Tap empty squares it can move to.' : 'Tap squares where it can take an enemy.'}</p><p class="ws-fwd">forward ↑</p><div class="ws-board" data-action="${mode === 'take' ? takeMethod : mode}" role="group" aria-label="${mode === 'move' ? 'Moves' : 'Takes'}">${cells}</div><p class="ws-caption"></p>${mode === 'take' && !fromLink ? '<label class="ws-take-mode">Take by <select aria-label="Take method"><option value="take">Moving there</option><option value="shoot">Shooting</option></select></label>' : ''}</section>`;
    };
    p.innerHTML = (!fromLink ? `<label class="ws-symmetry">Apply to <select name="ws-paint" aria-label="Apply to">${PAINT.map(([k,t]) => `<option value="${k}"${k === paintOn ? ' selected' : ''}>${t}</option>`).join('')}</select></label>` : '')
      + `<div class="ws-dual-boards">${grid('move')}${grid('take')}</div>`
      + `<details class="ws-sliding"><summary>Sliding directions</summary><p>Slides continue until a piece stops them. They apply to both moves and takes.</p><div class="ws-directions">${DIRS.map(dir => `<button type="button" data-dir="${dir}" aria-label="Slide ${dir}"${fromLink ? ' disabled' : ''}>${({n:'↑',ne:'↗',e:'→',se:'↘',s:'↓',sw:'↙',w:'←',nw:'↖'})[dir]}</button>`).join('')}</div></details>`;
    q<HTMLSelectElement>('[name="ws-paint"]', p)?.addEventListener('change', e => { paintOn = (e.target as HTMLSelectElement).value as PaintOn; });
    q<HTMLSelectElement>('.ws-take-mode select', p)?.addEventListener('change', e => { q<HTMLElement>('.ws-board[data-action="take"], .ws-board[data-action="shoot"]', p).dataset.action = takeMethod = (e.target as HTMLSelectElement).value as 'take' | 'shoot'; paintBoard(); });
    const method = q<HTMLSelectElement>('.ws-take-mode select', p); if (method) method.value = takeMethod;
    for (const board of qa<HTMLElement>('.ws-board', p)) if (!fromLink) wireBoard(board);
    for (const b of qa<HTMLButtonElement>('[data-dir]', p)) b.onclick = () => {
      if (guardType()) return toast(H2B);
      const dir = b.dataset.dir as Dir;
      change('change sliding direction', d => { d.lines = d.lines.includes(dir) ? d.lines.filter(x => x !== dir) : DIRS.filter(x => d.lines.includes(x) || x === dir); });
    };
  }

  function paintBoard(): void {
    const description = describe(cur);
    for (const board of qa<HTMLElement>('.ws-board')) {
      const mode = board.dataset.action;
      for (const b of qa<HTMLButtonElement>('.ws-cell', board)) {
        const x = +b.dataset.x!, y = +b.dataset.y!;
        if (!x && !y) { put(b, figureHtml({ figure: selectedFigure(cur).id, army: cur.look.army }, 'ws-me-fig')); b.setAttribute('aria-label', 'Your piece'); continue; }
        const s = cur.squares.find(s => s.x === x && s.y === y), ray = rayOf(x, y), line = !!ray && cur.lines.includes(ray);
        const active = mode === 'move' ? s && ['move','both','moveShoot'].includes(s.mark) : s && ['take','both','shoot','moveShoot'].includes(s.mark);
        const shot = s && ['shoot','moveShoot'].includes(s.mark);
        b.className = `ws-cell${(x+y)&1 ? ' dk' : ''}${active ? mode === 'move' ? ' c-move' : shot ? ' c-shoot' : ' c-take' : ''}${line ? ` ln ln-${ray}${Math.max(Math.abs(x),Math.abs(y))===3 ? ' ln-end' : ''}` : ''}`;
        b.setAttribute('aria-pressed', String(!!active || line));
        b.setAttribute('aria-label', `${dirWords(x,y)}: ${active || line ? 'on' : 'off'}${line ? ', slide' : ''}`);
      }
      q('.ws-caption', board.parentElement!).textContent = cap(mode === 'move' ? description.moves : description.takes);
    }
    for (const b of qa<HTMLButtonElement>('[data-dir]')) b.setAttribute('aria-pressed', String(cur.lines.includes(b.dataset.dir as Dir)));
  }

  function wireBoard(board: HTMLElement): void {
    let touch: { x: number; y: number; cell: HTMLElement } | null = null;
    let drag: { result: boolean | undefined; seen: Set<Element>; changed: boolean } | null = null;
    const paint = (b: HTMLElement, first: boolean): void => {
      const x = +b.dataset.x!, y = +b.dataset.y!;
      if (!x && !y) return;
      const channel = board.dataset.action as 'move' | 'take' | 'shoot';
      const beforeMark = cur.squares.find(s => s.x === x && s.y === y)?.mark;
      if (drag!.result === undefined) drag!.result = !(channel === 'move' ? beforeMark && ['move','both','moveShoot'].includes(beforeMark) : beforeMark && ['take','both','shoot','moveShoot'].includes(beforeMark));
      const on = drag!.result;
      if (guardType() && channel !== 'move' && on) return toast(H2B);
      const pts = orbit(x, y, paintOn);
      const ok = change('change '+channel+' squares', d => {
        for (const [a,c] of pts) {
          const old = d.squares.find(s => s.x === a && s.y === c);
          const mark = setMark(old?.mark, channel, on);
          d.squares = d.squares.filter(s => s.x !== a || s.y !== c);
          if (mark) d.squares.push({x:a,y:c,mark});
        }
      }, { merge: drag!.changed, noise: channel === 'move' ? snd.move : channel === 'take' ? snd.capture : snd.shot });
      drag!.changed ||= ok;
    };
    const cellAt = (e: PointerEvent): HTMLElement | null => (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('.ws-cell') ?? null;
    board.onpointerdown = e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.ws-cell');
      if (!b || e.button > 0) return;
      if (e.pointerType === 'touch') { touch = { x: e.clientX, y: e.clientY, cell: b }; return; }
      e.preventDefault();
      // The board keeps the pointer, so a release anywhere (off the board too) ends the stroke.
      try { board.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone */ }
      rove(b, false);
      drag = { result: undefined, seen: new Set([b]), changed: false };
      paint(b, true);
    };
    board.onpointermove = e => {
      if (!drag) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { drag = null; return; } // released where no event reached the board
      const b = cellAt(e);
      if (b && board.contains(b) && !drag.seen.has(b)) { drag.seen.add(b); paint(b, false); }
    };
    board.onpointerup = e => {
      if (touch && Math.hypot(e.clientX - touch.x, e.clientY - touch.y) < 8) {
        drag = { result: undefined, seen: new Set([touch.cell]), changed: false };
        paint(touch.cell, true);
      }
      touch = null; drag = null;
    };
    board.onpointercancel = board.onlostpointercapture = () => { touch = null; drag = null; };
    // The keyboard: Enter or Space click the focused square (detail 0); a pointer tap painted on pointerdown.
    board.onclick = e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.ws-cell');
      if (!b || e.detail !== 0) return;
      drag = { result: undefined, seen: new Set([b]), changed: false };
      paint(b, true);
      drag = null;
    };
    board.onkeydown = e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.ws-cell');
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!b || !k) return;
      e.preventDefault();
      const x = Math.max(-3, Math.min(3, +b.dataset.x! + k[0])), y = Math.max(-3, Math.min(3, +b.dataset.y! + k[1]));
      rove(q<HTMLElement>(`.ws-cell[data-x="${x}"][data-y="${y}"]`, board), true);
    };
    function rove(b: HTMLElement, focus: boolean): void {
      for (const c of qa<HTMLElement>('.ws-cell', board)) c.tabIndex = c === b ? 0 : -1;
      if (focus) b.focus();
    }
  }

  function rulesTab(p: HTMLElement): void {
    const full = cur.rules.length >= MAX_RULES;
    p.innerHTML = `<header class="ws-properties-title"><h3>Properties</h3><span>${cur.rules.length} / ${MAX_RULES}</span></header><div class="ws-property-cards">`
      + cur.rules.map((r,i) => `<article class="ws-rule"><header><span class="ws-property-icon" aria-hidden="true">${icon(blockOf(r.does.a).icon)}</span><b>${esc(blockOf(r.does.a).title)}</b>${fromLink ? '' : `<button type="button" class="quiet ws-remove" data-i="${i}" aria-label="Remove ${esc(blockOf(r.does.a).title)}">×</button>`}</header><p class="ws-sentence">${fromLink ? esc(ruleText(r)) : partsHtml(r,i)}</p></article>`).join('')
      + (fromLink ? '' : `<button type="button" class="ws-add" aria-label="Add a property"${full ? ' disabled' : ''}>${icon('M12 5v14M5 12h14')}</button>`) + '</div>';
    for (const b of qa<HTMLButtonElement>('.ws-remove', p)) b.onclick = () => {
      const i = +b.dataset.i!;
      change('remove a rule', d => { d.rules.splice(i, 1); });
    };
    q<HTMLButtonElement>('.ws-add', p)?.addEventListener('click', ruleBook);
    for (const b of qa<HTMLButtonElement>('.ws-pill', p)) b.onclick = () => pillSheet(+b.dataset.i!, b.dataset.pill!);
  }
  /** A rule's sentence: fixed words and pill buttons. */
  function partsHtml(r: Rule, i: number): string {
    return ruleParts(r, true).map(part => typeof part === 'string' ? esc(part)
      : `<button type="button" class="ws-pill" data-i="${i}" data-pill="${part.pill}" aria-label="${PILL_WORD[part.pill] ?? 'Choice'}: ${esc(part.text.toLowerCase())}. Change.">${esc(part.text)}</button>`).join('');
  }

  function lookTab(p: HTMLElement): void {
    const galleryOpen = q<HTMLDetailsElement>('.ws-gallery', p)?.open ?? false;
    const filter = q<HTMLSelectElement>('.ws-figure-filter select', p)?.value ?? 'All';
    const L = cur.look, chosen = selectedFigure(cur);
    const figureButton = (f: Figure): string => `<button type="button" class="ws-body ws-figure-choice" data-figure="${f.id}" data-tags="${f.tags.join(' ')}" aria-pressed="${chosen.id === f.id}" aria-label="${f.name}"><img src="${figureUrl(f.id, L.army)}" alt="" loading="lazy" /><b>${f.name}</b><small>${f.tags.join(' + ')}</small></button>`;
    p.innerHTML = '<h3>Appearance</h3><p class="ws-note">The artwork does not change the rules.</p>'
      + `<div class="ws-figure-grid">${suggestedFigures(cur).map(figureButton).join('')}</div>`
      + `<details class="ws-gallery"><summary>All ${FIGURES.length} figures</summary><label class="ws-figure-filter">Show <select aria-label="Figure type"><option>All</option>${FIGURE_TAGS.map(t => `<option>${t}</option>`).join('')}</select></label><div class="ws-figure-grid">${FIGURES.map(figureButton).join('')}</div></details>`
      + `<fieldset class="seg ws-army"><legend>Army</legend><div class="seg-row">${['Ivory','Charcoal'].map((t,i) => `<label><input type="radio" name="ws-army" value="${i}"${L.army === i ? ' checked' : ''}/><span>${t}</span></label>`).join('')}</div></fieldset>`;
    q<HTMLDetailsElement>('.ws-gallery', p).open = galleryOpen;
    q<HTMLSelectElement>('.ws-figure-filter select', p).value = filter;
    for (const b of qa<HTMLElement>('.ws-gallery [data-figure]', p)) b.hidden = filter !== 'All' && !b.dataset.tags!.split(' ').includes(filter);
    for (const b of qa<HTMLButtonElement>('[data-figure]', p)) b.onclick = () => change('change the figure', d => { d.look.figure = b.dataset.figure!; });
    q<HTMLSelectElement>('.ws-figure-filter select', p).onchange = e => {
      const tag = (e.target as HTMLSelectElement).value;
      for (const b of qa<HTMLElement>('.ws-gallery [data-figure]', p)) b.hidden = tag !== 'All' && !b.dataset.tags!.split(' ').includes(tag);
    };
    for (const r of qa<HTMLInputElement>('input[name="ws-army"]', p)) r.onchange = () => change('change the army', d => { d.look.army = +r.value as 0 | 1; });
  }

  /* ---- sheets: the rule book (W5), a pill's choices (W6), Why? (W8) ---- */

  function ruleBook(): void {
    const reason = (b: Block): string | null => cur.rules.some(r => r.does.a === b.a) ? 'Already in this piece.'
      : b.needs?.(cur) ?? limit({ ...cur, rules: [...cur.rules, b.rule] });
    const row = (b: Block): string => {
      const why = reason(b), dv = v.deltas[b.a];
      return `<button type="button" class="ws-book-row" data-a="${b.a}"${why ? ' disabled' : ''}>`
        + `<svg class="icon ws-book-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${b.icon}"/></svg>`
        + `<span class="ws-book-t"><b>${b.title}</b><small>${why ?? b.example}</small></span>`
        + `<span class="ws-book-badge" aria-label="${dv ? `${badgeText(dv.v)} pawn${dv.unsure ? `, a guess: ${NEVER}` : ''}` : 'cannot work'}">${dv ? `${badgeText(dv.v)}${dv.unsure ? '?' : ''}` : '--'}</span>`
        + `<span class="ws-seen" aria-hidden="true">${b.seenOn.map(x => pieceIcon(BODY[x].type)).join('')}</span></button>`;
    };
    propertySheet('Add a property', `<details class="ws-key"><summary>+1: about 1 pawn more. “?”: a guess.</summary><p>The number is about how many pawns the rule adds to this piece. A rule that works only some of the time adds less. “?” marks a guess: ${NEVER}.</p></details>` + GROUPS.map(g => `<h3>${g}</h3>${BLOCKS.filter(b => b.group === g).map(row).join('')}`).join(''), (body, close) => {
      for (const b of qa<HTMLButtonElement>('.ws-book-row', body)) b.onclick = () => {
        const block = blockOf(b.dataset.a as Block['a']);
        close();
        const noise = block.a === 'push' ? snd.shove : block.a === 'swap' ? snd.swap : block.a === 'chain' ? snd.chain : undefined;
        change('add a rule', d => { d.rules.push(clone(block.rule)); }, { noise });
      };
    });
  }

  /** A choice sheet commits a tap at once; the keyboard's arrows only move the choice, and Enter or Apply commits it. */
  function choiceSheet(title: string, rows: string, r: Rule, opener: string, apply: (inp: HTMLInputElement, body: HTMLElement) => void, wire?: (body: HTMLElement) => void): void {
    propertySheet(title, `${rows}<div class="ws-sheet-actions ws-apply-row"><button type="button" class="primary ws-apply">Apply</button></div>`, (body, close) => {
      let pointer = false;
      body.addEventListener('pointerdown', () => { pointer = true; });
      body.addEventListener('keydown', () => { pointer = false; }, true);
      // The sheet acts on the rule it was opened for; if that rule changed meanwhile, it only closes.
      const go = (inp: HTMLInputElement | null): void => { close(); if (inp && cur.rules.includes(r)) apply(inp, body); };
      const checked = (): HTMLInputElement | null => q<HTMLInputElement>('input[type="radio"]:checked', body);
      for (const inp of qa<HTMLInputElement>('input[type="radio"]', body)) {
        inp.onchange = () => { if (pointer) go(inp); };
        inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(inp.checked ? inp : checked()); } };
      }
      q<HTMLButtonElement>('.ws-apply', body).onclick = () => go(checked());
      wire?.(body);
    }, opener);
  }
  const pillButton = (i: number, key: string): string => `.ws-pill[data-i="${i}"][data-pill="${key}"]`;

  function pillSheet(i: number, key: string): void {
    const r = cur.rules[i], b = blockOf(r.does.a);
    if (key === 'when') return whenSheet(i);
    const val = (r.does as unknown as Record<string, string>)[key];
    const rows = b.pill!.choices.map(([k, text]) => {
      const next = { ...cur, rules: cur.rules.map((x, j) => j === i ? { ...x, does: { ...x.does, [key]: k } } as Rule : x) };
      const why = k === 'allButKing' && takesAny(cur) ? 'Only for a piece that takes nothing.' : k !== val && limit(next) ? limit(next) : null;
      return `<label class="ws-choice${why ? ' off' : ''}"><input type="radio" name="ws-pick" value="${k}"${k === val ? ' checked' : ''}${why ? ' disabled' : ''} /><span>${cap(text)}${why ? `<small>${why}</small>` : ''}</span></label>`;
    }).join('');
    choiceSheet(PILL_TITLE[key] ?? b.title, rows, r, pillButton(i, key), inp => {
      const j = cur.rules.indexOf(r);
      change('change a choice', d => { (d.rules[j].does as unknown as Record<string, string>)[key] = inp.value; });
    });
  }

  function whenSheet(i: number): void {
    const r = cur.rules[i], b = blockOf(r.does.a), like = r.does.a === 'movesLike';
    const fits = (w: When): boolean => b.whens(w) || (like && w.on === 'always');
    const all = (b.event ? EVENT_WHENS : [...TOP_WHENS, ...MORE_WHENS]).filter(fits);
    const top = b.event ? all : all.filter(w => TOP_WHENS.includes(w));
    const label = (w: When): string => w.on === 'always' && like ? 'Always (adds it to Moves)' : w.on === 'zone' && w.zone === 'capital' ? 'On a center square (d4 e4 d5 e5)' : cap(whenWords(w));
    // "Always" moves the squares into the Moves tab; where a shot would land on a square it also takes by moving, a square cannot hold both.
    const merged = r.does.a === 'movesLike' ? likeAlways(cur, r.does.as) : null;
    const off = (w: When): string | null => (like && w.on === 'always' && !merged ? 'Its shots and these moves meet on a square, and a square cannot hold both. Keep it as a rule.' : null);
    const choice = (w: When): string => `<label class="ws-choice${off(w) ? ' off' : ''}"><input type="radio" name="ws-when" value="${all.indexOf(w)}"${same(w, r.when) ? ' checked' : ''}${off(w) ? ' disabled' : ''} /><span>${label(w)}${w.on === 'afterCard' ? '<small>Only in card games.</small>' : ''}${off(w) ? `<small>${off(w)}</small>` : ''}</span></label>`;
    const rest = all.filter(w => !top.includes(w));
    const nums = (on: 'fromMove' | 'beforeMove', words: string): string => {
      const ws = rest.filter(w => w.on === on);
      return ws.length ? `<div class="ws-choice ws-nums"><span>${words}</span><div class="seg-row">${ws.map(w => `<label><input type="radio" name="ws-when" value="${all.indexOf(w)}"${same(w, r.when) ? ' checked' : ''} /><span>${(w as { n: number }).n}</span></label>`).join('')}</div></div>` : '';
    };
    const bodies = rest.filter(w => w.on === 'near' && w.who.length === 1) as Extract<When, { on: 'near' }>[];
    const cur1 = r.when.on === 'near' && r.when.who.length === 1 ? r.when.who : 'N';
    const moreHtml = rest.filter(w => !(w.on === 'fromMove' || w.on === 'beforeMove' || (w.on === 'near' && w.who.length === 1))).map(choice).join('')
      + (bodies.length ? `<label class="ws-choice"><input type="radio" name="ws-when" value="body"${r.when.on === 'near' && r.when.who.length === 1 ? ' checked' : ''} /><span>Next to your `
        + `<select class="ws-near" aria-label="Which piece">${bodies.map(w => `<option value="${w.who}"${w.who === cur1 ? ' selected' : ''}>${BODY[w.who as Body].name}</option>`).join('')}</select></span></label>` : '')
      + nums('fromMove', 'From move') + nums('beforeMove', 'Before move');
    const open = !top.some(w => same(w, r.when));
    choiceSheet(b.event ? 'When does it happen?' : 'When does it work?', top.map(choice).join('')
      + (rest.length ? `<button type="button" class="quiet ws-more-w"${open ? ' hidden' : ''}>More choices</button><div class="ws-more-list"${open ? '' : ' hidden'}>${moreHtml}</div>` : ''), r, pillButton(i, 'when'), (inp, body) => {
      const w: When = inp.value === 'body' ? { on: 'near', who: q<HTMLSelectElement>('.ws-near', body).value as Body } : all[+inp.value];
      const j = cur.rules.indexOf(r);
      if (like && w.on === 'always' && r.does.a === 'movesLike') {
        const as = r.does.as, m = likeAlways(cur, as);
        if (!m) return;
        change('add to Moves', d => { d.squares = m.squares; d.lines = m.lines; d.rules.splice(j, 1); });
        toast(`Added to Moves: ${LIKE_ADDED[as]}.`);
      } else change('change when', d => { d.rules[j].when = clone(w); });
    }, body => {
      q<HTMLButtonElement>('.ws-more-w', body)?.addEventListener('click', e => { (e.currentTarget as HTMLElement).hidden = true; q('.ws-more-list', body).hidden = false; });
      // Choosing a piece in the list picks its row; a tap on the list then commits like a tap on a row.
      const near = q<HTMLSelectElement>('.ws-near', body);
      near?.addEventListener('change', () => { const row = q<HTMLInputElement>('input[value="body"]', body); row.checked = true; row.dispatchEvent(new Event('change')); });
    });
  }

  /** Why? (W8): the head, the reasons, the fixes, the notes and the flags. Shown in a detail sheet. */
  function whyHtml(x: Verdict): string {
    const flags = x.flags.filter(f => f.line !== x.line);
    return `<p>${esc(whyHead(x))}</p>`
      + (x.why.length ? `<ul class="ws-reasons">${x.why.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '')
      + (x.why.filter(t => t.startsWith('Without')).length > 1 ? '<p class="ws-small">Each line is the worth without one part. The parts overlap, so the differences do not add up.</p>' : '')
      + (x.fixes.length ? `<div class="ws-fixes"><span>Try:</span>${x.fixes.map((f, i) => `<button type="button" class="ws-fix" data-fix="${i}">${esc(f.label)}: about ${pawns(f.worth)}</button>`).join('')}</div>` : '')
      + (x.line.toLowerCase().includes(x.like.slice(0, -1).toLowerCase()) ? '' : `<p class="ws-like-why">${esc(x.like)}</p>`)
      + x.idle.map(t => `<p class="ws-idle">“${esc(t)}” changes little (less than 0.3 pawn). Simpler without it?</p>`).join('')
      + (flags.length ? `<ul class="ws-flags">${flags.map(f => `<li class="f-${f.level}">${esc(f.line)}</li>`).join('')}</ul>` : '')
      + `<p class="ws-small">${DISCLAIMER}</p>`
      + (x.note ? `<p class="ws-small">${esc(x.note)}${x.worth.measured && !x.own ? ` (${BAND_WORD[x.worth.measured.label].toLowerCase()})` : ''}</p>` : '');
  }
  function wireWhy(root: HTMLElement, close?: () => void): void {
    for (const b of qa<HTMLButtonElement>('.ws-fix', root)) b.onclick = () => {
      const f = v.fixes[+b.dataset.fix!];
      close?.();
      change('apply a fix', d => { d.squares = clone(f.design.squares); d.lines = [...f.design.lines]; d.rules = clone(f.design.rules); });
    };
  }
  function why(): void {
    if (fromLink) return sheet(whyTitle(v), whyHtml(v).replace(/<div class="ws-fixes">[\s\S]*?<\/div>/, ''), () => {});
    sheet(whyTitle(v), whyHtml(v) + `<div class="ws-sheet-actions"><button type="button" class="ws-keep">Keep it</button><button type="button" class="quiet ws-undo-last"${undos.length ? '' : ' disabled'}>Undo last change</button></div>`, (body, close) => {
      wireWhy(body, close);
      q<HTMLButtonElement>('.ws-keep', body).onclick = close;
      q<HTMLButtonElement>('.ws-undo-last', body).onclick = () => { close(); undo(); };
    });
  }

  /* Sharing and shelf actions stay with the piece card. */
  function keepCopy(): void {
    const c = { ...clone(cur), id: fromPreset(BLANK).id };
    edit(c);
    store();
    update(true);
  }
  function share(): void {
    sheet('Share this piece', '<div class="ws-share-actions"><button type="button" class="ws-send">Send link</button><button type="button" class="ws-copy-link">Copy link</button><button type="button" class="ws-copy">Copy as text</button>'
      + (fromLink ? '<button type="button" class="ws-keep-copy">Keep a copy</button>' : '<button type="button" class="ws-dup">Make a copy</button><button type="button" class="quiet ws-del">Delete</button>') + '</div>', (body, closeShare) => {
      const jv = v;
      q<HTMLButtonElement>('.ws-copy-link', body).onclick = () => { closeShare(); void copyText(link(cur), 'Link copied.'); };
      // Every design the editor makes fits a share code (a unit test); this guard says so if one ever does not.
      const shareable = (): boolean => !!parseDesign(designCode(cur)) || (toast('This design cannot be shared: it breaks a limit.'), false);
      q<HTMLButtonElement>('.ws-send', body).onclick = async () => {
        if (!shareable()) return;
        closeShare();
        if (navigator.share) {
          try { await navigator.share({ title: cur.name, text: `${cur.name}: a King Down piece.`, url: link(cur) }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
        }
        await copyText(link(cur), 'Link copied.');
      };
      q<HTMLButtonElement>('.ws-copy', body).onclick = () => { if (shareable()) { closeShare(); void copyText(asText(cur, jv, link(cur)), 'Copied as text.'); } };
      q<HTMLButtonElement>('.ws-dup', body)?.addEventListener('click', () => {
        closeShare();
        const c: PieceDesign = { ...clone(cur), id: fromPreset(BLANK).id, name: `${cur.name.slice(0, 12).trim()} copy`, named: true };
        cur = c;
        const ok = store();
        edit(c, { shelf: ok });
        if (ok) toast('A copy is on your shelf.');
      });
      q<HTMLButtonElement>('.ws-keep-copy', body)?.addEventListener('click', () => { closeShare(); keepCopy(); });
      q<HTMLButtonElement>('.ws-del', body)?.addEventListener('click', () => { closeShare(); sheet(`Delete ${cur.name}?`, '<p>This cannot be undone.</p><div class="ws-sheet-actions"><button type="button" class="primary ws-yes">Delete</button><button type="button" class="ws-no">Keep</button></div>', (body, close) => {
        q<HTMLButtonElement>('.ws-no', body).onclick = close;
        q<HTMLButtonElement>('.ws-yes', body).onclick = () => {
          close();
          if (!deleteDesign(cur.id)) return toast('Could not delete: this device refused.');
          onShelf = false;
          show('home');
        };
      }); });
    });
  }

  /** Copy as text (§7.6): the sentences, a MATRIX-style row and the link. */
  function asText(d: PieceDesign, jv: Verdict, url: string): string {
    const t = describe(d), band = bandOf(jv).toLowerCase();
    const parts = [`squares: moves ${t.moves.replace(/\.$/, '')}; takes ${t.takes.replace(/\.$/, '')}`, ...d.rules.map(r => `${blockOf(r.does.a).matrix}: ${ruleText(r).replace(/\.$/, '')}`)];
    return [d.name, `Moves: ${t.moves}`, `Takes: ${t.takes}`, ...t.special.map(s => `Special: ${s}`), `About ${pawns(jv.worth.point)}. ${bandOf(jv)}.`, '',
      `| ${d.name} | piece | ${parts.join(' · ')} | ${jv.worth.point.toFixed(2)} | ${band} |`, '', url].join('\n');
  }

  /* ---- TRY IT (W10) ---- */

  function tryIt(): void {
    screenEl.innerHTML = bar('Back', `Try ${cur.name}`, '<button type="button" class="quiet ws-reset">Reset</button>') + '<div class="ws-scroll"><div class="ws-try-host"></div></div>';
    const box = sandbox(q('.ws-try-host'), cur, cur.name);
    q<HTMLButtonElement>('.ws-back').onclick = () => show('editor');
    q<HTMLButtonElement>('.ws-reset').onclick = () => box.reset();
  }

  dlg.addEventListener('close', e => { if (e.target === dlg) cancel(screenEl); });

  /* ---- keys ---- */

  dlg.addEventListener('keydown', e => {
    // Esc in a choices panel closes the panel only; the Workshop stays open (a sheet above it takes its own Esc).
    if (e.key === 'Escape' && !q('.ws-sheet[open]') && q('.ws-property-options:not([hidden])')) {
      e.preventDefault();
      q<HTMLButtonElement>('.ws-property-close').click();
      return;
    }
    // Only the editor itself: a key pressed in a sheet acts on the sheet alone.
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && screen === 'editor' && !q('.ws-sheet[open]') && !q('.ws-property-options:not([hidden])') && !fromLink && !(e.target as HTMLElement).closest('input[type="text"]')) {
      e.preventDefault();
      undo();
    }
  });

  return {
    open(): void {
      show('home');
      if (!dlg.open) dlg.showModal();
      focusTitle();
    },
    openDesign(code: string): void {
      const d = parseDesign(code);
      unsaved = null;
      if (!d) { show('home'); toast('This design link could not be read.'); }
      else { cur = d; undos = []; fromLink = true; onShelf = false; show('editor'); }
      if (!dlg.open) dlg.showModal();
      focusTitle();
    },
  };
}
