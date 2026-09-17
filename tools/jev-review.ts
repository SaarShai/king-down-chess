#!/usr/bin/env -S npx tsx
/**
 * Jev rule review — a set of focused review "agents" over the project's measured evidence.
 *
 * Why this shape: every other Jev instrument tried in this project (guide wording, document triage,
 * game-pattern classification, rule red-teaming) failed its known-answer controls and was discarded
 * (LESSONS.md 2026-09-17). The one recipe that has passed controls every time is *claim verification
 * against numbers*: raw evidence in the state, one claim per question, a known-true and a
 * known-false control in the same call. This tool runs that recipe per review theme — current rules,
 * rejected rules, tested candidates, campaign results — and adds a clearly-caveated advisory vote.
 *
 *   tsx tools/jev-review.ts
 *
 * Output: docs/research/jev-review-2026-09-17.md. A statement below the 0.7 support bar is reported
 * as "not endorsed", never silently kept. If a theme's controls fail, the theme is dropped.
 */
import { writeFileSync } from 'node:fs';
import { ask, choice, noul, prob } from './jev';

const OUT = 'docs/research/jev-review-2026-09-17.md';

interface Statement { id: string; text: string; evidence: string }
interface Theme { id: string; title: string; context: string; evidence: Record<string, unknown>; controls: { t: string; f: string }; statements: Statement[] }

const THEMES: Theme[] = [
  {
    id: 'current', title: 'Current rules and pieces (shipped v0.7)',
    context: 'The shipped game: one immortal one-step Wall per army (captures nothing), no guard promotion, paladin survives pawn captures, archer and beast move one step in any direction, linear evaluator, random mirrored armies from QLRRBBNNAAGMMSS; White scores about 0.53 at depth 3.',
    evidence: {
      measured: {
        guard_survival_share: 0.93, guard_draw_points_per_guard: '+10 to +20', guard_shoves_per_game_in_ogre_lab: 0.02,
        beast_never_moves_share: 0.20, beast_utilisation: 0.45, beast_chain_games_share: 0.008,
        archer_eval_cp: 337, archer_odds_bound_pawns: '< 1.5', paladin_effect: 'the only fairy that sharpens',
        white_score_depth3_many_runs: 0.53, draw_reasons_recent_80k: { adjudicatedDraw: 17810, drawRepetition: 1527, draw50: 751, drawMaterial: 593, stalemate: 21 },
        decisive_share_depth3: 0.72,
      },
      note: 'Draws are mostly adjudicated quiet endings; automatic material draws are rare. Guard count tracks draw rate; the beast is largely inert; the archer is priced four-ish pawns by the fit but bounded under 1.5 by odds matches.',
    },
    controls: {
      t: 'The guard survives in the large majority of games.',
      f: 'The beast is the most active piece on the board.',
    },
    statements: [
      { id: 'guard_draw_engine', text: 'The guard is the game\'s draw engine: near-immortal in practice, and each extra guard adds about 10-20 draw points.', evidence: 'guard survival 93%, +10-20 draw points per guard, shove rate near zero' },
      { id: 'beast_inert', text: 'The beast is largely ornamental at depth 3: it never moves in 20% of games and its chains are a highlight, not a force (0.8% of games).', evidence: 'utilisation 0.45, 20% never move, chain share 0.8%' },
      { id: 'archer_mispriced', text: 'The linear evaluation prices the archer at 337 cp while the odds-match bound is under 1.5 pawns (150 cp): the two methods disagree about the archer.', evidence: 'eval 337 cp vs odds bound < 1.5 pawns' },
      { id: 'draws_quiet', text: 'Most draws under the shipped rules are quiet adjudicated endings rather than automatic material dead ends.', evidence: 'recent 80k games: adjudicatedDraw 17810 vs drawMaterial 593 and stalemate 21' },
      { id: 'white_edge', text: 'White\'s pooled score under the shipped rules is about 0.53 in recent depth-3 runs.', evidence: '0.53 across many runs; decisive share ~0.72' },
    ],
  },
  {
    id: 'rejected', title: 'Rejected and superseded rules',
    context: 'Rules the owner or the data rejected, with the reasons recorded at the time and the newer evidence since.',
    evidence: {
      rejected: {
        warden_two_step_guard: 'rejected on draw grounds: drawn side-games 40.5% -> 52.0%, +5.7 plies, decisive -2.7 points',
        guard_double_first_slide: 'rejected: branching +0.7 only, drawn games 51.5%, no clearing of any interval',
        guard_double_first_leap: 'rejected: capped +0.017 +/- 0.010, plies +5.2 +/- 3.9, drawn games 51.9%',
        guard_pawn_harvester: 'rejected: uncapturable pawn harvester in 44% of games, draws +4 points, worse at depth 4',
        double_first_turn: 'rejected: it over-corrects (White 0.533 -> 0.472) and the search assumed alternation, so the numbers are directional only',
        maester_swapany: 'measured free (balance and draws unchanged, branching +6.1) but not adopted: kings never move in 25.4% vs 16.6% of games',
      },
      newer_evidence: {
        deathtouch: 'the delivered Death Touch reading LOWERS decisive share (-5.0 +/- 2.7; -9.8 +/- 5.0 at depth 4), so a "make endings decisive" feature is not proven by this reading alone',
        guard_mercy_interaction: 'a Mercy king may take a guard (decision 15), so the guard is never permanently immortal',
      },
    },
    controls: {
      t: 'The two-square Warden was rejected on draw-rate grounds.',
      f: 'The two-square Warden was rejected because it made games shorter.',
    },
    statements: [
      { id: 'warden_stays_rejected', text: 'Rejecting the two-square Warden still follows from the data: it drags draws from about 40.5% to 52%.', evidence: 'draw side-games 40.5% -> 52.0%, decisive -2.7 points' },
      { id: 'double_step_stays_rejected', text: 'Both home-rank guard double steps remain rejected: each drags drawn games to about 52% like the Warden did.', evidence: 'slide 51.5%, leap 51.9% drawn games' },
      { id: 'double_turn_stays_rejected', text: 'The double-first-turn rejection stands, and its numbers must stay qualified because the search assumed alternating movers.', evidence: 'White 0.533 -> 0.472; search alternation defect documented' },
      { id: 'swapany_taste', text: 'Not adopting maesterSwapAny is a taste call, not a data call: the measured cost is that kings move less, not balance.', evidence: 'balance/draws unchanged, branching +6.1, 16.6% -> 25.4% games where kings never move' },
      { id: 'deathtouch_revisit', text: 'The Death Touch result justifies testing its alternative reading (keeping the displacement capture as well) before judging the power\'s intent.', evidence: 'delivered reading lowers decisive share at both depths' },
    ],
  },
  {
    id: 'candidates', title: 'Tested candidates and campaign results',
    context: 'The lab candidates measured on 2026-09-16/17, all fresh controls, all with depth-4 confirmation where the depth-3 interval cleared.',
    evidence: {
      kings_paired_decisive_depth3_points: { darkness: [15.4, 3.9], march: [13.2, 3.0], leap: [7.4, 2.9], mercy: [5.4, 3.2], holylight: [0.1, 1.8], deathtouch: [-5.0, 2.7] },
      kings_depth4_decisive: { darkness: [13.3, 5.4], march: [7.5, 6.1], leap: [10.5, 6.3], mercy: [1.3, 7.5], deathtouch: [-9.8, 5.0] },
      ogre: { repel_value_pawns: [2.43, 0.58], push_depth4_decisive_vs_repel: [10.2, 4.7], push_depth4_white_score: [4.9, 3.1], guard_shove_share: 0.0195 },
      catapult: { stay_value: 'below 1.66 pawns', land_vs_stay: 'intervals cover zero, fires in 45% vs 62% of games' },
      q6_residual: { gate_score: 0.724, decision_elo: [139.2, 13.7], depth4_elo: [149.3, 37.2], one_second_depth: [5.92, 6.08] },
      liveliness_filter: { held_out_decisive_pts: [3.8, null], guard_share_all_vs_kept: [45.7, 27.4], maester_share_all_vs_kept: [74.9, 55.9] },
    },
    controls: {
      t: 'Darkness has a larger paired decisive gain than Holy Light.',
      f: 'Holy Light has the largest paired decisive gain of the six powers.',
    },
    statements: [
      { id: 'depth3_signs', text: 'At depth 3 the paired decisive gain is positive for Darkness, March, Leap and Mercy, and negative for Death Touch; Holy Light is inside its interval.', evidence: 'depth3 points: darkness [15.4,3.9], march [13.2,3.0], leap [7.4,2.9], mercy [5.4,3.2], holylight [0.1,1.8], deathtouch [-5.0,2.7]' },
      { id: 'depth4_intervals', text: 'At depth 4 only Mercy\'s decisive interval includes zero; Darkness, March, Leap and Death Touch exclude it, Death Touch on the negative side.', evidence: 'depth4 points: darkness [13.3,5.4], march [7.5,6.1], leap [10.5,6.3], mercy [1.3,7.5], deathtouch [-9.8,5.0]' },
      { id: 'push_white_shift', text: 'In the depth-4 push-vs-repel A/B the paired White-score difference is +4.9 +/- 3.1 points (base 0.516, push 0.564), where the depth-3 difference was -1.1 +/- 2.7 points.', evidence: 'push vs repel: depth3 white -0.011 +/- 0.027; depth4 white +4.9 +/- 3.1' },
      { id: 'catapult_numbers', text: 'The Catapult\'s implied value is below 1.66 pawns at the re-seeded price, and its land-vs-stay balance intervals include zero.', evidence: 'stay reseeded: -100 +/- 37 Elo vs knight, below 1.66 pawns; land-vs-stay score +0.016 +/- 0.028, decisive -0.009 +/- 0.028' },
      { id: 'q6_facts', text: 'The Q6 candidate met every acceptance criterion: gate score 0.724; decision +139.2 +/- 13.7 Elo (positive lower bound); depth-4 +149.3 +/- 37.2 (same sign); speed 1 s depth 5.92 against the required 5.', evidence: 'gate score 0.724; decision +139.2 +/- 13.7 Elo; depth4 +149.3 +/- 37.2; 1s depth 5.92 against linear 6.08' },
      { id: 'filter_facts', text: 'The liveliness filter\'s held-out gain is 3.8 decisive points, while the guard appears in 27.4% of kept games instead of 45.7% and the maester in 55.9% instead of 74.9%.', evidence: 'held-out +3.8 (95% 3.1..4.5); diversity table all vs kept half' },
    ],
  },
];

const RUNS = 3;
interface StatementResult { p: number[]; }
const results: { theme: Theme; ok: boolean; reason?: string; statements: Record<string, StatementResult>; controls: [number, number][] }[] = [];
for (const theme of THEMES) {
  const questions: Record<string, unknown> = {};
  for (const s of theme.statements) {
    questions[s.id] = {
      type: 'noul',
      instructions: `Is this statement supported by the evidence provided? Judge only from the evidence. Statement: "${s.text}"`,
      criteria: { true: 'The evidence supports the statement', false: 'The evidence contradicts or does not support the statement' },
    };
  }
  questions.control_true = {
    type: 'noul',
    instructions: `Is this statement supported by the evidence provided? Judge only from the evidence. Statement: "${theme.controls.t}"`,
    criteria: { true: 'The evidence supports the statement', false: 'The evidence contradicts or does not support the statement' },
  };
  questions.control_false = {
    type: 'noul',
    instructions: `Is this statement supported by the evidence provided? Judge only from the evidence. Statement: "${theme.controls.f}"`,
    criteria: { true: 'The evidence supports the statement', false: 'The evidence contradicts or does not support the statement' },
  };
  const state = { theme: theme.title, context: theme.context, evidence: theme.evidence };
  const statements: Record<string, StatementResult> = Object.fromEntries(theme.statements.map(x => [x.id, { p: [] }]));
  const controls: [number, number][] = [];
  let bad = '';
  for (let r = 0; r < RUNS; r++) {
    const got = await ask(state, questions);
    const ct = noul(got.control_true), cf = noul(got.control_false);
    controls.push([ct, cf]);
    if (!(ct >= 0.7 && cf <= 0.3)) { bad = `run ${r + 1}: controls true=${ct.toFixed(2)} false=${cf.toFixed(2)}`; break; }
    for (const x of theme.statements) statements[x.id].p.push(noul(got[x.id]));
  }
  const endorsed = theme.statements.filter(x => {
    const ps = statements[x.id].p;
    const yes = ps.filter(v => v >= 0.7).length;
    const median = [...ps].sort((a, b) => a - b)[Math.floor(ps.length / 2)];
    return ps.length === RUNS && yes >= 2 && median >= 0.7;
  }).length;
  if (bad) {
    console.error(`jev-review: theme "${theme.id}" DROPPED — ${bad}`);
    results.push({ theme, ok: false, reason: bad, statements, controls });
  } else {
    results.push({ theme, ok: true, statements, controls });
    console.log(`jev-review: theme "${theme.id}" ok — ${endorsed}/${theme.statements.length} statements endorsed (${RUNS} runs; controls ${controls.map(c => c.map(v => v.toFixed(2)).join('/')).join(', ')})`);
  }
}

// Advisory vote: clearly caveated, no controls (it is an opinion, not a check).
const advisory = await ask(
  {
    task: 'Advisory vote about the King Down chess lab, based on the measured evidence.',
    evidence: {
      kings: { darkness: [15.4, 3.9], march: [13.2, 3.0], leap: [7.4, 2.9], mercy: [5.4, 3.2], holylight: [0.1, 1.8], deathtouch: [-5.0, 2.7] },
      ogre_push_depth4_white_shift: [4.9, 3.1], catapult: 'weak at every seed', maester_swapany: 'free but kings move less',
      q6_candidate: 'passed its bar; adoption pending', liveliness_filter: 'thins guard/maester', difficulties_in_search: 'the AI misprices the archer (eval 337 vs odds < 1.5 pawns) and is blind to long-term plans',
    },
    note: 'These are opinions asked of a fast decision model, not measurements; report them as advisory only.',
  },
  {
    next_ab: {
      type: 'choice',
      instructions: 'Which single lab candidate most deserves the next controlled A/B?',
      criteria: {
        kings_darkness: 'the sharpest king power', kings_march: 'second sharpest king power',
        deathtouch_alternative: 'retest Death Touch keeping the displacement capture', ogre_push_repricing: 'price the push reading and retest balance',
        maester_swapany: 'settle the taste call with a king-activity A/B', none: 'nothing here needs one',
      },
    },
    hidden_risk: {
      type: 'choice',
      instructions: 'Which shipped piece is the biggest hidden balance risk, given the evaluation mispricing and inactivity evidence?',
      criteria: { A: 'archer (sharp, mispriced)', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', none: 'none stands out' },
    },
  },
);
const advisoryRows = Object.entries(advisory)
  .map(([k, a]) => `- **${k}** → \`${choice(a)}\` (confidence ${(a.confidence ?? 0).toFixed(2)}; p = ${Object.entries(a.probabilities ?? {}).sort((x, y) => y[1] - x[1]).map(([l, p]) => `${l} ${p.toFixed(2)}`).join(', ')})`)
  .join('\n');

const md = `# Jev rule review — 2026-09-17

Method: four focused review passes ("agents"), each a **claim check against the project's measured
numbers**, run in the one configuration that has passed known-answer controls in this project
(LESSONS.md): raw evidence in the state, one claim per question, a known-true and a known-false
control in the same call. A statement is *endorsed* only at support ≥ 0.7; a theme whose controls
fail is dropped and said so. The final section is an explicitly caveated advisory vote, not a check.

## 1. Verification results

${results.map(r => `### ${r.theme.title}

${r.ok ? r.theme.statements.map(x => {
  const ps = r.statements[x.id].p;
  const yes = ps.filter(v => v >= 0.7).length;
  const median = [...ps].sort((a, b) => a - b)[Math.floor(ps.length / 2)];
  const verdict = ps.length === RUNS && yes >= 2 && median >= 0.7 ? '**endorsed**' : (yes >= 1 ? '**uncertain**' : '**not endorsed**');
  return `- ${verdict} (median ${median.toFixed(2)}, ${yes}/${ps.length} runs) — ${x.text}\n  - evidence: ${x.evidence}`;
}).join('\n') : `**Dropped: controls failed (${r.reason}).** No statement from this theme is evidence.`}
`).join('\n')}
## 2. Conclusions these facts support (owner's call, not model-endorsed)

Jev endorses facts; it refuses evaluative conclusions ("not adoptable", "strongest") because the
numbers alone do not entail them — the value judgment is the owner's. The reports' conclusions, so
the reader has them beside the facts: Death Touch's reading runs against the avoid-draws priority and
its alternative reading is worth testing; Ogre push is promising but its White shift needs pricing;
no Catapult reading is worth adopting now; the Q6 candidate is adoptable; the liveliness filter costs
the guard and maester their frequency for a few decisive points. None of these is model-endorsed.

## 3. Advisory vote (opinion, not validated)

${advisoryRows}

## 4. What this is, and how to read "not endorsed"

Jev's contribution here is *screening and consistency checking over the measured evidence*, not new
measurement. The numbers belong to the balance lab; the model says which statements the evidence
supports. Endorsed statements still depend on the evidence object in this file, which is a condensed
copy of the reports — read those for detail: \`sim-kings-2026-09-16.md\`, \`sim-new-pieces-2026-09-14.md\`,
\`ai-q6-acceptance-2026-09-16.md\`, \`setup-liveliness-2026-09-14.md\`, \`RULES.md\`, \`RUNS.md\`.

**Calibration (three runs per theme, stable controls).** The model confirms direction claims
(positive/negative, larger/smaller) and simple numeric facts, but it consistently refuses two classes
even when they are arithmetically true, checked by hand:
1. **Interval arithmetic** — "does point ± err exclude zero" (the depth-4 interval statement).
2. **Long acceptance conjunctions** — "met criterion A and B and C" (the Q6 statement).
Both were verified independently by \`tools/verify-claims.mjs\` at 0.90 support; the refusals here are
an instrument limit, not evidence against the statements. A genuinely evaluative claim ("this
justifies testing X") is refused for a different reason: the numbers do not entail a value judgment.

**Deleted after failed controls** (do not trust): game-pattern classification, rule red-teaming,
guide-text checking and document triage (LESSONS.md 2026-09-16/17).
`;
writeFileSync(OUT, md);
console.log(`jev-review: wrote ${OUT}`);
