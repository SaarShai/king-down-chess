// Workshop pieces that travel: a Workshop piece as a card that a friend opens read-only, keeps and tries.
// The worth, the band word and the share code come from the Workshop's own code (src/workshop/, bundled in
// workshop-judge.js by build-judge.mjs). The test board is the kit's painted board; the custom piece's moves
// follow src/workshop/moves.ts for squares (a design here has no lines and no properties).
import { createBoard } from '../../kit/board.js';
import { icon } from '../../kit/icons.js';
import { $, $$, toast, hideToast, openSheet, closeSheet, animate, prefersReducedMotion, sfx, wait } from '../../kit/ui.js';
import { judge, bandOf, pawns, halves, groupsOf, groupPhrase, orbit, setMark, designCode, letterOf } from './workshop-judge.js';

const ART = new URL('../../assets/workshop/', import.meta.url).href;
const figUrl = (id, army = 'w') => `${ART}${id}-${army}.webp`;

// ---- the designs ----
const ring = (offs, mark, on = 'all') => offs.flatMap(([x, y]) => orbit(x, y, on)).map(([x, y]) => ({ x, y, mark }));
const KING_BOTH = () => ring([[0, 1], [1, 1]], 'both');
const SAMPLES = [
  { name: 'Javelin Runner', figure: 'javelin-runner', squares: KING_BOTH() },
  { name: 'Hare Scout', figure: 'hare-scout', squares: [...ring([[1, 2]], 'both'), ...ring([[0, 1]], 'move', 'lr')] },
  { name: 'Lantern Witch', figure: 'lantern-witch', squares: [...ring([[1, 1]], 'both'), ...ring([[0, 2]], 'take')] },
];
/** The one change of the story: the Javelin Runner learns to shoot 2 squares straight ahead. */
const withShot = d => ({ ...d, squares: [...d.squares, { x: 0, y: 2, mark: 'shoot' }] });
const copy = d => ({ name: d.name, figure: d.figure, squares: d.squares.map(s => ({ ...s })), lines: [], rules: [] });

let design = copy(SAMPLES[0]);
let undoStack = [];
let lastChange = null;      // { lines: [...], was: worth, added: Set, removed: Set }
let tab = 'take', takeBy = 'take', applyTo = 'all';
let source = 'mine';        // 'mine' | 'link' | 'kept'
let sample = 0;

const CH = {
  move: m => m === 'move' || m === 'both' || m === 'moveShoot',
  take: m => m === 'both' || m === 'take',
  shoot: m => m === 'shoot' || m === 'moveShoot',
};
const keyOf = s => `${s.x},${s.y}`;
const pts = (d, ch) => d.squares.filter(s => CH[ch](s.mark));
const KING8 = ['0,1', '1,1', '1,0', '1,-1', '0,-1', '-1,-1', '-1,0', '-1,1'];
function phrase(list) {
  const keys = list.map(keyOf);
  if (keys.length === 8 && KING8.every(k => keys.includes(k))) return '1 square any way';
  const gs = groupsOf(list).map(g => groupPhrase(g.orbit, g.pts));
  return gs.length < 2 ? gs[0] : `${gs.slice(0, -1).join(', ')} or ${gs.at(-1)}`;
}
/** The card's three lines, in the order of the marks: moves, takes, shoots. They say what Try it does
 * (src/workshop/moves.ts): a square 2 or more away is a leap, and a shot goes over the pieces between. */
const far = list => list.some(q => Math.max(Math.abs(q.x), Math.abs(q.y)) > 1);
function ruleLines(d) {
  const out = [];
  const m = pts(d, 'move'), t = pts(d, 'take'), s = pts(d, 'shoot');
  if (m.length) out.push(['move', `Moves ${phrase(m)}${far(m) ? ', even over pieces' : ''}.`]);
  if (t.length) out.push(['take', `Takes ${phrase(t)}${far(t) ? ', even over pieces' : ''}.`]);
  if (s.length) out.push(['shoot', `Shoots ${phrase(s)} without moving, even over pieces.`]);
  if (!out.length) out.push(['move', 'Tap a square to give it a move.']);
  return out;
}
/** "What changed": one sentence for each channel that gained or lost squares. */
function whatChanged(a, b) {
  const out = [];
  for (const [ch, verb] of [['move', 'moves'], ['take', 'takes'], ['shoot', 'shoots']]) {
    const A = new Set(pts(a, ch).map(keyOf)), B = new Set(pts(b, ch).map(keyOf));
    const added = pts(b, ch).filter(s => !A.has(keyOf(s))), gone = pts(a, ch).filter(s => !B.has(keyOf(s)));
    if (added.length) out.push(`Now ${verb} ${phrase(added)}.`);
    if (gone.length) out.push(`No longer ${verb} ${phrase(gone)}.`);
  }
  return out;
}
const verdict = d => {
  const v = judge(d);
  return { word: d.squares.length ? bandOf(v) : 'Empty', point: v.worth.point, pawns: pawns(v.worth.point) };
};
const fullDesign = d => ({ v: 1, kind: 'piece', id: 'demo', name: d.name, named: true, look: { figure: d.figure, body: 'token', auto: true, glow: null, army: 0 }, letter: letterOf(d.name), squares: d.squares, lines: [], rules: [], from: [], updated: 0 });
const linkOf = d => `https://kingdown.dev/?design=${designCode(fullDesign(d))}`;

// ---- the card ----
function diagram(d, c) {
  const far = Math.max(2, ...d.squares.map(s => Math.max(Math.abs(s.x), Math.abs(s.y))));
  const n = far * 2 + 1;
  let cells = '';
  for (let y = far; y >= -far; y--) for (let x = -far; x <= far; x++) {
    if (!x && !y) { cells += `<i class="me"><img src="${figUrl(d.figure)}" alt=""></i>`; continue; }
    const s = d.squares.find(q => q.x === x && q.y === y);
    const cls = [(x + y) & 1 ? 'dk' : '', s && CH.move(s.mark) ? 'c-move' : '', s && CH.take(s.mark) ? 'c-take' : '', s && CH.shoot(s.mark) ? 'c-shoot' : ''].filter(Boolean).join(' ');
    cells += `<i class="${cls}"></i>`;
  }
  const words = ruleLines(d).map(l => l[1]).join(' ');
  return `<div><span class="wc-fwd" aria-hidden="true">Forward ↑</span><div class="dg" style="--n:${n};--c:${c}px" role="img" aria-label="Move diagram, forward is up. ${words}">${cells}</div></div>`;
}
const rulesHtml = d => `<ul class="wc-rules">${ruleLines(d).map(([k, t]) => `<li><span class="mk mk-${k}" aria-hidden="true"></span><span>${t}</span></li>`).join('')}</ul>`;
function cardHtml(d, { cell = 20, id = '' } = {}) {
  const v = verdict(d);
  return `<article class="wcard"${id ? ` id="${id}"` : ''} aria-label="${d.name}, a Workshop piece">
    <div class="wc-art"><img class="wc-fig" src="${figUrl(d.figure)}" alt=""></div>
    <h2 class="wc-name">${d.name}</h2>
    <div class="wc-reach">${diagram(d, cell)}${rulesHtml(d)}</div>
    <div class="wc-worth"><span class="wc-word">${v.word}</span><span class="wc-pawns">Estimated worth: about ${v.pawns}</span></div>
  </article>`;
}
const miniHtml = d => {
  const v = verdict(d);
  return `<div class="mini-fig"><img src="${figUrl(d.figure)}" alt=""></div><div><p class="mini-name">${d.name}</p><p class="mini-worth"><b>${v.word}</b> · about ${v.pawns}</p></div>`;
};

function renderCards() {
  $('#home-card').innerHTML = cardHtml(design);
  $('#edit-card').innerHTML = cardHtml(design);
  $('#edit-mini').innerHTML = miniHtml(design);
  $('#piece-card').innerHTML = cardHtml(design, { id: 'the-card' });
  $('#try-top').innerHTML = `<div class="mini">${miniHtml(design)}</div>${rulesHtml(design)}`;
  $('#share-name').textContent = design.name;
  const url = linkOf(design);
  $('#share-url').textContent = url.replace('https://', '').slice(0, 44) + '…';
  $('#share-url').title = url;
}

// ---- the editor: two 7 x 7 boards, as in the app ----
function renderGrids() {
  for (const g of $$('.grid7')) {
    const ch = g.dataset.ch;
    const focusKey = g.contains(document.activeElement) ? document.activeElement.dataset.k : null;
    let html = '';
    for (let y = 3; y >= -3; y--) for (let x = -3; x <= 3; x++) {
      const k = `${x},${y}`;
      if (!x && !y) { html += `<button type="button" class="cell me" data-k="${k}" tabindex="-1" aria-label="Your piece" disabled><img src="${figUrl(design.figure)}" alt=""></button>`; continue; }
      const s = design.squares.find(q => q.x === x && q.y === y);
      const on = ch === 'move' ? s && CH.move(s.mark) : s && (CH.take(s.mark) || CH.shoot(s.mark));
      const cls = ['cell', (x + y) & 1 ? 'dk' : '',
        on && ch === 'move' ? 'c-move' : '', on && ch === 'take' && CH.take(s.mark) ? 'c-take' : '', on && ch === 'take' && CH.shoot(s.mark) ? 'c-shoot' : '',
        lastChange?.added.has(`${ch}:${k}`) ? 'is-new' : '', lastChange?.removed.has(`${ch}:${k}`) ? 'is-gone' : ''].filter(Boolean).join(' ');
      const where = [y > 0 ? `${y} up` : y < 0 ? `${-y} down` : '', x > 0 ? `${x} right` : x < 0 ? `${-x} left` : ''].filter(Boolean).join(', ');
      const what = !on ? 'off' : ch === 'move' ? 'moves' : CH.shoot(s.mark) ? 'shoots' : 'takes';
      html += `<button type="button" class="${cls}" data-k="${k}" tabindex="-1" aria-pressed="${!!on}" aria-label="${where}: ${what}"></button>`;
    }
    g.innerHTML = html;
    const f = (focusKey && g.querySelector(`[data-k="${focusKey}"]`)) || g.querySelector('[data-k="0,2"]');
    f.tabIndex = 0;
    if (focusKey) f.focus();
  }
}
function renderChanged({ fresh = false } = {}) {
  const box = $('#changed');
  if (!lastChange) {
    box.className = 'changed is-hint';
    box.innerHTML = `${icon('info')}<p class="what">Tap a square to change it.</p><span></span>`;
    return;
  }
  const v = verdict(design), was = halves(lastChange.was), now = halves(v.point);
  box.className = 'changed';
  box.innerHTML = `${icon('sparkle')}<div><p class="what">${lastChange.lines.join(' ') || 'Nothing changed.'}</p><p class="worth">Worth: about ${was === now ? '' : `${was} → `}${v.pawns} · ${v.word}</p></div>
    <button type="button" class="btn btn-quiet" data-act="undo">${icon('undo')}<span>Undo</span></button>`;
  if (fresh) animate(box, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
function setTab(t) {
  tab = t;
  for (const b of $$('[data-tab]')) b.setAttribute('aria-pressed', String(b.dataset.tab === t));
  $('#pane-move').classList.toggle('is-off', t !== 'move');
  $('#pane-take').classList.toggle('is-off', t !== 'take');
}
/** One tap on a board: the app's rule (dialog.ts): the tapped square decides on or off, "Apply to" picks the squares. */
function edit(ch, x, y) {
  const channel = ch === 'move' ? 'move' : takeBy;
  const old = design.squares.find(s => s.x === x && s.y === y)?.mark;
  const on = !(ch === 'move' ? old && CH.move(old) : old && (CH.take(old) || CH.shoot(old)));
  const before = copy(design);
  const next = copy(design);
  for (const [a, b] of orbit(x, y, applyTo)) {
    const i = next.squares.findIndex(s => s.x === a && s.y === b);
    const mark = setMark(i >= 0 ? next.squares[i].mark : undefined, channel, on);
    if (i >= 0) next.squares.splice(i, 1);
    if (mark) next.squares.push({ x: a, y: b, mark });
  }
  commit(before, next);
}
function commit(before, next, { fromUndo = false } = {}) {
  if (!fromUndo) undoStack.push(before);
  design = next;
  const added = new Set(), removed = new Set();
  for (const [board, chs] of [['move', ['move']], ['take', ['take', 'shoot']]]) {
    const has = (d, k) => chs.some(c => pts(d, c).some(s => keyOf(s) === k));
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
      const k = `${x},${y}`, a = has(before, k), b = has(next, k);
      if (!a && b) added.add(`${board}:${k}`);
      if (a && !b) removed.add(`${board}:${k}`);
    }
  }
  lastChange = fromUndo ? null : { lines: whatChanged(before, next), was: judge(before).worth.point, added, removed };
  renderCards(); renderGrids(); renderChanged({ fresh: true });
  for (const el of $$('.cell.is-new')) { el.classList.add('flash'); }
  sfx.tap();
}
function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  commit(design, prev, { fromUndo: true });
  toast('Change undone.');
}

// ---- Try it: the kit's painted board; the other side never moves ----
const ENEMIES = [['rook', 'h8'], ['knight', 'f7'], ['pawn', 'd6'], ['bishop', 'b5'], ['pawn', 'f5'], ['pawn', 'g4']];
const idx = sq => (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97);
const sqName = i => 'abcdefgh'[i & 7] + ((i >> 3) + 1);
let cells = [], pos = 'd4', moveNo = 1, busy = false, tryGen = 0;
const board = createBoard($('#try-board'), {
  coords: true, headroom: 0.25,
  label: 'Try it board. Arrow keys move, Enter or Space plays a marked square. The other side never moves.',
  onTap(sq) { void tryTap(sq); return false; },
});
function dress() {
  const el = board.figure(pos);
  if (el) el.style.visibility = '';   // the board keeps the element; a stopped leap may have hidden it
  if (!el || el.querySelector('img.ws')) return el;
  el.innerHTML = `<img class="ws" src="${figUrl(design.figure)}" alt="" style="left:8%;top:-16%;width:84%;height:104%;object-fit:contain">`;
  return el;
}
function legalTry() {
  const f = idx(pos) & 7, r = idx(pos) >> 3, out = [];
  for (const s of design.squares) {
    const tf = f + s.x, tr = r + s.y;
    if (tf < 0 || tf > 7 || tr < 0 || tr > 7) continue;
    const to = sqName(tr * 8 + tf), occ = cells[tr * 8 + tf];
    if (!occ && CH.move(s.mark)) out.push({ kind: 'move', to });
    else if (occ && occ.color === 'b' && CH.take(s.mark)) out.push({ kind: 'take', to, victim: occ });
    else if (occ && occ.color === 'b' && CH.shoot(s.mark)) out.push({ kind: 'shot', to, victim: occ });
  }
  return out;
}
function markTry({ pop = true } = {}) {
  board.clearMarks('move'); board.clearMarks('capture'); board.clearMarks('shot'); board.clearMarks('selected');
  board.mark(pos, 'selected');
  for (const m of legalTry()) {
    if (m.kind === 'move') board.mark(m.to, 'move', { pop, from: pos });
    else { board.mark(m.to, 'capture', { pop, from: pos }); if (m.kind === 'shot') board.mark(m.to, 'shot', { pop, from: pos }); }
  }
}
function say(main, sub = 'Tap a marked square. Their pieces stay still.') {
  $('#try-say').innerHTML = `${main}${sub ? `<small>${sub}</small>` : ''}`;
}
/** The Workshop's test position: the piece on d4, two own pawns, six enemy pieces that stay still. */
function startCells() {
  const c = new Array(64).fill(null);
  const put = (type, color, sq) => { c[idx(sq)] = { type, color, sq }; };
  put('pawn', 'w', 'c3'); put('pawn', 'w', 'e3');
  for (const [t, s] of ENEMIES) put(t, 'b', s);
  put(design.name, 'w', 'd4');
  return c;
}
function tryReset({ marks = true } = {}) {
  tryGen++; busy = false;
  cells = startCells();
  pos = 'd4'; moveNo = 1;
  board.setBoard(cells);
  dress();
  if (marks) markTry({ pop: false });
  say(`Move 1: your ${design.name}`);
}
async function tryTap(sq) {
  if (busy) return;
  const m = legalTry().find(x => x.to === sq);
  if (!m) { if (sq !== pos) say('Not a marked square.'); return; }
  busy = true;
  const gen = tryGen, mover = board.figure(pos);
  board.clearMarks();
  if (m.kind === 'shot') {
    sfx.capture();
    await board.shoot(pos, m.to);
    if (gen !== tryGen) return;
    await board.dip(board.figure(m.to));
    if (gen !== tryGen) return;
  } else {
    if (m.kind === 'take') { sfx.capture(); void board.dip(board.figure(m.to)); } else sfx.move();
    await board.slide(mover, pos, m.to);
    if (gen !== tryGen) return;
  }
  land(m);
  markTry();
  busy = false;
}
/** The board after a move: the end frame of tryTap, and the still of the try-it state. */
function land(m) {
  if (m.kind === 'shot') cells[idx(m.to)] = null;
  else { cells[idx(m.to)] = cells[idx(pos)]; cells[idx(pos)] = null; pos = m.to; }
  board.setBoard(cells);
  dress();
  board.mark(m.to, 'last');
  moveNo++;
  const who = m.victim ? `the enemy ${m.victim.type} on ${m.to}` : '';
  say(m.kind === 'shot' ? `Shot ${who}.` : m.kind === 'take' ? `Took ${who}.` : `Moved to ${m.to}.`);
}

// ---- the poster (option B): the piece in place on the stone board, cropped to whole squares b3 to f6 ----
let poster = null;
const inCrop = sq => 'bcdef'.includes(sq[0]) && '3456'.includes(sq[1]);
async function posterHtml() {
  const v = verdict(design);
  $('#share-img').innerHTML = `<div class="poster">
    <div class="poster-top"><b>${design.name}</b><span>${v.word}</span></div>
    <div class="poster-crop"><div class="poster-board" id="poster-board"></div></div>
    <div class="poster-bot"><span>${ruleLines(design).map(l => l[1].replace(' without moving', '')).slice(-1)[0]}</span><span>King Down Workshop</span></div>
  </div>`;
  poster?.destroy?.();
  poster = createBoard($('#poster-board'), { interactive: false, sound: false, coords: false, headroom: 0.25 });
  poster.setBoard(startCells().map(x => (x && inCrop(x.sq) ? x : null)));
  const el = poster.figure('d4');
  if (el) el.innerHTML = `<img src="${figUrl(design.figure)}" alt="" style="left:8%;top:-16%;width:84%;height:104%;object-fit:contain">`;
}
function posterMarks() {
  poster.clearMarks();
  poster.mark('d4', 'selected');
  const c = poster.cells;
  for (const s of design.squares) {
    const tf = 3 + s.x, tr = 3 + s.y;
    if (tf < 0 || tf > 7 || tr < 0 || tr > 7) continue;
    const to = sqName(tr * 8 + tf), occ = c[tr * 8 + tf];
    if (!inCrop(to)) continue;
    if (!occ && CH.move(s.mark)) poster.mark(to, 'move');
    else if (occ && occ.color === 'b' && (CH.take(s.mark) || CH.shoot(s.mark))) { poster.mark(to, 'capture'); if (CH.shoot(s.mark)) poster.mark(to, 'shot'); }
  }
}
/** Put b3 at the crop's lower left corner: 5 whole files across, 4 whole ranks up to the top of f6. */
function placePoster() {
  const host = $('#poster-board'), crop = host?.parentElement;
  if (!host || !crop.clientHeight) return;
  const hr = host.getBoundingClientRect(), r = poster.squareRect('b3');
  host.style.left = `${hr.left - r.left}px`;
  host.style.top = `${crop.clientHeight - (r.bottom - hr.top)}px`;
}

// ---- views ----
const BACK = `${icon('back')}<span>Back</span>`;
for (const b of $$('.head-back')) b.innerHTML = BACK;
for (const b of $$('[data-act="share"]')) b.innerHTML = `${icon('share')}<span>Share</span>`;
$('[data-act="surprise"]').innerHTML = `${icon('sparkle')}<span>Surprise me</span>`;
$('[data-act="send"]').innerHTML = `${icon('share')}<span>Send link</span>`;
$('[data-act="reset"]').innerHTML = `${icon('undo')}<span>Reset</span>`;
$('#share [data-close]').innerHTML = icon('close');

function show(id, { enter = false, focus = true } = {}) {
  // A button in the old view had the focus (or nothing had it): give it to the new view's heading, so a screen reader reads it.
  const a = document.activeElement, lost = focus && document.hasFocus() && (!a || a === document.body || !!a.closest('.view'));
  for (const v of $$('.view')) v.hidden = v.id !== id;
  const v = $(`#${id}`);
  if (enter && !prefersReducedMotion()) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); } else v.classList.remove('enter');
  v.querySelector('.ws-body').scrollTop = 0;
  if (lost) v.querySelector('h1').focus({ preventScroll: true });
}
const wide = () => matchMedia('(min-width: 900px)').matches;

/** The piece view for the sender ('mine'), the friend ('link') or after Keep a copy ('kept'). mode: 'card' or 'try'. */
function showPiece(src, mode = 'card', { enter = false, marks = true } = {}) {
  source = src;
  const v = $('#v-piece');
  v.dataset.mode = mode;
  // After Keep a copy the piece is the friend's own: the same title and the same save line as the maker's piece.
  $('#piece-title').textContent = mode === 'try' && !wide() ? 'Try it' : src === 'link' ? 'Workshop' : 'Your piece';
  $('#piece-end').innerHTML = src === 'link' ? '<span class="pill">From a link</span>' : '';
  $('#piece-note').innerHTML = src === 'link' ? 'Read only. <b>Keep a copy</b> to change it.<br>It plays on the test board, not in games.'
    : `${icon('check', { size: 16 })} Saved on this device${src === 'kept' ? ', in Your designs' : ''}.`;
  const B = (act, text, primary = false, ic = '') => `<button type="button" class="btn${primary ? ' btn-primary' : ''}" data-act="${act}">${ic ? icon(ic) : ''}<span>${text}</span></button>`;
  const CHANGE = 'Change one thing', share = B('share', 'Share', false, 'share');
  $('#foot-card').innerHTML = src === 'mine' ? B('try', 'Try it') + B('share', 'Share', true, 'share')
    : src === 'link' ? B('keep', 'Keep a copy') + B('try', 'Try it', true)
    : B('try', 'Try it') + B('change', CHANGE, true);
  // A phone footer holds two buttons; the maker's third action sits quietly under the card.
  $('#card-quiet').innerHTML = src === 'mine' ? `<button type="button" class="link-btn" data-act="change">${CHANGE}</button>` : '';
  $('#foot-try').innerHTML = B('reset', 'Reset', false, 'undo') + (src === 'link' ? B('keep', 'Keep a copy', true) : src === 'mine' ? B('share', 'Share', true, 'share') : B('change', CHANGE, true));
  $('#card-actions').innerHTML = src === 'mine' ? B('share', 'Share', true, 'share') + B('change', CHANGE)
    : src === 'link' ? B('keep', 'Keep a copy', true)
    : B('change', CHANGE, true) + share;
  show('v-piece', { enter });
  // The board lays out once it is in view; its marks follow its size, so draw them after that.
  if (marks) { const g = tryGen; frames(2).then(() => { if (g === tryGen && !busy) markTry({ pop: false }); }); }
}
function showEdit({ enter = false } = {}) {
  setTab(tab);
  $('#take-by').value = takeBy;
  $('#apply-to').value = applyTo;
  renderGrids(); renderChanged();
  show('v-edit', { enter });
}

// ---- share ----
async function openShare(kind = 'card') {
  if (kind === 'poster') await posterHtml();
  else $('#share-img').innerHTML = cardHtml(design);
  $('#share-img').setAttribute('aria-label', kind === 'poster' ? `Preview picture: ${design.name} on the board, with its moves marked.` : `Preview picture: the card of ${design.name}.`);
  $('#share-note').textContent = `Your friend sees this ${kind === 'poster' ? 'picture' : 'card'}. It opens read only.`;
  openSheet('share');
  if (kind === 'poster') { await frames(3); placePoster(); posterMarks(); }
}
function closeShareNow() { const d = $('#share'); if (d.open) { d.classList.remove('is-closing'); d.close(); } }
async function clip(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); } catch { toast('Copy did not work here. The app then shows the text to copy.'); }
}

// ---- actions ----
async function act(name) {
  switch (name) {
    case 'close': toast('Back closes the Workshop.'); break;
    case 'change': tab = 'take'; showEdit({ enter: true }); break;
    case 'try':
      if (!$('#v-piece').hidden && wide()) { $('#try-board .kdb')?.focus(); break; }
      await goTry({ fly: !$('#v-piece').hidden });
      break;
    case 'surprise':
      sample = (sample + 1) % SAMPLES.length;
      design = copy(SAMPLES[sample]); undoStack = []; lastChange = null;
      renderCards(); tryReset();
      animate($('#home-card .wcard'), [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
      toast(`A new working piece: ${design.name}.`);
      break;
    case 'blank': toast('Start blank: pick a figure, then paint its squares.'); break;
    case 'edit-back': lastChange = null; showPiece('mine', 'card', { enter: true }); break;
    case 'piece-back':
      if ($('#v-piece').dataset.mode === 'try' && !wide()) showPiece(source, 'card', { enter: true });
      else if (source === 'mine') showEdit({ enter: true });
      else { show('v-home', { enter: true }); }
      break;
    case 'share': await openShare('card'); break;
    case 'send':
      await closeSheet('share');
      await scene("On your friend's phone");
      source = 'link'; tryReset(); showPiece('link', 'card', { enter: true });
      break;
    case 'copy-link': await clip(linkOf(design), 'Link copied.'); break;
    case 'copy-text': await clip(`${design.name}\n${ruleLines(design).map(l => l[1]).join('\n')}\nAbout ${verdict(design).pawns}. ${verdict(design).word}.\n\n${linkOf(design)}`, 'Copied as text.'); break;
    case 'keep': showPiece('kept', 'card', { enter: true }); break;
    case 'reset': tryReset(); break;
    case 'undo': undo(); break;
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b) { void act(b.dataset.act); return; }
  const t = e.target.closest('[data-tab]');
  if (t) { setTab(t.dataset.tab); return; }
  const c = e.target.closest('.cell');
  if (c && !c.disabled) { const [x, y] = c.dataset.k.split(',').map(Number); edit(c.closest('.grid7').dataset.ch, x, y); }
});
// The boards: one Tab stop each; the arrow keys move between squares.
document.addEventListener('keydown', e => {
  const c = e.target.closest?.('.cell');
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
  if (!c || !step) return;
  e.preventDefault();
  let [x, y] = c.dataset.k.split(',').map(Number);
  x = Math.max(-3, Math.min(3, x + step[0])); y = Math.max(-3, Math.min(3, y + step[1]));
  if (!x && !y) { x += step[0]; y += step[1]; }
  const g = c.closest('.grid7'), n = g.querySelector(`[data-k="${x},${y}"]`);
  for (const b of g.querySelectorAll('.cell')) b.tabIndex = b === n ? 0 : -1;
  n.focus();
});
$('#take-by').addEventListener('change', e => { takeBy = e.target.value; });
$('#apply-to').addEventListener('change', e => { applyTo = e.target.value; });

// ---- Try it, with the figure's leap onto its square ----
const frames = (n = 2) => new Promise(r => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
async function goTry({ fly = false } = {}) {
  const phone = !wide(), motion = fly && !prefersReducedMotion();
  // On a wide screen the card stays beside the board, so the figure leaves the card. On a phone Try it replaces
  // the card, so the figure leaves the small portrait at the top of Try it.
  const cardFig = motion && !phone ? $('#the-card .wc-fig')?.getBoundingClientRect() : null;
  tryReset({ marks: false });
  const g = tryGen;
  showPiece(source, 'try', { enter: !fly && $('#v-piece').hidden, marks: !fly });
  const target = dress(), img = target?.querySelector('img');
  // The rule lines come in with the marks they explain, so the leap never crosses them.
  const legend = motion && phone ? $('#try-top .wc-rules') : null;
  if (motion && img) target.style.visibility = 'hidden';
  if (legend) legend.style.opacity = '0';
  const stop = () => { if (legend) legend.style.opacity = ''; };
  await frames(2);
  if (g !== tryGen) return stop();
  if (motion && img) {
    if (phone) { await wait(160); if (g !== tryGen) return stop(); }
    const from = cardFig ?? $('#try-top .mini-fig img')?.getBoundingClientRect();
    if (from?.height) {
      const to = img.getBoundingClientRect();
      const clone = document.createElement('img');
      clone.src = img.src; clone.alt = ''; clone.className = 'fly';
      Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
      document.body.appendChild(clone);
      const s = to.height / from.height, dx = to.left + to.width / 2 - (from.left + from.width * s / 2), dy = to.top - from.top;
      await clone.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.5 - 40}px) scale(${(1 + s) / 2})`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
      ], { duration: 480, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }).finished.catch(() => {});
      clone.remove();
    }
    target.style.visibility = '';
    if (g !== tryGen) return stop();
    sfx.move();
    void board.burst(pos, '255,214,128');
  }
  markTry({ pop: true });
  if (legend) { legend.style.opacity = ''; animate(legend, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); }
}

// ---- the scripted story: helpers ----
async function tapAt(x, y) {
  if (prefersReducedMotion()) return;
  const d = document.createElement('div');
  d.className = 'tapdot';
  Object.assign(d.style, { left: `${x}px`, top: `${y}px` });
  document.body.appendChild(d);
  await d.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' }).finished.catch(() => {});
  d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => d.remove()).catch(() => d.remove());
}
async function tap(el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  await tapAt(r.left + r.width / 2, r.top + r.height / 2);
  el.classList.add('is-pressed');
  await wait(110, { instant: true });
  el.classList.remove('is-pressed');
  el.click();
}
const visible = sel => $$(sel).find(el => el.offsetParent !== null && el.getClientRects().length);
/** A tap on a select, then its new value (a script cannot show the open list). */
async function pick(sel, value) {
  const r = sel.getBoundingClientRect();
  await tapAt(r.left + r.width / 2, r.top + r.height / 2);
  sel.value = value;
  sel.dispatchEvent(new Event('change'));
}
async function scene(text) {
  if (prefersReducedMotion()) return;
  const s = document.createElement('div');
  s.className = 'scene';
  s.innerHTML = `<span>${text}</span>`;
  document.body.appendChild(s);
  await s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' }).finished.catch(() => {});
  await wait(800);
  await s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).finished.catch(() => {});
  s.remove();
}

// ---- the demo contract ----
let run = 0;
function base({ d = SAMPLES[0], shot = false } = {}) {
  closeShareNow(); hideToast();
  for (const el of $$('.fly, .tapdot, .scene')) el.remove();
  design = copy(shot ? withShot(d) : d);
  undoStack = []; lastChange = null; tab = 'take'; takeBy = 'take'; applyTo = 'all'; source = 'mine'; sample = 0;
  renderCards();
  tryReset();
}
const settle = () => frames(3);

window.demo = {
  async state(name) {
    run++;
    switch (name) {
      case 'card':
        base({ shot: true }); showPiece('mine', 'card'); break;
      case 'share':
        base({ shot: true }); showPiece('mine', 'card'); await settle(); await openShare('card'); break;
      case 'received':
        base({ shot: true }); showPiece('link', 'card'); break;
      case 'try-it':
        // The moment after the friend's first tap: the shot has taken the pawn on d6.
        base({ shot: true }); showPiece('link', 'try'); await settle();
        land(legalTry().find(m => m.to === 'd6')); markTry({ pop: false }); break;
      case 'kept':
        base({ shot: true }); showPiece('kept', 'card'); break;
      case 'entry':
        base(); show('v-home'); break;
      case 'changed': {
        base(); takeBy = 'shoot'; applyTo = 'one';
        showEdit();
        const before = copy(design);
        undoStack.push(before);
        design = withShot(copy(design));
        lastChange = { lines: whatChanged(before, design), was: judge(before).worth.point, added: new Set(['take:0,2']), removed: new Set() };
        renderCards(); renderGrids(); renderChanged();
        break;
      }
      case 'poster':
        base({ shot: true }); showPiece('mine', 'card'); await settle(); await openShare('poster'); break;
      default: throw new Error(`No state "${name}"`);
    }
    await settle();
  },

  async play() {
    const me = ++run;
    const go = () => me === run;
    base(); show('v-home', { focus: false });
    await wait(800); if (!go()) return;
    await tap(visible('#v-home [data-act="change"]')); if (!go()) return;
    await wait(700); if (!go()) return;
    await pick($('#take-by'), 'shoot'); if (!go()) return;
    await wait(450); if (!go()) return;
    await pick($('#apply-to'), 'one'); if (!go()) return;
    await wait(450); if (!go()) return;
    await tap($('#pane-take [data-k="0,2"]')); if (!go()) return;
    await wait(1600); if (!go()) return;
    await tap(visible('#v-edit [data-act="share"]')); if (!go()) return;
    await wait(1600); if (!go()) return;
    const send = $('#share [data-act="send"]');
    const r = send.getBoundingClientRect();
    await tapAt(r.left + r.width / 2, r.top + r.height / 2); if (!go()) return;
    await closeSheet('share'); if (!go()) return;
    await scene("On your friend's phone"); if (!go()) return;
    tryReset(); showPiece('link', 'card', { enter: true });
    await wait(1300); if (!go()) return;
    const tryBtn = visible('#v-piece [data-act="try"]');
    if (tryBtn) { const t = tryBtn.getBoundingClientRect(); await tapAt(t.left + t.width / 2, t.top + t.height / 2); }
    if (!go()) return;
    await goTry({ fly: true }); if (!go()) return;
    await wait(900); if (!go()) return;
    const d6 = board.squareRect('d6');
    await tapAt(d6.left + d6.width / 2, d6.top + d6.height / 2); if (!go()) return;
    await tryTap('d6'); if (!go()) return;
    await wait(1400); if (!go()) return;
    await tap(visible('#v-piece [data-act="keep"]')); if (!go()) return;
    await wait(1500);
  },

  async reset() {
    run++;
    base(); show('v-home', { focus: false });
  },
};

base();
show('v-home', { focus: false });
