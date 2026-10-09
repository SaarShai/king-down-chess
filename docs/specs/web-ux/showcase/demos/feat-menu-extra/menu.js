// Menu and Extra: what folds, where, and how it calls without noise.
// The game screen keeps Hint, Undo and Menu. Menu holds New game, Guide, the Feel row, Extra and Resign.
// Extra is an index (A) or a cabinet (B); Tricks (C) keeps a seal for each trick the player finds.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, workshopArt, ASSET_URL } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, toast, hideToast, sfx, haptic, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

// ---- the position: P1 of the idea bank, after Black's e7-e6 ----
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const BEFORE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const p1 = () => KD.play(KD.fromFen(BEFORE, { powers: POWERS }), 'e7-e6');
const CHAIN = 'Se4xd5xe6';                   // the Beast bites the Ogre, then the pawn: a first trick
const afterChain = () => KD.play(p1(), CHAIN);
const REPLY = 'h7-h6';                       // a quiet answer for the film (the live game uses the real computer)
const FRAME = 26 / 112;                      // the board frame, in squares (kit/board.js)

// ---- what the player has: settings, found tricks, one new seal ----
const DEFAULT_PREFS = { threats: false, coords: true, icons: false, letters: false };
let prefs = { ...DEFAULT_PREFS };
let variant = 'index';                       // Extra as 'index' (A) or 'cabinet' (B)
let found = [];                              // found tricks, newest first
let newSeal = false;                         // the one gold dot on the Menu button: a seal that the player has not seen yet
let visitNew = false;                        // inside the sheet, for this visit only: the line and the dots that lead to Tricks
let stampOnOpen = false;                     // the Tricks page stamps the newest seal once
let lastStory = null, baseLen = 0, resigned = false;
let epoch = 0, run = 0, sealRun = Promise.resolve(), hurrySeal = null;

// ---- the tricks: true to docs/RULES.md (research/king-down-facts.md §2, §3) ----
const TRICKS = [
  { id: 'chain', art: pieceArt('beast', 'w'), seal: 'beast', name: 'Bite chain', found: 'Your beast bit twice in one turn.', riddle: 'One piece can bite, then bite again.' },
  { id: 'shot-over', art: pieceArt('archer', 'w'), seal: 'archer', name: 'Shot over a piece', found: 'Your archer shot over a piece.', riddle: 'One piece in the way cannot stop her shot.' },
  { id: 'shove-guard', art: pieceArt('ogre', 'w'), seal: 'ogre', name: 'Shove a guard', found: 'Your ogre shoved a guard.', riddle: 'A guard stands firm. Which piece can shove it?' },
  { id: 'far-swap', art: pieceArt('maester', 'w'), seal: 'maester', name: 'Far swap', found: 'Your maester and king swapped from a distance.', riddle: 'Two friends on the first rank swap from a distance. Which two?' },
  { id: 'king-guard', art: pieceArt('guard', 'w'), seal: 'king', name: 'A king takes a guard', found: 'Your king took a guard.', riddle: 'A guard fears only one piece.' },
  { id: 'second-life', art: pieceArt('king', 'w', 'stratus'), seal: 'pawn', name: 'A second life', found: 'Your pawn brought back a fallen friend.', riddle: 'A pawn brings back a fallen friend. Which king helps?' },
];
const trick = id => TRICKS.find(t => t.id === id);

/** The trick in a move of the player, or null. */
function trickOf(st) {
  const at = sq => st.after[KD.sq.index(sq)];
  const fileRank = sq => [sq.charCodeAt(0) - 97, +sq[1] - 1];
  if (st.kind === 'chain') return 'chain';
  if (st.kind === 'shoot' && st.capturedOn[0]) {
    const [fx, fy] = fileRank(st.from), [tx, ty] = fileRank(st.capturedOn[0]);
    const dx = tx - fx, dy = ty - fy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 2 && dx % 2 === 0 && dy % 2 === 0) {
      const mid = String.fromCharCode(97 + fx + dx / 2) + (fy + dy / 2 + 1);
      if (at(mid)) return 'shot-over';
    }
  }
  if (st.kind === 'push' && st.push?.piece === 'guard') return 'shove-guard';
  if (st.kind === 'swap' && st.swap?.with === 'king') {
    const [fx, fy] = fileRank(st.from), [tx, ty] = fileRank(st.to);
    if (Math.max(Math.abs(tx - fx), Math.abs(ty - fy)) > 1) return 'far-swap';
  }
  if (st.piece === 'king' && st.captured.includes('guard')) return 'king-guard';
  if (st.power === 'Sacrifice' || st.lan.startsWith('!S:')) return 'second-life';
  return null;
}

// ---- the wax seal: a crimson disc, a soft wavy rim, the piece's rulebook icon ----
const WAX = (() => {
  let d = '';
  for (let i = 0; i <= 144; i++) {
    const a = (i / 144) * Math.PI * 2, r = 22.4 + 1.25 * Math.cos(a * 18);
    d += `${i ? 'L' : 'M'}${(24 + r * Math.cos(a)).toFixed(2)} ${(24 + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
})();
const seal = (piece, cls = '', size = 0) => `<span class="seal${cls ? ' ' + cls : ''}"${size ? ` style="--s:${size}px"` : ''} aria-hidden="true"><svg class="wax" viewBox="0 0 48 48"><path d="${WAX}"/><circle cx="24" cy="24" r="17.6"/></svg>${pieceIcon(piece)}</span>`;

// ---- the move line: eight words or fewer ----
function shortLine(s) {
  const who = s.side === 'w' ? 'Your' : 'Their';
  let t;
  switch (s.kind) {
    case 'chain': t = `${who} beast bites ${s.captured.length === 2 ? 'twice' : s.captured.length + ' times'}.`; break;
    case 'shoot': t = `${who} archer shoots the ${s.captured[0]}.`; break;
    case 'push': t = `${who} ogre shoves the ${s.push.piece}.`; break;
    case 'swap': t = `${who} maester swaps with the ${s.swap.with}.`; break;
    case 'capture': t = `${who} ${s.piece} takes the ${s.captured[0]}.`; break;
    case 'promote': t = `${who} pawn becomes a ${s.promo ?? 'new piece'}.`; break;
    case 'power': t = `${who} king uses ${s.power ?? 'its power'}.`; break;
    case 'pass': t = `${who} turn ends.`; break;
    default: t = `${who} ${s.piece} ${s.piece === 'pawn' ? 'steps' : 'moves'} to ${s.to}.`;
  }
  if (s.mate) return s.side === 'w' ? 'Checkmate. You win.' : 'Checkmate. The computer wins.';
  if (s.check) t = t.replace(/\.$/, '. Check.');
  return t;
}
function storyOf(state) {
  const h = state?.history.at(-1);
  return h ? KD.describe(KD.undo(state), h.lan) : null;
}
function renderLine() {
  const s = lastStory;
  $('#line-icon').innerHTML = s ? pieceIcon(s.piece, s.side) : '';
  $('#line-text').innerHTML = !s ? 'Tap a piece to see its moves.' : resigned ? 'You laid your king down.' : prefs.letters ? `<code>${s.lan}</code>` : shortLine(s);
}
function renderTurn() {
  const s = board.state, el = $('#turn');
  if (resigned) { el.textContent = 'Game over'; el.classList.remove('is-yours'); return; }
  if (!s) return;
  const st = KD.status(s);
  const mine = st.turn === 'w';
  el.classList.toggle('is-yours', mine && !st.over);
  el.textContent = st.over ? (st.winner === 'w' ? 'You win' : st.winner ? 'Computer wins' : 'Draw')
    : mine ? (st.check ? 'Your move: check' : 'Your move')
    : board.play.human === 'both' ? 'Their move' : 'Computer thinks';
}

// ---- Board help on a board: threats, coordinates, piece icons ----
function applyIcons(b, cells, on, pop) {
  b.layer.querySelectorAll('.mx-pi').forEach(e => e.remove());
  if (!on) return;
  const motion = pop && !prefersReducedMotion();
  for (const c of cells) {
    if (!c) continue;
    const f = b.figure(c.sq);
    if (!f) continue;
    const s = document.createElement('span');
    s.className = 'mx-pi' + (motion ? ' pop' : '');
    s.innerHTML = pieceIcon(c.type, c.color);
    f.appendChild(s);
  }
}
function threatsOf(state) {
  if (!state) return [];
  const st = KD.status(state);
  return st.over || st.turn !== 'w' ? [] : KD.threats(state).pieces;
}
function applyHelp(b, { pop = false } = {}) {
  b.clearMarks('threat');
  if (prefs.threats && !resigned) b.mark(threatsOf(b.state), 'threat', { pop });
  b.o.coords = prefs.coords;
  b.placeCoords();
  applyIcons(b, b.state ? KD.board(b.state) : b.cells, prefs.icons, pop);
}

// ---- the game board ----
const board = createBoard($('#board'), {
  play: { level: 'club', human: 'w' },
  label: 'King Down board against the computer. Arrow keys move, Enter or Space chooses, Escape cancels.',
  onMove(story) {
    lastStory = story;
    board.clearMarks('hint');
    renderLine(); renderTurn(); applyHelp(board); renderBar();
    if (story.side === 'w') {
      const id = trickOf(story);
      if (id && !found.includes(id)) sealRun = awardSeal(id);
    } else hurrySeal?.();                    // their move: the seal leaves now, so it never reads as their trick
  },
});

function show(state, { human = 'both' } = {}) {
  epoch++;
  resigned = false;
  hideToast();
  $$('.seal-fly').forEach(e => e.remove());
  hideFound();
  board.play.human = human;
  board.setState(state);
  baseLen = state.history.length;
  lastStory = storyOf(state);
  renderLine(); renderTurn(); applyHelp(board); renderBar(); renderDot();
}

// ---- the bar: Hint, Undo, Menu ----
const btnLabel = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
btnLabel($('#hint'), 'hint', 'Hint');
btnLabel($('#undo'), 'undo', 'Undo');
btnLabel($('#menu'), 'menu', 'Menu');
$('#back').innerHTML = icon('back');
$('#close').innerHTML = icon('close');
$('#close').setAttribute('aria-label', 'Close');

function renderBar() {
  $('#undo').disabled = !board.state || board.state.history.length <= baseLen || resigned;
}
function renderDot() {
  const m = $('#menu');
  m.querySelector('.dot-new')?.remove();
  if (newSeal) m.insertAdjacentHTML('beforeend', '<span class="dot-new" aria-hidden="true"></span>');
  m.setAttribute('aria-label', newSeal ? 'Menu. A new seal waits in Extra.' : 'Menu');
}
/** Hides the seal and the words on the move line, with no trace of the fade. */
function hideFound() {
  const f = $('#found'), word = $('#found > span:last-child');
  f.hidden = true;
  word.getAnimations().forEach(a => a.cancel());
  word.style.opacity = '';
}

$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || resigned || board.busy || KD.status(s).over || !board.isHuman(KD.status(s).turn)) return;
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (!m || board.state !== s) return;
  board.clearMarks('hint');
  board.mark([m.from, m.to], 'hint');
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s || board.busy || s.history.length <= baseLen) return;
  let back = s;
  const plies = KD.status(s).turn === 'w' && board.play.human === 'w' ? 2 : 1;
  for (let i = 0; i < plies && back.history.length > baseLen; i++) back = KD.undo(back);
  const keep = baseLen;
  show(back, { human: board.play.human });
  baseLen = keep; renderBar();
});
$('#menu').addEventListener('click', () => openMenu('menu'));

// ---- the sheet: one container, pages replace each other ----
const TITLES = { menu: 'Menu', new: 'New game', extra: 'Extra', help: 'Board help', tricks: 'Tricks', resign: 'Resign' };
const PARENT = { menu: null, new: 'menu', extra: 'menu', help: 'extra', tricks: 'extra', resign: 'menu' };
let page = 'menu', minis = [];

const chev = `<span class="trail">${icon('chevron')}</span>`;
const lead = html => `<span class="lead-art">${html}</span>`;
const dot = '<span class="dot" aria-hidden="true"></span>';
const navrow = ({ go, act, art, name, line, trail = chev, cls = '', extra = '' }) =>
  `<li><button type="button" class="navrow ${cls}" ${go ? `data-go="${go}"` : ''} ${act ? `data-act="${act}"` : ''}>${art}<span class="txt"><b>${name}${extra}</b><small>${line}</small></span>${trail}</button></li>`;

const PAGES = {
  menu: () => `
    <ul class="nav">
      ${navrow({ go: 'new', art: lead(icon('plus')), name: 'New game', line: 'Play again, or change the setup.' })}
      ${navrow({ act: 'guide', art: lead(icon('book')), name: 'Guide', line: 'Pieces, powers and lessons.' })}
      <li><div class="feel">${lead(icon('settings'))}<div class="ctl">
        <b class="feel-name">Feel</b>
        <button type="button" class="chip" id="snd" aria-pressed="${!sfx.muted}">${icon(sfx.muted ? 'sound-off' : 'sound-on')}<span>Sound</span></button>
        <span class="motion"><span class="motion-name" id="motion-name">Motion</span><span class="seg" role="radiogroup" aria-labelledby="motion-name">
          ${['Normal', 'Fast', 'Off'].map(m => `<button type="button" role="radio" data-motion="${m}" aria-checked="${motionNow() === m}" tabindex="${motionNow() === m ? 0 : -1}">${m}</button>`).join('')}
        </span></span>
      </div></div></li>
      ${navrow({ go: 'extra', art: lead(icon('sparkle')), name: 'Extra', extra: visitNew ? dot : '', line: visitNew ? 'New: a seal in Tricks.' : 'Workshop, Today’s army and more.' })}
    </ul>
    <div class="resign-gap" aria-hidden="true"></div>
    <ul class="nav">${navrow({ go: 'resign', cls: 'danger', art: lead(icon('flag')), name: 'Resign', line: 'Lay your king down.' })}</ul>`,

  new: () => `
    <p class="lead">A new game ends this game.</p>
    <ul class="nav">
      ${navrow({ act: 'new', art: lead(icon('play')), name: 'Play again', line: 'The same kings and level. A new army.', trail: '' })}
      ${navrow({ act: 'setup', art: lead(icon('settings')), name: 'Change setup', line: 'Mode, kings, level and army.' })}
    </ul>`,

  extra: () => variant === 'cabinet' ? cabinet() : index(),

  help: () => `
    <p class="lead">Each switch shows its effect here and on your board.</p>
    <ul class="bh">
      ${helpRow('threats', 'Show threats', 'Rings your pieces that the enemy can take.')}
      ${helpRow('coords', 'Coordinates', 'Letters and numbers on the board edge.')}
      ${helpRow('icons', 'Piece icons', 'A small rulebook icon on each piece.')}
      ${helpRow('letters', 'Move letters', 'Moves as letters, for chess players.')}
    </ul>`,

  tricks: () => {
    const rows = [...found.map(id => ({ t: trick(id), on: true })), ...TRICKS.filter(t => !found.includes(t.id)).map(t => ({ t, on: false }))];
    return `
    <p class="lead">Each trick that you find in a game gets a seal.</p>
    <ul class="tricks">${rows.map(({ t, on }, i) => on ? `
      <li class="found-row"><span class="fig"><img src="${t.art}" alt="">${seal(t.seal, 'tilt' + (i === 0 && stampOnOpen ? ' stamp' : ''))}</span>
        <span><span class="kind">${i === 0 && stampOnOpen ? 'New seal' : 'Found'}</span><b>${t.name}</b><p>${t.found}</p></span></li>` : `
      <li class="riddle"><span class="fig"><img src="${t.art}" alt=""></span>
        <span><span class="kind">Riddle</span><p>${t.riddle}</p></span></li>`).join('')}
    </ul>`;
  },

  resign: () => `
    <div class="resign">
      <img class="king" src="${pieceArt('king', 'w', 'frost')}" alt="Your Frost king">
      <h3>Lay your king down?</h3>
      <p>The computer wins this game.</p>
      <div class="acts">
        <button type="button" class="btn btn-primary btn-wide" data-act="resign-yes">${icon('flag')}<span>Resign</span></button>
        <button type="button" class="btn btn-quiet btn-wide" data-go="menu" data-back>Keep playing</button>
      </div>
    </div>`,
};

function index() {
  const tricksRow = found.length ? navrow({
    go: 'tricks', art: lead(seal(trick(found[0]).seal, '', 30)), name: 'Tricks', extra: visitNew ? dot : '',
    line: visitNew ? `New seal: ${trick(found[0]).name}.` : 'A seal for each trick you find.',
  }) : '';
  return `
    <p class="group-h">Play and make</p>
    <ul class="nav">
      ${navrow({ act: 'today', art: lead(icon('clock')), name: 'Today’s army', line: 'The same army for everyone today.' })}
      ${navrow({ act: 'workshop', art: `<span class="lead-art figure"><img src="${workshopArt('fox-pathfinder', 'w')}" alt=""></span>`, name: 'Workshop', line: 'Make your own piece.' })}
      ${tricksRow}
    </ul>
    <p class="group-h">Board and game</p>
    <ul class="nav">
      ${navrow({ go: 'help', art: lead(icon('eye')), name: 'Board help', line: 'Threats, coordinates and piece icons.' })}
      ${navrow({ act: 'game', art: lead(icon('moves')), name: 'This game', line: 'Army code and the moves as text.' })}
      ${navrow({ act: 'account', art: lead(icon('users')), name: 'Account', line: 'Your game and settings on every device.' })}
    </ul>
    <p class="group-h">Coming</p>
    <ul class="nav">
      <li><div class="navrow is-static">${lead(icon('cards'))}<span class="txt"><b>Card mode</b><small>A hand of power cards.</small></span></div></li>
    </ul>`;
}

function cabinet() {
  const tile = ({ go, act, art, name, line, extra = '' }) =>
    `<button type="button" class="tile" ${go ? `data-go="${go}"` : ''} ${act ? `data-act="${act}"` : ''}><span class="art ${art.cls ?? ''}">${art.html}</span><b>${name}${extra}</b><small>${line}</small></button>`;
  const fig = src => `<img src="${src}" alt="">`;
  return `
    <p class="lead">Small doors to the rest of King Down.</p>
    <div class="cabinet">
      ${tile({ act: 'today', art: { html: fig(pieceArt('archer', 'w')) + fig(pieceArt('beast', 'w')) + fig(pieceArt('ogre', 'w')) }, name: 'Today’s army', line: 'The same army for everyone.' })}
      ${tile({ act: 'workshop', art: { html: fig(workshopArt('fox-pathfinder', 'w')) }, name: 'Workshop', line: 'Make your own piece.' })}
      ${found.length ? tile({ go: 'tricks', art: { cls: 'plain', html: seal(trick(found[0]).seal, 'tilt', 52) }, name: 'Tricks', extra: visitNew ? dot : '', line: 'A seal for each trick.' }) : ''}
      ${tile({ go: 'help', art: { cls: 'stone', html: icon('eye') }, name: 'Board help', line: 'Threats, coordinates, icons.' })}
      ${tile({ act: 'game', art: { cls: 'icons', html: ['archer', 'beast', 'ogre', 'guard'].map(p => pieceIcon(p, 'w')).join('') }, name: 'This game', line: 'Army code and moves.' })}
      ${tile({ act: 'account', art: { html: fig(pieceArt('king', 'w', 'frost')) }, name: 'Account', line: 'Your game and settings on every device.' })}
      <div class="tile is-static"><span class="art plain">${icon('cards')}</span><span class="pill">Coming</span><b>Card mode</b><small>A hand of power cards.</small></div>
    </div>`;
}

const helpRow = (key, name, line) => `
  <li><label>
    <span class="mini${key === 'letters' ? ' letters' : ''}" data-mini="${key}"></span>
    <span class="txt"><b>${name}</b><small>${line}</small></span>
    <input type="checkbox" class="toggle" data-pref="${key}" ${prefs[key] ? 'checked' : ''} aria-label="${name}">
  </label></li>`;

// ---- live mini previews: a window on a real board, cropped to three squares ----
const MINI = {
  threats: () => { const sq = threatsOf(board.state)[0] ?? 'e4'; return { state: threatsOf(board.state).length ? board.state : p1(), center: sqCenter(sq, -0.15, -0.25) }; },
  coords: () => ({ state: board.state ?? p1(), center: [1.12, 6.88], coords: true }),
  icons: () => ({ state: board.state ?? p1(), center: [2.95, 5.95] }),
};
function sqCenter(sq, ox = 0, oy = 0) { const f = sq.charCodeAt(0) - 97, r = +sq[1]; return [f + 0.5 + ox, 8 - r + 0.5 + oy]; }

function buildMini(win, key) {
  if (key === 'letters') { renderLettersMini(win); return; }
  const spec = MINI[key]();
  const W = win.clientWidth || 94, H = win.clientHeight || 94, span = 2.75;
  const t = W / span, B = t * (8 + 2 * FRAME);
  const host = document.createElement('div');
  host.className = 'mini-host';
  Object.assign(host.style, { width: `${B}px`, left: `${W / 2 - (FRAME + spec.center[0]) * t}px`, top: `${H / 2 - (0.2 + FRAME + spec.center[1]) * t}px` });
  win.appendChild(host);
  const b = createBoard(host, { interactive: false, sound: false, coords: key === 'coords' && prefs.coords });
  b.setBoard(KD.board(spec.state));
  b.miniKey = key; b.miniState = spec.state;
  minis.push(b);
  paintMini(b, false);
}
function paintMini(b, pop) {
  const key = b.miniKey;
  if (key === 'threats') { b.clearMarks('threat'); if (prefs.threats) b.mark(threatsOf(b.miniState), 'threat', { pop }); }
  if (key === 'coords') { b.o.coords = prefs.coords; b.placeCoords(); }
  if (key === 'icons') applyIcons(b, b.cells, prefs.icons, pop);
}
function renderLettersMini(win) {
  const s = lastStory ?? storyOf(p1());
  win.innerHTML = `<span class="say">${pieceIcon(s.piece, s.side)}${prefs.letters ? `<code>${s.lan}</code>` : `<span>${shortLine(s)}</span>`}</span>`;
}

// ---- navigation inside the sheet ----
function go(name, { dir = 'fwd', instant = false, from = null } = {}) {
  minis.forEach(m => m.destroy());
  minis = [];
  page = name;
  if (name === 'tricks') visitNew = false;
  $('#sheet-title').textContent = TITLES[name];
  const parent = PARENT[name];
  $('#back').hidden = !parent;
  $('#back').setAttribute('aria-label', parent ? `Back to ${TITLES[parent]}` : 'Back');
  const body = $('#page');
  body.innerHTML = `<div class="page">${PAGES[name]()}</div>`;
  const pg = body.firstElementChild;
  if (!instant && !prefersReducedMotion()) pg.classList.add(dir === 'back' ? 'enter-back' : 'enter-fwd');
  $('#sheet').scrollTop = 0;
  if (name === 'help') $$('[data-mini]', pg).forEach(w => buildMini(w, w.dataset.mini));
  if (name === 'tricks' && stampOnOpen) {
    const s = pg.querySelector('.seal.stamp');
    if (s) { sfx.power(); haptic([6, 30, 6]); }
    stampOnOpen = false;
  }
  if (!instant) {
    const back = from && pg.querySelector(`[data-go="${from}"]`);
    (back ?? $('#sheet-title')).focus({ preventScroll: true });
  }
}
function goBack() { const parent = PARENT[page]; if (parent) go(parent, { dir: 'back', from: page }); }

function openMenu(name = 'menu') {
  // The Menu takes the gold dot from the button. Inside, the dot and one line lead to Tricks for this visit only.
  if (newSeal) { newSeal = false; visitNew = true; renderDot(); }
  go(name, { instant: true });
  fitPanel();
  if (!$('#sheet').open) openSheet('sheet');
  const first = $('#page .navrow, #page .tile, #page button');
  first?.focus({ preventScroll: true });
}

$('#back').addEventListener('click', goBack);
// A closed sheet forgets the tease: the next visit shows the plain lines.
$('#sheet').addEventListener('close', () => { if (!$('#sheet').open) visitNew = false; });

// Desktop: the panel ends above the move line, so it covers no part of a nameplate.
const wide = matchMedia('(min-width: 900px)');
function fitPanel() {
  const sheet = $('#sheet');
  if (!wide.matches) { sheet.style.removeProperty('max-height'); return; }
  const top = parseFloat(getComputedStyle(sheet).top) || 20;
  sheet.style.maxHeight = `${Math.max(320, $('#line').getBoundingClientRect().top - top - 12)}px`;
}
addEventListener('resize', fitPanel);
// Escape goes back one page; on the first page it closes the sheet (the kit's own handler).
$('#sheet').addEventListener('cancel', e => {
  if (PARENT[page]) { e.preventDefault(); e.stopImmediatePropagation(); goBack(); }
}, true);

const NOT_HERE = 'This demo does not show this page.';
$('#page').addEventListener('click', async e => {
  const el = e.target.closest('[data-go], [data-act], [data-motion], #snd');
  if (!el) return;
  if (el.id === 'snd') {
    sfx.toggle();
    el.setAttribute('aria-pressed', String(!sfx.muted));
    el.innerHTML = `${icon(sfx.muted ? 'sound-off' : 'sound-on')}<span>Sound</span>`;
    if (!sfx.muted) sfx.tap();
    return;
  }
  if (el.dataset.motion) { setMotion(el.dataset.motion); $$('#page [data-motion]').forEach(b => { b.setAttribute('aria-checked', String(b === el)); b.tabIndex = b === el ? 0 : -1; }); return; }
  if (el.dataset.go) { el.hasAttribute('data-back') ? go(el.dataset.go, { dir: 'back', from: page }) : go(el.dataset.go); return; }
  switch (el.dataset.act) {
    case 'new': await closeSheet('sheet'); show(KD.newGame({ army: 'random', powers: POWERS }), { human: 'w' }); toast('New game: a new army.'); break;
    case 'resign-yes': await closeSheet('sheet'); resignGame(); break;
    default: toast(NOT_HERE);
  }
});
// Motion radios: the arrow keys move the choice, as in a radio group.
$('#page').addEventListener('keydown', e => {
  const r = e.target.closest('[data-motion]');
  if (!r || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const all = $$('#page [data-motion]'), i = all.indexOf(r), n = all[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? all.length - 1 : 1)) % all.length];
  n.focus(); n.click();
});
$('#page').addEventListener('change', e => {
  const k = e.target.dataset?.pref;
  if (!k) return;
  prefs[k] = e.target.checked;
  sfx.tap();
  const win = $(`#page [data-mini="${k}"]`);
  if (k === 'letters') { renderLettersMini(win); renderLine(); }
  else minis.filter(m => m.miniKey === k).forEach(m => paintMini(m, true));
  if (win && !prefersReducedMotion()) { win.classList.remove('is-changing'); void win.offsetWidth; win.classList.add('is-changing'); }
  applyHelp(board, { pop: true });
});

// ---- Feel: motion ----
// Off asks for less motion. Normal and Fast take back only what Off set: the system setting and the
// showcase frame's Reduced motion switch still apply.
let motionOff = false;
function motionNow() { return prefersReducedMotion() ? 'Off' : board.o.speed > 1 ? 'Fast' : 'Normal'; }
function setMotion(m) {
  const root = document.documentElement;
  if (m === 'Off') { if (root.dataset.motion !== 'reduce') { root.dataset.motion = 'reduce'; motionOff = true; } }
  else if (motionOff) { delete root.dataset.motion; motionOff = false; }
  board.o.speed = m === 'Fast' ? 2 : 1;
}

// ---- Resign: the player lays the king down ----
function resignGame() {
  const s = board.state;
  if (!s) return;
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === 'w');
  board.setBoard(KD.board(s));
  resigned = true;
  if (king) requestAnimationFrame(() => board.figure(king.sq)?.classList.add('is-fallen'));
  renderLine(); renderTurn(); renderBar();
}

// ---- the seal: the one strong moment ----
async function awardSeal(id, { fly = true } = {}) {
  const my = epoch;
  found = [id, ...found.filter(x => x !== id)];
  stampOnOpen = true;
  const t = trick(id);
  $('#seal-slot').innerHTML = seal(t.seal, 'tilt');
  hideFound();
  $('#found').hidden = false;
  $('#announce').textContent = `Trick found: ${t.name}.`;
  const s = $('#seal-slot .seal'), word = $('#found > span:last-child');
  sfx.power(); haptic([8, 40, 8]);
  animate(word, [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  await animate(s, [
    { transform: 'scale(1.8) rotate(-24deg)', opacity: 0 },
    { transform: 'scale(.92) rotate(-6deg)', opacity: 1, offset: 0.72 },
    { transform: 'scale(1) rotate(-8deg)', opacity: 1 },
  ], { duration: 280, easing: 'cubic-bezier(.5,0,.75,0)' });
  if (!fly || my !== epoch) return;
  // The seal rests 1.2 s, or less when their move comes first.
  await Promise.race([wait(1200), new Promise(r => { hurrySeal = r; })]);
  hurrySeal = null;
  if (my !== epoch) return;
  await flyToMenu(s, t);
  if (my !== epoch) return;
  hideFound();
  newSeal = true;
  renderDot();
}
async function flyToMenu(s, t) {
  const a = s.getBoundingClientRect(), b = $('#menu').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'seal-fly';
  el.innerHTML = seal(t.seal);
  Object.assign(el.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  el.firstElementChild.style.setProperty('--s', `${a.width}px`);
  document.body.appendChild(el);
  s.style.visibility = 'hidden';
  // The words fade and stay at 0 until hideFound() hides the whole line part after the flight.
  animate($('#found > span:last-child'), [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + 16 - (a.top + a.height / 2);
  await animate(el, [
    { transform: 'translate(0, 0) scale(1) rotate(-8deg)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 36}px) scale(.75) rotate(6deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(0deg)`, opacity: 0.1 },
  ], { duration: 460, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
  el.remove();
}

// ---- the demo contract ----
async function fresh({ v = 'index', f = [], dotOn = false, p = DEFAULT_PREFS } = {}) {
  run++;
  if ($('#sheet').open) await closeSheet('sheet');
  variant = v; found = [...f]; newSeal = dotOn; visitNew = false; stampOnOpen = false; prefs = { ...p };
  board.o.speed = 1;
}
const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const press = async el => { el.classList.add('is-pressed'); sfx.tap(); await wait(150); el.classList.remove('is-pressed'); };

window.demo = {
  async state(name) {
    switch (name) {
      case 'menu': await fresh(); show(p1()); openMenu('menu'); break;
      case 'extra-index': await fresh(); show(p1()); openMenu('extra'); break;
      case 'extra-cabinet': await fresh({ v: 'cabinet' }); show(p1()); openMenu('extra'); break;
      case 'tricks': await fresh({ f: ['chain', 'shot-over'] }); show(afterChain()); stampOnOpen = true; openMenu('tricks'); break;
      case 'board-help': await fresh({ p: { ...DEFAULT_PREFS, threats: true, icons: true } }); show(p1()); openMenu('help'); break;
      case 'seal': await fresh(); show(afterChain()); await awardSeal('chain', { fly: false }); break;
      case 'dot': await fresh({ f: ['chain', 'shot-over'], dotOn: true }); show(afterChain()); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    await settle();
    document.activeElement?.blur?.();
  },

  // The best moment: a first Beast chain stamps a seal on the move line; it flies into Menu;
  // the gold dot leads to Extra, then Tricks, where the seal lands. Then one Board help switch.
  async play() {
    await fresh();
    const me = run;
    const alive = () => me === run;
    show(p1());
    await wait(800);
    if (!alive()) return;
    board.selectSquare('e4');
    await wait(1000);
    if (!alive()) return;
    await board.playMove(CHAIN);
    await sealRun;
    if (!alive()) return;
    await wait(500);
    if (!alive()) return;
    await board.playMove(REPLY);                // the computer's quiet answer; the dot waits
    await wait(1100);
    if (!alive()) return;
    // A scripted tap moves no keyboard focus: no focus ring in the film.
    const tap = async (el, fn) => { await press(el); fn(); document.activeElement?.blur?.(); };
    await tap($('#menu'), () => openMenu('menu'));
    await wait(1500);
    if (!alive()) return;
    await tap($('#page [data-go="extra"]'), () => go('extra'));
    await wait(1500);
    if (!alive()) return;
    await tap($('#page [data-go="tricks"]'), () => go('tricks'));
    await wait(2800);
    if (!alive()) return;
    await tap($('#back'), () => go('extra', { dir: 'back', from: 'tricks' }));
    await wait(900);
    if (!alive()) return;
    await tap($('#page [data-go="help"]'), () => go('help'));
    await wait(1200);
    if (!alive()) return;
    const sw = $('#page [data-pref="threats"]');
    sw.click();
    await wait(2000);
    if (!alive()) return;
    await closeSheet('sheet');
    await wait(1600);                           // the real board now rings the Beast that the bishop can take
  },

  async reset() {
    await fresh();
    show(p1(), { human: 'w' });
  },
};

show(p1(), { human: 'w' });
