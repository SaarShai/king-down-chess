// Read any piece: tap to read in the context area (A), hold for a quick look (B), or the "?" lens (C).
// Reading never plays a move. A tap on a marked target of your selected piece still plays it.
// Every reach on the board comes from the engine (KD.legal), never from rules written here.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, openSheet, toast, hideToast, wait, prefersReducedMotion, haptic } from '../../kit/ui.js';

const HUMAN = 'w';
const POWERS = { powers: ['Frost:Freeze', 'Flame:Strike'] };
// P1 of the idea bank (a Kings' powers game, move 12), reached by its last move: Black pawn e7 to e6.
const PRE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const p1 = () => KD.play(KD.fromFen(PRE, POWERS), 'e7-e6');
const checkPos = () => KD.play(KD.play(p1(), 'Aa3*a5'), 'Ab6-e3!');   // their Strike: the Archer gives check over f2
const frozenPos = () => KD.play(p1(), '!F:b6');                          // you froze their Archer (a free action)

const idx = sq => KD.sq.index(sq);
const NAME = { pawn: 'Pawn', knight: 'Knight', bishop: 'Bishop', rook: 'Rook', queen: 'Queen', king: 'King', archer: 'Archer', paladin: 'Paladin', guard: 'Guard', maester: 'Maester', beast: 'Beast', ogre: 'Ogre' };
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
/** A piece's name in running text: King Down pieces keep their capital, as in the rules. */
const pname = type => (NEW.has(type) ? NAME[type] : NAME[type].toLowerCase());
/** The verb that the spec gives each piece for a take (king-down-facts.md section 2, W17). */
const verbOf = type => (type === 'archer' ? 'shoot' : type === 'beast' ? 'bite' : 'take');
// One line for each piece, eight words or fewer a sentence (king-down-facts.md section 2).
const LINE = {
  pawn: 'Steps forward. Takes on the forward diagonal.',
  knight: 'Jumps in an L, over any piece.',
  bishop: 'Moves any distance on a diagonal.',
  rook: 'Moves any distance in a straight line.',
  queen: 'Moves any distance in any line.',
  archer: 'Shoots without moving, even over pieces.',
  paladin: 'Jumps its own pieces. It leaves when it takes more than a pawn.',
  guard: 'Only a king can take it.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
};
// The Guide page: the official rule in short sentences (docs/RULES.md through king-down-facts.md).
const RULES = {
  archer: ['The Archer steps one square in any direction.', 'It never takes by moving. It shoots without moving.', 'It shoots an enemy diagonally next to it.', 'It shoots two squares away in a straight line.', 'It shoots two squares away on a forward diagonal.', 'The shot goes over other pieces.'],
  guard: ['The Guard steps one square in any direction, onto an empty square.', 'It never takes.', 'Only a king can take it. A Beast, an Ogre or a Paladin cannot.', 'It blocks lines like any piece. An Ogre can push it.'],
  beast: ['The Beast steps one square in any direction, onto an empty square.', 'It takes any enemy next to it.', 'After each take, it can take again from its new square.', 'A chain never takes a king after the first bite.'],
  ogre: ['The Ogre steps and takes one square in any direction.', 'It can push a neighbour, friend or enemy, one square straight away onto an empty square. Then it steps into the space.', 'It never pushes a king.'],
  maester: ['The Maester steps one square in any direction and takes an enemy next to it.', 'It can swap places with a friend next to it.', 'When it and its king both stand on their first rank, they can swap from any distance.'],
  paladin: ['The Paladin moves like a queen and jumps over its own pieces. An enemy stops it.', 'It can never take a king.', 'It leaves the board after it takes anything but a pawn.'],
  pawn: ['The pawn steps forward and takes one square diagonally forward.', 'It promotes to a queen, rook, bishop or knight.', 'There is no en passant.'],
  knight: ['The knight jumps in an L: two squares one way, one square to the side.', 'It jumps over any piece.'],
  bishop: ['The bishop moves any distance on a diagonal.', 'A piece in the way stops it.'],
  rook: ['The rook moves any distance in a straight line.', 'A piece in the way stops it.'],
  queen: ['The queen moves any distance in a straight line or on a diagonal.', 'A piece in the way stops it.'],
  king: ['The king steps one square in any direction.', 'Mate the king to win. There is no castling.'],
};
const POWER_LINE = { Freeze: 'Freeze: stops an enemy piece for a turn.', Strike: 'Strike: a piece moves like a queen. No take.' };

// ---- icons that the kit does not have ----
const SNOW = 'M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.4 4.4 12 6.8l2.6-2.4M9.4 19.6 12 17.2l2.6 2.4M4.2 11l3.1.9-.8 3.2M19.8 13l-3.1-.9.8-3.2M4.6 13.4l2.7-1.5M19.4 10.6l-2.7 1.5';
const ico = (name, cls = '') => (name === 'snow'
  ? `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${SNOW}"/></svg>`
  : icon(name, { className: cls }));

// ---- reduced-motion-safe animation that never leaves inline styles behind ----
const anim = (el, frames, opts) => (prefersReducedMotion() || !el?.animate ? Promise.resolve() : el.animate(frames, opts).finished.catch(() => {}));

// ---- the engine's view of a piece ----

/** The same position with `side` to move, so the engine can say what an enemy piece reaches. */
function asSide(s, side) {
  const f = KD.toFen(s).split(' ');
  if (f[1] === side) return s;
  f[1] = side;
  try { return KD.fromFen(f.join(' '), { powers: s.kings, cards: s.hands }); } catch { return null; }
}

/** Freeze and Ice Wall marks in the position: { sq: 'frozen' | 'warded' }. */
function marksOf(s) {
  const out = {};
  if (!s) return out;
  const extra = KD.toFen(s).split(' ').slice(6).join(' ').replace(/\//g, ' ');
  for (const m of (' ' + extra).matchAll(/ m([a-h][1-8])([wb])([ia]?)/g)) {
    const by = m[2] === 'w' ? 0 : 1, power = s.kings[by]?.power;
    out[m[1]] = m[3] ? 'warded' : power === 'IceWall' ? 'warded' : 'frozen';
  }
  return out;
}

/** What a piece reaches now: steps, takes, shots, pushes and swaps, from KD.legal (king powers left out). */
function reachOf(s, sq) {
  const cell = KD.board(s)[idx(sq)];
  const r = { step: new Set(), take: new Set(), shot: new Set(), swap: new Set(), push: [] };
  if (!cell) return r;
  const st = asSide(s, cell.color);
  let moves = [];
  try { moves = st ? KD.legal(st, sq).filter(m => !m.needsArming && !m.pass && !m.drop) : []; } catch { moves = []; }
  for (const m of moves) {
    if (m.shot) r.shot.add(m.captures[0]);
    else if (m.push) { if (!r.push.some(p => p.from === m.push.from)) r.push.push(m.push); }
    else if (m.swap) r.swap.add(m.to);
    else if (m.captures.length) r.take.add(m.captures[0]);
    else r.step.add(m.to);
  }
  return r;
}

/**
 * Where a piece gives check: each square where it could take an enemy, with its Freeze mark lifted.
 * A frozen piece still gives check (engine.ts filterMarks), so its king-side reach still counts.
 * The engine decides each square: a dummy enemy knight stands on an empty square, one square at a time.
 */
function attacksOf(s, sq) {
  const cells = KD.board(s), cell = cells[idx(sq)], out = new Set();
  if (!cell) return out;
  const f = KD.toFen(s).split(' ');
  f[1] = cell.color;
  if (f[6]) f[6] = f[6].split('/').filter(p => !p.startsWith(`m${sq}`)).join('/');
  const rows = f[0].split('/').map(r => r.replace(/\d/g, d => '.'.repeat(+d)).split(''));
  const pack = () => rows.map(r => r.join('').replace(/\.+/g, e => e.length)).join('/');
  const dummy = cell.color === 'w' ? 'n' : 'N';
  for (let i = 0; i < 64; i++) {
    const t = cells[i];
    if (i === idx(sq) || (t && t.color === cell.color)) continue;
    const row = 7 - (i >> 3), col = i & 7, keep = rows[row][col], name = KD.sq.name(i);
    if (!t) rows[row][col] = dummy;
    const fen = [pack(), ...f.slice(1)].filter(Boolean).join(' ');
    rows[row][col] = keep;
    try { if (KD.legal(KD.fromFen(fen, { powers: s.kings, cards: s.hands }), sq).some(m => m.captures.includes(name))) out.add(name); } catch { /* an odd position: skip the square */ }
  }
  return out;
}

/** The square a two-square shot passes over, when a piece stands there. */
function overSq(from, to, cells) {
  const fx = idx(from) & 7, fy = idx(from) >> 3, tx = idx(to) & 7, ty = idx(to) >> 3;
  const dx = tx - fx, dy = ty - fy;
  if (dx % 2 || dy % 2 || Math.max(Math.abs(dx), Math.abs(dy)) !== 2) return null;
  const mid = (fy + dy / 2) * 8 + fx + dx / 2;
  return cells[mid] ? KD.sq.name(mid) : null;
}

const GLYPHS = new Map();
/** A 5 x 5 rule example around d4 on an open board, worked out by the engine (dummy targets, one at a time). */
function glyphOf(type, color) {
  const key = type + color;
  if (GLYPHS.has(key)) return GLYPHS.get(key);
  const L = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k', archer: 'a', paladin: 'l', guard: 'g', maester: 'm', beast: 's', ogre: 'o' }[type];
  const grid = Array.from({ length: 8 }, () => Array(8).fill(null));
  const put = (sq, ch) => { grid[8 - +sq[1]][sq.charCodeAt(0) - 97] = ch; };
  const fen = () => grid.map(r => { let o = '', e = 0; for (const c of r) { if (!c) e++; else { if (e) o += e; e = 0; o += c; } } return o + (e || ''); }).join('/') + ` ${color} - - 0 20`;
  const base = () => {
    for (const r of grid) r.fill(null);
    put('a8', 'k'); put('h1', 'K'); put('a5', 'p'); put('h4', 'P');          // kings and pawns far away: enough material to play
    if (type === 'king') put(color === 'w' ? 'h1' : 'a8', null);
    put('d4', color === 'w' ? L.toUpperCase() : L);
  };
  const out = {};
  const add = (sq, k) => (out[sq] ??= new Set()).add(k);
  try {
    base();
    for (const m of KD.legal(KD.fromFen(fen()), 'd4')) if (!m.captures.length && !m.needsArming && !m.swap && !m.push) add(m.to, 'step');
    for (let f = 1; f <= 5; f++) for (let r = 2; r <= 6; r++) {
      const sq = 'abcdefgh'[f] + r;
      if (sq === 'd4') continue;
      base(); put(sq, color === 'w' ? 'n' : 'N');
      const st = KD.fromFen(fen());
      for (const m of KD.legal(st, 'd4')) if (m.captures.includes(sq)) add(sq, m.shot ? 'shot' : 'take');
    }
  } catch { /* an odd position: no glyph marks */ }
  GLYPHS.set(key, out);
  return out;
}

const TICKS = '<path d="M10 1.4v3.2M10 15.4v3.2M1.4 10h3.2M15.4 10h3.2" stroke="#b0251b" stroke-width="1.8" stroke-linecap="round"/>';
const GM = {
  step: '<circle cx="10" cy="10" r="4.3" fill="#fbf7ee" stroke="#2b2621" stroke-width="1.7"/>',
  steptake: '<circle cx="10" cy="10" r="4.6" fill="#2b2621"/>',
  take: '<path d="M6.4 6.4l7.2 7.2M13.6 6.4l-7.2 7.2" stroke="#b0251b" stroke-width="2.2" stroke-linecap="round"/>',
  shot: '<circle cx="10" cy="10" r="5" fill="none" stroke="#b0251b" stroke-width="1.6"/><path d="M10 2.6v3.2M10 14.2v3.2M2.6 10h3.2M14.2 10h3.2" stroke="#b0251b" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="10" r="1.3" fill="#b0251b"/>',
  // Steps or shoots: the step ring at full size, with the sight's four ticks around it.
  stepshot: `<circle cx="10" cy="10" r="5.2" fill="#fbf7ee" stroke="#2b2621" stroke-width="1.8"/>${TICKS}`,
};
const gKind = set => (!set ? '' : set.has('shot') && set.has('step') ? 'stepshot' : set.has('shot') ? 'shot' : set.has('take') && set.has('step') ? 'steptake' : set.has('take') ? 'take' : 'step');
function glyphHTML(type, color) {
  const g = glyphOf(type, color);
  let cells = '';
  for (let r = 6; r >= 2; r--) for (let f = 1; f <= 5; f++) {
    const sq = 'abcdefgh'[f] + r, dark = (f + r) % 2 === 1;
    const k = gKind(g[sq]);
    cells += `<i class="${dark ? 'd' : ''}">${sq === 'd4' ? pieceIcon(type, color) : k ? `<svg viewBox="0 0 20 20">${GM[k]}</svg>` : ''}</i>`;
  }
  return `<span class="glyph" role="img" aria-label="${glyphLabel(g)}">${cells}</span>`;
}
function glyphLabel(g) {
  const n = k => Object.values(g).filter(s => gKind(s) === k).length;
  const parts = [];
  if (n('step')) parts.push(`steps to ${n('step')} squares`);
  if (n('steptake')) parts.push(`steps or takes on ${n('steptake')} squares`);
  if (n('stepshot')) parts.push(`steps or shoots on ${n('stepshot')} squares`);
  if (n('take')) parts.push(`takes on ${n('take')} squares`);
  if (n('shot')) parts.push(`shoots ${n('shot')} squares`);
  return `Rule example on an empty board: ${parts.join(', ') || 'no move'}`;
}

/** Everything the card says about the piece on sq. */
function infoFor(s, sq) {
  const cells = KD.board(s), cell = cells[idx(sq)];
  const reach = reachOf(s, sq), marks = marksOf(s);
  const mine = cell.color === HUMAN;
  const info = { sq, cell, reach, side: mine ? 'Your' : 'Their', art: figureArt(cell), frozen: marks[sq] === 'frozen', name: NAME[cell.type], line: LINE[cell.type], states: [] };
  const say = (tone, ic, text) => info.states.push({ tone, icon: ic, text });
  if (cell.type === 'king') {
    const choice = s.kings[cell.color === 'w' ? 0 : 1];
    info.name = `${cell.design[0].toUpperCase()}${cell.design.slice(1)} king`;
    if (choice) {
      const power = KD.kings().find(k => k.king === choice.king)?.powers.find(p => p.power === choice.power);
      const left = KD.usesLeft(s, cell.color);
      info.line = POWER_LINE[choice.power] ?? `Power: ${power?.name ?? choice.power}.`;
      say('gold', 'bolt', left == null ? 'Always on.' : left > 0 ? `${left} use left this game.` : 'Its power is used.');
    } else info.line = 'Mate the king to win.';
    return info;
  }
  const verb = verbOf(cell.type), whose = mine ? 'their' : 'your';
  if (marks[sq] === 'frozen') {
    say('frost', 'snow', cell.type === 'archer' ? 'Frozen: no move or shot next turn.' : 'Frozen: no move next turn.');
    say('frost', 'target', 'It still gives check.');
  } else if (marks[sq] === 'warded') say('frost', 'shield', 'Ice Wall: nothing can take it.');
  else if (cell.type === 'guard') say('gold', 'shield', 'It never takes.');
  else {
    const hits = [...reach.take, ...reach.shot].filter(t => cells[idx(t)]);
    const king = hits.find(t => cells[idx(t)].type === 'king');
    if (king) {
      const over = reach.shot.has(king) ? overSq(sq, king, cells) : null;
      say('danger', 'target', over ? `Check: it shoots ${whose} king over ${over}.` : 'It gives check.');
    } else if (hits.length === 1) say(mine ? 'gold' : 'danger', 'target', `It can ${verb} ${whose} ${pname(cells[idx(hits[0])].type)}.`);
    else if (hits.length > 1) say(mine ? 'gold' : 'danger', 'target', `It can ${verb} ${hits.length} of ${whose} pieces.`);
    else say('', 'info', mine ? `Nothing to ${verb} now.` : `It can ${verb} nothing now.`);
  }
  return info;
}

// ---- the card ----
// One card for both ways to read. The hold card (big) puts its let-go line on top and has no buttons:
// the finger is on the board. On a short phone the CSS folds the rule example away; Rules still opens it.
function cardHTML(info, { big = false, how = 'tap', letGo = '' } = {}) {
  const { art, cell } = info;
  const cap = how === 'key' ? '<span class="keys"><kbd>I</kbd> reads <kbd>Esc</kbd> closes</span>' : 'On an empty board.';
  return `<article class="read${big ? ' is-big' : ''}" aria-label="${info.side} ${info.name}">
    ${big ? `<p class="let-go">${letGo}</p>` : ''}
    <div class="niche${info.frozen ? ' is-frozen' : ''}"><img src="${art.src}" alt=""${art.box?.mirror ? ' class="mirror"' : ''}></div>
    <div class="head">
      <p class="side"><span class="disc ${cell.color}"></span>${info.side} piece</p>
      <h3>${info.name}</h3>
      <p class="line">${info.line}</p>
      ${info.states.map(st => `<p class="state ${st.tone}">${ico(st.icon)}<span>${st.text}</span></p>`).join('')}
    </div>
    ${big ? '' : `<button type="button" class="btn btn-icon x" data-act="close" aria-label="Close">${icon('close')}</button>`}
    <div class="foot">${glyphHTML(cell.type, cell.color)}<p class="cap"><b>How it moves</b>${cap}</p>${big ? '' : '<button type="button" class="btn btn-quiet rules-btn" data-act="rules">Rules</button>'}</div>
  </article>`;
}

// ---- the page ----
const app = $('#app'), ctx = $('#ctx'), peek = $('#peek'), host = $('#board');
let sticky = null;      // the square read in the context area (option A, or the lens)
let stickyHow = 'tap';  // 'tap' | 'select' | 'key' | 'lens'
let peekSq = null;      // the square under a hold (option B)
let lens = false;
let keyAt = -1e9;
let swallowTap = false;
let readOnce = false;   // the quiet tip goes after the first read

/** A square that the selected piece can go to next: a tap there plays the move (or the next step of a chain). */
const isTarget = sq => board.selected != null
  && (board.targets.some(m => m.path[board.pending.length] === sq) || (board.pending.length > 0 && sq === board.pending.at(-1)));

const board = createBoard(host, {
  play: { level: 'casual', human: HUMAN, ms: 500 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, I reads a piece, Escape closes.',
  onTap(sq, cell) {
    if (swallowTap) return false;                 // the end of a hold: a reading, never a move
    if (lens) { if (cell) read(sq, 'lens'); else closeRead(); return false; }
    const s = board.state;
    if (!s) return undefined;
    const st = KD.status(s);
    const myTurn = !st.over && board.isHuman(st.turn) && !board.busy;
    if (isTarget(sq)) { dropRead(); return undefined; }               // a marked target: the board plays the move
    if (cell && myTurn && cell.color === st.turn) return undefined;   // your piece: the board selects it, onSelect shows its card
    if (cell) { if (sticky === sq && stickyHow !== 'select') { closeRead(); return false; } board.clearSelection(); read(sq, 'tap'); return false; }
    closeRead();
    return undefined;
  },
  onSelect(sq) {
    if (lens) return;
    if (sq) read(sq, 'select');
    else if (stickyHow === 'select') closeRead();
  },
  onInspect(sq) {
    if (peekSq || hold?.fired) return;
    if (performance.now() - keyAt < 400) { if (sticky === sq) closeRead(); else read(sq, 'key'); }
  },
  onMove() { sticky = null; stickyHow = 'tap'; endPeek(true); clearReach(); board.clearMarks('hint'); drawStateMarks(); renderPowers(); renderCtx(); },
});

// My own layers on the board: ground marks under the figures, marks over them (and over a lifted figure), tags.
const layer = (cls) => { const d = document.createElement('div'); d.className = `htr-layer ${cls}`; d.setAttribute('aria-hidden', 'true'); board.layer.appendChild(d); return d; };
const under = layer('htr-under'), over = layer('htr-over'), badges = layer('htr-over'), tags = layer('htr-tags');
const fingerEl = Object.assign(document.createElement('div'), { className: 'finger', hidden: true });
fingerEl.setAttribute('aria-hidden', 'true');
host.appendChild(fingerEl);

function clearReach() { under.innerHTML = ''; over.innerHTML = ''; }

/**
 * Draw a piece's reach in the reading shapes: a small ring in the middle of a square to step, a crimson ring
 * at the feet to take, a sight and an arc to shoot. A frozen piece gets thin ice sights where it still gives check.
 */
function drawReach(sq, { pop = true } = {}) {
  clearReach();
  const s = board.state;
  if (!s || !board.cells[idx(sq)]) return;
  const r = reachOf(s, sq), from = board.colRow(sq), frozen = marksOf(s)[sq] === 'frozen';
  const k = Math.min(1.9, Math.max(1, 700 / Math.max(1, board.layer.clientWidth)));
  const P = q => { const { col, row } = board.colRow(q); return { x: col * 100 + 50, y: row * 100, d: Math.hypot(col - from.col, row - from.row) }; };
  const cls = (d) => (pop ? ` class="htr-pop" style="--i:${d.toFixed(1)}"` : '');
  const halo = (d, colour, w, extra = '', haloExtra = extra) => `<path d="${d}" fill="none" stroke="rgba(251,246,232,.9)" stroke-width="${w + 3 * k}" stroke-linecap="round" stroke-linejoin="round" ${haloExtra}/><path d="${d}" fill="none" stroke="${colour}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
  // A sight about a third of a square wide, low on the figure, so the piece under it stays in view.
  const SIGHT_Y = 60, RR = 10;
  const sight = (x, y, colour, w, dash = '') => {
    let ticks = '';
    for (const [ax, ay] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) ticks += `M${x + ax * RR * 0.55} ${y + ay * RR * 0.55}L${x + ax * RR * 1.6} ${y + ay * RR * 1.6}`;
    return halo(ell(x, y, RR, RR), colour, w, dash, '') + halo(ticks, colour, w);
  };
  let low = '', high = '';
  // A step: the same parchment disc with an ink ring as in the rule example, in the middle of the square.
  for (const q of r.step) { const p = P(q); high += `<g${cls(p.d)}><circle cx="${p.x}" cy="${p.y + 50}" r="13" fill="rgba(251,246,232,.92)" stroke="#2b2621" stroke-width="${2.2 * k}"/></g>`; }
  for (const q of r.swap) { const p = P(q); low += `<g${cls(p.d)}>${halo(ell(p.x, p.y + 80, 38, 13), '#6f4fa0', 3.5 * k, 'stroke-dasharray="10 8"')}</g>`; }
  for (const q of r.take) { const p = P(q); low += `<g${cls(p.d)}>${halo(ell(p.x, p.y + 80, 40, 14), '#b0251b', 4 * k)}</g>`; }
  for (const pu of r.push) {
    const a = P(pu.from), b = P(pu.to), dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    const x1 = a.x + ux * 18, y1 = a.y + 72 + uy * 18, x2 = a.x + ux * 74, y2 = a.y + 72 + uy * 74;
    const head = `M${x2 - ux * 16 - uy * 11} ${y2 - uy * 16 + ux * 11}L${x2} ${y2}L${x2 - ux * 16 + uy * 11} ${y2 - uy * 16 - ux * 11}`;
    high += `<g${cls(a.d)}>${halo(`M${x1} ${y1}L${x2} ${y2}${head}`, '#1f7a70', 4 * k)}</g>`;
  }
  let i = 0;
  for (const q of r.shot) {
    const p = P(q), fx = from.col * 100 + 50, fy = from.row * 100 + 30, tx = p.x, ty = p.y + SIGHT_Y;
    const lift = 40 + 18 * p.d, cx = (fx + tx) / 2, cy = Math.min(fy, ty) - lift;
    high += `<g${pop ? ` class="htr-fade" style="--i:${i}"` : ''}>${halo(`M${fx} ${fy}Q${cx} ${cy} ${tx} ${ty - RR}`, 'rgba(176,37,27,.9)', 2.2 * k, `stroke-dasharray="${8 * k} ${7 * k}"`)}</g>`;
    high += `<g${cls(p.d + 1)}>${sight(tx, ty, '#b0251b', 2 * k)}<circle cx="${tx}" cy="${ty}" r="${1.8 * k}" fill="#b0251b"/></g>`;
    i++;
  }
  if (frozen) {
    let j = 0;
    for (const q of attacksOf(s, sq)) { const p = P(q); high += `<g${pop ? ` class="htr-fade" style="--i:${j++}"` : ''}>${sight(p.x, p.y + SIGHT_Y, '#1f4f8f', 1.5 * k, `stroke-dasharray="${4 * k} ${3 * k}"`)}</g>`; }
  }
  under.innerHTML = `<svg viewBox="0 0 800 800" preserveAspectRatio="none">${low}</svg>`;
  over.innerHTML = `<svg viewBox="0 0 800 800" preserveAspectRatio="none">${high}</svg>`;
}

/** Lasting marks: a frozen piece is cold and carries a snowflake badge. */
function drawStateMarks() {
  for (const el of board.layer.querySelectorAll('.htr-frozen')) el.classList.remove('htr-frozen');
  let svg = '';
  for (const [sq, kind] of Object.entries(marksOf(board.state))) {
    if (kind !== 'frozen') continue;
    board.figure(sq)?.classList.add('htr-frozen');
    const { col, row } = board.colRow(sq), x = col * 100 + 20, y = row * 100 + 20;
    svg += `<circle cx="${x}" cy="${y}" r="15" fill="#eaf3ff" stroke="#1f4f8f" stroke-width="2.5"/><g transform="translate(${x - 10} ${y - 10}) scale(.84)" fill="none" stroke="#1f4f8f" stroke-width="2.2" stroke-linecap="round"><path d="${SNOW}"/></g>`;
  }
  badges.innerHTML = svg ? `<svg viewBox="0 0 800 800" preserveAspectRatio="none">${svg}</svg>` : '';
}

/** Option C: a name tag on each King Down piece and king, inside the foot of its square. */
function drawTags(on) {
  tags.innerHTML = '';
  if (!on) return;
  for (const c of board.cells) {
    if (!c || !(NEW.has(c.type) || c.type === 'king')) continue;
    const { col, row } = board.colRow(c.sq);
    const t = document.createElement('span');
    t.className = `tag ${c.color}`;
    t.textContent = c.type === 'king' ? `${c.design[0].toUpperCase()}${c.design.slice(1)}` : NAME[c.type];
    Object.assign(t.style, { left: `${(col + 0.5) * 12.5}%`, top: `${(row + 1) * 12.5 - 0.4}%` });
    tags.appendChild(t);
  }
}

// ---- the context area ----
const youThey = t => t
  .replace(/^White (?=(pawn|knight|bishop|rook|queen|king|archer|paladin|guard|maester|beast|ogre)\b)/, 'Your ')
  .replace(/^Black (?=(pawn|knight|bishop|rook|queen|king|archer|paladin|guard|maester|beast|ogre)\b)/, 'Their ')
  .replace(/^White freezes/, 'You freeze').replace(/\bthe black\b/g, 'their').replace(/\bthe white\b/g, 'your')
  .replace(/\b(archer|paladin|guard|maester|beast|ogre)\b/g, w => w[0].toUpperCase() + w.slice(1))
  .replace(/^(Your|Their) (\w+) ([a-h][1-8]) to /, '$1 $2 moves $3 to ');

function renderCtx() {
  if (sticky && board.state && board.cells[idx(sticky)]) {
    ctx.innerHTML = cardHTML(infoFor(board.state, sticky), { how: stickyHow });
    return;
  }
  if (lens) {
    ctx.innerHTML = `<div class="lens-note"><p class="turn">${icon('help')}Reading is on</p><p class="muted">Tap any piece to read it. No move plays.</p><p class="muted">Tap Read again to play.</p></div>`;
    return;
  }
  const s = board.state;
  if (!s) { ctx.innerHTML = ''; return; }
  const st = KD.status(s);
  const thinking = !st.over && !board.isHuman(st.turn);
  const turn = st.over ? st.text : thinking ? 'The computer thinks' : st.turn === HUMAN ? (st.check ? 'Check. Your move.' : 'Your move') : 'Their move';
  const h = s.history.at(-1);
  let last = '';
  if (h) {
    const story = KD.describe(KD.undo(s), h.lan);
    last = `<p class="last">${pieceIcon(story.piece, story.side)}<span>${youThey(story.text)}</span></p>`;
  }
  const tip = readOnce ? '' : `<p class="tip">${icon('eye')}<span>Tap or hold any piece to read it.</span></p>`;
  ctx.innerHTML = `<div class="rest"><p class="turn${st.check && !st.over ? ' is-check' : ''}">${turn}</p>${last}${tip}</div>`;
}

function renderPowers() {
  const s = board.state;
  for (const [el, side] of [[$('#opp-power'), 'b'], [$('#my-power'), 'w']]) {
    const choice = s?.kings[side === 'w' ? 0 : 1];
    if (!choice) { el.hidden = true; continue; }
    const name = KD.kings().find(k => k.king === choice.king)?.powers.find(p => p.power === choice.power)?.name ?? choice.power;
    const left = KD.usesLeft(s, side);
    el.hidden = false;
    el.classList.toggle('is-used', left === 0);
    el.innerHTML = `${icon(left === 0 ? 'check' : 'bolt')}<span>${name} · ${left === 0 ? 'used' : left == null ? 'always on' : `${left} use`}</span>`;
  }
}

/** Option A: read a piece in the context area. It stays until Close, Escape or the next tap. */
function read(sq, how = 'tap') {
  endPeek(true);
  readOnce = true;
  sticky = sq; stickyHow = how;
  if (how === 'select') clearReach(); else drawReach(sq);
  renderCtx();
  anim(ctx.firstElementChild, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
function closeRead() {
  if (!sticky) return;
  const was = stickyHow;
  sticky = null; stickyHow = 'tap';
  clearReach();
  if (was === 'select' && board.selected != null) board.clearSelection(false);
  renderCtx();
}
/** A tap on a marked target: end a tap or key reading, but keep the selection, so that the board plays the move. */
function dropRead() {
  if (!sticky || stickyHow === 'select') return;
  sticky = KD.sq.name(board.selected); stickyHow = 'select';
  clearReach();
  renderCtx();
}

/** Option B: hold a figure. It lifts, its reach shows and a card rises over the context area. Let go and it all goes. */
function beginPeek(sq) {
  if (peekSq) endPeek(true);
  const s = board.state;
  if (!s || !board.cells[idx(sq)]) return;
  readOnce = true;
  peekSq = sq;
  app.classList.add('is-peeking');
  board.figure(sq)?.classList.add('htr-lift');
  drawReach(sq);
  const sel = isTarget(sq) ? board.cells[board.selected] : null;
  const letGo = sel ? `Let go: your ${pname(sel.type)} waits.` : 'Let go to close.';
  peek.innerHTML = cardHTML(infoFor(s, sq), { big: true, letGo });
  peek.hidden = false;
  anim(peek, [{ opacity: 0, transform: 'translateY(28px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  haptic(8);
}
function endPeek(instant = false) {
  if (!peekSq) return;
  board.figure(peekSq)?.classList.remove('htr-lift');
  peekSq = null;
  app.classList.remove('is-peeking');
  clearReach();
  if (sticky && stickyHow !== 'select') drawReach(sticky, { pop: false });
  if (instant) { peek.hidden = true; return; }
  anim(peek, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(20px)' }], { duration: 160, easing: 'cubic-bezier(.5,0,.75,0)' })
    .then(() => { if (!peekSq) peek.hidden = true; });
}

// The hold: 300 ms with a finger or a pen, 400 ms with a mouse. While it holds, the board does not drag.
let hold = null;
host.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const i = board.squareAtPoint(e.clientX, e.clientY);
  if (i == null || !board.cells[i]) return;
  const sq = KD.sq.name(i);
  hold = { id: e.pointerId, x: e.clientX, y: e.clientY, sq, fired: false };
  hold.timer = setTimeout(() => { if (hold?.sq === sq && !hold.fired) { hold.fired = true; beginPeek(sq); } }, e.pointerType === 'mouse' ? 400 : 300);
}, true);
host.addEventListener('pointermove', e => {
  if (!hold || e.pointerId !== hold.id) return;
  if (hold.fired) { e.stopPropagation(); return; }
  if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 6) { clearTimeout(hold.timer); hold = null; }   // a drag starts: no hold
}, true);
const release = e => {
  if (!hold || e.pointerId !== hold.id) return;
  clearTimeout(hold.timer);
  if (hold.fired) { endPeek(); swallowTap = true; setTimeout(() => { swallowTap = false; }, 0); }
  hold = null;
};
window.addEventListener('pointerup', release, true);
window.addEventListener('pointercancel', release, true);

board.el.addEventListener('keydown', e => {
  if (e.key === 'i' || e.key === 'I') keyAt = performance.now();
  if (e.key === 'Escape' && sticky && stickyHow !== 'select') closeRead();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sticky && !$('#guide').open && document.activeElement !== board.el) closeRead(); });

// Card buttons: Close and Rules.
for (const el of [ctx, peek]) el.addEventListener('click', e => {
  const act = e.target.closest?.('[data-act]')?.dataset.act;
  if (act === 'close') { if (stickyHow === 'select') board.clearSelection(); closeRead(); board.el.focus({ preventScroll: true }); }
  if (act === 'rules' && sticky) openGuide(sticky);
});

function openGuide(sq) {
  const s = board.state, info = infoFor(s, sq), { cell, art } = info;
  const kinds = new Set(Object.values(glyphOf(cell.type, cell.color)).map(gKind));
  const legend = [['step', 'Steps here'], ['steptake', 'Steps or takes here'], ['stepshot', 'Steps or shoots here'], ['take', 'Takes here only'], ['shot', 'Shoots here, without moving']]
    .filter(([k]) => kinds.has(k)).map(([k, t]) => `<li><svg viewBox="0 0 20 20" aria-hidden="true">${GM[k]}</svg>${t}</li>`).join('');
  $('#guide-title').textContent = 'Guide';
  $('#guide-body').innerHTML = `<div class="guide-top"><div class="niche"><img src="${art.src}" alt=""${art.box?.mirror ? ' class="mirror"' : ''}></div>
      <div><p class="side"><span class="disc ${cell.color}"></span>${info.side} piece</p><h3>${info.name}</h3><p class="line">${info.line}</p></div></div>
    <ul class="rules">${(RULES[cell.type] ?? []).map(r => `<li>${r}</li>`).join('')}</ul>
    <div class="howto">${glyphHTML(cell.type, cell.color).replace('class="glyph"', 'class="glyph" style="--gc:30px"')}
      <div><h4>How it moves</h4><ul class="legend">${legend}</ul></div></div>
    ${NEW.has(cell.type) ? `<button type="button" class="btn btn-wide" id="lesson">${icon('book')}<span>Try it: a one-move lesson</span></button>` : ''}`;
  $('#lesson')?.addEventListener('click', () => toast('In the app, the lesson opens here.'));
  openSheet('guide');
}
$('#guide [data-close]').innerHTML = icon('close');

// ---- the action bar ----
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#menu'), 'menu', 'Menu'); label($('#hint'), 'hint', 'Hint'); label($('#undo'), 'undo', 'Undo'); label($('#lens'), 'help', 'Read');
$('#menu').addEventListener('click', () => toast('The menu is not part of this demo.'));
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s) return;
  const st = KD.status(s);
  if (st.over || !board.isHuman(st.turn) || board.busy) return;
  closeRead();
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (board.state !== s || !m) return;
  board.clearMarks('hint');
  board.mark([m.from, m.path.at(-1)], 'hint');
  toast(`Hint: ${youThey(KD.describe(s, m).text)}`);
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s || s.history.length <= 1 || board.busy) return;
  const back = board.play.human === 'both' || KD.status(s).turn !== HUMAN ? 1 : 2;
  let b = s;
  for (let n = 0; n < back && b.history.length > 1; n++) b = KD.undo(b);
  show(b);
});
$('#lens').addEventListener('click', () => setLens(!lens));

function setLens(on) {
  lens = on;
  $('#lens').setAttribute('aria-pressed', String(on));
  app.classList.toggle('is-lens', on);
  board.clearSelection(false);
  sticky = null; clearReach();
  drawTags(on);
  renderCtx();
}
function setOption(o) { app.dataset.option = o; }

function show(s) {
  board.setState(s);
  sticky = null; stickyHow = 'tap';
  clearReach();
  drawStateMarks();
  if (lens) drawTags(true);
  renderPowers();
  renderCtx();
}

// ---- the demo's finger and real input (the scripted run plays through the same taps and holds as a person) ----
function placeFinger(sq, at = 0.62) {
  const r = board.squareRect(sq), h = host.getBoundingClientRect();
  fingerEl.style.left = `${r.left - h.left + r.width / 2}px`;
  fingerEl.style.top = `${r.top - h.top + r.height * at}px`;
}
function fingerDown(sq) { placeFinger(sq, 0.84); fingerEl.className = 'finger is-hold'; fingerEl.hidden = false; }   // low, so the lifted figure shows
function fingerUp() { fingerEl.hidden = true; }

let synth = null, synthId = 1000;
function pointer(type, sq, id) {
  const r = board.squareRect(sq);
  board.el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: 'touch', isPrimary: true,
    button: 0, buttons: type === 'pointerdown' ? 1 : 0, clientX: r.left + r.width / 2, clientY: r.top + r.height * 0.7,
  }));
}
/** A real tap: a pointer goes down and up on the square, so the board and this page handle it as a person's tap. */
async function realTap(sq) {
  const id = ++synthId;
  placeFinger(sq); fingerEl.className = 'finger'; fingerEl.hidden = false;
  synth = { sq, id };
  pointer('pointerdown', sq, id);
  await anim(fingerEl, [{ transform: 'scale(1.35)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 140, easing: 'ease-out' });
  if (synth?.id !== id) return;
  synth = null;
  pointer('pointerup', sq, id);
  await wait(160);
  fingerEl.hidden = true;
}
/** A real hold: the pointer stays down for `ms`, then goes up. */
async function realHold(sq, ms) {
  const id = ++synthId;
  fingerDown(sq);
  synth = { sq, id };
  pointer('pointerdown', sq, id);
  await wait(ms);
  if (synth?.id !== id) return;
  synth = null;
  pointer('pointerup', sq, id);
  fingerUp();
}
/** Wait until a condition holds (a move has landed), or `ms` passes. */
async function until(ok, ms = 4000) {
  const end = performance.now() + ms;
  while (!ok() && performance.now() < end) await new Promise(r => setTimeout(r, 40));
}

// ---- the demo contract ----
let run = 0;
function setPreview(on) {
  $('#screen').classList.toggle('is-preview', on);
  document.body.classList.toggle('is-preview', on);
  $('#preview-cap').hidden = !on;
}
function prep(option = 'ab') {
  run++;
  if (synth) { pointer('pointercancel', synth.sq, synth.id); synth = null; }
  endPeek(true); fingerUp(); hideToast();
  if ($('#guide').open) $('#guide').close();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();   // no focus ring left from an earlier state
  setPreview(false);
  setOption(option);
  if (lens) setLens(false);
  readOnce = false;
  board.play.human = 'both';
}
const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

window.demo = {
  async state(name) {
    switch (name) {
      case 'rest': prep('ab'); show(p1()); break;
      case 'tap': prep('ab'); show(checkPos()); await settle(); read('e3'); break;
      case 'hold': prep('ab'); show(p1()); await settle(); beginPeek('c4'); fingerDown('c4'); break;
      case 'lens': prep('c'); show(p1()); await settle(); setLens(true); break;
      case 'frozen': prep('ab'); show(frozenPos()); await settle(); read('b6'); break;
      case 'hold-target': prep('ab'); show(p1()); await settle(); board.selectSquare('e4'); beginPeek('d5'); fingerDown('d5'); break;
      case 'keyboard': {
        prep('ab'); show(p1()); await settle();
        board.cursor = idx('a3'); board.moveCursorMark(); board.el.focus({ preventScroll: true });
        read('a3', 'key');
        break;
      }
      case 'guide': prep('ab'); show(p1()); await settle(); read('b6'); openGuide('b6'); break;
      case 'short-tap': prep('ab'); setPreview(true); show(checkPos()); await settle(); read('e3'); break;
      case 'short-hold': prep('ab'); setPreview(true); show(p1()); await settle(); board.selectSquare('e4'); beginPeek('d5'); fingerDown('d5'); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The story, all through real taps and holds: read their Guard; shoot with your Archer; their Strike gives
  // check from far away, and a hold shows why. Then a hold on a marked target reads it and plays nothing,
  // and a tap on the same square bites.
  async play() {
    prep('ab');
    const me = run, live = () => me === run;
    show(p1());
    await wait(900); if (!live()) return;
    await realTap('c4'); if (!live()) return;            // their Guard: the card reads it
    await wait(2000); if (!live()) return;
    await realTap('c4'); if (!live()) return;            // the same tap closes it
    await wait(500); if (!live()) return;
    await realTap('a3'); if (!live()) return;            // your Archer: selected, its card shows
    await wait(900); if (!live()) return;
    let before = board.state;
    await realTap('a5'); if (!live()) return;            // a marked target: the shot plays
    await until(() => board.state !== before && !board.busy); if (!live()) return;
    await wait(500); if (!live()) return;
    await board.playMove('Ab6-e3!'); if (!live()) return;   // their Strike: check over f2
    await wait(1100); if (!live()) return;
    await realHold('e3', 3300); if (!live()) return;     // hold: why is it check?
    await wait(700); if (!live()) return;
    await realTap('e4'); if (!live()) return;            // your Beast: selected
    await wait(1300); if (!live()) return;
    await realHold('e3', 2300); if (!live()) return;     // hold a marked target: it reads, nothing plays
    await wait(800); if (!live()) return;
    before = board.state;
    await realTap('e3'); if (!live()) return;            // tap the same square: the bite plays
    await until(() => board.state !== before && !board.busy); if (!live()) return;
    await wait(1500);
  },
  async reset() {
    prep('ab');
    board.play.human = HUMAN;
    show(p1());
  },
};

show(p1());
