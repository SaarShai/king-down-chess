// Coach: "You never lose to a rule you could not see." The board explains each rule when it matters:
// a first-sight tag, hold to read, peek with danger rings, a refusal that names its rule, the ways out of
// check, and Retry after a loss. The help fades by level: Full (Beginner, Casual) or Quiet (Club, Strong).
// All rules come from the kit's engine (KD). This file writes no rule of its own.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, emblemArt } from '../../kit/icons.js';
import { $, openSheet, closeSheet, hideToast, sfx, haptic, animate, wait } from '../../kit/ui.js';

// ---- the shared positions (idea bank 6.1) ----
const POWERS = { powers: ['Frost:Freeze', 'Flame:Strike'] };
// P1 one move early, so that the board shows "Black pawn e7 to e6" as the last move.
const PRE_P1 = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const P2_FEN = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24 u0.1'; // Flame's Strike is spent
const LINE = ['Aa3*a5', 'Ab6-e3!'];                   // the shot, then Flame's Strike gives check
// A real lost game from P1: the Beginner computer plays White, the Club computer plays Black (seeded run).
const LOST = ['!F:e6', 'Se4xd5', 'Ab6-b7', 'Sd5-e5', 'a5-a4', 'Gd2-c2', 'Gc4-d5', 'Gc2-b3', 'Ab7-c6', 'f2-f3',
  'Bc8-b7', 'Se5xe6', 'Ac6*e6', 'Mf1-e2', 'Ac6-d6', 'f3-f4', 'Ad6*f4', 'Me2-d1', 'Ad6-e5', 'Oc3-b4', 'c7-c6',
  'Kg1-h1', 'Ae5-d4', 'Ob4-a5', 'Ad4*b2', 'Md1<>c1', 'Ra8-e8', 'h2-h4', 'Re8-e1', 'Kh1-h2', 'Ad4-e3', 'Bd1-g4',
  'Ae3-f4', 'Kh2-h3', 'Re1-h1'];
const STATES = ['rest', 'read', 'select', 'played', 'check', 'end', 'refusal', 'retry', 'retried', 'club'];

const p1 = () => KD.play(KD.fromFen(PRE_P1, POWERS), 'e7-e6');
const after = (s, lans) => lans.reduce((st, l) => KD.play(st, l), s);

// ---- words (ASD-STE100, eight words or fewer in play) ----
const RULES = {
  archer: ['Shoots without moving, even over pieces.', 'Steps one square. Never takes by moving.'],
  guard: ['Only a king can take it.', 'It never takes. It steps one square.'],
  maester: ['Swaps places with a friend next to it.', 'Steps and takes one square.'],
  beast: ['After each bite, it can bite again.', 'Steps one square. Bites a neighbour.'],
  ogre: ['Shoves a neighbour, then steps in.', 'Steps and takes one square.'],
  paladin: ['Jumps over its own pieces.', 'A take of more than a pawn costs it.'],
};
const CHESS = { pawn: 'No en passant here.', rook: 'No castling here.' };
const POWER_WORDS = {
  Strike: { main: 'Moves one piece like a queen, once.', sub: 'Not a pawn or the king. To an empty square.', icon: 'bolt', design: 'flame' },
  Freeze: { main: 'Freezes one enemy piece for a turn.', sub: 'Not the king. Then you make your move.', icon: 'sparkle', design: 'frost' },
};
const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const PIECE_NAMES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];
const whose = c => (c === 'w' ? 'your' : 'their');
const cap = t => t[0].toUpperCase() + t.slice(1);
const listOf = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
/** The engine's sentence in "your" and "their" words (against the computer you are White). */
function tell(text) {
  return text
    .replace(/^(White|Black) (\w+)/, (m, side, w) => (PIECE_NAMES.includes(w) ? `${side === 'White' ? 'Your' : 'Their'} ${w}` : `${side === 'White' ? 'You' : 'They'} ${w.replace(/s$/, '')}`))
    .replace(/the (white|black) /g, (m, c) => (c === 'white' ? 'your ' : 'their '));
}
/** A short line for a move of the computer, from the engine's story. */
function theirLine(st) {
  const p = st.piece, victim = st.captured[0];
  if (st.kind === 'shoot') return `Their ${p} shoots your ${victim} on ${st.capturedOn[0]}.`;
  if (st.kind === 'chain') return `Their ${p} bites ${NUM[st.captured.length].toLowerCase()} times.`;
  if (st.kind === 'push') return `Their ${p} shoves ${st.push.from} to ${st.push.to}.`;
  if (st.kind === 'swap') return `Their ${p} swaps places on ${st.to}.`;
  if (st.powerTag === 'strike') return `Their ${p} goes to ${st.to} with Strike.`;
  if (st.powerTag) return `They use ${st.power}.`;
  if (victim) return `Their ${p} takes your ${victim} on ${st.to}.`;
  return `Their ${p} goes to ${st.to}.`;
}
/** The folded Moves line: a short line for either side (the Moves sheet keeps the engine's sentence). */
function shortLine(st) {
  const W = st.side === 'w' ? 'Your' : 'Their', p = st.piece;
  if (st.kind === 'shoot') return `${W} ${p} shoots ${st.capturedOn[0]}.`;
  if (st.kind === 'chain') return `${W} ${p} bites ${listOf(st.capturedOn)}.`;
  if (st.kind === 'push') return `${W} ${p} shoves ${st.push.from} to ${st.push.to}.`;
  if (st.kind === 'swap') return `${W} ${p} swaps with ${st.to}.`;
  if (st.powerTag && st.from !== st.to) return `${W} ${p} goes to ${st.to} with ${st.power}.`;
  if (st.powerTag) return `${st.side === 'w' ? 'You' : 'They'} use ${st.power}.`;
  if (st.capturedOn.length) return `${W} ${p} takes ${st.capturedOn[0]}.`;
  return `${W} ${p} ${st.from} to ${st.to}.`;
}
/** Your special move, in the present tense (the engine's moment line is in the past tense). */
const MOMENT = {
  shoot: 'The archer shoots without moving.',
  chain: 'The beast bites, then bites again.',
  push: 'The ogre shoves, then steps in.',
  swap: 'The maester swaps places.',
};
/** The square an Archer's two-square shot flies over, or null (a neighbour shot flies over nothing). */
function shotMid(a, k) {
  const A = at(a), K = at(k), dc = Math.abs(A.col - K.col), dr = Math.abs(A.row - K.row);
  return [0, 2].includes(dc) && [0, 2].includes(dr) && dc + dr > 0 ? KD.sq.name((KD.sq.index(k) + KD.sq.index(a)) / 2) : null;
}

// ---- layout: ?frame=phone|desktop forces one layout, for the compare page ----
const params = new URLSearchParams(location.search);
const frameParam = params.get('frame');
const fitLayout = () => document.documentElement.classList.toggle('is-wide', frameParam === 'desktop' || (frameParam !== 'phone' && innerWidth >= 900));
fitLayout();
addEventListener('resize', fitLayout);

// ---- help level ----
let help = 'full';               // 'full': Beginner and Casual; 'quiet': Club and Strong
const full = () => help === 'full';

// ---- the board ----
const board = createBoard($('#board'), {
  play: { level: 'beginner', human: 'w', ms: 450, pause: 380 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap, onInspect, onMove, onSelect,
});
const nameOf = i => KD.sq.name(i);
const cellAt = sq => KD.board(board.state)[KD.sq.index(sq)];
const targetsAt = sq => board.targets.filter(m => m.path[board.pending.length] === sq);

// ---- the coach's own marks: one layer over the figures, drawn from a list so a resize redraws them ----
const NS = 'http://www.w3.org/2000/svg';
const cx = document.createElement('div');
cx.className = 'cx';
cx.setAttribute('aria-hidden', 'true');
const svg = document.createElementNS(NS, 'svg');
svg.setAttribute('viewBox', '0 0 800 800');
svg.setAttribute('preserveAspectRatio', 'none');
cx.appendChild(svg);
board.layer.appendChild(cx);
let fx = [];                     // { kind: 'arc' | 'arrow' | 'dot' | 'shield', group, ... }
const COLOURS = { danger: '#b0251b', ink: '#4d453c', gold: '#8a6212' };

function at(sq) {
  const { col, row } = board.colRow(sq);
  return { col, row, x: (col + 0.5) * 100, y: (row + 0.5) * 100 };
}
function stroke(d, tone, px, u) {
  return `<path d="${d}" fill="none" stroke="rgba(251,246,232,.9)" stroke-width="${((px + 3) * u).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path class="ink" d="${d}" fill="none" stroke="${COLOURS[tone]}" stroke-width="${(px * u).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function head(x, y, ux, uy, tone, u) {
  const s = 7 * u, w = 4.5 * u;
  const d = `M${(x - ux * s - uy * w).toFixed(1)} ${(y - uy * s + ux * w).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x - ux * s + uy * w).toFixed(1)} ${(y - uy * s - ux * w).toFixed(1)}`;
  return stroke(d, tone, 2.2, u);
}
function renderFx(f, fresh) {
  const u = 800 / Math.max(120, cx.clientWidth);
  if (f.kind === 'arc' || f.kind === 'arrow') {
    const a = at(f.from), b = at(f.to);
    const x1 = a.x, y1 = a.y - 8, x2 = b.x, y2 = b.y - 4;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const sx = x1 + ux * 26, sy = y1 + uy * 26, ex = x2 - ux * 24, ey = y2 - uy * 24;
    let d, tx = ux, ty = uy;
    if (f.kind === 'arc') {
      // A shot flies over the pieces between: the line rises and falls, it does not go through them.
      // Bow to the side of the line that faces up the screen (left, for a straight up-and-down shot).
      let nx = -uy, ny = ux;
      if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; }
      const bow = Math.max(36, len * 0.36);
      const mx = (sx + ex) / 2 + nx * bow, my = (sy + ey) / 2 + ny * bow;
      d = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const tl = Math.hypot(ex - mx, ey - my) || 1;
      tx = (ex - mx) / tl; ty = (ey - my) / tl;
    } else d = `M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = stroke(d, f.tone, f.px ?? 2.2, u) + head(ex, ey, tx, ty, f.tone, u);
    svg.appendChild(g);
    if (fresh) {
      for (const p of g.querySelectorAll('path')) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; }
      const [halo, line, ...heads] = g.querySelectorAll('path');
      for (const h of heads) h.style.opacity = '0';
      Promise.all([halo, line].map(p => animate(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' })))
        .then(() => heads.forEach(h => animate(h, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: 'forwards' })));
    }
    return;
  }
  if (f.kind === 'dot') {
    const p = at(f.sq), c = document.createElementNS(NS, 'circle');
    Object.entries({ cx: p.x, cy: p.row * 100 + 52, r: 15, fill: 'rgba(251,247,238,.82)', stroke: COLOURS.ink, 'stroke-width': (1.8 * u).toFixed(2), 'stroke-dasharray': `${(3.2 * u).toFixed(1)} ${(2.4 * u).toFixed(1)}` })
      .forEach(([k, v]) => c.setAttribute(k, v));
    svg.appendChild(c);
    if (fresh) animate(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: (f.n ?? 0) * 30, fill: 'backwards' });
    return;
  }
  // A badge on the figure: the Guard's shield (first sight, read, refusal).
  const p = at(f.sq), el = document.createElement('div');
  el.className = 'cx-shield';
  el.innerHTML = icon('shield');
  Object.assign(el.style, { left: `${(p.col + 0.84) * 12.5}%`, top: `${(p.row + 0.14) * 12.5}%` });
  // The one glint: the rule refuses a move. 300 ms, then the badge stays still.
  if (fresh && f.glint) animate(el, [{ transform: 'translate(-50%, -50%) scale(.5)', boxShadow: '0 0 0 0 rgba(201,154,62,.9)' }, { transform: 'translate(-50%, -50%) scale(1.25)', boxShadow: '0 0 0 6px rgba(201,154,62,.45)', offset: 0.55 }, { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 1px 4px rgba(40,28,10,.35)' }], { duration: 320, easing: 'ease-out' });
  else if (fresh) animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
  cx.appendChild(el);
}
function drawFx() {
  svg.replaceChildren();
  for (const el of [...cx.children]) if (el !== svg) el.remove();
  for (const f of fx) renderFx(f, false);
}
function addFx(...list) { for (const f of list) { fx.push(f); renderFx(f, true); } }
function clearFx(group) {
  const before = fx.length;
  fx = group ? fx.filter(f => f.group !== group) : [];
  if (fx.length !== before || !group) drawFx();
}
new ResizeObserver(() => drawFx()).observe(cx);

// ---- the coach line: one fixed area, one message at a time ----
const coach = $('#coach');
let base = null;                 // the message under a passing one (a peek)
function glyphHtml(g, tone) {
  if (!g) return '';
  const inner = typeof g === 'string' ? icon(g) : pieceIcon(g.type, g.color);
  return `<span class="glyph${tone ? ' is-' + tone : ''}" aria-hidden="true">${inner}</span>`;
}
function say(msg, { passing = false } = {}) {
  if (!passing) base = msg;
  coach.classList.toggle('is-card', !!msg.card);
  if (msg.card) {
    const { src, name, owner, rule, sub, ruleIcon, legend } = msg.card;
    coach.innerHTML = `<img class="figure" src="${src}" alt="">
      <p class="name">${name} <small>· ${owner}</small></p>
      <p class="rule">${ruleIcon ? icon(ruleIcon) : ''}<span>${rule}</span></p>
      ${sub ? `<p class="sub">${sub}</p>` : ''}${legend ? `<p class="legend"><i aria-hidden="true"></i>${legend}</p>` : ''}`;
  } else {
    coach.innerHTML = `${glyphHtml(msg.glyph, msg.tone)}<p class="main">${msg.main}</p>${msg.sub ? `<p class="sub">${msg.sub}</p>` : ''}${msg.extra ?? ''}`;
  }
  animate(coach, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
const restore = () => base && say(base);

function restLine() {
  const st = board.state && KD.status(board.state);
  if (st?.check && board.isHuman(st.turn)) return showCheck();
  const sub = !full() ? null : tagShown ? `New: the ${tagShown}. Hold it to read.` : 'Hold any piece to read it.';
  say({ glyph: 'eye', main: 'Your move.', sub });
}

// ---- first sight: one quiet badge on a new piece type, its name in the coach line (Full help, until the first read or move) ----
let tagShown = null;             // the piece type the badge marks
function showTag(sq) {
  tagShown = cellAt(sq).type;
  addFx({ kind: 'shield', sq, group: 'tag' });
}
function foldTag() { if (tagShown) { tagShown = null; clearFx('tag'); } }

// ---- hold to read: the piece's reach as quiet dots, its card in the coach area ----
function reachOf(sq, c) {
  let s = board.state;
  if (KD.status(s).turn !== c.color) {
    const f = KD.toFen(s).split(' ');
    f[1] = c.color;
    try { s = KD.fromFen(f.join(' '), { powers: board.state.kings }); } catch { return []; }
  }
  return [...new Set(KD.legal(s, sq).filter(m => !m.needsArming && !m.power).map(m => m.path[0]))];
}
function readPiece(sq, c) {
  foldTag();
  clearFx('read');
  const reach = reachOf(sq, c);
  addFx(...reach.map((s, n) => ({ kind: 'dot', sq: s, n, group: 'read' })));
  if (c.type === 'guard') addFx({ kind: 'shield', sq, group: 'read' });
  const king = c.type === 'king' && board.state.kings?.[c.color === 'w' ? 0 : 1];
  const [rule, sub] = RULES[c.type] ?? (c.type === 'king'
    ? ['Steps one square.', `${c.color === 'w' ? 'Keep it out of check.' : 'Checkmate it to win.'}${king?.power ? ` Power: ${king.power}.` : ''}`]
    : ['Moves as in chess.', CHESS[c.type] ?? null]);
  say({ card: {
    src: pieceArt(c.type, c.color, c.type === 'king' ? (c.design ?? undefined) : undefined),
    name: king ? `${king.king} king` : cap(c.type),
    owner: `${whose(c.color)} piece`, rule, ruleIcon: c.type === 'guard' ? 'shield' : null,
    sub, legend: !reach.length ? null : c.color === 'b' ? 'Where it can go. Not their plan.' : 'Where it can go.',
  } });
  board.say?.(`${cap(whose(c.color))} ${c.type}. ${rule} ${sub ?? ''}`);
}
function clearRead() { if (fx.some(f => f.group === 'read')) clearFx('read'); }

// ---- peek: hold a target, and each enemy that could take you there gets a ring (Full help) ----
// The move shows as see-through ghosts where the pieces would stand; the other move marks dim.
let peeked = null, ghosts = [];
function ghost(cell, sq) {
  const g = board.makeFig(cell);
  g.classList.add('cx-ghost');
  board.place(g, sq, 1);
  board.layer.appendChild(g);
  ghosts.push(g);
}
function clearGhosts() {
  for (const g of ghosts) g.remove();
  ghosts = [];
  for (const el of board.layer.querySelectorAll('.cx-gone')) el.classList.remove('cx-gone');
  $('#board').classList.remove('is-peek');
}
function peekAt(sq, { lead = null } = {}) {
  if (!full() || board.selected == null || !board.state) return;
  const moves = targetsAt(sq);
  if (!moves.length) return clearPeek();
  if (peeked === sq) return;
  clearPeek(false);
  const m = moves.find(x => x.path.length === board.pending.length + 1) ?? moves[0];
  const st = KD.describe(board.state, m);
  if (st.again || st.over) return;
  const dest = st.to;
  const hits = KD.legal(st.next).filter(x => x.captures.includes(dest));
  const from = [...new Set(hits.map(x => x.from))];
  peeked = sq;
  // The pieces the move takes or shoves fade; ghosts show where the mover and a shoved piece would stand.
  const cells = KD.board(board.state), cellOf = s => cells[KD.sq.index(s)];
  board.hideGhost?.();
  $('#board').classList.add('is-peek');
  for (const s of [...st.capturedOn, ...(st.push ? [st.push.from] : [])]) board.figure(s)?.classList.add('cx-gone');
  if (st.push && cellOf(st.push.from)) ghost(cellOf(st.push.from), st.push.to);
  if (st.to !== st.from) ghost(cellOf(st.from), st.to);
  if (from.length) board.mark(from, 'threat');
  addFx(...from.map(f => ({ kind: hits.find(h => h.from === f).kind === 'shoot' ? 'arc' : 'arrow', from: f, to: dest, tone: 'danger', group: 'peek' })));
  const names = [...new Set(from.map(f => cellAt(f).type))];
  const danger = !from.length ? 'No piece can take it there.'
    : from.length > 2 ? `${NUM[from.length]} pieces can take it there.`
    : `Their ${listOf(names)} can take it there.`;
  const tone = from.length ? 'danger' : null;
  say(lead ? { glyph: from.length ? 'target' : 'undo', tone, main: lead, sub: danger }
    : { glyph: from.length ? 'target' : 'check', tone, main: danger, sub: 'A tap still plays the move.' }, { passing: true });
}
function clearPeek(back = true) {
  if (peeked == null) return;
  peeked = null;
  board.clearMarks('threat');
  clearGhosts();
  clearFx('peek');
  if (back) restore();
}
// Mouse: rest on a target. Touch: hold a target; after a peek the lift plays nothing, a new tap plays.
// Keyboard: the cursor.
{
  let timer = 0, overSq = null, heldPeek = null;
  const host = $('#board');
  host.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const i = board.squareAtPoint(e.clientX, e.clientY), sq = i == null ? null : nameOf(i);
    if (sq === overSq) return;
    overSq = sq; clearTimeout(timer);
    if (sq && targetsAt(sq).length) timer = setTimeout(() => peekAt(sq), 220); else clearPeek();
  });
  // A touch lift also sends pointerleave: only the mouse leaving the board clears the peek.
  host.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; overSq = null; clearTimeout(timer); clearPeek(); });
  host.addEventListener('pointerdown', e => {
    heldPeek = null;
    if (e.pointerType === 'mouse') return;
    const i = board.squareAtPoint(e.clientX, e.clientY), sq = i == null ? null : nameOf(i);
    clearTimeout(timer);
    if (sq && board.selected != null && targetsAt(sq).length) {
      timer = setTimeout(() => { peekAt(sq); if (peeked === sq) heldPeek = e.pointerId; }, 260);
    }
  });
  // Reading the threat never commits the move: a lift after a peek reaches the board as a cancel.
  host.addEventListener('pointerup', e => {
    if (heldPeek == null || e.pointerId !== heldPeek) return;
    heldPeek = null;
    e.stopPropagation();
    board.el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: e.pointerId, pointerType: e.pointerType, bubbles: true }));
  }, { capture: true });
  for (const t of ['pointerup', 'pointercancel']) host.addEventListener(t, () => clearTimeout(timer));
  board.el.addEventListener('keydown', e => {
    if (!e.key.startsWith('Arrow') || board.selected == null) return;
    const sq = nameOf(board.cursor);
    if (targetsAt(sq).length) peekAt(sq); else clearPeek();
  });
}

// ---- a refusal names its rule, and points at the cause ----
function withPiece(fen, sq, ch) {
  const [placement, ...rest] = fen.split(' ');
  const rows = placement.split('/').map(r => r.replace(/\d/g, d => '.'.repeat(+d)).split(''));
  rows[8 - +sq[1]][sq.charCodeAt(0) - 97] = ch;
  return [rows.map(r => r.join('').replace(/\.+/g, m => m.length)).join('/'), ...rest].join(' ');
}
/** Why the rules refuse `from` onto `to`. The engine decides: the same move onto a knight would be legal. */
function refusalFor(from, to) {
  const s = board.state, mover = cellAt(from), target = cellAt(to);
  if (!mover || !target || target.color === mover.color) return null;
  if (target.type === 'guard' && mover.type !== 'king') {
    try {
      const alt = KD.fromFen(withPiece(KD.toFen(s), to, target.color === 'b' ? 'n' : 'N'), { powers: s.kings });
      if (KD.legal(alt, from).some(m => m.captures.includes(to))) return 'guard';
    } catch { return null; }
  }
  return null;
}
function refuse(from, to) {
  clearPeek(false); clearRead(); foldTag();
  sfx.play?.('tap'); haptic(8);           // a muffled knock, never a buzzer
  addFx({ kind: 'shield', sq: to, glint: true, group: 'refuse' });
  say({ glyph: 'shield', main: 'Only a king can take a guard.', sub: full() ? 'A guard never takes, either.' : null });
  board.say?.('Not allowed. Only a king can take a guard.');
}

// ---- check: the cause, and the ways out (Full help) ----
function attackersOfKing(s) {
  const st = KD.status(s);
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === st.turn);
  if (!king) return { king: null, from: [] };
  const f = KD.toFen(s).split(' ');
  f[1] = st.turn === 'w' ? 'b' : 'w';
  let hits = [];
  try { hits = KD.legal(KD.fromFen(f.join(' '), { powers: s.kings })).filter(m => m.captures.includes(king.sq)); } catch { /* no flip */ }
  return { king: king.sq, hits };
}
const VERB = { capture: 'Take', chain: 'Bite', shoot: 'Shoot', push: 'Shove', swap: 'Swap', move: 'Block', power: 'Move', promote: 'Promote' };
function showCheck() {
  const s = board.state, { king, hits } = attackersOfKing(s);
  clearFx('check');
  board.clearMarks('hint');
  const from = [...new Set(hits.map(h => h.from))];
  addFx(...from.map(f => ({ kind: hits.find(h => h.from === f).kind === 'shoot' ? 'arc' : 'arrow', from: f, to: king, tone: 'danger', px: 2.6, group: 'check' })));
  let main = 'Check.';
  if (from.length === 1) {
    const a = from[0], c = cellAt(a), mid = c.type === 'archer' ? shotMid(a, king) : null;
    main = mid && cellAt(mid) ? `Check: their archer shoots over ${mid}.` : `Check from their ${c.type} on ${a}.`;
  }
  if (!full()) return say({ glyph: 'target', tone: 'danger', main });
  // The ways out: every legal answer, one chip a piece, its verb from the engine's move kind.
  // A plain move of the king steps out; a plain move of another piece blocks.
  const ways = [];
  for (const m of KD.legal(s).filter(x => !x.needsArming)) {
    if (ways.some(w => w.from === m.from)) continue;
    const c = cellAt(m.from);
    const verb = c.type === 'beast' && m.captures.length ? 'Bite' : c.type === 'king' && m.kind === 'move' ? 'Step' : VERB[m.kind] ?? 'Move';
    ways.push({ from: m.from, to: m.path[0], type: c.type, verb });
  }
  // Remove the cause first, then move the king, then the rest.
  const rank = w => (['Take', 'Bite', 'Shoot'].includes(w.verb) ? 0 : w.type === 'king' ? 1 : 2);
  ways.sort((a, b) => rank(a) - rank(b));
  board.mark(ways.map(w => w.from), 'hint');
  const n = NUM[ways.length] ?? String(ways.length);
  say({
    glyph: 'target', tone: 'danger', main,
    // Four chips at most; the board marks every piece that can answer.
    sub: ways.length === 1 ? 'One way out. Tap it.' : ways.length <= 4 ? `${n} ways out. Tap one.` : `${n} ways out. The board marks them all.`,
    extra: `<div class="ways" role="group" aria-label="Ways out of check">${ways.slice(0, 4).map(w =>
      `<button type="button" class="chip" data-from="${w.from}" data-to="${w.to}" aria-pressed="false" aria-label="${w.verb}: ${w.type} on ${w.from}">${pieceIcon(w.type, 'w')}<span>${w.verb}</span></button>`).join('')}</div>`,
  });
}
function pickWay(b) {
  for (const c of coach.querySelectorAll('.ways .chip')) c.setAttribute('aria-pressed', String(c === b));
  board.selectSquare(b.dataset.from);
}
coach.addEventListener('click', e => {
  const b = e.target.closest('.ways .chip');
  if (!b || board.busy) return;
  pickWay(b);
  if (e.detail === 0) {                       // keyboard: go to the board, on the answer; Enter plays it
    board.cursor = KD.sq.index(b.dataset.to);
    board.moveCursorMark();
    board.el.focus();
  }
});

// ---- the end: a win names the rule that won; a loss offers Retry from the move that turned it ----
let retryPly = null;
/** The kit's fallen king falls to the right; on the g and h files it falls inward, so it stays on the board. */
function fallInward() {
  for (let i = 0; i < 64; i++) {
    const sq = KD.sq.name(i), el = board.figure(sq);
    if (el) el.classList.toggle('fall-in', el.classList.contains('is-fallen') && board.colRow(sq).col >= 6);
  }
}
/** The Archer rule that acted in this shot, from where she stands and where the king stands. */
function shotRule(a, k) {
  const mid = shotMid(a, k);
  if (mid && cellAt(mid)) return 'Her shot gives check, even over a piece.';
  const A = at(a), K = at(k), dc = Math.abs(A.col - K.col), dr = Math.abs(A.row - K.row);
  if (dc === 1 && dr === 1) return 'She shoots a diagonal neighbour.';
  if (dc === 2 && dr === 2) return 'She shoots two squares on a forward diagonal.';
  return 'She shoots two squares in a straight line.';
}
function showEnd(story) {
  const s = board.state, st = KD.status(s);
  clearFx(); board.clearMarks('hint');
  fallInward();
  if (st.winner === 'w') {
    const kingSq = story.after.find(c => c && c.type === 'king' && c.color === 'b')?.sq;
    if (kingSq) addFx({ kind: story.piece === 'archer' ? 'arc' : 'arrow', from: story.to, to: kingSq, tone: 'gold', px: 2.6, group: 'end' });
    const rule = story.piece === 'archer' && kingSq ? shotRule(story.to, kingSq)
      : RULES[story.piece] ? `${cap(story.piece)}: ${RULES[story.piece][0].charAt(0).toLowerCase()}${RULES[story.piece][0].slice(1)}` : null;
    say({ glyph: 'trophy', tone: 'gold', main: 'Checkmate. You win.', sub: `Your ${story.piece} gives checkmate from ${story.to}.`,
      extra: rule && full() ? `<div class="key">${pieceIcon(story.piece, 'w')}<p><small>The rule that won</small>${rule}</p></div>` : '' });
    setBar('won');
    return;
  }
  if (st.winner === 'b') {
    // The turn of the game: your last move after which they took a piece (not a pawn).
    const plies = s.history.length;
    let chain = [s];
    while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
    retryPly = null; let lost = null;
    for (let i = plies - 1; i >= 1; i--) {
      const h = s.history[i];
      const story2 = KD.describe(chain[i], h.lan);
      if (story2.side === 'b' && story2.captured.some(t => t !== 'pawn') && i >= 1 && s.history[i - 1] && KD.describe(chain[i - 1], s.history[i - 1].lan).side === 'w') {
        retryPly = i - 1; lost = story2; break;
      }
    }
    const n = retryPly != null ? KD.status(chain[retryPly]).moveNumber : null;
    // The cause of the mate, as at every check: a line from each piece that gives it.
    const { king, hits } = attackersOfKing(s);
    for (const f of new Set((hits ?? []).map(h => h.from))) addFx({ kind: hits.find(h => h.from === f).kind === 'shoot' ? 'arc' : 'arrow', from: f, to: king, tone: 'danger', px: 2.6, group: 'end' });
    say({ glyph: 'flag', main: `Checkmate on move ${st.moveNumber - 1}.`, sub: 'You lose this one.',
      extra: lost ? `<div class="key">${pieceIcon(lost.piece, 'b')}<p><small>The turn · move ${n}</small>Their ${lost.piece} ${lost.kind === 'shoot' ? 'shot' : 'took'} your ${lost.captured.find(t => t !== 'pawn')}.</p></div>` : '' });
    setBar('lost', full() ? n : null);    // Retry belongs to Full help
    return;
  }
  say({ glyph: 'flag', main: st.text });
  setBar('won');
}
async function retry() {
  if (retryPly == null) return;
  let s = board.state;
  while (s.history.length > retryPly) s = KD.undo(s);
  const next = board.state.history[retryPly]?.lan;
  show(s, { human: 'w' });
  const again = { glyph: 'undo', main: `Move ${KD.status(s).moveNumber} again.` };
  say(again);
  // Your move from that game, selected, with the peek that would have warned you.
  const m = next && KD.legal(s).find(x => x.lan === next);
  if (m && full()) {
    board.selectSquare(m.from);
    peekAt(m.path[0], { lead: again.main });
    base = again;
  }
}

// ---- strips, powers, moves line, bar ----
function thinking(on) {
  const sub = $('#them-sub');
  sub.classList.toggle('is-thinking', on);
  sub.textContent = on ? 'Thinks' : `Computer · ${cap(board.play.level)}`;
}
function renderPowers() {
  const s = board.state;
  for (const [id, side, name] of [['#their-power', 'b', 'Strike'], ['#my-power', 'w', 'Freeze']]) {
    const btn = $(id), left = s ? KD.usesLeft(s, side) : 1;
    btn.dataset.used = String(left === 0);
    btn.querySelector('.power-uses').textContent = left === 0 ? 'used' : String(left);
    btn.setAttribute('aria-label', `${side === 'w' ? 'Your' : 'Their'} power ${name}: ${left === 0 ? 'used' : `${left} use left`}`);
  }
}
$('#their-power .power-icon').innerHTML = icon('bolt');
$('#my-power .power-icon').innerHTML = icon('sparkle');
function readPower(name, owner) {
  const w = POWER_WORDS[name];
  say({ card: { src: emblemArt(w.design), name, owner: `${owner} power`, rule: w.main, sub: w.sub } });
}
$('#their-power').addEventListener('click', () => { clearPeek(false); readPower('Strike', 'their'); });
$('#my-power').addEventListener('click', () => {
  const s = board.state, btn = $('#my-power');
  if (!s || KD.usesLeft(s, 'w') === 0 || KD.status(s).turn !== 'w' || KD.status(s).over || board.busy) return readPower('Freeze', 'your');
  if (board.armed === 'freeze') { board.arm(null); btn.setAttribute('aria-pressed', 'false'); return restLine(); }
  board.arm('freeze');
  btn.setAttribute('aria-pressed', 'true');
  say({ glyph: 'sparkle', main: 'Freeze: tap an enemy piece.', sub: full() ? 'Then you still make your move.' : null });
});

let stories = [];
function storiesOf(state) {
  const chain = [state];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  return state.history.map((h, i) => ({ ...KD.describe(chain[i], h.lan), n: KD.status(chain[i]).moveNumber }));
}
function renderMoves() {
  stories = board.state ? storiesOf(board.state) : [];
  const last = stories.at(-1);
  $('#moves-icon').innerHTML = last ? pieceIcon(last.piece, last.side) : '';
  $('#moves-text').textContent = last ? shortLine(last) : 'No moves yet.';
  $('#moves-open').innerHTML = `<span>Moves</span>${icon('chevron-down')}`;
  $('#story').innerHTML = stories.map(st => `<li><span class="num">${st.n}${st.side === 'w' ? '.' : '…'}</span>${pieceIcon(st.piece, st.side)}<div><p>${tell(st.text)}</p>${st.moment ? `<small>${st.moment}</small>` : ''}</div></li>`).join('') || '<li><p class="muted">No moves yet.</p></li>';
}
$('#moves-line').addEventListener('click', () => openSheet('moves-sheet'));

const bar = $('#bar');
const barBtn = (act, ic, text, cls = 'btn-quiet') => `<button type="button" class="btn ${cls}" data-act="${act}">${icon(ic)}<span>${text}</span></button>`;
function setBar(mode, n) {
  bar.classList.toggle('is-end', mode !== 'play');
  if (mode === 'play') bar.innerHTML = barBtn('hint', 'hint', 'Hint') + barBtn('undo', 'undo', 'Undo') + barBtn('menu', 'menu', 'Menu');
  else bar.innerHTML = (mode === 'lost' && n != null ? barBtn('retry', 'undo', `Retry from move ${n}`, 'btn-primary') + barBtn('rematch', 'swords', 'Rematch')
    : barBtn('rematch', 'swords', 'Rematch', 'btn-primary') + barBtn('review', 'moves', 'Review'))
    + `<button type="button" class="btn btn-icon" data-act="menu" aria-label="Menu">${icon('menu')}</button>`;
}
bar.addEventListener('click', async e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'menu') openSheet('menu-sheet');
  else if (act === 'undo') undo();
  else if (act === 'hint') hint();
  else if (act === 'retry') retry();
  else if (act === 'rematch') reset();
  else if (act === 'review') openSheet('moves-sheet');
});
function undo() {
  let s = board.state;
  if (!s || board.busy || s.history.length <= 1) return;
  s = KD.undo(s);
  while (s.history.length > 1 && KD.status(s).turn !== 'w') s = KD.undo(s);
  show(s, { human: board.play.human === 'both' ? 'both' : 'w' });
  restLine();
}
async function hint() {
  const s = board.state;
  if (!s || board.busy || KD.status(s).over || !board.isHuman(KD.status(s).turn)) return;
  say({ glyph: 'hint', main: 'Looking for a good move.' }, { passing: true });
  const m = await KD.think(s, { level: 'club', ms: 450 });
  if (board.state !== s || !m) return;
  if (m.needsArming) return say({ glyph: 'hint', tone: 'gold', main: `Hint: use ${m.powerName}.` });
  board.selectSquare(m.from);
  board.mark(m.path[0], 'hint');
  say({ glyph: 'hint', tone: 'gold', main: `Hint: your ${cellAt(m.from).type} to ${m.path.at(-1)}.` });
}

// ---- the menu: one Board help choice ----
$('#menu-close').innerHTML = icon('close');
$('#moves-close').innerHTML = icon('close');
$('#restart').innerHTML = `${icon('undo')}<span>Start again from move 12</span>`;
$('#restart').addEventListener('click', async () => { await closeSheet('menu-sheet'); reset({ keepHelp: true }); });
// The Menu switch changes only the marks. The computer's level stays as it was at New game.
for (const r of document.querySelectorAll('input[name="help"]')) r.addEventListener('change', () => { setHelp(r.value); refreshHelp(); });
/** level: true for a new game, where the help takes its default from the computer's level. */
function setHelp(v, { level = false } = {}) {
  help = v === 'quiet' ? 'quiet' : 'full';
  if (level) board.play.level = full() ? 'beginner' : 'club';
  for (const r of document.querySelectorAll('input[name="help"]')) r.checked = r.value === help;
  thinking($('#them-sub').classList.contains('is-thinking'));
}
function refreshHelp() {
  clearPeek(false); clearRead();
  if (!full()) foldTag();
  const st = board.state && KD.status(board.state);
  if (st?.over) return;
  if (st?.check) return showCheck();
  board.clearMarks('hint');
  restLine();
}

// ---- the board's events ----
let selections = 0;
function onTap(sq, cell) {
  clearRead();
  if (peeked) clearPeek(false);        // the ghosts go; a tap on the peeked square still plays
  const s = board.state;
  if (!s || board.busy || board.armed) return;
  const st = KD.status(s);
  if (st.over || !board.isHuman(st.turn)) return;
  const sel = board.selected != null ? nameOf(board.selected) : null;
  if (sel && sq !== sel && cell && cell.color !== st.turn && !targetsAt(sq).length && refusalFor(sel, sq)) { refuse(sel, sq); return false; }
  if (cell && cell.color === st.turn && sq !== sel && !KD.legal(s, sq).some(m => !m.needsArming)) {
    if (st.check) { say({ glyph: 'target', tone: 'danger', main: 'Answer the check first.', sub: full() ? 'The marked pieces can do it.' : null }); return false; }
    say({ glyph: { type: cell.type, color: cell.color }, main: `This ${cell.type} has no move now.` });
    return false;
  }
}
function onInspect(sq, cell) {
  if (board.selected != null && targetsAt(sq).length) return peekAt(sq);
  readPiece(sq, cell);
}
function onSelect(sq) {
  clearFx('refuse');
  if (sq == null) { clearPeek(false); if (board.state && !KD.status(board.state).over) restLine(); return; }
  foldTag();
  const c = cellAt(sq), st = KD.status(board.state);
  if (st.check) return;               // the check line and its chips stay
  selections++;
  const words = RULES[c.type] && c.type !== 'king' && full() ? RULES[c.type][0] : null;
  say({ glyph: { type: c.type, color: c.color }, main: words ? `${cap(c.type)}: ${words.charAt(0).toLowerCase()}${words.slice(1)}` : `Your ${c.type}.`,
    sub: full() && selections <= 3 ? 'Hold a marked square to peek.' : null });
}
function onMove(story) {
  renderMoves(); renderPowers();
  clearPeek(false); foldTag(); clearFx(); board.clearMarks('hint');
  $('#my-power').setAttribute('aria-pressed', 'false');
  const st = KD.status(board.state);
  if (st.over) { thinking(false); return showEnd(story); }
  if (story.side === 'w') {
    if (story.powerTag === 'freeze') say({ glyph: 'sparkle', main: 'Frozen for a turn. Now your move.' });
    else if (story.moment && full()) {
      if (story.kind === 'shoot') addFx({ kind: 'arc', from: story.from, to: story.capturedOn[0], tone: 'gold', group: 'cause' });
      say({ glyph: { type: story.piece, color: 'w' }, tone: 'gold', main: MOMENT[story.kind] ?? story.moment });
    }
    else say({ glyph: 'clock', main: 'Their turn.' });
    if (!board.isHuman(st.turn)) thinking(true);
    return;
  }
  thinking(false);
  if (story.powerTag) animate($('#their-power'), [{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  // Their move's cause line stays until you move (both help levels).
  if (!st.check) {
    if (story.kind === 'shoot') addFx({ kind: 'arc', from: story.from, to: story.capturedOn[0], tone: 'ink', group: 'cause' });
    else if (story.from !== story.to) addFx({ kind: 'arrow', from: story.from, to: story.to, tone: 'ink', group: 'cause' });
  }
  if (st.check) return showCheck();
  say({ glyph: { type: story.piece, color: 'b' }, main: theirLine(story), sub: 'Your move.' });
}

// ---- show a game ----
function show(state, { human = 'w' } = {}) {
  board.play.human = human;
  board.arm(null);
  board.setState(state);
  clearFx(); clearGhosts(); peeked = null; tagShown = null;
  board.clearMarks('hint'); board.clearMarks('threat');
  renderMoves(); renderPowers(); setBar('play'); thinking(false);
  $('#my-power').setAttribute('aria-pressed', 'false');
}
async function closeAll() {
  hideToast();
  for (const id of ['menu-sheet', 'moves-sheet']) if ($('#' + id).open) $('#' + id).close();
}
function rest() {
  if (full()) showTag('c4');
  restLine();
}
function reset({ keepHelp = false } = {}) {
  run++;
  closeAll();
  if (!keepHelp) setHelp('full', { level: true });
  selections = 0;
  show(p1(), { human: 'w' });
  rest();
}

// ---- the demo contract ----
let run = 0;
/** The real lost game from P1, at its last move: the mate and Retry. */
function showLost() {
  const s = after(p1(), LOST.slice(0, -1));
  const st = KD.describe(s, LOST.at(-1));
  show(st.next, { human: 'both' });
  board.figure(st.after.find(c => c && c.type === 'king' && c.color === 'w').sq)?.classList.add('is-fallen');
  showEnd(st);
}
async function state(name) {
  const me = ++run;
  await closeAll();
  setHelp(name === 'club' ? 'quiet' : 'full', { level: true });
  selections = 0;
  switch (name) {
    case 'rest': show(p1(), { human: 'both' }); rest(); break;
    case 'read': show(p1(), { human: 'both' }); readPiece('c4', cellAt('c4')); break;
    case 'select': show(p1(), { human: 'both' }); selections = 3; board.selectSquare('c3'); peekAt('c4'); break;
    case 'refusal': show(p1(), { human: 'both' }); board.selectSquare('d3'); refuse('d3', 'c4'); break;
    case 'played': {
      show(p1(), { human: 'both' });
      board.selectSquare('d3');
      await wait(350, { instant: true }); if (me !== run) return;
      refuse('d3', 'c4');
      await wait(900, { instant: true }); if (me !== run) return;
      board.clearSelection();
      await board.playMove('Aa3*a5');
      break;
    }
    case 'check': case 'club': show(after(p1(), LINE), { human: 'both' }); showCheck(); break;
    case 'end': {
      show(KD.fromFen(P2_FEN, POWERS), { human: 'both' });
      await board.playMove('Ae5-f6');
      break;
    }
    case 'retry': showLost(); break;
    case 'retried': showLost(); await retry(); break;    // Retry from move 17: the peek that would have warned you
    default: throw new Error(`demo.state: no state "${name}"`);
  }
}
// The story: the refusal teaches, the shot lands, their Strike gives check, the ways out glow, you answer.
async function play() {
  const me = ++run;
  await closeAll();
  setHelp('full', { level: true });
  selections = 0;
  show(p1(), { human: 'both' });
  rest();
  const step = async ms => { await wait(ms, { instant: true }); return me === run; };
  if (!await step(1500)) return;
  board.selectSquare('d3');
  if (!await step(800)) return;
  refuse('d3', 'c4');
  if (!await step(2200)) return;
  board.clearSelection();
  board.selectSquare('a3');
  if (!await step(1200)) return;
  await board.playMove('Aa3*a5');
  if (!await step(1300) ) return;
  thinking(true);
  if (!await step(900)) return;
  await board.playMove('Ab6-e3!');
  if (!await step(2600)) return;
  const pawn = coach.querySelector('.ways .chip[data-from="f2"]');
  if (pawn) pickWay(pawn);
  if (!await step(1100)) return;
  await board.playMove('f2xe3');
  if (!await step(1200)) return;
  say({ glyph: 'check', tone: 'gold', main: 'Check answered.', sub: 'Their Strike is spent now.' });
  await wait(800, { instant: true });
}
window.demo = { state, play, reset: async () => reset() };

// First view: ?state= shows a named state (the compare page uses it); else the game, ready to play.
const want = params.get('state');
if (want && STATES.includes(want)) state(want); else reset();
