// Act II character intros (PLAN.md rows 4–8). One module plays all five; params.piece picks the piece.
//   0 → freeze    the piece's real game move: real time melting into a near-freeze at its peak (a speed ramp)
//   freeze        time stops on a hit: flash, fringe, zoom smear; colour drains from everything but the hero
//   card          a banner wipes in, the figure springs in huge and rim-lit, the name is revealed its own way
//                 (motion.mjs drawTitle); the hold lives: backdrop push and counter-drift, breathing, motes, moving light
//   resume → end  the card whips out, time snaps back with a stacked impact, colour floods back out from the hero
// The cuts come from the timeline: whipIn / whipOut 'left' | 'right' is where the camera whips; no whipIn is a hard cut
// on a 2-frame flash. Retune one piece in PIECES; the card's rhythm is TIME; impact sizes are OPEN … REVEAL.
import { W, H, flush, finish, load, canvas, rand, clamp, lerp, easeOut, easeInOut } from '../runtime.mjs';
import * as M from '../motion.mjs';
import * as rules from '../../../2d-first-pieces/board/rules.mjs';
import { actionsFor } from '../../../2d-first-pieces/board/model.mjs';
import { createScene, SIZE, TILE } from '../../../2d-first-pieces/board/scene.mjs';
import { stopPoint } from '../../../2d-first-pieces/board/blows.mjs';
import * as court from '../../../2d-first-pieces/court-motion.mjs';
import * as archerRig from '../../../2d-first-pieces/wrist-bow/aiming.mjs';
import * as ogreRig from '../../../2d-first-pieces/ogre/motion.mjs';
import * as guardRig from '../../../2d-first-pieces/guard/motion.mjs';
import * as knightRig from '../../../2d-first-pieces/knight/motion.mjs';

// Art paths are relative to this file (fetch and Image would resolve them against the page).
const ART = new URL('../../../2d-first-pieces/', import.meta.url).href;
const ASSETS = new URL('../../assets/', import.meta.url).href, BACKDROP = piece => `gen/${piece}-bg.png`;  // optional painted banner art

// ---- the card's rhythm (seconds; 120 BPM grid). The freeze is a piece's last ramp key, the resume its first after key ----
export const TIME = {
  banner: [0.25, 0.32],  // after the freeze: the banner wipes in (start, length), ease.out
  figure: 2 / 30,        // the figure's leading edge enters the frame this long after the banner starts
  reveal: 0.875,         // after the freeze: the name reveal starts, so its first hit lands on the beat (a piece may override)
  drain: 0.4,            // colour drains in toward the hero
  out: { figure: [0.25, 0.15], name: [0.22, 0.2], banner: [0.25, 0.25] },  // before the resume: each layer whips out [lead, length]
  refill: 0.6,           // colour floods back out from the hero
  whip: [0.15, 0.15],    // the cuts: whip-in at the start, whip-out at the end
  lunge: { windup: [0.15, 0.3], thrust: 0.08, settle: 0.6 },  // a launch's body round the reveal start: pull back (s, share), thrust, settle (s)
};
// ---- impacts: camera kick (trauma 0..1; shake grows with its square, so under ~0.3 it barely shows), flash (0..1),
//      colour fringe (px). Kicks close together add up (a chain rumbles). ----
const DECAY = { flash: 2 / 30, fringe: 0.05 };          // a flash is gone in 2 frames; fringe falls e-fold every 0.05 s
const OPEN = { kick: 0.5, flash: 0.9, fringe: 8 };       // the hard cut in (no whipIn): the boom
const FREEZE = { kick: 0.3, flash: 0.35, fringe: 6 };    // time stops
const IMPACT = { kick: 0.85, flash: 0.45, fringe: 10 };  // a board hit of size 1 (a piece's hits scale it)
const RESUME = { flash: 0.8, white: 0.6 };               // the hit on the resume flashes harder, in the tint taken this far toward white
const LANDING = {                                        // what bursts from the contact on the resume
  sparks: { n: 40, speed: [420, 1300], spread: 2.2 },
  dust: { n: 22, speed: [160, 560], size: [26, 80], color: '196,170,128' },            // the Ogre: from the floor at the contact
  ring: { radius: 400, squash: 0.3, dur: 0.45, alpha: 0.55, color: '255,226,180' },    // the Ogre's shockwave, flat on the floor
  barrier: { radius: 320, squash: 1.15, dur: 0.5, alpha: 0.7, color: '200,230,255' },  // the Guard: the storm breaks on a wall
};
const REVEAL = {                                         // each hit of the name reveal (motion.mjs titleHits)
  arrow: { kick: 0.15, flash: 0.05, fringe: 4 },     // six ignitions 50 ms apart: a light rumble
  bite: { kick: 0.2, flash: 0.1, fringe: 6 },
  scan: { kick: 0.3, flash: 0.08, fringe: 5 },
  shove: { kick: 0.75, flash: 0.28, fringe: 10 },
  stand: { kick: 0.3, flash: 0, fringe: 0 },             // the Guard: a barrier shimmer and a tiny kick (his name takes no camera)
};

// ---- colours: banner gradient (dark → mid → light) and the rim light / embers ----
const TINTS = {
  ember: { dark: [74, 16, 6], mid: [185, 71, 26], light: [242, 165, 74], glow: [255, 177, 79] },
  blood: { dark: [44, 4, 7], mid: [143, 22, 22], light: [228, 87, 60], glow: [255, 104, 72] },
  teal: { dark: [3, 38, 40], mid: [18, 124, 118], light: [126, 242, 220], glow: [110, 245, 225] },
  ochre: { dark: [47, 29, 5], mid: [160, 106, 22], light: [241, 196, 96], glow: [255, 204, 110] },
  steel: { dark: [10, 21, 34], mid: [62, 92, 124], light: [188, 214, 242], glow: [170, 212, 255] },
};

// ---- one config per piece ----
// board: square → piece letter, upper case ivory, lower case charcoal (P pawn, N knight, B bishop, R rook, Q queen,
//   K king, S beast, L paladin, M maester, G guard, A archer, O ogre). hero: the hero's square.
// moves: played in order, each found among the legal moves by from/to (swap / shove pick that kind); ms: when the next
//   move starts. staged: no such rule — the piece charges `to`, captures nothing and returns to its square.
// ramp: the speed ramp to the freeze as motion.mjs remap keys [shot s, board ms]; the last key is the freeze. Real time is
//   1000 board ms per second; each ramp melts exponentially into a near-freeze (about 0.02–0.03× at the peak).
// after: the same from the resume (its first key); it snaps back to real time, then settles.
// hits: [shot s, size] board impacts (camera kick, flash, fringe); a hit on the resume also bursts at the contact.
// cam: [square, dx, dy in tiles, zoom] at the start, at the freeze and at the end. reveal: the name's start after the freeze.
// card: side of the big figure; figure: sheet, pose (the game's rig), height, inner edge in px, landing spring.
export const PIECES = {
  archer: {
    // e4: the piece the bolt flies over (the Archer shoots only over a piece since 2026-10-05).
    board: { d4: 'A', e4: 'P', f4: 'n', c5: 'P', b4: 'P', e6: 'p', g5: 'r', g6: 'p', c2: 'P' },
    hero: 'd4', moves: [{ from: 'd4', to: 'f4' }],
    // The bolt leaves on the beat (0.5 s) and freezes a hair short of the Knight; the resume is the hit.
    ramp: [[-0.5, 60], [0.4, 80], [0.5, 180], [0.56, 233], [0.64, 287], [0.76, 342], [0.92, 383], [1.12, 409], [1.32, 420], [1.5, 425]],
    after: [[4, 425], [4.1, 525], [4.3, 690], [4.7, 890], [5.5, 1000]],
    hits: [[0.5, 0.4], [4, 1]],
    cam: { start: ['d4', 0.4, -0.55, 2.75], peak: ['e4', -0.1, -0.5, 3.45], end: ['d4', 0.55, -0.5, 3.5] },
    card: 'left', figure: { sheet: 'wrist-bow/archer.png', pose: (c, img) => archerRig.drawArcher(c, img, 0, 0), height: 990, x: 110 },
    fx: 'bolt',
  },
  beast: {
    board: { c4: 'S', d4: 'p', e4: 'p', f4: 'p', b5: 'P', c6: 'n', e6: 'p', g5: 'p', f2: 'P' },
    hero: 'c4', moves: [{ from: 'c4', to: 'f4' }],
    // Bite one on the half-beat (0.25 s); the second lunge melts into slow motion and freezes mid-snap, sparks hanging.
    ramp: [[-0.5, -400], [0.05, -30], [0.25, 202], [0.608, 560], [0.662, 608], [0.733, 657], [0.84, 707], [0.983, 747], [1.161, 773], [1.339, 785], [1.5, 790]],
    after: [[4, 790], [4.5, 1322], [4.9, 1720], [5.5, 1900]],  // bite three on the beat (4.5 s)
    hits: [[0.25, 0.45], [4, 0.9], [4.5, 0.7]], reveal: 0.84,  // chomps from 2.50 (on the beat), 75 ms apart
    cam: { start: ['d4', -0.2, -0.5, 2.75], peak: ['e4', -0.55, -0.5, 3.4], end: ['f4', -0.35, -0.5, 3.4] },
    card: 'left', figure: { sheet: 'beast/beast.png', pose: (c, img) => court.drawBeastBite(c, img, 0, 0.1), height: 850, x: 140 },
    fx: 'bite',
  },
  maester: {
    board: { d4: 'M', e4: 'P', f4: 'n', c5: 'P', d6: 'p', g5: 'p', f6: 'r', c3: 'P' },
    hero: 'd4', moves: [{ from: 'd4', to: 'e4', swap: true, ms: 1100 }, { from: 'e4', to: 'f4' }],
    // A brisk swap (2.3×; the whip-in lands on it), the goggles light, and the scan melts into slow motion; it freezes
    // just before the Knight comes apart, so the resume is the hit.
    ramp: [[0, 300], [0.53, 1545], [0.588, 1623], [0.666, 1704], [0.782, 1788], [0.937, 1856], [1.131, 1900], [1.325, 1921], [1.5, 1930]],
    after: [[4, 1930], [4.5, 2430], [5, 2800], [5.5, 2950]],
    hits: [[4, 1]], reveal: 0.63,  // the scan line at 2.21, gold floods on the half-beat 2.75
    cam: { start: ['e4', -0.5, -0.5, 2.75], peak: ['e4', 0.45, -0.5, 3.4], end: ['f4', -0.3, -0.5, 3.4] },
    card: 'left', figure: { sheet: 'maester/maester.png', pose: (c, img) => court.drawCourt(c, img, 'maester', 0, 1), height: 900, x: 150, spring: { freq: 2.9, zeta: 0.66 } },
    fx: 'beam',
  },
  ogre: {
    board: { e4: 'O', d4: 'n', f5: 'P', g4: 'P', c5: 'p', b4: 'r', c6: 'p', f2: 'P' },
    hero: 'e4', moves: [{ from: 'e4', to: 'd4', shove: true }],
    // Step in and wind up at real time; the thrust starts on the beat (0.5 s) and freezes at contact in its dust ring.
    ramp: [[-0.5, -500], [0, 0], [0.28, 300], [0.5, 520], [0.56, 574], [0.64, 629], [0.76, 687], [0.92, 734], [1.12, 764], [1.32, 779], [1.5, 785]],
    after: [[4, 785], [4.4, 1185], [4.9, 1560], [5.5, 1700]],
    hits: [[4, 1]], reveal: 0.95,  // the block slams on the half-beat 2.75
    cam: { start: ['e4', -0.2, -0.55, 2.75], peak: ['d4', 0.55, -0.5, 3.4], end: ['d4', 0.2, -0.5, 3.35] },
    card: 'right', figure: { sheet: 'ogre/ogre.png', pose: (c, img) => ogreRig.drawOgre(c, img, 0, ogreRig.PUSH), height: 860, x: 120 },
    launch: { from: 820, lunge: 36 },  // the shove comes off his palms: the name starts `from` px toward him, behind him; he lunges `lunge` px
    fx: 'dust',
  },
  guard: {
    board: { e4: 'G', c4: 'q', f5: 'P', f3: 'P', b5: 'p', b3: 'r', c6: 'p', g4: 'P' },
    hero: 'e4', moves: [{ from: 'c4', to: 'e4', staged: true }],
    // The storm charges as the whip-in lands (0 s) and melts to a stop just before it strikes; it breaks on the resume.
    ramp: [[-0.5, -250], [0, 250], [0.13, 380], [0.212, 454], [0.322, 531], [0.486, 613], [0.705, 679], [0.979, 723], [1.253, 745], [1.5, 755]],
    after: [[4, 755], [4.4, 1150], [4.9, 1500], [5.5, 1600]],
    hits: [[4, 0.9]], reveal: 0.41,  // the storm strikes the name on 2.25 and 2.77, so the gold holds before the whip
    cam: { start: ['d4', -0.2, -0.5, 2.75], peak: ['d4', 0.45, -0.5, 3.4], end: ['e4', -0.35, -0.5, 3.4] },
    card: 'right', figure: { sheet: 'guard/guard.png', pose: (c, img) => guardRig.drawGuard(c, img, 0, 1), height: 880, x: 110, spring: { freq: 3.2, zeta: 0.8 } },
    fx: 'storm',
  },
};

// ---- look ----
const RES = 3;                                   // painted scene resolution: canvas px per board unit
const GHOSTS = [[0.22, 0.14], [0.11, 0.28]];     // motion trails: [shot seconds behind, opacity]
const DOF = { blur: 9, dim: 0.72, inner: 230, outer: 760, stretch: 1.75, lift: 20 };  // focus ellipse, screen px
const DEPTH = { far: 'rgb(92,98,128)', near: 'rgb(214,204,192)' };  // the board's far edge sinks into cool shadow
const SHAFTS = { alpha: 0.07, colour: [255, 214, 160] };            // torchlight falling across the board
const CAM = { punch: [0.04, 0.22], drift: 0.035, roll: [-1.2, 0.5], handheld: 0.5, shake: 22 };  // freeze punch-in [amount, s], push, dutch roll (deg), sway, shake px
const WHIP = { travel: 3.2, shutter: 1 / 45, flash: 0.18, tint: [255, 236, 210] };      // travel in tiles; smear = speed × shutter
const GREY = { filter: 'grayscale(1) brightness(.52) contrast(1.12)', wash: 'rgb(176,184,204)', from: 1500, feather: 160 };
const NAME = { x: 1476, y: 668, px: 164, maxWidth: 660 };  // baseline centre (x mirrors for right-hand cards)
const CARD = {
  from: -1900, away: 2600,                                         // banner travel in and out (px)
  art: { parallax: 0.6, scale: 1.08, push: 0.08, drift: 60 },      // the backdrop rides the banner, pushes in, drifts against the figure
  figure: { spring: { freq: 2.4, zeta: 0.62 }, drift: 30, breathe: 0.008, rim: [0.78, 0.14, 2.3], away: 2800 },  // rim: glow, flicker, speed
  name: { away: 2400, shade: 0.4 },
  depth: { back: 1.7, banner: 1.4, figure: 1, name: 1.15, front: 0.55 },  // card camera parallax (more = moves less)
  handheld: 0.45,
  sweep: { alpha: 0.14, width: 600, path: [-400, 2400] },          // a light travelling up the banner through the hold (px along it)
  flicker: { alpha: 0.07, speed: 2.6, at: [1480, 140], radius: 1250 },  // a pool of torchlight flickering in the tint
  glint: { time: 0.55, radius: 60, alpha: 0.7 },                   // runs up the banner's edge as it lands
  rays: { turn: 0.07, flicker: 0.25 },                             // light rays from the upper corner
  smear: { shutter: 1 / 30, trail: 0.7 },                          // a fast layer trails a smear of where it was over `shutter` s
};
const SMEAR = { step: 4, passes: 8, min: 3, max: 2400,   // directional smear (box blur by doubling): tap spacing px, max passes, none under `min` px, longest px
  fade: [40, 260, 0.12] };  // a trailed layer's crisp copy fades from full at [0] px of travel to [2] at [1] px, so the fastest frames are pure
                           // smear (sub-frame motion blur, --blur 4, would stamp a crisp copy into echoes)
const MOTES = {                                  // motion.mjs embers: in the torchlight (crawling while time is stopped), behind and in front of the card
  world: { n: 60, seed: 12, rise: 16, sway: 18, size: [0.8, 2.2], color: '255,200,140', bokeh: 12 }, depth: 0.8, frozen: 0.12,
  back: { n: 46, rise: 22, sway: 22, size: [0.8, 2.2], bokeh: 6 },
  front: { n: 16, rise: 40, sway: 34, size: [1.4, 3.4], bokeh: 5 },
};
const RECEDE = { blur: 5, dim: 0.5 };            // the frozen world behind the card
const BURST = { layers: [[1.018, 0.3], [1.04, 0.16]], freeze: 0.22, resume: 0.3 };  // zoom smear as time stops and starts: [scale, opacity], s
const BLOOM = { strength: 0.3, threshold: 0.7, radius: 6 };
const FX_CREEP = 0.002;                          // effects keep drifting at this speed while frozen (stays short of each hit)
const HOT = [255, 170, 80];                      // sparks struck from steel

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixP = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });

// ---- directional smear: a layer averaged over x shifts 0 … L px. Each pass averages the image with itself shifted by
//      twice the last shift, so log2(L / step) passes give an even box of 2^passes taps (a true motion smear, no stamps).
//      The buffers are L px wider than the frame, so what the shifts bring in from off screen is really there. ----
const [smearA, smearB, layerBuf] = [0, 0, 0].map(() => canvas(W + SMEAR.max, H)), lb = layerBuf.getContext('2d');
/** The first w px of src averaged over shifts 0 … L px to the right; returns the canvas holding it. */
function boxSmear(src, w, L) {
  const p = Math.min(SMEAR.passes, Math.ceil(Math.log2(L / SMEAR.step + 1)));
  let from = src;
  for (let i = 0; i < p; i++) {
    const to = i % 2 ? smearB : smearA, c = to.getContext('2d'), d = L * 2 ** i / (2 ** p - 1);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, H);
    c.globalAlpha = 0.5; c.globalCompositeOperation = 'lighter';  // premultiplied: ½A + ½B is the average
    c.drawImage(from, 0, 0, w, H, 0, 0, w, H); c.drawImage(from, 0, 0, w - d, H, d, 0, w - d, H);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    from = to;
  }
  return from;
}
/**
 * Draw a layer that moves along x, a … b screen px from where draw() puts it over the shutter, smeared along that path
 * (drawn plainly when it barely moves). trail: the smear at that opacity, then the layer itself crisp on top (a graphic
 * speed smear); without it, only the smear (a camera's motion blur).
 */
function moving(g, a, b, draw, trail = 0) {
  const lo = Math.min(a, b), hi = Math.max(a, b), L = Math.min(SMEAR.max, hi - lo);
  if (L < SMEAR.min) return draw(g);
  const top = Math.round(clamp(L / 2, lo + L, hi)), w = W + Math.ceil(L), m = g.getTransform();  // top: far end of the window
  lb.setTransform(1, 0, 0, 1, 0, 0); lb.clearRect(0, 0, w, H); lb.setTransform(m.a, m.b, m.c, m.d, m.e + top, m.f);
  draw(lb);
  const [a0, a1, low] = SMEAR.fade, f = clamp((L - a0) / (a1 - a0), 0, 1), crisp = trail ? lerp(1, low, f) : 0;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha *= trail ? lerp(trail, 1, f) : 1;
  g.drawImage(boxSmear(layerBuf, w, L), 0, 0, w, H, -L, 0, w, H); g.restore();
  if (crisp) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha *= crisp; g.drawImage(layerBuf, 0, 0, w, H, -top, 0, w, H); g.restore(); }
}

// ---- the painted scene, shared by the five intros (each frame stages its own move) ----
let stage;
function sharedStage() { return (stage ??= makeStage()); }

async function makeStage() {
  const src = canvas(SIZE * RES, SIZE * RES), ctx = src.getContext('2d');
  ctx.scale(RES, RES);  // the scene draws in 960-unit board space through this one context
  // The scene's effect layer (frost, scan, strips) is the one canvas it creates up front, at 1×; capture it for RES.
  const make = document.createElement, made = [];
  document.createElement = function (...a) { const el = make.apply(this, a); made.push(el); return el; };
  let scene;
  try { scene = createScene({ canvas: src, pieces: rules }); } finally { document.createElement = make; }
  const layer = made.find(el => el instanceof HTMLCanvasElement);
  layer.width = layer.height = SIZE * RES;
  const lc = layer.getContext('2d'), setT = lc.setTransform;
  lc.setTransform = (a, b, c, d, e, f) => setT.call(lc, a * RES, b * RES, c * RES, d * RES, e * RES, f * RES);
  // Hero pass: while tap.on, figures are recorded instead of drawn and everything else is skipped. Relies on the scene
  // drawing each figure as one drawImage of a 1152 px sprite canvas, the moving piece last.
  const proto = CanvasRenderingContext2D.prototype, tap = { on: false, draws: [] };
  ctx.drawImage = function (img, ...a) {
    if (img === layer && a.length === 2) a.push(SIZE, SIZE);
    if (!tap.on) return proto.drawImage.call(this, img, ...a);
    if (img.width === 1152 && img.height === 1152) tap.draws.push({ img, a, m: this.getTransform(), alpha: this.globalAlpha, shadow: [this.shadowColor, this.shadowBlur] });
  };
  for (const k of ['fill', 'stroke', 'fillRect', 'strokeRect', 'fillText']) ctx[k] = function (...a) { if (!tap.on) return proto[k].apply(this, a); };

  await scene.load();
  scene.setSelected(null); scene.setCoords(false);
  // load() resolves with the figures; wait until the painted board is drawn too (the fallback's dark squares are green).
  for (let i = 0; i < 200; i++) {
    scene.setPosition({ board: new Uint8Array(64) }); flush(performance.now());
    const [r, gr] = ctx.getImageData((32 + 112 * 1.5) * RES, (32 + 56) * RES, 1, 1).data;
    if (r > gr) break;
    await new Promise(ok => setTimeout(ok, 25));
  }

  /** Paint the plan at board time bt (ms) into src; returns the segment playing. */
  function renderAt(plan, bt) {
    const seg = plan.segs.findLast(s => s.at <= bt) ?? plan.segs[0], t0 = performance.now(), move = seg.make();
    scene.setPosition(seg.pos); scene.play(move);
    if (seg.staged) move.captures = [];  // the staged charge hits nothing
    flush(t0 + Math.max(0, bt - seg.at));
    return seg;
  }
  /** Paint only the hero at bt into src; returns its feet in board units. */
  function heroAt(plan, bt) {
    tap.on = true; tap.draws = [];
    let seg;
    try { seg = renderAt(plan, bt); } finally { tap.on = false; }
    const f = scene.foot(rules.parseSq(seg.heroSq)), far = d => Math.hypot(d.m.e - f.x * RES, d.m.f - f.y * RES);
    const d = seg.heroActs ? tap.draws.at(-1) : tap.draws.reduce((a, b) => (far(b) < far(a) ? b : a), tap.draws[0]);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, src.width, src.height);
    if (!d) { ctx.restore(); return f; }  // the hero is not on the board at this moment
    ctx.setTransform(d.m); ctx.globalAlpha = d.alpha; [ctx.shadowColor, ctx.shadowBlur] = d.shadow;
    proto.drawImage.call(ctx, d.img, ...d.a); ctx.restore();
    return { x: d.m.e / RES, y: d.m.f / RES };
  }
  return { src, scene, renderAt, heroAt };
}

// ---- positions and moves ----
function position(board) {
  const b = new Uint8Array(64);
  for (const [sq, ch] of Object.entries(board)) b[rules.parseSq(sq)] = rules.piece(rules[ch.toUpperCase()], ch === ch.toUpperCase() ? 0 : 1);
  return { board: b, turn: 0, halfmove: 0, ply: 0 };
}
function buildPlan(cfg) {
  let pos = position(cfg.board), heroSq = cfg.hero, at = 0;
  const segs = cfg.moves.map(spec => {
    const from = rules.parseSq(spec.from), to = rules.parseSq(spec.to), last = m => m.shove?.from ?? m.captures.at(-1) ?? m.to;
    const move = spec.staged ? { from, to: from, captures: [to] }
      : actionsFor(pos, from).filter(m => last(m) === to && !!m.swap === !!spec.swap && !!m.shove === !!spec.shove)
        .sort((a, b) => b.captures.length - a.captures.length)[0];
    if (!move) throw new Error(`intro: no legal move ${spec.from} → ${spec.to}`);
    const seg = { pos, at, heroSq, heroActs: spec.from === heroSq, staged: !!spec.staged, move, make: () => ({ ...move, captures: [...move.captures] }) };
    if (seg.heroActs) heroSq = rules.sqName(move.to);
    pos = rules.makeMove(pos, move); at += spec.ms ?? 0;
    return seg;
  });
  return { segs };
}

// Where figures are hit, mirrored from scene.mjs createScene() specs (sprite px; scale to board units).
const SPEC = {
  [rules.P]: { anchor: { x: 330, y: 870 }, hit: { x: 327, y: 556 }, scale: 0.132 },
  [rules.A]: { anchor: { x: 382, y: 1066 }, hit: { x: 344, y: 424 }, scale: 0.106 },
  [rules.N]: { anchor: knightRig.ANCHOR, hit: knightRig.HIT, scale: 0.125 },
  [rules.O]: { anchor: ogreRig.ANCHOR, hit: ogreRig.HIT, scale: 0.155 },
  [rules.G]: { anchor: guardRig.ANCHOR, hit: guardRig.HIT, scale: 0.12 },
  ...Object.fromEntries(['Q', 'L', 'M', 'K', 'S'].map(k => [rules[k], { anchor: court.ANCHOR, hit: court.HIT, scale: court.figures[{ Q: 'queen', L: 'paladin', M: 'maester', K: 'king', S: 'beast' }[k]].scale }])),
};
/** A sprite point (the hit point by default) of the piece at rest on sq, in board units. */
function pointOn(scene, pos, sq, pt = 'hit') {
  const v = pos.board[sq], s = SPEC[rules.typeOf(v)] ?? SPEC[rules.P], f = scene.foot(sq), dir = rules.colorOf(v) ? -1 : 1;
  const p = typeof pt === 'string' ? s[pt] : pt;
  return { x: f.x + (p.x - s.anchor.x) * s.scale * dir, y: f.y + (p.y - s.anchor.y) * s.scale };
}

// ---- effects in board space (drawn over the board, in colour while it is grey), by piece ----
const FX = {
  // The Archer's bolt as a white-hot streak (the scene flies it from 180 to 440 ms); sparks where it lands.
  bolt(g, bt, e) {
    const k = (bt - 180) / 260, { start, end } = e.shot;
    if (k > 0 && k < 1.5) {
      const head = mixP(start, end, clamp(k, 0, 1)), fade = 1 - clamp((k - 1) / 0.5, 0, 1);
      const gr = g.createLinearGradient(start.x, start.y, head.x, head.y);
      gr.addColorStop(0, rgba(e.tint.glow, 0)); gr.addColorStop(0.55, rgba(e.tint.glow, 0.3)); gr.addColorStop(1, 'rgba(255,250,236,1)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = gr;
      for (const [w, a] of [[6, 0.16], [2.6, 0.38], [0.9, 1]]) { g.globalAlpha = a * fade; g.lineWidth = w; g.beginPath(); g.moveTo(start.x, start.y); g.lineTo(head.x, head.y); g.stroke(); }
      if (k < 1) { g.globalAlpha = 1; glowDot(g, head, 8, [255, 236, 200], 0.9); flare(g, head, 70, 0.8); }
      g.restore();
    }
    sparks(g, end, (bt - 440) / 420, { seed: 4, n: 26, reach: 46, colour: e.tint.glow });
  },
  // Beast: a burst of sparks at each bite as the jaws meet.
  bite(g, bt, e) {
    e.bites.forEach((p, i) => sparks(g, p, (bt - (i + 0.33) * 560) / 420, { seed: 9 + i, n: 30, reach: 50, colour: HOT }));
  },
  // Maester: bloom on the scene's goggle beam and a flare on the lens.
  beam(g, bt, e) {
    const tb = bt - e.segAt, s = court.BEAM;
    if (tb < s.on * 0.5 || tb > s.off[1] + 200) return;
    const lens = e.lens(tb), fade = 1 - clamp((tb - s.off[0]) / (s.off[1] - s.off[0]), 0, 1), reach = easeOut((tb - s.on) / s.reach);
    const off = court.scanOffset(tb), scanY = e.victimHit.y + off * e.victimHeight * (off < 0 ? 1 : 0.85);
    const to = mixP(lens, { x: e.victimHit.x, y: scanY }, reach), wid = 70 * reach;
    g.save(); g.globalCompositeOperation = 'lighter';
    if (tb >= s.on) {
      g.globalAlpha = 0.28 * fade; g.fillStyle = rgba(e.tint.glow, 1); g.filter = 'blur(4px)';
      g.beginPath(); g.moveTo(lens.x, lens.y); g.lineTo(to.x - wid / 2, to.y); g.lineTo(to.x + wid / 2, to.y); g.closePath(); g.fill(); g.filter = 'none';
      g.globalAlpha = fade; g.strokeStyle = 'rgba(230,255,250,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(to.x - wid / 2, to.y); g.lineTo(to.x + wid / 2, to.y); g.stroke();
    }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    glowDot(g, lens, 14, e.tint.glow, 0.9 * Math.min(easeOut(tb / s.on), fade));
    g.restore();
    sparks(g, e.victimHit, (tb - s.apart[0]) / 600, { seed: 13, n: 22, reach: 44, colour: e.tint.glow });
  },
  // Ogre: a ring of dust thrown up at the moment of contact.
  dust(g, bt, e) { dustRing(g, e.contact, (bt - 560) / 1300, { puffs: 44, reach: 135 }); sparks(g, e.hit, (bt - 780) / 380, { seed: 17, n: 22, reach: 38, colour: e.tint.glow }); },
  // Guard: the Queen's hurricane charges, breaks on the Guard and dies away.
  storm(g, bt, e) { storm(g, bt, e); },
};

function glowDot(g, p, r, c, a) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  gr.addColorStop(0, rgba([255, 255, 255], a)); gr.addColorStop(0.25, rgba(c, a * 0.8)); gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 6.283); g.fill();
}
/** Anamorphic lens streak: a thin horizontal line of light through a bright point. */
function flare(g, p, len, a, c = [190, 220, 255]) {
  if (a <= 0) return;
  const gr = g.createLinearGradient(p.x - len, 0, p.x + len, 0);
  gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(0.5, rgba([255, 255, 255], a)); gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr; g.fillRect(p.x - len, p.y - 0.45, len * 2, 0.9);
  g.globalAlpha *= 0.35; g.fillRect(p.x - len * 0.6, p.y - 1.6, len * 1.2, 3.2); g.globalAlpha /= 0.35;
}
/** Radial spark burst at p; k runs 0 → 1 over its life. */
function sparks(g, p, k, { seed = 1, n = 24, reach = 40, colour = [255, 200, 140], toward = 0, glow = 1 } = {}) {
  if (k <= 0 || k >= 1) return;
  const r = rand(seed), e = easeOut(k);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  glowDot(g, p, (30 * (1 - k) + 8) * glow, colour, 0.55 * (1 - k) * glow);
  for (let i = 0; i < n; i++) {
    const a = toward ? (toward > 0 ? 0 : Math.PI) + (r() - 0.5) * 2.6 : r() * 6.283, v = 0.45 + r() * 0.8, l0 = reach * e * v, l1 = l0 + (4 + r() * 10) * (1 - k * 0.6), drop = 14 * k * k * v;
    g.globalAlpha = (1 - k) * (0.55 + r() * 0.45); g.strokeStyle = rgba(colour.map(v => v + (255 - v) * (0.3 + r() * 0.6) | 0), 1); g.lineWidth = 0.5 + r() * 0.9;
    g.beginPath(); g.moveTo(p.x + Math.cos(a) * l0, p.y + Math.sin(a) * l0 * 0.8 + drop); g.lineTo(p.x + Math.cos(a) * l1, p.y + Math.sin(a) * l1 * 0.8 + drop); g.stroke();
  }
  g.restore();
}
/** A ring of dust thrown out along the ground from p; k runs 0 → 1. */
function dustRing(g, p, k, { puffs = 34, reach = 95, seed = 21 } = {}) {
  if (k <= 0 || k >= 1) return;
  const r = rand(seed), grow = easeOut(k), fade = (1 - k) ** 1.5;
  g.save();
  for (let i = 0; i < puffs; i++) {
    const a = (i / puffs) * 6.283 + r() * 0.25, rad = 10 + reach * grow * (0.75 + r() * 0.5), s = 6 + 20 * grow * (0.5 + r());
    const x = p.x + Math.cos(a) * rad, y = p.y + Math.sin(a) * rad * 0.32 - 16 * grow * r() - 4;
    const gr = g.createRadialGradient(x, y, 0, x, y, s), tone = r() < 0.5 ? '222,204,168' : '186,164,128';
    gr.addColorStop(0, `rgba(${tone},${0.5 * fade})`); gr.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, 6.283); g.fill();
  }
  // grit flung low and fast ahead of the cloud
  g.fillStyle = `rgba(120,100,76,${0.8 * fade})`;
  for (let i = 0; i < 20; i++) { const a = r() * 6.283, d = 14 + reach * 1.2 * grow * (0.6 + r() * 0.6); g.beginPath(); g.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.3 - 10 * Math.sin(Math.PI * k) * r(), 0.8 + r() * 1.2, 0, 6.283); g.fill(); }
  g.restore();
}
// The Queen's spin, mirrored from scene.mjs (SPIN): travel 250–780 ms, contact 780, release 1150, back by 1400.
const SPIN = { travel: [250, 780], contact: 780, release: 1150, duration: 1400 };
function storm(g, bt, e) {
  const S = SPIN, [t0, t1] = S.travel, t = Math.max(0, bt), since = t - S.contact, dir = Math.sign(e.guardHit.x - e.qFrom.x) || 1;
  const foot = t < t0 ? e.qFrom : t < t1 ? mixP(e.qFrom, e.qStop, easeInOut((t - t0) / (t1 - t0))) : t < S.release ? e.qStop
    : mixP(e.qStop, e.qFrom, easeInOut((t - S.release) / (S.duration - S.release)));
  const power = Math.min(1, t / 250) * (1 - clamp((t - S.release) / 350, 0, 1)), r = rand(31);
  if (power <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  // The funnel: tapered wind arcs spinning round the Queen, its top leaning into the charge.
  for (let i = 0; i < 18; i++) {
    const h = r(), rx = 16 + h * 48 + r() * 8, ph = t * (0.016 + r() * 0.012) + r() * 6.283, len = 1.3 + r() * 1.5, w = 0.7 + r() * 1.6;
    const cx = foot.x + dir * h * (t < t1 ? 16 : 6), cy = foot.y - 6 - h * 122, col = r() < 0.5 ? [236, 230, 214] : e.tint.light, a = power * (0.2 + 0.4 * r());
    for (let k = 0; k < 6; k++) {  // a tail that fades behind the head of each band
      const a0 = ph - (len * k) / 6, a1 = ph - (len * (k + 1)) / 6;
      g.globalAlpha = a * (1 - k / 6); g.strokeStyle = rgba(col, 1); g.lineWidth = w * (1 - k / 8);
      g.beginPath(); g.ellipse(cx, cy, rx, rx * 0.24, 0, a1, a0); g.stroke();
    }
  }
  // Gusts race ahead toward the Guard. Until the storm lands they die at its shield; then they splash along its
  // front and peel away, never through it.
  const front = e.guardHit.x - dir * 26, wall = 0.6;
  const path = (lane, q) => {
    const x0 = foot.x + dir * 20;
    if (q <= wall) return { x: lerp(x0, front, q / wall), y: e.guardHit.y + lane * 50 };
    const s = (q - wall) / (1 - wall), side = Math.sign(lane || 1);
    return { x: front - dir * 46 * s * s, y: e.guardHit.y + lane * 50 + side * (40 + 50 * Math.abs(lane)) * Math.sqrt(s) };
  };
  for (let i = 0; i < 34; i++) {
    const lane = r() * 2 - 1, spd = 0.7 + r() * 0.9, len = 0.12 + r() * 0.14, q = (r() + t * 0.0011 * spd) % 1, stop = since > 0 ? 1 : wall;
    if (q - len > stop) continue;
    const a = power * (0.18 + 0.42 * r()) * Math.sin(Math.PI * Math.min(q, 1)), w = 0.5 + r() * 1.3;
    g.strokeStyle = 'rgba(242,238,226,1)'; g.lineWidth = w; g.globalAlpha = a;
    g.beginPath();
    for (let k = 0; k <= 6; k++) { const p = path(lane, Math.max(0, q - len) + (Math.min(q, stop) - Math.max(0, q - len)) * (k / 6)); k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
    g.stroke();
  }
  g.restore();
  // The break: a flash on the shield, spray thrown back, dust at its feet, and the Guard's eyes flare.
  if (since > 0) {
    const k = since / 700;
    g.save(); g.globalCompositeOperation = 'lighter';
    glowDot(g, { x: front, y: e.guardHit.y }, 22, e.tint.light, 0.3 * (1 - clamp(k * 2, 0, 1)));
    for (let i = 0; i < 3; i++) {
      const kk = clamp(k * 1.4 - i * 0.12, 0, 1), rad = 14 + 60 * easeOut(kk);
      if (kk <= 0 || kk >= 1) continue;
      g.strokeStyle = rgba(e.tint.light, 0.55 * (1 - kk)); g.lineWidth = 2.4 * (1 - kk) + 0.3;
      g.beginPath(); g.ellipse(front, e.guardHit.y, rad * 0.45, rad, 0, dir > 0 ? Math.PI * 0.55 : -Math.PI * 0.45, dir > 0 ? Math.PI * 1.45 : Math.PI * 0.45); g.stroke();
    }
    const eye = clamp(1 - since / 500, 0, 1) * clamp(since / 60, 0, 1);
    if (eye > 0) { glowDot(g, e.guardEyes, 9, e.tint.glow, 0.9 * eye); flare(g, e.guardEyes, 46, 0.75 * eye, e.tint.light); }
    g.restore();
    sparks(g, { x: front, y: e.guardHit.y }, k * 1.4, { seed: 5, n: 30, reach: 64, colour: e.tint.glow, toward: -dir, glow: 0.35 });
    dustRing(g, { x: e.guardFoot.x - dir * 10, y: e.guardFoot.y }, since / 900, { puffs: 20, reach: 55, seed: 8 });
  }
}

// ---- card art ----
function posedFigure(sheet, pose) {
  const c = canvas(1152, 1152); pose(c, sheet);
  const d = c.getContext('2d').getImageData(0, 0, 1152, 1152).data;
  let x0 = 1152, y0 = 1152, x1 = 0, y1 = 0;
  for (let y = 0; y < 1152; y += 2) for (let x = 0; x < 1152; x += 2) if (d[(y * 1152 + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const out = canvas(x1 - x0 + 4, y1 - y0 + 4); out.getContext('2d').drawImage(c, -x0 + 2, -y0 + 2);
  return out;
}
/** The silhouette's edge facing the light (dir), coloured: a rim light. */
function rimLight(fig, dir, colour, depth = 9) {
  const c = canvas(fig.width, fig.height), g = c.getContext('2d');
  g.drawImage(fig, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(fig, -dir.x * depth, -dir.y * depth);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
  const out = canvas(fig.width, fig.height), o = out.getContext('2d'); o.filter = 'blur(2px)'; o.drawImage(c, 0, 0);
  return out;
}
function bannerArt(backdrop, tint, seed) {
  const c = canvas(W, H), g = c.getContext('2d');
  if (backdrop) {
    const s = Math.max(W / backdrop.width, H / backdrop.height);
    g.drawImage(backdrop, (W - backdrop.width * s) / 2, (H - backdrop.height * s) / 2, backdrop.width * s, backdrop.height * s);
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = rgba(tint.mid, 0.5); g.fillRect(0, 0, W, H);
    return c;
  }
  const r = rand(seed), base = g.createLinearGradient(0, H, W, 0);
  base.addColorStop(0, rgba(tint.dark, 1)); base.addColorStop(0.55, rgba(tint.mid, 1)); base.addColorStop(1, rgba(tint.light, 1));
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1100; i++) {
    const x = r() * W, y = r() * H, l = 80 + r() * 300, a = -0.52 + (r() - 0.5) * 0.25;
    g.strokeStyle = rgba(r() < 0.5 ? tint.light.map(v => Math.min(255, v + 25)) : tint.dark, 0.04 + r() * 0.12); g.lineWidth = 3 + r() * 24; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}

export async function create(params, { fx, dur }) {
  const cfg = PIECES[params.piece], tint = TINTS[params.tint] ?? TINTS.ember, name = params.name ?? params.piece.toUpperCase();
  if (!cfg) throw new Error(`intro: unknown piece ${params.piece}`);
  const [tf, peak] = cfg.ramp.at(-1), [tr, from] = cfg.after[0];
  if (from !== peak || tr <= tf) throw new Error(`intro: ${params.piece} must resume after its freeze, where it froze`);
  const st = await sharedStage(), { scene } = st, plan = buildPlan(cfg), mirror = cfg.card === 'right', side = mirror ? -1 : 1;

  // Card art: the posed game figure with its rim light baked in and a glow (motion.mjs rimmed), the banner, the name.
  const sheet = await load(ART + cfg.figure.sheet), pose = posedFigure(sheet, cfg.figure.pose), lit = canvas(pose.width, pose.height), lc = lit.getContext('2d');
  lc.drawImage(pose, 0, 0); lc.globalCompositeOperation = 'lighter'; lc.globalAlpha = 0.9;
  lc.drawImage(rimLight(pose, { x: 0.8, y: -0.6 }, rgba(tint.light.map(v => Math.min(255, v + 60)), 1)), 0, 0);
  const figure = M.rimmed(lit, 0, 0, lit.width, lit.height, { color: rgba(tint.glow, 1), blur: 26, pad: 100 });
  const slab = bannerArt(await load(ASSETS + BACKDROP(params.piece)).catch(() => null), tint, 11 + params.piece.length);
  let T = M.title(name, { px: NAME.px });
  if (T.width > NAME.maxWidth) T = M.title(name, { px: Math.floor(NAME.px * NAME.maxWidth / T.width) });

  // Geometry for the effects, in board units; burst: where the resume lands and which way it sprays.
  const seg0 = plan.segs[0], last = plan.segs.at(-1), sq = s => rules.parseSq(s);
  const e = { tint };
  if (cfg.fx === 'bolt') { e.shot = archerShot(scene, seg0.pos, seg0.move); e.burst = { at: e.shot.end, dir: e.shot.end.x > e.shot.start.x ? 0 : Math.PI }; }
  if (cfg.fx === 'bite') { e.bites = seg0.move.captures.map(c => pointOn(scene, seg0.pos, c)); e.burst = { at: e.bites[1] ?? e.bites[0], dir: 0 }; }
  if (cfg.fx === 'beam') {
    const m = last.move, vFoot = scene.foot(m.captures[0]), dir = Math.sign(vFoot.x - scene.foot(m.from).x) || 1;
    e.segAt = last.at; e.victimHit = pointOn(scene, last.pos, m.captures[0]); e.victimHeight = vFoot.y - e.victimHit.y;
    e.lens = tb => { const ext = court.actionAt(tb / court.BEAM.duration), p = court.maesterLens(0, ext), f = scene.foot(m.from), s = court.figures.maester.scale;
      return { x: f.x + (p.x - court.ANCHOR.x) * s * dir, y: f.y + (p.y - court.ANCHOR.y) * s }; };
    e.burst = { at: e.victimHit, dir: dir > 0 ? 0 : Math.PI };
  }
  if (cfg.fx === 'dust') {
    const m = seg0.move, v = scene.foot(m.shove.from);
    e.hit = pointOn(scene, seg0.pos, m.shove.from); e.contact = mixP(v, scene.foot(m.from), 0.3);
    e.burst = { at: e.hit, floor: e.contact, dir: v.x < scene.foot(m.from).x ? Math.PI : 0 };
  }
  if (cfg.fx === 'storm') {
    const m = seg0.move, g0 = m.captures[0];
    e.qFrom = scene.foot(m.from); e.guardFoot = scene.foot(g0); e.guardHit = pointOn(scene, seg0.pos, g0);
    e.qStop = stopPoint(e.qFrom, e.guardFoot, 78, rules.colorOf(seg0.pos.board[m.from]) ? -1 : 1);
    e.guardEyes = pointOn(scene, seg0.pos, g0, { x: 580, y: 320 });  // the eye slits in the Guard's sprite
    const dir = Math.sign(e.guardHit.x - e.qFrom.x) || 1;
    e.burst = { at: { x: e.guardHit.x - dir * 26, y: e.guardHit.y }, dir: dir > 0 ? Math.PI : 0 };  // the storm splashes back
  }

  // ---- time: speed ramps (motion.mjs remap) to the freeze and from the resume ----
  const pre = M.remap(cfg.ramp), post = M.remap(cfg.after);
  const boardTime = t => (t < tf ? pre(t) : t < tr ? peak : post(t));
  const rateAt = t => (boardTime(t + 1e-3) - boardTime(t - 1e-3)) / 2;  // board ms per shot ms
  const fxTime = t => boardTime(t) + FX_CREEP * 1000 * clamp(t - tf, 0, tr - tf);

  // ---- the cuts: whips (the camera's offset along x, board units) ----
  const dirOf = d => ({ left: -1, right: 1 })[d] ?? 0, win = dirOf(params.whipIn), wout = dirOf(params.whipOut), travel = WHIP.travel * TILE;
  /** The whip at t: camera offset dx and speed v (board units, per second), k 0 → 1 toward the cut. */
  const whipAt = t => {
    const [a, b] = TIME.whip;
    if (win && t < a) { const k = 1 - t / a; return { dx: -win * travel * k * k, v: 2 * win * travel * k / a, k }; }
    if (wout && t > dur - b) { const k = (t - dur + b) / b; return { dx: wout * travel * k * k, v: 2 * wout * travel * k / b, k }; }
    return { dx: 0, v: 0, k: 0 };
  };

  // ---- cameras and impacts ----
  const key = ([s, dx, dy, z]) => { const f = scene.foot(sq(s)); return { x: f.x + dx * TILE, y: f.y + dy * TILE, z }; };
  const K = { a: key(cfg.cam.start), b: key(cfg.cam.peak), c: key(cfg.cam.end) }, held = 1 + CAM.punch[0] + CAM.drift;
  const mixCam = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), z: lerp(p.z, q.z, k) });
  /** Board framing: a push in to the freeze, a move on from the resume (starting where the frozen push-in ended), the whips. */
  const camAt = t => {
    const c = t < tr ? mixCam(K.a, K.b, M.ease.inOut(t / tf)) : mixCam({ ...K.b, z: K.b.z * held }, K.c, M.ease.inOut((t - tr) / (dur - tr)));
    return { ...c, x: c.x + whipAt(t).dx };
  };
  const pushIn = t => (t >= tf && t < tr ? 1 + CAM.punch[0] * M.ease.out((t - tf) / CAM.punch[1]) + CAM.drift * M.ease.inOut((t - tf) / (tr - tf)) : 1);
  const scaled = (at, s, k) => ({ at, kick: s.kick * k, flash: s.flash * k, fringe: s.fringe * k });
  const boardEvents = [...(win ? [] : [scaled(0, OPEN, 1)]), scaled(tf, FREEZE, 1), ...cfg.hits.map(([at, k]) => (at === tr
    ? { ...scaled(at, { ...IMPACT, flash: RESUME.flash }, k), color: tint.glow.map(v => Math.round(lerp(v, 255, RESUME.white))).join(',') }
    : scaled(at, IMPACT, k)))];
  const style = params.reveal ?? 'arrow', r0 = tf + (cfg.reveal ?? TIME.reveal);
  const nameEvents = M.titleHits(T, style).map(h => scaled(r0 + h, REVEAL[style] ?? REVEAL.arrow, 1)), events = [...boardEvents, ...nameEvents];
  const view = M.camera({ path: t => ({ zoom: 1.03 * pushIn(t), rot: lerp(CAM.roll[0], CAM.roll[1], M.ease.inOut(t / dur)) * Math.PI / 180 }),
    handheld: CAM.handheld, shake: CAM.shake, shakes: boardEvents.map(ev => ({ at: ev.at, amount: ev.kick })) });
  const cardCam = M.camera({ handheld: CARD.handheld, shake: CAM.shake, seed: 23, shakes: nameEvents.map(ev => ({ at: ev.at, amount: ev.kick })) });
  /** The brightest flash at t (1–2 frames after its hit) and its colour. */
  const flashAt = t => events.reduce((m, ev) => { const k = t >= ev.at ? ev.flash * clamp(1 - (t - ev.at) / DECAY.flash, 0, 1) : 0; return k > m.k ? { k, color: ev.color } : m; }, { k: 0 });
  const fringeAt = t => events.reduce((m, ev) => Math.max(m, t >= ev.at ? ev.fringe * Math.exp(-(t - ev.at) / DECAY.fringe) : 0), 0);
  const toBoard = (g, cam) => { g.translate(W / 2, H / 2); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y); };

  // ---- board compositing ----
  const sharp = canvas(W, H), sg = sharp.getContext('2d'), tmp = canvas(W, H), tg = tmp.getContext('2d');
  const blit = (c, cam) => { c.save(); c.translate(W / 2, H / 2); c.scale(cam.z / RES, cam.z / RES); c.translate(-cam.x * RES, -cam.y * RES); c.drawImage(st.src, 0, 0); c.restore(); };
  /** The graded, focus-pulled board at bt into out; hero (optional) receives the hero alone. Returns the hero's feet. */
  function compose(out, bt, cam, rate, hero, t = 0) {
    const o = out.getContext('2d');
    sg.clearRect(0, 0, W, H);
    for (const [back, a] of GHOSTS) if (rate > 0.01 && bt > 0) { st.renderAt(plan, bt - back * 1000 * rate); sg.globalAlpha = a; blit(sg, cam); }
    st.renderAt(plan, bt); sg.globalAlpha = 1; blit(sg, cam);
    o.save(); o.clearRect(0, 0, W, H); o.fillStyle = '#0b0806'; o.fillRect(0, 0, W, H);
    o.filter = `blur(${DOF.blur}px) brightness(${DOF.dim})`; blit(o, cam); o.restore();
    // focus: sharp inside a soft ellipse round the action
    sg.save(); sg.globalCompositeOperation = 'destination-in'; sg.translate(W / 2, H / 2 + DOF.lift); sg.scale(DOF.stretch, 1);
    const m = sg.createRadialGradient(0, 0, DOF.inner / DOF.stretch, 0, 0, DOF.outer / DOF.stretch);
    m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = m; sg.fillRect(-W, -H, W * 2, H * 2); sg.restore();
    o.drawImage(sharp, 0, 0);
    // torchlight grade: warm pool on the action, cool falloff
    o.save(); o.globalCompositeOperation = 'soft-light';
    const warm = o.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 980);
    warm.addColorStop(0, 'rgba(255,170,80,.7)'); warm.addColorStop(1, 'rgba(30,50,90,.8)');
    o.fillStyle = warm; o.fillRect(0, 0, W, H);
    o.globalCompositeOperation = 'multiply';
    const depth = o.createLinearGradient(0, 132, 0, H - 132);
    depth.addColorStop(0, DEPTH.far); depth.addColorStop(0.45, '#fff'); depth.addColorStop(1, DEPTH.near);
    o.fillStyle = depth; o.fillRect(0, 0, W, H);
    // soft shafts of light slanting across from the upper left
    o.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 520 + Math.sin(t * 0.3 + i * 2) * 40, w = 150 + i * 60, sk = 520;
      const gr = o.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, rgba(SHAFTS.colour, 0)); gr.addColorStop(0.5, rgba(SHAFTS.colour, SHAFTS.alpha * (1 - i * 0.25))); gr.addColorStop(1, rgba(SHAFTS.colour, 0));
      o.save(); o.transform(1, 0, sk / H, 1, 0, 0); o.fillStyle = gr; o.fillRect(x, 0, w, H); o.restore();  // skewed: slants to the right
    }
    o.restore();
    if (!hero) return null;
    // The hero alone, as graded in the frame: the frame cut out by the hero's silhouette (the moving piece is drawn last).
    const feet = st.heroAt(plan, bt), h = hero.getContext('2d');
    h.clearRect(0, 0, W, H); blit(h, cam);
    h.globalCompositeOperation = 'source-in'; h.drawImage(out, 0, 0); h.globalCompositeOperation = 'source-over';
    return feet;
  }
  const greyOf = (colour, out) => {
    const c = out.getContext('2d'); c.save(); c.globalCompositeOperation = 'copy'; c.filter = GREY.filter; c.drawImage(colour, 0, 0);
    c.filter = 'none'; c.globalCompositeOperation = 'multiply'; c.fillStyle = GREY.wash; c.fillRect(0, 0, W, H); c.restore(); return out;
  };
  /** grey over g everywhere but a circle of radius R round p */
  function greyOutside(g, grey, p, R) {
    tg.save(); tg.globalCompositeOperation = 'copy'; tg.drawImage(grey, 0, 0);
    if (R + GREY.feather > 0) {
      tg.globalCompositeOperation = 'destination-out';
      const gr = tg.createRadialGradient(p.x, p.y, Math.max(0, R - GREY.feather), p.x, p.y, R + GREY.feather);
      gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, W, H);
    }
    tg.restore(); g.drawImage(tmp, 0, 0);
  }
  const screenOf = (cam, p) => ({ x: W / 2 + (p.x - cam.x) * cam.z, y: H / 2 + (p.y - cam.y) * cam.z });

  // The frozen frame is drawn once: colour, grey, the hero alone, and a glow round the hero.
  let frozen = null;
  const freezeFrame = () => {
    if (frozen) return frozen;
    const cam = camAt(tf), colour = canvas(W, H), hero = canvas(W, H);
    const feet = compose(colour, peak, cam, rateAt(tf - 1e-3), hero, tf);
    const heroGlow = canvas(W, H), hg = heroGlow.getContext('2d');
    hg.filter = 'blur(14px)'; hg.drawImage(hero, 0, 0); hg.filter = 'none'; hg.globalCompositeOperation = 'source-in'; hg.fillStyle = rgba(tint.glow, 1); hg.fillRect(0, 0, W, H);
    return (frozen = { colour, grey: greyOf(colour, canvas(W, H)), hero, heroGlow, centre: screenOf(cam, { x: feet.x, y: feet.y - 55 }) });
  };
  const live = canvas(W, H), liveHero = canvas(W, H), liveGrey = canvas(W, H);
  /** The resume lands (k seconds after it) at screen point p (floor: the ground under it): sparks, dust or a shockwave. */
  function landing(g, k, p, floor) {
    const d = e.burst.dir;
    const { sparks, dust, ring, barrier } = LANDING, wave = ({ alpha, ...s }, at) => { g.save(); g.globalAlpha = alpha; M.shockwave(g, k, { ...s, ...at }); g.restore(); };
    if (cfg.fx === 'dust') {
      M.dust(g, k, { ...dust, x: floor.x, y: floor.y, floor: floor.y + 8, seed: 6, dir: d, spread: 2.4 });
      wave(ring, floor);
    }
    if (cfg.fx === 'storm') wave(barrier, { x: p.x, y: p.y, width: 8 });
    M.sparks(g, k, { ...sparks, x: p.x, y: p.y, seed: 3, dir: d, spread: cfg.fx === 'bite' ? 6.28 : sparks.spread, color: (cfg.fx === 'bite' ? HOT : tint.glow).join(',') });
  }

  // ---- the card ----
  const b0 = tf + TIME.banner[0], b1 = b0 + TIME.banner[1];
  const outK = ([lead, len], t) => clamp((t - tr + lead) / len, 0, 1);
  const life = t => clamp((t - b0) / (tr - b0), 0, 1);  // 0 → 1 across the card
  const spring = cfg.figure.spring ?? CARD.figure.spring, figH = cfg.figure.height, figW = figH * figure.w / figure.h;
  const feet = { x: cfg.figure.x + figW / 2, y: H - 132 + figH * 0.14 }, nx = mirror ? W - NAME.x : NAME.x;
  const enter = (feet.x + figW / 2 + 40) / (1 - M.spring(TIME.figure, spring)), sheen = tint.light.map(v => Math.min(255, v + 70));
  // x offsets (px) of the three layers. The banner and figure live in card space (mirrored cards flip it), so negative
  // is toward the figure's side there; the name is in screen space.
  // A launch (the Ogre): the name leaves the hero's palms from behind him, gaining speed into its slam (drawTitle's own
  // shove always rams in from the left, so the name is drawn at its slam pose and moved here), while he lunges into it.
  const launch = style === 'shove' && cfg.launch, slam = M.titleHits(T, style)[0] ?? 0, L = TIME.lunge;
  const pushed = t => (launch && t - r0 < slam ? launch.from * (1 - M.ease.in(clamp((t - r0) / slam, 0, 1))) : 0);
  const lunge = t => (launch ? launch.lunge * M.keys(t - r0, [[-L.windup[0], 0], [0, -L.windup[1]], [L.thrust, 1, M.ease.out], [L.thrust + L.settle, 0, M.ease.inOut]]) : 0);
  const bannerX = t => M.keys(t, [[b0, CARD.from], [b1, 0, M.ease.out]]) - CARD.away * M.ease.in(outK(TIME.out.banner, t));
  const figureX = t => -enter * (1 - M.spring(t - b0, spring)) + CARD.figure.drift * M.ease.smooth(life(t)) + lunge(t) - CARD.figure.away * M.ease.in(outK(TIME.out.figure, t));
  const nameX = t => -side * (CARD.name.away * M.ease.in(outK(TIME.out.name, t)) + pushed(t));
  /** Where a layer at offset f was over the last shutter, relative to now, in screen px (k: card space → screen). */
  const path = (f, t, k = 1) => [k * (f(t - CARD.smear.shutter) - f(t)), 0];
  const flick = M.noise(41 + name.length);
  const slabPath = (g, off) => { g.beginPath(); g.moveTo(off - 560, H + 60); g.lineTo(off + 330, H + 60); g.lineTo(off + 1930, -90); g.lineTo(off + 1040, -90); g.closePath(); };
  /** The banner at x offset off: the backdrop pushes in and drifts inside it; with lights, a torch flicker and a sweep. */
  function banner(g, t, off, alpha, lights) {
    const k = life(t), s = CARD.art.scale * (1 + CARD.art.push * M.ease.smooth(k)), ax = off * CARD.art.parallax - CARD.art.drift * M.ease.smooth(k);
    g.save(); g.globalAlpha = alpha; slabPath(g, off); g.clip();
    g.save(); g.translate(W / 2 + ax, H / 2); g.scale(s, s); g.drawImage(slab, -W / 2, -H / 2, W, H); g.restore();
    if (lights) {
      g.globalCompositeOperation = 'lighter';
      const { alpha, speed, at: [px, py], radius } = CARD.flicker, fl = alpha * (0.6 + 0.4 * flick(t * speed)), pool = g.createRadialGradient(off + px, py, 40, off + px, py, radius);
      pool.addColorStop(0, rgba(tint.glow, fl)); pool.addColorStop(1, rgba(tint.glow, 0));
      g.fillStyle = pool; g.fillRect(off - 600, -100, 2600, H + 200);
      // a band of light travelling up the banner's length through the hold (light moves linearly)
      const c = lerp(...CARD.sweep.path, clamp((t - b1) / (tr - b1), 0, 1)), hw = CARD.sweep.width / 2, ux = 0.793, uy = -0.609, cx = off - 115 + ux * c, cy = H + 60 + uy * c;
      const sw = g.createLinearGradient(cx - ux * hw, cy - uy * hw, cx + ux * hw, cy + uy * hw);
      sw.addColorStop(0, rgba(sheen, 0)); sw.addColorStop(0.5, rgba(sheen, CARD.sweep.alpha)); sw.addColorStop(1, rgba(sheen, 0));
      g.fillStyle = sw; g.fillRect(off - 600, -100, 2600, H + 200);
    }
    g.restore();
    g.save(); g.globalAlpha = alpha; g.strokeStyle = 'rgba(255,236,200,.85)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(off + 330, H + 60); g.lineTo(off + 1930, -90); g.stroke();
    g.globalAlpha = 0.4 * alpha; g.lineWidth = 1.5; g.beginPath(); g.moveTo(off - 560, H + 60); g.lineTo(off + 1040, -90); g.stroke();
    g.restore();
  }
  const nameLayer = canvas(W, H), nl = nameLayer.getContext('2d');
  function drawCard(g, t) {
    const on = clamp((t - b0) / TIME.banner[1], 0, 1) * (1 - outK(TIME.out.banner, t)), off = bannerX(t), color = tint.glow.join(',');
    const flip = () => { if (mirror) { g.translate(W, 0); g.scale(-1, 1); } };
    // Darken the frozen world under the name, for the gilding.
    const sy = NAME.y - T.px * 0.35, shade = g.createRadialGradient(nx, sy, 60, nx, sy, 760);
    shade.addColorStop(0, `rgba(0,0,0,${CARD.name.shade * on})`); shade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = shade; g.fillRect(0, 0, W, H);
    // Motes far behind the figure.
    g.save(); cardCam.apply(g, t, CARD.depth.back); g.globalAlpha = on;
    M.embers(g, t, { ...MOTES.back, seed: 5 + name.length, color }); g.restore();
    // The banner wipes in (smeared while fast), its backdrop alive with light; a glint runs up its edge as it lands.
    g.save(); cardCam.apply(g, t, CARD.depth.banner); flip();
    moving(g, ...path(bannerX, t, side), c => banner(c, t, off, 1, true), CARD.smear.trail);
    const gk = (t - b1) / CARD.glint.time;
    if (gk > 0 && gk < 1) {
      g.save(); g.globalCompositeOperation = 'lighter';
      glowDot(g, { x: lerp(off + 330, off + 1930, M.ease.inOut(gk)), y: lerp(H + 60, -90, M.ease.inOut(gk)) }, CARD.glint.radius, tint.light, CARD.glint.alpha * Math.sin(Math.PI * gk)); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter';  // light rays from the upper corner, turning slowly, flickering
    for (let i = 0; i < 8; i++) {
      const a = 2.15 + i * 0.1 + CARD.rays.turn * M.ease.smooth(life(t)) + Math.sin(t * 0.6 + i) * 0.015, w = 0.012 + (i % 3) * 0.01;
      g.fillStyle = rgba(tint.light, (0.03 + (i % 3) * 0.018) * on * (1 - CARD.rays.flicker * (0.5 - 0.5 * flick(t * 1.7 + i * 9))));
      g.beginPath(); g.moveTo(1800, -80); g.lineTo(1800 + Math.cos(a - w) * 2800, -80 + Math.sin(a - w) * 2800); g.lineTo(1800 + Math.cos(a + w) * 2800, -80 + Math.sin(a + w) * 2800); g.fill();
    }
    g.restore(); g.restore();
    // The name, revealed its own way; the Guard's is unmoved by the storm (no camera on it). A launched name flies out
    // from behind the hero until it slams.
    const flying = launch && t - r0 < slam, drawName = () => {
      if (t < r0) return;
      nl.setTransform(1, 0, 0, 1, 0, 0); nl.clearRect(0, 0, W, H);
      M.drawTitle(nl, T, flying ? slam : t - r0, style, nx + nameX(t), NAME.y);
      g.save(); if (style !== 'stand') cardCam.apply(g, t, CARD.depth.name);
      moving(g, ...path(nameX, t), c => c.drawImage(nameLayer, 0, 0), CARD.smear.trail);
      g.restore();
    };
    if (flying) drawName();
    // The figure springs in (smeared while fast), breathes and drifts, its rim light flickering with the torch.
    const x = feet.x + figureX(t);
    g.save(); cardCam.apply(g, t, CARD.depth.figure); flip();
    const rim = CARD.figure.rim[0] + CARD.figure.rim[1] * flick(t * CARD.figure.rim[2] + 40);
    moving(g, ...path(figureX, t, side), c => M.drawFigure(c, figure, x, feet.y, figH, { t, rim, breathe: CARD.figure.breathe }), CARD.smear.trail);
    g.restore();
    if (!flying) drawName();
    // Motes drifting in front of everything.
    g.save(); cardCam.apply(g, t, CARD.depth.front); g.globalAlpha = on;
    M.embers(g, t, { ...MOTES.front, seed: 71 + name.length, color }); g.restore();
  }

  const world = canvas(W, H), wg = world.getContext('2d');
  const moteClock = t => (t < tf ? t : t < tr ? tf + MOTES.frozen * (t - tf) : t - (1 - MOTES.frozen) * (tr - tf));  // they crawl while time is stopped
  return t => {
    const bt = boardTime(t), cam = camAt(t), still = t >= tf && t < tr;
    // 1. The world in screen space: the board (live, or frozen and drained to grey round the hero) and its effects.
    wg.clearRect(0, 0, W, H);
    if (still) {
      const F = freezeFrame(), k = M.ease.out((t - tf) / TIME.drain);
      wg.drawImage(F.colour, 0, 0);
      greyOutside(wg, F.grey, F.centre, lerp(GREY.from, -GREY.feather, k));
      wg.save(); wg.globalCompositeOperation = 'lighter'; wg.globalAlpha = 0.55 * k; wg.drawImage(F.heroGlow, 0, 0); wg.restore();
      wg.drawImage(F.hero, 0, 0);
    } else {
      const refill = t >= tr && t < tr + TIME.refill, heroFeet = compose(live, bt, cam, rateAt(t), refill ? liveHero : null, t);
      wg.drawImage(live, 0, 0);
      if (refill) {
        greyOutside(wg, greyOf(live, liveGrey), screenOf(cam, { x: heroFeet.x, y: heroFeet.y - 55 }), lerp(-GREY.feather, GREY.from, M.ease.out((t - tr) / TIME.refill)));
        wg.drawImage(liveHero, 0, 0);
      }
    }
    wg.save(); toBoard(wg, still ? camAt(tf) : cam); FX[cfg.fx]?.(wg, fxTime(t), e); wg.restore();
    if (t >= tr) landing(wg, t - tr, screenOf(cam, e.burst.at), screenOf(cam, e.burst.floor ?? e.burst.at));

    // 2. Onto the frame through the camera: the world recedes behind the card, smears along a whip, and zoom-smears as
    //    time stops and starts; motes hang in the torchlight.
    const g = fx, w = whipAt(t), card = t >= b0 && t < tr;
    const recede = card ? clamp((t - b0) / TIME.banner[1], 0, 1) * (1 - outK(TIME.out.banner, t)) : 0;
    g.save(); g.fillStyle = '#050303'; g.fillRect(0, 0, W, H);
    const len = Math.abs(w.v) * cam.z * WHIP.shutter;  // the whip smears the world along x, centred on the frame
    g.save(); view.apply(g, t);
    moving(g, -len / 2, len / 2, c => {
      c.save(); if (recede > 0) c.filter = `blur(${RECEDE.blur * recede}px) brightness(${1 - RECEDE.dim * recede})`;
      c.drawImage(world, 0, 0); c.restore();
    });
    g.restore();
    const burst = Math.max(t >= tf ? 1 - (t - tf) / BURST.freeze : 0, t >= tr ? 1 - (t - tr) / BURST.resume : 0);
    if (burst > 0) for (const [s, a] of BURST.layers) { g.save(); view.apply(g, t); g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2); g.globalAlpha = a * burst; g.drawImage(world, 0, 0); g.restore(); }
    g.save(); view.apply(g, t, MOTES.depth); M.embers(g, moteClock(t), MOTES.world); g.restore();
    // 3. The card.
    if (card) drawCard(g, t);
    g.restore();
    if (w.k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(WHIP.tint, WHIP.flash * w.k * w.k); g.fillRect(0, 0, W, H); g.restore(); }
    M.bloom(g, BLOOM);
    const fl = flashAt(t); M.flash(g, fl.k, fl.color);
    M.aberration(g, fringeAt(t));
    finish(g, t);
  };
}

// The Archer's shot, mirrored from scene.mjs (aimed() and bolt()): muzzle and the victim's hit point, board units.
function archerShot(scene, pos, move) {
  const foot = scene.foot(move.from), end = pointOn(scene, pos, move.captures[0]), sa = SPEC[rules.A], facing = Math.sign(end.x - foot.x) || 1;
  const p = { x: sa.anchor.x + (end.x - foot.x) / sa.scale / facing, y: sa.anchor.y + (end.y - foot.y) / sa.scale };
  const pv = archerRig.pivot(0), pivot = { x: pv.x, y: pv.y + archerRig.FIGURE_Y }, zero = archerRig.muzzle(0, 0), dx = p.x - pivot.x, dy = p.y - pivot.y;
  const angle = clamp(Math.atan2(dy, dx) - Math.asin(clamp((zero.y - pivot.y) / Math.max(1, Math.hypot(dx, dy)), -1, 1)), archerRig.MIN_ANGLE, archerRig.MAX_ANGLE);
  const m = archerRig.muzzle(angle, 0);
  return { start: { x: foot.x + (m.x - sa.anchor.x) * sa.scale * facing, y: foot.y + (m.y - sa.anchor.y) * sa.scale }, end };
}
