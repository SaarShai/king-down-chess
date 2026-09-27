// The cue sheet: per timeline shot id, [shot-local seconds, sound name from sfx.mjs, options].
// options.duck (true or a depth 0–1) dips the music under the sound. Retime here when a shot changes.
// HUSH (below): shot-local [from, to] windows the mixer holds at true silence (reverb tails included).
// Every cue STARTS its sound; a build-up that lands on a picture event starts its len / lead before it.
// Timing comes from the shots: the timeline's params (names, reveal styles, whips), the montage's own sync list
// (montage.mjs CUES), the timing wake.mjs and intro.mjs export, and knobs mirrored below from kings.mjs and title.mjs
// (named in each block: change them together).
import { titleHits, remap } from '../motion.mjs';
import { shots } from '../timeline.mjs';
import { CUES as MONTAGE } from '../shots/montage.mjs';
import * as wake from '../shots/wake.mjs';
import { PIECES, TIME as CARD } from '../shots/intro.mjs';

const P = Object.fromEntries(shots.map(s => [s.id, s.params])), DUR = Object.fromEntries(shots.map(s => [s.id, s.dur])), DIR = { left: -1, right: 1 };
/** Shot seconds at which a rising [[shot s, value], …] ramp (motion.mjs remap, as the shots use it) reaches v. */
function when(keys, v) {
  const f = remap(keys);
  let a = keys[0][0], b = keys.at(-1)[0];
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (f(m) < v) a = m; else b = m; }
  return (a + b) / 2;
}

// ---------------------------------------------------------------- Act I: wake.mjs
// wake.mjs exports DROP_T, RIPPLE.rings [delay, strength], GLINTS, TIP_GLINTS, CLASH, CONTACT, BLACK. From its RAMP:
// the lunge glides CLASH + 0.25–1.4; the wind-up melts to a stop at its peak, CLASH + 1.95–2.37; the jab snaps in to CONTACT.
const WAKE = { drop: wake.DROP_T, rings: wake.RIPPLE.rings, clash: wake.CLASH, tips: wake.TIP_GLINTS.at, contact: wake.CONTACT, black: wake.BLACK,
  lunge: [wake.CLASH + 0.25, wake.CLASH + 1.4], peak: [wake.CLASH + 1.95, wake.CLASH + 2.37] };
// One sound per wake.mjs GLINTS entry, in its order: [pan (the glint's screen x), pitch, size, cold]. Ivory stands
// left, Charcoal right.
const GLINT_SOUNDS = [
  [-0.3, 1, 1.2],                                                                         // the front Ivory Pawn's spear tip
  [0.45, 1.25, 0.6, true], [0.47, 1.33, 0.6, true],                                       // the Charcoal Guard's visor slit
  ...[0, 1, 2, 3, 4, 5].map(i => [0.45, 1.5 + i * 0.07, 0.42]),                          // light runs along the Beast's teeth
  [-0.3, 0.9, 0.75], [0.25, 1.06, 0.75], [-0.33, 0.84, 0.75], [0.22, 1.12, 0.75],         // lance tips
  [-0.5, 0.95, 0.6], [0.28, 1.19, 0.6],                                                   // both Knights' spear tips
  [0.7, 0.72, 0.4], [0.72, 0.8, 0.4], [0.68, 1.4, 0.45, true],                            // the Rook's eyes, the Maester's lens
  [-0.66, 1.18, 0.7, true],                                                               // the Ivory King's crown
  [-0.3, 1.19, 0.9],                                                                      // the attacker's tip answers, into the cut
];
if (GLINT_SOUNDS.length !== wake.GLINTS.length) throw new Error('cues: GLINT_SOUNDS needs one entry per wake.mjs GLINTS entry');
const GLINTS = wake.GLINTS.map(([t], i) => [t, ...GLINT_SOUNDS[i]]);

// ---------------------------------------------------------------- Act II: intro.mjs
// intro.mjs exports TIME (card beats after the freeze; before the resume) and PIECES: ramp / after are [shot s, board
// ms] keys, the freeze is the last ramp key and the resume the first after key; reveal is the name's start after the
// freeze. Board ms of each move from the game (scene.mjs, court-motion.mjs). Names, reveal styles and whips come from
// the timeline params.
const FREEZE_LEAD = 0.45;
/** The name reveals (MOTION.md, motion.mjs drawTitle): a sound on every titleHits() time; x is the name's pan. The tings
 *  follow the score's chord under each card (score.mjs INTROS): the Archer's ignitions rise in D minor, the scan ticks in G minor. */
const spread = (i, n) => ((i + 0.5) / n - 0.5) * 0.45;
const sheen = (at, x) => [at, 'gild', { len: 0.8, gain: 0.4, from: x - 0.25, to: x + 0.25 }];   // drawTitle's light sweep
const REVEAL = {
  arrow: (h, x) => [[0, 'streak', { pan: [x - 0.5, x + 0.35] }], ...h.map((t, i) => [t, 'ignite', { pan: x + spread(i, h.length), pitch: [1, 1.1892, 1.3348, 1.4983, 1.7818, 2][i % 6], seed: i }]), sheen(1.05, x)],
  bite: (h, x) => [...h.map((t, i) => [t, 'chomp', { pan: x + spread(i, h.length), pitch: 1 + 0.04 * i, seed: i, gain: 1.4 }]), sheen(1.1, x)],
  scan: (h, x, n) => [[h[0], 'scan', { len: h[1] - h[0] - 0.02, pan: x }],
    ...[...Array(n)].map((_, i) => [h[0] + 0.03 + ((h[1] - h[0] - 0.06) * i) / n, 'tick', { pan: x + spread(i, n), pitch: [1, 1.3348, 1.5874][i % 3] }]),
    [h[1], 'gild', { len: 0.45, from: x - 0.25, to: x + 0.25 }]],                                // gold floods left to right
  shove: (h, x) => [[h[0] - 0.3, 'ram', { lead: 0.3, pan: [-0.95, x] }], sheen(1.0, x)],
  stand: (h, x) => [[0, 'gust', { strike: h[0], pan: x }], [h[1], 'gild', { cold: true, len: 0.47, from: x - 0.25, to: x + 0.25 }]],
};
const INTROS = {
  // The bolt leaves at 180 ms and freezes a hair short of the Knight; it strikes (440 ms) as time resumes.
  archer: { card: 'left',
    move: (c, tf) => [[c(180), 'bowShot', { pan: -0.25 }], [c(180), 'boltFly', { len: tf - c(180), pan: [-0.2, 0.1] }]],
    land: c => [[c(440), 'boltHit', { pan: 0.3 }]] },
  // A chain of three: bite i lands at (i + 0.36) × CHAIN_STEP 560 ms; the second one hangs in slow motion.
  beast: { card: 'left',
    move: c => [[c(-150), 'snarl', { len: 0.45, pan: -0.3 }], [c(201.6), 'chomp', { big: true, pan: -0.15 }], [c(761.6), 'chomp', { big: true, pan: 0.05, seed: 1, pitch: 0.75 }]],
    land: c => [[c(1321.6), 'chomp', { big: true, pan: 0.25, seed: 2, duck: 0.3 }]] },
  // A brisk swap (0–1100 ms), then court.BEAM from 1100: on at +280, apart at +840 (the resume), off by +1000.
  maester: { card: 'left',
    move: (c, tf) => [[c(0) + 0.01, 'swap', { len: c(1100) - c(0) }], [c(1380), 'beam', { len: tf - c(1380), fadeOut: 0.02, pan: 0.1 }]],
    land: (c, tr) => [[tr, 'beam', { len: c(2100) - tr, on: false, fadeIn: 0.03, fadeOut: 0.12, pan: 0.1 }], [c(1940), 'apart', { pan: 0.3 }]] },
  // He steps in (0–300 ms), the thrust starts on the beat and meets the Knight at 780; the Knight slides 780–1140 ms.
  ogre: { card: 'right',
    move: c => [[c(280), 'ogreStep', { pan: 0.2 }], [c(520), 'shove', { lead: c(780) - c(520), pan: 0.05 }]],
    land: (c, tr) => [[tr, 'slide', { len: c(1140) - tr, pan: [-0.1, -0.4] }]] },
  // Staged: the Queen's hurricane spins up and charges (SPIN travel 250–780 ms), breaks on the Guard at 780 (the
  // resume) and is thrown back from 1150.
  guard: { card: 'right',
    move: (c, tf) => [[0.02, 'storm', { len: tf - 0.02, pan: [-0.5, 0.05] }]],
    land: c => [[c(780), 'stormBreak', { pan: 0.15 }], [c(1150), 'whip', { len: 0.45, dir: -1, gain: 0.7 }]] },
};
function intro(id) {
  const p = INTROS[id], q = PIECES[id], { name, reveal: style, whipOut } = P[id], [tf, frozen] = q.ramp.at(-1), [tr] = q.after[0];
  const c = ms => when(ms <= frozen ? q.ramp : q.after, ms), side = p.card === 'left' ? 1 : -1, x = 0.45 * side, r0 = tf + (q.reveal ?? CARD.reveal);
  const hits = titleHits({ letters: [...name] }, style);   // a stand-in for the laid-out name: only the letter count matters
  return [
    ...p.move(c, tf),
    [tf - FREEZE_LEAD, 'freeze', { lead: FREEZE_LEAD, hold: tr - tf }],
    [tf + CARD.banner[0], 'banner', { from: -side }],                                               // from the figure's side
    ...REVEAL[style](hits, x, [...name].length).map(([t, s, o]) => [r0 + t, s, o]),
    [tr - CARD.out.banner[0], 'whip', { len: 0.45, dir: -side, gain: 0.8 }],                              // the card whips out, into the resume
    [tr, 'resume', { duck: 0.35 }],                                                             // a piece's hit on the resume rides this duck
    ...p.land(c, tr),
    ...(whipOut ? [[DUR[id] - CARD.whip[1], 'whip', { len: 2 * CARD.whip[1], dir: DIR[whipOut] }]] : []),   // peaks on the cut
  ];
}

// ---------------------------------------------------------------- Act III: montage.mjs
// The montage lists its own sync points (CUES: [shot s, label]); each label becomes sounds here. Mirrored: REEL.open
// (the windows melt 0.25 s after the jackpot) and that a cut opens 0.25 s before its hit.
const CUT_WHIP = 0.2;
const FILE = f => -0.6 + (1.2 * 'abcdefgh'.indexOf(f)) / 7;
const SCALE = [1, 1.1225, 1.1892, 1.3348, 1.4983, 1.5874, 1.8877, 2];   // D E F G A Bb C# D from D6: the score's run up the reel stops
function montage() {
  const cues = [], spin = MONTAGE.find(([, l]) => l.startsWith('whip down'))?.[0] ?? 4.75;
  const stops = MONTAGE.filter(([, l]) => /^(tick|jackpot) /.test(l)).map(([t]) => t - spin);
  const next = (t, kind) => MONTAGE.find(([u, l]) => u > t && l.startsWith(kind))[0];
  for (const [t, label] of MONTAGE) {
    const kind = label.split(' ')[0], what = (label.match(/\((.*)\)/) ?? [])[1];
    if (kind === 'whip') {
      const d = label.split(' ')[1];
      if (t > 0) cues.push([t - 0.55 * CUT_WHIP, 'whip', { len: CUT_WHIP, dir: DIR[d] ?? 0, pitch: d === 'down' ? 0.8 : 1, gain: 0.8 }]);   // at 0: the Guard's whip-out
      if (d === 'down') cues.push([t, 'reelSpin', { stops }]);
    } else if (kind === 'slam') cues.push([t, 'quake', { duck: 0.25 }]);
    else if (kind === 'slash') cues.push([t - 0.08, 'slash', { lead: 0.08 }]);
    else if (kind === 'hammer') cues.push([t, 'hammer', { duck: 0.25 }]);
    else if (kind === 'landing') cues.push([t - 0.25, 'leap', { len: 0.25 }], [t, 'land']);                            // the cut opens mid-air
    else if (kind === 'gale') cues.push([t - 0.25, 'storm', { len: 0.75, spin: 9, hot: true, gain: 0.6 }], [t, 'stormBreak', { eyes: false, gain: 0.8 }]);
    else if (kind === 'freeze') cues.push([t, 'frost', { len: next(t, 'shatter') - t }]);
    else if (kind === 'shatter') cues.push([t, 'shatter', { duck: 0.25 }]);
    else if (kind === 'tick') cues.push([t, 'reelStop', { pan: FILE(what[0]), pitch: SCALE[stops.indexOf(t - spin)] }]);
    else if (kind === 'jackpot') cues.push([t, 'reelStop', { pan: FILE(what[0]), pitch: 2, last: true, duck: 0.3 }], [t + 0.25, 'whoosh', { len: 0.45, f: [1500, 4200], gain: 0.35 }]);
    else if (kind === 'drop') cues.push([t, 'armyLand', { seed: 0 }]);
    else if (kind === 'army') cues.push([t, 'armyLand', { heavy: true, seed: 1, duck: 0.2 }]);
    else if (label === 'crane starts') cues.push([t, 'whoosh', { len: next(t, 'crane settles') - t, f: [250, 900], gain: 0.7, pan: [0, 0] }]);   // an air swell
  }
  return cues;
}

// ---------------------------------------------------------------- Act IV: kings.mjs
// RING (gather, ignite, close, angles, launch), DEAL (land, gap; a thrown card flies 0.447 s: its spring's arrival),
// LINEUP, HOLO.delay, HAND (rise, fan, flip; a flip turns in 0.4 s: wind + its spring's arrival), HERO, CHARGE.pulses,
// METEOR (burst, impact, ramp, fall), WHITE, and the title's white clearing (title.mjs WHITE.clear).
const RING = { gather: [0.1, 0.5], ignite: [0.5, 0.75, 1.0, 1.25], close: 1.5, angles: [-135, 135, 45, -45], launch: 0.45 };
const ringPan = a => 0.31 * Math.cos((a * Math.PI) / 180);   // an emblem's pan: the ring's 300 px radius over the 960 px half-frame
const DEAL = { land: 2.25, gap: 0.25, fly: 0.447, pan: [-0.6, -0.2, 0.2, 0.6] }, HOLO_DELAY = 0.125;
const HAND = { rise: 4.0, fan: 4.5, flip: [5.25, 5.5, 5.75], turn: 0.4, drop: 6.0, pan: [-0.35, -0.12, 0.35] };   // Leap, Rescue, Flight
const HERO = { lift: 6.25, face: 7.0 }, CHARGE = [7.0, 7.5, 7.75, 7.875, 7.9375, 7.96875];
const METEOR = { burst: 8.0, impact: 9.0, ramp: [[8.0, 0], [8.3, 0.34], [8.48, 0.44], [8.7, 0.475], [8.84, 0.56], [9.0, 0.73]], fall: 1.15 };
const WHITE = { spread: 9.12, full: 9.58, cut: 10, clear: 0.5 };
function kings() {
  const land = i => DEAL.land + i * DEAL.gap, path = remap(METEOR.ramp), end = path(METEOR.impact), fuse = RING.close - RING.ignite[0];
  return [
    [RING.gather[0], 'suck', { len: RING.gather[1] - RING.gather[0], gain: 0.5, pan: ringPan(RING.angles[0]) }],     // light gathers
    [RING.ignite[0], 'fuse', { len: fuse, pan: t => ringPan(RING.angles[0] - (360 * t) / fuse) }],                    // the fuse runs round
    ...['fireIgnite', 'frostIgnite', 'earthIgnite', 'airIgnite'].map((s, i) => [RING.ignite[i], s, { pan: ringPan(RING.angles[i]) }]),
    [RING.close, 'ringClose', { duck: 0.2 }],
    ...DEAL.pan.map((p, i) => [land(i) - DEAL.fly, 'deal', { len: DEAL.fly, pan: [0.3 * p, p], seed: i, pitch: [1, 1.189, 1.498, 2][i] }]),
    ...DEAL.pan.map((p, i) => [land(i) - RING.launch, 'emblemFly', { len: RING.launch, pan: [ringPan(RING.angles[i]), p], seed: i, pitch: [1, 1.189, 1.498, 2][i] }]),
    ...DEAL.pan.map((p, i) => [land(i) + HOLO_DELAY, 'holoOn', { len: METEOR.impact + 0.4 - land(i) - HOLO_DELAY, pan: p, seed: i, gain: 0.25 }]),   // mix: a bed under the harp
    [HAND.rise, 'whoosh', { len: 0.5, f: [600, 2200], gain: 0.5 }],                                               // the hand rises
    [HAND.fan, 'riffle'],                                                                                           // and snaps open
    ...HAND.flip.map((t, k) => [t - HAND.turn, 'cardFlip', { len: HAND.turn, pan: HAND.pan[k], pitch: 1 + 0.06 * k }]),
    [HAND.drop, 'whoosh', { len: 0.52, f: [2200, 500], shape: 'out', gain: 0.45 }],                                // the rest fall away
    [HERO.lift, 'cardFlip', { len: HERO.face - HERO.lift, big: true, pan: [0.1, 0.25] }],                         // Strike turns to the camera
    [CHARGE[0], 'charge', { len: METEOR.burst - CHARGE[0], pan: 0.25 }],
    ...CHARGE.map((t, i) => [t, 'pulse', { pan: 0.25, gain: 0.6 + 0.1 * i }]),
    [METEOR.burst, 'burst', { pan: 0.25, duck: 0.3 }],
    [METEOR.burst, 'meteor', { len: METEOR.impact - METEOR.burst, pan: [0.25, -0.55], gain: 0.7, k: t => (path(METEOR.burst + t) / end) ** METEOR.fall }],   // mix: a lighter roar, so the impact stands out
    [METEOR.impact, 'impact', { pan: -0.4, gain: 0.85, duck: 0.75 }],                                             // mix: stays under the title hit
    [METEOR.impact, 'holoGlitch'],
    [WHITE.spread, 'whiteOut', { rise: WHITE.full - WHITE.spread, hold: WHITE.cut - WHITE.full, fall: WHITE.clear + 0.3 }],   // into the title
  ];
}

// ---------------------------------------------------------------- Act V: title.mjs
// GLINT [rise, peak, gone], SWORD (settle, back, hang), IMPACT, CTA_AT, SWEEP, FADE_OUT (the shot is 7 s).
const TITLE = { glint: [0.88, 1.0, 1.3], back: [1.0, 1.2], hang: 1.28, impact: 1.5, cta: 3.5, sweep: [4.5, 5.9], dur: 7, fade: 1 };

export const CUES = {
  wake: [
    [WAKE.drop[0], 'lightFall', { len: WAKE.drop[1] - WAKE.drop[0] }],
    [WAKE.drop[1], 'lightLand'],
    ...WAKE.rings.map(([d, s], i) => [WAKE.drop[1] + d, 'torchSwell', { gain: s / 1.5, seed: i }]),
    [WAKE.drop[1], 'torchBed', { len: WAKE.clash - WAKE.drop[1] + 0.03, fadeIn: 2.5, fadeOut: 0.03 }],
    ...GLINTS.map(([t, pan, pitch, size, cold]) => [t, 'glint', { pan, pitch, size, cold }]),
    [WAKE.clash, 'torchBed', { len: WAKE.black - WAKE.clash, fadeIn: 0.02, fadeOut: 0.008, gain: 1.5, seed: 40 }],   // closer fire; cut dead at black
    ...WAKE.tips.map((t, i) => [t, 'glint', { pan: -0.2, pitch: 0.9 + 0.1 * i, size: 0.8 }]),                          // the Pawn's lance tip
    [WAKE.lunge[0], 'lunge', { len: WAKE.lunge[1] - WAKE.lunge[0] + 0.3 }],
    [WAKE.peak[0], 'suck', { len: WAKE.peak[1] - WAKE.peak[0] + 0.03, gain: 0.6 }],                                    // time nearly stops
    [WAKE.peak[1], 'whoosh', { len: WAKE.contact - WAKE.peak[1], shape: 'in', f: [400, 2400], pan: [-0.3, 0.1] }],     // the jab snaps in
    [WAKE.contact, 'lanceHit', { cut: WAKE.black - WAKE.contact, pan: 0.1 }],                                          // then silence until the boom
  ],
  archer: [[0, 'boom', { duck: 0.25 }], ...intro('archer')],   // a light duck: the score's first hit lands with it
  beast: intro('beast'),
  maester: intro('maester'),
  ogre: intro('ogre'),
  guard: intro('guard'),
  montage: montage(),
  kings: kings(),
  title: [
    [TITLE.glint[0], 'bladeGlint', { len: TITLE.glint[2] - TITLE.glint[0], peak: (TITLE.glint[1] - TITLE.glint[0]) / (TITLE.glint[2] - TITLE.glint[0]) }],
    [TITLE.back[0], 'suck', { len: TITLE.back[1] - TITLE.back[0] }],                                                  // the draw-back; it hangs
    [TITLE.hang, 'whoosh', { len: TITLE.impact - TITLE.hang, shape: 'in', f: [700, 3000], gain: 1.2, pan: [0, 0] }],   // the drop
    [TITLE.impact, 'crownHit', { gain: 1.25 }],                                                                         // no duck: the score hits with it
    [TITLE.impact + 0.05, 'embers', { len: TITLE.dur - TITLE.impact - 0.05, fadeOut: TITLE.fade + 0.5 }],
    [TITLE.cta, 'gild', { len: 1.1, gain: 0.5, from: -0.25, to: 0.25, pitch: 1.2 }],                                   // the call to action
    [TITLE.sweep[0], 'gild', { len: TITLE.sweep[1] - TITLE.sweep[0], gain: 0.3, from: -0.3, to: 0.3 }],                // the light sweep
    [TITLE.dur - 3.5, 'wind', { len: 3.4, gain: 0.5 }],                                                                  // the tail into silence
  ],
};

// The hard cut to black: silence from the black until the boom opens the next shot.
export const HUSH = { wake: [[WAKE.black, DUR.wake]] };
