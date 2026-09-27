// Act III, "Everything at once" (PLAN.md row 9), 8 s at 120 BPM. Six real game captures cut on the grid
// and joined by whip pans that follow the action into each cut; every contact is a hit (shake, flash,
// fringe, particles) that hangs in slow motion before the next whip. Then the back rank spins like a slot
// reel, ticks to a stop reel by reel and lands the King on the downbeat; the camera cranes down while both
// armies drop onto the board on the beat, and the standoff holds, alive.
// Grid: cuts, whips and hits on 0.25 s steps, reel stops on 0.125 s steps; CUES lists every sync point.
// Every knob is at the top; CUTS is the edit.
import { W, H, flush, clamp, lerp, easeInOut, rand, canvas, particles, finish } from '../runtime.mjs';
import { ease, remap, noise, camera, sparks, dust, shockwave, embers, bloom, aberration, flare, flash, grade, speedLines } from '../motion.mjs';
import * as R from '../../../2d-first-pieces/board/rules.mjs';
import { createPosition, actionsFor } from '../../../2d-first-pieces/board/model.mjs';
import { createScene, PAD, TILE } from '../../../2d-first-pieces/board/scene.mjs';
import { SMASH } from '../../../2d-first-pieces/court-motion.mjs';
import { paintTriangle } from '../../../2d-first-pieces/painted-mesh.mjs';

// ---- The edit --------------------------------------------------------------------------------------
// Each cut plays the game's own capture: `piece` on `from` takes `to` in model.layouts[layout].
// dur: seconds on screen; each cut starts where the one before ends. whip: the way the camera whips INTO
// this cut, following the motion that enters it (the first one continues the Guard's whipOut; timeline
// params.whipIn overrides it). flop: mirror the cut so its action runs the whip's way; the whips alternate.
// Speed ramp: the cut opens `in` game ms into the move and closes at `out`; each hit [s, game ms, IMPACTS
// name] lands that game moment `s` seconds into the cut (keep s on the 0.25 s grid). RAMP shapes the rest.
// zoom: screen px per board px; aim: camera nudge in tiles; track: [ms, ms] the camera follows the attacker
// from its square to the victim's; trails: renders per frame; grade: a GRADES entry; light: a torch glow,
// in tiles from the focus; fx: signature effects [FX name, game ms, options].
export const CUTS = [
  { piece: 'rook', layout: 'rook', from: 'c4', to: 'c7', dur: 0.75, whip: 'left', flop: true, in: 700, hits: [[0.25, 900, 'slam']], out: 1180,
    zoom: 3.1, grade: 'torch', fx: [['quake', 620, { size: 0.55 }], ['quake', 900]] },
  { piece: 'bishop', layout: 'bishop', from: 'f5', to: 'c2', dur: 0.75, whip: 'right', flop: true, in: 340, hits: [[0.25, 514, 'slash']], out: 860,
    zoom: 3.3, grade: 'steel', fx: [['slash', 514, { angle: 1.24 }]] },
  { piece: 'paladin', layout: 'paladin', from: 'c4', to: 'g4', dur: 0.75, whip: 'left', flop: true, in: 600, hits: [[0.25, 880, 'hammer']], out: 1220,
    zoom: 3.1, grade: 'torch', fx: [] },
  { piece: 'knight', layout: 'knight', from: 'c4', to: 'e5', dur: 0.75, whip: 'right', in: 800, hits: [[0.25, 1107, 'landing']], out: 1330,
    zoom: 2.6, trails: 6, grade: 'torch', fx: [['leap', 378]] },
  { piece: 'queen', layout: 'queen', from: 'c4', to: 'g4', dur: 0.75, whip: 'left', flop: true, in: 560, hits: [[0.25, 780, 'gale']], out: 1250,
    zoom: 3.2, track: [250, 780], grade: 'storm', fx: [['gale', 560, { dx: -0.3 }]] },
  { piece: 'king', layout: 'king', from: 'c4', to: 'c5', dur: 1, whip: 'right', in: 470, hits: [[0.25, 660, 'freeze'], [0.5, 860, 'shatter']], crawl: 120, out: 1100,
    zoom: 3.4, grade: 'ice', fx: [['coldsnap', 560], ['freeze', 660], ['shatter', 860]] },
];
// The ramp around each hit: `lead` s of full approach speed, then contact; a hit-stop (`stop`: s, game ms);
// after the last hit the cut hangs near frozen for `hang` s while `crawl` game ms pass (a cut may override
// hang / crawl), then time snaps back to real speed into the whip.
const RAMP = { lead: 0.1, stop: [0.035, 5], hang: 0.3, crawl: 60 };

// ---- The hit language (MOTION.md 4), one row per kind of hit ------------------------------------------
// Screen time: trauma 0..1 (camera shake, decays at `decay`/s), flash (full frame, 1–2 frames) in `tint`,
// fringe (chromatic aberration px, gone in ~0.15 s), punch (zoom kick, eases back).
// Game time (after a POP burst), so they hang with the speed ramp: sparks / dust / shock (motion.mjs; px, px/s, s), placed on
// the victim at `at` (body or ground; dx/dy nudge it, tiles); `dir` in radians (0 = right, −π/2 = up).
// lines: [s, alpha] radial speed lines around the victim for the first s seconds (screen time).
const IMPACTS = {
  slam: { trauma: 0.9, flash: 0.5, tint: '255,232,196', fringe: 8, punch: 0.045, at: 'ground',
    shock: { radius: 560, dur: 0.6, squash: 0.3, width: 12 }, dust: { n: 20, speed: [160, 520], spread: 3.2, size: [26, 80], life: [0.6, 1.2], color: '172,142,102' } },
  slash: { trauma: 0.55, flash: 0.45, tint: '232,240,255', fringe: 7, punch: 0.03, at: 'body',
    sparks: { n: 30, speed: [380, 1200], dir: Math.PI / 2, spread: 2.4, gravity: 1300, life: [0.2, 0.5], color: '205,225,255' } },
  hammer: { trauma: 0.9, flash: 0.6, tint: '255,222,170', fringe: 9, punch: 0.05, at: 'body', dy: -0.25,
    sparks: { n: 46, speed: [380, 1250], dir: -Math.PI / 2, spread: 3.6, gravity: 1300, life: [0.2, 0.55] },
    dust: { n: 12, speed: [120, 380], spread: 3.2, size: [22, 64], color: '176,146,104' } },
  landing: { trauma: 0.55, flash: 0.3, tint: '255,226,180', fringe: 5, punch: 0.03, at: 'ground',
    shock: { radius: 300, dur: 0.45, squash: 0.3, width: 8 }, dust: { n: 16, speed: [140, 420], spread: 3.2, size: [20, 60], color: '176,146,104' } },
  gale: { trauma: 0.7, flash: 0.35, tint: '215,245,240', fringe: 7, punch: 0.035, at: 'body', lines: [0.22, 0.6],
    dust: { n: 26, speed: [300, 900], dir: -0.15, spread: 1.4, size: [18, 60], life: [0.5, 1], color: '150,170,166' } },
  freeze: { trauma: 0.4, flash: 0.55, tint: '200,232,255', fringe: 5, punch: 0.025, at: 'body',
    sparks: { n: 18, speed: [160, 520], spread: 6.3, gravity: 200, life: [0.25, 0.6], width: [0.8, 2], color: '170,220,255' } },
  shatter: { trauma: 0.95, flash: 0.35, tint: '220,242,255', fringe: 10, punch: 0.05, at: 'body',
    sparks: { n: 34, speed: [300, 1100], spread: 6.3, gravity: 900, life: [0.2, 0.5], color: '200,236,255' },
    shock: { radius: 380, dur: 0.45, squash: 0.36, width: 8, color: '215,240,255' } },
  tick: { trauma: 0.4, decay: 14, fringe: 1.5 },    // a reel stop (its window flashes instead of the frame)
  jackpot: { trauma: 1, decay: 4.5, flash: 0.7, tint: '255,228,170', fringe: 11, punch: 0.06 },   // the last reel stop
  drop: { trauma: 0.42, flash: 0.1, tint: '255,214,160', fringe: 3 },   // the ivory pawns land
  army: { trauma: 0.65, flash: 0.16, tint: '255,214,160', fringe: 5, punch: 0.02 },   // the charcoal army lands
};
const FLASH_T = 2 / 30, FRINGE_T = 0.045, PUNCH_T = 0.12;   // s: flash length, fringe and zoom-kick decay
const CREEP = 0.3;        // particles also run at this fraction of screen time, so they drift while the hit hangs
const POP = [0.08, 0.03]; // ...and burst out first: s of particle time delivered in screen time, e-folding s (2–3 frames)
const HAND = { handheld: 0.5, shake: 26 };                   // camera sway (0..1) and shake px at full trauma

// ---- Camera and film -------------------------------------------------------------------------------
const PUSH = 0.07;        // slow push-in across each cut (fraction of its zoom)
const SHUTTER = 0.022;    // motion trails: screen seconds blended into each frame...
const TRAIL_MAX = 24;     // ...but never more than this many game ms
const TRAILS = 4;         // renders blended per frame for the trails
const TRAIL_TAPER = 1;    // 0: every trail render weighs the same (ghosts); 1: weights fall linearly with age
const WHIP = { dur: 0.16, travel: 2.4, shutter: 1 / 45, flash: 0.2, tint: '255,236,210' };  // travel in tiles
const FOCUS = { inner: 0.75, outer: 2.1, blur: 8, dim: 0.3 };          // depth of field: radii in tiles, blur px, dimming
const BLOOM = { strength: 0.2, threshold: 0.88, radius: 6 };
const TABLE = '#100b08', RIM = '#6b4a26';   // what lies around the board, and the board's bronze edge
const TORCH = ['255,170,90', '255,230,190'];  // a cut's `light`: halo and core
const FLICKER = { rate: 7, amount: 0.3 };     // torchlight flicker: noise speed (1/s) and depth
const GRADES = {          // torchlight grade: warm on the action, cool in the falloff, then darkness
  torch: { warm: '255,170,80', cool: '30,50,90', shadow: '70,48,36', motes: '255,200,140' },
  steel: { warm: '240,228,205', cool: '22,34,70', shadow: '52,54,66', motes: '230,235,255' },
  storm: { warm: '205,235,225', cool: '12,40,62', shadow: '40,58,62', motes: '215,245,240' },
  ice: { warm: '175,225,255', cool: '8,24,60', shadow: '36,52,78', motes: '200,240,255' },
};
const GRADE_AMOUNT = 0.7;   // soft-light strength of the grade

// ---- The slot reel, the crane, the drop and the standoff (seconds from the reel's whip-in) ------------
const REEL = {
  army: null,        // the back rank a→h, e.g. 'RNBQKBNR'; null draws a random army the way the game does
  seed: 11,          // seed 11 draws GRNAOMKS: all five Act II characters, a Rook, a Knight and the King
  faces: 'QORBNAGMSK', // what spins past on the reels (the game's draw pool and the king)
  whip: 'down',      // the camera whips down onto the reels, with the spin
  at: { x: 480, y: 790, zoom: 2.05 },  // camera straight down on the back rank (board px)
  speed: 15,         // figures per second while spinning
  first: 0.375, step: 0.125,           // the first reel stops here, then one every step (1/8 s): a tick each
  last: 'K',         // the reel holding this piece stops last, on the downbeat: the jackpot (null: a→h)
  pitch: 1.55,       // tiles between figures on a reel
  window: [1.72, 0.2],                 // the window reaches this far above and below a figure's feet (tiles)
  brake: [0.08, 0.35],  // each reel brakes for this many s, down to this fraction of its speed, then lands
  tease: [0.3, 0.15],   // the jackpot reel slows longer, so the last figures roll past readable
  bounce: [40, 11],  // the landing spring: frequency (rad/s) and damping (1/s)
  blur: 0.035,       // s of spin smeared into a spinning figure
  open: [0.25, 0.25],  // after the jackpot: hang, then the windows melt into the board
  glass: [0.4, 0.12],  // a stop lights its window: alpha, seconds
  tick: { n: 9, speed: [160, 520], dir: -Math.PI / 2, spread: 1.5, gravity: 1400, life: [0.12, 0.3], width: [0.8, 2], color: '255,210,130' },
  jackpot: { n: 60, speed: [300, 1300], dir: -Math.PI / 2, spread: 3.4, gravity: 1100, life: [0.25, 0.7], color: '255,214,140', flare: 1100, shock: 900 },
  gold: '240,200,120', drum: ['#050302', '#2b2016', '#1a130d'],   // window trim; the drum behind the figures
  grade: 'torch',
};
const CRANE = {      // from the jackpot, the camera cranes down to a low view across the board
  delay: 0, dur: 1,
  at: { x: 480, y: 485, zoom: 1.3, pitch: 28 },   // look-at (board px), zoom there, pitch in degrees (90 = straight down)
  dist: 1300,        // camera distance (board px): smaller = stronger perspective
};
const DROP = {
  // [ranks, side, s after the jackpot (on a beat), IMPACTS name]: the ivory pawns, then the mirrored charcoal army
  waves: [[[2], 0, 0.5, 'drop'], [[7, 8], 1, 1, 'army']],
  ripple: 0.03,      // s between file pairs, from the centre out; the centre files land on the beat
  fall: 0.22, height: 600,             // s to fall, from this height (board px); the jackpot holds 8+ frames before the pawns enter
  dust: '#d8c6a4', puff: { n: 5, speed: [30, 100], spread: 3.2, size: [5, 15], life: [0.4, 0.8], color: '190,165,125' },   // puff: board px
};
const STANDOFF = {
  push: 0.03,        // slow push-in per second once the crane has settled (fraction of zoom)
  breathe: [0.018, 2.3],               // figures breathe: y-scale amount, rad/s
  torches: [[-30, 840], [990, 840], [-30, 120], [990, 120]],   // warm pools of torchlight at the corners (board px), each flickering
  pool: [430, 0.28],                   // their radius (board px) and strength
  embers: { n: 60, rise: 38, sway: 26, size: [1, 3], color: '255,168,80', bokeh: 10 },
};
const SNAP = 3;      // figure snapshots for the reel and the drop, px per board px
const TEX = 2;       // board texture for the crane, px per board px

const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const TYPES = { pawn: R.P, knight: R.N, bishop: R.B, rook: R.R, queen: R.Q, king: R.K, archer: R.A, paladin: R.L, guard: R.G, maester: R.M, beast: R.S, ogre: R.O };
const LETTER = { P: R.P, N: R.N, B: R.B, R: R.R, Q: R.Q, K: R.K, A: R.A, L: R.L, G: R.G, M: R.M, S: R.S, O: R.O };
const POOL = 'QORRBBNNAAGMMSS';   // src/rules/setup.ts: 7 of these join the king on the back rank

const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// The game's random back rank (src/rules/setup.ts randomBackRank): 7 from POOL plus the king, bishops on opposite colours.
function randomArmy(r) {
  for (;;) {
    const row = shuffle([...shuffle([...POOL], r).slice(0, 7), 'K'], r), b = row.flatMap((p, i) => (p === 'B' ? [i] : []));
    if (b.length === 2 && (b[0] + b[1]) % 2 === 0) continue;
    return row.join('');
  }
}

// ---- The timeline, in shot seconds (pure data: also the sound cues) -----------------------------------
const ARMY = (REEL.army ?? randomArmy(rand(REEL.seed))).split('');
const PLAN = (() => {
  let t = 0;
  const cuts = CUTS.map(c => { const start = t; t += c.dur; return { c, start, end: t }; });
  const order = [0, 1, 2, 3, 4, 5, 6, 7], k = ARMY.indexOf(REEL.last);
  if (REEL.last && k >= 0) order.push(...order.splice(k, 1));
  const stop = []; order.forEach((f, i) => { stop[f] = REEL.first + i * REEL.step; });
  const reel = t, jack = REEL.first + 7 * REEL.step;   // reel-local
  const hits = [...cuts.flatMap(({ c, start }) => c.hits.map(([s, , kind]) => ({ at: start + s, kind, what: c.piece }))),
    ...stop.map((s, f) => ({ at: reel + s, kind: f === order[7] ? 'jackpot' : 'tick', what: `${'abcdefgh'[f]} ${ARMY[f]}` })),
    ...DROP.waves.map(([ranks, side, s, kind]) => ({ at: reel + jack + s, kind, what: `ranks ${ranks.join('+')}` }))];
  return { cuts, reel, stop, jack, lastFile: order[7], hits };
})();
/** Every sync point [shot s, what]: whips (the cut is the whip's midpoint), hits, reel ticks, drops, crane. */
export const CUES = [
  ...PLAN.cuts.map(({ c, start }) => [start, `whip ${c.whip} → ${c.piece}`]),
  [PLAN.reel, `whip ${REEL.whip} → reel`],
  ...PLAN.hits.map(h => [h.at, `${h.kind} (${h.what})`]),
  [PLAN.reel + PLAN.jack + CRANE.delay, 'crane starts'], [PLAN.reel + PLAN.jack + CRANE.delay + CRANE.dur, 'crane settles: standoff'],
].sort((a, b) => a[0] - b[0]);

const logLerp = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));
function glow(g, x, y, r, color, a) {
  if (r <= 0 || a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}

// ---- Signature effects over the game's own -----------------------------------------------------------
// draw(g, p, k, z, r, o, P): p screen point, k 0..1 through the effect, z screen px per board px (sizes
// below are board px), r seeded random, o options, P(u) the attacker's path in screen px (0 = its square,
// 1 = the victim's). life: game ms (options.life overrides); at: 'body' (the victim's chest) or 'ground' (its feet).
const FX = {
  leap: { life: 729, at: 'ground', draw(g, p, k, z, r, o, P) {  // the Knight's arc through the torchlight (life = its airtime)
    const smooth = u => u * u * (3 - 2 * u), at = u => { const q = P(smooth(u)), lift = ((o.height ?? 0.7) * 4 * u * (1 - u) + 0.45) * TILE * z; return { x: q.x, y: q.y - lift }; };
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt';
    for (let i = 1; i <= 14; i++) {
      const u0 = k - 0.3 * (1 - (i - 1) / 14), u1 = k - 0.3 * (1 - i / 14);
      if (u1 <= 0) continue;
      const a = at(Math.max(0, u0)), b = at(u1), w = i / 14;
      g.strokeStyle = `rgba(255,214,150,${0.5 * w * Math.sin(Math.PI * k)})`; g.lineWidth = (2 + 16 * w) * z;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
  } },
  quake: { life: 620, at: 'ground', draw(g, p, k, z, r) {  // the Rook's ground-pound: a wall of dust and stone chips
    const e = ease.out(k), rad = (8 + 250 * e) * z;
    for (let i = 0; i < 40; i++) {
      const a = r() * 6.283, d = rad * (0.75 + r() * 0.3), s = (5 + r() * 14) * z * (0.35 + e);
      glow(g, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.3 - s * 0.5, s, '160,130,92', 0.7 * (1 - k) * (0.4 + r() * 0.6));
    }
    for (let i = 0; i < 16; i++) {
      const a = r() * 6.283, v = (25 + 70 * r()) * z, up = (40 + 70 * r()) * z, s = (1.2 + 2.2 * r()) * z;
      g.fillStyle = `rgba(${i % 2 ? '92,76,58' : '140,120,92'},${1 - k})`;
      g.fillRect(p.x + Math.cos(a) * v * e - s / 2, p.y + Math.sin(a) * v * e * 0.3 - up * 4 * k * (1 - k) - s / 2, s, s);
    }
    g.globalCompositeOperation = 'lighter'; glow(g, p.x, p.y - 10 * z, 45 * z, '255,214,160', 0.8 * (1 - k) ** 3);
  } },
  slash: { life: 260, at: 'body', draw(g, p, k, z, r, o) {  // the Bishop's blade light along the cut
    const a = o.angle ?? 1.24, len = 320 * z * ease.out(k * 2.2), dx = Math.cos(a), dy = Math.sin(a);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const [w, al] of [[5, 0.15], [1.7, 0.45], [0.55, 1]]) {
      g.strokeStyle = `rgba(245,248,255,${al * (1 - k) ** 1.2})`; g.lineWidth = w * z * (1 - 0.5 * k);
      g.beginPath(); g.moveTo(p.x - dx * len, p.y - dy * len); g.lineTo(p.x + dx * len, p.y + dy * len); g.stroke();
    }
    glow(g, p.x, p.y, 24 * z, '235,240,255', 0.45 * (1 - k) ** 2);
  } },
  gale: { life: 800, at: 'ground', draw(g, p, k, z, r) {  // the Queen's hurricane: a funnel of wind and grit
    g.lineCap = 'round';
    const env = Math.sin(Math.PI * clamp(k * 1.25, 0, 1)), spin = k * 24;
    for (const [color, mode, width, alpha] of [['30,46,52', 'source-over', 2.4, 0.5], ['238,250,246', 'lighter', 1, 0.75]]) {
      g.globalCompositeOperation = mode; const q = rand(5);   // both passes share the arcs
      for (let i = 0; i < 30; i++) {
        const h = i / 29, rx = (16 + 120 * h * h + 14 * q()) * z * (0.75 + 0.5 * k), y = p.y - (4 + 230 * h) * z, start = q() * 6.283 + spin * (1.5 - h * 0.7);
        g.strokeStyle = `rgba(${color},${alpha * (0.35 + 0.65 * q()) * env})`; g.lineWidth = width * (0.5 + q()) * z * (1 - h * 0.4);
        g.beginPath(); g.ellipse(p.x, y, rx, rx * 0.24, 0, start, start + 1 + q() * 1.6); g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 44; i++) {   // grit caught in the wind
      const h = r(), a = r() * 6.283 + spin * (1.6 - h), rx = (20 + 130 * h * h) * z, s = (0.8 + 1.4 * r()) * z;
      g.fillStyle = `rgba(48,42,36,${0.85 * env})`; g.fillRect(p.x + Math.cos(a) * rx, p.y - (8 + 230 * h) * z + Math.sin(a) * rx * 0.24, s, s);
    }
  } },
  // The King's strike, the cause of the freeze: as he leans in (BLOW wind→strike, 560–660 ms), frost runs from
  // his blade tip across the stones into the victim's feet, gaining speed (quadratic: the ramp already slows
  // these 100 ms to 3 frames, and ease.in would leave the head at the blade until the flash), then the rime lingers.
  // from: blade tip in tiles from the victim's feet (the King stops 58 board px to its left); run: game ms to arrive.
  coldsnap: { life: 520, at: 'ground', draw(g, p, k, z, r, o) {
    const L = o.life ?? 520, run = o.run ?? 100, ms = k * L, head = clamp(ms / run, 0, 1) ** 2, fade = (1 - clamp((ms - run) / (L - run), 0, 1)) ** 1.5;
    const x0 = p.x + (o.from ?? -0.5) * TILE * z, n = 12, pts = [];
    for (let i = 0; i <= n; i++) pts.push({ x: lerp(x0, p.x, head * i / n), y: p.y + (i && i < n ? (r() - 0.5) * 7 * z : 0) });
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [w, a] of [[9, 0.14], [3, 0.4], [1, 0.95]]) {
      g.strokeStyle = `rgba(205,238,255,${a * fade})`; g.lineWidth = w * z * 0.5;
      g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.stroke();
    }
    if (ms < run) {   // the running head: a hot point with a short cold flare
      const h = pts[n];
      glow(g, h.x, h.y, 16 * z, '235,250,255', 0.95); flare(g, h.x, h.y, 0.5 + 0.5 * head, { color: '170,220,255', length: 300 });
    }
    glow(g, x0, p.y, 20 * z, '170,220,255', 0.5 * fade);   // where the blade bites the stone
  } },
  freeze: { life: 700, at: 'body', draw(g, p, k, z, r) {  // the Frost King's cold snap: rime racing over the stones
    const ground = { x: p.x, y: p.y + 0.5 * TILE * z }, grow = ease.out(k * 2), fade = 1 - k * k;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 18; i++) {
      const a = r() * 6.283, len = (30 + 60 * r()) * z * grow;
      g.strokeStyle = `rgba(215,240,255,${0.75 * fade})`; g.lineWidth = (0.35 + 0.5 * r()) * z;
      g.beginPath(); g.moveTo(ground.x, ground.y);
      for (let j = 1; j <= 4; j++) { const d = len * j / 4, w = (r() - 0.5) * 8 * z; g.lineTo(ground.x + Math.cos(a) * d - Math.sin(a) * w * 0.3, ground.y + (Math.sin(a) * d + Math.cos(a) * w) * 0.3); }
      g.stroke();
    }
    g.globalCompositeOperation = 'lighter';
    glow(g, ground.x, ground.y, 70 * z * grow, '150,205,255', 0.3 * fade);
    glow(g, p.x, p.y, 60 * z, '160,215,255', 0.35 * Math.max(0, 1 - k * 3) ** 2);
  } },
  shatter: { life: 620, at: 'body', draw(g, p, k, z, r) {  // ice shards
    const e = ease.out(k);
    for (let i = 0; i < 60; i++) {
      const a = r() * 6.283, v = (12 + 80 * r()) * z, s = (0.8 + 3.6 * r()) * z, spin = (r() - 0.5) * 16;
      const x = p.x + Math.cos(a) * v * e, y = p.y + Math.sin(a) * v * e * 0.8 + 40 * z * k * k;
      g.save(); g.translate(x, y); g.rotate(r() * 6.283 + spin * k); g.globalAlpha = (1 - k) ** 1.3;
      g.fillStyle = i % 3 ? '#e4f6ff' : '#9fd4f5'; g.beginPath(); g.moveTo(0, -s * 1.8); g.lineTo(s * 0.7, s); g.lineTo(-s * 0.7, s * 0.6); g.closePath(); g.fill();
      g.restore();
    }
    g.globalCompositeOperation = 'lighter'; glow(g, p.x, p.y, 48 * z, '200,236,255', 0.5 * (1 - k) ** 4);
  } },
};

export async function create(params, { fx: out, dur }) {
  // Full-frame layers: the game's scene (drawn straight through the camera), a blend buffer, the finished
  // segment before the whip, a scratch canvas for the depth of field and one for mirrored (flopped) cuts.
  const stage = canvas(W, H), sg = stage.getContext('2d');
  const acc = canvas(W, H), ag = acc.getContext('2d'), frame = canvas(W, H), frg = frame.getContext('2d');
  const sharp = canvas(W, H), shg = sharp.getContext('2d');
  const scene = createScene({ canvas: stage, pieces: R });
  let bare = false;   // snapshots: wipe the board under the figures
  scene.setDecorate((c, api, layer) => {
    if (layer !== 'under') return;
    c.save();
    if (bare) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); }
    else {  // a dark table and a bronze rim instead of the trial page's cream margin
      c.beginPath(); c.rect(-4000, -4000, 8960, 8960); c.rect(PAD, PAD, 8 * TILE, 8 * TILE); c.fillStyle = TABLE; c.fill('evenodd');
      c.strokeStyle = RIM; c.lineWidth = 5; c.strokeRect(PAD - 2.5, PAD - 2.5, 8 * TILE + 5, 8 * TILE + 5);
      c.strokeStyle = 'rgba(255,214,150,.35)'; c.lineWidth = 1; c.strokeRect(PAD - 5.5, PAD - 5.5, 8 * TILE + 11, 8 * TILE + 11);
    }
    c.restore();
  });
  await scene.load();
  scene.setCoords(false);
  const empty = { board: new Uint8Array(64) };

  /** Draw the game's scene through a camera {x, y, zoom, rot} (board px at screen centre), `ms` into `move`. */
  function shoot(v, pos, move = null, ms = 0) {
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = TABLE; sg.fillRect(0, 0, stage.width, stage.height);
    const c = Math.cos(v.rot ?? 0) * v.zoom, s = Math.sin(v.rot ?? 0) * v.zoom;
    sg.setTransform(c, s, -s, c, stage.width / 2 - (c * v.x - s * v.y), stage.height / 2 - (s * v.x + c * v.y));
    scene.setPosition(pos);
    if (move) scene.play(move);   // the animation starts at the current clock
    flush(performance.now() + Math.max(0, ms));
    sg.setTransform(1, 0, 0, 1, 0, 0);
  }
  const toScreen = (v, p) => {
    const c = Math.cos(v.rot ?? 0) * v.zoom, s = Math.sin(v.rot ?? 0) * v.zoom, dx = p.x - v.x, dy = p.y - v.y;
    return { x: W / 2 + c * dx - s * dy, y: H / 2 + s * dx + c * dy };
  };
  // scene.load() resolves before the board art arrives; wait until a dark square shows stone, not the flat fallback.
  for (let i = 0; i < 400; i++) {
    shoot({ x: PAD + 1.5 * TILE, y: PAD + 0.5 * TILE, zoom: 1 }, empty);
    const [r, g, b] = sg.getImageData(W / 2, H / 2, 1, 1).data;
    if (!(r === 137 && g === 151 && b === 123)) break;
    await new Promise(ok => setTimeout(ok, 25));
  }

  // ---- the cuts: positions, moves, camera targets and speed ramps ----
  const cuts = PLAN.cuts.map(({ c, start, end }) => {
    const pos = createPosition(c.layout), from = R.parseSq(c.from), to = R.parseSq(c.to);
    if (R.typeOf(pos.board[from]) !== TYPES[c.piece]) throw new Error(`montage: no ${c.piece} on ${c.from} in layout '${c.layout}'`);
    const move = actionsFor(pos, from).find(m => m.captures.includes(to) || m.to === to);
    if (!move) throw new Error(`montage: ${c.piece} ${c.from} cannot take ${c.to} in layout '${c.layout}'`);
    for (const [name] of c.fx) if (!FX[name]) throw new Error(`montage: unknown effect '${name}'; FX has ${Object.keys(FX).join(', ')}`);
    for (const [, , kind] of c.hits) if (!IMPACTS[kind]) throw new Error(`montage: unknown hit '${kind}'; IMPACTS has ${Object.keys(IMPACTS).join(', ')}`);
    if (!GRADES[c.grade] || !DIRS[c.whip]) throw new Error(`montage: cut '${c.piece}' needs a GRADES grade and a whip of ${Object.keys(DIRS).join('/')}`);
    const a = scene.foot(from), v = scene.foot(move.captures[0] ?? to), side = Math.sign(a.x - v.x) || (R.colorOf(pos.board[from]) ? 1 : -1);
    const [ax, ay] = c.aim ?? [0, 0];
    // Speed ramp keys [cut s, game ms]: full speed until `lead` before each hit, the hit, a hit-stop, then the hang and the snap back.
    const k = [[0, c.in]];
    for (const [s, ms] of c.hits) {
      const [s0, m0] = k[k.length - 1], rate = (ms - m0) / (s - s0);
      if (s - RAMP.lead > s0 + 0.01) k.push([s - RAMP.lead, ms - RAMP.lead * rate]);
      k.push([s, ms], [s + RAMP.stop[0], ms + RAMP.stop[1]]);
    }
    const [hs, hm] = c.hits[c.hits.length - 1];
    k.push([hs + (c.hang ?? RAMP.hang), hm + (c.crawl ?? RAMP.crawl)], [c.dur, c.out]);
    return { ...c, pos, move, start, end, attacker: a, victim: v, ramp: remap(k),
      shakeAt: R.typeOf(pos.board[from]) === R.L && move.captures.length ? SMASH.chop[1] : null,
      focus: { x: v.x + (side * 0.35 + ax) * TILE, y: v.y + (ay - 0.55) * TILE },       // the strike, framed at centre
      origin: { x: a.x + (ax - side * 0.2) * TILE, y: a.y + (ay - 0.55) * TILE } };    // where a tracking cut starts
  });
  if (!DIRS[REEL.whip]) throw new Error(`montage: REEL.whip must be ${Object.keys(DIRS).join('/')}`);

  // ---- the hit language: one camera for the whole shot, plus flash, fringe and zoom kicks in screen time ----
  const cam = camera({ handheld: HAND.handheld, shake: HAND.shake, shakes: PLAN.hits.map(h => ({ at: h.at, amount: IMPACTS[h.kind].trauma, decay: IMPACTS[h.kind].decay ?? 5.5 })) });
  const since = (t, h) => t - h.at;
  const fringeAt = t => PLAN.hits.reduce((a, h) => a + (since(t, h) >= 0 ? (IMPACTS[h.kind].fringe ?? 0) * Math.exp(-since(t, h) / FRINGE_T) : 0), 0);
  const kickAt = t => PLAN.hits.reduce((a, h) => a + (since(t, h) >= 0 ? (IMPACTS[h.kind].punch ?? 0) * Math.exp(-since(t, h) / PUNCH_T) : 0), 0);
  const flashAt = t => {
    for (const h of PLAN.hits) { const e = IMPACTS[h.kind], s = since(t, h); if (e.flash && s >= 0 && s < FLASH_T) return [e.flash * (1 - s / FLASH_T), e.tint]; }
    return [0];
  };
  const flick = noise(23), flicker = t => 1 + FLICKER.amount * flick(t * FLICKER.rate);
  const burst = (g, e, s, p, ground, seed) => {   // an impact's particles, s game seconds after it
    if (e.shock) shockwave(g, s, { x: ground.x, y: ground.y, ...e.shock });
    if (e.dust) dust(g, s, { x: ground.x, y: ground.y, seed, ...e.dust });
    if (e.sparks) sparks(g, s, { x: p.x, y: p.y, seed: seed + 1, ...e.sparks });
  };

  // ---- snapshots of every figure as the game paints it (board wiped), for the reel and the drop ----
  const army = ARMY;
  if (army.length !== 8 || army.some(l => !LETTER[l])) throw new Error(`montage: REEL.army must be 8 piece letters, got '${REEL.army}'`);
  const faces = [...new Set([...REEL.faces, ...army])];   // everything a reel can show
  const snaps = new Map(), smears = new Map();
  const box = { l: -1.15, r: 1.15, t: -1.6, b: 0.45 };   // around a figure's feet, in tiles
  bare = true;
  for (const [type, side] of [...faces.map(l => [LETTER[l], 0]), ...army.map(l => [LETTER[l], 1]), [R.P, 0], [R.P, 1]]) {
    const key = `${type}:${side}`;
    if (snaps.has(key)) continue;
    const pos = { board: new Uint8Array(64) }, sq = R.parseSq('d4'), f = scene.foot(sq);
    pos.board[sq] = R.piece(type, side);
    const w = Math.ceil((box.r - box.l) * TILE * SNAP), h = Math.ceil((box.b - box.t) * TILE * SNAP);
    shoot({ x: f.x + box.l * TILE + W / 2 / SNAP, y: f.y + box.t * TILE + H / 2 / SNAP, zoom: SNAP }, pos);   // feet land at (ax, ay) × SNAP
    const c = canvas(w, h); c.getContext('2d').drawImage(stage, 0, 0, w, h, 0, 0, w, h);
    snaps.set(key, { img: c, ax: -box.l * TILE, ay: -box.t * TILE, w: w / SNAP, h: h / SNAP });
  }
  bare = false;
  // Spinning reel faces: each figure smeared along the spin, once.
  const smear = REEL.speed * REEL.pitch * TILE * REEL.blur;
  for (const l of faces) {
    const n = snaps.get(`${LETTER[l]}:0`), c = canvas(n.img.width, Math.ceil(n.img.height + smear * SNAP)), g = c.getContext('2d'), taps = 28;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 / taps;
    for (let i = 0; i < taps; i++) g.drawImage(n.img, 0, i / (taps - 1) * smear * SNAP);
    smears.set(l, { img: c, ax: n.ax, ay: n.ay + smear / 2, w: n.w, h: n.h + smear });
  }
  // The empty board as one texture, for the crane's perspective.
  const T0 = -96, TN = 960 + 192;   // texture covers board px T0..T0+TN
  stage.width = stage.height = TN * TEX;
  shoot({ x: T0 + TN / 2, y: T0 + TN / 2, zoom: TEX }, empty);
  const boardTex = canvas(TN * TEX, TN * TEX); boardTex.getContext('2d').drawImage(stage, 0, 0);
  stage.width = W; stage.height = H;
  const flopped = canvas(W, H), fg = flopped.getContext('2d');

  const R1 = PAD + 7.5 * TILE + 40;   // feet on the first rank (board px)
  const fileX = f => PAD + (f + 0.5) * TILE;
  const strips = army.map((l, f) => [l, ...shuffle(faces.filter(x => x !== l), rand(REEL.seed * 31 + f))]);   // lands on index 0
  const drops = [];
  for (const [ranks, side, at, kind] of DROP.waves) {
    if (!IMPACTS[kind]) throw new Error(`montage: unknown drop hit '${kind}'`);
    for (const rank of ranks) army.forEach((l, f) => drops.push({ key: `${rank === 2 || rank === 7 ? R.P : LETTER[l]}:${side}`,
      foot: scene.foot(R.parseSq('abcdefgh'[f] + rank)), f, rank, land: at + DROP.ripple * Math.floor(Math.abs(f - 3.5)) }));
  }

  // ---- shared finishing ----
  /** Depth of field: `src` blurred and dimmed, the sharp copy kept where `mask` (drawn in shg) is opaque. */
  function depth(g, src, mask, strength = 1) {
    g.save(); g.filter = `blur(${FOCUS.blur * strength}px) brightness(${1 - FOCUS.dim * strength}) saturate(${1 - 0.1 * strength})`; g.drawImage(src, 0, 0); g.restore();
    shg.globalCompositeOperation = 'copy'; shg.drawImage(src, 0, 0);
    shg.globalCompositeOperation = 'destination-in'; mask(shg); shg.globalCompositeOperation = 'source-over';
    g.drawImage(sharp, 0, 0);
  }
  /** The grade (motion.mjs), then the torchlight dying into the dark; `lit` flickers the warmth. */
  function tone(g, name, lit = 1) {
    const c = GRADES[name];
    grade(g, { warm: c.warm, cool: c.cool, amount: GRADE_AMOUNT * lit });
    const fall = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.05);
    fall.addColorStop(0, 'rgba(255,255,255,1)'); fall.addColorStop(1, `rgba(${c.shadow},1)`);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = fall; g.fillRect(0, 0, W, H); g.restore();
  }
  // scene.mjs shakes the whole board for 240 ms after the Paladin's hammer (render(): 7 board px); the camera
  // rides along so the camera trauma is the only shake, and trails stay crisp.
  const boardShake = (c, m) => {
    const s = m - c.shakeAt; if (c.shakeAt == null || !(s >= 0 && s < 240)) return [0, 0];
    const a = 7 * (1 - s / 240); return [Math.sin(s * 0.09) * a, Math.cos(s * 0.13) * a * 0.6];
  };

  // ---- one cut, lt seconds into it, camera shifted by `off` (board px), at shot time t ----
  function drawCut(c, lt, off, g, t) {
    lt = clamp(lt, 0, c.dur);
    const ms = c.ramp(lt), rate = Math.max(0, (c.ramp(lt + 0.002) - c.ramp(lt - 0.002)) / 0.004);   // game ms per screen second
    const hand = cam.state(t), zoom = c.zoom * (1 + PUSH * lt / c.dur) * (1 + kickAt(t));
    const camAt = m => {   // the camera at game time m, following the attacker when the cut tracks
      const follow = c.track ? easeInOut((m - c.track[0]) / (c.track[1] - c.track[0])) : 1, [bx, by] = boardShake(c, m);
      return { x: lerp(c.origin.x, c.focus.x, follow) + off.x + (hand.x - W / 2) / zoom + bx,
        y: lerp(c.origin.y, c.focus.y, follow) + off.y + (hand.y - H / 2) / zoom + by, zoom, rot: hand.rot };
    };
    // Motion trails: renders spread back over the shutter, in the game's own time, weighted towards the
    // newest (TRAIL_TAPER) so a fast figure keeps a solid leading edge. Sample i ends with weight w_i / Σw.
    const open = Math.min(rate * SHUTTER, TRAIL_MAX), trails = c.trails ?? TRAILS;
    for (let i = 0, sum = 0; i < trails; i++) {
      const m = ms - (trails > 1 ? i / (trails - 1) : 0) * open, w = 1 - TRAIL_TAPER * i / trails;
      shoot(camAt(m), c.pos, c.move, m);
      sum += w; ag.globalAlpha = w / sum; ag.drawImage(stage, 0, 0);
    }
    ag.globalAlpha = 1;
    const view = camAt(ms), r0 = FOCUS.inner * TILE * zoom, r1 = FOCUS.outer * TILE * zoom;
    depth(g, acc, m => { const gr = m.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = gr; m.fillRect(0, 0, W, H); });
    tone(g, c.grade);
    if (c.light) {   // a torch the action passes through, flickering
      const p = toScreen(view, { x: c.focus.x + c.light[0] * TILE, y: c.focus.y + c.light[1] * TILE }), f = flicker(t);
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, p.x, p.y, 175 * zoom, TORCH[0], 0.5 * f); glow(g, p.x, p.y, 45 * zoom, TORCH[1], 0.55 * f);
      g.restore();
      flare(g, p.x, p.y, 0.45 * f, { color: TORCH[0], length: 760 });
    }
    const spot = (at, o = {}) => toScreen(view, { x: c.victim.x + (o.dx ?? 0) * TILE, y: c.victim.y + ((o.dy ?? 0) - (at === 'body' ? 0.5 : 0)) * TILE });
    c.fx.forEach(([name, at, o = {}], i) => {
      const e = FX[name], q = (ms - at) / (o.life ?? e.life);
      if (q < 0 || q >= 1) return;
      const path = u => toScreen(view, { x: lerp(c.attacker.x, c.victim.x, u), y: lerp(c.attacker.y, c.victim.y, u) });
      g.save(); e.draw(g, spot(e.at, o), q, zoom * (o.size ?? 1), rand(97 + i * 13), o, path); g.restore();
    });
    c.hits.forEach(([hitS, hitMs, kind], i) => {   // game time, plus a creep so the hang still drifts
      const e = IMPACTS[kind], s = (ms - hitMs) / 1000 + CREEP * (lt - hitS) + POP[0] * (1 - Math.exp(-(lt - hitS) / POP[1]));
      if (lt < hitS) return;
      const p = spot(e.at, e);
      burst(g, e, s, p, spot('ground', { dx: e.dx }), 300 + 17 * i + 5 * cuts.indexOf(c));
      if (e.lines && lt - hitS < e.lines[0]) speedLines(g, p.x, p.y, e.lines[1] * (1 - (lt - hitS) / e.lines[0]), { seed: 9 + i, inner: 1.4 * TILE * zoom });
    });
    particles(g, t, { n: 70, seed: 40 + cuts.indexOf(c), rise: 14, color: GRADES[c.grade].motes, bokeh: 16 });
  }

  // ---- the reel, the crane, the drop and the standoff, `rt` seconds after the reel's whip-in ----
  const spinAt = (f, rt) => {   // reel position in figures (0 = landed on its army piece) and speed
    const stop = PLAN.stop[f], [bt, bk] = f === PLAN.lastFile ? REEL.tease : REEL.brake, v0 = REEL.speed, v1 = v0 * bk;
    const a = (v0 - v1) / bt, D = (v0 + v1) / 2 * bt;   // brake: steady deceleration to v1, landing exactly at the stop
    if (rt < stop - bt) return { p: -D - v0 * (stop - bt - rt), v: v0 };
    if (rt < stop) { const s = rt - (stop - bt); return { p: -D + v0 * s - a * s * s / 2, v: v0 - a * s }; }
    const s = rt - stop, [w, d] = REEL.bounce, e = Math.exp(-d * s);
    return { p: v1 / w * e * Math.sin(w * s), v: v1 * e * (Math.cos(w * s) - d / w * Math.sin(w * s)) };
  };
  // A pinhole camera over the board: look-at (x, y), zoom there, pitch (radians, π/2 = straight down).
  // Straight down it matches the game's view exactly; figures stay upright billboards at every pitch.
  const project = v => {
    const s = Math.sin(v.pitch), c = Math.cos(v.pitch), f = v.zoom * CRANE.dist;
    return (x, y, z = 0) => { const k = f / (CRANE.dist - (y - v.y) * c - z * s); return { x: W / 2 + (x - v.x) * k, y: H / 2 + ((y - v.y) * s - z * c) * k, k }; };
  };
  function drawBoard(g, v, P) {
    const o = P(T0, T0);
    if (v.pitch > Math.PI / 2 - 1e-4) { g.drawImage(boardTex, o.x, o.y, TN * o.k, TN * o.k); return; }
    const n = 14, lo = PAD - 12, st = (8 * TILE + 24) / n, s = x => (x - T0) * TEX, cell = [0, 0, boardTex.width, boardTex.height];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x0 = lo + i * st, y0 = lo + j * st, x1 = x0 + st, y1 = y0 + st;
      const d = [P(x0, y0), P(x1, y0), P(x0, y1), P(x1, y1)], q = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => ({ x: s(x), y: s(y) }));
      paintTriangle(g, boardTex, [q[0], q[1], q[2]], [d[0], d[1], d[2]], cell);
      paintTriangle(g, boardTex, [q[1], q[3], q[2]], [d[1], d[3], d[2]], cell);
    }
  }
  function figure(g, n, p, alpha = 1, sy = 1) {   // snapshot n with its feet at projected point p, y-scaled by sy
    if (alpha <= 0) return;
    g.globalAlpha = alpha; g.drawImage(n.img, p.x - n.ax * p.k, p.y - n.ay * p.k * sy, n.w * p.k, n.h * p.k * sy); g.globalAlpha = 1;
  }
  const breath = (t, f, rank, amount) => 1 + STANDOFF.breathe[0] * amount * Math.sin(t * STANDOFF.breathe[1] + f * 1.7 + rank * 2.3);
  function drawReel(rt, off, g, t) {
    const sj = rt - PLAN.jack;   // seconds since the jackpot
    const opened = ease.smooth(clamp((sj - REEL.open[0]) / REEL.open[1], 0, 1)), crane = ease.smooth(clamp((sj - CRANE.delay) / CRANE.dur, 0, 1));
    const held = Math.max(0, sj - CRANE.delay - CRANE.dur), push = STANDOFF.push * (held - 0.3 * (1 - Math.exp(-held / 0.3)));   // eases into a steady push
    const hand = cam.state(t), zoom = logLerp(REEL.at.zoom, CRANE.at.zoom, crane) * (1 + push) * (1 + kickAt(t));
    const view = { x: lerp(REEL.at.x, CRANE.at.x, crane) + off.x, y: lerp(REEL.at.y, CRANE.at.y, crane) + off.y, zoom, pitch: lerp(90, CRANE.at.pitch, crane) * Math.PI / 180 };
    const P = project(view), lit = flicker(t);
    ag.setTransform(1, 0, 0, 1, 0, 0); ag.fillStyle = TABLE; ag.fillRect(0, 0, W, H);
    ag.save(); ag.translate(hand.x, hand.y); ag.rotate(hand.rot); ag.translate(-W / 2, -H / 2);   // handheld and trauma
    drawBoard(ag, view, P);
    ag.save(); ag.globalCompositeOperation = 'lighter';   // pools of torchlight on the table
    STANDOFF.torches.forEach(([x, y], i) => { const c = P(x, y); glow(ag, c.x, c.y, STANDOFF.pool[0] * c.k, TORCH[0], STANDOFF.pool[1] * flicker(t + 17 * i)); });
    ag.restore();
    // The reels (straight down), until they melt into the board.
    const pitch = REEL.pitch * TILE, gap = 5, bits = [];
    if (opened < 1) for (let f = 0; f < 8; f++) {
      const a = P(PAD + f * TILE + gap, R1 - REEL.window[0] * TILE), b = P(PAD + (f + 1) * TILE - gap, R1 + REEL.window[1] * TILE);
      const { p, v } = spinAt(f, rt), stopped = rt - PLAN.stop[f], fade = 1 - opened, jack = f === PLAN.lastFile;
      ag.save(); ag.beginPath(); ag.rect(a.x, a.y, b.x - a.x, b.y - a.y); ag.clip();
      const drum = ag.createLinearGradient(0, a.y, 0, b.y);
      drum.addColorStop(0, REEL.drum[0]); drum.addColorStop(0.45, REEL.drum[1]); drum.addColorStop(0.8, REEL.drum[2]); drum.addColorStop(1, REEL.drum[0]);
      ag.globalAlpha = fade; ag.fillStyle = drum; ag.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); ag.globalAlpha = 1;
      const blurred = clamp(Math.abs(v) / REEL.speed * 1.4 - 0.2, 0, 1);
      for (let j = Math.floor(p) - 1; j <= Math.floor(p) + 2; j++) {
        const n = strips[f].length, l = strips[f][((j % n) + n) % n], at = P(fileX(f), R1 + (p - j) * pitch);
        const alpha = stopped >= 0 ? (j === 0 ? 1 : fade * (1 - 0.7 * clamp(stopped / 0.3, 0, 1))) : fade;   // neighbours dim once it lands
        figure(ag, snaps.get(`${LETTER[l]}:0`), at, alpha * (1 - blurred));
        figure(ag, smears.get(l), at, alpha * blurred);
      }
      const shade = ag.createLinearGradient(0, a.y, 0, b.y);   // the drum curves away at top and bottom
      shade.addColorStop(0, 'rgba(0,0,0,.85)'); shade.addColorStop(0.25, 'rgba(0,0,0,0)'); shade.addColorStop(0.85, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.7)');
      ag.globalAlpha = fade; ag.fillStyle = shade; ag.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      const glass = ag.createLinearGradient(0, a.y, 0, b.y);   // a sheen on the glass
      glass.addColorStop(0.06, 'rgba(255,236,200,0)'); glass.addColorStop(0.18, 'rgba(255,236,200,.09)'); glass.addColorStop(0.34, 'rgba(255,236,200,0)');
      ag.globalCompositeOperation = 'lighter'; ag.fillStyle = glass; ag.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      if (stopped >= 0) {   // the stop lights its window: the glass flashes, the landed figure glows white-hot and cools
        const [ga, gt] = REEL.glass, hot = (jack ? 1.6 : 1) * ga * Math.max(0, 1 - stopped / (jack ? 1.6 * gt : gt)) ** 2;
        if (hot > 0) {
          ag.globalCompositeOperation = 'lighter'; ag.globalAlpha = 1;
          ag.fillStyle = `rgba(255,214,150,${0.35 * clamp(hot, 0, 1) * fade})`; ag.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
          figure(ag, snaps.get(`${LETTER[army[f]]}:0`), P(fileX(f), R1 + p * pitch), clamp(hot, 0, 1));
        }
        const c = P(fileX(f), R1 - 0.6 * TILE), life = jack ? 0.7 : 0.35;
        if (stopped < life) glow(ag, c.x, c.y, (jack ? 1.8 : 1.2) * TILE * c.k, REEL.gold, (jack ? 0.8 : 0.55) * (1 - stopped / life) ** 2);
        bits.push({ f, stopped, jack, x: (a.x + b.x) / 2, top: a.y, bottom: b.y, w: b.x - a.x });
      }
      ag.restore();
      const edge = stopped >= 0 ? Math.max(0, 1 - stopped / 0.1) : 0;   // the trim flares as the reel locks
      ag.save(); ag.globalAlpha = fade; ag.strokeStyle = `rgba(${edge > 0 ? '255,240,200' : REEL.gold},${0.9 + 0.1 * edge})`; ag.lineWidth = (1.6 + 2.4 * edge) * a.k; ag.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); ag.restore();
      if (f === 0) {   // the bezel across all reels
        const l = P(PAD - 4, R1 - REEL.window[0] * TILE - 6), r = P(PAD + 8 * TILE + 4, R1 + REEL.window[1] * TILE + 3);
        ag.save(); ag.globalAlpha = fade; ag.fillStyle = `rgba(${REEL.gold},.9)`; ag.fillRect(l.x, l.y, r.x - l.x, 3 * l.k); ag.fillRect(l.x, r.y, r.x - l.x, 3 * l.k); ag.restore();
      }
    }
    // Standing figures, far to near (breathing once they stand); then whatever is still falling.
    const alive = clamp((sj - REEL.open[0] - REEL.open[1]) / 0.5, 0, 1);
    const standing = opened >= 1 ? army.map((l, f) => ({ n: snaps.get(`${LETTER[l]}:0`), x: fileX(f), y: R1, s: Infinity, f, rank: 1 })) : [], falling = [];
    for (const d of drops) {
      const s = sj - d.land;
      if (s >= -DROP.fall) (s < 0 ? falling : standing).push({ n: snaps.get(d.key), x: d.foot.x, y: d.foot.y, s, f: d.f, rank: d.rank });
    }
    standing.sort((a, b) => a.y - b.y);
    for (const u of standing) {
      const p = P(u.x, u.y), squash = u.s < 0.3 ? 1 - 0.16 * Math.exp(-u.s / 0.05) * Math.cos(u.s * 45) : 1;   // squash on landing
      figure(ag, u.n, p, 1, squash * breath(t, u.f, u.rank, u.s === Infinity ? alive : clamp((u.s - 0.25) / 0.5, 0, 1)));
      if (u.s < 0.45) {   // a ring of dust, and puffs
        const k = u.s / 0.45, r = (18 + 50 * ease.out(k)) * p.k;
        ag.save(); ag.globalAlpha = 0.45 * (1 - k); ag.strokeStyle = DROP.dust; ag.lineWidth = (2.5 * (1 - k) + 0.5) * p.k;
        ag.beginPath(); ag.ellipse(p.x, p.y, r, r * 0.32 * Math.sin(view.pitch), 0, 0, 6.283); ag.stroke(); ag.restore();
      }
      if (u.s < 1) dust(ag, u.s, { x: p.x, y: p.y, seed: 500 + u.f * 8 + u.rank, ...DROP.puff, size: DROP.puff.size.map(v => v * p.k), speed: DROP.puff.speed.map(v => v * p.k) });
    }
    falling.sort((a, b) => a.y - b.y);
    for (const u of falling) {
      const q = 1 + u.s / DROP.fall, g0 = P(u.x, u.y), r = 26 * g0.k * (0.4 + 0.6 * q);
      ag.save(); ag.globalAlpha = 0.35 * q * q; ag.fillStyle = '#000'; ag.beginPath(); ag.ellipse(g0.x, g0.y, r, r * 0.3 * Math.sin(view.pitch), 0, 0, 6.283); ag.fill(); ag.restore();
      figure(ag, u.n, P(u.x, u.y, DROP.height * (1 - q * q)), clamp(q * 4, 0, 1));
    }
    // Each stop spits sparks off its window; the jackpot bursts, flares and rings across the bezel.
    for (const b of bits) {
      if (b.jack) {
        const J = REEL.jackpot, fade = 1 - opened;
        sparks(ag, b.stopped, { x: b.x, y: b.bottom, seed: 71, ...J });
        sparks(ag, b.stopped, { x: b.x, y: b.top, seed: 73, ...J, n: J.n / 2 });
        shockwave(ag, b.stopped, { x: b.x, y: (b.top + b.bottom) / 2, radius: J.shock, dur: 0.5, squash: 0.2, color: '255,226,160', width: 10 });
        flare(ag, b.x, (b.top + b.bottom) / 2, Math.max(0, 1 - b.stopped / 0.45) * fade, { color: '255,214,150', length: J.flare });
      } else sparks(ag, b.stopped, { x: b.x, y: b.bottom, seed: 60 + b.f, ...REEL.tick });
    }
    ag.restore();
    // Tilt-shift focus: sharp across the reels, then across the middle of the board.
    const yb = P(480, lerp(R1 - 0.7 * TILE, 520, crane)).y, band = lerp(1, 0.6, crane);
    depth(g, acc, m => { const gr = m.createLinearGradient(0, yb - 720, 0, yb + 720); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, '#000'); gr.addColorStop(0.7, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = gr; m.fillRect(0, 0, W, H); }, band);
    tone(g, REEL.grade, 0.92 + 0.08 * lit);
    embers(g, t, STANDOFF.embers);
  }

  // ---- the timeline: cuts, then the reel; whip pans across every boundary ----
  const enter = params.whipIn ?? CUTS[0].whip;   // the Guard's whip carries on into the first cut
  if (!DIRS[enter]) throw new Error(`montage: params.whipIn must be ${Object.keys(DIRS).join('/')}`);
  const segments = [...cuts.map((c, i) => ({ start: c.start, end: c.end, whip: i ? c.whip : enter, flop: !!c.flop, zoom: c.zoom, draw: (t, off, g) => drawCut(c, t - c.start, off, g, t) })),
    { start: PLAN.reel, end: Math.max(dur, PLAN.reel + 0.1), whip: REEL.whip, flop: false, zoom: REEL.at.zoom, draw: (t, off, g) => drawReel(t - PLAN.reel, off, g, t) }];
  const half = WHIP.dur / 2, travel = WHIP.travel * TILE;
  return t => {
    let i = segments.findIndex(s => t < s.end);
    if (i < 0) i = segments.length - 1;
    const s = segments[i];
    // Whip: the camera accelerates out of a cut and decelerates into the next, the way the next cut's action moves.
    let dir = null, k = 0, sign = 1;
    if (segments[i + 1] && t > s.end - half) { dir = DIRS[segments[i + 1].whip]; k = (t - (s.end - half)) / half; }
    else if (s.whip && t < s.start + half) { dir = DIRS[s.whip]; k = 1 - (t - s.start) / half; sign = -1; }
    const off = dir ? { x: sign * dir[0] * travel * k * k * (s.flop ? -1 : 1), y: sign * dir[1] * travel * k * k } : { x: 0, y: 0 };
    frg.setTransform(1, 0, 0, 1, 0, 0); frg.clearRect(0, 0, W, H);
    s.draw(t, off, frg);
    let src = frame;
    if (s.flop) { fg.setTransform(-1, 0, 0, 1, W, 0); fg.globalCompositeOperation = 'copy'; fg.drawImage(frame, 0, 0); src = flopped; }
    out.save(); out.globalCompositeOperation = 'copy'; out.drawImage(src, 0, 0); out.restore();
    if (dir) {   // smeared along the pan
      const len = 2 * travel * k / half * WHIP.shutter * s.zoom, taps = Math.min(24, Math.ceil(len / 14));
      for (let j = 1; j <= taps; j++) { const q = j / taps - 0.5; out.globalAlpha = 1 / (j + 1); out.drawImage(src, -dir[0] * len * q, -dir[1] * len * q); }
      out.globalAlpha = 1;
      out.save(); out.globalCompositeOperation = 'lighter'; out.fillStyle = `rgba(${WHIP.tint},${WHIP.flash * k * k})`; out.fillRect(0, 0, W, H); out.restore();
    }
    bloom(out, BLOOM);
    aberration(out, fringeAt(t));
    const [fk, tint] = flashAt(t);
    flash(out, fk, tint);
    finish(out, t);
  };
}
