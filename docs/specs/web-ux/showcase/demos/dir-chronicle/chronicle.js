// Chronicle: the game as a short tale. One story line under the board, the story folded behind it,
// "Previously" on return, and a recap of three panels at the end. Real board, rules and computer (kit).
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, animate, wait, toast, hideToast } from '../../kit/ui.js';

// ---- the shared positions (idea bank 6.1), with a real lead-in of twelve moves --------------------
// START plays twelve legal moves into P1 (checked with the engine): among them their Archer shoots c5,
// your Maester swaps with your king, and your Beast bites e4. The last one is their pawn to e6.
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const START = 'r1b2mk1/1apop1pp/8/pp1g4/2P1p3/1A1P4/PPOGSPPP/R1B2KM1 w - - 0 6';
const LEAD_IN = ['Se2-e3', 'Od7-d6', 'c4-c5', 'Gd5-c4', 'Oc2-c3', 'Ab7-b6', 'Ab3-a3', 'Ab6*c5', 'Mg1<>f1', 'Od6-d5', 'Se3xe4', 'e7-e6'];
const P2_FEN = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24';
const HUMAN = 'w';

const playAll = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);
const P1 = playAll(KD.fromFen(START, { powers: POWERS }), LEAD_IN);
const SHOT = KD.play(P1, 'Aa3*a5');
const STRIKE = KD.play(SHOT, 'Ab6-e3!');
const ANSWER = KD.play(STRIKE, 'Se4xe3');
const P2 = KD.fromFen(P2_FEN, { powers: POWERS });
const MATED = KD.play(P2, 'Ae5-f6');

// ---- words: each move in the story voice (eight words or fewer in play) ----------------------------
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
const pname = t => (NEW.has(t) ? t[0].toUpperCase() + t.slice(1) : t);
const other = c => (c === 'w' ? 'b' : 'w');
const Who = c => (c === HUMAN ? 'Your' : 'Their');
const whose = c => (c === HUMAN ? 'your' : 'their');
const cap = s => s[0].toUpperCase() + s.slice(1);
const rankOf = sq => +sq[1];
const STEP = { knight: 'leaps', bishop: 'goes', rook: 'goes', queen: 'goes', paladin: 'goes' };
const FIRST = { shoot: 'First shot', shove: 'First shove', chain: 'First double bite', swap: 'First swap' };
const KNOWN = new Set(['step', 'take', 'bite', 'swap']); // verbs this player has used in earlier games
const at = (cells, sq) => cells[KD.sq.index(sq)];
// The powers in true words (docs/RULES.md, king-down-facts.md): the read card and the story use the same text.
const STRIKE_TEXT = 'Strike, once a game: one piece moves like a queen to an empty square. Not a pawn or the king.';
const FREEZE_TEXT = 'Freeze an enemy piece, not the king, for one turn. Then make your move.';

function direction(side, from, to) {
  const d = (rankOf(to) - rankOf(from)) * (side === 'w' ? 1 : -1);
  return d > 0 ? 'forward' : d < 0 ? 'back' : 'aside';
}

/**
 * The words for one move: line (with squares), plain (no squares), where + note (the selected row), verb, check.
 * preview: the move is not played yet, so the words never tell of check or mate (no free hint).
 */
function tell(st, before, { preview = false } = {}) {
  const W = Who(st.side), P = pname(st.piece), foe = whose(other(st.side));
  const vic = (st.captured ?? []).map(pname);
  let verb = 'step', line, plain, where = `${st.from} → ${st.to}`, note = '';
  switch (st.kind) {
    case 'shoot':
      verb = 'shoot';
      line = `${W} ${P} shoots ${st.capturedOn[0]}. It stays on ${st.from}.`;
      plain = `${W} ${P} shoots ${foe} ${vic[0]} without moving.`;
      where = `${st.from} shoots ${st.capturedOn[0]}`; note = `The ${P} stays on ${st.from}.`;
      break;
    case 'chain':
      verb = 'bite';
      line = `${W} ${P} bites twice: ${st.capturedOn.join(', then ')}.`;
      plain = `${W} ${P} bites twice: ${vic.join(', then ')}.`;
      where = [st.from, ...st.capturedOn].join(' → '); note = 'Two bites in one turn.';
      break;
    case 'capture': {
      const beast = st.piece === 'beast';
      verb = beast ? 'bite' : 'take';
      const v = beast ? 'bites' : 'takes';
      line = `${W} ${P} ${v} ${foe} ${vic[0]} on ${st.capturedOn[0]}.`;
      plain = `${W} ${P} ${v} ${foe} ${vic[0]}.`;
      if (st.leaves) { plain = `${W} ${P} takes ${foe} ${vic[0]}, then leaves.`; note = 'The Paladin leaves the board.'; }
      break;
    }
    case 'push': {
      verb = 'shove';
      const c = at(before, st.push.from), owner = c ? whose(c.color) : foe, V = pname(st.push.piece);
      line = `${W} ${P} shoves ${owner} ${V} to ${st.push.to}.`;
      plain = `${W} ${P} shoves ${owner} ${V} and steps in.`;
      where = `${st.from} → ${st.to}, ${V} → ${st.push.to}`; note = `The ${P} steps into its place.`;
      break;
    }
    case 'swap': {
      verb = 'swap';
      const c = at(before, st.to), V = c ? pname(c.type) : 'piece';
      line = plain = `${W} ${P} swaps with ${whose(st.side)} ${V}.`;
      where = `${st.from} ⇄ ${st.to}`; note = 'A swap with a friend.';
      break;
    }
    case 'power':
      verb = st.powerTag === 'freeze' ? 'freeze' : 'power';
      if (st.powerTag === 'strike') {
        line = `${W} ${P} goes to ${st.to} with Strike.`;
        plain = `${W} ${P} moves like a queen with Strike.`;
        note = STRIKE_TEXT;
      } else if (st.powerTag === 'freeze') {
        line = `${W} king freezes ${foe} ${P} on ${st.to}.`;
        plain = `${W} king freezes ${foe} ${P}.`;
        where = `${st.to} frozen`; note = 'It cannot move on its next turn.';
      } else {
        line = `${W} ${P} goes to ${st.to} with ${st.power}.`;
        plain = `${W} ${P} uses ${st.power}.`;
      }
      break;
    case 'promote':
      verb = 'promote';
      line = `${W} pawn becomes a ${st.promo} on ${st.to}.`;
      plain = `${W} pawn becomes a ${st.promo}.`;
      break;
    default: {
      const v = STEP[st.piece] ?? 'steps';
      line = `${W} ${P} ${v} to ${st.to}.`;
      plain = `${W} ${P} ${v} ${direction(st.side, st.from, st.to)}.`;
    }
  }
  let check = null, checkWhere = '';
  if (preview) { /* the result of a move shows only after it is played */ }
  else if (st.mate) { line = line.replace(/\.$/, '. Checkmate.'); if (line.split(' ').length > 8) line = `${W} ${P} gives checkmate.`; plain += ' Checkmate.'; }
  else if (st.check) {
    // The cause: the piece that moved. An Archer two squares away shoots over the square between.
    const by = st.kind === 'shoot' ? st.from : st.to, k = st.checkSq;
    const df = k.charCodeAt(0) - by.charCodeAt(0), dr = rankOf(k) - rankOf(by);
    const mid = String.fromCharCode(by.charCodeAt(0) + df / 2) + (rankOf(by) + dr / 2);
    const over = st.piece === 'archer' && Math.max(Math.abs(df), Math.abs(dr)) === 2 && (df % 2 === 0) && (dr % 2 === 0) && at(st.after, mid);
    // 'shoots' is a played take; a threat is 'can shoot' (one meaning for each word).
    check = over ? `Check: ${whose(st.side)} ${P} can shoot over ${mid}.` : `Check from ${whose(st.side)} ${P} on ${by}.`;
    checkWhere = over ? `${by} can shoot over ${mid} at ${k}` : `${by} gives check to ${k}`;
  }
  return { verb, line, plain, where, note, check, checkWhere, by: st.kind === 'shoot' ? st.from : st.to };
}

function entriesOf(state) {
  const chain = [state];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  const out = [], used = new Set(KNOWN);
  state.history.forEach((h, i) => {
    const prev = chain[i], st = KD.describe(prev, h.lan), w = tell(st, KD.board(prev));
    let gold = null;
    if (st.side === HUMAN && FIRST[st.kind] && !used.has(w.verb)) gold = FIRST[st.kind];
    if (st.side === HUMAN) used.add(w.verb);
    if (st.kind === 'power') gold = st.power;
    if (st.mate) gold = 'King Down';
    out.push({ st, w, gold, n: KD.status(prev).moveNumber, prev });
  });
  return out;
}

// The P2 game is the same game, later: its story starts with the first chapter, then a gap.
let chapter = 'p1';
const CH1 = entriesOf(ANSWER);
function record() {
  const own = entriesOf(board.state ?? P1);
  return chapter === 'p2' ? [...CH1, { gap: true, text: 'Moves 13 to 23' }, ...own] : own;
}

// ---- marks: one mark for each verb (a shape, never colour alone) ----------------------------------
const VERB_PATH = {
  step: 'M5 12h12M13 7l5 5-5 5',
  take: 'M5 5l11 11M14 18l4-4M16 16l4 4M19 5 8 16M10 18l-4-4M8 16l-4 4',
  bite: 'M3 6.5c5 4.5 13 4.5 18 0M7 9.6l1.6 7.4 2-6.6M13.4 10.4l2 6.6 1.6-7.4',
  shoot: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM12 11.5h.01',
  shove: 'M4 5v14M8 12h11M15 8l4 4-4 4',
  swap: 'M5 8h13M15 5l3 3-3 3M19 16H6M9 13l-3 3 3 3',
  power: 'M13 2.5 5 13.5h6l-1 8 8-11h-6z',
  freeze: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',
  promote: 'M12 19V6M7 11l5-5 5 5',
  check: 'M4 18h16M4 18 3 8l5 4 4-6 4 6 5-4-1 10',
  quill: 'M20 3.5c-7.5.5-12 5.5-13.5 13M20 3.5c-.5 6.5-5 11-11.5 11.5M6.5 16.5 4 20.5',
};
const svg = (name, label) => `<svg class="icon" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}><path d="${VERB_PATH[name]}"/></svg>`;
const VERB_NAME = { step: 'move', take: 'take', bite: 'bite', shoot: 'shot', shove: 'shove', swap: 'swap', power: 'power', freeze: 'freeze', promote: 'promotion', check: 'check' };
const verbMark = v => `<span class="verb" data-verb="${v}">${svg(v, VERB_NAME[v])}</span>`;
const goldMark = g => (g ? `<span class="gold">${svg('quill')}${g}</span>` : '');

// ---- the page ---------------------------------------------------------------------------------------
let previewing = null, prevHead = false, storyOpen = false, selRow = null;
const app = $('#app');
const params = new URLSearchParams(location.search);
const forced = ['phone', 'desktop'].includes(params.get('frame')) ? params.get('frame') : null;
const desktop = () => app.dataset.layout === 'desktop';
function layout() {
  const next = (forced ?? (innerWidth >= 900 ? 'desktop' : 'phone'));
  if (app.dataset.layout === next) return;
  app.dataset.layout = next;
  $('#line').setAttribute('aria-controls', next === 'desktop' ? 'story-side' : 'story-sheet');
  if (storyOpen) { setStory(false); setStory(true); }
}
layout();
addEventListener('resize', layout);

const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu'), 'menu', 'Menu');
label($('#m-story'), 'book', 'Read the story');
label($('#m-new'), 'plus', 'Start this game again');
label($('#r-story'), 'book', 'Read the story');
label($('#r-new'), 'plus', 'New game');
for (const b of $$('[data-close]')) b.innerHTML = icon('close');

// ---- the board ---------------------------------------------------------------------------------------
const board = createBoard($('#board'), {
  play: { level: 'club', human: 'both', ms: 500, pause: 450 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onMove(story) { afterMove(story); },
  onInspect(sq, cell) {
    // A long press on a marked target names the move; anywhere else it reads the piece.
    // A mouse that rests on a piece never drops the piece you hold: a hover reads only when nothing is selected.
    if (board.selected != null) {
      if (targetsAt(sq).length) { preview(sq); return; }
      if (via === 'hover') return;
    }
    showRead(sq, cell, { hover: via === 'hover' });
  },
  onTap() { if (!$('#read').hidden) hideRead(); return true; },
  onSelect(sq) { if (sq == null) preview(null); },
});

// ---- ink on a board: the cause line, a trail, an arrow --------------------------------------------
/** A square's point on the ink grid (100 units a square). y 50 is the centre; y 64 is the ground under a figure. */
function point(b, sq, y = 50) {
  const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1;
  const col = b.flipped ? 7 - f : f, row = b.flipped ? r : 7 - r;
  return [col * 100 + 50, row * 100 + y];
}
const held = (b, sq) => !!b.cells?.[KD.sq.index(sq)];
/** Where a line leaves (sign 1) or enters (sign -1) a square: at its edge when a figure stands there, else at its centre. */
function anchor(b, sq, ux, uy, sign) {
  const [cx, cy] = point(b, sq);
  if (!held(b, sq)) return [cx, cy];
  const t = 50 / Math.max(Math.abs(ux), Math.abs(uy));
  return [cx + sign * ux * t, cy + sign * uy * t];
}
function clearInk(b) { b.layer.querySelectorAll('.ink').forEach(el => el.remove()); }
/**
 * Thin ink under the figures (z-index 5: over the squares and marks, under every figure), so a line
 * never covers the piece that caused the move. parts: [{ from, to, dashed, head: 'arrow' | 'ring', dot }]
 */
async function ink(b, parts, { draw = true, width = 1, cls = '' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, 'svg');
  el.setAttribute('class', cls ? `ink ${cls}` : 'ink'); el.setAttribute('viewBox', '0 0 800 800'); el.setAttribute('aria-hidden', 'true');
  const strokes = [], R = 26;
  for (const p of parts) {
    const [ax, ay] = point(b, p.from), [bx, by] = point(b, p.to);
    const l0 = Math.hypot(bx - ax, by - ay) || 1;
    const [x1, y1] = anchor(b, p.from, (bx - ax) / l0, (by - ay) / l0, 1);
    const ring = p.head === 'ring';
    const [x2, y2] = ring ? point(b, p.to, held(b, p.to) ? 64 : 50) : anchor(b, p.to, (bx - ax) / l0, (by - ay) / l0, -1);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const s = 15 * width, tip = ring ? 0 : 3;
    const lead = held(b, p.from) || p.dot ? 0 : 10;
    const stop = ring ? R + 3 : tip + s * 0.7;
    const d = `M${x1 + ux * lead} ${y1 + uy * lead}L${x2 - ux * stop} ${y2 - uy * stop}`;
    const dash = p.dashed ? ` stroke-dasharray="${10 * width} ${8 * width}"` : '';
    let html = `<path class="halo" d="${d}" stroke-width="${7.5 * width}"/><path class="stroke" d="${d}" stroke-width="${3.5 * width}"${dash}/>`;
    if (p.dot) html += `<circle class="halo" cx="${x1}" cy="${y1}" r="${6 * width}" stroke-width="${3 * width}"/><circle class="dot" cx="${x1}" cy="${y1}" r="${5.5 * width}"/>`;
    if (ring) html += `<circle class="halo" cx="${x2}" cy="${y2}" r="${R}" stroke-width="${7.5 * width}"/><circle class="ring" cx="${x2}" cy="${y2}" r="${R}" stroke-width="${3.5 * width}"/>`;
    else {
      const hx = x2 - ux * tip, hy = y2 - uy * tip, px = -uy, py = ux;
      const tri = `M${hx} ${hy}L${hx - ux * s + px * s * 0.6} ${hy - uy * s + py * s * 0.6}L${hx - ux * s - px * s * 0.6} ${hy - uy * s - py * s * 0.6}z`;
      html += `<path class="halo" d="${tri}" stroke-width="${3.5 * width}" stroke-linejoin="round"/><path class="head" d="${tri}"/>`;
    }
    const g = document.createElementNS(ns, 'g');
    g.innerHTML = html;
    el.appendChild(g);
    strokes.push(g);
  }
  b.layer.appendChild(el);
  if (draw) await Promise.all(strokes.map((g, i) => animate(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: i * 120, easing: 'ease-out', fill: 'backwards' })));
  return el;
}

// ---- mini boards: the recap panels and the selected story row --------------------------------------
function miniBoard(host, state, parts, { fallen } = {}) {
  host.innerHTML = '';
  const b = createBoard(host, { interactive: false, coords: false, headroom: 0.12, sound: false });
  b.setBoard(KD.board(state));
  if (fallen) b.figure(fallen)?.classList.add('is-fallen');
  ink(b, parts, { draw: false, width: 2.6 });
  return b;
}
function partsFor(e) {
  const { st } = e;
  if (st.kind === 'shoot') return [{ from: st.from, to: st.capturedOn[0], dashed: true, head: 'ring', dot: true }];
  if (st.kind === 'chain') return [{ from: st.from, to: st.capturedOn[0] }, { from: st.capturedOn[0], to: st.to }];
  if (st.kind === 'push') return [{ from: st.from, to: st.to }, { from: st.push.from, to: st.push.to }];
  if (st.kind === 'swap') return [{ from: st.from, to: st.to }, { from: st.to, to: st.from }];
  if (st.kind === 'power' && st.from === st.to) return [];
  return [{ from: st.from, to: st.to }];
}

// ---- rendering --------------------------------------------------------------------------------------

function renderPlates(s, { strikeUsed = false } = {}) {
  const st = KD.status(s);
  $('#them').dataset.turn = String(!st.over && st.turn === 'b');
  $('#you').dataset.turn = String(!st.over && st.turn === 'w');
  $('#head').textContent = `Move ${st.moveNumber}`;
  const left = c => KD.usesLeft(s, c);
  const them = $('#them-power'), strikeLeft = strikeUsed ? 0 : left('b');
  them.dataset.spent = String(!strikeLeft);
  them.innerHTML = `${svg('power')}Strike <small>${strikeLeft ? 'ready' : 'used'}</small>`;
  them.setAttribute('aria-label', `Their power: Strike, ${strikeLeft ? 'ready' : 'used'}`);
  const you = $('#you-power'), fl = left('w');
  you.dataset.spent = String(!fl);
  you.disabled = !fl || st.over || st.turn !== HUMAN;
  you.innerHTML = `${svg('freeze')}Freeze <small>${fl ? fl + ' left' : 'used'}</small>`;
  you.setAttribute('aria-pressed', String(board.armed === 'freeze'));
}

function displayLines(entries) {
  // Each move is one line; a check adds its own line after the move.
  const out = [];
  for (const e of entries) {
    if (e.gap) { out.push({ gap: true, plain: e.text }); continue; }
    out.push({ e, side: e.st.side, piece: e.st.piece, verb: e.w.verb, line: e.w.line, plain: e.w.plain, gold: e.gold });
    if (e.w.check) out.push({ e, side: e.st.side, piece: e.st.piece, verb: 'check', line: e.w.check, plain: e.w.check, check: true });
  }
  return out;
}

function nowHTML(d, { preview: pv = false } = {}) {
  return `${pieceIcon(d.piece, d.side)}${verbMark(d.verb)}<span class="txt">${d.line}</span>`;
}

function renderTale({ write = false } = {}) {
  const s = board.state;
  const lines = displayLines(record());
  const now = $('#now');
  let current = lines.at(-1);
  let tail = previewing ? lines : lines.slice(0, -1);
  if (prevHead) {
    // "Previously": the last two moves under one heading.
    const moves = lines.filter(l => !l.check && !l.gap);
    current = moves.at(-1); tail = moves.slice(0, -1);
  }
  const li = l => (l.gap ? `<li><span>· · ·</span></li>` : `<li>${pieceIcon(l.piece, l.side)}<span>${l.plain}</span></li>`);
  // Two older lines at most, on a phone and on a desktop: the full story stays folded (option B opens it).
  $('#tail').innerHTML = prevHead ? `<li class="prev-li">Previously</li>${tail.slice(-1).map(li).join('')}` : tail.slice(-2).map(li).join('');
  now.classList.toggle('is-preview', !!previewing);
  now.classList.toggle('is-check', !previewing && !!current?.check);
  if (previewing) now.innerHTML = nowHTML(previewing);
  else if (current && !current.gap) now.innerHTML = nowHTML(current);
  else now.innerHTML = '<span class="txt">Tap a piece to see its moves.</span>';

  const st = s ? KD.status(s) : null;
  let kick = '';
  if (previewing) kick = previewing.kick ?? 'Preview · tap to play';
  else if (!st) kick = '';
  else if (st.over) kick = st.winner === HUMAN ? 'You win' : st.winner ? 'You lose' : 'Draw';
  else if (prevHead) kick = st.check ? 'Your move · in check' : 'Your move';
  else if (board.armed === 'freeze') kick = 'Freeze · tap an enemy piece';
  else kick = st.turn === HUMAN ? (st.check ? 'Your move · in check' : 'Your move') : board.isHuman(st.turn) ? 'Their move' : 'Their move · Flame thinks';
  $('#kick').textContent = kick;
  const gold = !previewing && current && !current.check ? current.gold : !previewing && current?.check ? lines.at(-2)?.gold : null;
  $('#gold').innerHTML = gold ? `<span class="pill pill-gold">${svg('quill')}${gold}</span>` : '';
  $('#cue').innerHTML = desktop() ? `Read the story${icon('chevron')}` : `Story${icon('chevron-down')}`;
  $('#line').setAttribute('aria-label', `${now.textContent} ${kick}. Open the story.`);

  if (write && !previewing) {
    const txt = now.querySelector('.txt');
    animate(txt, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' });
    animate(now.querySelector('.verb'), [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 160, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' });
    const last = $('#tail li:last-child');
    if (last) animate(last, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const g = $('#gold .pill');
    if (g) animate(g, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 380, fill: 'backwards' });
  }
}

function renderStoryList(list) {
  const entries = record();
  list.innerHTML = entries.map((e, i) => {
    if (e.gap) return `<li class="gap-row">${e.text}</li>`;
    const sel = i === selRow;
    const n = e.st.side === 'w' ? e.n : '';
    return `<li data-i="${i}" class="${sel ? 'is-sel' : ''}">
      <button type="button" class="srow" aria-expanded="${sel}"><span class="n">${n}</span>
        <span class="marks">${pieceIcon(e.st.piece, e.st.side)}${verbMark(e.w.verb)}</span>
        <span class="txt">${e.w.plain}${goldMark(e.gold)}${e.w.check ? `<span class="sub">${e.w.check}</span>` : ''}</span></button>
      <div class="detail"><div class="mini"></div><div class="where">${e.w.where}<small>${[e.w.note, e.w.checkWhere && cap(e.w.checkWhere) + '.'].filter(Boolean).join(' ')}</small></div></div>
    </li>`;
  }).join('');
  if (selRow != null && entries[selRow] && !entries[selRow].gap) {
    const e = entries[selRow], li = list.querySelector(`li[data-i="${selRow}"]`);
    if (li && li.offsetParent) miniBoard(li.querySelector('.mini'), e.st.next, partsFor(e));
  }
}
function renderStory() {
  renderStoryList($('#story-sheet-list'));
  renderStoryList($('#story-side-list'));
  board.clearMarks('hint');
  const e = record()[selRow];
  // Reading only: the board keeps its position; gold frames name the squares of the selected row.
  if (desktop() && storyOpen && e && !e.gap) board.mark([...new Set([e.st.from, e.st.to, ...(e.st.capturedOn ?? [])])], 'hint');
}
function onStoryClick(ev) {
  const li = ev.target.closest('li[data-i]');
  if (!li) return;
  const i = +li.dataset.i;
  selRow = selRow === i ? null : i;
  renderStory();
  const again = ev.currentTarget.querySelector(`li[data-i="${i}"] .srow`);
  again?.focus({ preventScroll: true });
}
$('#story-sheet-list').addEventListener('click', onStoryClick);
$('#story-side-list').addEventListener('click', onStoryClick);

/** focus: a person opened it (not a script), so the focus goes into the story on a desktop. */
function setStory(open, { focus = false } = {}) {
  storyOpen = open;
  $('#line').setAttribute('aria-expanded', String(open));
  if (desktop()) {
    $('#tale').classList.toggle('is-open', open);
    if (!open) board.clearMarks('hint');
  } else if (open) openSheet('story-sheet');
  else if ($('#story-sheet').open) closeSheet('story-sheet');
  if (open) {
    renderStory();
    requestAnimationFrame(() => {
      const list = desktop() ? $('#story-side-list') : $('#story-sheet-list');
      const target = list.querySelector('li.is-sel') ?? list.lastElementChild;
      target?.scrollIntoView({ block: 'nearest' });
      // The line button hides when the story opens on a desktop: keep the keyboard's place in the story.
      if (focus && desktop()) (list.querySelector('li.is-sel .srow') ?? $('#fold')).focus({ preventScroll: true });
    });
  }
}
$('#line').addEventListener('click', () => setStory(true, { focus: true }));
$('#tail').addEventListener('click', () => setStory(true));
$('#fold').addEventListener('click', () => { setStory(false); $('#line').focus(); });
$('#story-sheet').addEventListener('close', () => { storyOpen = false; $('#line').setAttribute('aria-expanded', 'false'); });

// ---- reading a piece: the card takes the place of the line ------------------------------------------
const RULE = {
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
  pawn: 'Steps forward. Takes one square diagonally forward.',
  knight: 'Leaps in an L, over any piece.',
  bishop: 'Slides any distance on a diagonal.',
  rook: 'Slides any distance in a straight line.',
  queen: 'Slides any distance, straight or diagonal.',
};
const KING_RULE = { frost: FREEZE_TEXT, flame: STRIKE_TEXT };
const LETTER = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k', archer: 'a', paladin: 'l', guard: 'g', maester: 'm', beast: 's', ogre: 'o' };
function fenOf(cells, turn) {
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const c = cells[r * 8 + f];
      if (!c) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += c.color === 'w' ? LETTER[c.type].toUpperCase() : LETTER[c.type];
    }
    rows.push(row + (empty || ''));
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}
/** The reach of any piece, from the engine: its moves with that side to move, and an Archer's shots (probed). */
function reach(state, sq) {
  const cells = KD.board(state), me = at(cells, sq);
  const safe = fn => { try { return fn(); } catch { return []; } };
  const legal = safe(() => KD.legal(KD.fromFen(fenOf(cells, me.color)), sq)).filter(m => !m.power);
  const moves = [...new Set(legal.filter(m => m.kind === 'move').map(m => m.to))];
  const takes = [...new Set(legal.filter(m => m.kind === 'capture' || m.kind === 'chain').map(m => m.path[0]))];
  const swaps = [...new Set(legal.filter(m => m.kind === 'swap').map(m => m.to))];
  const shoves = [...new Set(legal.filter(m => m.kind === 'push').map(m => m.push.from))];
  let shots = [];
  if (me.type === 'archer') {
    // Put an enemy pawn on each empty or enemy square, and ask the engine if she can shoot it.
    for (let i = 0; i < 64; i++) {
      const c = cells[i], name = KD.sq.name(i);
      if (name === sq || (c && (c.color === me.color || c.type === 'king'))) continue;
      const probe = cells.slice(); probe[i] = { type: 'pawn', color: other(me.color) };
      if (safe(() => KD.legal(KD.fromFen(fenOf(probe, me.color)), sq)).some(m => m.kind === 'shoot' && m.captures?.length && m.lan.endsWith('*' + name))) shots.push(name);
    }
  }
  return { moves, takes, swaps, shoves, shots };
}
let readHover = null; // the square of a card that a mouse hover opened: it closes when the mouse moves on
function showRead(sq, cell, { hover = false } = {}) {
  if (!board.state || !cell) return;
  hideRead({ quiet: true });
  readHover = hover ? sq : null;
  board.clearSelection(false);
  const r = reach(board.state, sq);
  board.mark(r.moves, 'move'); board.mark(r.takes, 'capture'); board.mark(r.shots, 'shot');
  board.mark(r.swaps, 'swap'); board.mark(r.shoves, 'glow', { colour: '64,190,176' });
  board.mark(sq, 'glow', { colour: '201,154,62' });
  const W = Who(cell.color), P = cell.type === 'king' ? `${cap(cell.design ?? '')} king`.trim() : pname(cell.type);
  const text = cell.type === 'king' ? (KING_RULE[cell.design] ?? 'Steps one square in any direction.') : RULE[cell.type];
  const squares = n => `${n} square${n === 1 ? '' : 's'}`;
  const She = cell.type === 'archer' ? 'She' : 'It', go = r.moves.length + r.takes.length + r.swaps.length + r.shoves.length;
  const meta = (cell.type === 'archer' ? `<span>${svg('shoot')} ${She} can shoot ${squares(r.shots.length)} from ${sq}.</span>` : '')
    + `<span>${svg('step')} ${She} can go to ${squares(go)}.</span>`;
  const read = $('#read');
  read.innerHTML = `<img src="${pieceArt(cell.type, cell.color, cell.design)}" alt="">
    <div><h3>${W} ${P}<small>${sq}</small></h3><p>${text}</p>
    <div class="meta">${meta}<span class="pill">${icon('eye')}Reading only</span></div></div>
    <button type="button" class="btn btn-icon" id="read-close" aria-label="Close" style="position:absolute;top:2px;right:4px">${icon('close')}</button>`;
  read.hidden = false;
  read.querySelector('#read-close').addEventListener('click', () => { hideRead(); board.el.focus(); });
  animate(read, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
function hideRead({ quiet = false } = {}) {
  readHover = null;
  if ($('#read').hidden) return;
  $('#read').hidden = true;
  if (!quiet) for (const k of ['move', 'capture', 'shot', 'swap', 'glow']) board.clearMarks(k);
}
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#read').hidden) hideRead(); });

// ---- naming a move before you play it (hover, finger down, keyboard cursor) -----------------------
const targetsAt = sq => (board.targets ?? []).filter(m => m.path[board.pending.length] === sq && m.path.length === board.pending.length + 1);
function preview(sq, { kick } = {}) {
  const was = previewing;
  previewing = null;
  const ms = sq && board.state && board.selected != null ? targetsAt(sq) : [];
  if (ms.length === 1) {
    const st = KD.describe(board.state, ms[0]), w = tell(st, KD.board(board.state), { preview: true });
    previewing = { side: st.side, piece: st.piece, verb: w.verb, line: w.line, kick };
  } else if (ms.length > 1) {
    const st = KD.describe(board.state, ms[0]);
    previewing = { side: st.side, piece: st.piece, verb: 'step', line: 'Two moves here. Tap to choose.', kick };
  }
  board.layer.querySelectorAll('.ink.pv').forEach(el => el.remove());
  if (ms.length === 1) {
    const st = KD.describe(board.state, ms[0]);
    const parts = (st.kind === 'push' ? [{ from: st.push.from, to: st.push.to }] : partsFor({ st })).map(p => ({ ...p, dashed: true }));
    if (parts.length) ink(board, parts, { draw: false, cls: 'pv' });
  }
  if (was || previewing) renderTale();
}
function squareAt(x, y) {
  for (let i = 0; i < 64; i++) {
    const name = KD.sq.name(i), r = board.squareRect(name);
    if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) return name;
  }
  return null;
}
const host = $('#board');
let via = 'key'; // how the last read began: 'hover' (a resting mouse), 'press' (a long press) or 'key' (I)
host.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  if (!e.buttons) via = 'hover';
  const sq = squareAt(e.clientX, e.clientY);
  if (readHover && sq !== readHover) hideRead();
  if (!board.busy) preview(sq);
});
host.addEventListener('pointerleave', () => { if (readHover) hideRead(); preview(null); });
host.addEventListener('pointerdown', e => { via = 'press'; if (e.pointerType !== 'mouse') preview(squareAt(e.clientX, e.clientY)); });
host.addEventListener('keydown', () => { via = 'key'; }, true); // capture: before the board reads the I key
host.addEventListener('keydown', e => {
  if (e.key.startsWith('Arrow')) setTimeout(() => preview(KD.sq.name(board.cursor)), 0);
});

// ---- after each move: the line writes itself; a check draws its cause ------------------------------
async function afterMove(story) {
  previewing = null; prevHead = false; hideRead({ quiet: true });
  clearInk(board);
  renderPlates(board.state); renderTale({ write: true });
  if (storyOpen) renderStory();
  // A take without contact keeps a thin ink line from the cause, until the next move.
  if (story.kind === 'shoot') ink(board, [{ from: story.from, to: story.capturedOn[0], dashed: true, head: 'ring', dot: true }]);
  if (story.check && !story.mate) {
    await wait(520, { instant: true });
    renderTale({ write: true });
    drawCause();
  }
  if (story.mate && board.play.human !== 'both') { await wait(1100, { instant: true }); openRecap(); }
}
function drawCause({ draw = true } = {}) {
  const e = record().filter(x => !x.gap).at(-1);
  if (!e || !e.st.check || e.st.mate) return;
  return ink(board, [{ from: e.w.by, to: e.st.checkSq, head: 'ring', dot: true }], { draw });
}

// ---- the recap: three panels, then Rematch --------------------------------------------------------
function openRecap() {
  const moments = [entriesOf(SHOT).at(-1), entriesOf(STRIKE).at(-1), entriesOf(MATED).at(-1)];
  const mate = moments[2];
  $('#recap-tag').textContent = `The ${pname(mate.st.piece)}'s game`;
  $('#recap-sub').textContent = `You win on move ${mate.n}.`;
  $('#panels').innerHTML = moments.map(e => `<figure class="panel"><div class="mini"></div><figcaption><b>Move ${e.n}</b>${e.w.line}</figcaption></figure>`).join('');
  openSheet('recap');
  const figs = $$('#panels .panel');
  moments.forEach((e, i) => {
    const parts = e.st.mate ? [{ from: e.st.from, to: e.st.to }, { from: e.st.to, to: e.st.checkSq ?? 'h8', dashed: true, head: 'ring' }]
      : e.st.check ? [{ from: e.st.from, to: e.st.to }, { from: e.st.to, to: e.st.checkSq, dashed: true, head: 'ring' }] : partsFor(e);
    const fallen = e.st.mate ? KD.board(e.st.next).find(c => c?.type === 'king' && c.color !== e.st.side)?.sq : null;
    miniBoard(figs[i].querySelector('.mini'), e.st.next, parts, { fallen });
    animate(figs[i], [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 260 + i * 140, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  });
}
$('#rematch').addEventListener('click', async () => { await closeSheet('recap'); window.demo.reset(); toast('Same armies. You play White.'); });
$('#r-new').addEventListener('click', async () => { await closeSheet('recap'); window.demo.reset(); });
$('#r-story').addEventListener('click', async () => { await closeSheet('recap'); selRow = null; setStory(true, { focus: true }); });

// ---- the bar ---------------------------------------------------------------------------------------
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || KD.status(s).over || board.busy || !board.isHuman(KD.status(s).turn)) return;
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (!m || board.state !== s) return;
  if (m.needsArming) { board.mark(m.from, 'hint'); return; }
  board.selectSquare(m.from);
  const to = m.path.at(-1) ?? m.to;
  board.mark(to, 'hint');
  preview(m.path[0], { kick: 'Hint · tap the gold square' });
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s?.history.length) return;
  const st = KD.status(s);
  const plies = board.isHuman(st.turn) && board.play.human !== 'both' ? 2 : 1;
  let back = s;
  for (let i = 0; i < plies && back.history.length > (chapter === 'p1' ? LEAD_IN.length : 0); i++) back = KD.undo(back);
  show(back, { human: board.play.human });
});
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#m-story').addEventListener('click', async () => { await closeSheet('menu-sheet'); selRow = null; setStory(true, { focus: true }); });
$('#m-new').addEventListener('click', async () => { await closeSheet('menu-sheet'); window.demo.reset(); });
$('#you-power').addEventListener('click', () => {
  if (!board.state || KD.usesLeft(board.state, HUMAN) < 1) return;
  board.arm(board.armed === 'freeze' ? null : 'freeze');
  renderPlates(board.state); renderTale();
});

// ---- show a game ------------------------------------------------------------------------------------
function show(state, { human = 'both', ch = 'p1', strikeUsed = false } = {}) {
  chapter = ch;
  for (const id of ['story-sheet', 'menu-sheet', 'recap']) { const d = document.getElementById(id); if (d.open) { d.classList.remove('is-closing'); d.close(); } }
  hideToast();
  storyOpen = false; selRow = null; previewing = null; prevHead = false;
  $('#tale').classList.remove('is-open');
  $('#read').hidden = true;
  board.play.human = human;
  board.arm?.(null);
  board.clearSelection(false);
  board.clearMarks();
  board.setState(state);
  clearInk(board);
  board.clearMarks('hint');
  renderPlates(state, { strikeUsed });
  renderTale();
}

// ---- the demo contract ------------------------------------------------------------------------------
let run = 0;
window.demo = {
  async state(name) {
    run++;
    switch (name) {
      case 'rest': show(P1); break;
      case 'read': show(P1); showRead('b6', at(KD.board(P1), 'b6')); break;
      case 'select':
        show(P1);
        board.selectSquare('c3');
        board.hover?.(KD.sq.index('c4'));
        preview('c4');
        break;
      case 'played': show(P1); await board.playMove('Aa3*a5'); break;
      case 'check': show(SHOT); await board.playMove('Ab6-e3!'); await wait(700); break;
      case 'end':
        show(P2, { ch: 'p2', strikeUsed: true });
        await board.playMove('Ae5-f6');
        renderPlates(board.state, { strikeUsed: true });
        openRecap();
        break;
      case 'story':
        show(STRIKE);
        drawCause({ draw: false });
        selRow = record().findIndex(e => e.st?.lan === 'Aa3*a5');
        setStory(true);
        break;
      case 'previously': {
        show(SHOT);
        prevHead = true; renderTale();
        await wait(400, { instant: true });
        await board.playMove('Ab6-e3!');
        await wait(600, { instant: true });
        prevHead = true; clearInk(board);
        renderTale();
        ink(board, [{ from: 'b6', to: 'e3', dashed: true }]);
        drawCause();
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The best moment: the line names the shot before you play it, then writes it; Strike and check;
  // the Beast answers; later the Archer mates, and the recap turns in like a page.
  async play() {
    const me = ++run, live = () => me === run;
    show(P1);
    await wait(1400, { instant: true }); if (!live()) return;
    board.selectSquare('a3');
    await wait(700, { instant: true }); if (!live()) return;
    board.hover?.(KD.sq.index('a5')); preview('a5');
    await wait(1700, { instant: true }); if (!live()) return;
    await board.playMove('Aa3*a5'); if (!live()) return;
    await wait(1600, { instant: true }); if (!live()) return;
    await board.playMove('Ab6-e3!'); if (!live()) return;
    await wait(2400, { instant: true }); if (!live()) return;
    board.selectSquare('e4');
    await wait(600, { instant: true }); if (!live()) return;
    board.hover?.(KD.sq.index('e3')); preview('e3');
    await wait(1400, { instant: true }); if (!live()) return;
    await board.playMove('Se4xe3'); if (!live()) return;
    await wait(1500, { instant: true }); if (!live()) return;
    show(P2, { ch: 'p2', strikeUsed: true });
    $('#kick').textContent = 'Later · move 24 · your move';
    await wait(1200, { instant: true }); if (!live()) return;
    board.selectSquare('e5');
    await wait(500, { instant: true }); if (!live()) return;
    board.hover?.(KD.sq.index('f6')); preview('f6');
    await wait(1500, { instant: true }); if (!live()) return;
    await board.playMove('Ae5-f6'); if (!live()) return;
    renderPlates(board.state, { strikeUsed: true });
    await wait(1300, { instant: true }); if (!live()) return;
    openRecap();
    await wait(2600, { instant: true });
  },
  async reset() { run++; show(P1, { human: HUMAN, ch: 'p1' }); },
};

// ?state=name shows one state at once (the compare view); else the game is yours to play.
const first = params.get('state');
if (first) window.demo.state(first);
else window.demo.reset();
