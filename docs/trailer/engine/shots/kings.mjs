// Shot 10, Act IV: the kings (10 s), cut to a 120 BPM grid (beats every 0.5 s, half-beats every 0.25 s).
//   0.1   darkness; a point of light gathers where the first emblem will be
//   0.5   a fuse runs round a ring and lights the four element emblems on successive half-beats; 1.5 it closes with a pulse
//   2.25  the four king cards are dealt on the 1/8 grid: each lands with a spring settle and a ripple as its emblem
//         docks in its gem, and each gem projects its king as a hologram
//   4.0   the power cards rise face down, snap open into a fan (4.5) and flip face up (5.25, 5.5, 5.75)
//   6.0   the others fall away; Strike sinks, lifts and turns to face the camera (7.0) as the kings fall out of focus
//   7.0   the charge: tremble, heat, light pulsing twice as fast each time; 8.0 the meteor bursts out of the card,
//         melts into slow motion over the table and snaps down (9.0), the biggest hit of the act; pure white from 9.6
// Cast, choreography, camera and look are data at the top; the code below only reads them.
import { W, H, finish, particles, clamp, lerp, load, canvas, rand } from '../runtime.mjs';
import { ease, bezier, keys, spring, ring, remap, noise, camera, sparks, shockwave, flare, flash } from '../motion.mjs';
import { makeCard, makeHologram, drawProjection, perspectiveGroup, project, bokeh, kingArt, cardBack, ELEMENTS, GEM, CARD_W, CARD_H } from './cards.mjs';

const A = new URL('../../assets/', import.meta.url).href, GEN = `${A}gen/`;   // paths relative to this module

// ---- Cast ----
const KINGS = [   // left to right on the table; the ring ignites in the same order
  { kicker: 'KING', name: 'EMBER', element: 'fire', king: 'king-ember.png' },
  { kicker: 'KING', name: 'FROST', element: 'water', king: 'king-frost.png' },
  { kicker: 'KING', name: 'GAYA', element: 'earth', king: 'king-gaya.png' },
  { kicker: 'KING', name: 'CELESTIAL', element: 'air', king: 'king-celestial.png' },
];
const POWERS = [   // left to right in the hand; `hero` stays face down, then turns to the camera and fires
  { name: 'LEAP', element: 'earth', art: 'leap.jpg' },
  { name: 'RESCUE', element: 'water', art: 'rescue.jpg' },
  { name: 'STRIKE', element: 'fire', art: 'strike.jpg', hero: true, focus: [0.39, 0.5] },
  { name: 'FLIGHT', element: 'air', art: 'flight.jpg' },
];

// ---- 1. The emblem ring (frame px, shot seconds) ----
const RING = {
  x: 960, y: 505, r: 285, size: 165, angles: [-135, 135, 45, -45],   // centre, radius, emblem size; angle per king (deg)
                                    // (centred in the picture: the top emblems clear the letterbox)
  gather: [0.1, 0.5],               // a point of light gathers where the first emblem will be: the wind-up
  ignite: [0.5, 0.75, 1.0, 1.25],   // HITS on half-beats: the fuse reaches each emblem and lights it
  close: 1.5,                       // HIT on the beat: the fuse is back at the first emblem, the ring closes and pulses
  pop: { from: 0.4, freq: 3, zeta: 0.4 },   // an emblem springs up from 40 % of its size as it lights
  cool: 0.5, sparks: 26,            // it cools from white heat to its colour (s); sparks thrown by each ignition
  burst: { dur: 0.45, glow: [40, 260], flare: [300, 900], wave: 200, dock: 0.55 },   // an ignition's light (s, px); `dock`: size of the
                                                                                     // same burst when an emblem docks in its gem
  motes: { n: 14, reach: 260 },     // motes streaming into the gathering light (px)
  pulse: { dur: 0.8, reach: 320, width: 6, kick: 0.12, flare: 3, glow: 420 },   // the closing pulse runs outward (s, px); the emblems
                                    // kick with it; the ring flares and fades at `flare` (1/s); a soft light fills the ring (px)
  spin: 6, ticksIn: 0.5,            // the inner ticks turn (deg/s) and draw in (s)
  launch: 0.45, pull: 0.12, back: 36, arc: 150,     // an emblem leaves `launch` s before its card lands: it pulls back
  trail: { n: 8, gap: 0.008 }, dock: 0.06, fade: 0.3,   // (s, px away from its gem), arcs (px) and dives into the gem with a light trail;
};                                                    // it vanishes into the gem (s); the ring fades as the first emblem leaves (s)

// ---- 2. The deal (table px, degrees) ----
const DEAL = {
  land: 2.25, gap: 0.25,            // HITS: king card i touches down at land + i·gap, on the 1/8 grid
  from: { x: 0.6, y: 1150, z: 280, turn: 22, tip: -72 },   // start pose: x scale, distance nearer the camera, height, turn, tip
  throw: { freq: 1.6, zeta: 0.68, v0: 3 },   // in the table plane: a thrown spring (start speed in travels/s)
  touch: 0.9,                       // the card touches down (on the HIT) 90 % of the way, still sliding: it overshoots its
                                    // place by ~6 % and springs back (the settle) within ~0.3 s
  flap: 3.5, flapRing: { freq: 4.5, decay: 8 },   // on touch-down the trailing edge slaps down and rocks (deg)
  bank: 0.012,                      // roll into the sideways speed (deg per table px/s)
  ripple: { dur: 0.75, from: 300, to: 760, alpha: 0.55, width: 7, echo: 0.12 },   // two thin rings run out over the glass
  lit: { dur: 0.15, flare: 0.9, decay: 7 },   // the gem lights as its emblem docks: ramp (s), extra flare, fall-off (1/s)
};
const LINEUP = { x: [-660, -220, 220, 660], y: [-30, 0, 0, -30], turn: [7, 2.5, -2.5, -7] };   // where the king cards lie
const HOLO = { delay: 0.125, power: 0.3, rise: 0.62, height: 540 };   // after a gem lights: projector on (1/16 note later), the king builds up (s)

// ---- 3. The hand (frame px, degrees) ----
const HAND = {
  pivot: [960, 2262, -180], radius: 1700, spread: 12.5, lean: 10,   // the fan: pivot (x, y, z), radius, degrees between cards, lean back
  rise: 4.0, riseGap: 0, riseDur: 0.5, riseFrom: 900, deck: 5,     // the cards come up face down from below the frame, as one deck
                                                                    // (its edges stepped `deck` px apart until the fan opens)
  fan: 4.5, fanSpring: { freq: 2.4, zeta: 0.5 }, bank: 0.05,        // HIT on the beat: the fan snaps open with a little overshoot;
                                                                    // each card tips into its swing (deg per deg/s)
  sway: [4, 6], swaySpeed: 0.45,                                     // idle drift: lean and turn (deg)
  flip: [5.25, 5.5, 5.75],                                           // HITS on half-beats: LEAP, RESCUE, FLIGHT land face up
  wind: { dur: 0.16, turn: 24, lean: 8, sink: 26 },                 // anticipation: the card turns back a little, leans away and sinks (deg, px)
  turn: { freq: 1.7, zeta: 0.55 }, pop: 70,                          // the flip: a spring that overshoots ~13 %; lift toward the camera
  drop: 6.0, dropGap: 0.06, dropLiftDur: 0.1, dropDur: 0.42, dropLift: 30, dropFall: 1150, dropTumble: 32,   // the others lift a little, then fall
};

// ---- 4. Strike ----
const HERO = {
  dip: 6.0, lift: 6.25, face: 7.0,        // anticipation, lift, HIT on the beat: it faces the camera
  dipBy: [0, 46, -50], dipLean: 12,        // how far it sinks (x, y, z px) and leans back (deg) before the lift
  to: [1180, 530, 330], arc: 90, bank: 0.006,   // end pose (frame px, z), arc height, roll per px/s of sideways speed
  move: { freq: 0.9, zeta: 0.7, v0: 1.5 }, // the lift: a thrown spring out of the dip (arrives ~0.53 s, 5 % overshoot)
  turn: { freq: 1, zeta: 0.6 },            // the flip toward the camera, during the lift: face-on exactly at `face`, ~10 % overshoot
  push: 0.06,                              // art zoom once it faces the camera
};
const CHARGE = {
  pulses: [7.0, 7.5, 7.75, 7.875, 7.9375, 7.96875],   // light pulses on the grid, each gap half the one before
  decay: 12, color: '255,150,60',          // a pulse's fall-off (1/s) and the heat colour
  push: 0.16, tremble: { px: 10, deg: 1.8, hz: 19, after: 8 },   // extra art zoom (ease.in) and tremble (quadratic) reached at the burst;
                                                                  // the tremble dies away after it (1/s)
  ring: { dur: 0.4, reach: 330, alpha: 0.55 },         // each pulse sends a ring of heat out of the meteor (s, card-scale px)
  suck: { n: 64, reach: 460, life: [0.7, 0.28] },     // motes drawn into the meteor; they travel faster as the charge builds (s)
  dim: 0.3,                                // the kings give up their light to the card
};

// ---- 5. The meteor, the impact, the white ----
const METEOR = {
  burst: 8.0, impact: 9.0,                 // HITS on beats
  ramp: [[8.0, 0], [8.15, 0.2], [8.3, 0.28], [8.55, 0.305], [8.72, 0.37], [8.86, 0.5], [9.0, 0.73]],   // speed ramp [shot t, scene s since
  fall: 1.15,                              // the burst]: out fast, melting to near-frozen 8.3–8.55 (clear of the card, ~37 % of the way),
                                           // then a snap faster than real time: the last 0.28 s covers ~60 % of the path. Path progress =
  at: [0.388, 0.5], r: 0.2, hole: 0.19,    // (scene / scene at impact)^fall. at: the meteor in strike.jpg (fractions);
  ground: [-580, 490], bend: [-120, -90],  // r / hole: sprite and after-glow radius (of the art width); ground: impact (table px, in front
                                           // of the kings and near the lens, so the snap travels ~2 meteor widths);
  grow: 1.9, tail: 0.9, back: 0.3, tailIn: 0.25,   // bend: pull on the path (frame px); size at impact; trail length, its reach back
  embers: { n: 110, life: 0.7 }, smear: 0.012,     // into the card and how long it takes to grow (s); embers shed (s); head smear (s)
};
const BURST = {   // the meteor leaves the card: everything below stacks on the burst frame
  flash: 0.35, light: 760, lightFade: 0.18,   // a warm full-frame flash (1 frame, then gone) and a burst of light from the card (px, s)
  trauma: 0.55, zoom: -0.035, fringe: 6,      // the lens jerks back
  recoil: 90, tilt: 8, recoilRing: { freq: 1.6, decay: 3.4 },   // the card is pushed back (z px, deg) and springs home
  wave: 520, waveDur: 0.45, sparks: 70, shards: 28, debris: 0.7,   // shock ring (px, s), sparks, glass shards and how long they fly (s)
  flashRate: 40,                                                     // the flash is gone within a frame or two (1/s)
};
const IMPACT = {   // the biggest hit of the act
  flash: 1, hold: 0.05, drop: 0.45, dropRate: 12,     // full white for two frames (at 30 fps), then the scene shows through
  trauma: 1, decay: 3.2, zoom: 0.07, fringe: 11, sparks: 130, hotSparks: 40,
  core: { from: 50, to: 430, dur: 0.35 },      // the white-hot core (frame px, s)
  fire: { from: 90, to: 860, dur: 0.7, billows: 18, wash: 0.16, washFade: 0.9, flareFade: 0.6 },
                                                // the fireball (px, s), the orange light it throws on the frame, its light streak (s)
  wave: { radius: 2400, dur: 1.3, echo: [0.7, 1.4] },   // the shockwave along the table (table px, s, cubic ease-out) and a slower echo
  jolt: 36, joltTip: 8, joltRing: { freq: 2.6, decay: 6 },   // (size, time): king cards jump (px) and tip (deg) as it reaches each one;
  glitch: [0.04, 0.06, 0.4], dim: 0.3,         // their hologram glitches and collapses (s around the hit); the cards dim (s)
  rock: { z: -70, deg: 7, ring: { freq: 2.4, decay: 5 } },   // the blast rocks the Strike card back (z px, deg)
};
const WHITE = { spread: [9.12, 9.58], full: [9.28, 9.58], color: '255,255,255' };   // white spreads from the impact, then fills the frame:
    // pure white inside the letterbox from 9.58, so even the motion-blur sub-frames of 9.6 are white; the title opens on it

// ---- Camera ----
const CAMERA = [   // the 3D view of the table: [t, [x, y, z, pitch, yaw] (frame px, degrees), ease into this key]
  [0, [0, 170, -260, 56, 2]],
  [4.0, [0, 170, -185, 56, -3], ease.smooth],   // a slow push in while the kings arrive
  [5.0, [0, 45, -640, 58, -1], ease.smooth],    // pull back as the hand comes up (gently: the fan's snap is the fast move)
  [10, [0, 25, -600, 58, 1], ease.smooth],
];
const CAM = { handheld: 0.45, shake: 26, seed: 11, bg: 1.5, fg: 0.7 };   // sway, shake at full trauma (px), parallax depth of back and front
const TRAUMA = { ignite: 0.22, close: 0.35, land: 0.2, fan: 0.15, flip: 0.12, face: 0.25, pulse: 0.1 };   // camera kick per hit (0..1)
const ZOOM = { close: 0.012, face: 0.015, kick: { freq: 2.2, decay: 6 } };   // lens punch on the ring close and on Strike's turn
const HANG = { at: [8.2, 8.8], zoom: 0.04, toward: 0.3, release: 0.5 };   // while time hangs the camera keeps creeping in on the meteor
                                    // (zoom, share of the way its aim moves to the meteor); released after the impact (s)
const FRINGE = 20;   // colour fringing on the burst and the impact falls off at this rate (1/s): gone within ~0.15 s

// ---- Look ----
const GOLD = '255,214,150', FIRE = '255,170,80', BG = '#020306';
const FOCUS = { dim: 0.45, blur: 6 };   // how far the kings darken and blur (px) while Strike holds the frame
const POOL = { r: 520, alpha: 0.16, lift: 260 };   // each element's light on the backdrop: radius, strength, height above its king (px)
const FG = { n: 9, size: [40, 110], alpha: 0.1, drift: 38, seed: 17 };   // out-of-focus embers near the lens while Strike is in focus
const TABLE = { w: 2600, h: 1600 };     // table plane, table px (drawn at half resolution)
const BARS = 132;                       // letterbox height (runtime.finish)
const RAD = Math.PI / 180;
const waveEase = bezier(0.33, 1, 0.68, 1);   // cubic ease-out: a blast front that slows as it spreads
const quad = bezier(1 / 3, 0, 2 / 3, 1 / 3);   // exactly u²: a free fall, a steady build

// ---- helpers ----
const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const hit = (t, at, rate) => (t < at ? 0 : Math.exp(-(t - at) * rate));   // 1 on the hit, then falls away
const fade2 = (dt, len) => (dt < 0 ? 0 : Math.max(0, 1 - dt / len) ** 2);
/** A thrown spring: 0 → 1 from a start speed v0 (travels/s); the spring's step response plus its impulse response. */
function thrown(dt, { freq, zeta, v0 }) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return spring(dt, { freq, zeta }) + (v0 / wd) * ring(dt, { freq: wd / (2 * Math.PI), decay: zeta * w });
}
/** First time a 0 → 1 curve reaches 1: puts a spring's arrival exactly on a hit. */
const arrival = f => { let t = 0; while (t < 4 && f(t) < 1) t += 1 / 1000; return t; };
const pose = ({ x, y, z, rz = 0, rx = 0, ry = 0 }, base = new DOMMatrix()) => base.translate(x, y, z)
  .rotateAxisAngle(0, 0, 1, rz).rotateAxisAngle(1, 0, 0, rx).rotateAxisAngle(0, 1, 0, ry).translate(-CARD_W / 2, -CARD_H / 2);
const view = t => { const [x, y, z, pitch, yaw] = keys(t, CAMERA);
  return new DOMMatrix().translate(960 + x, 540 + y, z).rotateAxisAngle(1, 0, 0, pitch).rotateAxisAngle(0, 0, 1, yaw); };
function glow(g, x, y, rad, color, a) {   // a soft light: white core, coloured falloff (use with 'lighter')
  if (rad <= 0 || a <= 0) return;
  const s = g.createRadialGradient(x, y, 0, x, y, rad);
  s.addColorStop(0, `rgba(255,255,255,${Math.min(1, a)})`); s.addColorStop(0.25, `rgba(${color},${Math.min(1, 0.7 * a)})`); s.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = s; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

export async function create(params, { fx, over, layer }) {
  const elements = ['fire', 'water', 'earth', 'air'];
  const [emblemList, kingImgs, painted, strikeImg] = await Promise.all([
    Promise.all(elements.map(e => load(`${A}${e}.png`))),
    Promise.all(KINGS.map(k => load(A + k.king))),
    load(`${GEN}card-back.png`).catch(() => null),
    load(`${A}strike.jpg`),
  ]);
  const emblems = Object.fromEntries(elements.map((e, i) => [e, emblemList[i]]));
  const back = painted ? painted.src : cardBack();

  // The meteor cut out of the Strike art, and the same art with the meteor gone (a hot glow where it was).
  const meteor = (() => {
    const s = Math.round(strikeImg.naturalWidth * METEOR.r), c = canvas(s * 2, s * 2), g = c.getContext('2d');
    g.drawImage(strikeImg, METEOR.at[0] * strikeImg.naturalWidth - s, METEOR.at[1] * strikeImg.naturalHeight - s, s * 2, s * 2, 0, 0, s * 2, s * 2);
    g.globalCompositeOperation = 'destination-in';
    const m = g.createRadialGradient(s, s, s * 0.55, s, s, s); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, s * 2, s * 2);
    return { img: c, r: s };
  })();
  const emptied = (() => {
    const w = strikeImg.naturalWidth, h = strikeImg.naturalHeight, c = canvas(w, h), g = c.getContext('2d');
    g.drawImage(strikeImg, 0, 0);
    const cx = METEOR.at[0] * w, cy = METEOR.at[1] * h, r = METEOR.hole * w, sum = [0, 0, 0], px = g.getImageData(0, 0, w, h).data;
    for (let i = 0; i < 36; i++) {   // the average colour just outside the meteor
      const o = (Math.round(cy + Math.sin(i / 36 * 6.283) * r * 1.1) * w + Math.round(cx + Math.cos(i / 36 * 6.283) * r * 1.1)) * 4;
      for (let k = 0; k < 3; k++) sum[k] += px[o + k] / 36;
    }
    const avg = sum.map(Math.round).join(','), p = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    p.addColorStop(0, 'rgba(255,226,170,1)'); p.addColorStop(0.35, `rgba(${avg},1)`); p.addColorStop(0.75, `rgba(${avg},.9)`); p.addColorStop(1, `rgba(${avg},0)`);
    g.fillStyle = p; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    return c.toDataURL('image/jpeg', 0.9);
  })();

  // ---- DOM: the table and king cards, the hologram canvas, then the hand (painted in this order) ----
  const world = perspectiveGroup(), hand = perspectiveGroup();
  const table = canvas(TABLE.w / 2, TABLE.h / 2);
  Object.assign(table.style, { position: 'absolute', left: 0, top: 0, width: `${TABLE.w}px`, height: `${TABLE.h}px`, transformOrigin: '0 0' });
  const holo = canvas(W, H); Object.assign(holo.style, { position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen' });
  for (const el of [world, holo, hand]) el.style.transformOrigin = '0 0';
  world.append(table);
  layer.append(world, holo, hand);
  const kings = [], powers = [];
  for (const [i, k] of KINGS.entries()) {
    const card = await makeCard({ ...k, art: k.art ? A + k.art : kingArt(kingImgs[i], k.element, i + 3), emblem: `${A}${k.element}.png`, back });
    world.append(card.el); kings.push({ ...k, card, holo: makeHologram(kingImgs[i], k.element) });
  }
  for (const p of POWERS) {
    const card = await makeCard({ ...p, art: A + p.art, altArt: p.hero ? emptied : undefined, emblem: `${A}${p.element}.png`, back });
    hand.append(card.el); powers.push({ ...p, card });
  }
  const hero = powers.find(p => p.hero), heroIndex = powers.indexOf(hero), rest = powers.filter(p => p !== hero);

  // Colour fringing for the whole shot (DOM cards and both canvases): an SVG filter on the shot's own box,
  // splitting red left and blue right. Canvas-only shots use motion.aberration; this shot is part DOM.
  const box = layer.parentElement?.classList.contains('shot') ? layer.parentElement : layer;
  const fringe = (() => {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), id = 'kings-fringe';
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    const channel = (c, name) => `<feColorMatrix in="SourceGraphic" type="matrix" values="${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(k => (r === k && (r === c || r === 3) ? 1 : 0)).join(' ')).join('  ')}" result="${name}"/>`;
    svg.innerHTML = `<filter id="${id}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      ${channel(0, 'r')}<feOffset in="r" dx="0" result="rs"/><feMerge result="rm"><feMergeNode in="r"/><feMergeNode in="rs"/></feMerge>
      ${channel(1, 'g')}
      ${channel(2, 'b')}<feOffset in="b" dx="0" result="bs"/><feMerge result="bm"><feMergeNode in="b"/><feMergeNode in="bs"/></feMerge>
      <feComposite in="rm" in2="g" operator="arithmetic" k2="1" k3="1" result="rg"/>
      <feComposite in="rg" in2="bm" operator="arithmetic" k2="1" k3="1"/></filter>`;
    layer.append(svg);
    const [r, b] = svg.querySelectorAll('feOffset');
    return px => {
      const on = px >= 0.4;
      r.setAttribute('dx', on ? -px : 0); b.setAttribute('dx', on ? px : 0);
      box.style.filter = on ? `url(#${id})` : '';
    };
  })();

  // ---- timing that follows from the springs ----
  const landAt = i => DEAL.land + i * DEAL.gap;
  const dealT = arrival(dt => thrown(dt, DEAL.throw) / DEAL.touch);   // throw → touch-down (still sliding)
  const flipT = arrival(dt => spring(dt, HAND.turn));      // start of a flip → face up
  const heroT = arrival(dt => spring(dt, HERO.turn));      // start of Strike's turn → facing the camera
  const ramp = remap(METEOR.ramp), sI = METEOR.ramp[METEOR.ramp.length - 1][1];
  const scene = t => (t <= METEOR.burst ? t : t < METEOR.impact ? METEOR.burst + ramp(t) : METEOR.burst + sI + (t - METEOR.impact));
  const pathAt = s => clamp(s / sI, 0, 1) ** METEOR.fall;  // s: scene seconds since the burst
  const pulseAt = t => (t >= METEOR.burst ? 0 : Math.min(1.6, CHARGE.pulses.reduce((s, at) => s + hit(t, at, CHARGE.decay), 0)));
  const charge = t => ease.in(span(t, HERO.face, METEOR.burst)) * (t < METEOR.burst ? 1 : 0);
  // The shockwave runs out along the table; each king card is hit when it arrives.
  const waveR = dt => IMPACT.wave.radius * waveEase(dt / IMPACT.wave.dur);
  const struck = KINGS.map((_, i) => METEOR.impact + arrival(dt => waveR(dt) / Math.hypot(LINEUP.x[i] - METEOR.ground[0], LINEUP.y[i] - METEOR.ground[1])));

  // ---- camera: the 3D view of the table (view), then a lens over every layer (handheld, shake, punches) ----
  const shakes = [
    ...RING.ignite.map(at => ({ at, amount: TRAUMA.ignite })), { at: RING.close, amount: TRAUMA.close },
    ...KINGS.map((_, i) => ({ at: landAt(i), amount: TRAUMA.land })), { at: HAND.fan, amount: TRAUMA.fan },
    ...HAND.flip.map(at => ({ at, amount: TRAUMA.flip })), { at: HERO.face, amount: TRAUMA.face },
    ...CHARGE.pulses.map((at, i) => ({ at, amount: TRAUMA.pulse * (1 + 0.4 * i) })),
    { at: METEOR.burst, amount: BURST.trauma, decay: 4.5 }, { at: METEOR.impact, amount: IMPACT.trauma, decay: IMPACT.decay },
  ];
  const kicks = [[RING.close, ZOOM.close], [HERO.face, ZOOM.face], [METEOR.burst, BURST.zoom], [METEOR.impact, IMPACT.zoom]];
  const creep = t => ease.inOut(span(t, ...HANG.at)) * (1 - ease.out(span(t, METEOR.impact, METEOR.impact + HANG.release)));
  const cam = camera({ path: t => {
    const k = creep(t), aim = k > 0 ? meteorAt(pathAt(ramp(HANG.at[0] + 0.1))) : { x: W / 2, y: H / 2 };   // the meteor where it hangs
    return { zoom: 1 + HANG.zoom * k + kicks.reduce((s, [at, a]) => s + a * ring(t - at, ZOOM.kick), 0), x: lerp(W / 2, aim.x, HANG.toward * k), y: lerp(H / 2, aim.y, HANG.toward * k) };
  }, handheld: CAM.handheld, shakes, shake: CAM.shake, seed: CAM.seed });
  const lens = (t, depth = 1) => {   // cam.apply as a CSS matrix, for the DOM layers
    const s = cam.state(t), z = 1 + (s.zoom - 1) / depth;
    return new DOMMatrix().translate(W / 2, H / 2).rotate(s.rot / depth / RAD).scale(z, z)
      .translate(-(W / 2 + (s.x - W / 2) / depth), -(H / 2 + (s.y - H / 2) / depth)).toString();
  };

  // ---- poses ----
  function kingPose(i, t, V) {
    const L = landAt(i), dt = t - (L - dealT), u = clamp(dt / dealT, 0, 1), f = DEAL.from, x = LINEUP.x[i], y = LINEUP.y[i], turn = LINEUP.turn[i];
    const p = thrown(dt, DEAL.throw), pv = (p - thrown(dt - 1 / 120, DEAL.throw)) * 120, x0 = x * f.x;   // progress and its speed
    const flap = DEAL.flap * ring(t - L, DEAL.flapRing), jump = Math.max(0, ring(t - struck[i], IMPACT.joltRing));
    const tip = flap + IMPACT.joltTip * ring(t - struck[i], IMPACT.joltRing);
    return pose({
      x: lerp(x0, x, p), y: lerp(y + f.y, y, p),
      z: 2 + lerp(f.z, 0, ease.in(u)) + Math.abs(Math.sin(tip * RAD)) * CARD_H / 2 + IMPACT.jolt * jump,   // the low edge stays on the table
      rz: lerp(turn + Math.sign(x) * f.turn, turn, p), rx: lerp(f.tip, 0, ease.out(u)) + tip, ry: -DEAL.bank * pv * (x - x0),
    }, V);
  }
  const sway = POWERS.map((_, j) => noise(80 + j));
  function handPose(j, t) {
    const n = powers.length, [px, py, pz] = HAND.pivot, o = rest.indexOf(powers[j]), s = sway[j], k = t * HAND.swaySpeed;
    const fan = dt => (j - (n - 1) / 2) * HAND.spread * spring(dt, HAND.fanSpring), a = fan(t - HAND.fan), va = (a - fan(t - HAND.fan - 1 / 120)) * 120;
    const up = ease.out(span(t, HAND.rise + j * HAND.riseGap, HAND.rise + j * HAND.riseGap + HAND.riseDur));
    let rx = HAND.lean + HAND.sway[0] * s(k), ry = 180 + HAND.sway[1] * s(k + 40) - HAND.bank * va, z = pz + j * 10, dy = 0;
    if (o >= 0) {   // the flip: lean away and turn a little the wrong way, then spring past face up and settle
      const t1 = HAND.flip[o] - flipT, w = ease.inOut(span(t, t1 - HAND.wind.dur, t1)), f = spring(t - t1, HAND.turn), fc = clamp(f, 0, 1);
      ry = (180 + HAND.wind.turn * w) * (1 - f) + HAND.sway[1] * s(k + 40) - HAND.bank * va;
      rx += HAND.wind.lean * w * (1 - fc);
      z += HAND.pop * Math.sin(Math.PI * fc) - HAND.wind.sink * w * (1 - fc);
      const d0 = HAND.drop + o * HAND.dropGap;   // then it falls away: a small lift first, then gravity
      dy = keys(t, [[d0, 0], [d0 + HAND.dropLiftDur, -HAND.dropLift, ease.out], [d0 + HAND.dropDur, HAND.dropFall, quad]]);
      rx += HAND.dropTumble * quad(span(t, d0 + HAND.dropLiftDur, d0 + HAND.dropDur));
    }
    const deck = (j - (n - 1)) * HAND.deck * (1 - clamp(spring(t - HAND.fan, HAND.fanSpring), 0, 1));   // the back cards' edges show
    return { x: px + Math.sin(a * RAD) * HAND.radius, y: py - Math.cos(a * RAD) * HAND.radius + (1 - up) * HAND.riseFrom + dy + deck, z, rz: a, rx, ry };
  }
  const tremble = [noise(71), noise(72), noise(73)];
  function heroPose(t) {
    const b = handPose(heroIndex, Math.min(t, HERO.dip)), dip = ease.inOut(span(t, HERO.dip, HERO.lift)), [tx, ty, tz] = HERO.to;
    const fx = b.x + HERO.dipBy[0] * dip, fy = b.y + HERO.dipBy[1] * dip, fz = b.z + HERO.dipBy[2] * dip;
    const p = thrown(t - HERO.lift, HERO.move), pv = (p - thrown(t - HERO.lift - 1 / 120, HERO.move)) * 120, pc = clamp(p, 0, 1);
    const f = spring(t - (HERO.face - heroT), HERO.turn);                              // face-on exactly at HERO.face
    const rc = ring(scene(t) - METEOR.burst, BURST.recoilRing), rk = ring(t - METEOR.impact, IMPACT.rock.ring);   // pushed back by the burst, rocked by the blast
    const T = CHARGE.tremble, k = t < METEOR.burst ? quad(span(t, HERO.face, METEOR.burst)) : hit(t, METEOR.burst, T.after), [nx, ny, nr] = tremble, q = t * T.hz;
    return {
      x: lerp(fx, tx, p) + T.px * k * nx(q), y: lerp(fy, ty, p) - Math.sin(Math.PI * pc) * HERO.arc + T.px * k * ny(q),
      z: lerp(fz, tz, p) - BURST.recoil * rc + IMPACT.rock.z * rk,
      rz: lerp(b.rz, 0, pc) - HERO.bank * pv * (tx - fx) + T.deg * k * nr(q),
      rx: lerp(b.rx, 0, pc) + HERO.dipLean * dip * (1 - pc) + BURST.tilt * rc + IMPACT.rock.deg * rk, ry: 180 * (1 - f),
    };
  }
  const heroPush = t => HERO.push * ease.inOut(span(t, HERO.face, HERO.face + 1)) + CHARGE.push * ease.in(span(t, HERO.face, METEOR.burst));
  // Where the meteor leaves the card (the pose at the burst), and where it lands (the ground point, seen at the impact).
  hero.card.set(METEOR.burst, pose(heroPose(METEOR.burst)), { push: heroPush(METEOR.burst) });
  const M0 = (() => { const [x, y, k] = hero.card.artPoint(...METEOR.at), p = hero.card.point(x, y); return { x: p.x, y: p.y, r: meteor.r * k * p.s }; })();
  const M1 = project(view(METEOR.impact), ...METEOR.ground);

  // ---- the ring of emblems (over the DOM, so the emblems can fly into the cards) ----
  const home = i => { const a = RING.angles[i] * RAD; return [RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r]; };
  function emblemAt(i, t, gem) {   // pulls back, then arcs and dives into the gem, gaining speed
    const L = landAt(i), D = L - RING.launch, [hx, hy] = home(i), f = ease.in(span(t, D + RING.pull, L));
    const dx = gem.x - hx, dy = gem.y - hy, d = Math.hypot(dx, dy) || 1, back = RING.back * ease.smooth(span(t, D, D + RING.pull)) * (1 - f);
    return { x: lerp(hx, gem.x, f) - dx / d * back, y: lerp(hy, gem.y, f) - dy / d * back - Math.sin(Math.PI * f) * RING.arc, f };
  }
  function drawRing(g, t, gems) {
    const R = RING, ends = [...R.ignite.slice(1), R.close], fade = 1 - span(t, landAt(0) - R.launch, landAt(0) - R.launch + R.fade);
    const gap = Math.asin(R.size * 0.72 / R.r), closed = hit(t, R.close, R.pulse.flare);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    if (t < R.ignite[0] + 0.05) {   // the wind-up: light gathers, motes streaming into it
      const k = quad(span(t, ...R.gather)), [x, y] = home(0), r = rand(3);
      glow(g, x, y, 8 + 70 * k, GOLD, 0.2 + 0.8 * k);
      flare(g, x, y, 0.55 * k, { color: GOLD, length: 150 + 550 * k });
      g.strokeStyle = `rgba(${GOLD},${0.7 * k})`; g.lineWidth = 1.4;
      for (let i = 0; i < R.motes.n; i++) {
        const a = r() * 6.283, q = ((t - R.gather[0]) * (1.6 + r()) + r()) % 1, d = R.motes.reach * (1 - ease.in(q)) + 12;
        g.beginPath(); g.moveTo(x + Math.cos(a) * (d + 30 * q), y + Math.sin(a) * (d + 30 * q)); g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); g.stroke();
      }
    }
    if (fade > 0) {
      for (let s = 0; s < 4; s++) {   // the fuse: from each emblem to the next, gaining speed into it
        const k = ease.in(span(t, R.ignite[s], ends[s])); if (!k) continue;
        const a0 = R.angles[s] * RAD, a1 = a0 - Math.PI / 2 * k, from = a0 - gap, to = Math.max(a1, a0 - Math.PI / 2 + gap);
        if (to < from) for (const [lw, al] of [[10, 0.07], [4, 0.18], [1.6, 0.85]]) {   // (the line clears the medallions)
          g.strokeStyle = `rgba(${GOLD},${Math.min(1, al * fade * (1 + 2.5 * closed))})`; g.lineWidth = lw * (1 + closed);
          g.beginPath(); g.arc(R.x, R.y, R.r, from, to, true); g.stroke();
        }
        if (k < 1) glow(g, R.x + Math.cos(a1) * R.r, R.y + Math.sin(a1) * R.r, 30, GOLD, 1);
      }
      if (t > R.close) {   // closed: an inner circle with turning ticks, and the pulse running outward
        const k = ease.out((t - R.close) / R.ticksIn) * fade, spin = (t - R.close) * R.spin * RAD, ri = R.r - 34;
        g.strokeStyle = `rgba(${GOLD},${0.3 * k})`; g.lineWidth = 1.2;
        g.beginPath(); g.arc(R.x, R.y, ri, 0, 6.283); g.stroke();
        g.beginPath();
        for (let i = 0; i < 72; i++) { const a = i * 5 * RAD + spin, l = i % 6 ? 7 : 15; g.moveTo(R.x + Math.cos(a) * (ri - 10), R.y + Math.sin(a) * (ri - 10)); g.lineTo(R.x + Math.cos(a) * (ri - 10 - l), R.y + Math.sin(a) * (ri - 10 - l)); }
        g.stroke();
        const q = (t - R.close) / R.pulse.dur;
        if (q < 1) for (const [w, a, lag] of [[R.pulse.width * 3, 0.15, 0.05], [R.pulse.width, 0.7, 0]]) {
          const e = ease.out(clamp(q - lag, 0, 1));
          g.strokeStyle = `rgba(${GOLD},${a * (1 - q) ** 1.5})`; g.lineWidth = w * (1 - q) + 1;
          g.beginPath(); g.arc(R.x, R.y, R.r + e * R.pulse.reach, 0, 6.283); g.stroke();
        }
        glow(g, R.x, R.y, R.pulse.glow, GOLD, 0.35 * closed);
      }
    }
    g.restore();
    KINGS.forEach((k, i) => {
      const E = ELEMENTS[k.element], [hx, hy] = home(i), ti = R.ignite[i], L = landAt(i), gem = gems[i];
      if (t < ti || t > L + 0.5) return;
      const m = emblemAt(i, t, gem), gone = span(t, L, L + R.dock), color = E.glow.join(',');
      const pop = lerp(R.pop.from, 1, spring(t - ti, R.pop)) + R.pulse.kick * ring(t - R.close, { freq: 3, decay: 7 });
      const size = lerp(R.size, (GEM.r * 2 - 20) * gem.s, m.f) * pop;
      if (m.f > 0 && gone < 1) {   // a tapered light trail behind the diving emblem
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (let j = 1; j <= R.trail.n; j++) {
          const a = emblemAt(i, t - (j - 1) * R.trail.gap, gems[i]), b = emblemAt(i, t - j * R.trail.gap, gems[i]), k2 = 1 - j / (R.trail.n + 1);
          g.strokeStyle = `rgba(${color},${0.55 * k2 * (1 - gone)})`; g.lineWidth = size * 0.42 * k2;
          g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(a.x, a.y); g.stroke();
        }
        g.restore();
      }
      if (gone < 1) medallion(g, emblems[k.element], m.x, m.y, size, E, (1 + 0.15 * Math.sin(t * 5 + i) + 1.2 * closed) * (1 - 0.5 * m.f), step1(t - ti) * (1 - gone), 1 - ease.out((t - ti) / R.cool));
      burst(g, hx, hy, t - ti, color, 30 + i, 1);        // ignition
      burst(g, gem.x, gem.y, t - L, color, 40 + i, R.burst.dock); // docking into the gem
    });
  }
  const step1 = dt => span(dt, 0, 0.05);
  function medallion(g, img, x, y, size, E, glowK, alpha, hot) {
    const [r, gg, b] = E.glow, h = g.createRadialGradient(x, y, 0, x, y, size * 1.5);
    h.addColorStop(0, `rgba(${r},${gg},${b},${Math.min(1, 0.5 * glowK * alpha)})`); h.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = h; g.fillRect(x - size * 1.5, y - size * 1.5, size * 3, size * 3); g.restore();
    g.save(); g.globalAlpha = alpha;
    g.strokeStyle = E.rim; g.lineWidth = Math.max(1, size * 0.025); g.beginPath(); g.arc(x, y, size * 0.64, 0, 6.283); g.stroke();
    g.drawImage(img, x - size / 2, y - size / 2, size, size);
    if (hot > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * Math.min(1, hot); g.drawImage(img, x - size / 2, y - size / 2, size, size); }
    g.restore();
  }
  function burst(g, x, y, dt, color, seed, scale) {   // an ignition: light, a streak, a ring and sparks
    const B = RING.burst; if (dt < 0 || dt > B.dur * 1.4) return;
    const k = clamp(dt / B.dur, 0, 1), e = ease.out(k);
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, x, y, lerp(...B.glow, e) * scale, color, (1 - k) ** 2);
    g.restore();
    flare(g, x, y, (1 - k) ** 1.5 * scale, { color, length: lerp(...B.flare, e) * scale });
    shockwave(g, dt, { x, y, radius: B.wave * scale, dur: B.dur, squash: 1, color, width: 5 * scale });
    sparks(g, dt, { x, y, n: Math.round(RING.sparks * scale), seed, speed: [220 * scale, 760 * scale], gravity: 380, drag: 3, life: [0.25, 0.6], color, width: [1, 2.6] });
  }

  // ---- the table: dark glass lit by the cards, with landing ripples ----
  function drawTable(t, lits) {
    const g = table.getContext('2d'), s = 0.5, cx = TABLE.w / 2, cy = TABLE.h / 2, R = DEAL.ripple;
    g.clearRect(0, 0, table.width, table.height);
    const sheen = g.createRadialGradient(cx * s, cy * s, 0, cx * s, cy * s, 1200 * s);
    sheen.addColorStop(0, `rgba(70,80,110,${0.22 * Math.min(1, Math.max(...lits))})`); sheen.addColorStop(1, 'rgba(70,80,110,0)');
    g.fillStyle = sheen; g.fillRect(0, 0, table.width, table.height);
    g.globalCompositeOperation = 'lighter';
    KINGS.forEach((k, i) => {
      const [r, gg, b] = ELEMENTS[k.element].glow, x = (cx + LINEUP.x[i]) * s, y = (cy + LINEUP.y[i]) * s, lit = Math.min(1.5, lits[i]);
      if (lit > 0) {
        const p = g.createRadialGradient(x, y, 0, x, y, 520 * s);
        p.addColorStop(0, `rgba(${r},${gg},${b},${0.32 * lit})`); p.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        g.fillStyle = p; g.fillRect(x - 520 * s, y - 520 * s, 1040 * s, 1040 * s);
      }
      for (const [delay, amp] of [[0, 1], [R.echo, 0.45]]) {   // a crest and a fainter echo, card-shaped, running out
        const q = (t - landAt(i) - delay) / R.dur; if (q <= 0 || q >= 1) continue;
        const rr = lerp(R.from, R.to, ease.out(q)) * s;
        g.strokeStyle = `rgba(${r},${gg},${b},${R.alpha * amp * (1 - q) ** 2})`; g.lineWidth = R.width * s * (1 - q) + 0.6;
        g.beginPath(); g.ellipse(x, y, rr * 0.75, rr, LINEUP.turn[i] * RAD, 0, 6.283); g.stroke();
      }
    });
    g.globalCompositeOperation = 'source-over';
  }

  // ---- the charge, the burst, the meteor, the impact ----
  function drawCharge(g, t) {
    const k = charge(t); if (k <= 0) return;
    const [x0, y0] = hero.card.artPoint(...METEOR.at), P = hero.card.point(x0, y0), pl = pulseAt(t), S = CHARGE.suck, r = rand(61);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    glow(g, P.x, P.y, (70 + 150 * k + 90 * pl) * P.s, CHARGE.color, 0.25 + 0.4 * k + 0.45 * pl);
    for (const at of CHARGE.pulses) {   // each pulse sends a ring of heat out through the art
      const q = (t - at) / CHARGE.ring.dur; if (q < 0 || q > 1) continue;
      g.strokeStyle = `rgba(255,190,120,${CHARGE.ring.alpha * (1 - q) ** 2})`; g.lineWidth = 3 * (1 - q) + 1;
      g.beginPath(); g.arc(P.x, P.y, (30 + CHARGE.ring.reach * ease.out(q)) * P.s, 0, 6.283); g.stroke();
    }
    for (let i = 0; i < S.n; i++) {   // motes drawn into the meteor, faster as the charge builds
      const born = HERO.face + (METEOR.burst - HERO.face) * (i / S.n) ** 0.75, life = lerp(S.life[0], S.life[1], (born - HERO.face) / (METEOR.burst - HERO.face));
      const a = r() * 6.283, reach = S.reach * (0.6 + 0.4 * r()), gc = 190 + r() * 60 | 0, q = (t - born) / life;
      if (q < 0 || q > 1) continue;
      const d = reach * (1 - ease.in(q)) * P.s + 10, d2 = d + reach * 0.09 * P.s * (0.4 + q);
      g.strokeStyle = `rgba(255,${gc},120,${0.9 * Math.sin(Math.PI * q)})`; g.lineWidth = 1 + 2 * q;
      g.beginPath(); g.moveTo(P.x + Math.cos(a) * d2, P.y + Math.sin(a) * d2); g.lineTo(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); g.stroke();
    }
    g.restore();
  }
  const P1 = [(M0.x + M1.x) / 2 + METEOR.bend[0], (M0.y + M1.y) / 2 + METEOR.bend[1]];
  const meteorAt = e => {   // e < 0 continues the path back out of the card, along the art's own flame
    if (e < 0) return { x: M0.x + 2 * e * (P1[0] - M0.x), y: M0.y + 2 * e * (P1[1] - M0.y) };
    const u = 1 - e; return { x: u * u * M0.x + 2 * u * e * P1[0] + e * e * M1.x, y: u * u * M0.y + 2 * u * e * P1[1] + e * e * M1.y };
  };
  function drawBurst(g, s) {   // s: scene seconds since the burst
    if (s < 0 || s > BURST.debris + 0.1) return;
    const kb = s / BURST.debris, dir = Math.atan2(P1[1] - M0.y, P1[0] - M0.x);
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, M0.x, M0.y, BURST.light, '255,200,140', fade2(s, BURST.lightFade));   // the burst of light
    glow(g, M0.x, M0.y, lerp(90, 460, ease.out(kb)), FIRE, (1 - clamp(kb, 0, 1)) ** 2);
    g.restore();
    flare(g, M0.x, M0.y, (1 - clamp(kb, 0, 1)) ** 2 * 1.4, { color: '255,190,120', length: lerp(600, 1400, ease.out(kb)) });
    shockwave(g, s, { x: M0.x, y: M0.y, radius: BURST.wave, dur: BURST.waveDur, squash: 1, color: '255,222,180', width: 9 });
    sparks(g, s, { x: M0.x, y: M0.y, n: BURST.sparks, seed: 12, speed: [500, 1700], dir, spread: 2.6, gravity: 900, drag: 2.6, life: [0.3, 0.75], color: '255,190,110', width: [1.4, 3.4] });
    if (kb < 1) {   // glass shards thrown out of the card frame
      const rs = rand(5);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < BURST.shards; i++) {
        const a = Math.PI * (0.3 + rs() * 1.2), sp = 300 + rs() * 1000, sz = 6 + rs() * 16;
        g.save(); g.translate(M0.x + Math.cos(a) * sp * kb, M0.y + Math.sin(a) * sp * kb + 400 * kb * kb); g.rotate(rs() * 6 + kb * 12);
        g.fillStyle = `rgba(255,${220 + rs() * 35 | 0},200,${(1 - kb) * 0.9})`;
        g.beginPath(); g.moveTo(0, -sz); g.lineTo(sz * 0.5, sz * 0.6); g.lineTo(-sz * 0.4, sz * 0.3); g.closePath(); g.fill(); g.restore();
      }
      g.restore();
    }
  }
  function drawMeteor(g, t) {
    const s = scene(t) - METEOR.burst;
    if (s < 0 || t > METEOR.impact + 0.02) return;
    const e = pathAt(s), head = meteorAt(e), size = M0.r * lerp(1, METEOR.grow, e);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // A tapered, turbulent flame trail back along the path.
    const n = 48, tail = Math.max(-METEOR.back, e - METEOR.tail * Math.min(1, s / METEOR.tailIn)), pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n, u = lerp(tail, e, f), p = meteorAt(u), q = meteorAt(u - 0.01), dx = p.x - q.x, dy = p.y - q.y, l = Math.hypot(dx, dy) || 1;
      const wob = Math.sin(u * 30 - (METEOR.burst + s) * 26) * size * 0.16 * (1 - f);
      pts.push([p.x - dy / l * wob, p.y + dx / l * wob, f]);
    }
    for (const [wk, col, al] of [[1.9, '255,70,15', 0.12], [1.2, '255,120,35', 0.2], [0.72, '255,190,80', 0.34], [0.3, '255,246,220', 0.8]]) {
      g.strokeStyle = `rgba(${col},${al})`;
      for (let i = 1; i < pts.length; i++) {
        g.lineWidth = size * wk * pts[i][2] ** 0.9; g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
      }
    }
    const r = rand(77);   // embers shed along the way (they hang in the slow motion too)
    for (let i = 0; i < METEOR.embers.n; i++) {   // each is shed at a fixed point of the path, when the head passes it
      const u = r(), born = u ** (1 / METEOR.fall) * sI, age = s - born, vx = (r() - 0.5) * 300, vy = (r() - 0.7) * 300, L = METEOR.embers.life, gc = 170 + r() * 80 | 0;
      if (age < 0 || age > L) continue;
      const p = meteorAt(u), a = 1 - age / L;
      g.fillStyle = `rgba(255,${gc},90,${a})`; g.beginPath(); g.arc(p.x + vx * age, p.y + vy * age + 300 * age * age, 1 + 2.8 * a, 0, 6.283); g.fill();
    }
    glow(g, head.x, head.y, size * 2.6, '255,120,40', 0.85);
    g.restore();
    for (let i = 4; i >= 0; i--) {   // the head, smeared by its real (on-screen) speed
      const p = meteorAt(pathAt(scene(t - i * METEOR.smear) - METEOR.burst)), s2 = size * (1 - i * 0.04);
      g.globalAlpha = i ? 0.22 : 1; g.drawImage(meteor.img, p.x - s2, p.y - s2, s2 * 2, s2 * 2);
    }
    g.globalAlpha = 1;
  }
  function tableRing(g, V, cx, cy, r, color, a, width) {   // a circle on the table, in perspective
    if (a <= 0) return;
    g.strokeStyle = `rgba(${color},${a})`; g.lineWidth = width; g.beginPath();
    let pen = false;
    for (let j = 0; j <= 96; j++) {
      const q = j / 96 * 6.283, p = project(V, cx + Math.cos(q) * r, cy + Math.sin(q) * r);
      if (p.s <= 0 || p.s > 6) { pen = false; continue; }
      pen ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); pen = true;
    }
    g.stroke();
  }
  function drawImpact(g, t, V) {
    const dt = t - METEOR.impact; if (dt < 0) return;
    const { x, y } = M1, [gx, gy] = METEOR.ground, rnd = rand(91), C = IMPACT.core, F = IMPACT.fire;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.fillStyle = `rgba(255,120,40,${F.wash * fade2(dt, F.washFade)})`; g.fillRect(-200, -200, W + 400, H + 400);   // the frame catches the fire
    // The shockwave along the table (in perspective): a bright front, a wide soft band, a slower echo.
    const q = dt / IMPACT.wave.dur, rr = waveR(dt), q2 = dt / (IMPACT.wave.dur * IMPACT.wave.echo[1]), rr2 = IMPACT.wave.radius * IMPACT.wave.echo[0] * waveEase(q2);
    if (q < 1) { tableRing(g, V, gx, gy, rr, '255,200,140', 0.3 * (1 - q), 60 * (1 - q) + 4); tableRing(g, V, gx, gy, rr, '255,240,215', 0.9 * (1 - q), 10 * (1 - q) + 1.5); }
    if (q2 < 1) tableRing(g, V, gx, gy, rr2, '255,220,180', 0.45 * (1 - q2), 4 * (1 - q2) + 1);
    // The fireball: billows of fire around a white-hot core.
    for (let i = 0; i < F.billows; i++) {   // (every random draw comes before the skip, so no billow jumps when another dies)
      const a = -Math.PI * (0.05 + rnd() * 0.9), sp = 300 + rnd() * 700, life = 0.7 + rnd() * 0.5, br = (60 + rnd() * 110) * (1 + 3 * dt), gc = 150 + rnd() * 80 | 0;
      if (dt > life) continue;
      const bx = x + Math.cos(a) * sp * dt, by = y + Math.sin(a) * sp * dt * 0.7, k = 1 - dt / life, bg = g.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0, `rgba(255,${gc},60,${0.5 * k})`); bg.addColorStop(1, 'rgba(255,70,10,0)');
      g.fillStyle = bg; g.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    const fr = lerp(F.from, F.to, ease.out(dt / F.dur)), fb = g.createRadialGradient(x, y, 0, x, y, fr);
    fb.addColorStop(0, 'rgba(255,200,120,.9)'); fb.addColorStop(0.45, 'rgba(255,130,45,.55)'); fb.addColorStop(1, 'rgba(255,60,10,0)');
    g.fillStyle = fb; g.fillRect(x - fr, y - fr, fr * 2, fr * 2);
    glow(g, x, y, lerp(C.from, C.to, ease.out(dt / C.dur)), '255,236,200', 1);
    g.restore();
    flare(g, x, y, fade2(dt, F.flareFade) * 2, { color: '255,225,190', length: 2600 });
    sparks(g, dt, { x, y, n: IMPACT.sparks, seed: 93, speed: [700, 2300], dir: -Math.PI / 2, spread: Math.PI * 0.95, gravity: 1500, drag: 2.2, life: [0.45, 1.1], color: '255,190,110', width: [2, 5] });
    sparks(g, dt, { x, y, n: IMPACT.hotSparks, seed: 94, speed: [1200, 3000], dir: -Math.PI / 2, spread: Math.PI * 0.6, gravity: 800, drag: 3, life: [0.2, 0.45], color: '255,245,220', width: [1.5, 3] });
    // Then white spreads out from the impact until it fills the frame.
    const w = ease.in(span(t, ...WHITE.spread));
    if (w > 0) {
      const R = lerp(200, 2600, w), wg = g.createRadialGradient(x, y, 0, x, y, R);
      wg.addColorStop(0, `rgba(${WHITE.color},1)`); wg.addColorStop(0.6, `rgba(${WHITE.color},${w})`); wg.addColorStop(1, `rgba(${WHITE.color},0)`);
      g.fillStyle = wg; g.fillRect(-200, -200, W + 400, H + 400);
    }
  }
  function drawForeground(g, t, k) {   // embers near the lens, far out of focus
    if (k <= 0) return;
    const r = rand(FG.seed), span2 = H + 300;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < FG.n; i++) {
      const x0 = r() * W, y0 = r() * span2, rad = lerp(FG.size[0], FG.size[1], r()), sp = 0.5 + r(), ph = r() * 6.283;
      const x = x0 + Math.sin(t * 0.3 + ph) * 60, y = ((y0 - t * FG.drift * sp) % span2 + span2) % span2 - 150;
      bokeh(g, x, y, rad, '255,190,120', FG.alpha * k * (0.6 + 0.4 * Math.sin(t * 1.3 + ph)));
    }
    g.restore();
  }

  // ---- the frame ----
  return t => {
    const V = view(t), L = lens(t), st = scene(t), down = span(t, METEOR.impact, METEOR.impact + IMPACT.dim);
    for (const el of [world, holo, hand]) el.style.transform = L;
    // King cards: dealt, lit by their emblem, then the art's light rises out of the card as the hologram.
    const lits = kings.map((k, i) => (span(t, landAt(i), landAt(i) + DEAL.lit.dur) + DEAL.lit.flare * hit(t, landAt(i), DEAL.lit.decay)) * (1 - 0.7 * down));
    const powerOf = i => span(t, landAt(i) + HOLO.delay, landAt(i) + HOLO.delay + HOLO.power);
    kings.forEach((k, i) => (k.card.el.style.visibility = t < landAt(i) - dealT ? 'hidden' : ''));
    kings.forEach((k, i) => k.card.set(st, kingPose(i, t, V), { lit: lits[i], aura: Math.min(1.4, lits[i]), motes: Math.min(1, lits[i]), dim: powerOf(i), push: 0.02 * Math.sin(t * 0.5 + i) }));
    table.style.transform = V.translate(-TABLE.w / 2, -TABLE.h / 2, 0).toString();
    drawTable(t, lits);
    const gems = kings.map(k => k.card.point(GEM.x, GEM.y, 2));
    const soft = ease.inOut(span(t, HERO.lift, HERO.face)), focus = 1 - FOCUS.dim * soft - CHARGE.dim * charge(t);   // the kings fall out of focus
    world.style.filter = soft ? `brightness(${focus}) blur(${soft * FOCUS.blur}px)` : '';

    // Background: darkness, each element's light (around its emblem, then behind its king), drifting dust.
    fx.save(); fx.setTransform(1, 0, 0, 1, 0, 0); fx.fillStyle = BG; fx.fillRect(0, 0, W, H);
    cam.apply(fx, t, CAM.bg);
    fx.globalCompositeOperation = 'lighter';
    kings.forEach((k, i) => {
      const [r, g, b] = ELEMENTS[k.element].glow, [hx, hy] = home(i), lit = span(t, RING.ignite[i], RING.ignite[i] + 0.4), m = emblemAt(i, t, gems[i]);
      const x = lerp(hx, gems[i].x, m.f), y = lerp(hy, gems[i].y - POOL.lift, m.f), rad = POOL.r;
      const n = fx.createRadialGradient(x, y, 0, x, y, rad);
      n.addColorStop(0, `rgba(${r},${g},${b},${POOL.alpha * lit * focus * (1 - down)})`); n.addColorStop(1, `rgba(${r},${g},${b},0)`);
      fx.fillStyle = n; fx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
    fx.globalCompositeOperation = 'source-over';
    particles(fx, t, { n: 80, seed: 21, color: '190,210,255', rise: 12, bokeh: 12 });
    fx.restore();

    // Holograms: each king stands on its gem; the shockwave glitches each one out as it passes.
    const hg = holo.getContext('2d'); hg.clearRect(0, 0, W, H);
    hg.save(); hg.globalAlpha = focus;
    if (soft) hg.filter = `blur(${soft * FOCUS.blur}px)`;
    kings.forEach((k, i) => {
      const t0 = landAt(i) + HOLO.delay, [g0, g1, g2] = IMPACT.glitch, hitW = span(t, struck[i] - g0, struck[i] + g1), gone = span(t, struck[i] + g1, struck[i] + g2);
      drawProjection(hg, k.card, k.holo, st, { power: powerOf(i) * (1 - gone), reveal: ease.out(span(t, t0 + 0.1, t0 + 0.1 + HOLO.rise)), alpha: 1 - gone, glitch: hitW, height: HOLO.height, seed: i + 1, defocus: soft });
    });
    hg.restore();

    // The hand: power cards rise face down, fan out and flip face up; Strike turns to the camera and fires.
    for (const p of rest) p.card.set(t, pose(handPose(powers.indexOf(p), t)), { motes: 0.8 });
    const ch = charge(t), pl = pulseAt(t), gone = span(st, METEOR.burst, METEOR.burst + 0.5);
    hero.card.set(st, pose(heroPose(t)), {
      push: heroPush(t), motes: 1 + 2 * ch - gone, aura: Math.max(0, 1 + 2.5 * ch + 1.5 * pl - 2.6 * gone), dim: 0.5 * gone,
      heat: Math.min(1, ch + 0.4 * pl) * (1 - gone), alt: span(t, METEOR.burst, METEOR.burst + 0.06),
    });
    if (t > HERO.dip) hand.append(hero.card.el);   // in front of the rest of the hand
    else hand.insertBefore(hero.card.el, rest[heroIndex]?.card.el ?? null);

    // Over the DOM: emblems, the charge, the burst, the meteor, the impact; then the lens, the film finish, the white.
    const g = over; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.save(); cam.apply(g, t, 1);
    drawRing(g, t, gems);
    drawCharge(g, t);
    drawBurst(g, st - METEOR.burst);
    drawMeteor(g, t);
    drawImpact(g, t, V);
    particles(g, t, { n: 30, seed: 8, color: '255,200,150', rise: 20, bokeh: 8, size: [1, 2.5] });
    g.restore();
    g.save(); cam.apply(g, t, CAM.fg); drawForeground(g, t, soft * (1 - down)); g.restore();
    const B = METEOR.burst, I = METEOR.impact;
    flash(g, t >= B && t < B + 1 / 30 ? BURST.flash : BURST.flash * hit(t, B + 1 / 30, BURST.flashRate), '255,236,210');
    flash(g, t >= I && t < I + IMPACT.hold ? IMPACT.flash : IMPACT.drop * hit(t, I + IMPACT.hold, IMPACT.dropRate));
    fringe(BURST.fringe * hit(t, B, FRINGE) + IMPACT.fringe * hit(t, I, FRINGE));
    finish(g, t, BARS);
    const white = ease.in(span(t, ...WHITE.full));
    if (white > 0) { g.fillStyle = `rgba(${WHITE.color},${white})`; g.fillRect(0, BARS, W, H - BARS * 2); }
  };
}
