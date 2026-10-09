// King powers: a spent power you can read at rest, arm, preview, cast in three beats and keep as a record;
// the opponent's power reveals itself before it acts; an always-on power reads on a tap.
// The game is P1 of the idea bank (a Kings' powers game: you are Frost with Freeze, the computer is Flame
// with Strike), played by the real engine. Every rule on the screen comes from the engine (KD.legal,
// KD.usesLeft, the Freeze mark in the position) and from docs/RULES.md section 4.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, emblemArt } from '../../kit/icons.js';
import { $, toast, hideToast, sfx, haptic, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

// ---- the game --------------------------------------------------------------------------------

// P1 one move early, so the board marks Black's last move (e7 to e6) as the app does.
const PRE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const FROST = ['Frost:Freeze', 'Flame:Strike'];
const SPIRIT = ['Spirit:HolyLight', 'Flame:Strike'];
const p1 = (powers = FROST) => KD.play(KD.fromFen(PRE, { powers }), 'e7-e6');
const playLans = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);
const FLOOR = 1; // Undo never goes back past P1

const RING = { frost: '#3f74b0', flame: '#b24425', spirit: '#c9a85a', shadow: '#4d453c', stratus: '#7d5ba6', mud: '#5d7a3a' };
const cap = w => w[0].toUpperCase() + w.slice(1);
const POWER_NAME = Object.fromEntries(KD.kings().flatMap(k => k.powers.map(p => [p.power, p.name])));
// Short rule lines for the screen, eight words or fewer each (docs/RULES.md section 4).
// A frozen piece has no move at all: an archer cannot shoot either (the engine drops every move from
// the marked square). It still attacks squares, so it still gives check.
const frozenLines = (type, when = 'next turn') => [`It cannot move or ${type === 'archer' ? 'shoot' : 'take'} ${when}.`, 'It still gives check.'];
const RULE = {
  Freeze: ['Freeze an enemy piece, not the king.', ...frozenLines('piece'), 'Then you make your move.'],
  Strike: ['One piece moves like a queen.', 'Not a pawn or the king. It cannot take.'],
  HolyLight: ['Shielded pieces cannot be taken.', 'Enemy pawns cannot take your king.', 'Your king may take pawns.'],
};

// ---- small views -------------------------------------------------------------------------------

const NS = 'http://www.w3.org/2000/svg';
const flakeSvg = (ghost = false) => `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${ghost ? 'rgba(251,247,238,.85)' : '#fbf7ee'}" stroke="#3f74b0" stroke-width="1.6"${ghost ? ' stroke-dasharray="3 2"' : ''}/>
  <g stroke="#2c5a8f" stroke-width="1.7" stroke-linecap="round" fill="none"><path d="M12 5v14M5.9 8.5l12.2 7M5.9 15.5l12.2-7"/>
  <path d="M10 6.4l2 1.6 2-1.6M10 17.6l2-1.6 2 1.6M6.6 10.6l2.3-.3-.6-2.3M17.4 13.4l-2.3.3.6 2.3M6.6 13.4l2.3.3-.6 2.3M17.4 10.6l-2.3-.3.6-2.3"/></g></svg>`;
const shieldSvg = () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8 3.2v5.6c0 5-3.4 9-8 10.7-4.6-1.7-8-5.7-8-10.7V5.7z" fill="#fbf7ee" stroke="#7a5712" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 6.5v11M8 10h8" stroke="#9a7a2c" stroke-width="1.6" stroke-linecap="round"/></svg>`;

/** Ice at the feet: a ring on the ground (under the figure) and shards in front of its feet. */
function groundSvg(front, ghost) {
  if (ghost) return `<svg viewBox="0 0 112 112" aria-hidden="true"><ellipse cx="56" cy="92" rx="42" ry="14" fill="rgba(200,230,255,.28)" stroke="#3f74b0" stroke-width="2" stroke-dasharray="6 5"/></svg>`;
  if (!front) return `<svg viewBox="0 0 112 112" aria-hidden="true"><ellipse cx="56" cy="92" rx="46" ry="16" fill="rgba(214,236,255,.62)" stroke="rgba(255,255,255,.95)" stroke-width="2.4"/><ellipse cx="56" cy="92" rx="46" ry="16" fill="none" stroke="#3f74b0" stroke-width="1.3"/></svg>`;
  let shards = '';
  [[18, 13, -2], [40, 20, -1], [62, 15, 1], [86, 22, 2], [112, 12, 1], [136, 18, 2], [160, 11, 3]].forEach(([deg, h, lean]) => {
    const a = deg * Math.PI / 180, x = 56 + Math.cos(a) * 44, y = 92 + Math.sin(a) * 15, w = 4.2;
    shards += `<path d="M${(x - w).toFixed(1)} ${y.toFixed(1)}L${(x + lean).toFixed(1)} ${(y - h).toFixed(1)}L${(x + w).toFixed(1)} ${y.toFixed(1)}Z"/>`;
  });
  return `<svg viewBox="0 0 112 112" aria-hidden="true"><defs><linearGradient id="kp-shard" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfe6fb"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
    <g fill="url(#kp-shard)" stroke="#3f74b0" stroke-width="1.1" stroke-linejoin="round">${shards}</g></svg>`;
}

// ---- the board ---------------------------------------------------------------------------------

const board = createBoard($('#board'), {
  play: { level: 'casual', human: 'both' },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap,
  onInspect,
  onMove,
});
const layer = board.layer;
const fx = layer.querySelector('.kdb-fx');
const veil = document.createElement('div');
veil.className = 'kp-veil';
layer.appendChild(veil);
const ground = document.createElementNS(NS, 'svg'); // the Strike trail: on the ground, under the figures
ground.setAttribute('viewBox', '0 0 800 800');
ground.setAttribute('preserveAspectRatio', 'none');
ground.setAttribute('aria-hidden', 'true');
Object.assign(ground.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '4', pointerEvents: 'none', overflow: 'visible' });
layer.appendChild(ground);

// ---- the screen's own state (the game is board.state) ------------------------------------------

let ui = blank();
function blank(option = 'A') {
  return { option, armed: false, preview: null, reading: false, thinking: false, revealing: null, revealed: null, thawed: null, note: null };
}
let run = 0;   // a new state, play or reset stops the old flows
let flow = false; // a cast or a reply is on: taps wait

const turnOf = s => KD.status(s).turn;
const kingSq = (s, side) => KD.board(s).find(c => c && c.type === 'king' && c.color === side)?.sq;
const cellAt = (s, sq) => KD.board(s)[KD.sq.index(sq)];

/** Each move of the game with its story and its move number (cached per state). */
const storyCache = new WeakMap();
function stories(s) {
  if (storyCache.has(s)) return storyCache.get(s);
  const chain = [s];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  const out = s.history.map((h, i) => ({ story: KD.describe(chain[i], h.lan), moveNumber: KD.status(chain[i]).moveNumber }));
  storyCache.set(s, out);
  return out;
}

/** A side's power: its name, uses left (null = always on), and the move of its last use. */
function powerOf(s, side) {
  const k = s.kings[side === 'w' ? 0 : 1];
  if (!k) return null;
  const left = KD.usesLeft(s, side);
  const uses = stories(s).filter(x => x.story.side === side && x.story.powerTag && !['march', 'leap'].includes(x.story.powerTag));
  return {
    king: k.king.toLowerCase(), power: k.power, name: POWER_NAME[k.power] ?? k.power,
    left, always: left === null && !uses.length, total: (left ?? 0) + uses.length, usedOn: uses.at(-1)?.moveNumber ?? null,
  };
}

/** Squares frozen now: the Freeze mark of each side (it binds the other side for one turn). */
function frozen(s) {
  const out = [];
  s.pos.marks?.forEach((m, i) => {
    if (!m || m.left === 0) return;
    const by = i === 0 ? 'w' : 'b';
    if (s.kings[i]?.power === 'Freeze') out.push({ sq: KD.sq.name(m.sq), by });
  });
  return out;
}

/** A move in a few words: the piece, its square, the verb, the target: "archer a3 shoots a5". */
const VERB = { shoot: 'shoots', capture: 'takes', chain: 'takes', push: 'pushes', swap: 'swaps with' };
const brief = story => `${story.piece} ${story.from} ${VERB[story.kind] ?? 'to'} ${story.to}`;

/** The last move in the player's words: "Their pawn e7 to e6." */
function tell(story) {
  if (story.powerTag === 'freeze') {
    const t = cellAt(story.next, story.to)?.type ?? 'piece';
    return story.side === 'w' ? `You froze their ${t} on ${story.to}.` : `They froze your ${t} on ${story.to}.`;
  }
  return `${story.side === 'w' ? 'Your' : 'Their'} ${brief(story)}.`;
}

// ---- the strips ----------------------------------------------------------------------------------

function controlState(side, pw) {
  if (!pw) return 'none';
  if (side === 'w' && ui.armed) return 'armed';
  if (side === 'b' && ui.revealing) return 'revealed'; // the red face only while it names itself
  if (pw.always) return 'always';
  return pw.left === 0 ? 'used' : 'ready';
}
function subText(state, pw) {
  if (state === 'armed') return 'Armed';
  if (state === 'always') return 'Always on';
  if (state === 'revealed') return 'Used now';
  if (state === 'used') return pw.usedOn ? `Used on move ${pw.usedOn}` : 'Used';
  return `${pw.left} left`;
}

function stripHTML(side) {
  const s = board.state, you = side === 'w', st = KD.status(s);
  const pw = powerOf(s, side);
  const design = pw?.king ?? (you ? 'spirit' : 'shadow');
  const state = controlState(side, pw);
  const sub = pw ? subText(state, pw) : '';
  const id = `power-${side}`;
  const label = pw ? `${pw.name}: ${sub}.` : '';
  const turn = !st.over && st.turn === side;
  // The words for the turn live in the context line; their strip says when they think.
  const tag = turn && !you && ui.thinking ? '<span class="turn-tag">Thinking</span>' : '';
  const who = `<div class="who"><b>${you ? 'You' : 'Computer'}${tag}</b><span>${cap(design)} king${you ? '' : ' · Casual'}</span></div>`;
  const face = `<span class="portrait" data-king="${design}" style="--ring:${RING[design]}"><img src="${pieceArt('king', side, design)}" alt=""></span>`;
  if (!pw) return face + who;
  const emblem = `<img src="${emblemArt(design)}" alt="">`;
  if (ui.option === 'B') {
    const notches = pw.always ? '' : `<span class="notches" aria-hidden="true">${Array.from({ length: pw.total }, (_, i) => `<span class="notch${i < pw.total - pw.left ? ' is-spent' : ''}"></span>`).join('')}</span>`;
    return `<div class="with-coin">${face}<button type="button" class="coin" id="${id}" data-state="${state}" aria-label="${label}"${you ? ` aria-pressed="${ui.armed}"` : ''}>${emblem}${notches}</button></div>${who}`;
  }
  if (ui.option === 'C') {
    const gem = pw.always ? '' : `<span class="gem" aria-hidden="true">${pw.left}</span>`;
    return `<button type="button" class="pbtn" id="${id}" style="--ring:${RING[design]}" data-state="${state}" aria-label="${cap(design)} king. ${label}"${you ? ` aria-pressed="${ui.armed}"` : ''}>${face}${gem}</button>${who}`;
  }
  const pressed = you && state !== 'always' ? ` aria-pressed="${ui.armed}"` : state === 'always' ? ` aria-expanded="${ui.reading}"` : '';
  return `${face}${who}<button type="button" class="ptile" id="${id}" data-state="${state}"${pressed}>${emblem}<span><span class="pt-name">${pw.name}</span><span class="pt-sub${state === 'ready' && you ? ' is-left' : ''}">${sub}</span></span></button>`;
}

// ---- the context area: one task at a time ------------------------------------------------------

function movesLine(s) {
  const last = stories(s).at(-1);
  if (!last) return '';
  return `<button type="button" class="moves-line" id="moves-line" aria-label="Moves. Last move: ${tell(last.story)}">${pieceIcon(last.story.piece, last.story.side)}<span>${tell(last.story)}</span>${icon('chevron-down')}</button>`;
}
const ruleRow = (art, text) => `<p class="rule">${art}<span>${text}</span></p>`;
const SPACER = '<span style="width:18px;flex:none"></span>';
/** Rule rows: the art on the first row only. */
const rules = (lines, art) => lines.map((t, i) => ruleRow(i === 0 ? art : SPACER, t)).join('');
const flakeIcon = `<span style="display:inline-block;width:18px;height:18px">${flakeSvg()}</span>`;
const shieldIcon = `<span style="display:inline-block;width:18px;height:18px">${shieldSvg()}</span>`;

function context() {
  const s = board.state, st = KD.status(s);
  if (ui.note) return ui.note;
  if (st.over) return { line: st.text, sub: movesLine(s) };
  if (st.turn === 'b') {
    const ice = frozen(s).find(f => f.by === 'w');
    const sub = ice ? ruleRow(flakeIcon, `Their ${cellAt(s, ice.sq).type} is frozen this turn.`) : movesLine(s);
    return { line: ui.revealing ? `Their king uses ${ui.revealing}.` : 'Their move', sub };
  }
  if (ui.reading) {
    const pw = powerOf(s, 'w');
    return { line: `${pw.name} · always on`, sub: rules(RULE[pw.power] ?? [KD.powerText(pw.power)], shieldIcon), close: 'Close' };
  }
  if (ui.preview) {
    const t = cellAt(s, ui.preview)?.type ?? 'piece';
    // The answer is a tap on the piece: there is no Yes button, so the screen says how to say yes.
    return { line: `Freeze their ${t}?`, sub: '<p class="ctx-how">Tap it to freeze it.</p>' + rules(frozenLines(t), flakeIcon), close: 'Cancel' };
  }
  if (ui.armed) return { line: 'Tap an enemy piece.', sub: '<p>Then make your move.</p>', close: 'Cancel' };
  if (s.pos.free) {
    return {
      line: 'Then make your move.',
      sub: `<div class="steps" role="img" aria-label="Step 1, Freeze, done. Step 2, your move, now."><span class="step is-done"><span class="dot">${icon('check')}</span>Freeze</span><span class="join"></span><span class="step is-now"><span class="dot">2</span>Your move</span></div>`,
    };
  }
  if (ui.revealed) {
    const r = ui.revealed;
    const art = `<img src="${emblemArt(r.king)}" alt="" width="22" height="22" style="flex:none">`;
    return { line: st.check ? `Check from their ${r.piece}.` : 'Your move', sub: ruleRow(art, `Their ${r.name}: ${r.piece} ${r.from} to ${r.to}.`) };
  }
  if (ui.thawed) return { line: st.check ? 'Your move: check' : 'Your move', sub: ruleRow(flakeIcon, `Their ${ui.thawed} can move again.`) };
  return { line: st.check ? 'Your move: check' : 'Your move', sub: movesLine(s) };
}

// ---- render ----------------------------------------------------------------------------------------

let lastLine = '';
function render() {
  const s = board.state;
  if (!s) return;
  const focusId = document.activeElement?.id;
  const st = KD.status(s);
  $('#app').dataset.option = ui.option;
  $('#them').innerHTML = stripHTML('b');
  $('#you').innerHTML = stripHTML('w');
  $('#them').classList.toggle('is-turn', !st.over && st.turn === 'b');
  $('#you').classList.toggle('is-turn', !st.over && st.turn === 'w');
  if (focusId && /^power-|^moves-line$/.test(focusId)) document.getElementById(focusId)?.focus();
  const c = context();
  const line = $('#ctx-line'), main = $('#ctx .ctx-main');
  if (c.line !== lastLine) { main.classList.remove('fresh'); void main.offsetWidth; main.classList.add('fresh'); }
  lastLine = c.line;
  line.textContent = c.line;
  $('#ctx-sub').innerHTML = c.sub ?? '';
  $('#cancel').hidden = !c.close;
  $('#cancel').textContent = c.close ?? 'Cancel';
  $('#ctx').classList.toggle('is-armed', ui.armed);
  $('#undo').disabled = flow || s.history.length <= FLOOR || turnOf(s) !== 'w';
  syncBoard();
}

// ---- marks on the board: ice, the preview, the shelter --------------------------------------------

let iceKey = '', shelterKey = '';
function syncBoard({ force = false, iceIn = false } = {}) {
  const s = board.state;
  const ice = frozen(s).map(f => f.sq);
  const key = JSON.stringify([ice, ui.preview]);
  if (force || key !== iceKey) { iceKey = key; drawIce(ice, ui.preview, iceIn); }
  const sk = ui.reading ? kingSq(s, 'w') : '';
  if (force || sk !== shelterKey) { shelterKey = sk; drawShelter(s, ui.reading); }
  veil.classList.toggle('is-on', ui.armed);
}

function drawIce(squares, preview, animateIn) {
  for (const el of layer.querySelectorAll('.kp-ice, .kp-ground, .kp-flake')) el.remove();
  for (const f of layer.querySelectorAll('.is-frozen, .is-preview')) f.classList.remove('is-frozen', 'is-preview');
  const list = squares.map(sq => ({ sq, ghost: false }));
  if (preview && !squares.includes(preview)) list.push({ sq: preview, ghost: true });
  for (const { sq, ghost } of list) {
    const fig = board.figure(sq), img = fig?.querySelector('img');
    if (!img) continue;
    const ice = document.createElement('div');
    ice.className = 'kp-ice';
    for (const k of ['left', 'top', 'width', 'height']) ice.style[k] = img.style[k];
    if (img.classList.contains('mirror')) ice.style.scale = '-1 1';
    ice.style.webkitMaskImage = ice.style.maskImage = `url("${img.src}")`;
    ice.style.setProperty('--ice', ghost ? '0.42' : '0.6');
    fig.appendChild(ice);
    fig.classList.add(ghost ? 'is-preview' : 'is-frozen');
    const { col, row } = board.colRow(sq);
    const under = document.createElement('div'), front = document.createElement('div'), flake = document.createElement('div');
    under.className = front.className = 'kp-ground';
    under.innerHTML = groundSvg(false, ghost);
    front.innerHTML = ghost ? '' : groundSvg(true, false);
    flake.className = `kp-flake${ghost ? ' is-ghost' : ''}`;
    flake.innerHTML = flakeSvg(ghost);
    for (const el of [under, front]) Object.assign(el.style, { left: `${col * 12.5}%`, top: `${row * 12.5}%` });
    under.style.zIndex = '4';
    front.style.zIndex = String(11 + row * 3);
    Object.assign(flake.style, { left: `${(col + 0.66) * 12.5}%`, top: `${(row + 0.04) * 12.5}%` });
    layer.append(under, front, flake);
    if (animateIn) {
      // Beat 3: ice climbs the figure from its feet; the shards and the flake settle.
      animate(ice, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animate(front, [{ transform: 'scale(.4)', opacity: 0, transformOrigin: '50% 82%' }, { transform: 'scale(1)', opacity: 1, transformOrigin: '50% 82%' }], { duration: 300, easing: 'cubic-bezier(.34,1.4,.64,1)' });
      animate(under, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      animate(flake, [{ transform: 'scale(0) rotate(-60deg)' }, { transform: 'none' }], { duration: 300, delay: 160, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' });
    }
  }
}

function drawShelter(s, on) {
  for (const el of layer.querySelectorAll('.kp-shield, .kp-aura')) el.remove();
  if (!on) return;
  const k = kingSq(s, 'w');
  // A soft light at the king's feet: the source of the shelter.
  const aura = document.createElement('div'), kc = board.colRow(k);
  aura.className = 'kp-aura';
  Object.assign(aura.style, { left: `${kc.col * 12.5}%`, top: `${(kc.row + 0.05) * 12.5}%` });
  layer.appendChild(aura);
  if (!prefersReducedMotion()) aura.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  const f = k.charCodeAt(0) - 97, r = +k[1];
  const sqs = [[f - 1, r], [f + 1, r], [f, r + 1], [f, r - 1]].filter(([x, y]) => x >= 0 && x < 8 && y >= 1 && y <= 8).map(([x, y]) => String.fromCharCode(97 + x) + y);
  for (const sq of sqs) {
    const { col, row } = board.colRow(sq), cell = cellAt(s, sq);
    const ring = document.createElement('div');
    ring.className = 'kp-shield';
    ring.innerHTML = `<svg viewBox="0 0 112 112" aria-hidden="true"><ellipse cx="56" cy="92" rx="44" ry="15" fill="rgba(255,236,190,.4)" stroke="#9a7a2c" stroke-width="2.4"${cell ? '' : ' stroke-dasharray="6 5"'}/></svg>`;
    Object.assign(ring.style, { left: `${col * 12.5}%`, top: `${row * 12.5}%`, zIndex: '4' });
    layer.appendChild(ring);
    if (cell && cell.color === 'w') {
      const badge = document.createElement('div');
      badge.className = 'kp-flake kp-shield';
      badge.innerHTML = shieldSvg();
      Object.assign(badge.style, { left: `${(col + 0.66) * 12.5}%`, top: `${(row + 0.04) * 12.5}%`, zIndex: '120' });
      layer.appendChild(badge);
      if (!prefersReducedMotion()) badge.animate([{ transform: 'scale(0)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    }
  }
}

function clearTrail() { ground.replaceChildren(); }
/** Their Strike: a dotted flame trail on the ground from where the piece stood, until your next move. */
function drawTrail(from, to) {
  clearTrail();
  const a = board.colRow(from), b = board.colRow(to);
  const x1 = (a.col + 0.5) * 100, y1 = (a.row + 0.82) * 100, x2 = (b.col + 0.5) * 100, y2 = (b.row + 0.82) * 100;
  const n = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / n, uy = (y2 - y1) / n;
  const ex = x2 - ux * 30, ey = y2 - uy * 30; // stop short of the figure's feet
  const head = `M${ex - ux * 14 - uy * 9} ${ey - uy * 14 + ux * 9}L${ex} ${ey}L${ex - ux * 14 + uy * 9} ${ey - uy * 14 - ux * 9}`;
  ground.innerHTML = `<circle cx="${x1}" cy="${y1}" r="12" fill="none" stroke="#b24425" stroke-width="3" stroke-dasharray="5 5" opacity=".9"/>
    <path d="M${x1 + ux * 16} ${y1 + uy * 16}L${ex} ${ey}" stroke="rgba(251,246,232,.85)" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M${x1 + ux * 16} ${y1 + uy * 16}L${ex} ${ey}" stroke="#b24425" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="2 9" fill="none"/>
    <path d="${head}" stroke="#b24425" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  if (!prefersReducedMotion()) ground.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
}

/** Beat 2 of the cast: a line of frost runs from your king to the piece (over the figures, then gone). */
async function trace(from, to) {
  if (prefersReducedMotion()) return;
  const a = board.colRow(from), b = board.colRow(to);
  const x1 = (a.col + 0.5) * 100, y1 = (a.row + 0.45) * 100, x2 = (b.col + 0.5) * 100, y2 = (b.row + 0.5) * 100;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const g = document.createElementNS(NS, 'g');
  g.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(150,200,250,.7)" stroke-width="13" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`;
  fx.appendChild(g);
  const lines = [...g.querySelectorAll('line')];
  for (const l of lines) { l.style.strokeDasharray = `${len}`; l.style.strokeDashoffset = `${len}`; }
  await Promise.all(lines.map(l => l.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 300, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.catch(() => {})));
  g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' }).finished.catch(() => {}).then(() => g.remove());
}

// ---- the power: arm, preview, cast ---------------------------------------------------------------

const freezeMoves = s => KD.legal(s).filter(m => m.power === 'freeze');

function arm() {
  const s = board.state, moves = freezeMoves(s);
  if (!moves.length) return;
  hideToast();
  ui.armed = true; ui.preview = null; ui.note = null; ui.thawed = null; ui.reading = false;
  board.clearSelection(false);
  board.showTargets(moves);
  // The targets appear as a wave that starts at your king.
  const k = board.colRow(kingSq(s, 'w'));
  for (const el of layer.querySelectorAll('.kdb-m-power')) {
    const t = board.colRow(el.dataset.sq);
    el.style.setProperty('--d', Math.hypot(t.col - k.col, t.row - k.row).toFixed(2));
  }
  sfx.play('tap');
  render();
}

function disarm(text) {
  ui.armed = false; ui.preview = null;
  board.clearSelection(false);
  render();
  if (text) toast(text);
}

function preview(sq) {
  ui.preview = sq;
  render();
}

async function cast(move, me = run) {
  const s = board.state, sq = move.to, king = kingSq(s, 'w');
  flow = true;
  ui.preview = null;
  // Beat 1, anticipation (120 ms): the other targets step back, the chosen one stays.
  for (const el of layer.querySelectorAll('.kdb-m-power')) {
    if (el.dataset.sq !== sq) animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
  }
  const tile = $('#power-w');
  if (tile) animate(tile, [{ transform: 'none' }, { transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 240, easing: 'ease-out' });
  syncBoard({ force: true });
  await wait(120, { instant: true });
  if (me !== run) return;
  // Beat 2, action (300 ms): a line of frost runs from your king to the piece.
  await trace(king, sq);
  if (me !== run) return;
  // The engine plays the Freeze: a free action, so it is still your turn.
  board.setState(KD.play(s, move));
  ui.armed = false;
  // Beat 3, follow-through: ice climbs the figure, the tile turns to stone, the next step shows.
  syncBoard({ force: true, iceIn: true });
  iceKey = JSON.stringify([frozen(board.state).map(f => f.sq), null]);
  if (!prefersReducedMotion()) void board.burst(sq, '170,215,255');
  sfx.play('power');
  haptic([10, 40, 16]);
  flow = false;
  render();
  const t = $('#power-w');
  if (t) animate(t, [{ transform: 'rotateX(80deg)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
  await wait(360, { instant: true });
}

// ---- their turn: the computer, and the reveal of its power --------------------------------------

let scripted = null; // play() scripts the computer's answer, so the story is the same each time

async function reply(me) {
  flow = true;
  ui.thinking = true; ui.note = null;
  render();
  await wait(600, { instant: true });
  if (me !== run) return;
  let m = scripted ? KD.legal(board.state).find(x => x.lan === scripted) : null;
  scripted = null;
  if (!m) m = await KD.think(board.state, { level: 'casual', ms: 500 });
  if (me !== run || !m) { flow = false; return; }
  ui.thinking = false;
  if (m.power) await reveal(m, me);
  else await board.playMove(m);
  flow = false;
  render();
}

/** Their power flips to its face and names itself (200 ms); then the effect travels. */
async function reveal(m, me) {
  ui.revealing = POWER_NAME[board.state.kings[1].power];
  render();
  const chip = $('#power-b');
  if (chip) animate(chip, [{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  sfx.play('power');
  await wait(650, { instant: true });
  if (me !== run) return;
  ui.revealing = null;
  const piece = cellAt(board.state, m.from).type;
  ui.revealed = { name: POWER_NAME[board.state.kings[1].power], king: board.state.kings[1].king.toLowerCase(), piece, from: m.from, to: m.to };
  await board.playMove(m);
  if (me !== run) return;
  drawTrail(m.from, m.to);
}

function onMove(story) {
  if (story.side === 'w') {
    ui.revealed = null; ui.thawed = null; ui.note = null;
    clearTrail();
    render();
    if (!story.again && !KD.status(board.state).over) reply(run);
    return;
  }
  // Black moved: a note on the old position goes. A Freeze mark that ends now thaws once, with one line.
  ui.note = null;
  const before = frozen(KD.undo(board.state)).find(f => f.by === 'w');
  if (before && !frozen(board.state).some(f => f.sq === before.sq)) {
    ui.thawed = cellAt(board.state, before.sq)?.type ?? null;
    const fig = board.figure(before.sq)?.querySelector('.kp-ice');
    if (fig && !prefersReducedMotion()) fig.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' });
  }
  render();
}

// ---- input --------------------------------------------------------------------------------------

function onTap(sq, cell) {
  const s = board.state;
  if (!s || flow) return false;
  const st = KD.status(s);
  if (!st.over && st.turn === 'b') { void reply(run); return false; }
  if (st.over || st.turn !== 'w') return false;
  ui.note = null;
  if (ui.reading) { ui.reading = false; render(); }
  if (ui.armed) {
    const m = freezeMoves(s).find(x => x.to === sq);
    if (m) { void cast(m); return false; }
    // Your own piece: you changed your mind. Disarm, and the board selects the piece.
    if (cell && cell.color === 'w') { disarm(); return true; }
    toast(cell && cell.type === 'king' ? 'Freeze never works on a king.' : 'Choose a marked enemy piece.');
    return false;
  }
  if (ui.thawed) { ui.thawed = null; render(); }
  return true;
}

function onInspect(sq, cell) {
  const s = board.state;
  if (!s) return;
  if (ui.armed && freezeMoves(s).some(m => m.to === sq)) { preview(sq); return; }
  if (frozen(s).some(f => f.sq === sq)) {
    const when = turnOf(s) === 'b' ? 'this turn' : 'next turn';
    ui.note = { line: `${cell.color === 'w' ? 'Your' : 'Their'} ${cell.type} is frozen.`, sub: rules(frozenLines(cell.type, when), flakeIcon), close: 'Close' };
    render(); return;
  }
  if (cell.type === 'king' && cell.color === 'w' && powerOf(s, 'w')?.always) { ui.reading = true; render(); }
  // Other pieces: no toast here. Reading a piece has its own demo, and a toast on each hover is noise.
}

function readRule(side) {
  const s = board.state, pw = powerOf(s, side);
  const lines = RULE[pw.power] ?? [KD.powerText(pw.power)];
  const head = side === 'w' ? `${pw.name} · ${subText(controlState(side, pw), pw).toLowerCase()}` : `Their ${pw.name} · ${subText(controlState(side, pw), pw).toLowerCase()}`;
  ui.note = { line: head, sub: rules(lines, `<img src="${emblemArt(pw.king)}" alt="" width="18" height="18" style="flex:none">`), close: 'Close' };
  render();
}

function onPowerControl(side, e) {
  const s = board.state, pw = powerOf(s, side);
  if (!pw || flow) return;
  if (side === 'b') { readRule('b'); return; }
  const st = KD.status(s);
  if (pw.always) { ui.reading = !ui.reading; ui.note = null; render(); return; }
  if (ui.armed) { disarm(); return; }
  if (pw.left === 0) { readRule('w'); return; }
  if (st.over || st.turn !== 'w') { toast('Wait for your turn.'); return; }
  if (s.pos.free) { toast('One power each turn. Now make your move.'); return; }
  ui.note = null;
  arm();
  if (e.detail === 0) board.el.focus(); // from the keyboard: go on to the board's cursor
}

$('#you').addEventListener('click', e => { if (e.target.closest('#power-w')) onPowerControl('w', e); });
$('#them').addEventListener('click', e => { if (e.target.closest('#power-b')) onPowerControl('b', e); });
$('#ctx').addEventListener('click', e => { if (e.target.closest('#moves-line')) toast('The move story has its own demo.'); });
$('#cancel').addEventListener('click', () => {
  if (ui.armed) { disarm(); return; }
  ui.note = null; ui.reading = false; ui.preview = null; render();
});
// A mouse preview lasts while the mouse rests on the target: off the square, the preview goes.
const endHoverPreview = e => {
  if (e.pointerType !== 'mouse' || !ui.preview || flow) return;
  if (e.type === 'pointerleave' || board.squareAtPoint(e.clientX, e.clientY) !== KD.sq.index(ui.preview)) { ui.preview = null; render(); }
};
board.el.addEventListener('pointermove', endHoverPreview);
board.el.addEventListener('pointerleave', endHoverPreview);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ui.armed) { disarm(); e.preventDefault(); } else if (ui.note || ui.reading) { ui.note = null; ui.reading = false; render(); }
});

const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu'), 'menu', 'Menu');
$('#menu').addEventListener('click', () => toast('The menu has its own demo.'));
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (flow || turnOf(s) !== 'w' || KD.status(s).over) return;
  const m = await KD.think(s, { level: 'club', ms: 500 });
  if (!m || board.state !== s) return;
  if (m.power === 'freeze') { toast(`Hint: freeze their ${cellAt(s, m.to).type}.`); board.mark(m.to, 'hint'); return; }
  board.clearSelection(false);
  board.mark([m.from, m.path.at(-1)], 'hint');
  toast(`Hint: ${brief(KD.describe(s, m))}.`);
});
$('#undo').addEventListener('click', () => {
  let s = board.state;
  if (flow || s.history.length <= FLOOR) return;
  // Back to your last whole decision: the Freeze and its move come back together.
  do s = KD.undo(s); while (s.history.length > FLOOR && (turnOf(s) !== 'w' || s.pos.free));
  show(s, ui.option);
});

// ---- views ---------------------------------------------------------------------------------------

function show(state, option = 'A') {
  hideToast();
  ui = blank(option);
  flow = false; scripted = null;
  board.play.human = 'both';
  clearTrail();
  board.setState(state);
  lastLine = '';
  render();
  syncBoard({ force: true });
}

show(p1());

// ---- the demo contract (README): state(name), play(), reset() -----------------------------------

window.demo = {
  async state(name) {
    const me = ++run;
    switch (name) {
      case 'ready': show(p1()); break;
      case 'armed': show(p1()); arm(); break;
      case 'preview': show(p1()); arm(); preview('b6'); break;
      case 'cast': {
        show(p1()); arm();
        await wait(700, { instant: true });
        await cast(freezeMoves(board.state).find(m => m.to === 'b6'), me);
        break;
      }
      case 'spent': {
        show(playLans(p1(), ['!F:b6', 'Aa3*a5']));
        scripted = 'Od5xe4';
        // Their reply starts on a tap on the board, or by itself after a short look. The still render keeps this frame.
        setTimeout(() => { if (me === run && !flow && turnOf(board.state) === 'b') void reply(me); }, 4500);
        break;
      }
      case 'their-reveal': {
        show(playLans(p1(), ['Aa3*a5']));
        scripted = 'Ab6-e3!';
        await reply(me);
        break;
      }
      case 'always-on': show(p1(SPIRIT)); ui.reading = true; render(); break;
      case 'coin': show(p1(), 'B'); break;
      case 'portrait': show(p1(), 'C'); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // Ready, armed, a hold on their archer, the cast, then the move; their turn; the ice thaws.
  async play() {
    const me = ++run;
    show(p1());
    const step = async ms => { await wait(ms, { instant: true }); return me === run; };
    if (!await step(1000)) return;
    arm();
    if (!await step(1500)) return;
    preview('b6');
    if (!await step(1700)) return;
    await cast(freezeMoves(board.state).find(m => m.to === 'b6'), me);
    if (!await step(1800)) return;
    board.selectSquare('a3');
    if (!await step(1000)) return;
    scripted = 'Od5xe4';
    await board.playMove('Aa3*a5'); // onMove starts their reply
    if (!await step(2600)) return;
  },
  async reset() { run++; show(p1()); },
};
