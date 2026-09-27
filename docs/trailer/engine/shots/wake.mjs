// Act I, "The board wakes" (docs/trailer/PLAN.md, script rows 1–3). 9 s, no text.
//   0–1.5 s   Black. A drop of light ignites, hangs, then plunges into the board (ease.in). The stone under it
//             brightens and its reflection rises to meet it.
//   1.5 s     The drop lands (a hit): its flash lights the room for an instant (both armies glimpsed in silhouette,
//             long shadows), a brief colour fringe, a shockwave skims the stone, the camera kicks. Then dark again.
//   1.5–6 s   Torchlight ripples out over the carved tiles and two armies in silhouette. The camera cranes in
//             through dust and haze at different depths. The torch pool breathes and wanders. Glints flare on the beat.
//   6–9 s     The first clash: a Pawn's lance thrust (the game's own animation) on a speed ramp. Real time, then a
//             slow glide, then a near-frozen hang in which the world drains and holds its breath; the jab snaps in.
//             Contact lands on 8.5 with the impact stack. Hit-stop: two impact frames turn the duel into graphic
//             silhouettes (light on black, then ink on paper), then black until 9, where the eye's afterimage of the
//             last frame fades (CUT). Ready for the boom.
// Board space is the game scene's 960-unit space (a tile is 112 units); cameras map it to the frame.
import { W, H, flush, clamp, lerp, easeInOut, load, canvas, rand, finish } from '../runtime.mjs';
import { ease, bezier, keys, remap, ring, noise, camera, sparks, shockwave, bloom, aberration, flare, flash, drain, speedLines } from '../motion.mjs';
import { FPS } from '../timeline.mjs';
import * as R from '../../../2d-first-pieces/board/rules.mjs';
import { actionsFor } from '../../../2d-first-pieces/board/model.mjs';
import { createScene, PAD, TILE } from '../../../2d-first-pieces/board/scene.mjs';
import { tipAt, thrustAt, THRUST, MIN_ANGLE, MAX_ANGLE } from '../../../2d-first-pieces/lance/aiming.mjs';
import * as knight from '../../../2d-first-pieces/knight/motion.mjs';

// ---- Timing (shot seconds). Hits sit on the 120 BPM grid: 0.5 s beats, 0.25 s half-beats. ----
const DROP_T = [0.5, 1.5];      // the drop ignites (a beat), then lands (a beat)
const CLASH = 6;                // hard cut to the Pawn close-up
const CONTACT = CLASH + 2.5;    // the lance lands: the impact stack
const EARLY = 0.5 / FPS;        // hit envelopes open half a frame early, so a motion-blurred hit frame gets all of it
// The cut, so it reads as meant: after the contact frame, a hit-stop of impact frames, each [ground, figures] (the
// duel as flat silhouettes, the shake still running); then black (until the boom), in which the eye's afterimage of
// the last frame fades: a cool ghost of the duel and a burn where the lance struck. lines: speed lines on frame 1;
// core: the red-hot contact on the paper frame.
const CUT = {
  frames: [['#000', '#fff4e2'], ['#efe2cb', '#140b07']],
  lines: { n: 150, inner: 70, color: '255,232,200' },
  core: { colour: '205,38,20', radius: 230 },
  ghost: { colour: '150,212,255', alpha: 0.26, blur: 12, decay: 0.12 },
  burn: { gain: 0.9, size: 1.2, decay: 0.22, streak: 0.09 },
};
const BLACK = CONTACT - EARLY + (1 + CUT.frames.length) / FPS;

// ---- The drop ----
// height: start height (board units); trail: streak length (s of fall); reflect: reflection depth (× height);
// bead: glint size as it ignites, then in flight; reflection: glint strength and size.
const FALL = { height: 270, trail: 0.045, reflect: 0.28, bead: [0.8, 0.5], reflection: [0.8, 0.32] };
// Its light on the stone, as from a point light at height h: a spot of radius r0 + spread·h with a peak of
// gain / (1 + (h / h0)²). It is dim and wide while the drop is high, then hot and tight as it lands.
const APPROACH = { gain: 1.3, h0: 60, r0: 24, spread: 0.6 };
// The landing: one frame of flash, a brief colour fringe, a squashed shockwave on the stone, a small camera kick,
// and its light: a hot pool on the stone, a flash that lights the whole room for three frames, a white-hot core and
// a wide anamorphic flare.
const LAND = {
  flash: 0.1, fringe: [5, 0.05],                                   // flash alpha; aberration px and its decay (s)
  trauma: 0.42, kick: { zoom: 0.035, y: 7, freq: 4.5, decay: 7 },  // camera shake; a punch in and down that rings out
  // smear: the ring is drawn over this many seconds behind t (6 samples), so its first fast frames read as one
  // smeared ring under --blur 4 instead of stepped copies. 0.5 / FPS / 3 is the gap between --blur 4 samples.
  wave: { radius: 320, dur: 0.34, squash: 0.55, width: 8, color: '255,226,176', smear: 0.5 / FPS / 3 },
  pool: [1.5, 0.25, 150],        // light on the stone: strength, decay (s), radius (board units)
  reveal: [0.95, 0.07, 560],     // the flash lights the whole room for an instant (strength, decay s, radius): the armies are glimpsed, then gone
  core: [1.7, 0.2, 1.8],         // glint: strength, decay (s), size
  flare: [0.9, 0.15, 950],       // flare: strength, decay (s), streak half-length (px)
};

// ---- Cameras (motion.mjs camera): keys [t, x, y, zoom, rotation°, curve into this key] in board units ----
// The crane is almost still while the drop falls. After the landing it cranes in, up and across, so the depth
// layers slide apart, and it still moves at the cut.
const CRANE = [[0, 450, 512, 1.1, -1.4], [DROP_T[1], 450, 509, 1.12, -1.5, ease.smooth], [CLASH, 502, 486, 1.95, 0.3, bezier(0.45, 0, 0.75, 0.88)]];
const SWAY = 0.45;              // handheld sway
// Parallax: the camera depth of each layer (1 = the board; less than 1 is nearer the lens and slides more).
// Dust at height z floats at depth 1 − z / DEPTH.lens.
const DEPTH = { haze: 0.5, motes: [0.3, 0.62], lens: 480 };
// Foreground haze: strength, texture scale (x, y: stretched into wisps), drift (board units/s). Out-of-focus motes:
// count, radius (px), brightness (crane, close-up), wander (board units), clear (the middle share of the frame's
// width kept free of motes at their reference moment, so they frame the subject instead of sitting on it).
const FG = { haze: 0.3, grain: [2.1, 0.56], drift: [-11, 4], motes: 30, size: [10, 40], glow: [0.85, 0.32], wander: [20, 12], clear: 0.45 };
// The close-up is placed relative to the victim's feet, so it follows the duel if STEPS change.
// It pushes in with the lunge and settles as the Pawn plants; in the hang it eases back a touch (the camera's
// wind-up); then it whips in with the jab and hits. WHIP: an ease-in quad, so the push shows on the three frames
// before contact (the house ease.in is so steep over 0.12 s that the whole push lands on the hit frame).
const WHIP = bezier(0.55, 0.085, 0.68, 0.53);
const CLOSE = [[CLASH, -64, 6, 2.8, 0.9], [CLASH + 1.8, -32, -32, 3.45, 0.2, bezier(0.3, 0.25, 0.55, 1)],
  [CLASH + 2.38, -35, -30, 3.38, 0.35, ease.smooth], [CONTACT, -24, -42, 3.9, 0, WHIP]];
// Speed ramp (motion.mjs remap), [shot s, game ms]. The game plays: lance up 0–280, lunge 280–550, wind-up 550–726,
// jab 726–910 (contact). The aim and the dart of the lunge run in real time; at the lunge's fastest point time melts
// into a slow glide (about 0.07×) that stays visible until the Pawn plants (CLASH + 1.8); the game's tiny wind-up (3 px)
// creeps in the near-frozen hang; the jab snaps in faster than real time. Contact fires while the jab still travels
// (872 ms; the game's jab slows to a stop at 910), so the hit lands at speed.
const RAMP = [[CLASH, 60], [CLASH + 0.25, 290], [CLASH + 0.38, 400], [CLASH + 0.6, 432], [CLASH + 1.8, 550], [CLASH + 2.38, 727], [CONTACT, 872], [CONTACT + 0.5, 1372]];
// Motion echoes of the duellists, [shot s ago, alpha]: long while time runs, gone as it melts into slow motion.
const ECHO = [[0.1, 0.18], [0.05, 0.34]];
// In the hang the world holds its breath: the surroundings drain (motion.mjs drain) while the duel keeps its colour.
// Keys [t, amount]; the colour snaps back on contact.
const DRAIN = { keys: [[CLASH + 1.5, 0], [CLASH + 2.15, 0.6], [CONTACT - 0.02, 0.6]], dim: 0.4 };
const TIP_GLINTS = { at: [CLASH + 0.25, CLASH + 2.25], gain: 0.75 };  // the Pawn's lance tip catches the light: aimed, then cocked at the peak
// The contact: two frames of flash, a colour fringe, sparks along the thrust, an anamorphic flare, a kick and a shake.
const IMPACT = {
  flash: [0.25], fringe: [10, 0.06], core: [2.2, 1.5, 0.08],  // core: white-hot glint strength, size, decay (s)
  trauma: 0.85, shake: 9, kick: { zoom: 0.05, y: 0, freq: 5, decay: 9 },
  sparks: { n: 60, speed: [1100, 2800], spread: 2.3, gravity: 900, life: [0.15, 0.45], width: [1.5, 3.6], color: '255,206,140' },
  back: { n: 14, spread: 1.2, speed: [260, 700], life: [0.12, 0.3] },  // sparks thrown back toward the Pawn
  // flare: strength, decay (s), streak half-length (px). The burst is the flash: on the hit frame its core is ~250 px
  // of white-hot light around the contact (the flat flash veil above stays light, so the frame keeps its contrast).
  flare: [4.5, 0.035, 900],
};

// ---- The board ----
const DROP = { x: 480, y: 480 };  // where the drop lands (the board's heart); the centre of the ripples
// Standoff: [square, piece letter, side]. Ivory (0) faces right, Charcoal (1) faces left.
const ARMY = [
  ['c3', 'P', 0], ['c4', 'P', 0], ['c5', 'P', 0], ['b3', 'O', 0], ['b4', 'L', 0], ['b5', 'N', 0], ['a3', 'B', 0], ['a4', 'K', 0], ['a5', 'Q', 0],
  ['f3', 'P', 1], ['f4', 'P', 1], ['f5', 'N', 1], ['g3', 'G', 1], ['g4', 'S', 1], ['g5', 'O', 1], ['h3', 'M', 1], ['h4', 'K', 1], ['h5', 'R', 1],
];
// The clash: the Ivory pawn and the Charcoal Knight step into no-man's land; the pawn takes the Knight.
// (A pawn victim would not do: the game places the attacker so the victim's own lance meets his helmet.)
const STEPS = [['c4', 'd4'], ['f5', 'e5']];  // [from, to] for the attacker, then the victim (a Knight: see VICTIM)

// ---- Light ----
const TORCH = [255, 178, 104], CREST = [255, 212, 150], AMBIENT = [16, 24, 44];
const BOARD_GRADE = 'brightness(.86) saturate(.8)';
const POOL = { radius: 275, edge: 0.07, peak: 0.97 };            // steady torchlight, falling off from its centre
const BREATH = { period: 2, radius: 0.07, gain: 0.06 };          // the pool swells and settles once a bar
const DRIFT = { units: 90, rate: 0.21, seed: 5, from: 1.2, ramp: 2.5 };  // the pool's centre wanders: reach (board units), noise rate, seed, start (s after the landing), fade-in (s)
// Light front radius = speed·s + burst·(1 − e^(−3s)). Rings ride the same path: [delay s, strength].
// Each ring has a sharp leading edge (width) and a warm wake behind it (tail).
// spill: faint light running ahead of the front, so it reads as a wave rather than the edge of a mask.
const RIPPLE = { speed: 120, burst: 80, soft: 200, width: 7, tail: 70, fade: 2.6, spill: [0.09, 150], rings: [[0, 1.5], [0.5, 0.6], [1.0, 0.3]] };
const HOT = [255, 196, 120];      // colour the crest adds to the stone it crosses
const RING_GLOW = 0.07;            // soft light hanging over each ring (not tied to the stone texture)
const HAZE = 0.13;                // drifting smoke in the light, on the stone
const LIGHT_HEIGHT = 250;         // shadows lengthen with distance from the light
// Glow on the highlights (motion.mjs bloom). Off: its soft threshold also blooms the lit stone and lifts the silhouettes.
const BLOOM = { strength: 0, threshold: 0.95, radius: 6 };

// ---- Silhouettes and glints ----
const RIM = { px: 2.4, gain: 1.1, glow: 0.45, crest: 2.2 };   // warm rim toward the light
const MOON = { px: 1.6, gain: 0.33, colour: '150,180,255' };   // cool rim from above
const DETAIL = [0.06, 0.07, 0.1];                             // how much painted detail survives in the dark (rgb)
const BREATHE = 0.006;                                        // the waiting figures breathe
const WARM = '255,214,150', ICE = '160,220,255', AMBER = '255,176,70', CYAN = '120,255,235';
// A glint is a small flare event: it ignites in two frames, a short anamorphic streak (motion.mjs flare) shoots out
// and falls back to a stub, and an ember keeps twinkling. flare: its strength per unit of glint size.
const SPARK = { rise: 0.06, peak: 1.4, decay: 0.26, ember: 0.4, twinkle: 0.08, streak: [0.09, 0.28], rest: 0.22, length: 130, flare: 0.4 };
// [ignite time, square, point, colour, size]. point: 'lance' (a Pawn's lance tip, from the game's geometry)
// or [dx, dy] in board units from the figure's feet, measured on the painted figures.
const TEETH = [[-42, -83], [-37.5, -84.5], [-33, -87.5], [-28.5, -88.5], [-24, -88], [-20, -87]];
const GLINTS = [
  [3.0, 'c4', 'lance', WARM, 1.2],                                                        // a spear tip
  [3.5, 'g3', [-0.3, -81.7], ICE, 0.6], [3.5, 'g3', [5.5, -81.7], ICE, 0.6],              // a visor slit
  ...TEETH.map((p, i) => [4.0 + i * 0.045, 'g4', p, WARM, 0.42]),                         // light runs along a row of teeth
  // The lines answer on sixteenths (0.125 s) and end on the King's crown.
  [4.75, 'c5', 'lance', WARM, 0.75], [4.875, 'f4', 'lance', WARM, 0.75], [5.0, 'c3', 'lance', WARM, 0.75], [5.125, 'f3', 'lance', WARM, 0.75],
  [5.25, 'b5', [-25, -118], WARM, 0.6], [5.25, 'f5', [22, -118], WARM, 0.6],
  [5.375, 'h5', [-21, -98], AMBER, 0.4], [5.375, 'h5', [-10, -100], AMBER, 0.4], [5.375, 'h3', [-24, -71], CYAN, 0.45],
  [5.5, 'a4', [9, -116], ICE, 0.7],
  [5.75, 'c4', 'lance', WARM, 0.9],  // the King's glint is answered by the attacker's tip: the eye is on him at the cut
];
const SPOT = { x: -36, y: 6, inner: 90, outer: 430, dark: [70, 72, 96] };  // close-up light pool, from the victim's feet
const PLATE_RIM = 0.5;  // rim light of the out-of-focus armies in the close-up (blurred thin rims read as scribbles)

const DEBUG = new URLSearchParams(location.search).has('debug');
const ART = '../../../2d-first-pieces/';
const REACH = 1100, STOPS = 110;  // light gradient radius and resolution
const BOX = { l: -130, t: -185, w: 260, h: 225 }, RES = 2.5;  // per-figure capture window around the feet
const PAWN = { anchor: { x: 330, y: 870 }, pivot: { x: 430, y: 521 }, hit: { x: 327, y: 556 }, scale: 0.132 };  // scene.mjs specs[P]
const VICTIM = { anchor: knight.ANCHOR, hit: knight.HIT, scale: 0.125 };  // scene.mjs specs[N]: change with the victim's type
// Board offset of a sprite point from the feet (scene.mjs world()); Charcoal figures are mirrored.
const offset = (spec, p, side) => ({ x: (p.x - spec.anchor.x) * spec.scale * (side ? -1 : 1), y: (p.y - spec.anchor.y) * spec.scale });
const WORLD = { x: W / 2 - 480, y: H / 2 - 480 };  // board → camera world pixels: the board's centre at the frame centre

const smooth = easeInOut;
const rgb = c => `rgb(${c.map(v => Math.round(clamp(v, 0, 255))).join(',')})`;
const at = (M, x, y) => M.transformPoint(new DOMPoint(x, y));
const lens = canvas(1, 1).getContext('2d');
/** Board → screen matrix of a motion.mjs camera at time t, for a layer at `depth` (1 = the board). */
const matrix = (cam, t, depth = 1) => { lens.setTransform(1, 0, 0, 1, 0, 0); cam.apply(lens, t, depth); return lens.getTransform().translate(WORLD.x, WORLD.y); };
/** A kick s seconds after a hit: 1 on the hit frame, then a decaying ring (motion.mjs ring, started at its peak). */
const kick = (s, { freq, decay }) => (s < 0 ? 0 : ring(s + 0.25 / freq, { freq, decay }) * Math.exp(0.25 * decay / freq));
/** A camera path from keys [t, x, y, zoom, rot°, curve] around `origin` (board units), with a kick after the hit at `hit`. */
function rig(list, hit, k, origin = { x: 0, y: 0 }) {
  const track = list.map(([t, x, y, zoom, rot, curve]) => [t, [x, y, zoom, rot], curve]);
  return t => {
    const [x, y, zoom, rot] = keys(t, track), j = kick(t - hit + EARLY, k);
    return { x: origin.x + x + WORLD.x, y: origin.y + y + WORLD.y - k.y * j, zoom: zoom * (1 + k.zoom * j), rot: rot * Math.PI / 180 };
  };
}

const front = s => RIPPLE.speed * s + RIPPLE.burst * (1 - Math.exp(-3 * s));
const flicker = t => 1 + 0.04 * Math.sin(t * 7.3) + 0.025 * Math.sin(t * 13.1 + 1.3) + 0.015 * Math.sin(t * 23.7 + 0.4);
const height = t => FALL.height * (1 - ease.in(clamp((t - DROP_T[0]) / (DROP_T[1] - DROP_T[0]), 0, 1)));
const nearness = h => 1 / (1 + (h / APPROACH.h0) ** 2);  // 0 while the drop is far off, 1 at the stone
const breath = t => Math.sin(2 * Math.PI * (t - DROP_T[1]) / BREATH.period);
const wanderX = noise(DRIFT.seed), wanderY = noise(DRIFT.seed + 3);
/** The torch pool's centre: it wanders once the rings have spread. */
function poolCentre(t) {
  const k = DRIFT.units * smooth(clamp((t - DROP_T[1] - DRIFT.from) / DRIFT.ramp, 0, 1));
  return { x: DROP.x + k * wanderX(t * DRIFT.rate), y: DROP.y + k * wanderY(t * DRIFT.rate) };
}
/** Steady torchlight at distance rc from the pool's centre (before the reveal mask): falloff, flicker and breath. */
function steady(rc, t) {
  const b = breath(t), R = POOL.radius * (1 + BREATH.radius * b);
  return (POOL.edge + (POOL.peak - POOL.edge) * Math.exp(-((rc / R) ** 2))) * flicker(t) * (1 + BREATH.gain * b);
}
/** Light at distance r from the drop: the reveal (lit), the flashes and spill (glow), the passing rings (crest). */
function lightAt(r, t) {
  const s = t - DROP_T[1];
  if (s < 0) {  // the falling drop lights the stone beneath it
    const h = height(t), on = clamp((t - DROP_T[0]) / 0.3, 0, 1);
    return { lit: 0, glow: on * APPROACH.gain * nearness(h) * Math.exp(-((r / (APPROACH.r0 + APPROACH.spread * h)) ** 2)), crest: 0 };
  }
  const lit = smooth((front(s) - r) / RIPPLE.soft);
  const glow = LAND.pool[0] * Math.exp(-s / LAND.pool[1]) * Math.exp(-((r / LAND.pool[2]) ** 2))  // the landing flash
    + LAND.reveal[0] * Math.exp(-s / LAND.reveal[1]) * Math.exp(-((r / LAND.reveal[2]) ** 2))    // it lights the room for an instant
    + RIPPLE.spill[0] * Math.min(1, s / 0.4) * Math.exp(-Math.max(0, r - front(s)) / RIPPLE.spill[1]);
  let crest = 0;
  for (const [delay, amp] of RIPPLE.rings) {
    const d = s - delay;
    if (d <= 0) continue;
    const x = r - front(d), wave = Math.exp(-((x / RIPPLE.width) ** 2)) + (x < 0 ? 0.35 * Math.exp(x / RIPPLE.tail) : 0);
    crest += amp * wave * Math.exp(-d / RIPPLE.fade);
  }
  return { lit, glow, crest };
}
/** All the light at a board point; the pool follows its wandering centre. */
function light(x, y, t) {
  const L = lightAt(Math.hypot(x - DROP.x, y - DROP.y), t), c = poolCentre(t);
  return { ...L, pool: L.lit * steady(Math.hypot(x - c.x, y - c.y), t) + L.glow };
}
function radial(g, colour, cx = DROP.x, cy = DROP.y) {  // a board-space radial gradient sampled from colour(r)
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, REACH);
  for (let i = 0; i <= STOPS; i++) grad.addColorStop(i / STOPS, colour(i / STOPS * REACH));
  return grad;
}
/** A glint event s seconds after it ignites: intensity k and streak length L (0..1). */
function spark(s, seed) {
  if (s < 0) return { k: 0, L: 0 };
  const { rise, peak, decay, ember, twinkle, streak, rest } = SPARK;
  const k = s < rise ? peak * ease.out(s / rise) : ember + (peak - ember) * Math.exp(-(s - rise) / decay) + twinkle * Math.sin(s * 9 + seed);
  const L = s < streak[0] ? ease.out(s / streak[0]) : rest + (1 - rest) * Math.exp(-(s - streak[0]) / streak[1]);
  return { k, L };
}

export async function create(params, { fx }) {
  const art = await load(ART + 'board-art/stone-board.png');
  const board = canvas(1024, 1024), bg = board.getContext('2d'); bg.filter = BOARD_GRADE; bg.drawImage(art, 0, 0);
  const hot = canvas(1024, 1024), hg = hot.getContext('2d');  // the stone as the crest lights it
  hg.drawImage(board, 0, 0); hg.globalCompositeOperation = 'multiply'; hg.fillStyle = rgb(HOT); hg.fillRect(0, 0, 1024, 1024);
  // One game scene: first it paints each standoff figure alone, then it plays the clash.
  const stage = canvas(W, H), sg = stage.getContext('2d');
  const scene = createScene({ canvas: stage, pieces: R });
  await scene.load();
  scene.setCoords(false); scene.setSelected(null);
  scene.setDecorate((g, _, layer) => { if (layer === 'under') g.clearRect(-1e4, -1e4, 2e4, 2e4); });  // figures only
  const position = list => { const b = new Uint8Array(64); for (const [sq, type, side] of list) b[R.parseSq(sq)] = R.piece(R[type], side); return { board: b, turn: 0, halfmove: 0, ply: 0 }; };
  const shoot = (matrix, ms) => { sg.setTransform(matrix); scene.redraw(); flush(ms); return stage; };
  const tint = (src, style, op = 'source-in') => { const c = canvas(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = op; g.fillStyle = style; g.fillRect(0, 0, c.width, c.height); return c; };
  // The edge band facing (dx, dy): the figure minus itself shifted away from that direction.
  const edge = (src, dx, dy, px, style, c = canvas(src.width, src.height)) => {
    const g = c.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height);
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(src, -dx * px, -dy * px);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = style; g.fillRect(0, 0, c.width, c.height); return c;
  };

  // ---- standoff figures: colour, silhouette, warm rim toward the light, cool rim from above ----
  const figs = ARMY.map(([sq, type, side], i) => {
    scene.setPosition(position([[sq, type, side]]));
    const foot = scene.foot(R.parseSq(sq)), x0 = foot.x + BOX.l, y0 = foot.y + BOX.t, w = BOX.w * RES, h = BOX.h * RES;
    shoot(new DOMMatrix([RES, 0, 0, RES, -x0 * RES, -y0 * RES]), 0);
    const colour = canvas(w, h); colour.getContext('2d').drawImage(stage, 0, 0, w, h, 0, 0, w, h);
    const detail = canvas(w, h), dg = detail.getContext('2d');  // painted detail, darkened and cooled
    dg.drawImage(colour, 0, 0); dg.globalCompositeOperation = 'multiply'; dg.fillStyle = rgb(DETAIL.map(v => v * 255)); dg.fillRect(0, 0, w, h);
    dg.globalCompositeOperation = 'destination-in'; dg.drawImage(colour, 0, 0);
    let dx = DROP.x - foot.x, dy = (DROP.y - foot.y) * 0.35 - 70; const n = Math.hypot(dx, dy); dx /= n; dy /= n;
    const rim = edge(colour, dx, dy, RIM.px * RES, rgb(CREST));
    const glow = canvas(w, h), gg = glow.getContext('2d'); gg.filter = `blur(${2.2 * RES}px)`; gg.drawImage(rim, 0, 0);
    const moon = edge(colour, -dx * 0.5, -1, MOON.px * RES, `rgb(${MOON.colour})`);
    return { sq, side, foot, x0, y0, colour, detail, rim, glow, moon, body: tint(colour, '#000'), r: Math.hypot(foot.x - DROP.x, foot.y - DROP.y), phase: i * 2.4 };
  }).sort((a, b) => a.foot.y - b.foot.y);
  const rise = (f, t) => 1 + BREATHE * Math.sin(t * 2.2 + f.phase);  // breathing: a slight rise from the feet

  // ---- long shadows cast away from the light (board-space layers) ----
  const SH = 1.25;
  const castShadows = list => {
    const c = canvas(960 * SH, 960 * SH), g = c.getContext('2d'); g.filter = 'blur(4px)';
    for (const f of list) {
      const d = { x: f.foot.x - DROP.x, y: f.foot.y - DROP.y }, n = Math.hypot(d.x, d.y) || 1; d.x /= n; d.y /= n;
      const k = clamp(n / LIGHT_HEIGHT, 0.35, 1.5), p = { x: -d.y * 0.8, y: d.x * 0.8 }, sy = 0.7;
      // Figure-local (xo, yo) → feet + xo·p − yo·k·d: the figure lies down along the floor, away from the light.
      g.setTransform(new DOMMatrix([SH, 0, 0, SH, 0, 0]).multiply(new DOMMatrix([
        p.x / RES, p.y / RES, -k * d.x / RES, -k * d.y * sy / RES,
        f.foot.x + BOX.l * p.x - BOX.t * k * d.x, f.foot.y + BOX.l * p.y - BOX.t * k * d.y * sy])));
      g.drawImage(f.body, 0, 0);
    }
    return c;
  };
  const stepped = new Set(STEPS.map(([a]) => a));
  const shadowsAll = castShadows(figs), shadowsClash = castShadows(figs.filter(f => !stepped.has(f.sq)));

  // ---- the clash: the game plays the capture with just the two duellists; the clock drives it ----
  const [[, attackSq], [, victimSq]] = STEPS;
  const duel = position(STEPS.map(([a, b]) => [b, ...ARMY.find(([sq]) => sq === a).slice(1)]));
  scene.setPosition(duel);
  const move = actionsFor(duel, R.parseSq(attackSq)).find(m => m.captures[0] === R.parseSq(victimSq));
  const START = 100000; flush(START); scene.play(move);
  // The lance tip, for its glint and streak (mirrors scene.mjs: aim, step in, thrust).
  const from = scene.foot(move.from), victim = scene.foot(move.captures[0]);
  const world = (p, foot) => { const o = offset(PAWN, p, 0); return { x: foot.x + o.x, y: foot.y + o.y }; };
  const struck = offset(VICTIM, VICTIM.hit, 1), hit = { x: victim.x + struck.x, y: victim.y + struck.y };
  const aim = (() => {
    const p = { x: PAWN.anchor.x + (hit.x - from.x) / PAWN.scale, y: PAWN.anchor.y + (hit.y - from.y) / PAWN.scale };
    const zero = tipAt(0, 0), dx = p.x - PAWN.pivot.x, dy = p.y - PAWN.pivot.y;
    return clamp(Math.atan2(dy, dx) - Math.asin(clamp((zero.y - PAWN.pivot.y) / Math.max(1, Math.hypot(dx, dy)), -1, 1)), MIN_ANGLE, MAX_ANGLE);
  })();
  const contactTip = world(tipAt(aim, 0, THRUST), from), approach = { x: from.x + hit.x - contactTip.x, y: from.y + hit.y - contactTip.y };
  const tipAtMs = ms => {
    if (ms < 280) return world(tipAt(aim * smooth(ms / 280), 0), from);
    if (ms < 550) { const k = smooth((ms - 280) / 270); return world(tipAt(aim, 0), { x: lerp(from.x, approach.x, k), y: lerp(from.y, approach.y, k) }); }
    return world(tipAt(aim, 0, THRUST * thrustAt((ms - 550) / 800)), approach);
  };
  const cocked = tipAtMs(726);  // the tip at the peak of the wind-up: the thrust runs from here to the hit

  // ---- cameras ----
  const crane = camera({ path: rig(CRANE, DROP_T[1], LAND.kick), handheld: SWAY, shakes: [{ at: DROP_T[1] - EARLY, amount: LAND.trauma }], seed: 11 });
  const close = camera({ path: rig(CLOSE, CONTACT, IMPACT.kick, victim), handheld: SWAY * 0.7, shakes: [{ at: CONTACT - EARLY, amount: IMPACT.trauma }], shake: IMPACT.shake, seed: 23 });
  const ramp = remap(RAMP);

  // ---- dust hanging in the light, motes near the lens, the landing splash, drifting smoke ----
  const r = rand(29);
  // The higher a speck floats, the nearer the lens it is and the more it slides as the camera moves.
  const dust = Array.from({ length: 300 }, () => ({ x: lerp(-60, 1020, r()), y: lerp(60, 960, r()), z: lerp(4, 200, r()), s: lerp(0.5, 1.7, r()), ph: r() * 6.283, sp: lerp(0.4, 1, r()) }))
    .map(d => ({ ...d, depth: Math.round((1 - d.z / DEPTH.lens) * 20) / 20 }));
  const splash = Array.from({ length: 22 }, (_, i) => ({ a: i / 22 * 6.283 + r() * 0.25, v: lerp(30, 110, r()), w: lerp(80, 200, r()), s: lerp(0.7, 1.5, r()) }));
  // Out-of-focus motes near the lens: spread over the frame at a middle moment of each camera, then free to slide.
  const motesFor = (cam, tRef, seed) => {
    const q = rand(seed);
    return Array.from({ length: FG.motes }, () => {
      const depth = Math.round(lerp(DEPTH.motes[0], DEPTH.motes[1], q()) * 20) / 20, M = matrix(cam, tRef, depth);
      const u = q() * 2 - 1, x = W / 2 * (1 + Math.sign(u) * lerp(FG.clear, 1, Math.abs(u)));
      const p = M.inverse().transformPoint(new DOMPoint(x, lerp(H * 0.14, H * 0.86, q())));
      return { x: p.x, y: p.y, depth, size: lerp(FG.size[0], FG.size[1], q()) / Math.hypot(M.a, M.b), ph: q() * 6.283 };
    });
  };
  const motesCrane = motesFor(crane, (DROP_T[1] + CLASH) / 2, 31), motesClose = motesFor(close, CLASH + 1.4, 37);
  const smoke = (() => {
    const S = 512, c = canvas(S, S), g = c.getContext('2d'), q = rand(5);
    g.filter = 'blur(26px)';
    for (let i = 0; i < 70; i++) {
      const x = q() * S, y = q() * S, rad = lerp(30, 95, q()), a = lerp(0.12, 0.4, q());
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {  // wrap, so the texture tiles
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); gr.addColorStop(0, `rgba(255,196,140,${a})`); gr.addColorStop(1, 'rgba(255,196,140,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
    return g.createPattern(c, 'repeat');
  })();

  const tmp = canvas(W, H), tg = tmp.getContext('2d');
  const plate = canvas(W, H), pg = plate.getContext('2d');
  const duo = canvas(W, H), dg = duo.getContext('2d');
  const lightmap = canvas(W, H), lm = lightmap.getContext('2d');
  const poolmap = canvas(W, H), pm = poolmap.getContext('2d');  // the torch pool on the stone; its alpha also masks the haze
  const ghosts = [canvas(W, H), canvas(W, H)], rimmed = canvas(W, H);
  const reset = g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; };
  const BIG = [-2000, -2000, 5000, 5000];  // a board-space rectangle that covers the frame

  // Floor: the stone under a light map. Around the drop: ambient light, flashes and rings; around its wandering
  // centre: the torch pool, masked by the reveal. Each passing ring heats the carving it crosses.
  function floor(g, M, t) {
    reset(g); g.setTransform(M); g.drawImage(board, PAD, PAD, 8 * TILE, 8 * TILE);
    const c = poolCentre(t);
    reset(pm); pm.clearRect(0, 0, W, H); pm.setTransform(M);
    pm.fillStyle = radial(pm, rr => `rgba(${TORCH},${clamp(steady(rr, t), 0, 1)})`, c.x, c.y); pm.fillRect(...BIG);
    pm.globalCompositeOperation = 'destination-in'; pm.fillStyle = radial(pm, rr => `rgba(0,0,0,${lightAt(rr, t).lit})`); pm.fillRect(...BIG);
    reset(lm); lm.setTransform(M);
    lm.fillStyle = radial(lm, rr => { const L = lightAt(rr, t); return rgb([0, 1, 2].map(j => AMBIENT[j] * L.lit + TORCH[j] * L.glow + CREST[j] * L.crest)); }); lm.fillRect(...BIG);
    reset(lm); lm.globalCompositeOperation = 'lighter'; lm.drawImage(poolmap, 0, 0);
    reset(g); g.globalCompositeOperation = 'multiply'; g.drawImage(lightmap, 0, 0);
    reset(tg); tg.clearRect(0, 0, W, H); tg.setTransform(M); tg.drawImage(hot, PAD, PAD, 8 * TILE, 8 * TILE);
    tg.globalCompositeOperation = 'destination-in';
    tg.fillStyle = radial(tg, rr => { const L = lightAt(rr, t); return `rgba(255,236,200,${clamp(L.crest * 0.9 + Math.max(0, L.glow + L.lit * steady(rr, t) - 1) * 0.6, 0, 1)})`; });
    tg.fillRect(...BIG);
    reset(g); g.globalCompositeOperation = 'lighter'; g.drawImage(tmp, 0, 0);
    // The rings' own glow, and a warm haze of drifting smoke over the lit stone.
    g.setTransform(M); g.fillStyle = radial(g, rr => `rgba(255,205,140,${clamp(lightAt(rr, t).crest * RING_GLOW, 0, 1)})`); g.fillRect(...BIG);
    reset(tg); tg.clearRect(0, 0, W, H); tg.setTransform(M.translate(t * 9, t * -4).scale(1.4));
    tg.fillStyle = smoke; tg.fillRect(-1000, -1000, 3000, 3000);
    tg.setTransform(M.translate(-t * 6, t * 3).scale(0.9)); tg.globalAlpha = 0.7; tg.fillRect(-1000, -1000, 3000, 3000);
    tg.setTransform(M); tg.globalAlpha = 1; tg.globalCompositeOperation = 'destination-in';
    tg.fillStyle = radial(tg, rr => { const L = lightAt(rr, t); return `rgba(0,0,0,${clamp(L.glow + L.lit * steady(rr, t) + L.crest * 0.5, 0, 1)})`; }); tg.fillRect(...BIG);
    reset(g); g.globalCompositeOperation = 'lighter'; g.globalAlpha = HAZE; g.drawImage(tmp, 0, 0);
    reset(g);
  }
  // A figure in silhouette: black body, a trace of cool painted detail, warm rim toward the light, cool rim above.
  function silhouette(g, M, f, t, rimK = 1) {
    const L = light(f.foot.x, f.foot.y, t), lum = Math.min(1.8, L.pool + L.crest * RIM.crest), place = c => g.drawImage(c, f.x0, f.y0, BOX.w, BOX.h);
    g.setTransform(M.translate(f.foot.x, f.foot.y).scale(1, rise(f, t)).translate(-f.foot.x, -f.foot.y));
    if (DEBUG) { place(f.colour); return; }
    place(f.body);
    g.globalAlpha = clamp(lum * 1.4, 0, 1); place(f.detail);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = clamp(RIM.gain * lum, 0, 1) * rimK; place(f.rim);
    g.globalAlpha = clamp(RIM.glow * lum, 0, 1) * rimK; place(f.glow);
    g.globalAlpha = clamp(MOON.gain * L.lit, 0, 1); place(f.moon);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // Dust in the light, each speck at its own depth, and out-of-focus motes near the lens, lit by the light behind them.
  // tc is the camera's (shot) time; t the world's time, which slows with the speed ramp in the close-up.
  function particles(g, cam, tc, motes, glow, t = tc) {
    const mats = new Map(), mat = d => { if (!mats.has(d)) mats.set(d, matrix(cam, tc, d)); return mats.get(d); };
    reset(g); g.globalCompositeOperation = 'lighter';
    for (const d of dust) {
      const x = d.x + Math.sin(t * 0.23 * d.sp + d.ph) * 14, y = d.y + Math.sin(t * 0.17 * d.sp + d.ph * 1.7) * 6, z = d.z + Math.sin(t * 0.31 * d.sp + d.ph * 2.3) * 9;
      const L = light(x, y, t), a = clamp((L.pool * 0.6 + L.crest * 1.4) * (0.5 + 0.5 * Math.sin(t * 2.1 + d.ph)), 0, 1);
      if (a < 0.02) continue;
      const M = mat(d.depth), p = at(M, x, y - z);
      g.fillStyle = `rgba(255,222,170,${a})`; g.beginPath(); g.arc(p.x, p.y, d.s * Math.sqrt(Math.hypot(M.a, M.b)), 0, 6.283); g.fill();
    }
    const back = mat(1).inverse();  // screen → the stone behind
    for (const m of motes) {
      const M = mat(m.depth), q = at(M, m.x + Math.sin(t * 0.2 + m.ph) * FG.wander[0], m.y + Math.cos(t * 0.15 + m.ph) * FG.wander[1]), rad = m.size * Math.hypot(M.a, M.b);
      if (q.x < -rad || q.x > W + rad || q.y < -rad || q.y > H + rad) continue;
      const b = at(back, q.x, q.y), level = clamp(light(b.x, b.y, t).pool, 0, 1.2);
      bokeh(g, q, glow * level * (0.7 + 0.3 * Math.sin(t * 1.3 + m.ph) ** 8), '255,200,140', rad);  // each catches the light now and then
    }
    reset(g);
  }
  // Haze nearer the lens than the board: it slides faster than the stone (parallax), lit by the pool behind it.
  function haze(g, cam, t, wt = t) {
    reset(tg); tg.clearRect(0, 0, W, H);
    tg.setTransform(matrix(cam, t, DEPTH.haze).translate(480 + wt * FG.drift[0], 480 + wt * FG.drift[1]).scale(...FG.grain)); tg.fillStyle = smoke; tg.fillRect(-4000, -4000, 8000, 8000);
    reset(tg); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(poolmap, 0, 0);
    reset(g); g.globalCompositeOperation = 'lighter'; g.globalAlpha = FG.haze; g.drawImage(tmp, 0, 0); reset(g);
  }
  // A lens glint: a hot core and coloured halo, plus a short anamorphic streak (motion.mjs flare) and a thin vertical
  // spike, which shoot out as it ignites and fall back to a stub (L).
  function glint(g, p, k, colour, size, L = 1) {
    if (k <= 0.01) return;
    g.save(); reset(g); g.globalCompositeOperation = 'lighter';
    const a = Math.min(1, k), halo = 30 * size * (0.5 + 0.5 * k), gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.1, `rgba(${colour},${0.85 * a})`); gr.addColorStop(0.35, `rgba(${colour},${0.18 * a})`); gr.addColorStop(1, `rgba(${colour},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, halo, 0, 6.283); g.fill();
    const reach = SPARK.length * size * (0.3 + 0.7 * L);
    flare(g, p.x, p.y, SPARK.flare * size * a * L, { color: colour, length: reach });
    for (const [lx, ly, al] of [[reach * k * 0.8, 1.1, 0.8], [2.2, 46 * size * k * L, 0.45]]) {
      const s = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      s.addColorStop(0, `rgba(${colour},${al * a})`); s.addColorStop(1, `rgba(${colour},0)`);
      g.save(); g.translate(p.x, p.y); g.scale(lx, ly); g.fillStyle = s; g.beginPath(); g.arc(0, 0, 1, 0, 6.283); g.fill(); g.restore();
    }
    g.restore();
  }
  // The same glints, out of focus: soft discs, a little brighter at the rim, as a lens renders them.
  function bokeh(g, p, k, colour, rad) {
    if (k <= 0.01) return;
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
    gr.addColorStop(0, `rgba(${colour},${0.16 * k})`); gr.addColorStop(0.82, `rgba(${colour},${0.26 * k})`); gr.addColorStop(1, `rgba(${colour},0)`);
    g.save(); reset(g); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, rad, 0, 6.283); g.fill(); g.restore();
  }
  const defocus = (g, p, k, colour, size) => bokeh(g, p, k, colour, 14 + 12 * size);
  function glints(g, M, t, { gain = 1, draw = glint, skip = null, once = false } = {}) {
    const seen = new Set();  // once: one glint per figure (out of focus, a row of teeth would blur into a chain of rings)
    for (const [t0, sq, point, colour, size] of GLINTS) {
      if (skip?.has(sq) || (once && seen.has(sq))) continue;
      seen.add(sq);
      const f = figs.find(f => f.sq === sq);
      const o = point === 'lance' ? offset(PAWN, tipAt(0, f.side), f.side) : { x: point[0], y: point[1] }, p = at(M, f.foot.x + o.x, f.foot.y + o.y * rise(f, t));
      if (DEBUG) { reset(g); g.fillStyle = '#0f0'; g.fillRect(p.x - 2, p.y - 2, 4, 4); continue; }
      const e = spark(t - t0 + EARLY, t0 * 7);
      draw(g, p, e.k * lightAt(f.r, t).lit * gain, colour, size, e.L);
    }
  }
  // The drop: a bead of light that hangs, then plunges with a streak behind it; its reflection in the polished stone
  // rises to meet it. On landing: a crown of droplets, a hot core and a wide anamorphic flare.
  function drop(g, M, t) {
    const s = t - DROP_T[1];
    if (t >= DROP_T[0] && s < 0) {
      const h = height(t), near = nearness(h), e = spark(t - DROP_T[0] + EARLY, 2);
      const a = at(M, DROP.x, DROP.y - h), b = at(M, DROP.x, DROP.y - height(t - FALL.trail)), m = at(M, DROP.x, DROP.y + h * FALL.reflect);
      reset(g); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      if (Math.hypot(a.x - b.x, a.y - b.y) > 2) {
        const tr = g.createLinearGradient(b.x, b.y, a.x, a.y); tr.addColorStop(0, 'rgba(255,220,160,0)'); tr.addColorStop(1, 'rgba(255,244,220,.95)');
        g.strokeStyle = tr; g.lineWidth = 2.5; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(a.x, a.y); g.stroke();
      }
      glint(g, a, Math.max(e.k, 0.6 + 0.5 * near), WARM, lerp(FALL.bead[1], FALL.bead[0], e.L), Math.max(e.L, 0.35));
      glint(g, m, FALL.reflection[0] * near, WARM, FALL.reflection[1], 0.35);  // its reflection
    }
    if (s >= 0 && s < 1.2) {
      reset(g); g.globalCompositeOperation = 'lighter';
      for (const d of splash) {
        const u = s / (d.w / 150); if (u >= 1) continue;  // gone by the time it falls back
        const x = DROP.x + Math.cos(d.a) * d.v * s, y = DROP.y + Math.sin(d.a) * d.v * s * 0.8, z = d.w * s - 300 * s * s;
        if (z < 0) continue;
        const p = at(M, x, y - z), rad = 5 * d.s * Math.sqrt(M.a), gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        gr.addColorStop(0, `rgba(255,246,225,${1 - u})`); gr.addColorStop(1, 'rgba(255,200,130,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, rad, 0, 6.283); g.fill();
      }
      const c = at(M, DROP.x, DROP.y);
      glint(g, c, LAND.core[0] * Math.exp(-s / LAND.core[1]), WARM, LAND.core[2]);
      flare(g, c.x, c.y, LAND.flare[0] * Math.exp(-s / LAND.flare[1]), { color: '255,210,150', length: LAND.flare[2] });
    }
    reset(g);
  }
  // The landing's shockwave skims the stone.
  function landing(g, M, t) {
    const s = t - DROP_T[1] + EARLY, { smear, ...wave } = LAND.wave, n = 6;
    if (s < 0) return;
    g.setTransform(M); g.globalAlpha = 1 / n;  // shockwave() keeps this alpha: n faint rings add up to one
    for (let i = 0; i < n; i++) shockwave(g, s - smear * i / (n - 1), { x: DROP.x, y: DROP.y, ...wave });
    reset(g);
  }
  function standoff(t) {
    const M = matrix(crane, t), g = fx;
    reset(g); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    floor(g, M, t);
    g.setTransform(M.scale(1 / SH)); g.globalAlpha = 0.65; g.drawImage(shadowsAll, 0, 0); reset(g);
    landing(g, M, t);
    for (const f of figs) silhouette(g, M, f, t);
    drop(g, M, t);
    glints(g, M, t);
    particles(g, crane, t, motesCrane, FG.glow[0]);
    haze(g, crane, t);
  }

  // Contact: a white-hot burst, sparks along the thrust and a few back toward the Pawn, a long anamorphic flare.
  function contact(g, M, t) {
    const s = t - CONTACT + EARLY;
    if (s < 0) return;
    const c = at(M, hit.x, hit.y), a = at(M, cocked.x, cocked.y), dir = Math.atan2(c.y - a.y, c.x - a.x);
    sparks(g, s, { x: c.x, y: c.y, seed: 9, dir, ...IMPACT.sparks });
    sparks(g, s, { x: c.x, y: c.y, seed: 10, dir: dir + Math.PI, gravity: IMPACT.sparks.gravity, color: IMPACT.sparks.color, ...IMPACT.back });
    glint(g, c, IMPACT.core[0] * Math.exp(-s / IMPACT.core[2]), '255,240,215', IMPACT.core[1]);
    flare(g, c.x, c.y, IMPACT.flare[0] * Math.exp(-s / IMPACT.flare[1]), { color: '255,214,160', length: IMPACT.flare[2] });
    reset(g);
  }
  function closeup(t) {
    // The camera runs on shot time; the world (flicker, breath, dust, smoke, embers) on the game's slowed clock.
    const ms = ramp(t), wt = CLASH + (ms - RAMP[0][1]) / 1000, M = matrix(close, t), g = fx;
    // Background plate: the lit floor and the waiting armies in silhouette.
    reset(pg); pg.fillStyle = '#000'; pg.fillRect(0, 0, W, H);
    floor(pg, M, wt);
    pg.setTransform(M.scale(1 / SH)); pg.globalAlpha = 0.65; pg.drawImage(shadowsClash, 0, 0); reset(pg);
    for (const f of figs) if (!stepped.has(f.sq)) silhouette(pg, M, f, wt, PLATE_RIM);
    // A tighter pool: the duel stands in the light, everything else sinks into the dark.
    pg.setTransform(M); pg.globalCompositeOperation = 'multiply';
    const sx = victim.x + SPOT.x, sy = victim.y + SPOT.y, spot = pg.createRadialGradient(sx, sy, SPOT.inner, sx, sy, SPOT.outer);
    spot.addColorStop(0, '#fff'); spot.addColorStop(1, rgb(SPOT.dark)); pg.fillStyle = spot; pg.fillRect(...BIG); reset(pg);
    // The two duellists from the game, with echoes where they were a moment ago (shot time, so the echoes stretch
    // while time runs and melt away in slow motion), warmed by the torchlight.
    ECHO.forEach(([ago], i) => { shoot(M, START + Math.max(RAMP[0][1], ramp(t - ago))); const c = ghosts[i].getContext('2d'); c.clearRect(0, 0, W, H); c.drawImage(stage, 0, 0); });
    shoot(M, START + ms);
    reset(dg); dg.clearRect(0, 0, W, H);
    ECHO.forEach(([, alpha], i) => { dg.globalAlpha = alpha; dg.drawImage(ghosts[i], 0, 0); }); dg.globalAlpha = 1; dg.drawImage(stage, 0, 0);
    reset(tg); tg.clearRect(0, 0, W, H); tg.drawImage(duo, 0, 0);
    tg.globalCompositeOperation = 'multiply'; tg.fillStyle = rgb(TORCH.map(v => lerp(v, 255, 0.55))); tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(duo, 0, 0);
    reset(dg); dg.clearRect(0, 0, W, H); dg.drawImage(tmp, 0, 0);
    // Out-of-focus surroundings, sharp action.
    reset(g); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.filter = 'blur(9px)'; g.drawImage(plate, 0, 0); reset(g);
    const focus = at(M, (approach.x + victim.x) / 2, (approach.y + victim.y) / 2 - 30);
    reset(tg); tg.clearRect(0, 0, W, H); tg.drawImage(plate, 0, 0);
    tg.globalCompositeOperation = 'destination-in';
    const m = tg.createRadialGradient(focus.x, focus.y, 150, focus.x, focus.y, 520); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)');
    tg.fillStyle = m; tg.fillRect(0, 0, W, H);
    reset(g); g.drawImage(tmp, 0, 0);
    if (t < CONTACT - EARLY) drain(g, keys(t, DRAIN.keys), { dim: DRAIN.dim });  // the world holds its breath in the hang
    glints(g, M, wt, { gain: 1.4, draw: defocus, skip: stepped, once: true });  // the armies' glints still burn behind the duel
    g.drawImage(duo, 0, 0);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45; g.drawImage(edge(duo, 0.3, -1, 2, `rgb(${MOON.colour})`, rimmed), 0, 0); reset(g);
    // Lance streak, and the glints on its tip.
    const trail = []; for (let x = Math.max(280, ms - 120); x <= ms; x += 5) { const p = tipAtMs(x); trail.push(at(M, p.x, p.y)); }
    if (trail.length > 1) {
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = '#fff1d6';
      for (let i = 1; i < trail.length; i++) { const k = i / (trail.length - 1); g.globalAlpha = 0.3 * k; g.lineWidth = 5 * k; g.beginPath(); g.moveTo(trail[i - 1].x, trail[i - 1].y); g.lineTo(trail[i].x, trail[i].y); g.stroke(); }
      reset(g);
    }
    const tip = tipAtMs(ms), tp = at(M, tip.x, tip.y);
    for (const t0 of TIP_GLINTS.at) { const e = spark(t - t0 + EARLY, t0); glint(g, tp, e.k * TIP_GLINTS.gain, WARM, 1, e.L); }
    if (DEBUG) { g.fillStyle = '#0f0'; g.fillRect(tp.x - 2, tp.y - 2, 4, 4); }
    particles(g, close, t, motesClose, FG.glow[1], wt);
    haze(g, close, t, wt);
    contact(g, M, t);
  }

  // The cut (CUT). An impact frame: the duel as it is now, flat, on the frame's ground; the camera's shake still runs.
  function impactFrame(g, t, n) {
    const [ground, ink] = CUT.frames[n - 1], c = at(matrix(close, t), hit.x, hit.y);
    g.fillStyle = ground; g.fillRect(0, 0, W, H);
    if (n === 1) speedLines(g, c.x, c.y, 1, CUT.lines);
    else {
      const gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, CUT.core.radius);
      gr.addColorStop(0, `rgba(${CUT.core.colour},0.95)`); gr.addColorStop(0.3, `rgba(${CUT.core.colour},0.4)`); gr.addColorStop(1, `rgba(${CUT.core.colour},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    g.drawImage(tint(stage, ink), 0, 0);  // closeup(t) left the duel's current pose in stage
  }
  // In the black: the afterimage of the last impact frame (dark figures on a bright ground leave light, cool figures)
  // and of the contact's glare, fading. Built once from that frame's pose, so any frame renders on its own.
  let ghost;
  function afterimage(g, s) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (!ghost) {
      const t = BLACK - 1 / FPS, M = matrix(close, t), img = canvas(W, H), ig = img.getContext('2d');
      shoot(M, START + ramp(t)); ig.filter = `blur(${CUT.ghost.blur}px)`; ig.drawImage(tint(stage, `rgb(${CUT.ghost.colour})`), 0, 0);
      ghost = { img, c: at(M, hit.x, hit.y) };
    }
    const k = Math.exp(-s / CUT.ghost.decay), b = Math.exp(-s / CUT.burn.decay);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = CUT.ghost.alpha * k; g.drawImage(ghost.img, 0, 0); reset(g);
    glint(g, ghost.c, CUT.burn.gain * b, CUT.ghost.colour, CUT.burn.size, Math.exp(-s / CUT.burn.streak));
  }

  return t => {
    reset(fx);
    // Hit envelopes: the landing and the contact, and the frame of each (a flash lasts its first frames only).
    const land = t - DROP_T[1] + EARLY, strike = t - CONTACT + EARLY, frame = s => Math.floor(s * FPS);
    if (t >= BLACK) afterimage(fx, t - BLACK);
    else {
      // Cut half a frame early: every motion-blur sub-sample of the cut frame is then the close-up, never a blend.
      if (t >= CLASH - EARLY) closeup(t); else standoff(t);
      reset(fx);
      if (strike >= 0 && frame(strike) > 0) impactFrame(fx, t, frame(strike));
      else {
        if (BLOOM.strength > 0) bloom(fx, BLOOM);
        if (land >= 0 && frame(land) === 0) flash(fx, LAND.flash, '255,226,180');
        if (strike >= 0) flash(fx, IMPACT.flash[frame(strike)] ?? 0);
      }
      // A colour fringe that dies within about 0.15 s (it splits the impact frames too).
      aberration(fx, Math.max(land >= 0 ? LAND.fringe[0] * Math.exp(-land / LAND.fringe[1]) : 0, strike >= 0 ? IMPACT.fringe[0] * Math.exp(-strike / IMPACT.fringe[1]) : 0));
    }
    reset(fx);
    finish(fx, t);
  };
}

// Timing the soundtrack reads (audio/cues.mjs, audio/score.mjs), so a retime here moves the sound with it.
export { DROP_T, CLASH, CONTACT, BLACK, RIPPLE, GLINTS, TIP_GLINTS };
