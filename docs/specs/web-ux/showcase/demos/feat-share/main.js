// feat-share: a share that tells the shape of the game, not the moves.
// The game is real: today's army for 8 Oct 2026 (seed 20261008, the app's daily seed), Kings' powers,
// you play Black (Flame, Strike) against the Strong computer (White, Frost, Freeze). The kit's engine
// replays every move; the marks, the counts, the poster and the shared move all come from it.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, emblemArt } from '../../kit/icons.js';
import { $, $$, openSheet, wait, prefersReducedMotion, sfx, haptic } from '../../kit/ui.js';
import { drawPoster, drawMoment, fontsReady } from './poster.js';

// ---- the game ----
const DATE = { seed: 20261008, short: '8 Oct', long: '8 October 2026', file: '2026-10-08' };
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const ME = 'b', THEM = 'w';
const LEVEL = 'Strong';
const SITE = 'kingdown.dev';
// Black's moves were chosen by the kit's computer player as a stand-in for the person; White's by the Strong level.
const LANS = ['a2-a4', 'c7-c6', 'Og1>g2-g3', 'a7-a6', 'b2-b3', 'f7-f6', 'f2-f4', 'Gd8-c7', 'Sf1-f2', 'd7-d5', 'Sf2-e3', 'c6-c5', '!F:d5', 'Se3-e4', 'Be8-d7', 'Se4xd5xc5', 'b7-b6', 'Sc5-d4', 'e7-e6', 'c2-c3', 'Nh8-f7', 'Nh1-f2', 'Bb8-a7', 'Gd1-c2', 'b6-b5', 'Sd4-d3', 'b5xa4', 'b3xa4', 'Sf8-e7', 'Kc1-d1', 'Ra8-b8', 'Bb1-a2', 'Bd7-c6', 'Og2-f3', 'Ba7xf2', 'Be1xf2', 'Bc6xa4', 'Ba2xe6', 'Se7xe6', 'Bf2-a7', 'Rb8-b7', 'Of3-e4', 'Se6-b3!', 'Sd3-c4', 'Sb3xc4xc3xd2xe2', 'Kd1xe2', 'Ba4-b5', 'Ke2-e3', 'Rb7xa7', 'Ra1-d1', 'Ra7-b7', 'Gc2-b3', 'Bb5-d7', 'Oe4>f4-g4', 'Rb7-b5', 'h2-h3', 'Og8>f7-e6', 'Ke3-f3', 'Bd7-c6', 'Kf3-f2', 'Ne6xf4', 'g3xf4', 'Rb5-b4', 'Kf2-g3', 'Rb4-e4', 'f4-f5', 'Re4-e3', 'Kg3-h2', 'Re3-e2', 'Kh2-g3', 'Re2-g2', 'Kg3-f4', 'g7-g5', 'Kf4-e3', 'Rg2-g3', 'Ke3-d4', 'Rg3xh3', 'Rd1-a1', 'Bc6-b7', 'Ra1-g1', 'Bb7-f3', 'Gb3-a4', 'Rh3-h4', 'Kd4-c5', 'Bf3xg4', 'Rg1-f1', 'Kc8-b7', 'Rf1-b1', 'Gc7-b6', 'Rb1-f1', 'Bg4-h3', 'Rf1-f3', 'Of7-g7', 'Rf3-g3', 'Bh3xf5', 'Rg3-f3', 'Bf5-e6', 'Kc5-d6', 'Og7-f7', 'Rf3xf6', 'Of7xf6', 'Ga4-b4', 'Rh4-d4', 'Kd6-c5', 'Rd4-c4', 'Kc5-d6', 'Rc4-c6'];

const states = [KD.newGame({ army: 'random', seed: DATE.seed, powers: POWERS })];
const stories = [];
for (const lan of LANS) { const st = KD.describe(states.at(-1), lan); stories.push(st); states.push(st.next); }
const FINAL = states.at(-1), LAST = LANS.length - 1;
const END = KD.status(FINAL);
const MATE_MOVE = KD.status(states[LAST]).moveNumber;
const fallenSq = KD.board(FINAL).find(c => c && c.type === 'king' && c.color === THEM).sq;
if (END.reason !== 'checkmate' || END.winner !== ME) throw new Error('feat-share: the scripted game must end in your checkmate');

// ---- one mark for each verb: the same mark on the result card and in the copied line ----
// A piece's verb uses the piece's rulebook icon (the Beast's paw, the Ogre's face); a power uses a kit icon in the same disc.
const N = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
const MARK = {
  bite: { emoji: '🐾', one: 'bite', many: 'bites', piece: 'beast' },
  shot: { emoji: '🏹', one: 'shot', many: 'shots', piece: 'archer' },
  shove: { emoji: '👹', one: 'shove', many: 'shoves', piece: 'ogre' },
  swap: { emoji: '🔄', one: 'swap', many: 'swaps', piece: 'maester' },
  trade: { emoji: '⚖️', one: 'trade', many: 'trades', piece: 'paladin' },
  freeze: { emoji: '❄️', one: 'Freeze', many: 'Freezes', king: 'frost' },
  ward: { emoji: '🧊', one: 'Ice Wall', many: 'Ice Walls', king: 'frost', icon: 'shield' },
  strike: { emoji: '⚡', one: 'Strike', many: 'Strikes', king: 'flame', icon: 'bolt' },
  haste: { emoji: '💨', one: 'Haste', many: 'Hastes', king: 'flame' },
  flight: { emoji: '🕊️', one: 'Flight', many: 'Flights', king: 'stratus' },
  sacrifice: { emoji: '♻️', one: 'Sacrifice', many: 'Sacrifices', king: 'stratus' },
};
function verbOf(st) {
  if (st.kind === 'chain' || (st.piece === 'beast' && st.capturedOn.length)) return 'bite';
  if (st.kind === 'shoot') return 'shot';
  if (st.push) return 'shove';
  if (st.kind === 'swap') return 'swap';
  if (st.leaves) return 'trade';
  if (st.powerTag && MARK[st.powerTag]) return st.powerTag;
  return null;
}
// Your special moves, in the order you played them.
const EVENTS = stories.map((st, ply) => ({ st, ply, verb: st.side === ME ? verbOf(st) : null }))
  .filter(e => e.verb).map(e => ({ ...e, n: e.verb === 'bite' ? e.st.capturedOn.length : 1, move: KD.status(states[e.ply]).moveNumber }));

const marksText = () => EVENTS.map(e => MARK[e.verb].emoji.repeat(e.n)).join(' ');
// The counts keep the hook: the longest chain, '5 bites (4 in one turn)'. A no-break space keeps
// each count on one line in a narrow chat bubble.
function countsText() {
  const sum = new Map();
  for (const e of EVENTS) sum.set(e.verb, (sum.get(e.verb) ?? 0) + e.n);
  const chain = Math.max(0, ...EVENTS.filter(e => e.verb === 'bite').map(e => e.n));
  const hook = (v, n) => (v !== 'bite' || chain < 2 ? '' : chain === n ? ' in one turn' : ` (${chain} in one turn)`);
  return [...sum].map(([v, n]) => `${n}\u00a0${n === 1 ? MARK[v].one : MARK[v].many}${hook(v, n)}`.replace(/ /g, '\u00a0')).join(', ');
}
const lineText = plain => `King Down · Daily ${DATE.short}\nBeat the ${LEVEL} computer in ${MATE_MOVE}\n${plain ? countsText() : marksText()}\n${SITE}/daily`;

// ---- the moments you can share: each special move, the longest chain first ----
const cap = s => s[0].toUpperCase() + s.slice(1);
function momentOf(e) {
  const { st } = e, before = KD.board(states[e.ply]);
  const at = sq => before.find(c => c && c.sq === sq);
  const piece = cap(st.piece);
  let quote, big, trail = [st.from, st.to], numbered = false, friend;
  if (e.verb === 'bite' && e.n > 1) {
    quote = `My Beast bit ${N[e.n]} times in one turn.`;
    big = `${e.n} bites`;
    trail = [st.from, ...st.capturedOn]; numbered = true;
    friend = { line: `Black's Beast bites ${N[e.n]} times.` };
  } else if (e.verb === 'bite') {
    quote = `My Beast bit the ${st.captured[0]}.`;
    big = 'One bite';
    friend = { line: `Black's Beast bites the ${st.captured[0]}.` };
  } else if (e.verb === 'shove') {
    const pushed = at(st.push.from)?.type ?? 'piece';
    quote = `My Ogre shoved a ${pushed} out of its way.`;
    big = 'Shove';
    trail = [st.push.from, st.push.to];
    friend = { line: `Black's Ogre shoves a ${pushed}.` };
  } else if (e.verb === 'strike') {
    quote = `Strike: my ${piece} moved like a queen.`;
    big = 'Strike';
    friend = { line: `Black's ${piece} moves like a queen.` };
  } else {
    quote = cap(st.moment ?? st.text); big = cap(MARK[e.verb].one);
    friend = { line: cap(st.text) };
  }
  // The rule cards use the fact sheet's short lines (research/king-down-facts.md).
  const CARD = {
    bite: { art: pieceArt('beast', ME), name: 'The Beast', text: 'After each bite, it can bite again.' },
    shove: { art: pieceArt('ogre', ME), name: 'The Ogre', text: 'It shoves a neighbour and steps into its place.' },
    strike: { art: emblemArt('flame'), name: 'Strike', text: 'Once a game, one piece (not a pawn or the king) moves like a queen to an empty square.' },
  };
  return { ...e, quote, big, trail, numbered, friend, card: CARD[e.verb] ?? null, figure: at(st.from) };
}
const MOMENTS = EVENTS.map(momentOf).sort((a, b) => b.n - a.n || a.ply - b.ply);
let momentAt = 0;
function momentLink(m) {
  const u = new URL(`https://${SITE}/`);
  u.searchParams.set('kings', POWERS.map(p => p.toLowerCase()).join(','));
  u.searchParams.set('army', states[0].backRank);
  u.searchParams.set('moves', LANS.slice(0, m.ply + 1).join('_'));
  u.searchParams.set('view', 'move'); // new: open as a view (not an invite) and play the last move once
  return u.href;
}

// ---- the result screen ----
const board = createBoard($('#board'), { orientation: ME, interactive: false, label: 'The final position' });
$('#tag-top').textContent = `Today's army · ${DATE.short}`;
$('#result-line').textContent = `Checkmate on move ${MATE_MOVE}.`;
$('#daily-tag').innerHTML = `<span class="pill">Kings' powers</span><span class="pill">${LEVEL}</span>`;
$('#open-share').innerHTML = `${icon('share')}<span>Share today's result</span>`;
{
  const design = c => POWERS[c === 'w' ? 0 : 1].split(':')[0].toLowerCase();
  $('#kings').innerHTML = `<img class="k-me" src="${pieceArt('king', ME, design(ME))}" alt=""><img class="k-them" src="${pieceArt('king', THEM, design(THEM))}" alt="">`;
}
function markIcon(verb) {
  const m = MARK[verb];
  if (m.piece) return pieceIcon(m.piece, ME);
  if (m.icon) return `<span class="pi-b mk-disc">${icon(m.icon)}</span>`;
  return `<img class="em" src="${emblemArt(m.king)}" alt="">`;
}
// The row is a picture of the caption under it: screen readers get the caption only.
$('#marks').innerHTML = EVENTS.map((e, i) => `${i ? '<li class="gap"></li>' : ''}${Array.from({ length: e.n }, () => `<li>${markIcon(e.verb)}</li>`).join('')}`).join('');
$('#marks-cap').textContent = cap(countsText()) + '.';

function showFinal() {
  board.setState(FINAL);
  board.figure(fallenSq)?.classList.add('is-fallen');
}

// ---- the share sheet ----
const sheet = $('#share');
$('#share-close').innerHTML = icon('close');
$('#prev-moment').innerHTML = icon('back');
$('#next-moment').innerHTML = icon('chevron');
$('#see-move').innerHTML = `${icon('eye')}<span>See what your friend sees</span>`;
$('#friend-back').innerHTML = icon('back');
$('#friend-replay').innerHTML = `${icon('undo')}<span>Replay</span>`;

// On a phone, the system share sheet is one step shorter than copy and paste. A desktop copies and saves.
// The share icon (an arrow out of a box) shows only where the button opens the share sheet.
const glyph = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const COPY = glyph('M9 8h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM16 8V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3');
const SAVE = glyph('M12 3v12M7 10l5 5 5-5M5 20h14');
const PNG = `king-down-daily-${DATE.file}.png`;
const canShare = typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;
let canSharePng = false;
try { canSharePng = canShare && !!navigator.canShare?.({ files: [new File([''], PNG, { type: 'image/png' })] }); } catch { /* no file share */ }
const GO = {
  line: canShare ? { btn: '#copy-line', note: '#note-line', idle: [icon('share'), 'Share'], done: 'Shared', ok: '' }
    : { btn: '#copy-line', note: '#note-line', idle: [COPY, 'Copy'], done: 'Copied', ok: 'Paste it in any chat.' },
  picture: canSharePng ? { btn: '#save-picture', note: '#note-picture', idle: [icon('share'), 'Share picture'], done: 'Shared', ok: '' }
    : { btn: '#save-picture', note: '#note-picture', idle: [SAVE, 'Save picture'], done: 'Saved', ok: PNG },
  move: canShare ? { btn: '#copy-move', note: '#note-move', idle: [icon('share'), 'Share link'], done: 'Shared', ok: 'The link opens this move on the board.' }
    : { btn: '#copy-move', note: '#note-move', idle: [COPY, 'Copy link'], done: 'Link copied', ok: 'The link opens this move on the board.' },
};
function goIdle(key) {
  const g = GO[key], b = $(g.btn);
  b.classList.remove('is-done');
  b.innerHTML = `${g.idle[0]}<span>${g.idle[1]}</span>`;
  $(g.note).textContent = key === 'move' ? GO.move.ok : '';
  const manual = key === 'line' ? '#manual-line' : key === 'move' ? '#manual-move' : null;
  if (manual) $(manual).hidden = true;
}
function goDone(key, done = GO[key].done, ok = GO[key].ok) {
  const g = GO[key], b = $(g.btn);
  b.classList.add('is-done');
  b.innerHTML = `<svg class="icon done-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>${done}</span>`;
  $(g.note).textContent = ok;
}
function goFailed(key, text) {
  // The copy did not work (no permission, an old browser): give the text to copy by hand.
  const manual = $(key === 'line' ? '#manual-line' : '#manual-move');
  manual.value = text; manual.hidden = false;
  manual.focus(); manual.select();
  $(GO[key].note).textContent = 'Copy did not work. The text is selected: copy it.';
}
async function copyReal(key, text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    goDone(key); sfx.tap?.(); haptic(10);
  } catch { goFailed(key, text); }
}
// 'Shared' shows only when the share sheet reports that the share went. A cancel changes nothing.
async function shareOrCopy(key, data, text) {
  if (!canShare) return copyReal(key, text);
  try { await navigator.share(data); goDone(key); haptic(10); } catch (err) { if (err?.name !== 'AbortError') goFailed(key, text); }
}
function download(blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = PNG;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function renderLine() {
  const plain = $('#plain').checked;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const [head, result, marks, link] = lineText(plain).split('\n');
  // A screen reader reads the counts, not the emoji names.
  const marksHtml = plain ? esc(marks) : `<span role="img" aria-label="${esc(countsText())}">${marks.split(' ').map(g => `<span class="mk">${g}</span>`).join(' ')}</span>`;
  $('#bubble').innerHTML = [esc(head), esc(result), marksHtml, `<span class="link">${esc(link)}</span>`].join('\n');
  goIdle('line');
}

const posterData = () => ({
  cells: KD.board(FINAL), flipped: ME === 'b', fallen: fallenSq, trail: [stories[LAST].from, stories[LAST].to],
  dateLine: `Daily · ${DATE.long}`, result: `Won in ${MATE_MOVE}`, sub: `Checkmate · ${LEVEL} computer`, link: `${SITE}/daily`,
  mine: POWERS[ME === 'w' ? 0 : 1].split(':')[0].toLowerCase(), theirs: POWERS[ME === 'w' ? 1 : 0].split(':')[0].toLowerCase(),
});
let posterDrawn = null;
async function renderPoster({ fresh = false } = {}) {
  const c = $('#poster');
  if (!posterDrawn) posterDrawn = drawPoster(c, posterData());
  await posterDrawn;
  c.setAttribute('aria-label', `A picture of the final board. The white king lies down. Won in ${MATE_MOVE}, daily ${DATE.long}.`);
  if (fresh) { c.classList.remove('is-in'); void c.offsetWidth; c.classList.add('is-in'); }
}

async function renderMoment() {
  const m = MOMENTS[momentAt];
  $('#mc-quote').textContent = m.quote;
  $('#mc-sub').textContent = `Move ${m.move} · Daily ${DATE.short} · ${SITE}`;
  $('#moment-count').textContent = `Move ${m.move} · ${momentAt + 1} of ${MOMENTS.length}`;
  $('#prev-moment').disabled = momentAt === 0;
  $('#next-moment').disabled = momentAt === MOMENTS.length - 1;
  goIdle('move');
  const c = $('#moment-pic');
  c.setAttribute('aria-label', `The board at move ${m.move}. ${m.quote}`);
  await drawMoment(c, { cells: KD.board(states[m.ply]), flipped: ME === 'b', trail: m.trail, numbered: m.numbered, figure: m.figure, big: m.big });
}

// tabs (ARIA tabs: arrow keys, Home and End move between them)
const TABS = ['line', 'picture', 'move'];
let tab = 'line';
async function selectTab(name, { focus = false, fresh = false } = {}) {
  tab = name;
  if (document.activeElement?.getAttribute('role') === 'tab') focus = true; // roving focus: never leave a ring on an old tab
  for (const t of TABS) {
    const b = $(`#tab-${t}`), p = $(`#panel-${t}`), on = t === name;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
    p.hidden = !on;
    p.classList.toggle('is-in', on && fresh);
  }
  if (name === 'picture') await renderPoster({ fresh });
  if (name === 'move') await renderMoment();
}
$('.seg').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) selectTab(b.id.slice(4), { fresh: true }); });
$('.seg').addEventListener('keydown', e => {
  const i = TABS.indexOf(tab);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
  if (to == null) return;
  e.preventDefault();
  selectTab(TABS[(to + TABS.length) % TABS.length], { focus: true, fresh: true });
});

async function openShare(name = 'line') {
  for (const t of TABS) $(`#tab-${t}`).toggleAttribute('autofocus', t === name);
  await selectTab(name);
  $('#app').classList.add('is-sharing');
  openSheet(sheet);
}
sheet.addEventListener('close', () => $('#app').classList.remove('is-sharing'));
function closeNow() { if (sheet.open) { sheet.classList.remove('is-closing'); sheet.close(); } $('#app').classList.remove('is-sharing'); }

$('#open-share').addEventListener('click', () => { renderLine(); openShare('line'); });
$('#plain').addEventListener('change', renderLine);
$('#copy-line').addEventListener('click', () => { const text = lineText($('#plain').checked); shareOrCopy('line', { text }, text); });
$('#copy-move').addEventListener('click', () => {
  const m = MOMENTS[momentAt], url = momentLink(m);
  shareOrCopy('move', { text: m.quote, url }, `${m.quote} ${url}`);
});
$('#prev-moment').addEventListener('click', () => { momentAt = Math.max(0, momentAt - 1); renderMoment(); });
$('#next-moment').addEventListener('click', () => { momentAt = Math.min(MOMENTS.length - 1, momentAt + 1); renderMoment(); });
$('#save-picture').addEventListener('click', async () => {
  await renderPoster();
  const blob = await new Promise(ok => $('#poster').toBlob(ok, 'image/png'));
  if (!blob) { $('#note-picture').textContent = 'The picture did not save. Try again.'; return; }
  if (canSharePng) {
    try { await navigator.share({ files: [new File([blob], PNG, { type: 'image/png' })] }); goDone('picture'); haptic(10); }
    catch (err) { if (err?.name !== 'AbortError') { download(blob); goDone('picture', 'Saved', PNG); } }
    return;
  }
  download(blob); goDone('picture');
});
$('#see-move').addEventListener('click', async () => { closeNow(); await showFriend(MOMENTS[momentAt], { preview: true, playIt: true }); });
for (const id of ['#rematch', '#review', '#new-game', '#friend-play']) $(id).addEventListener('click', () => { /* not part of this demo */ });

// ---- the friend's screen ----
const friendBoard = createBoard($('#friend-board'), { orientation: ME, interactive: false });
let friendMoment = MOMENTS[0];
function trailSvg(m) {
  // A faint ink line through the move's squares, under the figures: the cause stays in view.
  const flipped = ME === 'b';
  const pt = sq => { const f = sq.charCodeAt(0) - 97, r = sq.charCodeAt(1) - 49; const col = flipped ? 7 - f : f, row = flipped ? r : 7 - r; return [(col + 0.5) * 100, (row + 0.72) * 100]; };
  const pts = m.trail.map(pt).map(p => p.join(' ')).join(' L ');
  const dots = m.numbered ? m.trail.slice(1).map((sq, i) => { const [x, y] = pt(sq); return `<g transform="translate(${x + 32} ${y - 54})"><circle r="15" fill="#842c21" stroke="#fbf7ee" stroke-width="3"/><text y="6" text-anchor="middle" font-size="18" font-weight="700" fill="#fbf7ee" font-family="Alegreya Sans, sans-serif">${i + 1}</text></g>`; }).join('') : '';
  return `<svg class="share-trail" viewBox="0 0 800 800" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;overflow:visible">
    <path d="M ${pts}" fill="none" stroke="rgba(24,14,6,.5)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${pts}" fill="none" stroke="rgba(255,214,128,.95)" stroke-width="5" stroke-dasharray="12 9" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pt(m.trail[0])[0]}" cy="${pt(m.trail[0])[1]}" r="8" fill="rgba(255,214,128,.95)" stroke="rgba(24,14,6,.7)" stroke-width="3"/></svg>
    <svg class="share-trail" viewBox="0 0 800 800" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;z-index:100;pointer-events:none;overflow:visible">${dots}</svg>`;
}
function clearTrail() { $$('#friend-board .share-trail').forEach(el => el.remove()); }
function friendLine(m, shown) {
  const el = $('#friend-line'), card = $('#friend-card'), c = m.card;
  // Before the move plays, the words keep their place but stay hidden: the buttons under them never jump.
  // The text goes in after it shows, so the live region reads it.
  el.style.visibility = card.style.visibility = shown ? '' : 'hidden';
  el.innerHTML = `${pieceIcon(m.st.piece, ME)}<div><p>${m.friend.line}</p><small>Move ${m.move} · Daily ${DATE.short}</small></div>`;
  card.innerHTML = c ? `<img src="${c.art}" alt=""><h3>${c.name}</h3><p>${c.text}</p><p class="about">King Down is chess with six new pieces and kings with powers.</p>` : '';
  if (shown) { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); }
}
let friendRun = 0;
async function showFriend(m, { preview = false, playIt = false } = {}) {
  const me = ++friendRun;
  friendMoment = m;
  $('#friend').hidden = false;
  $('#app').inert = true;
  $('#friend-back').hidden = !preview;
  if (preview) $('#friend-back').focus({ preventScroll: true });
  $('#friend-tag').textContent = `Daily · ${DATE.short}`;
  $('#friend-note').innerHTML = preview ? `${icon('eye')}<span>Your friend sees this when the link opens.</span>` : `${icon('users')}<span>A friend sent you a move from Daily ${DATE.short}.</span>`;
  clearTrail();
  if (!playIt) {
    friendBoard.setState(states[m.ply + 1]);
    friendBoard.layer.insertAdjacentHTML('beforeend', trailSvg(m));
    friendLine(m, true);
    return;
  }
  friendBoard.setState(states[m.ply]);
  friendLine(m, false);
  friendBoard.mark(m.st.from, 'hint');
  await wait(700, { instant: true });
  if (me !== friendRun) return;
  friendBoard.clearMarks('hint');
  await friendBoard.playMove(m.st.lan);
  if (me !== friendRun) return;
  friendBoard.layer.insertAdjacentHTML('beforeend', trailSvg(m));
  friendLine(m, true);
}
function hideFriend() { friendRun++; $('#friend').hidden = true; $('#app').inert = false; }
$('#friend-replay').addEventListener('click', () => showFriend(friendMoment, { preview: !$('#friend-back').hidden, playIt: true }));
$('#friend-back').addEventListener('click', async () => { hideFriend(); await openShare('move'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#friend').hidden && !$('#friend-back').hidden) $('#friend-back').click(); });

// ---- first view ----
renderLine();
showFinal();
fontsReady();

// ---- the demo contract: state(name), play(), reset() ----
let run = 0;
const calm = () => document.activeElement?.blur?.(); // a scripted story: no keyboard ring on the controls it taps
async function base({ sheetOpen = false } = {}) {
  hideFriend();
  if (!sheetOpen) closeNow();
  $('#result').style.visibility = '';
  $('#plain').checked = false;
  momentAt = 0;
  showFinal();
  renderLine();
  goIdle('picture'); goIdle('move');
}
window.demo = {
  async state(name) {
    run++;
    switch (name) {
      case 'result': await base(); break;
      case 'line': await base({ sheetOpen: true }); await openShare('line'); break;
      case 'copied': await base({ sheetOpen: true }); await openShare('line'); goDone('line'); break;
      case 'plain': await base({ sheetOpen: true }); $('#plain').checked = true; renderLine(); await openShare('line'); break;
      case 'poster': await base({ sheetOpen: true }); await openShare('picture'); break;
      case 'saved': await base({ sheetOpen: true }); await openShare('picture'); goDone('picture'); break;
      case 'moment': await base({ sheetOpen: true }); await openShare('move'); break;
      case 'received': await base(); await showFriend(MOMENTS[0], { playIt: false }); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    document.activeElement?.blur?.(); // a still render: no keyboard ring on the first control
  },
  // The mate lands and the king falls; Share; the line; Copied; the picture; a move; what the friend sees.
  async play() {
    const me = ++run;
    const alive = () => me === run;
    await base();
    $('#result').style.visibility = 'hidden';
    board.setState(states[LAST]);
    await wait(700, { instant: true });
    if (!alive()) return;
    await board.playMove(LANS[LAST]);
    if (!alive()) return;
    await wait(500, { instant: true });
    $('#result').style.visibility = '';
    if (!prefersReducedMotion()) $('#result').animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    await wait(1600, { instant: true });
    if (!alive()) return;
    renderLine(); await openShare('line'); calm();
    await wait(2200, { instant: true });
    if (!alive()) return;
    goDone('line'); // a scripted tap: the demo does not write to the viewer's clipboard
    await wait(1600, { instant: true });
    if (!alive()) return;
    await selectTab('picture', { fresh: true }); calm();
    await wait(2600, { instant: true });
    if (!alive()) return;
    await selectTab('move', { fresh: true }); calm();
    await wait(2200, { instant: true });
    if (!alive()) return;
    closeNow();
    const shown = showFriend(MOMENTS[0], { preview: true, playIt: true });
    calm();
    await shown;
    if (!alive()) return;
    await wait(2200, { instant: true });
  },
  async reset() { run++; await base(); },
};
