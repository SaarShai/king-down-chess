// The joy dial: the same four moments of one game (P1 and P2 of the idea bank) at three settings.
// Calm: only the pieces move, 160 ms fades, no sound; the check line stays, because it is a fact.
// Warm (the pick): marks for each shot, bite and power, the cause line, one sound for each event, the king
// shakes in check, a short King Down. Bold: the power coin turns over, the bites rise in pitch, the winning
// move plays again as a see-through figure, a dimmed King Down. A tap on the board skips to the end frame.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, $$, prefersReducedMotion, onMotionChange, haptic, sfx, wait } from '../../kit/ui.js';
import { sound } from './sound.js';

// ---- the scripted run (checked with kit/kd-engine.js) ----
const OPTS = { powers: ['Frost:Freeze', 'Flame:Strike'] };
const P1 = 'r1b2mk1/2p3pp/1a2p3/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 w - - 0 12';
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24 u0.1'; // u0.1: Black's Strike is spent
const from = (fen, lans = []) => lans.reduce((s, lan) => KD.play(s, lan), KD.fromFen(fen, OPTS));

const MOMENTS = {
  shot: { start: () => from(P1), lan: 'Aa3*a5', prev: 'e6', turn: 'Your move.', strike: 'ready' },
  check: { start: () => from(P1, ['Aa3*a5']), lan: 'Ab6-e3!', turn: 'Their move.', strike: 'ready' },
  chain: { start: () => from(P1, ['Aa3*a5', 'Ab6-e3!', 'f2xe3', 'h7-h6']), lan: 'Se4xd5xe6', turn: 'Your move.', strike: 'used' },
  mate: { start: () => from(P2), lan: 'Ae5-f6', turn: 'Your move.', strike: 'used' },
};
const ORDER = ['shot', 'check', 'chain', 'mate'];

// ---- words (ASD-STE100; eight words or fewer for a line in play) ----
const LEVELS = {
  calm: { name: 'Calm', lines: ['Only the pieces move.', 'No sound. Text fades in.', 'A line still shows check.'] },
  warm: { name: 'Warm', pick: true, lines: ['Marks show each shot, bite and power.', 'One sound for each event.', 'Your king shakes in check.'] },
  bold: { name: 'Bold', lines: ['The power coin turns over.', 'Each bite sounds higher.', 'The last move plays again.'] },
};
const ANGLE = { calm: -62, warm: 0, bold: 62 };
const LINE = {
  shot: { main: 'Your Archer shoots the pawn on a5.', glyph: () => icon('target') },
  check: { main: 'Check: their Archer shoots over f2.', sub: 'Flame used Strike to move it.', glyph: () => icon('bolt') },
  chain: { main: 'Your Beast bites twice: Ogre, then pawn.', glyph: () => pieceIcon('beast', 'w') },
  mate: { main: 'King Down. You win on move 24.', calm: 'Checkmate on move 24. You win.', glyph: () => icon('crown') },
  replay: { main: 'Again, slowly: the winning move.', glyph: () => icon('play') },
};
const HEAR = {
  warm: { shot: 'a bowstring.', check: 'one low note.', chain: 'one bite.', mate: 'one bell.' },
  bold: { shot: 'a bowstring, then a thud.', check: 'a power call, then a low note.', chain: 'two bites, the second higher.', mate: 'a drum, then a bell.' },
};
const INK = '#2b2621', CRIMSON = '#9c2a1e';
const SHOT_BEND = 0.12; // a shot along a file: a low arc, so it does not read as "around"
const KING_BODY = [730, 62]; // board units (one square = 100): the fallen king's body on h8

// ---- the board ----
const board = createBoard($('#board'), {
  interactive: false, sound: false, headroom: 0.2,
  label: 'King Down board. The moments play on their own.',
});
let dimEl, topEl, svgEl;
function overlays() {
  if (topEl?.isConnected) return;
  dimEl = document.createElement('div'); dimEl.className = 'jd-dim'; dimEl.hidden = true;
  topEl = document.createElement('div'); topEl.className = 'jd-top';
  board.layer.append(dimEl, topEl);
}
function clearOverlays() {
  overlays();
  dimEl.hidden = true; dimEl.getAnimations().forEach(a => a.cancel());
  topEl.replaceChildren();
  svgEl = null;
}
function svg() {
  if (svgEl?.isConnected) return svgEl;
  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', '0 0 800 800');
  svgEl.setAttribute('preserveAspectRatio', 'none');
  svgEl.setAttribute('aria-hidden', 'true');
  topEl.prepend(svgEl);
  return svgEl;
}
const pt = (sq, dy = 0) => { const { col, row } = board.colRow(sq); return [col * 100 + 50, row * 100 + 50 + dy]; };
const unit = () => 800 / Math.max(1, board.layer.getBoundingClientRect().width); // board units per CSS pixel
const hasArc = () => !!svgEl?.isConnected && !!svgEl.querySelector('.arc');

/** Run an animation, or put its last frame at once (reduced motion, or a still state). */
function anim(el, frames, opts, instant) {
  if (!el) return Promise.resolve();
  if (instant || prefersReducedMotion() || !el.animate) {
    for (const [k, v] of Object.entries(frames.at(-1))) if (k !== 'offset' && k !== 'easing') el.style[k] = v;
    return Promise.resolve();
  }
  return el.animate(frames, { fill: 'forwards', ...opts }).finished.catch(() => {});
}

/**
 * The cause line: an arc from the cause to the effect. An arc, not a straight line: a shot flies over
 * pieces, so the line must not suggest that a piece between them could block it.
 * draw: the line draws from the cause (Warm, Bold). fadeMs: it fades in (Calm). Else it is there at once.
 * The promise resolves when the line reaches its end; the arrowhead then fades in by itself.
 */
function causeArc(a, b, { colour = INK, draw = false, ms = 200, bend = 0.3, to = null, fadeMs = 0 } = {}) {
  let [x1, y1] = pt(a, -10), [x2, y2] = to ?? pt(b, 2);
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  x1 += (dx / len) * 16; y1 += (dy / len) * 16;
  if (!to) { x2 -= (dx / len) * 30; y2 -= (dy / len) * 30; }
  let nx = -dy / len, ny = dx / len;
  if (ny > 0.01 || (Math.abs(ny) <= 0.01 && nx * (400 - (x1 + x2) / 2) < 0)) { nx = -nx; ny = -ny; }
  const k = len * bend, cx = (x1 + x2) / 2 + nx * k, cy = (y1 + y2) / 2 + ny * k;
  const u = unit(), tx = x2 - cx, ty = y2 - cy, tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl, s = 9 * u;
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  const head = `M${(x2 - ux * s - uy * s * 0.75).toFixed(1)} ${(y2 - uy * s + ux * s * 0.75).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(x2 - ux * s + uy * s * 0.75).toFixed(1)} ${(y2 - uy * s - ux * s * 0.75).toFixed(1)}`;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const line = (w, c) => `<path d="${d}" pathLength="100" fill="none" stroke="${c}" stroke-width="${(w * u).toFixed(2)}" stroke-linecap="round"/>`;
  const tip = (w, c) => `<path d="${head}" fill="none" stroke="${c}" stroke-width="${(w * u).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  g.innerHTML = `<g class="arc">${line(6, 'rgba(251,247,238,.9)')}${line(2.6, colour)}</g>
    <g class="tip">${tip(6, 'rgba(251,247,238,.9)')}${tip(2.6, colour)}<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="${(3.4 * u).toFixed(2)}" fill="${colour}" stroke="rgba(251,247,238,.9)" stroke-width="${(1.6 * u).toFixed(2)}"/></g>`;
  svg().appendChild(g);
  if (prefersReducedMotion()) return Promise.resolve();
  if (!draw) return fadeMs ? anim(g, [{ opacity: 0 }, { opacity: 1 }], { duration: fadeMs, easing: 'ease-out' }) : Promise.resolve();
  const paths = [...g.querySelectorAll('.arc path')], tipEl = g.querySelector('.tip');
  paths.forEach(p => { p.style.strokeDasharray = '100'; });
  tipEl.style.opacity = '0';
  return Promise.all(paths.map(p => p.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).finished))
    .then(() => { void anim(tipEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); })
    .catch(() => {});
}

/** Where a shot lands: one thin ring that grows and fades. */
function hitRing(sq, colour = INK) {
  const [x, y] = pt(sq, 6), u = unit();
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  for (const [k, v] of Object.entries({ cx: x, cy: y, r: 6, fill: 'none', stroke: colour, 'stroke-width': (2.4 * u).toFixed(2) })) c.setAttribute(k, v);
  svg().appendChild(c);
  return c.animate([{ r: 6, opacity: 0.9 }, { r: 30, opacity: 0 }], { duration: 280, easing: 'ease-out', fill: 'forwards' }).finished
    .then(() => c.remove()).catch(() => {});
}

/** The Beast's path, dotted, through each bite. */
function chainPath(squares, instant) {
  const u = unit(), p = squares.map(sq => pt(sq, 8));
  const d = p.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<path d="${d}" fill="none" stroke="rgba(251,247,238,.85)" stroke-width="${(5.5 * u).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 ${(9 * u).toFixed(1)}"/>
    <path d="${d}" fill="none" stroke="${INK}" stroke-width="${(3 * u).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 ${(9 * u).toFixed(1)}"/>`;
  svg().appendChild(g);
  return anim(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }, instant);
}

/** A mark in the square's corner: a bite number, the shot's sight, the power's bolt. */
function badge(sq, content, { pop = false, instant = false, kind = '' } = {}) {
  const { col, row } = board.colRow(sq), el = document.createElement('span');
  el.className = `jd-num${kind ? ' jd-' + kind : ''}`;
  el.innerHTML = String(content);
  el.style.left = `${col * 12.5 + 0.5}%`; el.style.top = `${row * 12.5 + 0.5}%`;
  topEl.appendChild(el);
  return pop
    ? anim(el, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 240, easing: 'ease-out' }, instant)
    : anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }, instant);
}

function tag(sq, text, instant) {
  const { col, row } = board.colRow(sq), el = document.createElement('span');
  el.className = 'jd-tag'; el.textContent = text;
  el.style.left = `${(col + 0.5) * 12.5}%`; el.style.top = `${(row - 0.32) * 12.5}%`;
  topEl.appendChild(el);
  return anim(el, [{ transform: 'translate(-50%, -20%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.08)', opacity: 1, offset: 0.65 }, { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }], { duration: 280, easing: 'ease-out' }, instant);
}

/** Bold: a see-through copy of the piece plays the winning move again, slowly, over the true board. */
async function ghost(fromSq, toSq, ms) {
  const real = board.figure(toSq);
  if (!real) return;
  const el = real.cloneNode(true), { col, row } = board.colRow(fromSq);
  el.classList.add('jd-ghost');
  Object.assign(el.style, { left: `${col * 12.5}%`, top: `${row * 12.5}%` });
  topEl.appendChild(el);
  await board.slide(el, fromSq, toSq, { dur: ms });
  await anim(el, [{ opacity: 0.4 }, { opacity: 0 }], { duration: 160 });
  el.remove();
}

function shake(sq, instant) {
  const img = board.figure(sq)?.querySelector('img');
  return anim(img, [{ rotate: '0deg' }, { rotate: '-9deg', offset: 0.35 }, { rotate: '4deg', offset: 0.7 }, { rotate: '0deg' }], { duration: 260, easing: 'ease-out', fill: 'none' }, instant);
}
function pulseCheck() { board.el.querySelector('.kdb-m-check')?.classList.add('pulse'); }
const fade = (el, ms) => anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-in' });

/** After the motion: the board takes the position after the move (and marks the last move and a check). */
function settle(story) {
  board.rehome(story);
  board.setState(story.next);
}

// ---- nameplates, the move line, the sound line ----
/** Flame's Strike coin: ready (gold, "1 use"), shown (the gold face that names the power, Bold only), used (stone). */
function coin(side, st) {
  const el = $(side === 'b' ? '#coin-b' : '#coin-w');
  const [name, ic] = side === 'b' ? ['Strike', 'bolt'] : ['Freeze', 'sparkle'];
  el.className = `coin${st === 'used' ? ' is-used' : st === 'shown' ? ' is-shown' : ''}`;
  el.innerHTML = `${icon(ic)}<span>${name}</span>${st === 'shown' ? '' : `<small>${st === 'ready' ? '1 use' : 'used'}</small>`}`;
  return el;
}
/** Bold: the coin turns over to a new face. */
async function flipCoin(st, me) {
  const el = $('#coin-b');
  if (prefersReducedMotion()) { coin('b', st); return; }
  await anim(el, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], { duration: 110, easing: 'ease-in', fill: 'none' });
  if (me !== run) return;
  coin('b', st);
  await anim(el, [{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0)' }], { duration: 170, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' });
}
function coinFade(st, L) {
  coin('b', st);
  return anim($('#coin-b'), [{ opacity: 0 }, { opacity: 1 }], { duration: L === 'calm' ? 160 : 200, fill: 'none' });
}

function say(key, L, instant) {
  const t = LINE[key], line = $('#line');
  $('#glyph').innerHTML = L === 'calm' ? '' : t.glyph();
  $('#line-main').textContent = (L === 'calm' && t.calm) || t.main;
  $('#line-sub').textContent = t.sub ?? '';
  $('#line-main').classList.remove('muted');
  const frames = L === 'calm' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }];
  return anim(line, frames, { duration: L === 'calm' ? 160 : 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' }, instant);
}
function sayTurn(text) {
  $('#line').getAnimations().forEach(a => a.cancel());
  $('#glyph').innerHTML = '';
  $('#line-main').textContent = text;
  $('#line-main').classList.add('muted');
  $('#line-sub').textContent = '';
}
let heard = null;
function hear(m, L) {
  heard = [m, L];
  $('#hear').innerHTML = L === 'calm' ? `${icon('sound-off')}<span>Sound: none at Calm.</span>`
    : sfx.muted ? `${icon('sound-off')}<span>Sound is off.</span>`
    : `${icon('sound-on')}<span>Sound: ${HEAR[L][m]}</span>`;
}

// ---- the four moments: the motion, then the end frame ----
const MOTION = {
  async shot(L, me) {
    const pawn = board.figure('a5');
    if (L === 'calm') { await fade(pawn, 160); return; }
    // The arc is the shot: one line, drawn fast from the Archer, then the hit.
    sound('bowstring');
    await causeArc('a3', 'a5', { draw: true, ms: 180, bend: SHOT_BEND });
    if (me !== run) return;
    if (L === 'bold') { sound('thud'); void board.burst('a5', '255,190,110'); }
    void hitRing('a5');
    await board.dip(pawn);
  },
  async check(L, me) {
    if (L === 'bold') {
      // The reveal: the coin turns over to name the power, then turns to stone as the Archer flies.
      sound('motif');
      await flipCoin('shown', me); if (me !== run) return;
      await wait(320); if (me !== run) return;
      void flipCoin('used', me);
    } else void coinFade('used', L);
    await board.slide(board.figure('b6'), 'b6', 'e3');
    if (me !== run) return;
    if (L === 'bold') void board.burst('e3', '96,160,255');
  },
  async chain(L, me) {
    const beast = board.figure('e4');
    let at = 'e4';
    for (const [n, sq] of ['d5', 'e6'].entries()) {
      await board.slide(beast, at, sq, { dur: L === 'bold' ? 240 : 210 });
      if (me !== run) return;
      const victim = board.figure(sq);
      if (L === 'bold') { sound('bite', n); haptic(10); void badge(sq, n + 1, { pop: true }); }
      void (L === 'calm' ? fade(victim, 160) : board.dip(victim));
      at = sq;
      if (L === 'bold' && n === 0) { await wait(90); if (me !== run) return; }
    }
    if (L === 'warm') sound('bite', 0);
    await wait(200);
  },
  async mate() {
    await board.slide(board.figure('e5'), 'e5', 'f6');
  },
};

const FINISH = {
  async shot(L, { instant }) {
    if (L === 'calm') board.mark('a3', 'last');
    else {
      void badge('a5', icon('target'), { instant, kind: 'shot' });
      if (!hasArc()) void causeArc('a3', 'a5', { bend: SHOT_BEND });
    }
    hear('shot', L);
    await say('shot', L, instant);
  },
  async check(L, { instant, quiet }) {
    if (instant) coin('b', 'used');
    if (L === 'calm') {
      // Calm takes away motion and sound, not facts: the line from the Archer stays.
      void causeArc('e3', 'g1', { colour: CRIMSON, fadeMs: instant ? 0 : 160 });
    } else {
      void badge('e3', icon('bolt'), { instant, kind: 'power' });
      if (!quiet) { sound('low'); haptic(12); }
      if (L === 'bold' && !instant && !prefersReducedMotion()) pulseCheck();
      void shake('g1', instant);
      void causeArc('e3', 'g1', { colour: CRIMSON, draw: !instant });
    }
    hear('check', L);
    await say('check', L, instant);
  },
  async chain(L, { instant }) {
    if (L === 'calm') board.mark('d5', 'last');
    else {
      void chainPath(['e4', 'd5', 'e6'], instant);
      if (L === 'warm' || instant || prefersReducedMotion()) { void badge('d5', 1, { instant }); void badge('e6', 2, { instant }); }
      if (L === 'bold') await tag('e6', '2 bites', instant);
    }
    hear('chain', L);
    await say('chain', L, instant);
  },
  async mate(L, { instant, quiet, me }) {
    const R = instant || prefersReducedMotion();
    if (L === 'bold' && !R) {
      // Again, slowly: a see-through Archer over the true board. The real position never goes away.
      await wait(160); if (me !== run) return;
      void say('replay', L);
      await ghost('e5', 'f6', 700); if (me !== run) return;
    }
    if (L !== 'calm') {
      await causeArc('f6', 'h8', { colour: CRIMSON, draw: !R, ms: L === 'bold' ? 300 : 220, bend: 0.14, to: KING_BODY });
      if (me !== run) return;
    }
    // The king lies down inside h8 (joy.css): never across the rook on g8, never past the board's edge.
    board.figure('h8')?.classList.add('is-fallen', 'fall-left');
    hear('mate', L);
    if (L === 'calm') { await say('mate', L, instant); return; }
    if (L === 'warm') {
      if (!quiet) sound('bell');
      if (R) { await say('mate', L, instant); return; }
      // A short King Down: the band shows for about 1.2 s, then the board is clear again.
      await wait(320); if (me !== run) return;
      const band = document.createElement('div');
      band.className = 'jd-band'; band.innerHTML = '<b>King Down</b>';
      topEl.appendChild(band);
      await Promise.all([
        anim(band, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }),
        say('mate', L),
      ]);
      await wait(1200); if (me !== run) return;
      await anim(band, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
      band.remove();
      return;
    }
    // Bold: the drum and the fall, then the board dims except the two figures, then the title and the bell.
    if (!quiet) { sound('drum'); haptic([18, 40, 26]); }
    if (!R) { void board.burst('h8', '201,154,62'); await wait(380); if (me !== run) return; }
    dimEl.hidden = false;
    for (const g of svg().children) void anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 240 }, R);
    for (const sq of ['f6', 'h8']) { const f = board.figure(sq); if (f) f.style.zIndex = '110'; }
    void anim(dimEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 320 }, R);
    const title = document.createElement('div');
    title.className = 'jd-title';
    title.innerHTML = '<b><i></i>King Down<i></i></b><span>Your Archer, from f6</span>';
    topEl.appendChild(title);
    const rules = [...title.querySelectorAll('i')];
    if (!quiet) setTimeout(() => { if (me === run) sound('bell'); }, R ? 0 : 160);
    await Promise.all([
      anim(title, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 }, R),
      anim(title.querySelector('b'), [{ opacity: 0, transform: 'scale(.92)', letterSpacing: '0.04em' }, { opacity: 1, transform: 'none', letterSpacing: '0.12em' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }, R),
      ...rules.map(r => anim(r, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 400, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)' }, R)),
      anim(title.querySelector('span'), [{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 260 }, R),
      say('mate', L, instant),
    ]);
  },
};

let run = 0, playing = 0;
/** Play one moment at one setting. instant: show its end frame at once, with no sound (a still state). */
async function perform(m, L, me, { instant = false } = {}) {
  const M = MOMENTS[m], s0 = M.start(), story = KD.describe(s0, M.lan);
  const R = instant || prefersReducedMotion();
  clearOverlays();
  board.setState(s0);
  if (M.prev) board.mark(M.prev, 'last');
  coin('b', M.strike); coin('w', 'ready');
  sayTurn(M.turn);
  $('#hear').innerHTML = '';
  if (!instant) { await wait(220); if (me !== run) return; }
  if (!R) { await MOTION[m](L, me); if (me !== run) return; }
  else if (m === 'check' && !instant) coin('b', 'used');
  if (R && !instant && L !== 'calm') {
    // Reduced motion keeps the sounds: they carry the same events.
    if (m === 'shot') { sound('bowstring'); if (L === 'bold') sound('thud'); }
    if (m === 'check' && L === 'bold') sound('motif');
    if (m === 'chain') { sound('bite', 0); if (L === 'bold') setTimeout(() => { if (me === run) sound('bite', 1); }, 140); }
  }
  settle(story);
  await FINISH[m](L, { instant, quiet: instant || L === 'calm', me });
}

// ---- the dial ----
const GEO = {
  wide: { W: 212, H: 164, cx: 106, cy: 112, knob: 46, track: 60, top: 88, side: 86 },
  narrow: { W: 188, H: 140, cx: 94, cy: 96, knob: 37, track: 49, top: 74, side: 74 },
};
const wide = matchMedia('(min-width: 900px)');
let level = 'warm', moment = 'check';

function layoutDial() {
  const g = wide.matches ? GEO.wide : GEO.narrow, dial = $('#dial'), knob = $('#knob');
  Object.assign(dial.style, { width: `${g.W}px`, height: `${g.H}px` });
  Object.assign(knob.style, { left: `${g.cx - g.knob}px`, top: `${g.cy - g.knob}px`, width: `${g.knob * 2}px`, height: `${g.knob * 2}px` });
  const at = (deg, r) => { const a = (deg * Math.PI) / 180; return [g.cx + r * Math.sin(a), g.cy - r * Math.cos(a)]; };
  for (const stop of $$('.stop')) {
    const L = stop.dataset.level, [x, y] = at(ANGLE[L], L === 'warm' ? g.top : g.side);
    Object.assign(stop.style, { left: `${x}px`, top: `${y}px` });
  }
  const [x0, y0] = at(-62, g.track), [x1, y1] = at(62, g.track);
  const d = `M${x0.toFixed(1)} ${y0.toFixed(1)}A${g.track} ${g.track} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  const dots = Object.entries(ANGLE).map(([L, deg]) => { const [x, y] = at(deg, g.track); return `<circle class="dot" data-level="${L}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>`; }).join('');
  const track = $('#track');
  track.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
  track.innerHTML = `<path class="bg" d="${d}" pathLength="100"/><path class="fill" d="${d}" pathLength="100" stroke-dasharray="100"/>${dots}`;
  paintDial(true);
}
function paintDial(instant = false) {
  const knob = $('#knob'), fill = $('#track .fill'), share = { calm: 0, warm: 50, bold: 100 }[level];
  if (instant) { knob.style.transition = 'none'; fill.style.transition = 'none'; }
  knob.style.transform = `rotate(${ANGLE[level]}deg)`;
  fill.style.strokeDashoffset = String(100 - share);
  $$('#track .dot').forEach(dot => dot.classList.toggle('on', ANGLE[dot.dataset.level] <= ANGLE[level]));
  if (instant) { void knob.offsetWidth; knob.style.transition = ''; fill.style.transition = ''; }
}
function setLevel(L, { instant = false } = {}) {
  level = L;
  for (const input of $$('#dial input')) input.checked = input.value === L;
  paintDial(instant);
  const t = LEVELS[L], desc = $('#desc');
  desc.innerHTML = `<p class="name">${t.name}${t.pick ? '<span class="pill pill-gold">Recommended</span>' : ''}</p><ul>${t.lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
  void anim(desc, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'none' }, instant);
}
function setMoment(m) {
  moment = m;
  for (const chip of $$('.chip[data-moment]')) chip.setAttribute('aria-pressed', String(chip.dataset.moment === m));
}

// ---- controls ----
$('#play-all').innerHTML = `${icon('play')}<span class="pa-text">Play all four</span>`;
wide.addEventListener('change', layoutDial);
layoutDial();

async function playMoment(m, L) {
  const me = ++run;
  playing = me;
  setMoment(m);
  await perform(m, L, me);
  if (playing === me) playing = 0;
}
async function playAll(L, me) {
  for (const m of ORDER) {
    if (me !== run) return;
    setMoment(m);
    await perform(m, L, me);
    if (me !== run) return;
    await wait(m === 'mate' ? 800 : 450);
  }
}
for (const input of $$('#dial input')) input.addEventListener('change', () => { if (input.checked) { setLevel(input.value); void playMoment(moment, level); } });
for (const chip of $$('.chip[data-moment]')) chip.addEventListener('click', () => void playMoment(chip.dataset.moment, level));
$('#play-all').addEventListener('click', async () => {
  const me = ++run;
  playing = me;
  await playAll(level, me);
  if (playing === me) playing = 0;
});

// The knob turns to the stop nearest the finger: a tap on its side, or a drag around it. No cycling.
const knob = $('#knob');
let turning = null;
function stopAt(e) {
  const r = knob.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  if (Math.hypot(dx, dy) < r.width * 0.2) return null; // the centre names no stop
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return Object.keys(ANGLE).reduce((best, L) => (Math.abs(ANGLE[L] - deg) < Math.abs(ANGLE[best] - deg) ? L : best));
}
knob.addEventListener('pointerdown', e => {
  turning = { id: e.pointerId, start: level };
  knob.setPointerCapture(e.pointerId);
  const L = stopAt(e);
  if (L && L !== level) setLevel(L);
});
knob.addEventListener('pointermove', e => {
  if (turning?.id !== e.pointerId) return;
  const L = stopAt(e);
  if (L && L !== level) setLevel(L);
});
const endTurn = e => {
  if (turning?.id !== e.pointerId) return;
  const changed = level !== turning.start;
  turning = null;
  if (changed) void playMoment(moment, level);
};
knob.addEventListener('pointerup', endTurn);
knob.addEventListener('pointercancel', endTurn);

// Input never waits: a tap on the board (or Escape) skips the motion to its end frame.
function skip() { if (playing && playing === run) void still(level, moment); }
$('#board').addEventListener('pointerdown', skip);
document.addEventListener('keydown', e => { if (e.key === 'Escape') skip(); });

// The two access switches stay separate from the dial.
const swSound = $('#sw-sound'), swMotion = $('#sw-motion');
swSound.checked = !sfx.muted;
swSound.addEventListener('change', () => sfx.setMuted(!swSound.checked));
document.addEventListener('kd-mute', () => { swSound.checked = !sfx.muted; if (heard && $('#hear').innerHTML) hear(...heard); });
onMotionChange(reduced => { swMotion.checked = reduced; });
swMotion.addEventListener('change', () => { document.documentElement.dataset.motion = swMotion.checked ? 'reduce' : 'full'; });

// ---- the demo contract ----
const STATES = {
  warm: ['warm', 'check'], calm: ['calm', 'check'], bold: ['bold', 'check'],
  'warm-shot': ['warm', 'shot'], 'warm-chain': ['warm', 'chain'], 'bold-chain': ['bold', 'chain'],
  'warm-end': ['warm', 'mate'], 'calm-end': ['calm', 'mate'], 'bold-end': ['bold', 'mate'],
};
async function still(L, m) {
  const me = ++run;
  playing = 0;
  setLevel(L, { instant: true });
  setMoment(m);
  await perform(m, L, me, { instant: true });
}
window.demo = {
  async state(name) {
    if (!STATES[name]) throw new Error(`demo.state: no state "${name}"`);
    await still(...STATES[name]);
  },
  // Too little, too much, just right: the four moments at Calm, then Bold, then Warm.
  async play() {
    const me = ++run;
    playing = me;
    for (const L of ['calm', 'bold', 'warm']) {
      setLevel(L);
      await wait(L === 'calm' ? 250 : 400);
      if (me !== run) return;
      await playAll(L, me);
      if (me !== run) return;
    }
    if (playing === me) playing = 0;
  },
  async reset() { await still('warm', 'check'); },
};
await still('warm', 'check');
