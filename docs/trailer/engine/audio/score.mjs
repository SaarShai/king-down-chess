// The music: a hybrid-orchestral temp score, 120 BPM in D minor, played by a small sampler.
// Contract: await score(ctx, { out, verb }, { start }) schedules the whole score. start maps a timeline shot id to its
// global start (s); every section below is tied to a shot id, so the music follows the edit.
//
// Samples: VS Chamber Orchestra 2: Community Edition (VSCO 2 CE) by Versilian Studios (Sam Gossner, Simon Dalzell),
// license CC0-1.0 (credit requested: Versilian Studios / Sam Gossner, http://vis.versilstudios.net/vsco-community.html).
//   Source: https://github.com/sgossner/VSCO-2-CE, commit 440300901dfe9275fd84e0b7763af1f8443ae62e (2020-08-04).
//   tools/fetch-trailer-samples.sh fetches only the files this score plays (samples() below) into the git-ignored
//   docs/trailer/assets/audio/vsco/ with a blobless sparse clone: 156 WAV files, 265 MB (a 177 MB download), from
//   Percussion/Timpani (+ Rolls), VSCO 1 Percussion/drums/bass, VSCO 1 Percussion/varMetal/Gong (1 file) and Cymbals
//   (2 files), Strings/Cello Section/spic and susvib, Strings/Solo Contrabass/Spic and SusVib, Strings/Viola Section/
//   susvib, Strings/Violin Section/susVib and Trem, Brass/F Horn/sus and stac, Brass/Tenor Trombone/sus, Brass/Tuba/sus,
//   Strings/Harp, Percussion/Glock. Rerun the script after changing the score: it fetches what the new notes need.
import { shots } from '../timeline.mjs';
import * as wake from '../shots/wake.mjs';
import { PIECES } from '../shots/intro.mjs';

// ---- Tempo, key and picture sync -------------------------------------------------------------------------------
export const TEMPO = 120, KEY = 'D minor';
const BEAT = 60 / TEMPO, STEP = BEAT / 4;   // seconds per beat and per sixteenth

// Picture beats in shot-local seconds. The wake and the intros are read from their modules; the rest is mirrored from
// the shot modules (motion pass of 2026-09-27, 10:00): re-sync it when a shot is retimed. The montage's own list is
// montage.mjs CUES.
const intros = f => Object.fromEntries(Object.entries(PIECES).map(([id, p]) => [id, f(p, id)]));
const SYNC = {
  wake: { land: wake.DROP_T[1], heart: wake.GLINTS[0][0] - 0.5, rise: wake.CLASH, black: wake.BLACK },   // the heart starts a beat before the first glint
  freeze: intros(p => p.ramp.at(-1)[0]),                          // the ramp's last key
  resume: intros(p => p.after[0][0]),                             // the after's first key
  introEnd: intros((p, id) => shots.find(s => s.id === id).dur),
  montage: {
    cuts: [0, 0.75, 1.5, 2.25, 3, 3.75], reel: 4.75,             // CUES: the whips into the six cuts, and into the reel
    stops: [5.125, 0.125], jackpot: 6,                            // seven reel ticks, one per sixteenth, then the jackpot
    drops: [6.5, 7], end: 8,                                      // the ivory pawns, then the charcoal army
  },
  kings: { ignite: [0.5, 0.75, 1, 1.25], close: 1.5, deal: 2.25, holo: 3, hand: 4, lift: 6.25,   // kings.mjs RING, DEAL,
    charge: 7, burst: 8, impact: 9, end: 10 },                    // HAND, HERO, CHARGE, METEOR
  title: { impact: 1.5, cta: 3.5, end: 7 },                       // title.mjs IMPACT, CTA_AT; silent by the end
};

// ---- Harmony and rhythm ----------------------------------------------------------------------------------------
// Voicings per orchestra group, low to high, in scientific pitch (middle C = C4). Spiccato, staccato, tremolo and
// roll patches read their group (INSTRUMENTS[].voice); an ostinato plays the group's lowest note.
const CHORDS = {
  Dm: { basses: 'D2', celli: 'D3 A3', violas: 'F4 A4', violins: 'D5 F5 A5', horns: 'D3 F3 A3', bones: 'A2 D3', tuba: 'D2', timp: 'D3' },
  Bb: { basses: 'Bb1', celli: 'Bb2 F3', violas: 'F4 Bb4', violins: 'D5 F5 Bb5', horns: 'D3 F3 Bb3', bones: 'Bb2 F3', tuba: 'Bb1', timp: 'Bb2' },
  Gm: { basses: 'G1', celli: 'G2 D3', violas: 'G4 Bb4', violins: 'D5 G5 Bb5', horns: 'D3 G3 Bb3', bones: 'G2 D3', tuba: 'G1', timp: 'G2' },
  F: { basses: 'F1', celli: 'F2 C3', violas: 'C4 F4 A4', violins: 'C5 F5 A5', horns: 'C3 F3 A3', bones: 'F2 C3', tuba: 'F2', timp: 'F2' },
  A: { basses: 'A1', celli: 'A2 E3', violas: 'C#4 E4 A4', violins: 'C#5 E5 A5', horns: 'C#3 E3 A3', bones: 'A2 E3', tuba: 'A1', timp: 'A2' },
  D: { basses: 'D2', celli: 'D3 A3', violas: 'F#4 A4', violins: 'D5 F#5 A5', horns: 'D3 F#3 A3 D4', bones: 'D3 F#3', tuba: 'D2', timp: 'D3' },
};
// One bar of sixteenths: X accent, x note, . rest. The 3+3+2 accents drive the ostinato.
const PATTERNS = {
  drive8: 'X.x.x.X.x.x.X.x.', drive16: 'XxxXxxXxXxxXxxXx', accent8: 'X.....X.....X...', accent16: 'X..X..X.X..X..X.',
  halves: 'X.......X.......', beats: 'X...X...X...X...', eighths: 'X.x.X.x.X.x.X.x.',
};
const DYN = { ppp: 0.12, pp: 0.22, p: 0.35, mp: 0.5, mf: 0.62, f: 0.75, ff: 0.88, fff: 1 };

// ---- The sections (each tied to a timeline shot id) -------------------------------------------------------------
// Act II: five 5 s blocks. The ostinato drives the move on D; at the freeze it drops out and the piece's chord swells
// under the card; at the resume it slams back on that chord with a hit. Each block adds a layer, so the court builds.
const INTROS = {
  archer: { chord: 'Dm', drive: 'drive8', accents: 'accent8', kick: 'halves', dyn: ['mf', 'f'], swell: 'mp', add: [] },
  beast: { chord: 'Bb', drive: 'drive16', accents: 'accent8', kick: 'halves', dyn: ['mf', 'f'], swell: 'mf', add: ['violins'] },
  maester: { chord: 'Gm', drive: 'drive16', accents: 'accent16', kick: 'halves', dyn: ['mf', 'f'], swell: 'mf', add: ['violins', 'horns'] },
  ogre: { chord: 'F', drive: 'drive16', accents: 'accent16', kick: 'beats', dyn: ['f', 'ff'], swell: 'f', add: ['violins', 'horns', 'brass'] },
  guard: { chord: 'A', drive: 'drive16', accents: 'accent16', kick: 'beats', dyn: ['f', 'ff'], swell: 'f', add: ['violins', 'horns', 'brass', 'lift'] },
};
// Act III: one chord and one horn note per cut (the heroic line); on the reel a run up the ticks lands the tonic on the
// jackpot, where the tutti takes D minor; drum hits on the two drop waves.
const MONTAGE = { chords: ['Dm', 'Dm', 'Bb', 'F', 'Gm', 'A'], horns: ['D3', 'A3', 'Bb3', 'A3', 'G3', 'A3'],
  violins: ['D4 D5', 'A4 A5', 'Bb4 Bb5', 'A4 A5', 'G4 G5', 'A4 A5'],   // the horn line doubled two and three octaves up
  run: { celloSpic: 'D4 E4 F4 G4 A4 Bb4 C#5 D5', harp: 'D5 E5 F5 G5 A5 Bb5 C#6 D6' } };   // the ticks, then the jackpot
// Act IV: glockenspiel and harp on the emblems, soft high strings over a D drone, the charge on A, the impact on Bb,
// a swell on A into the white. Act V: silence, then D major.
const KINGS = { glock: 'A5 D6 F6 A6', harp: 'A4 D5 F5 A5', chords: [['close', 'Dm'], ['holo', 'Bb'], ['hand', 'F'], ['lift', 'Gm']] };
const TITLE = { harp: 'D5 A5 D6 F#6 A6', glock: 'A6' };

// ---- The orchestra ---------------------------------------------------------------------------------------------
// file: VSCO path ({n} root, {v} layer, {r} round robin). notes: the recorded roots used, in VSCO's own names
// (strings, brass and glockenspiel read an octave low, so octave 1 converts to scientific pitch; the timpani are drums
// with their principal tone measured as a MIDI number, the rolls separately: they sit higher than the hits).
// layers: [VSCO layer, lowest velocity that uses it, round robins]; skip: 'root:layer' files that do not exist.
// gain (dB at fff), pan by orchestral seating, verb (reverb send), attack / release (s); sustain: long notes chain;
// lead: s from a sample's start to its attack (its -12 dB point, measured), so notes start that much early.
const INSTRUMENTS = {
  basses: { file: 'Strings/Solo Contrabass/SusVib/BKCtbss_SusVib_{n}_v{v}_rr1.wav', notes: 'F#0 G0 A#0 C1 D1 E1 F#1 G#1 A1 C#2 E2 G#2 B2', octave: 1,
    layers: [[1, 0], [3, 0.6]], lead: 0.04, gain: -4, pan: 0.35, verb: 0.2, attack: 0.15, release: 0.4, sustain: true },
  bassSpic: { file: 'Strings/Solo Contrabass/Spic/BKCtbss_Spic_{n}_v{v}_rr{r}.wav', notes: 'E0 F#0 G0 A#0 C1 D1 E1', octave: 1,
    layers: [[1, 0, 2], [3, 0.6, 2]], lead: 0.04, gain: -4, pan: 0.35, verb: 0.15, release: 0.12, voice: 'basses' },
  celli: { file: 'Strings/Cello Section/susvib/susvib_{n}_v{v}_1.wav', notes: 'C1 E1 G1 B1 D2 F2 A2 C3 E3 G3 B3 D4 F4', octave: 1,
    layers: [[1, 0], [3, 0.6]], lead: 0.08, gain: -3, pan: 0.25, verb: 0.25, attack: 0.12, release: 0.35, sustain: true },
  celloSpic: { file: 'Strings/Cello Section/spic/spic_{n}_v{v}_RR{r}.wav', notes: 'C1 E1 G1 B1 D2 F2 A2 C3 E3 G3 B3 D4 F4', octave: 1,
    layers: [[1, 0, 2], [2, 0.6, 2]], lead: 0.03, gain: -3, pan: 0.25, verb: 0.2, release: 0.12, voice: 'celli' },
  violas: { file: 'Strings/Viola Section/susvib/ViolaEns_susvib_{n}_v{v}_1.wav', notes: 'C2 D2 E2 G2 B2 D3 F3 A3 C4 E4 G4 B4 D5', octave: 1,
    layers: [[1, 0], [2, 0.6]], lead: 0.08, gain: -5, pan: 0.1, verb: 0.3, attack: 0.12, release: 0.35, sustain: true },
  violins: { file: 'Strings/Violin Section/susVib/VlnEns_susVib_{n}_v{v}.wav', notes: 'G2 A2 B2 D3 F#3 A3 C4 E4 G4 B4 D5', octave: 1,
    layers: [[1, 0], [2, 0.6]], lead: 0.1, gain: -5, pan: -0.35, verb: 0.3, attack: 0.12, release: 0.35, sustain: true },
  violinTrem: { file: 'Strings/Violin Section/Trem/VlnEns_Trem_{n}_v{v}.wav', notes: 'G2 A2 B2 D3 A3 C4 E4 G4 B4 D5', octave: 1,
    layers: [[1, 0], [2, 0.6]], lead: 0.08, gain: -7, pan: -0.35, verb: 0.3, attack: 0.03, release: 0.25, sustain: true, voice: 'violins' },
  horns: { file: 'Brass/F Horn/sus/MOHorn_sus_{n}_v{v}_1.wav', notes: 'C1 D#1 G1 A#1 D2 F2 A2 C3', octave: 1,
    layers: [[1, 0], [2, 0.45], [3, 0.75]], lead: 0.06, gain: -4, pan: -0.25, verb: 0.3, attack: 0.02, release: 0.3, sustain: true },
  hornStac: { file: 'Brass/F Horn/stac/MOHorn_stac_{n}_v{v}_rr{r}.wav', notes: 'D2 F2 A2 C3', octave: 1,
    layers: [[1, 0, 2], [2, 0.45, 2], [3, 0.75, 2]], lead: 0.02, gain: -5, pan: -0.25, verb: 0.3, release: 0.1, voice: 'horns' },
  bones: { file: 'Brass/Tenor Trombone/sus/tenortbn_sus_{n}_v{v}_1.wav', notes: 'D#1 F1 A#1 D2 F2 C3 C#3 D#3 F3', octave: 1,
    layers: [[1, 0], [2, 0.45], [3, 0.75]], lead: 0.02, gain: -4, pan: 0.2, verb: 0.3, attack: 0.015, release: 0.3, sustain: true },
  tuba: { file: 'Brass/Tuba/sus/Tuba3_sus_{n}_v{v}_rr1_Mid.wav', notes: 'A#0 D#1 F1 A#1 D2 F2 A#2', octave: 1,
    layers: [[1, 0], [2, 0.45], [3, 0.75]], lead: 0.04, gain: -4, pan: 0.3, verb: 0.25, attack: 0.015, release: 0.3, sustain: true },
  timpani: { file: 'Percussion/Timpani/Timpani{n}_Hit_v{v}_rr{r}_Sum.wav', notes: { 1: 41.7, 2: 46.68, 3: 49.29, 4: 52.12, 5: 54.19 },
    layers: [[1, 0, 2], [3, 0.45, 2], [4, 0.8, 2]], skip: ['1:4'], gain: 0, pan: -0.1, verb: 0.3, voice: 'timp' },
  timpaniRoll: { file: 'Percussion/Timpani/Rolls/Timpani{n}_Roll_v{v}_rr1_Sum.wav', notes: { 2: 47.36, 3: 49.46 },
    layers: [[3, 0], [5, 0.6]], lead: 0.01, gain: -6, pan: -0.1, verb: 0.3, attack: 0.05, release: 0.2, sustain: true, voice: 'timp' },
  bassDrum: { file: 'VSCO 1 Percussion/drums/bass/bdrum_{v}_{r}.wav',
    layers: [['pp', 0, 2], ['p', 0.3, 1], ['mp', 0.45, 2], ['f', 0.65, 2], ['ff', 0.8, 1], ['fff', 0.93, 2]], gain: 0, pan: 0, verb: 0.3 },
  gong: { file: 'VSCO 1 Percussion/varMetal/Gong/gong_hit_{v}.wav', notes: { hum: 49.55 }, layers: [['mf', 0], ['f', 0.7], ['ff', 0.85], ['fff', 0.95]], gain: -6, pan: 0.15, verb: 0.35 },
  crash: { file: 'VSCO 1 Percussion/varMetal/Cymbals/clash/crash_hit_{v}_loose.wav', layers: [['ff', 0], ['fff', 0.93]], gain: -12, pan: 0.2, verb: 0.3 },
  swell: { file: 'VSCO 1 Percussion/varMetal/Cymbals/susp/susp_hit_softmall_roll2_cresc.wav', gain: -10, pan: -0.2, verb: 0.35 },
  harp: { file: 'Strings/Harp/KSHarp_{n}_mf.wav', notes: 'B1 D2 F2 A2 C3 E3 G3 B3 D4 F4 A4 C5 E5 G5 B5 D6 F6 A6 B6', gain: -5, pan: -0.55, verb: 0.4 },
  glock: { file: 'Percussion/Glock/glock_medium_{n}.wav', notes: 'G4 C5 G5 C6 G6 C7', octave: 1, gain: -9, pan: 0.3, verb: 0.4 },
};

// ---- Levels ----------------------------------------------------------------------------------------------------
const LEVEL = -3;      // dB on the whole score: leaves the music stem peaking near -2 dBFS after the glue
// dB per section (timeline shot id), set so the moves of Act II build block by block into the montage (measured).
const LEVELS = { wake: 0, archer: 0, beast: 1.5, maester: 1, ogre: -1.5, guard: -0.5, montage: -0.3, kings: 5, title: 3 };   // montage, kings, title: mix pass (AUDIO.md)
const RANGE = 30;      // dB between fff and silence: a note's gain is RANGE × (velocity − 1) + its instrument's gain
const REF = -20;       // dBFS: every sample is normalised to this loudest-100-ms RMS first, so layers and notes match
const HIGHPASS = 25;   // Hz, on everything the score sends out
const MAX_SHIFT = 3;   // semitones a sample may be pitched
const CHAIN = { fade: 0.8, skip: 0.6, tail: 0.8 };  // long notes: crossfade (s), where repeats start, sample release kept out

// ---- The score as notes ----------------------------------------------------------------------------------------
function compose(start) {
  const notes = [];
  let shot = 0, level = 0;   // the section's start (no note sounds before it: a lead comes out of the sample) and level
  const section = id => { level = LEVELS[id]; return shot = start[id]; };
  const add = (t, inst, pitches, dyn, dur = null, o = {}) => { for (const pitch of String(pitches).split(' ')) notes.push({ t, inst, pitch, dyn, dur, after: shot, db: level, ...o }); };
  const voicing = (name, inst) => CHORDS[name][INSTRUMENTS[inst].voice ?? inst];
  const root = (name, inst) => voicing(name, inst).split(' ')[0];
  const chord = (t, name, insts, dyn, dur, o) => insts.forEach(i => add(t, i, voicing(name, i), dyn, dur, o));
  const play = (t0, t1, pat, fn) => {   // fn(time, accent) per note of the pattern, from t0 (its downbeat) until t1
    for (let k = 0; t0 + k * STEP < t1 - 1e-6; k++) if (PATTERNS[pat][k % 16] !== '.') fn(t0 + k * STEP, PATTERNS[pat][k % 16] === 'X', k);
  };

  // I. The board wakes: a D drone from the landing, a soft heartbeat, a high tremolo rising; dead stop at the black.
  { const s = section('wake'), W = SYNC.wake, o = { until: s + W.black, release: 0.012, gate: [s + W.black, 0.012] };
    add(s + W.land, 'basses', 'D2', ['ppp', 'pp', 'p'], W.black - W.land, { ...o, attack: 1.5 });
    add(s + W.land, 'celli', 'D3', ['ppp', 'pp', 'p'], W.black - W.land, { ...o, attack: 2.5 });
    for (let t = W.heart; t < W.black - BEAT; t += 2 * BEAT) {   // lub-dub once a second, growing
      const v = 0.2 + 0.25 * (t - W.heart) / (W.black - W.heart);
      add(s + t, 'timpani', 'D3', v, null, o); add(s + t, 'bassDrum', '', v, null, o);
      add(s + t + BEAT / 2, 'timpani', 'D3', v * 0.8, null, o);
    }
    add(s + W.rise, 'violinTrem', 'D5 A5', ['ppp', 'mf', 'f'], W.black - W.rise, o);
    add(s + W.rise + 1.25, 'violinTrem', 'D6', ['ppp', 'f'], W.black - W.rise - 1.25, o);
  }

  // II. The court.
  for (const [id, I] of Object.entries(INTROS)) {
    const s = section(id), tf = SYNC.freeze[id], tr = SYNC.resume[id], te = SYNC.introEnd[id], has = l => I.add.includes(l);
    const drive = (t0, t1, name) => {   // the ostinato and this block's layers, t0 its downbeat
      const o = { until: s + t1 };
      play(t0, t1, I.drive, (t, acc) => add(s + t, 'celloSpic', root(name, 'celloSpic'), I.dyn[+acc], 0.45, o));
      play(t0, t1, I.accents, t => add(s + t, 'bassSpic', root(name, 'bassSpic'), I.dyn[1], 0.45, o));
      play(t0, t1, I.accents, t => add(s + t, 'timpani', voicing(name, 'timpani'), I.dyn[0], null, o));
      play(t0, t1, I.kick, t => add(s + t, 'bassDrum', '', I.dyn[1], null, o));
      if (has('violins')) chord(s + t0, name, ['violinTrem'], I.dyn, t1 - t0, { ...o, release: 0.1 });
      if (has('horns')) play(t0, t1, I.accents, t => chord(s + t, name, ['hornStac'], I.dyn[1], null, o));
      if (has('brass')) play(t0, t1, 'accent8', t => chord(s + t, name, ['bones', 'tuba'], I.dyn[1], 0.3, { ...o, release: 0.15 }));
    };
    const hit = (t, name, big = false) => {
      add(s + t, 'timpani', voicing(name, 'timpani'), big ? 'fff' : 'ff'); add(s + t, 'bassDrum', '', big ? 'fff' : 'ff');
      chord(s + t, name, ['tuba', 'bones'], [big ? 'fff' : 'ff', 'mf'], big ? 1.6 : 0.6, { release: 0.3, sharp: true });
      if (has('horns')) chord(s + t, name, ['horns'], ['ff', 'mf'], 0.6, { release: 0.3, sharp: true });
      if (has('brass')) add(s + t, 'crash', '', 'fff');
    };
    if (id === 'archer') hit(0, 'Dm', true);   // the first big hit, on the Archer's first frame
    drive(0, tf, 'Dm');
    const card = ['basses', 'celli', 'violas', ...(has('violins') ? ['violins'] : []), ...(has('horns') ? ['horns'] : []), ...(has('brass') ? ['bones', 'tuba'] : [])];
    chord(s + tf, I.chord, card, ['pp', I.swell], tr - tf, { attack: 0.3, release: 0.12 });
    hit(tr, I.chord);
    drive(tr, te, I.chord);
    if (has('lift')) {   // into the montage: a timpani roll and a cymbal swell peak on its first frame
      add(s + te - 1, 'timpaniRoll', voicing(I.chord, 'timpaniRoll'), ['p', 'ff'], 1, { release: 0.03 });
      add(s + te, 'swell', '', 'ff', null, { align: 'peak' });
    }
  }

  // III. Everything at once: drums on the beat, a low-brass stab and a horn note on every cut, a run up the reel ticks
  // to the jackpot, where the tutti takes D minor, drum hits on the two drop waves, then a dead stop with the hall ringing.
  { const s = section('montage'), M = SYNC.montage, edges = [...M.cuts, M.reel];
    const at = t => MONTAGE.chords[Math.max(0, edges.findIndex(c => c > t + 1e-6) - 1)];
    const cut = { until: s + M.reel };
    add(s, 'crash', '', 'fff'); add(s, 'timpani', 'D3', 'fff');
    play(0, M.reel, 'drive16', (t, acc) => add(s + t, 'celloSpic', root(at(t), 'celloSpic'), acc ? 'ff' : 'f', 0.45, cut));
    play(0, M.reel, 'accent16', t => add(s + t, 'bassSpic', root(at(t), 'bassSpic'), 'ff', 0.45, cut));
    play(0, M.reel, 'beats', t => add(s + t, 'bassDrum', '', 'ff'));
    play(0, M.reel, 'eighths', (t, acc) => add(s + t, 'timpani', voicing(at(t), 'timpani'), acc ? 'ff' : 'f', null, { until: s + M.reel + 0.4 }));
    M.cuts.forEach((c, i) => {
      const next = edges[i + 1], name = MONTAGE.chords[i];
      chord(s + c, name, ['tuba', 'bones'], 'ff', 0.35, { release: 0.2, sharp: true });
      add(s + c, 'horns', MONTAGE.horns[i], ['f', 'ff'], next - c, { release: 0.1 });
      add(s + c, 'violins', MONTAGE.violins[i], ['f', 'ff'], next - c, { release: 0.1 });
      chord(s + c, name, ['violinTrem'], 'mf', next - c, { release: 0.1 });
      chord(s + c, name, ['violas'], 'f', next - c, { release: 0.1 });
    });
    const [first, gap] = M.stops, jack = M.jackpot;
    chord(s + M.reel, 'A', ['basses', 'celli'], ['mf', 'ff'], jack - M.reel, { release: 0.1 });
    add(s + M.reel, 'timpaniRoll', 'A2', ['p', 'ff'], jack - M.reel, { release: 0.05 });
    add(s + M.reel, 'violinTrem', 'A4', ['p', 'f'], first - M.reel, { release: 0.05 });
    for (const [inst, run] of Object.entries(MONTAGE.run)) run.split(' ').forEach((p, i) =>
      add(s + first + i * gap, inst, p, 'ff', gap + 0.05, { release: 0.08 }));
    add(s + jack, 'swell', '', 'ff', null, { align: 'peak' });
    add(s + jack, 'bassDrum', '', 'fff'); add(s + jack, 'timpani', 'D3', 'fff'); add(s + jack, 'crash', '', 'fff');
    add(s + M.drops[0], 'bassDrum', '', 'ff'); add(s + M.drops[0], 'timpani', 'A2', 'ff');
    add(s + M.drops[1], 'bassDrum', '', 'fff'); add(s + M.drops[1], 'timpani', 'D3', 'fff');
    chord(s + M.drops[1], 'Dm', ['tuba', 'bones'], 'ff', 0.35, { release: 0.2, sharp: true });
    const stop = { until: s + M.end, release: 0.03 };
    chord(s + jack, 'Dm', ['basses', 'celli', 'violas', 'violins', 'horns', 'bones', 'tuba'], ['f', 'ff', 'fff'], M.end - jack, stop);
    play(jack, M.end, 'drive16', (t, acc) => add(s + t, 'celloSpic', 'D3', acc ? 'ff' : 'f', 0.45, stop));
    play(jack, M.end, 'accent16', t => add(s + t, 'bassSpic', 'D2', 'ff', 0.45, stop));
    add(s + M.drops[1], 'timpaniRoll', 'D3', ['mf', 'fff'], M.end - M.drops[1], stop);
  }

  // IV. The kings.
  { const s = section('kings'), K = SYNC.kings, glock = KINGS.glock.split(' '), harp = KINGS.harp.split(' ');
    K.ignite.forEach((t, i) => { add(s + t, 'glock', glock[i], 'f'); add(s + t, 'harp', harp[i], 'f'); });
    add(s + K.close, 'basses', 'D2', ['ppp', 'pp', 'p'], K.charge - K.close, { attack: 1.5 });
    add(s + K.close, 'celli', 'D3', ['ppp', 'pp'], K.charge - K.close, { attack: 1.5 });
    const times = KINGS.chords.map(([k]) => K[k]), at = t => KINGS.chords[times.filter(u => u <= t + 1e-6).length - 1][1];
    const next = t => times.find(u => u > t + 1e-6) ?? K.charge;
    KINGS.chords.forEach(([, name], i) => chord(s + times[i], name, ['violas', 'violins'], ['pp', 'p'], next(times[i]) - times[i] + 0.15, { attack: 0.5, release: 0.4 }));
    play(K.deal, K.lift, 'eighths', (t, acc, k) => {   // the harp climbs through the chord in eighths, damped at each change
      const tones = `${voicing(at(t), 'violas')} ${voicing(at(t), 'violins')}`.split(' ');
      add(s + t, 'harp', tones[(k / 2) % tones.length], acc ? 'mp' : 'p', null, { until: s + next(t) + 0.3, release: 0.25 });
    });
    const c = K.charge, i = K.impact, hall = { gate: [s + K.end + 0.4, 0.5] };   // the white clears into silence for the title
    chord(s + c, 'A', ['basses', 'celli'], ['p', 'f'], i - c, { release: 0.05, ...hall });   // the Strike charge: a timpani
    chord(s + c, 'A', ['violinTrem', 'violas'], ['p', 'ff'], i - c, { release: 0.05, ...hall });   // roll, a string tremolo
    add(s + c, 'timpaniRoll', 'A2', ['p', 'ff'], i - c, { release: 0.05, ...hall });       // crescendo on A, through
    const white = { until: s + K.end + 0.5, release: 1, ...hall };   // the burst and the impact ring into the white
    add(s + K.burst, 'timpani', 'A2', 'ff', null, white); add(s + K.burst, 'bassDrum', '', 'f', null, white);
    add(s + i, 'swell', '', 'ff', null, { align: 'peak', ...white });
    add(s + i, 'bassDrum', '', 'fff', null, white); add(s + i, 'timpani', 'Bb2', 'fff', null, white); add(s + i, 'timpani', 'D3', 'ff', null, white); add(s + i, 'gong', 'D3', 'fff', null, white);
    chord(s + i, 'Bb', ['tuba', 'bones', 'horns'], ['fff', 'mf'], 0.7, { release: 0.4, sharp: true, ...hall });
    chord(s + i, 'A', ['violas', 'violins'], ['pp', 'mf', 'f'], K.end - i, { attack: 0.3, release: 0.35, ...hall });
  }

  // V. Title: near silence under the white, then the sword lands on D major; a harp and glockenspiel line under the
  // call to action; faded out by the end.
  { const s = section('title'), T = SYNC.title, i = s + T.impact, hold = T.end - T.impact - 0.8, o = { until: s + T.end, release: 1.2 };
    add(i, 'timpani', 'D3', 'fff', null, o); add(i, 'timpani', 'A2', 'ff', null, o); add(i, 'bassDrum', '', 'fff', null, o); add(i, 'gong', 'D3', 'fff', null, o);
    chord(i, 'D', ['tuba', 'bones', 'horns'], 'fff', 0.9, { release: 0.5, sharp: true });   // fp: a short loud hit over a long soft sustain (fff: the trailer's biggest hit)
    chord(i, 'D', ['tuba', 'bones'], ['mf', 'pp', 'ppp'], hold, { attack: 0.1, release: 0.6 });   // thins out for the harp
    chord(i, 'D', ['horns'], ['f', 'p', 'ppp'], hold, { attack: 0.1, release: 0.6 });
    chord(i, 'D', ['basses', 'celli', 'violas', 'violins'], ['mf', 'p', 'pp', 'ppp'], hold, { attack: 0.2, release: 0.6 });
    const harp = TITLE.harp.split(' ');
    harp.forEach((p, k) => add(s + T.cta + k * STEP, 'harp', p, 'f', null, o));
    add(s + T.cta + (harp.length - 1) * STEP, 'glock', TITLE.glock, 'f', null, o);
  }
  return notes;
}

// ---- The sampler -----------------------------------------------------------------------------------------------
const LIB = new URL('../../assets/audio/vsco/', import.meta.url);
const midi = p => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(p);
  if (!m) throw new Error(`score: bad pitch "${p}"`);
  return 'C D EF G A B'.indexOf(m[1]) + (m[2] === '#') - (m[2] === 'b') + 12 * (Number(m[3]) + 1);
};
const vel = d => { const v = typeof d === 'number' ? d : DYN[d]; if (!(v >= 0 && v <= 1)) throw new Error(`score: bad dynamic "${d}"`); return v; };
const ROOTS = Object.fromEntries(Object.entries(INSTRUMENTS).map(([id, I]) => [id, typeof I.notes === 'string'
  ? I.notes.split(' ').map(n => [n, midi(n) + 12 * (I.octave ?? 0)]) : Object.entries(I.notes ?? {})]));
const fileOf = (I, root, [tag], r) => I.file.replace('{n}', root ?? '').replace('{v}', tag).replace('{r}', r);
const ONE_LAYER = ['', 0];

/** The score as notes, each resolved to its samples: nearest recorded root, velocity layers, round robin. */
export function plan(start) {
  const notes = compose(start).sort((a, b) => a.t - b.t), turns = new Map();
  for (const n of notes) {
    const I = INSTRUMENTS[n.inst], roots = ROOTS[n.inst];
    if (!I) throw new Error(`score: no instrument "${n.inst}"`);
    n.vels = (Array.isArray(n.dyn) ? n.dyn : [n.dyn]).map(vel);
    let root = null, rate = 1;
    if (roots.length) {
      const want = midi(n.pitch), [name, at] = roots.reduce((a, b) => Math.abs(b[1] - want) < Math.abs(a[1] - want) ? b : a);
      if (Math.abs(want - at) > MAX_SHIFT) throw new Error(`score: ${n.inst} has no sample within ${MAX_SHIFT} semitones of ${n.pitch}`);
      root = name; rate = 2 ** ((want - at) / 12);
    }
    const layerAt = v => I.layers ? I.layers.filter(([tag, min]) => min <= v && !I.skip?.includes(`${root}:${tag}`)).at(-1) : ONE_LAYER;
    const layers = [...new Set([layerAt(Math.min(...n.vels)), layerAt(Math.max(...n.vels))])];
    n.voices = layers.map(layer => {   // soft and loud layers crossfade when a note swells across them
      const key = `${n.inst}|${root}|${layer[0]}`, turn = turns.get(key) ?? 0, rr = layer[2] ?? 1;
      turns.set(key, turn + 1);
      return { file: fileOf(I, root, layer, turn % rr + 1), rate, all: [...Array(rr)].map((_, r) => fileOf(I, root, layer, r + 1)) };
    });
  }
  return notes;
}

/** Every sample file the score can play (all round robins of the roots and layers it uses), for the fetch script. */
export function samples(start = Object.fromEntries(shots.map(s => [s.id, s.start]))) {
  return [...new Set(plan(start).flatMap(n => n.voices.flatMap(v => v.all)))].sort();
}

export async function score(ctx, bus, { start }) {
  const notes = plan(start), files = [...new Set(notes.flatMap(n => n.voices.map(v => v.file)))];
  const lib = new Map(await Promise.all(files.map(async f => [f, await load(ctx, f)])));
  const route = mixer(ctx, bus);
  for (const n of notes) schedule(ctx, route(n.inst, n.gate), lib, n);
}

async function load(ctx, file) {
  const res = await fetch(new URL(file.split('/').map(encodeURIComponent).join('/'), LIB)).catch(() => null);
  if (!res?.ok) throw new Error(`score: missing sample ${file}; run tools/fetch-trailer-samples.sh`);
  const buf = await ctx.decodeAudioData(await res.arrayBuffer()), n = buf.length, w = Math.round(0.1 * buf.sampleRate);
  const x = new Float32Array(n);
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) x[i] += d[i] / buf.numberOfChannels; }
  let peak = 0, on = 0, sum = 0, best = 0, loudest = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i]));
  while (on < n && Math.abs(x[on]) < peak * 0.01) on++;   // the sound starts at -40 dB of its peak
  for (let i = 0; i < n; i++) { sum += x[i] * x[i] - (i >= w ? x[i - w] * x[i - w] : 0); if (sum > best) { best = sum; loudest = i - w / 2; } }
  return { buf, onset: Math.max(0, on / buf.sampleRate - 0.002), norm: 10 ** (REF / 20) / Math.sqrt(best / w), loudest: Math.max(0, loudest - on) / buf.sampleRate };
}

/** Per instrument: gain → seating pan → dry out, plus a reverb send. A gated note ([time, fade]) sends into a private
 *  copy of the hall that fades out by that time, so a stop leaves true silence. Everything is high-passed. */
function mixer(ctx, bus) {
  const hp = to => { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = HIGHPASS; f.connect(to); return f; };
  const dry = hp(bus.out), wet = hp(bus.verb), chains = new Map(), gates = new Map();
  const gated = ([at, fade]) => {
    if (!gates.has(`${at}`)) {
      const hall = ctx.createConvolver(), g = ctx.createGain();
      hall.normalize = true; hall.buffer = bus.verb.buffer ?? null;
      g.gain.setValueAtTime(1, at - fade); g.gain.linearRampToValueAtTime(0, at);
      hall.connect(g).connect(bus.out); gates.set(`${at}`, hp(hall));
    }
    return gates.get(`${at}`);
  };
  return (inst, gate) => {
    const key = `${inst}|${gate?.[0] ?? ''}`;
    if (!chains.has(key)) {
      const I = INSTRUMENTS[inst], input = ctx.createGain(), pan = ctx.createStereoPanner(), send = ctx.createGain();
      pan.pan.value = I.pan; send.gain.value = I.verb;
      input.connect(pan).connect(dry); pan.connect(send).connect(gate == null ? wet : gated(gate));
      chains.set(key, input);
    }
    return chains.get(key);
  };
}

const FADE = n => Float32Array.from({ length: 32 }, (_, k) => Math.sin((n ? k : 31 - k) / 31 * Math.PI / 2));
const FADE_IN = FADE(1), FADE_OUT = FADE(0);

/** One note: a gain envelope (attack, the dynamic curve, release) over one voice per velocity layer. */
function schedule(ctx, dest, lib, n) {
  const I = INSTRUMENTS[n.inst], sus = !!I.sustain, voices = n.voices.map(v => ({ ...v, ...lib.get(v.file) }));
  const attack = n.attack ?? I.attack ?? (sus ? 0.08 : 0.003), release = n.release ?? I.release ?? (sus ? 0.3 : 0.05);
  const lead = Math.max(0, Math.min(I.lead ?? 0, n.sharp ? 0 : n.t - n.after)), skip = (I.lead ?? 0) - lead;   // a hit skips its pre-attack
  const natural = Math.min(...voices.map(v => (v.buf.duration - v.onset) / v.rate)) - skip;
  const t = n.align === 'peak' ? n.t - voices[0].loudest / voices[0].rate : n.t - lead;   // a cymbal swell peaks on the beat
  const span = n.dur ?? natural - release;                                        // the dynamic curve spans the written note
  let end = t + span;
  if (!sus) end = Math.min(end, t + natural - release);   // a one-shot never outlasts its sample
  if (n.until != null) end = Math.min(end, n.until - release);
  if (end - t < 0.004) return;
  const dynAt = u => {   // velocity at time u: the marks spread evenly over the note
    const k = n.vels.length > 1 ? Math.min(1, Math.max(0, (u - t) / span)) * (n.vels.length - 1) : 0, i = Math.min(Math.floor(k), n.vels.length - 2);
    return n.vels.length > 1 ? n.vels[i] + (n.vels[i + 1] - n.vels[i]) * (k - i) : n.vels[0];
  };
  const gain = v => 10 ** ((LEVEL + I.gain + n.db + RANGE * (v - 1)) / 20);
  const a = Math.min(attack, (end - t) / 2), times = [t + a];
  if (n.vels.length > 1) for (let u = t + a + 0.1; u < end - 0.05; u += 0.1) times.push(u);
  times.push(end);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  for (const u of times) env.gain.linearRampToValueAtTime(gain(dynAt(u)), u);
  env.gain.linearRampToValueAtTime(0, end + release);
  env.connect(dest);
  const [lo, hi] = [Math.min(...n.vels), Math.max(...n.vels)];
  voices.forEach((v, k) => {   // two layers: equal-power crossfade from the soft one to the loud one as the note swells
    const w = u => voices.length < 2 ? 1 : (x => k ? Math.sin(x * Math.PI / 2) : Math.cos(x * Math.PI / 2))((dynAt(u) - lo) / (hi - lo));
    const g = ctx.createGain();
    g.gain.setValueAtTime(v.norm * w(t), t);
    for (const u of times) g.gain.linearRampToValueAtTime(v.norm * w(u), u);
    g.connect(env);
    voice(ctx, g, v, t, end + release, sus, skip);
  });
}

/** Plays a sample from t until stop. A sustained note longer than its sample continues in overlapping copies that
 *  start past the attack, crossfaded at equal power. */
function voice(ctx, dest, { buf, onset, rate }, t, stop, sus, skip = 0) {
  for (let at = t, off = onset + skip * rate, first = true; ; first = false) {
    const src = ctx.createBufferSource(), xf = ctx.createGain(), len = (buf.duration - off) / rate - (sus ? CHAIN.tail : 0);
    src.buffer = buf; src.playbackRate.value = rate; src.connect(xf).connect(dest);
    if (!first) xf.gain.setValueCurveAtTime(FADE_IN, at, CHAIN.fade);
    const last = at + len >= stop;
    if (!last) {
      if (len < 2 * CHAIN.fade) throw new Error(`score: sample too short to sustain (${buf.duration.toFixed(2)} s, needs ${(stop - at).toFixed(2)} s from ${at.toFixed(2)})`);
      xf.gain.setValueCurveAtTime(FADE_OUT, at + len - CHAIN.fade, CHAIN.fade);
    }
    src.start(at, off); src.stop(last ? stop : at + len);
    if (last) return;
    at += len - CHAIN.fade; off = onset + CHAIN.skip;
  }
}
