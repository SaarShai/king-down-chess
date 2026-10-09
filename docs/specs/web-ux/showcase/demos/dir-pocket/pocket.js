// Pocket: one thumb, one hand. The real board, rules and computer player from the kit.
// Shared positions (idea bank 6.1): P1 (Frost against Flame, White to move, move 12), the scripted line
// (the Archer shoots a5, then Flame's Strike gives check from e3) and P2 (the Archer mates from f6).
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, toast, hideToast, openSheet, closeSheet, animate, wait, haptic, sfx, prefersReducedMotion } from '../../kit/ui.js';

const params = new URLSearchParams(location.search);
const ME = 'w';
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const PRE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24';
const SHOT = 'Aa3*a5', STRIKE = 'Ab6-e3!', MATE = 'Ae5-f6';
const playAll = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);
const p1 = () => KD.play(KD.fromFen(PRE, { powers: POWERS }), 'e7-e6');
const p2 = () => KD.fromFen(P2, { powers: POWERS });
// P1 opens with one move in its history (Black's e7-e6). Undo and review never go before it.
const PRE_FEN = KD.toFen(KD.fromFen(PRE, { powers: POWERS }));
// P2 comes from the scripted line, in which Black already used Strike (move 12).
const P2_FEN = KD.toFen(p2());
let BASE = 0;
let spentB = false;

const app = $('#app'), pane = $('#pane'), loupe = $('#loupe'), touch = $('#touch');
const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const sqIndex = sq => (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97);
const sqName = i => 'abcdefgh'[i & 7] + ((i >> 3) + 1);
const PN = t => (t === 'pawn' ? 'pawn' : t[0].toUpperCase() + t.slice(1));
const layout = () => app.dataset.layout;
const touchy = () => layout() !== 'desk';

// ---------- words: one short line for each move (eight words or fewer) ----------
function phrase(st) {
  const who = st.side === ME ? 'Your' : 'Their', P = PN(st.piece), v = st.captured?.[0] && PN(st.captured[0]);
  const tag = st.powerTag ? ` with ${st.power}` : '';
  if (st.kind === 'pass') return `${who} turn ends.`;
  // Freeze, Ice Wall and Sacrifice name a piece; Strike, Haste and Flight move one (they fall through below).
  if (st.kind === 'power' && st.from === st.to) {
    if (st.powerTag === 'freeze') return `${who} king freezes the ${P} on ${st.to}.`;
    if (st.powerTag === 'ward') return `${who} ${P} on ${st.to} gets Ice Wall.`;
    return `${who} king uses ${st.power}.`;
  }
  if (st.kind === 'shoot') return st.piece === 'archer' ? `${who} Archer shoots the ${v} on ${st.capturedOn[0]}.` : `${who} ${P} takes the ${v} on ${st.capturedOn[0]}.`;
  if (st.kind === 'chain') return `${who} ${P} bites ${st.capturedOn.length === 2 ? 'twice' : `${st.capturedOn.length} times`}: ${st.capturedOn.join(', ')}.`;
  if (st.kind === 'push') return `${who} ${P} shoves the ${PN(st.push.piece)} to ${st.push.to}.`;
  if (st.kind === 'swap') return `${who} ${P} swaps with the ${PN(st.swap.with)}.`;
  if (st.kind === 'drop') return `${who} ${P} comes in on ${st.to}.`;
  if (st.promo) return `${who} pawn becomes a ${PN(st.promo)}.`;
  if (v) return `${who} ${P} ${st.piece === 'beast' ? 'bites' : 'takes'} the ${v} on ${st.capturedOn[0]}${tag}.`;
  if (st.piece === 'pawn') return `${who} pawn steps to ${st.to}${tag}.`;
  return `${who} ${P} moves to ${st.to}${tag}.`;
}

// The story's line for a special move. The engine marks the move (st.moment); the words are the demo's own.
const COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
function momentLine(st) {
  if (!st.moment) return null;
  if (st.powerTag === 'strike') return 'Strike: one queen move, once a game.';
  if (st.powerTag === 'freeze') return 'Freeze: that piece cannot move next turn.';
  if (st.powerTag === 'ward') return 'Ice Wall: nothing can take it next turn.';
  if (st.kind === 'shoot') return st.piece === 'archer' ? 'The Archer shot without moving.' : 'The king took without moving.';
  if (st.kind === 'chain') return `${COUNT[st.capturedOn.length] ?? st.capturedOn.length} bites in one turn.`;
  if (st.kind === 'push') return st.push.piece === 'guard' ? 'The Ogre shoved the Guard.' : 'The Ogre shoved a piece.';
  if (st.kind === 'swap') return st.swap.with === 'king' ? 'The Maester swapped with the king.' : 'The Maester swapped places.';
  if (st.leaves) return 'The Paladin took and left the board.';
  return null;
}

// The piece card: the verbs (screens spec 5.4), one short line (king-down-facts.md section 2) and the full rule.
// The legend under the card uses the same verbs as the verb row.
const CARD = {
  archer: [['Moves', 'Shoots'], 'Shoots without moving, even over other pieces.', 'It steps one square. It never takes by moving. It shoots an enemy on a diagonal neighbour square, two squares away in a straight line, or two squares away on a forward diagonal.'],
  guard: [['Moves'], 'Only a king can take it. It never takes.', 'It steps one square onto an empty square. A Beast, an Ogre or a Paladin cannot take it. An Ogre can shove it.'],
  maester: [['Steps', 'Takes', 'Swaps'], 'Swaps places with a friend next to it.', 'It steps one square and takes an enemy next to it. When it and its king stand on their first rank, they can swap from any distance.'],
  beast: [['Moves', 'Bites'], 'After each bite, it can bite again.', 'It steps one square onto an empty square and bites an enemy next to it. A chain never takes a king after the first bite.'],
  ogre: [['Moves', 'Takes', 'Shoves'], 'Shoves a neighbour and steps into its place.', 'It steps and takes one square in any direction. It can shove a friend or an enemy one square onto an empty square, but never a king.'],
  paladin: [['Moves', 'Takes', 'Trades'], 'Jumps its own pieces. Taking more than a pawn costs it.', 'It moves like a queen and jumps its own pieces. It never takes a king. It leaves the board after it takes anything but a pawn.'],
  pawn: [['Steps', 'Takes'], 'Steps forward. Takes one square forward on a diagonal.', 'No en passant. On the last rank it becomes a queen, rook, bishop or knight.'],
  knight: [['Jumps', 'Takes'], 'Jumps two squares, then one to the side.', 'It jumps over pieces.'],
  bishop: [['Moves', 'Takes'], 'Moves any distance on a diagonal.', 'Pieces in its way stop it.'],
  rook: [['Moves', 'Takes'], 'Moves any distance in a straight line.', 'Pieces in its way stop it. There is no castling.'],
  queen: [['Moves', 'Takes'], 'Moves any distance, straight or diagonal.', 'Pieces in its way stop it.'],
};
const KING_CARD = {
  flame: [['Steps', 'Takes', 'Strike'], 'Strike: one piece moves like a queen, once.', 'Strike moves one piece (not a pawn or the king) like a queen, to an empty square. One use a game.'],
  frost: [['Steps', 'Takes', 'Freeze'], 'Freeze: an enemy piece cannot move next turn.', 'Freeze an enemy piece (not the king), then make your move. One use a game.'],
};

// ---------- the board ----------
let live = null;          // the game now
let human = 'w';          // who plays outside a script or a review
let review = null;        // an index into chain() while the player looks back
let ribMode = 'last';     // last | chain | armed | hint
let paneKind = null;      // read | story (null: closed)
let forced = null;        // 'landscape' for the preview state
let checkCause = null;
let hintOn = false;       // a hint marks a move until the next tap
let chainView = null;     // a Beast chain that waits: the Beast stands on its last bite
let cdrag = null;         // a drag that goes on from the last bite

const board = createBoard($('#board'), {
  play: { level: 'casual', human: 'w', ms: 500, pause: 450 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap(sq, cell) {
    if (review != null) return false;
    clearHint();
    if (chainView) return chainTap(sq);
    // A tap on their piece reads it, unless that tap is a legal target: then the move plays.
    if (cell && live && cell.color !== KD.status(live).turn && !isTarget(sq)) { openRead(sq); return false; }
    if (paneKind === 'read') closePane();
    setTimeout(syncPrompt, 0);
    return undefined;
  },
  onInspect(sq) { if (review == null && !chainView) openRead(sq); },
  onMove: story => afterMove(story),
  onSelect() { setTimeout(syncPrompt, 0); },
});

const isTarget = sq => board.targets.some(m => m.path[board.pending.length] === sq);

function afterMove(story) {
  live = board.state;
  clearChainView();
  clearOverlay();
  haptic(story.check ? [25, 70, 25] : 10);
  checkCause = null;
  markLast(story);
  ribMode = 'last';
  render({ fresh: true });
}

function show(state, who = human) {
  human = who;
  board.play.human = who;
  review = null;
  app.classList.remove('is-review');
  board.el.style.pointerEvents = '';
  clearChainView();
  live = state;
  if (hintOn) { hintOn = false; board.clearMarks('hint'); }
  ribMode = 'last';
  const root = KD.toFen(chain()[0]);
  BASE = root === PRE_FEN ? 1 : 0;
  spentB = root === P2_FEN;
  clearOverlay();
  board.setState(state);
  checkCause = null;
  markLast(stories().at(-1));
  render();
}

// ---------- the game's story ----------
function chain() { const c = [live]; while (c[0].history.length) c.unshift(KD.undo(c[0])); return c; }
function stories() {
  const c = chain();
  return live.history.map((h, i) => {
    const st = KD.describe(c[i], h.lan), s = KD.status(c[i]);
    return { ...st, num: s.moveNumber, turn: s.turn, at: i + 1 };
  });
}

// The marks of the last move that the board does not draw itself: the fallen king and the cause line.
function markLast(st) {
  if (!st) return;
  if (st.mate) {
    // The fallen king lies down inside its own square, so it never covers a neighbour.
    const loser = st.after.find(c => c && c.type === 'king' && c.color !== st.side);
    board.figure(loser?.sq)?.classList.add('is-fallen', 'fall-in');
  }
  drawCauseFor(st);
}
// The cause of the last move, as a thin ink line: a check (from the piece to the king) or a shot (to its target).
function drawCauseFor(st) {
  if (st.check && st.checkSq) {
    causeFor(st);
    drawCause(st.kind === 'shoot' ? st.from : st.to, st.checkSq, { king: true, fallen: st.mate });
  } else if (st.kind === 'shoot') drawCause(st.from, st.capturedOn[0]);
}
// For an Archer two squares away, name the square it shoots over.
function causeFor(st) {
  const from = st.kind === 'shoot' ? st.from : st.to, king = st.checkSq;
  const a = sqIndex(from), b = sqIndex(king);
  const df = (b & 7) - (a & 7), dr = (b >> 3) - (a >> 3);
  const who = st.side === ME ? 'Your' : 'Their', whose = st.side === ME ? 'their' : 'your';
  let text = `${who} ${PN(st.piece)} on ${from} gives check.`;
  if (st.piece === 'archer' && Math.max(Math.abs(df), Math.abs(dr)) === 2 && (df % 2 === 0) && (dr % 2 === 0)) {
    const mid = sqName(a + (df / 2) + (dr / 2) * 8);
    if (KD.board(live)[sqIndex(mid)]) text = `${who} Archer aims at ${whose} king over ${mid}.`;
  }
  checkCause = text;
}

// ---------- rendering ----------
function render({ fresh = false } = {}) {
  renderHead(fresh);
  renderRibbon(fresh);
  renderOpp();
  renderBar();
  if (paneKind === 'story' || (!paneKind && layout() === 'landscape')) fillStory();
}

function headText() {
  if (review != null) {
    const st = stories()[review - 1];
    const how = layout() === 'desk' ? (paneKind === 'story' ? 'Click a move to step.' : 'The arrows step through it.')
      : layout() === 'landscape' ? 'Tap a move to step.' : 'Swipe the line to step.';
    return ['Looking back', `Move ${st.num}. ${how}`];
  }
  const st = KD.status(live);
  if (st.over) {
    if (st.winner === ME) return ['King Down', 'Their king falls. You win.'];
    if (st.winner) return ['King Down', 'Your king falls.'];
    return ['Draw', st.text];
  }
  if (st.turn !== ME) return ['Their move', 'The computer thinks.'];
  if (st.check) return ['Check', checkCause ?? 'Your king is in check.'];
  return ['Your move', layout() === 'desk' ? 'Drag or click a piece.' : 'Drag or tap a piece.'];
}
function renderHead(fresh) {
  const [t, s] = headText(), title = $('#head-title');
  if (title.textContent === t && $('#head-sub').textContent === s) return;
  title.textContent = t;
  title.classList.toggle('is-check', t === 'Check');
  $('#head-sub').textContent = s;
  if (fresh && !prefersReducedMotion()) { $('#head').classList.remove('is-fresh'); void $('#head').offsetWidth; $('#head').classList.add('is-fresh'); }
}

function ribbonContent() {
  if (ribMode === 'chain') return { text: 'Bite again, or stop here.' };
  if (ribMode === 'armed') return { text: 'Tap an enemy piece to freeze it.' };
  if (ribMode === 'hint') return { text: 'Hint: play the marked move.' };
  const all = stories();
  const st = review != null ? all[review - 1] : all.at(-1);
  if (!st) return { text: 'No moves yet.', icon: '' };
  return { text: phrase(st), icon: pieceIcon(st.piece, st.side), small: `Move ${st.num}` };
}
function renderRibbon(fresh, dir = 0) {
  const c = ribbonContent(), line = $('#rib-line');
  $('#ribbon').classList.toggle('is-prompt', ribMode !== 'last');
  line.innerHTML = `${c.icon ?? ''}<span class="rib-text">${c.text}${c.small ? `<small>${c.small}</small>` : ''}</span>`;
  const n = live.history.length, at = review ?? n;
  $('#rib-back').disabled = at <= BASE || busyGame();
  $('#rib-fwd').disabled = review == null;
  if ((fresh || dir) && !prefersReducedMotion()) {
    const dx = dir ? -dir * 40 : 0, dy = dir ? 0 : 10;
    animate(line, [{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}

function renderOpp() {
  const s = review != null ? chain()[review] : live;
  const k = s.kings?.[1], design = k?.king ? k.king.toLowerCase() : 'shadow';
  const img = $('#avatar img'), src = pieceArt('king', 'b', design);
  if (img.src !== src) img.src = src;
  $('#opp-emb').src = `../../assets/emblems/${design}.webp`;
  const has = !!k?.power, left = has && !spentB ? KD.usesLeft(s, 'b') : 0;
  $('#opp-power-row').hidden = !has;
  if (has) $('#opp-power').textContent = `${k.power} ${left > 0 ? 'ready' : 'used'}`;
  $('#opp-power-row').classList.toggle('is-used', has && left <= 0);
  const st = KD.status(live);
  $('#avatar').classList.toggle('is-thinking', review == null && !st.over && st.turn !== ME);
}

// The thumb bar has four modes: play, a chain that waits, a look back, and the end of the game.
const MODES = {
  play: ['b-menu', 'b-undo', 'b-hint', 'b-power'],
  chain: ['b-menu', 'b-stop'],
  review: ['b-menu', 'b-now'],
  end: ['b-menu', 'b-review', 'b-new', 'b-rematch'],
};
function renderBar() {
  const st = KD.status(live), bar = $('#bar');
  const mode = review != null ? 'review' : ribMode === 'chain' ? 'chain' : st.over ? 'end' : 'play';
  const hasPower = !!live.kings?.[0]?.power;
  if (bar.dataset.mode !== mode) {
    bar.dataset.mode = mode;
    for (const b of bar.children) b.hidden = !MODES[mode].includes(b.id);
    if (!prefersReducedMotion()) for (const b of bar.children) if (!b.hidden && b.id !== 'b-menu') animate(b, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  if (mode === 'play') $('#b-power').hidden = !hasPower;
  const mine = review == null && !st.over && st.turn === ME && !board.busy;
  $('#b-undo').disabled = !mine || live.history.length <= BASE;
  $('#b-hint').disabled = !mine;
  const left = hasPower ? KD.usesLeft(live, ME) : 0;
  const pw = $('#b-power');
  pw.classList.toggle('is-used', hasPower && left <= 0);
  pw.disabled = !mine || left <= 0;
  pw.setAttribute('aria-pressed', String(board.armed === 'freeze'));
  // One notch on the coin's rim for each use left (no number badge: it would look like an alert).
  $('#b-power-notches').innerHTML = '<i></i>'.repeat(Math.max(0, left));
  $('#b-power-label').textContent = board.armed === 'freeze' ? 'Cancel' : left > 0 ? 'Freeze' : 'Used';
  pw.setAttribute('aria-label', board.armed === 'freeze' ? 'Cancel Freeze' : left > 0 ? `Freeze, ${left} use left` : 'Freeze, used');
}
const busyGame = () => board.busy && board.play.human !== 'both';

// A Beast chain waits for its next bite, or a Freeze waits for its target: the ribbon says what to do.
function syncPrompt() {
  const was = ribMode;
  if (board.armed === 'freeze') ribMode = 'armed';
  else if (board.pending?.length) ribMode = 'chain';
  else if (ribMode === 'chain' || ribMode === 'armed') ribMode = 'last';
  syncChain();
  if (was !== ribMode) renderRibbon(false);
  renderBar();
}

// ---------- the Beast chain: the board shows the bites so far ----------
// The kit keeps the Beast on its first square until the chain ends. While the chain waits, the demo
// shows the true picture: the Beast on its last bitten square, each bitten piece faded with its number.
const colRow = sq => { const i = sqIndex(sq), c = i & 7, r = 7 - (i >> 3); return board.flipped ? { c: 7 - c, r: 7 - r } : { c, r }; };
function offset(from, to) { const a = colRow(from), b = colRow(to); return `translate(${(b.c - a.c) * 100}%, ${(b.r - a.r) * 100}%)`; }
function syncChain() {
  const p = board.pending ?? [];
  if (!p.length || board.selected == null || review != null) { clearChainView(); return; }
  if (chainView && chainView.n === p.length) return;
  clearChainView();
  const from = sqName(board.selected), at = p.at(-1), fig = board.figure(from);
  if (!fig) return;
  chainView = { from, at, n: p.length, fig, z: fig.style.zIndex, dim: [] };
  fig.style.transform = offset(from, at);
  fig.style.zIndex = String(12 + colRow(at).r * 3);
  for (const sq of p) { const f = board.figure(sq); if (f) { f.style.opacity = '.3'; chainView.dim.push(f); } }
  board.clearMarks('selected');
  board.mark(at, 'selected');
  badges(p.map((sq, i) => [sq, String(i + 1)]));
}
function clearChainView() {
  if (!chainView) return;
  const { fig, z, dim } = chainView;
  chainView = null;
  fig.getAnimations().forEach(a => a.cancel());
  fig.style.transform = '';
  fig.style.zIndex = z;
  for (const f of dim) f.style.opacity = '';
  ovl?.querySelectorAll('.bite').forEach(b => b.remove());
}
// A tap while a chain waits: on the Beast, stop here; on the last bite of a chain, play it with a short slide.
function chainTap(sq) {
  if (cdrag?.moved) return false;                      // the end of a drag from the last bite: the drag handles it
  if (sq === chainView.at) { void finishChain(currentChainMove()); return false; }
  const next = board.candidates().filter(m => m.path[board.pending.length] === sq);
  if (next.length && next.every(m => m.path.length === board.pending.length + 1)) { void finishChain(next[0]); return false; }
  setTimeout(syncPrompt, 0);                           // a longer chain, or a tap elsewhere: the board decides
  return undefined;
}
const currentChainMove = () => {
  const from = sqName(board.selected), done = board.pending;
  return KD.legal(live, from).find(x => x.path.length === done.length && x.path.every((p, i) => p === done[i]));
};
async function finishChain(m, { dragged = false } = {}) {
  if (!m || !chainView) return;
  const cv = chainView, story = KD.describe(live, m), rest = m.path.slice(cv.n), me = run;
  board.busy = true;
  if (rest.length && !prefersReducedMotion()) {
    let at = cv.at;
    for (const sq of rest) {
      if (!dragged) await cv.fig.animate([{ transform: offset(cv.from, at) }, { transform: offset(cv.from, sq) }], { duration: 210, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }).finished.catch(() => {});
      if (me !== run) return;
      sfx.play('capture');
      await board.figure(sq)?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(4px) scale(.9)' }], { duration: 200, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.catch(() => {});
      if (me !== run) return;
      at = sq;
    }
  } else sfx.play('capture');
  clearChainView();
  ribMode = 'last';
  board.setState(story.next);   // the final position; the computer answers from here
  board.say(story.text);
  afterMove(story);
}
$('#b-stop').addEventListener('click', () => { if (chainView) void finishChain(currentChainMove()); });

// ---------- the pane: the piece card and the game story ----------
// On a phone the pane opens at peek, the height of the thumb bar, in the bar's place: the whole board
// stays in view. Only a pull (or the chevron) makes it taller and covers part of the board.
function heights() {
  const H = app.getBoundingClientRect().height || innerHeight, peek = Math.round($('#bar').getBoundingClientRect().height) || 78;
  const card = paneKind === 'read' ? Math.min(Math.round(H * 0.6), peek + $('#pane-body').scrollHeight + 8) : Math.round(H * 0.5);
  return { peek, half: card, full: Math.round(H - 52) };
}
function setHeight(h) {
  pane.dataset.h = h;
  pane.style.setProperty('--pane-h', `${heights()[h]}px`);
  const tall = h === 'full' || (h === 'half' && paneKind === 'read');
  $('#pane-size').innerHTML = icon(tall ? 'chevron-down' : 'chevron', { size: 22 });
  $('#pane-size').querySelector('svg').style.transform = tall ? '' : 'rotate(-90deg)';
  $('#pane-size').setAttribute('aria-label', tall ? 'Shorter' : 'Taller');
}
const SIZES = { read: ['peek', 'half'], story: ['peek', 'half', 'full'] };

function setCloseButton() {
  const fold = layout() === 'desk' && paneKind === 'story';
  $('#pane-close').innerHTML = icon(fold ? 'chevron' : 'close');
  if (fold) $('#pane-close').querySelector('svg').style.transform = 'rotate(-90deg)';
  $('#pane-close').setAttribute('aria-label', fold ? 'Fold the game story' : 'Close');
}

async function openPane(kind, { h, instant = false } = {}) {
  paneKind = kind;
  pane.dataset.kind = kind;
  app.dataset.pane = kind;
  pane.classList.remove('is-default');
  if (kind === 'story') fillStory();
  setCloseButton();
  if (review != null) renderHead(false);
  const wasHidden = pane.hidden;
  pane.hidden = false;
  setHeight(h ?? SIZES[kind][0]);
  if (layout() === 'portrait' && wasHidden && !instant && !prefersReducedMotion()) {
    await pane.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.34,1.18,.64,1)' }).finished.catch(() => {});
  }
}
async function closePane({ instant = false } = {}) {
  if (!paneKind) return;
  const was = paneKind;
  if (was === 'read') board.clearSelection(false);
  paneKind = null;
  delete app.dataset.pane;
  if (review != null) renderHead(false);
  if (layout() !== 'portrait') {
    showDefaultPane();
    if (was === 'story' && layout() === 'desk') $('#rib-track').focus({ preventScroll: true });
    return;
  }
  if (!instant && !prefersReducedMotion() && !pane.hidden) {
    await pane.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 180, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.catch(() => {});
    pane.getAnimations().forEach(a => a.cancel());
  }
  if (!paneKind) pane.hidden = true;
}
// Landscape: the middle column shows the game story when nothing else is open. Desk: the ribbon is the
// folded story, so nothing shows until the player opens it.
function showDefaultPane() {
  if (paneKind) return;
  if (layout() !== 'landscape') { pane.hidden = true; delete pane.dataset.kind; return; }
  pane.hidden = false;
  pane.dataset.kind = 'story';
  pane.classList.add('is-default');
  fillStory();
}

function fillStory() {
  const all = stories(), cur = review ?? all.length;
  const rows = all.map(st => {
    const line = momentLine(st);
    return `<li><button type="button" class="st-btn" data-at="${st.at}" aria-current="${st.at === cur}">
      <span class="st-num">${st.num}${st.turn === 'b' ? '…' : '.'}</span>${pieceIcon(st.piece, st.side)}
      <span class="st-text">${phrase(st)}${line ? `<small>${line}</small>` : ''}</span></button></li>`;
  }).reverse().join('');
  // The peek shows the game as a strip of tiles (oldest on the left); a tile opens the board after that move.
  const tiles = all.map(st => `<li><button type="button" class="tile" data-at="${st.at}" aria-current="${st.at === cur}" aria-label="Move ${st.num}. ${phrase(st)}">
      ${pieceIcon(st.piece, st.side)}<span class="tile-sq">${st.kind === 'shoot' ? st.capturedOn[0] : st.to}</span>${momentLine(st) ? '<i class="tile-mark" aria-hidden="true">✦</i>' : ''}</button></li>`).join('');
  $('#pane-peek').innerHTML = `<h2 id="pane-title">The game</h2><ol class="strip" aria-label="Moves, oldest first">${tiles}</ol>`;
  requestAnimationFrame(scrollStrip);
  $('#pane-body').innerHTML = `<ol class="story" aria-label="Moves, newest first">${rows || '<li class="story-note">No moves yet.</li>'}</ol>
    <p class="story-note">${layout() === 'desk' ? 'Click' : 'Tap'} a move to see the board then.</p>`;
}
// Keep the tile of the move on the board in view (the newest move, or the one under review).
function scrollStrip() {
  const s = $('#pane-peek .strip'), t = s?.querySelector('[aria-current="true"]');
  if (s && t) s.scrollLeft = Math.max(0, t.offsetLeft + t.offsetWidth - s.clientWidth + 4);
}

function fillRead(sq, r) {
  const cell = KD.board(live)[sqIndex(sq)];
  if (!cell) return;
  const kingCard = cell.type === 'king' && KING_CARD[cell.design];
  const [verbs, line, more] = kingCard || CARD[cell.type] || [['Steps', 'Takes'], 'Steps one square in any direction.', ''];
  const who = cell.color === ME ? 'Your' : 'Their';
  const take = verbs.find(v => v === 'Bites') ?? 'Takes';
  const key = [
    r.steps.length && `<li><span class="key-step" aria-hidden="true"></span>${verbs[0]}</li>`,
    r.takes.length && `<li><span class="key-take" aria-hidden="true"></span>${take}</li>`,
    r.shots.length && '<li><span class="key-shot" aria-hidden="true"></span>Shoots</li>',
  ].filter(Boolean).join('');
  $('#pane-peek').innerHTML = `<span class="pk-art" aria-hidden="true"><img src="${pieceArt(cell.type, cell.color, cell.design)}" alt=""></span>
    <div class="pk-text"><h2 id="pane-title">${who} ${PN(cell.type)}</h2><p class="pk-line">${line}</p></div>`;
  $('#pane-body').innerHTML = `<p class="cr-verbs">${verbs.join(' · ')}</p>
    ${key ? `<ul class="cr-key" aria-label="Marks on the board">${key}</ul>` : ''}
    <p class="cr-more">${more}</p>`;
}

// Reading a piece: its reach on the board and its card. Reading never plays a move.
function reach(sq) {
  const cells = KD.board(live), me = cells[sqIndex(sq)];
  if (!me) return { steps: [], takes: [], shots: [] };
  const powers = (live.kings ?? []).map(k => (k?.power ? `${k.king}:${k.power}` : null));
  const at = (cs, turn) => { try { return KD.fromFen(fenOf(cs, turn), live.kings ? { powers } : {}); } catch { return null; } };
  const base = at(cells, me.color);
  const moves = base ? KD.legal(base, sq).filter(m => !m.power && !m.needsArming) : [];
  const steps = moves.filter(m => !m.captures.length && !m.swap && !m.push).map(m => m.to);
  const takes = moves.filter(m => m.captures.length && m.kind !== 'shoot').map(m => m.captures[0]);
  const shots = moves.filter(m => m.kind === 'shoot').map(m => m.captures[0]);
  // An Archer shoots without moving: probe each empty square with an enemy knight to find every shot square.
  if (me.type === 'archer') {
    for (let i = 0; i < 64; i++) {
      if (cells[i]) continue;
      const probe = cells.slice(); probe[i] = { type: 'knight', color: me.color === 'w' ? 'b' : 'w' };
      const s = at(probe, me.color);
      if (s && KD.legal(s, sq).some(m => m.kind === 'shoot' && m.captures[0] === sqName(i))) shots.push(sqName(i));
    }
  }
  return { steps: [...new Set(steps)], takes: [...new Set(takes)], shots: [...new Set(shots)] };
}
const LET = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k', archer: 'a', paladin: 'l', guard: 'g', maester: 'm', beast: 's', ogre: 'o' };
function fenOf(cells, turn) {
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', e = 0;
    for (let f = 0; f < 8; f++) {
      const c = cells[r * 8 + f];
      if (!c) { e++; continue; }
      if (e) { row += e; e = 0; }
      row += c.color === 'w' ? LET[c.type].toUpperCase() : LET[c.type];
    }
    rows.push(row + (e || ''));
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

function openRead(sq, opts = {}) {
  hideLoupe();
  clearChainView();
  board.clearSelection(false);
  const r = reach(sq);
  board.select(sq);
  board.mark(r.steps, 'move', { pop: !opts.instant, from: sq });
  board.mark(r.takes, 'capture', { pop: !opts.instant, from: sq });
  board.mark(r.shots, 'shot', { pop: !opts.instant, from: sq });
  fillRead(sq, r);
  openPane('read', opts);
}

// ---------- overlays on the board ----------
let ovl = null;
function overlay() {
  if (!ovl || !ovl.isConnected) { ovl = document.createElement('div'); ovl.className = 'ovl'; board.layer.appendChild(ovl); }
  return ovl;
}
function clearOverlay() { ovl?.replaceChildren(); }
function pos(sq) { const { c, r } = colRow(sq); return { x: c * 12.5, y: r * 12.5 }; }
function badges(list) {
  for (const [sq, n] of list) {
    const p = pos(sq), el = document.createElement('div');
    el.className = 'bite';
    Object.assign(el.style, { left: `${p.x}%`, top: `${p.y}%` });
    el.innerHTML = `<b>${n}</b>`;
    overlay().appendChild(el);
  }
}
// A thin ink line from the cause to its effect: to the king in check, or to the square a shot hit.
// With motion it draws itself once. It stays until the next move.
function drawCause(from, to, { king = false, fallen = false } = {}) {
  overlay().querySelector('.cause')?.remove();
  const a = pos(from), b = pos(to);
  const x1 = (a.x + 6.25) * 8, y1 = (a.y + 5) * 8, x2 = (b.x + 6.25) * 8, y2 = (b.y + (fallen ? 7.6 : king ? 8.5 : 6.6)) * 8;
  const ang = Math.atan2(y2 - y1, x2 - x1), back = fallen ? 24 : 16, tip = { x: x2 - Math.cos(ang) * (back - 16), y: y2 - Math.sin(ang) * (back - 16) };
  const hx = tip.x - Math.cos(ang) * 16, hy = tip.y - Math.sin(ang) * 16;
  const head = `M${tip.x} ${tip.y}L${hx - Math.sin(ang) * 9} ${hy + Math.cos(ang) * 9}L${hx + Math.sin(ang) * 9} ${hy - Math.cos(ang) * 9}Z`;
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'cause'); svg.setAttribute('viewBox', '0 0 800 800'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<path d="M${x1} ${y1}L${hx} ${hy}" stroke="rgba(251,247,238,.9)" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path class="ln" d="M${x1} ${y1}L${hx} ${hy}" stroke="#2b2621" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <path d="${head}" fill="#2b2621" stroke="rgba(251,247,238,.9)" stroke-width="2"/>
    <circle cx="${x1}" cy="${y1}" r="6" fill="#2b2621" stroke="rgba(251,247,238,.9)" stroke-width="2.5"/>`;
  overlay().appendChild(svg);
  if (!prefersReducedMotion()) {
    const len = Math.hypot(hx - x1, hy - y1);
    for (const p of svg.querySelectorAll('path')) { p.style.strokeDasharray = `${len}`; p.animate([{ strokeDashoffset: len, opacity: .4 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 260, easing: 'ease-out' }); }
  }
}

// ---------- the loupe: the board under the thumb, 1.5 times larger, above the thumb ----------
const LENS = 120, ZOOM = 1.5;
let lens = null;
function verbFor(sq) {
  const ms = board.targets.filter(m => m.path[board.pending.length] === sq);
  if (!ms.length) return null;
  const m = ms[0];
  if (m.kind === 'chain' || (board.cells[board.selected]?.type === 'beast' && m.captures.length)) return `Bite ${board.pending.length + 1}`;
  if (m.kind === 'shoot') return 'Shoot';
  if (m.push && ms.length === 1) return 'Shove';
  if (m.swap) return 'Swap';
  if (ms.length > 1) return 'Take or shove';
  return m.captures.length ? 'Take' : 'Move';
}
// figSq: the square of the figure in the board's map; startSq: where the drag began (a chain goes on from its last bite).
function showLoupe(x, y, figSq, startSq = figSq) {
  const sqEl = board.layer, L = sqEl.getBoundingClientRect(), t = L.width / 8;
  const over = board.squareAtPoint(x, y), name = over == null ? null : sqName(over);
  if (!lens || lens.over !== over || lens.from !== figSq) {
    board.clearMarks('hover');
    if (name && name !== startSq && isTarget(name)) board.mark(name, 'hover');
    const clone = sqEl.cloneNode(true);
    const figs = [...sqEl.children], fig = board.figure(figSq), twin = clone.children[figs.indexOf(fig)];
    clone.querySelector('.ovl')?.remove();
    for (const k of ['--u', '--tile', '--k']) $('#loupe-in').style.setProperty(k, board.el.style.getPropertyValue(k));
    clone.style.left = '0'; clone.style.top = '0';
    $('#loupe-in').replaceChildren(clone);
    lens = { over, from: figSq, clone, fig, twin };
    // On the start square the tag names the piece; elsewhere it names what a drop there does.
    const cell = board.cells[sqIndex(figSq)];
    const tag = !name ? '' : name === startSq ? `${PN(cell?.type ?? 'piece')} · ${name}` : `${verbFor(name) ?? 'No move'} · ${name}`;
    $('#loupe-tag').textContent = tag;
  }
  if (lens.twin && lens.fig) lens.twin.style.transform = lens.fig.style.transform;
  const fx = x - L.left, fy = y - L.top - t * 0.18;
  $('#loupe-in').style.transform = `translate(${LENS / 2}px, ${LENS / 2}px) scale(${ZOOM}) translate(${-fx}px, ${-fy}px)`;
  const left = Math.max(8, Math.min(innerWidth - LENS - 8, x - LENS / 2));
  let top = y - LENS - 64;
  if (top < 8) top = Math.min(innerHeight - LENS - 8, y + 56);
  loupe.style.transform = `translate(${left}px, ${top}px)`;
  if (loupe.hidden) {
    loupe.hidden = false;
    if (!prefersReducedMotion()) { loupe.firstElementChild.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 160 }); }
  }
}
function hideLoupe() { loupe.hidden = true; lens = null; $('#loupe-in').replaceChildren(); board.clearMarks('hover'); }
function showTouch(x, y) { touch.hidden = false; touch.style.transform = `translate(${x}px, ${y}px)`; }
function hideTouch() { touch.hidden = true; }

// Real drags. A first drag: the board moves the figure, and the loupe follows the same finger or pen.
// A drag from the last bite of a waiting chain: the demo moves the Beast, and a drop on a target bites.
{
  let d = null;
  const el = board.el;
  el.addEventListener('pointerdown', e => {
    if (review != null) return;
    const i = board.squareAtPoint(e.clientX, e.clientY);
    if (i == null) { d = null; return; }
    if (chainView && sqName(i) === chainView.at && !board.busy) {
      cdrag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, touch: e.pointerType !== 'mouse' };
      d = null;
      return;
    }
    d = e.pointerType === 'mouse' ? null : { id: e.pointerId, sq: sqName(i) };
  });
  el.addEventListener('pointermove', e => {
    if (cdrag && e.pointerId === cdrag.id && chainView) {
      const dx = e.clientX - cdrag.x, dy = e.clientY - cdrag.y;
      if (!cdrag.moved && Math.hypot(dx, dy) < 7) return;
      cdrag.moved = true;
      const f = chainView.fig;
      f.style.zIndex = '500';
      f.style.transform = `${offset(chainView.from, chainView.at)} translate(${dx}px, ${dy}px) scale(1.06)`;
      if (cdrag.touch) showLoupe(e.clientX, e.clientY, chainView.from, chainView.at);
      else { board.clearMarks('hover'); const o = board.squareAtPoint(e.clientX, e.clientY); if (o != null && isTarget(sqName(o))) board.mark(sqName(o), 'hover'); }
      return;
    }
    if (!d || e.pointerId !== d.id) return;
    const fig = board.figure(d.sq);
    if (!fig?.style.transform) return;   // the board drags only a piece that can move now
    showLoupe(e.clientX, e.clientY, d.sq);
  });
  const end = e => {
    if (cdrag && e.pointerId === cdrag.id) {
      const c = cdrag;
      cdrag = null;
      hideLoupe();
      if (!c.moved || !chainView) return;
      const o = e.type === 'pointerup' ? board.squareAtPoint(e.clientX, e.clientY) : null, sq = o == null ? null : sqName(o);
      const next = sq ? board.candidates().filter(m => m.path[board.pending.length] === sq) : [];
      const cv = chainView;
      if (next.length && next.every(m => m.path.length === board.pending.length + 1)) {
        cv.fig.style.transform = offset(cv.from, sq);   // dropped there: no slide back
        void finishChain(next[0], { dragged: true });
      } else {
        const was = cv.fig.style.transform;
        cv.fig.style.transform = offset(cv.from, cv.at);
        cv.fig.style.zIndex = String(12 + colRow(cv.at).r * 3);
        if (!prefersReducedMotion()) cv.fig.animate([{ transform: was }, { transform: offset(cv.from, cv.at) }], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
        if (next.length) { void board.handleTap(o); setTimeout(syncPrompt, 0); }   // a longer chain goes on
      }
      return;
    }
    if (d && e.pointerId === d.id) { d = null; hideLoupe(); setTimeout(syncPrompt, 0); }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// ---------- review: swipe the ribbon, or use its arrows ----------
function step(dir) {
  if (busyGame() || ribMode === 'chain' || ribMode === 'armed') return;
  const N = live.history.length;
  const i = Math.max(BASE, Math.min(N, (review ?? N) + dir));
  if (i === (review ?? N)) return;
  if (i === N) { toNow(dir); return; }
  enterReview(i, dir);
}
function enterReview(i, dir = -1) {
  if (paneKind === 'read') closePane({ instant: true });
  clearHint();
  clearChainView();
  review = i;
  ribMode = 'last';
  app.classList.add('is-review');
  board.play.human = 'both';
  board.el.style.pointerEvents = 'none';
  board.setState(chain()[i]);
  clearOverlay();
  render();
  renderRibbon(false, dir);
}
function toNow(dir = 1) {
  if (review == null) return;
  review = null;
  app.classList.remove('is-review');
  board.el.style.pointerEvents = '';
  board.play.human = human;
  board.setState(live);
  clearOverlay();
  markLast(stories().at(-1));
  render();
  renderRibbon(false, dir);
}

{
  const track = $('#rib-track'), line = $('#rib-line');
  let sw = null;
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    sw = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, on: false };
    try { track.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
  });
  track.addEventListener('pointermove', e => {
    if (!sw || e.pointerId !== sw.id) return;
    sw.dx = e.clientX - sw.x;
    if (!sw.on && Math.abs(sw.dx) > 8 && Math.abs(sw.dx) > Math.abs(e.clientY - sw.y)) sw.on = true;
    if (sw.on && ribMode === 'last') line.style.transform = `translateX(${sw.dx * 0.6}px)`;   // the line follows the finger
  });
  const end = e => {
    if (!sw || e.pointerId !== sw.id) return;
    const s = sw; sw = null;
    line.style.transform = '';
    if (s.on && Math.abs(s.dx) > 36) step(s.dx > 0 ? -1 : 1);       // right = back in time, as a page turns
    else if (!s.on && e.type === 'pointerup') openStory();
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStory(); }
  });
}
// The ribbon is the folded story: a tap or a click opens it (on a phone at peek, in the bar's place).
async function openStory() {
  if (ribMode !== 'last') return;
  if (layout() === 'landscape') { $('#pane-body .st-btn')?.focus(); return; }
  if (paneKind === 'story') { closePane(); return; }
  await openPane('story');
  if (layout() === 'desk') $('#pane-body .st-btn[aria-current="true"]')?.focus({ preventScroll: true });
}

// ---------- controls ----------
const label = (el, name, text) => { el.innerHTML = `<span class="slot" aria-hidden="true">${icon(name)}</span><span>${text}</span>`; };
label($('#b-menu'), 'menu', 'Menu');
label($('#b-undo'), 'undo', 'Undo');
label($('#b-hint'), 'hint', 'Hint');
label($('#b-review'), 'eye', 'Review');
label($('#b-new'), 'plus', 'New game');
label($('#b-rematch'), 'swords', 'Rematch');
$('#b-now').innerHTML = `${icon('play')}<span>Back to now</span>`;
$('#b-stop').innerHTML = `${icon('check')}<span>Stop here</span>`;
$('#rib-back').innerHTML = icon('back');
$('#rib-fwd').innerHTML = icon('chevron');
$('#pane-close').innerHTML = icon('close');
$('#menu-close').innerHTML = icon('close');
for (const s of document.querySelectorAll('[data-icon]')) s.insertAdjacentHTML('afterbegin', icon(s.dataset.icon));

$('#rib-back').addEventListener('click', () => step(-1));
$('#rib-fwd').addEventListener('click', () => step(1));
$('#b-now').addEventListener('click', () => toNow(1));
$('#b-menu').addEventListener('click', () => openSheet('menu'));
$('#b-undo').addEventListener('click', () => {
  if (!live || live.history.length <= BASE) return;
  const plies = human === 'both' ? 1 : (live.history.length - BASE >= 2 ? 2 : 1);
  let s = live;
  for (let i = 0; i < plies; i++) s = KD.undo(s);
  closePane({ instant: true });
  show(s);
});
function clearHint() { if (!hintOn) return; hintOn = false; board.clearMarks('hint'); if (ribMode === 'hint') { ribMode = 'last'; renderRibbon(false); } }
$('#b-hint').addEventListener('click', async () => {
  const s = live, m = await KD.think(s, { level: 'club', ms: 400 });
  if (!m || s !== live) return;
  board.clearSelection(false);
  board.mark([m.from, m.path.at(-1) ?? m.to], 'hint');
  hintOn = true; ribMode = 'hint';
  renderRibbon(true);
});
$('#b-power').addEventListener('click', () => {
  clearHint();
  if (board.armed === 'freeze') board.arm(null); else { closePane({ instant: true }); board.arm('freeze'); }
  syncPrompt();
});
$('#b-review').addEventListener('click', () => enterReview(Math.max(BASE, live.history.length - 1)));
$('#b-new').addEventListener('click', () => { closePane({ instant: true }); show(KD.newGame({ army: 'random' }), 'w'); });
$('#b-rematch').addEventListener('click', () => { closePane({ instant: true }); show(p1(), 'w'); });
$('#pane-close').addEventListener('click', () => closePane());
$('#pane-size').addEventListener('click', () => {
  const list = SIZES[paneKind] ?? [], i = list.indexOf(pane.dataset.h);
  const tall = pane.dataset.h === 'full' || (pane.dataset.h === 'half' && paneKind === 'read');
  setHeight(list[tall ? Math.max(0, i - 1) : Math.min(list.length - 1, i + 1)]);
});
pane.addEventListener('click', e => {
  const b = e.target.closest('button[data-at]');
  if (!b) return;
  const at = +b.dataset.at;
  if (at === live.history.length) toNow(1); else enterReview(at, -1);
  if (layout() === 'portrait' && pane.dataset.h !== 'peek') setHeight('peek');   // show the board again
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && paneKind && !$('#menu').open && document.activeElement !== board.el) { e.preventDefault(); closePane(); }
});

// The sheet follows the finger one to one, then settles on the nearest height.
{
  const grab = $('#pane-grab');
  let pd = null;
  grab.addEventListener('pointerdown', e => {
    if (layout() !== 'portrait' || e.target.closest('button')) return;
    pd = { id: e.pointerId, y: e.clientY, h: pane.getBoundingClientRect().height - 28, moved: false };
    pane.classList.add('is-dragging');
    try { grab.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
  });
  grab.addEventListener('pointermove', e => {
    if (!pd || e.pointerId !== pd.id) return;
    const dy = e.clientY - pd.y;
    if (Math.abs(dy) > 4) pd.moved = true;
    pane.style.setProperty('--pane-h', `${Math.max(40, Math.min(heights().full, pd.h - dy))}px`);
  });
  const end = e => {
    if (!pd || e.pointerId !== pd.id) return;
    const p = pd; pd = null;
    pane.classList.remove('is-dragging');
    const h = pane.getBoundingClientRect().height - 28, H = heights(), list = SIZES[paneKind] ?? ['peek'];
    if (!p.moved) { setHeight(pane.dataset.h); return; }
    if (h < H.peek - 36) { closePane(); return; }
    const best = list.reduce((a, k) => (Math.abs(H[k] - h) < Math.abs(H[a] - h) ? k : a), list[0]);
    setHeight(best);
  };
  grab.addEventListener('pointerup', end);
  grab.addEventListener('pointercancel', end);
}

// The menu
$('#t-sound').checked = !sfx.muted;
$('#t-sound').addEventListener('change', e => sfx.setMuted(!e.target.checked));
$('#t-haptic').addEventListener('change', e => { haptic.enabled = e.target.checked; });
$('#menu').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  await closeSheet('menu');
  const act = b.dataset.act;
  if (act === 'new') show(KD.newGame({ army: 'random' }), 'w');
  else if (act === 'story') openStory();
  else if (act === 'resign') toast('In the app, your king lies down here.');
  else toast(act === 'guide' ? 'The Guide opens here in the app.' : 'Extra opens here in the app.');
});

// ---------- layout: portrait, landscape or desk ----------
function applyLayout() {
  const f = params.get('frame');
  const realLand = innerWidth > innerHeight && innerHeight < 560 && innerWidth < 1000;
  let L = innerWidth >= 900 && !realLand ? 'desk' : realLand ? 'landscape' : 'portrait';
  if (f === 'phone') L = realLand ? 'landscape' : 'portrait';
  if (f === 'desktop') L = 'desk';
  if (forced) L = forced;
  const before = app.dataset.layout;
  app.dataset.layout = L;
  const preview = forced === 'landscape' && !realLand ? (innerWidth < 700 ? 'turned' : 'framed') : '';
  if (preview) app.dataset.preview = preview; else delete app.dataset.preview;
  document.body.classList.toggle('is-previewing', !!preview);
  $('#preview-cap').hidden = preview !== 'framed';
  if (preview === 'turned') {
    app.style.transform = '';
    Object.assign(app.style, { left: `${Math.round((innerWidth + 390) / 2)}px`, top: `${Math.max(0, Math.round((innerHeight - 844) / 2))}px` });
  } else if (preview === 'framed') {
    // A desktop window shows the phone larger, so its words read at the same size as on the phone.
    const k = Math.max(1, Math.min(1.45, (innerWidth - 120) / 844, (innerHeight - 170) / 390));
    const top = Math.max(24, Math.round((innerHeight - 390 * k) / 2) - 28);
    Object.assign(app.style, { left: `${Math.round((innerWidth - 844 * k) / 2)}px`, top: `${top}px`, transform: `scale(${k})` });
    $('#preview-cap').style.top = `${Math.round(top + 390 * k + 40)}px`;
  } else Object.assign(app.style, { left: '', top: '', transform: '' });
  if (before !== L && live) {
    if (paneKind) { setCloseButton(); setHeight(pane.dataset.h || SIZES[paneKind][0]); if (paneKind === 'story') fillStory(); }
    else showDefaultPane();
  }
}
addEventListener('resize', () => { applyLayout(); hideLoupe(); });

// ---------- the demo contract ----------
let run = 0;
function clearAll() {
  hideLoupe(); hideTouch(); hideToast(); clearChainView(); clearOverlay(); clearHint();
  cdrag = null;
  if ($('#menu').open) $('#menu').close();
  paneKind = null; ribMode = 'last';
  delete app.dataset.pane;
  pane.hidden = true;
  pane.getAnimations().forEach(a => a.cancel());
  board.arm(null);
  review = null;
  app.classList.remove('is-review');
  board.el.style.pointerEvents = '';
}
async function setForced(f) {
  if (forced === f) return;
  forced = f;
  applyLayout();
  await nextFrame();
}
const center = sq => { const r = board.squareRect(sq); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };

const STATES = {
  async rest() { show(p1(), 'both'); },
  async read() { show(p1(), 'both'); await nextFrame(); openRead('b6', { instant: true }); },
  // The middle of a Beast chain: bite 1 on d5 is done, and the finger drags the Beast on to e6.
  async select() {
    show(p1(), 'both');
    board.selectSquare('e4');
    await board.handleTap(sqIndex('d5'));
    syncPrompt();
    await nextFrame();
    const a = center('d5'), b = center('e6'), k = touchy() ? 0.84 : 0.6, x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
    const f = chainView.fig;
    f.style.zIndex = '500';
    f.style.transform = `${offset('e4', 'd5')} translate(${x - a.x}px, ${y - a.y}px) scale(1.06)`;
    if (touchy()) { showLoupe(x, y, 'e4', 'd5'); showTouch(x, y); }
    else board.mark('e6', 'hover');
  },
  async played() { show(playAll(p1(), [SHOT]), 'both'); },
  async check() { show(playAll(p1(), [SHOT, STRIKE]), 'both'); },
  async end() {
    show(p2(), 'both');
    await board.playMove(MATE);
  },
  async story() {
    show(playAll(p1(), [SHOT, STRIKE]), 'both');
    await openPane('story', { instant: true });
  },
  async back() {
    show(playAll(p1(), [SHOT, STRIKE]), 'both');
    enterReview(2);
  },
  async landscape() {
    await setForced('landscape');
    show(playAll(p1(), [SHOT, STRIKE]), 'both');
    showDefaultPane();
  },
};

// The short story for Replay: drag the Beast with the loupe to bite d5, drag on to bite e6, the computer
// answers, then swipe the ribbon back one move, return to now and open the story at peek.
async function fakeDrag(from, to, ms, me) {
  const a = center(from), b = center(to), el = board.el;
  const fire = (type, p) => el.dispatchEvent(new PointerEvent(type, { pointerId: 41, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: p.x, clientY: p.y, bubbles: true }));
  fire('pointerdown', a); showTouch(a.x, a.y);
  const t0 = performance.now();
  await new Promise(res => {
    const tick = now => {
      if (me !== run) { res(); return; }
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const p = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      fire('pointermove', p); showTouch(p.x, p.y);
      if (k < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  if (me !== run) return;
  await wait(380);
  if (me !== run) return;
  fire('pointerup', b); hideTouch();
}
async function fakeSwipe(dx, me) {
  const t = $('#rib-track'), r = t.getBoundingClientRect(), y = r.y + r.height / 2, x0 = r.x + r.width / 2 - dx / 2;
  const fire = (type, x) => t.dispatchEvent(new PointerEvent(type, { pointerId: 43, pointerType: 'touch', isPrimary: true, button: 0, clientX: x, clientY: y, bubbles: true }));
  fire('pointerdown', x0); showTouch(x0, y);
  for (let i = 1; i <= 12; i++) { if (me !== run) return; const x = x0 + dx * i / 12; fire('pointermove', x); showTouch(x, y); await wait(22); }
  fire('pointerup', x0 + dx); hideTouch();
}

window.demo = {
  async state(name) {
    run++;
    clearAll();
    await setForced(name === 'landscape' ? 'landscape' : null);
    const fn = STATES[name];
    if (!fn) throw new Error(`demo.state: no state "${name}"`);
    await fn();
    if (layout() !== 'portrait' && !paneKind) showDefaultPane();
  },
  async play() {
    const me = ++run;
    clearAll();
    await setForced(null);
    human = 'w';
    show(p1(), 'w');
    showDefaultPane();
    await wait(700, { instant: true });
    if (me !== run) return;
    if (prefersReducedMotion()) {
      await board.playMove('Se4xd5xe6');
    } else {
      await fakeDrag('e4', 'd5', 850, me);          // bite 1: the loupe shows the Ogre under the thumb
      if (me !== run) return;
      await wait(900);                               // the chain waits: Stop here sits in the thumb bar
      if (me !== run) return;
      await fakeDrag('d5', 'e6', 650, me);           // bite 2: the Beast goes on from d5
    }
    if (me !== run) return;
    // The real computer answers (Casual).
    await new Promise(res => {
      const t0 = Date.now();
      const poll = () => { if (me !== run || (live.history.length >= 3 && !board.busy) || Date.now() - t0 > 9000) res(); else setTimeout(poll, 120); };
      poll();
    });
    if (me !== run) return;
    await wait(1100, { instant: true });
    if (me !== run) return;
    if (prefersReducedMotion()) step(-1); else await fakeSwipe(120, me);   // swipe right: one move back
    await wait(1300, { instant: true });
    if (me !== run) return;
    toNow(1);
    await wait(800, { instant: true });
    if (me !== run) return;
    if (layout() !== 'landscape') { await openPane('story'); await wait(1600, { instant: true }); if (me === run) await closePane(); }
  },
  async reset() {
    run++;
    clearAll();
    await setForced(null);
    human = 'w';
    show(p1(), 'w');
    showDefaultPane();
  },
};

applyLayout();
human = 'w';
show(p1(), 'w');
showDefaultPane();
const first = params.get('state');
if (first) window.demo.state(first).catch(err => console.error(err));
