#!/usr/bin/env -S npx tsx
/**
 * Jev scenario triage: which conditions, combinations, locations and suspected overpowered cases
 * deserve a targeted experiment? The model judges each scenario from measured or specified evidence;
 * a known-overpowered control (the Reaver's full 8-direction step, measured non-convergent) and a
 * known-acceptable control (the orthogonal reading, measured 4.04 pawns and neutral balance) anchor
 * the scale. Controls must separate or the run is discarded.
 *
 *   tsx tools/jev-conditions.ts
 *
 * Output: docs/research/jev-conditions-2026-09-17.md. Rankings route compute; they are not evidence.
 */
import { writeFileSync } from 'node:fs';
import { ask, noul, score } from './jev';

const OUT = 'docs/research/jev-conditions-2026-09-17.md';

interface Scenario { id: string; kind: 'condition' | 'combo' | 'location' | 'suspected'; name: string; evidence: string }

const SCENARIOS: Scenario[] = [
  // --- conditions (measured) ---
  { id: 'ogre_guard_heavy', kind: 'condition', name: 'Ogre in a guard-heavy army (3 guards a side)', evidence: 'measured 2026-09-17: shoves a guard 0.22 times a game (10x the normal rate) yet decisive share falls 5.8 +/- 4.3 points and draws rise to 44.5%. Moving walls does not open the game.' },
  { id: 'catapult_no_screen', kind: 'condition', name: 'Catapult when no enemy screen exists (open or empty lines)', evidence: 'measured: in 36.5% of games the Catapult never lobs at all; its capture depends on an enemy screen, so in open positions it is a slow rook.' },
  { id: 'templar_off_capital', kind: 'condition', name: 'Templar away from a capital square (96% of its moves)', evidence: 'measured: only 4% (8% with a bonus) of its moves start on a capital; off it the piece is a king-step that never captures more than 0.26 times a game.' },
  { id: 'reaver_open_board', kind: 'condition', name: 'Reaver on an open board with many capture targets', evidence: 'measured: 0.85 captures a game, survives 20.5% (the highest of the fairy pieces), 75% of its captures use the escape step; drawn share drops 7 points versus a knight control.' },
  { id: 'guard_endgame_wall', kind: 'condition', name: 'Guard wall in the ending (its chosen condition)', evidence: 'measured historically: each guard adds 10-20 draw points; guards survive 93% of games. It is the game\'s draw engine exactly when few pieces remain.' },
  // --- locations (screens; confounded, to be tested paired) ---
  { id: 'maester_beside_king', kind: 'location', name: 'Maester starting on the square next to its king', evidence: 'screens: decisive 77.5% vs 69.5% far; the batch-3 placement study measured +15 Elo for a maester beside the king; the long swap is the game\'s castling substitute.' },
  { id: 'bishop_beside_king', kind: 'location', name: 'Bishop starting next to its king', evidence: 'screens: decisive 64.0% vs 75.8% far (-12 points) — a parked bishop loses its diagonals; a candidate anti-pattern.' },
  { id: 'beast_a_file', kind: 'location', name: 'Beast starting on the a-file', evidence: 'screens: 12.0 moves and 1.67 captures a game from a1 vs about 4.5 moves and 0.5 captures from the e-file; edge beasts are far more active, but the outcome effect is unclear.' },
  { id: 'ogre_a_file', kind: 'location', name: 'Ogre starting on the a-file', evidence: 'screens: decisive 76.8% from a vs 61.2% from b (250 games each) — the largest placement spread seen, and unverified.' },
  { id: 'archer_corner', kind: 'location', name: 'Archer starting in a corner', evidence: 'screens: a-file archers 72.4% decisive and h-file 77.0% vs 74-75% centrally; the mining pass called corner archers furniture, and its PST makes edges cheap.' },
  // --- combos (hypotheses, nothing measured) ---
  { id: 'combo_ogre_beast', kind: 'combo', name: 'Ogre + Beast (shove a piece into the beast\'s capture squares)', evidence: 'hypothesis: the Ogre\'s shove can move an enemy into the beast\'s 7-square bite, creating captures that neither piece makes alone. Untested.' },
  { id: 'combo_ogre_catapult', kind: 'combo', name: 'Ogre + Catapult (shove to open or close a lob screen line)', evidence: 'hypothesis: the shove can move the enemy screen off a rank or file, changing what the Catapult sees; the screen must be an enemy, so only an enemy shove helps. Untested.' },
  { id: 'combo_templar_ogre', kind: 'combo', name: 'Templar + Ogre (shove pieces on and off capitals)', evidence: 'hypothesis: the Ogre can shove an enemy Templar off a capital or a friend onto one; both armies carry both pieces in a symmetric test. Untested.' },
  { id: 'combo_double_reaver', kind: 'combo', name: 'Two Reavers (double escape pressure)', evidence: 'hypothesis: two knights that refuse recaptures may overload the defence; the single orthogonal Reaver already adds 7 decisive points. Untested.' },
  { id: 'combo_paladin_ogre', kind: 'combo', name: 'Paladin + Ogre (shove a piece into the paladin\'s lines)', evidence: 'hypothesis: a shove can place a valuable piece into a paladin ray for a one-for-one trade. Untested.' },
  // --- suspected overpowered (one measured, one speculative) ---
  { id: 'reaver_full_step', kind: 'suspected', name: 'CONTROL — Reaver with the full 8-direction escape step', evidence: 'measured: the escape step lets it dodge every recapture, so it can take a defended piece and leave the square it attacked; the odds match will not converge even when the piece is priced at 5.04 pawns (the army still wins +188 +/- 32 Elo), which means packing on value cannot balance it. Rejected as overpowered.' },
  { id: 'reaver_ortho', kind: 'suspected', name: 'CONTROL — Reaver with the orthogonal-only step', evidence: 'measured: only orthogonal escapes, so the opponent can predict and cover the landing squares; value converges at 4.04 +/- 0.56 pawns against a knight of 2.96 with neutral balance. Accepted as the lab default.' },
  { id: 'darkness_plus_march', kind: 'suspected', name: 'Darkness and March together (a two-power variant is not built)', evidence: 'each measured alone as the two sharpening powers (decisive +15.4 and +13.2 points). No game can carry both today; a future variant could. Untested combination.' },
];

const questions: Record<string, unknown> = {};
for (const s of SCENARIOS) {
  questions[`break_${s.id}`] = {
    type: 'noul',
    instructions: `Could a player use this scenario to win by a route the opponent has no way to answer — a game-breaking pattern rather than a merely strong one? Scenario (${s.kind}): ${s.name}. Evidence: ${s.evidence}`,
    criteria: { true: 'A repeatable, unanswered winning route plausibly exists', false: 'The evidence suggests an answer exists, or the scenario is neutral' },
  };
  if (!s.id.startsWith('reaver_')) {
    questions[`test_${s.id}`] = {
      type: 'score',
      instructions: `How worthwhile is a targeted paired experiment for this scenario? Scenario (${s.kind}): ${s.name}. Evidence: ${s.evidence}`,
      criteria: ['Not worth the machine time', 'Worth a small pilot (a few hundred games)', 'Worth a full paired experiment with controls'],
    };
  }
}

const state = {
  task: 'King Down chess: triage scenarios for a targeted experiment. Conditions, piece combinations, starting locations and suspected overpowered cases. Judge from the evidence given; the Reaver controls anchor the scale.',
  note: 'Rank deliberately; the result routes where compute goes next, it is not proof.',
};

const answers = await ask(state, questions);
const B = (id: string): number => noul(answers[`break_${id}`]);
const T = (id: string): number => score(answers[`test_${id}`]);

// Controls: the measured overpowered case must look game-breaking; the accepted reading must not.
const ctl: string[] = [];
if (!(B('reaver_full_step') >= 0.6)) ctl.push(`overpowered control ${B('reaver_full_step').toFixed(2)} (want >= 0.6)`);
if (!(B('reaver_ortho') <= 0.5)) ctl.push(`acceptable control ${B('reaver_ortho').toFixed(2)} (want <= 0.5)`);
if (ctl.length) {
  console.error(`jev-conditions: CONTROL FAILED — ${ctl.join('; ')}. Instrument invalid; discarding the run.`);
  process.exit(2);
}
console.log(`jev-conditions: controls ok (overpowered ${B('reaver_full_step').toFixed(2)}, acceptable ${B('reaver_ortho').toFixed(2)})`);

const rows = SCENARIOS.map(s => ({ s, b: B(s.id), t: Number.isFinite(T(s.id)) ? T(s.id) : null }))
  .sort((a, b) => b.b - a.b || (b.t ?? 0) - (a.t ?? 0));

const md = `# Jev scenario triage — conditions, combos, locations, overpowered (2026-09-17)

One call, every scenario judged against the same evidence format, with two measured controls: the
Reaver's full 8-direction step (measured overpowered — no fixed point, +188 Elo at a 5.04-pawn price)
scored **${B('reaver_full_step').toFixed(2)}** on "could be game-breaking"; the orthogonal reading (measured
4.04 ± 0.56 pawns, neutral balance) scored **${B('reaver_ortho').toFixed(2)}** — the instruments separated, so
the ranking below is reported. It routes compute; it is not evidence.

| scenario | kind | game-breaking? | experiment worth (0–2) |
|---|---|---|---|
${rows.map(r => `| ${r.s.name} | ${r.s.kind} | ${r.b.toFixed(2)} | ${r.t === null ? '—' : r.t.toFixed(2)} |`).join('\n')}

## How to use this

- **Game-breaking ≥ 0.6 together with experiment worth ≥ 1.5** is the queue for the next paired
  experiments (four-arm factorial for a combo: neither / A / B / both, with composition and value
  held constant).
- **Location screens** (maester beside king, bishop beside king, beast on the a-file, Ogre on the
  a-file) need a paired placement test: the same army with one piece swapped between files, opening
  seeds shared, so the comparison is not confounded with rank sampling.
- Combat evidence beats this ranking every time it exists; the Reaver controls are the proof.
`;
writeFileSync(OUT, md);
console.log(`jev-conditions: wrote ${OUT}`);
