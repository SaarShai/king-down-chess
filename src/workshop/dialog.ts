/**
 * The Workshop dialog (docs/WORKSHOP.md §2): HOME, START A PIECE, the piece editor (Moves, Rules,
 * Look), its sheets (the rule book, a pill's choices, Why?), sharing and Try it. One full-screen
 * `<dialog id="workshop">` that opens over its caller; Back closes it and the caller is still there.
 * Loaded on demand (main.ts `await import`), so none of it is in the main chunk.
 */
import './workshop.css';
import type { KingName } from '../rules/engine';
import { snd } from '../render/sfx';
import { pieceIcon } from '../piece-icons';
import {
  BLANK, BODIES, BODY_NAME, DIR, DIRS, MAX_RULES, PRESETS, canGive, designCode, empty, fromPreset, likeAlways, limit, lineOrbit, mix, orbit,
  parseDesign, presetOf, validName, type Body, type Dir, type Mark, type PaintOn, type PieceDesign, type Preset, type Rule, type When,
} from './model';
import { BLOCKS, GROUPS, MORE_WHENS, NEAR_BODY, TOP_WHENS, EVENT_WHENS, blockOf, takesAny, whenWords, type Block } from './vocab';
import { BAND_WORD, LEARN_LINE, autoBody, badgeText, bandOf, judge, shelfOf, unmeasured, whyHead, whyTitle, worthOf, type Label, type Verdict } from './judge';
import { GLOW, lookOf, lookWords } from './look';
import { cropOf, figureHtml, gaugeHtml, modelHtml, patternSvg } from './art';
import { MARK_WORDS, cap, describe, dirWords, esc, pawns, ruleParts, ruleText, squareList } from './text';
import { autoName, letterFollows, letterOf, nextLetter, rollName, saveName } from './names';
import { MAX, deleteDesign, loadDesigns, loadShelf, saveDesign, type SaveResult } from './store';
import { sandbox } from './sandbox';
import { cancel, react } from './motion';

type Screen = 'home' | 'start' | 'editor' | 'try';
type Brush = 'both' | 'move' | 'take' | 'shoot' | 'line';
const KINGS = Object.keys(GLOW) as KingName[];
const BASE = import.meta.env.BASE_URL;
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

/** The tap table (W3): a brush and the square's mark before give the mark after (null: empty). */
const TAP: Record<Exclude<Brush, 'line'>, Record<Mark | 'none', Mark | null>> = {
  both: { none: 'both', move: 'both', take: 'both', both: null, shoot: 'both', moveShoot: 'both' },
  move: { none: 'move', move: null, take: 'move', both: 'move', shoot: 'move', moveShoot: 'move' },
  take: { none: 'take', move: 'take', take: null, both: 'take', shoot: 'take', moveShoot: 'take' },
  shoot: { none: 'shoot', move: 'moveShoot', take: 'shoot', both: 'moveShoot', shoot: null, moveShoot: 'move' },
};
const BRUSH: Record<Brush, [string, string]> = {
  both: ['Move+take', 'It may go there, or take an enemy there.'],
  line: ['Line', 'It slides that way, square by square, until a piece stops it. It may take that piece.'],
  move: ['Move', 'It may go there, only if the square is empty.'],
  take: ['Take', 'It may take an enemy there, by moving onto it.'],
  shoot: ['Shoot', 'It takes an enemy there and stays where it is.'],
};
const PAINT: [PaintOn, string][] = [['all', 'All sides'], ['lr', 'Left and right'], ['one', 'One square']];
const PILL_WORD: Record<string, string> = { when: 'When', as: 'Like', over: 'Over', by: 'Taken', then: 'Then', with: 'With', into: 'Becomes', what: 'What' };
const PILL_TITLE: Record<string, string> = { as: 'Moves like which piece?', over: 'Passes over what?', by: 'Who cannot take it?', then: 'After the push', with: 'Swaps with whom?', into: 'Becomes what?', what: 'Which pieces?' };
const LIKE_ADDED: Record<string, string> = { king: "the king's squares", knight: "the knight's squares", bishop: "the bishop's lines", rook: "the rook's lines", queen: "the queen's lines" };
const DISCLAIMER = 'This is a guess from computer games with the pieces we know. A new mix can play stronger or weaker. You can keep it.';

/** The ray from the piece through (x, y), or null when (x, y) is on none of the 8. */
const rayOf = (x: number, y: number): Dir | null =>
  x && y && Math.abs(x) !== Math.abs(y) ? null : DIRS.find(d => DIR[d][0] === Math.sign(x) && DIR[d][1] === Math.sign(y)) ?? null;
const pawnWord = (v: number): string => `${badgeText(v)} ${Math.abs(v) < 1.25 ? 'pawn' : 'pawns'}`;
const NEVER = 'never tested in computer games';
const bodyName = (b: Body | 'token'): string => (b === 'token' ? 'Token' : cap(BODY_NAME[b]));

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
  let undos: { d: PieceDesign; label: string }[] = [], tab: 'moves' | 'rules' | 'look' = 'moves', brush: Brush = 'both', paintOn: PaintOn = 'all';
  let lastLook = lookOf(cur, v);
  let lastLabel: Label | '' = '', mixFirst: Preset | null = null, mixNote = '';
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

  /* The same editor is beside the card on desktop, and a modal sheet on phones. */
  function fit(): void {
    const wide = innerWidth > 720, land = !wide && innerHeight < 480 && innerWidth > innerHeight;
    dlg.dataset.h = wide ? 'wide' : land ? 'land' : 'phone';
    const editSheet = q<HTMLDialogElement>('.ws-edit-sheet');
    if (editSheet && editSheet.dataset.inline !== String(wide)) {
      const wasOpen = editSheet.open;
      editSheet.close();
      editSheet.dataset.inline = String(wide);
      if (wide) editSheet.show();
      else if (wasOpen && editSheet.dataset.requested === 'true') editSheet.showModal();
    }
    const p = q<HTMLElement>('.ws-panel');
    if (p?.dataset.tab === 'moves' && editSheet?.open) {
      const style = getComputedStyle(p), mode = q<HTMLElement>('.ws-mode'), ms = getComputedStyle(mode);
      const px = (x: string): number => parseFloat(x) || 0;
      const width = p.clientWidth - px(style.paddingLeft) - px(style.paddingRight) - 8;
      const maximum = wide ? innerHeight - 184 : innerHeight - (land ? 8 : 24);
      const reserved = 2 + q<HTMLElement>('.ws-edit-sheet .ws-sheet-bar').offsetHeight + px(style.paddingTop) + px(style.paddingBottom)
        + q<HTMLElement>('.ws-fwd').offsetHeight + (land ? 8 : 10) + (alertEl.hidden ? 0 : alertEl.offsetHeight);
      const tools = land ? 0 : q<HTMLElement>('.ws-tools').offsetHeight + mode.scrollHeight + px(ms.marginTop) + px(ms.marginBottom);
      dlg.style.setProperty('--cell', `${Math.max(28, Math.min(wide ? 56 : 44, Math.floor(Math.min(width, maximum - reserved - tools) / 7)))}px`);
    }
    fitName();
  }
  addEventListener('resize', () => { if (dlg.open && !(document.activeElement as HTMLElement | null)?.matches('input[type="text"]')) fit(); });

  function show(s: Screen): void {
    if (s === 'home' || s === 'start') mixNote = '';
    clearTimeout(toastTimer);
    toastEl.classList.remove('on');
    cancel(screenEl);
    const previousEditor = q<HTMLElement>('.ws-edit-sheet');
    if (previousEditor) cancel(previousEditor);
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
    const editSheet = q<HTMLDialogElement>('.ws-edit-sheet');
    (editSheet?.open && editSheet.dataset.inline === 'false' ? editSheet : dlg).append(alertEl);
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
      + `<button type="button" class="ws-door" data-door="piece"><img src="${cropOf('N')}" alt="" /><b>New piece</b></button>`
      + `</div><button type="button" class="ws-surprise">${DIE}<span>Surprise me</span></button>`
      + `<h3>Your designs (${list.length}), on this device</h3>`
      + (list.length ? `<div class="ws-shelf">${list.map((d, i) => { const jv = judge(d, false); return `<button type="button" class="ws-tile${jv.warn ? ' warn' : ''}" data-i="${i}">`
        + `<span class="ws-tile-art" aria-hidden="true">${modelHtml(lookOf(d, jv))}</span><b>${esc(d.name)}</b><small>${shelfOf(jv)}</small></button>`; }).join('')}</div>`
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
    mixFirst = null;
    const tiles = [...PRESETS, BLANK];
    screenEl.innerHTML = bar('Workshop', 'New piece') + '<div class="ws-scroll">'
      + '<p class="ws-lead">Start from a piece you know.</p>'
      + '<label class="check ws-mix"><input type="checkbox" /><span>Mix two pieces<small>The first piece’s moves, and the second piece’s rules. A piece with no rules gives its moves, in the enemy half.</small></span></label>'
      + `<div class="ws-tiles">${tiles.map(p => `<button type="button" class="ws-ptile" data-key="${p.key}" aria-pressed="false">`
        + (p.body === 'token' ? '<span class="pc-medallion" aria-hidden="true">D</span>' : `<img src="${cropOf(p.body)}" alt="" />`)
        + `<span>${p.name}</span><span class="sr-only ws-gives"></span><i class="ws-one" aria-hidden="true">1</i></button>`).join('')}</div>`
      + '<p class="ws-mix-note" hidden></p>'
      + `<button type="button" class="ws-surprise">${DIE}<span>Surprise me</span></button></div>`;
    q<HTMLButtonElement>('.ws-back').onclick = () => show('home');
    q<HTMLButtonElement>('.ws-surprise').onclick = surpriseMe;
    const box = q<HTMLInputElement>('.ws-mix input');
    const paint = (): void => {
      for (const b of qa<HTMLButtonElement>('.ws-ptile')) {
        const p = presetOf(b.dataset.key!);
        b.setAttribute('aria-pressed', String(mixFirst?.key === p.key));
        b.disabled = !!mixFirst && mixFirst.key !== p.key && !canGive(p);
        // After the first choice, each piece says what it would give.
        const gives = !mixFirst || mixFirst.key === p.key || b.disabled ? '' : (() => {
          const { design, left } = mix(mixFirst, p);
          return `Gives: ${design.rules.map(ruleText).join(' ') || 'nothing.'}${left.length ? ` Left out: ${left.join('; ')}.` : ''}`;
        })();
        b.title = b.disabled ? 'It has no rules to give.' : gives;
        q('.ws-gives', b).textContent = gives;
      }
      const note = q('.ws-mix-note');
      note.hidden = !mixFirst;
      note.textContent = mixFirst ? `Now the second piece: it gives its rules to the ${mixFirst.name}’s moves. The Archer and Blank have no rules to give.` : '';
    };
    box.onchange = () => { mixFirst = null; paint(); };
    for (const b of qa<HTMLButtonElement>('.ws-ptile')) b.onclick = () => {
      const p = b.dataset.key === 'blank' ? BLANK : presetOf(b.dataset.key!);
      if (!box.checked) return edit(named(fromPreset(p)), { paintOn: p.paintOn });
      if (!mixFirst) { mixFirst = p; return paint(); }
      if (mixFirst.key === p.key) { mixFirst = null; return paint(); }
      const { design, left } = mix(mixFirst, p), said = `Mixed: ${mixFirst.name} + ${p.name}.${left.length ? ` Left out: ${left.join('; ')}.` : ''}`;
      edit(named(design), { paintOn: mixFirst.paintOn });
      mixNote = said; // it stays in the Rules tab until the player leaves the editor
      toast(said);
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
    d.look.glow = pick(KINGS);
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
    tab = 'moves'; brush = 'both'; paintOn = o.paintOn ?? presetOf(d.from[0] ?? 'blank').paintOn;
    lastLabel = '';
    show('editor');
    if (!onShelf) store();
  }

  function editor(): void {
    screenEl.innerHTML = '<div class="ws-editor">'
      + bar('Workshop', 'Piece card', '<span class="ws-save-state" role="status"></span><button type="button" class="ws-share">Share</button>')
      + '<div class="ws-workspace"><article class="ws-piece-card" aria-label="Your piece"><div class="ws-card-border">'
      + '<div class="ws-model-box" aria-hidden="true"></div><div class="ws-name-row"></div><p class="ws-worth"></p><div class="ws-gauge-box"></div><div class="ws-bottom"></div>'
      + '<div class="ws-card-moves"></div><div class="ws-card-rules"></div><div class="ws-card-actions"></div>'
      + '<details class="ws-every"><summary>Every square</summary><div class="ws-exact"></div></details>'
      + '<p class="sr-only ws-summary"></p><p class="sr-only ws-live" role="status"></p></div></article>'
      + (fromLink ? '<aside class="ws-link-note"><h3>A shared piece</h3><p>Keep a copy to change this piece.</p><button type="button" class="primary ws-keep-copy">Keep a copy</button></aside>'
        : '<dialog class="ws-sheet ws-edit-sheet" aria-labelledby="ws-edit-h"><header class="ws-sheet-bar"><h2 id="ws-edit-h" tabindex="-1"></h2><button type="button" class="quiet ws-edit-why" aria-label="Why this estimate?"></button><button type="button" class="quiet ws-edit-done">Done</button></header><div class="ws-panel"></div></dialog>')
      + '</div><footer class="ws-footer"><button type="button" class="quiet ws-why">Why this estimate?</button><span>Custom pieces can be tested here.</span><button type="button" class="primary ws-try">Try it</button></footer></div>';
    q<HTMLButtonElement>('.ws-back').onclick = () => show('home');
    q<HTMLButtonElement>('.ws-share').onclick = share;
    q<HTMLButtonElement>('.ws-why').onclick = why;
    q<HTMLButtonElement>('.ws-try').onclick = () => {
      if (empty(cur)) return toast('Paint at least one square or line.');
      if (!fromLink && !onShelf) store();
      show('try');
    };
    q<HTMLButtonElement>('.ws-keep-copy')?.addEventListener('click', keepCopy);
    const editSheet = q<HTMLDialogElement>('.ws-edit-sheet');
    if (editSheet) {
      q<HTMLButtonElement>('.ws-edit-done').onclick = () => editSheet.close();
      editSheet.addEventListener('close', () => {
        if (editSheet.open) return;
        cancel(editSheet);
        editSheet.dataset.requested = 'false';
        drawAlert();
        if (!q('.ws-name-in')) q<HTMLButtonElement>(`[data-editor="${tab}"]`)?.focus();
      });
      panel();
    }
    update(true);
  }

  function openPart(part: typeof tab): void {
    tab = part;
    const editSheet = q<HTMLDialogElement>('.ws-edit-sheet');
    panel();
    editSheet.dataset.requested = 'true';
    if (!editSheet.open) { if (innerWidth > 720) editSheet.show(); else editSheet.showModal(); }
    drawAlert();
    fit();
    q<HTMLElement>('#ws-edit-h').focus();
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

  /** The stage, the side column and the open tab, after a change. */
  function update(first: boolean, noise?: () => void): void {
    const was = v, previousLook = lastLook;
    cancel(screenEl);
    const editSheet = q<HTMLElement>('.ws-edit-sheet');
    if (editSheet) cancel(editSheet);
    v = judge(cur);
    const l = lookOf(cur, v), d = describe(cur), w = v.worth.point;
    put(q('.ws-model-box'), modelHtml(l));
    const nameRow = q('.ws-name-row');
    if (!q('input', nameRow) && put(nameRow, `<button type="button" class="ws-name" aria-label="Name: ${esc(cur.name)}. Change."><span class="ws-name-t">${esc(cur.name)}</span>${PEN}</button>`
      + `<button type="button" class="quiet ws-die" aria-label="Roll a name" title="Roll a name">${DIE}</button>`)) {
      q<HTMLButtonElement>('.ws-name').onclick = rename;
      q<HTMLButtonElement>('.ws-die').onclick = () => {
        for (let i = 0; i < 6 && !change('roll a name', x => { const follows = letterFollows(x); x.name = rollName(x, autoBody(x)); x.named = true; if (follows) x.letter = letterOf(x.name); }); i++);
      };
    }
    fitName();
    const estimate = q<HTMLButtonElement>('.ws-edit-why');
    if (estimate) { estimate.innerHTML = `${pawns(w)}<small>${esc(v.warn ? chipText(v) : bandOf(v))}</small>`; estimate.classList.toggle('warn', v.warn); estimate.onclick = why; }
    q('.ws-worth').textContent = empty(cur) ? 'Paint a square or a line.' : `Estimated worth · ${pawns(w)}`;
    q('.ws-gauge-box').innerHTML = gaugeHtml(v, true);
    const bottom = q('.ws-bottom');
    if (put(bottom, v.warn ? `<button type="button" class="ws-chip">${icon('M12 3l10 18H2zM12 10v5M12 18h.01')}<span>${esc(chipText(v))}. Why?</span></button>` : `<span class="ws-learn">${bandOf(v)} · ${LEARN_LINE[v.memory.level]}</span>`)) q<HTMLButtonElement>('.ws-chip', bottom)?.addEventListener('click', why);
    const editButton = (part: typeof tab, text = 'Edit'): string => fromLink ? '' : `<button type="button" class="quiet ws-card-edit" data-editor="${part}" aria-label="Edit ${part}">${text}</button>`;
    put(q('.ws-card-moves'), `<section class="ws-card-section"><div><h3>Moves &amp; takes</h3><p>${esc(cap(d.moves))}</p>${d.takes !== d.moves ? `<p><b>Takes:</b> ${esc(d.takes)}</p>` : ''}</div>${editButton('moves')}</section>`);
    put(q('.ws-card-rules'), `<section class="ws-card-section"><div><h3>Special <small>${cur.rules.length} of ${MAX_RULES}</small></h3>${d.special.length ? d.special.map(t => `<p>${esc(t)}</p>`).join('') : '<p>No special rules.</p>'}</div>${editButton('rules')}</section>`);
    put(q('.ws-card-actions'), fromLink ? '' : `<button type="button" class="quiet ws-card-add"${cur.rules.length >= MAX_RULES ? ' disabled' : ''}>Add a rule</button>${editButton('look', 'Look & name')}`);
    for (const b of qa<HTMLButtonElement>('[data-editor]')) b.onclick = () => openPart(b.dataset.editor as typeof tab);
    const add = q<HTMLButtonElement>('.ws-card-add');
    if (add) add.onclick = () => { openPart('rules'); ruleBook(); };
    put(q('.ws-exact'), `<div class="ws-pats">${pats(cur)}</div><ul>${squareList(cur).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`);
    q('.ws-summary').textContent = `${lookWords(l)} ${d.summary} About ${pawns(w)}, ${bandOf(v).toLowerCase()}.`;
    const live = q('.ws-live'), say = `About ${pawns(w)}. ${bandOf(v)}.`;
    if (!first && v.label !== lastLabel && live.textContent !== say) live.textContent = say;
    lastLabel = v.label;
    if (fromLink) {
      q<HTMLButtonElement>('.ws-name').disabled = true;
      q<HTMLButtonElement>('.ws-die').hidden = true;
    }
    if (!first) {
      const op = (x: Label) => x === 'possiblyOP' || x === 'likelyOP' || x === 'untestedOP';
      sound(op(v.label) && !op(was.label) ? snd.check : noise ?? snd.move);
      if (tab !== 'moves') panel(); else paintBoard();
    }
    for (const ub of qa<HTMLButtonElement>('.ws-undo')) {
      const u = undos[undos.length - 1];
      ub.disabled = !u; ub.title = u ? `Undo: ${u.label}` : 'Undo'; ub.onclick = undo;
    }
    lastLook = l;
    if (!first) {
      react(screenEl, previousLook, l, was, v);
      if (editSheet?.matches('[open]') && tab === 'look') react(editSheet, previousLook, l, was, v);
    }
    drawAlert();
    fit();
  }
  /** The name steps down in size until it fits beside the die; past the smallest size it ends in "…". */
  function fitName(): void {
    const b = q<HTMLElement>('.ws-name'), t = b && q<HTMLElement>('.ws-name-t', b);
    if (!t) return;
    b.style.fontSize = '';
    for (let px = parseFloat(getComputedStyle(b).fontSize) - 1; t.scrollWidth > t.clientWidth + 1 && px >= 14; px--) b.style.fontSize = `${px}px`;
  }
  const chipText = (x: Verdict): string => (x.label !== 'fair' ? BAND_WORD[x.label]
    : x.flags.find(f => f.level === 'warn')?.line.replace(/:.*/, '').replace(/\.$/, '') ?? LEARN_LINE[3]);

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
      if (keep && s && s !== cur.name) {
        if (!validName(s)) toast("A name uses letters, digits, spaces, - and ', up to 18.");
        else change('rename', x => { const follows = letterFollows(x); x.name = saveName(s); x.named = true; if (follows) x.letter = letterOf(x.name); });
      }
      update(true);
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

  /** The open tab, drawn again; the focused control keeps its place. */
  function panel(): void {
    const p = q('.ws-panel'), ctl = (): HTMLElement[] => qa('button, input, select', p), at = ctl().indexOf(document.activeElement as HTMLElement);
    if (!p) return;
    p.dataset.tab = tab;
    q('#ws-edit-h').textContent = `Edit ${tab === 'look' ? 'look & name' : tab}`;
    ({ moves: movesTab, rules: rulesTab, look: lookTab })[tab](p);
    if (tab !== 'moves') {
      p.insertAdjacentHTML('afterbegin', `<button type="button" class="quiet ws-undo ws-panel-undo"${undos.length ? '' : ' disabled'}>${UNDO} Undo</button>`);
      q<HTMLButtonElement>('.ws-undo', p).onclick = undo;
    }
    if (at >= 0) (ctl()[at] ?? ctl()[ctl().length - 1])?.focus();
  }

  const guardType = (): boolean => cur.rules.some(r => r.does.a === 'cannotBeTaken' && r.does.by === 'allButKing');
  const H2B = 'Only a king can take this piece, so it cannot take. Remove that rule first.';

  function movesTab(p: HTMLElement): void {
    let cells = '';
    for (let y = 3; y >= -3; y--) for (let x = -3; x <= 3; x++) {
      cells += x || y ? `<button type="button" class="ws-cell${Math.max(Math.abs(x), Math.abs(y)) === 3 ? ' rim' : ''}" data-x="${x}" data-y="${y}" tabindex="-1"><i class="ws-arrow" aria-hidden="true"></i></button>`
        : '<button type="button" class="ws-cell ws-me" data-x="0" data-y="0" tabindex="-1" aria-label="Your piece"></button>';
    }
    p.innerHTML = `<div class="ws-tools"><label>Action<select name="ws-brush" aria-label="Action">${(['both','line','move','take','shoot'] as Brush[]).map(b => `<option value="${b}"${b === brush ? ' selected' : ''}>${BRUSH[b][0]}</option>`).join('')}</select></label>`
      + `<label>Apply to<select name="ws-paint" aria-label="Apply to">${PAINT.map(([k,t]) => `<option value="${k}"${k === paintOn ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`
      + `<button type="button" class="quiet ws-undo" aria-label="Undo"${undos.length ? '' : ' disabled'}>${UNDO}</button></div>`
      + '<p class="ws-mode"></p><div class="ws-grid-wrap"><p class="ws-fwd" aria-hidden="true">forward ↑</p>'
      + `<div class="ws-board" role="group" aria-label="Squares around the piece" aria-describedby="ws-fwd-say">${cells}</div><p id="ws-fwd-say" class="sr-only">Forward is up.</p></div>`
      + '<p class="ws-caption"></p>';
    const sync = (): void => { q('.ws-mode', p).textContent = `${BRUSH[brush][1]} Tap to add or erase.`; };
    sync();
    q<HTMLSelectElement>('[name="ws-brush"]', p).onchange = e => { brush = (e.target as HTMLSelectElement).value as Brush; sync(); };
    q<HTMLSelectElement>('[name="ws-paint"]', p).onchange = e => { paintOn = (e.target as HTMLSelectElement).value as PaintOn; sync(); };
    q<HTMLButtonElement>('.ws-undo', p).onclick = undo;
    wireBoard(q('.ws-board', p));
    paintBoard();
  }

  /** The board's marks, labels and the caption, from the design. */
  function paintBoard(): void {
    const board = q('.ws-board');
    if (!board) return;
    for (const b of qa<HTMLButtonElement>('.ws-cell:not(.ws-me)', board)) {
      const x = +b.dataset.x!, y = +b.dataset.y!, s = cur.squares.find(t => t.x === x && t.y === y), ray = rayOf(x, y);
      const line = !!ray && cur.lines.includes(ray), end = line && Math.max(Math.abs(x), Math.abs(y)) === 3;
      b.className = `ws-cell${(x + y) & 1 ? ' dk' : ''}${Math.max(Math.abs(x), Math.abs(y)) === 3 ? ' rim' : ''}${s ? ` c-${s.mark}` : ''}${line ? ` ln ln-${ray}${end ? ' ln-end' : ''}` : ''}`;
      b.setAttribute('aria-label', `${dirWords(x, y)}: ${[s ? MARK_WORDS[s.mark] : '', line ? 'line' : ''].filter(Boolean).join(', ') || 'empty'}`);
    }
    // The figure as the Look tab sets it (its army, and an Auto body that follows the squares).
    put(q('.ws-me', board), figureHtml({ body: cur.look.auto ? autoBody(cur) : cur.look.body, army: cur.look.army, letter: cur.letter }, 'ws-me-fig'));
    if (!qa('[tabindex="0"]', board).length) q<HTMLElement>('.ws-me', board).tabIndex = 0;
    const d = describe(cur);
    q('.ws-caption').textContent = `Moves ${d.moves} Takes ${d.takes}`;
  }

  function wireBoard(board: HTMLElement): void {
    let drag: { result: Mark | null | undefined; seen: Set<Element>; changed: boolean } | null = null;
    const paint = (b: HTMLElement, first: boolean): void => {
      const x = +b.dataset.x!, y = +b.dataset.y!;
      if (!x && !y) return;
      if (brush === 'line') {
        if (!first) return;
        const ray = rayOf(x, y);
        if (!ray) return toast('Lines go straight or diagonally from the piece.');
        if (guardType()) return toast(H2B);
        const set = lineOrbit(ray, paintOn), on = cur.lines.includes(ray);
        change(on ? 'remove a line' : 'add a line', dd => { dd.lines = DIRS.filter(l => on ? dd.lines.includes(l) && !set.includes(l) : dd.lines.includes(l) || set.includes(l)); });
        return;
      }
      const beforeMark = cur.squares.find(s => s.x === x && s.y === y)?.mark ?? 'none';
      if (drag!.result === undefined) drag!.result = TAP[brush][beforeMark];
      const result = drag!.result;
      if (guardType() && result && result !== 'move') return toast(H2B);
      const pts = orbit(x, y, paintOn);
      const ok = change(result ? 'paint squares' : 'clear squares', dd => {
        dd.squares = dd.squares.filter(s => !pts.some(([a, c]) => a === s.x && c === s.y));
        if (result) dd.squares.push(...pts.map(([a, c]) => ({ x: a, y: c, mark: result })));
      }, { merge: drag!.changed, noise: brush === 'take' ? snd.capture : brush === 'shoot' ? snd.shot : snd.move });
      drag!.changed ||= ok;
    };
    const cellAt = (e: PointerEvent): HTMLElement | null => (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('.ws-cell') ?? null;
    board.onpointerdown = e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.ws-cell');
      if (!b || e.button > 0) return;
      e.preventDefault();
      // The board keeps the pointer, so a release anywhere (off the board too) ends the stroke.
      try { board.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone */ }
      rove(b, false);
      drag = { result: undefined, seen: new Set([b]), changed: false };
      paint(b, true);
    };
    board.onpointermove = e => {
      if (!drag || brush === 'line') return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { drag = null; return; } // released where no event reached the board
      const b = cellAt(e);
      if (b && board.contains(b) && !drag.seen.has(b)) { drag.seen.add(b); paint(b, false); }
    };
    board.onpointerup = board.onpointercancel = board.onlostpointercapture = () => { drag = null; };
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
    const W = worthOf(cur), full = cur.rules.length >= MAX_RULES, from = cur.from.map(k => presetOf(k).name);
    p.innerHTML = `<h3 class="ws-count">Rules: ${cur.rules.length} of ${MAX_RULES}</h3>`
      + cur.rules.map((r, i) => {
        const dv = W - worthOf({ ...cur, rules: cur.rules.filter((_, j) => j !== i) });
        return `<div class="ws-rule"><p class="ws-sentence">${partsHtml(r, i)}</p><div class="ws-rule-foot"><span class="ws-badge"${unmeasured(r) ? ` title="A guess: ${NEVER}."` : ''}>${pawnWord(dv)}${unmeasured(r) ? ', a guess' : ''}</span>`
          + `<button type="button" class="quiet ws-remove" data-i="${i}" aria-label="Remove: ${esc(blockOf(r.does.a).short(r))}">Remove</button></div></div>`;
      }).join('')
      + `<button type="button" class="ws-add"${full ? ' disabled' : ''}>${full ? '<span>3 of 3 rules. Remove one to add another.</span>' : `${icon('M12 5v14M5 12h14')}<span>Add a rule</span>`}</button>`
      + '<p class="ws-note">Fewer rules are easier to remember.</p>'
      + (mixNote ? `<p class="ws-note">${esc(mixNote)}</p>` : from.length ? `<p class="ws-note">Started from: ${from.join(' + ')}</p>` : '')
      + (cur.from[0] && presetOf(cur.from[0]).note ? `<p class="ws-note">${presetOf(cur.from[0]).note}</p>` : '');
    for (const b of qa<HTMLButtonElement>('.ws-remove', p)) b.onclick = () => {
      const i = +b.dataset.i!;
      change('remove a rule', d => { d.rules.splice(i, 1); });
    };
    q<HTMLButtonElement>('.ws-add', p).onclick = ruleBook;
    for (const b of qa<HTMLButtonElement>('.ws-pill', p)) b.onclick = () => pillSheet(+b.dataset.i!, b.dataset.pill!);
  }
  /** A rule's sentence: fixed words and pill buttons. */
  function partsHtml(r: Rule, i: number): string {
    return ruleParts(r, true).map(part => typeof part === 'string' ? esc(part)
      : `<button type="button" class="ws-pill" data-i="${i}" data-pill="${part.pill}" aria-haspopup="dialog" aria-label="${PILL_WORD[part.pill] ?? 'Choice'}: ${esc(part.text.toLowerCase())}. Change.">${esc(part.text)}</button>`).join('');
  }

  function lookTab(p: HTMLElement): void {
    const L = cur.look, auto = autoBody(cur);
    const bodyBtn = (b: Body | 'token'): string => `<button type="button" class="emblem ws-body" data-body="${b}" aria-pressed="${!L.auto && L.body === b}" aria-label="${bodyName(b)}">`
      + (b === 'token' ? `<span class="pc-medallion ws-disc">${esc(cur.letter)}</span>` : `<img src="${cropOf(b)}" alt="" />`) + '</button>';
    p.innerHTML = `<div class="ws-look-preview" aria-hidden="true">${modelHtml(lookOf(cur, v))}</div><button type="button" class="ws-rename">Name: ${esc(cur.name)}</button>` + '<p class="ws-note ws-look-note">Body, glow and army change only how it looks, not what it does.</p><h3>Body</h3>'
      + (cur.from.length ? '' : `<button type="button" class="ws-auto" aria-pressed="${L.auto}">Auto: ${auto === 'token' ? 'a token' : `like ${/^[aeiou]/i.test(BODY_NAME[auto]) ? 'an' : 'a'} ${BODY_NAME[auto]}`}</button>`)
      + `<div class="ws-bodies">${[...BODIES, 'token' as const].map(bodyBtn).join('')}</div>`
      + '<h3>Glow</h3><div class="ws-glows">'
      + `<button type="button" class="emblem ws-glow" data-glow="" aria-pressed="${!L.glow}" aria-label="No glow"><span class="ws-glow-none"></span></button>`
      + KINGS.map(k => `<button type="button" class="emblem ws-glow" data-glow="${k}" aria-pressed="${L.glow === k}" aria-label="${k} glow" title="${k}"><img src="${BASE}ui/emblems/${k.toLowerCase()}.webp" alt="" /></button>`).join('')
      + '</div><fieldset class="seg ws-army"><legend>Army</legend><div class="seg-row">'
      + ['Ivory', 'Charcoal'].map((t, i) => `<label><input type="radio" name="ws-army" value="${i}"${L.army === i ? ' checked' : ''} /><span>${t}</span></label>`).join('')
      + `</div></fieldset><div class="ws-letter-row"><h3>Letter</h3><button type="button" class="ws-letter-btn" aria-label="Letter ${cur.letter}. Change." aria-describedby="ws-letter-say">${cur.letter}</button>`
      + `<span id="ws-letter-say">The piece's own letter, on its plinth and its card, as N is the knight's. It follows the name until you tap it.</span></div>`
      + '<p class="ws-note">Try it plays it as White, drawn in ivory. Black’s moves are the mirror image.</p>';
    q<HTMLButtonElement>('.ws-rename', p).onclick = () => { q<HTMLDialogElement>('.ws-edit-sheet').close(); rename(); };
    q<HTMLButtonElement>('.ws-auto', p)?.addEventListener('click', () => change('auto look', d => { d.look.auto = !d.look.auto; }));
    for (const b of qa<HTMLButtonElement>('.ws-body', p)) b.onclick = () => change('change the body', d => { d.look.body = b.dataset.body as Body; d.look.auto = false; });
    for (const b of qa<HTMLButtonElement>('.ws-glow', p)) b.onclick = () => change('change the glow', d => { d.look.glow = (b.dataset.glow || null) as KingName | null; });
    for (const r of qa<HTMLInputElement>('input[name="ws-army"]', p)) r.onchange = () => change('change the army', d => { d.look.army = +r.value as 0 | 1; });
    q<HTMLButtonElement>('.ws-letter-btn', p).onclick = () => change('change the letter', d => { d.letter = nextLetter(d.letter); d.ownLetter = true; });
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
        + `<span class="ws-seen" aria-hidden="true">${b.seenOn.map(x => pieceIcon(({ P: 1, N: 2, B: 3, R: 4, Q: 5, A: 7, L: 8, G: 9, M: 10, S: 11, O: 12 } as const)[x])).join('')}</span></button>`;
    };
    sheet('Add a rule', `<details class="ws-key"><summary>+1: about 1 pawn more. “?”: a guess.</summary><p>The number is about how many pawns the rule adds to this piece. A rule that works only some of the time adds less. “?” marks a guess: ${NEVER}.</p></details>` + GROUPS.map(g => `<h3>${g}</h3>${BLOCKS.filter(b => b.group === g).map(row).join('')}`).join(''), (body, close) => {
      for (const b of qa<HTMLButtonElement>('.ws-book-row', body)) b.onclick = () => {
        const block = blockOf(b.dataset.a as Block['a']);
        close();
        const noise = block.a === 'push' ? snd.shove : block.a === 'swap' ? snd.swap : block.a === 'chain' ? snd.chain : undefined;
        change('add a rule', d => { d.rules.push(clone(block.rule)); }, { noise });
      };
    });
  }

  /** A choice sheet commits a tap at once; the keyboard's arrows only move the choice, and Enter or Apply commits it. */
  function choiceSheet(title: string, rows: string, r: Rule, apply: (inp: HTMLInputElement, body: HTMLElement) => void, wire?: (body: HTMLElement) => void): void {
    sheet(title, `${rows}<div class="ws-sheet-actions ws-apply-row"><button type="button" class="primary ws-apply">Apply</button></div>`, (body, close) => {
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
    });
  }

  function pillSheet(i: number, key: string): void {
    const r = cur.rules[i], b = blockOf(r.does.a);
    if (key === 'when') return whenSheet(i);
    const val = (r.does as unknown as Record<string, string>)[key];
    const rows = b.pill!.choices.map(([k, text]) => {
      const next = { ...cur, rules: cur.rules.map((x, j) => j === i ? { ...x, does: { ...x.does, [key]: k } } as Rule : x) };
      const why = k === 'allButKing' && takesAny(cur) ? 'Only for a piece that takes nothing.' : k !== val && limit(next) ? limit(next) : null;
      return `<label class="ws-choice${why ? ' off' : ''}"><input type="radio" name="ws-pick" value="${k}"${k === val ? ' checked' : ''}${why ? ' disabled' : ''} /><span>${cap(text)}${why ? `<small>${why}</small>` : ''}</span></label>`;
    }).join('');
    choiceSheet(PILL_TITLE[key] ?? b.title, rows, r, inp => {
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
        + `<select class="ws-near" aria-label="Which piece">${bodies.map(w => `<option value="${w.who}"${w.who === cur1 ? ' selected' : ''}>${NEAR_BODY[w.who as Body]}</option>`).join('')}</select></span></label>` : '')
      + nums('fromMove', 'From move') + nums('beforeMove', 'Before move');
    const open = !top.some(w => same(w, r.when));
    choiceSheet(b.event ? 'When does it happen?' : 'When does it work?', top.map(choice).join('')
      + (rest.length ? `<button type="button" class="quiet ws-more-w"${open ? ' hidden' : ''}>More choices</button><div class="ws-more-list"${open ? '' : ' hidden'}>${moreHtml}</div>` : ''), r, (inp, body) => {
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

  /** The saved card's pictures: the base moves, and one for each rule that adds moves only some of the time. */
  function pats(d: PieceDesign): string {
    const fig = (svg: string, words: string): string => `<figure class="ws-pat">${svg}<figcaption>${esc(words)}</figcaption></figure>`;
    return fig(patternSvg(d), 'Base moves') + d.rules.map(r => r.does.a === 'movesLike' ? fig(patternSvg(presetOf(r.does.as === 'king' ? 'maester' : r.does.as)), `${cap(whenWords(r.when))}: also like ${r.does.as === 'king' ? 'a king' : `a ${r.does.as}`}`)
      : r.does.a === 'step2' ? fig(patternSvg({ squares: [{ x: 0, y: 2, mark: 'move' }], lines: [] }), `${cap(whenWords(r.when))}: also 2 straight ahead`) : '').join('');
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

  dlg.addEventListener('close', e => { if (e.target === dlg) { cancel(screenEl); const p = q<HTMLElement>('.ws-edit-sheet'); if (p) { cancel(p); (p as HTMLDialogElement).close(); } } });

  /* ---- keys ---- */

  dlg.addEventListener('keydown', e => {
    // Only the editor itself: a key pressed in a sheet acts on the sheet alone.
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && screen === 'editor' && !q('.ws-sheet:not(.ws-edit-sheet)[open]') && !fromLink && !(e.target as HTMLElement).closest('input[type="text"]')) {
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
