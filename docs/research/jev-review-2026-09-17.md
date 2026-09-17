# Jev rule review — 2026-09-17

Method: four focused review passes ("agents"), each a **claim check against the project's measured
numbers**, run in the one configuration that has passed known-answer controls in this project
(LESSONS.md): raw evidence in the state, one claim per question, a known-true and a known-false
control in the same call. A statement is *endorsed* only at support ≥ 0.7; a theme whose controls
fail is dropped and said so. The final section is an explicitly caveated advisory vote, not a check.

## 1. Verification results

### Current rules and pieces (shipped v0.7)

- **endorsed** (median 0.94, 3/3 runs) — The guard is the game's draw engine: near-immortal in practice, and each extra guard adds about 10-20 draw points.
  - evidence: guard survival 93%, +10-20 draw points per guard, shove rate near zero
- **endorsed** (median 0.79, 3/3 runs) — The beast is largely ornamental at depth 3: it never moves in 20% of games and its chains are a highlight, not a force (0.8% of games).
  - evidence: utilisation 0.45, 20% never move, chain share 0.8%
- **endorsed** (median 0.83, 3/3 runs) — The linear evaluation prices the archer at 337 cp while the odds-match bound is under 1.5 pawns (150 cp): the two methods disagree about the archer.
  - evidence: eval 337 cp vs odds bound < 1.5 pawns
- **endorsed** (median 0.97, 3/3 runs) — Most draws under the shipped rules are quiet adjudicated endings rather than automatic material dead ends.
  - evidence: recent 80k games: adjudicatedDraw 17810 vs drawMaterial 593 and stalemate 21
- **endorsed** (median 0.97, 3/3 runs) — White's pooled score under the shipped rules is about 0.53 in recent depth-3 runs.
  - evidence: 0.53 across many runs; decisive share ~0.72

### Rejected and superseded rules

- **endorsed** (median 0.89, 3/3 runs) — Rejecting the two-square Warden still follows from the data: it drags draws from about 40.5% to 52%.
  - evidence: draw side-games 40.5% -> 52.0%, decisive -2.7 points
- **endorsed** (median 0.72, 2/3 runs) — Both home-rank guard double steps remain rejected: each drags drawn games to about 52% like the Warden did.
  - evidence: slide 51.5%, leap 51.9% drawn games
- **endorsed** (median 0.95, 3/3 runs) — The double-first-turn rejection stands, and its numbers must stay qualified because the search assumed alternating movers.
  - evidence: White 0.533 -> 0.472; search alternation defect documented
- **endorsed** (median 0.76, 3/3 runs) — Not adopting maesterSwapAny is a taste call, not a data call: the measured cost is that kings move less, not balance.
  - evidence: balance/draws unchanged, branching +6.1, 16.6% -> 25.4% games where kings never move
- **not endorsed** (median 0.38, 0/3 runs) — The Death Touch result justifies testing its alternative reading (keeping the displacement capture as well) before judging the power's intent.
  - evidence: delivered reading lowers decisive share at both depths

### Tested candidates and campaign results

- **endorsed** (median 0.76, 3/3 runs) — At depth 3 the paired decisive gain is positive for Darkness, March, Leap and Mercy, and negative for Death Touch; Holy Light is inside its interval.
  - evidence: depth3 points: darkness [15.4,3.9], march [13.2,3.0], leap [7.4,2.9], mercy [5.4,3.2], holylight [0.1,1.8], deathtouch [-5.0,2.7]
- **not endorsed** (median 0.52, 0/3 runs) — At depth 4 only Mercy's decisive interval includes zero; Darkness, March, Leap and Death Touch exclude it, Death Touch on the negative side.
  - evidence: depth4 points: darkness [13.3,5.4], march [7.5,6.1], leap [10.5,6.3], mercy [1.3,7.5], deathtouch [-9.8,5.0]
- **not endorsed** (median 0.24, 0/3 runs) — In the depth-4 push-vs-repel A/B the paired White-score difference is +4.9 +/- 3.1 points (base 0.516, push 0.564), where the depth-3 difference was -1.1 +/- 2.7 points.
  - evidence: push vs repel: depth3 white -0.011 +/- 0.027; depth4 white +4.9 +/- 3.1
- **endorsed** (median 0.90, 3/3 runs) — The Catapult's implied value is below 1.66 pawns at the re-seeded price, and its land-vs-stay balance intervals include zero.
  - evidence: stay reseeded: -100 +/- 37 Elo vs knight, below 1.66 pawns; land-vs-stay score +0.016 +/- 0.028, decisive -0.009 +/- 0.028
- **not endorsed** (median 0.22, 0/3 runs) — The Q6 candidate met every acceptance criterion: gate score 0.724; decision +139.2 +/- 13.7 Elo (positive lower bound); depth-4 +149.3 +/- 37.2 (same sign); speed 1 s depth 5.92 against the required 5.
  - evidence: gate score 0.724; decision +139.2 +/- 13.7 Elo; depth4 +149.3 +/- 37.2; 1s depth 5.92 against linear 6.08
- **endorsed** (median 0.85, 3/3 runs) — The liveliness filter's held-out gain is 3.8 decisive points, while the guard appears in 27.4% of kept games instead of 45.7% and the maester in 55.9% instead of 74.9%.
  - evidence: held-out +3.8 (95% 3.1..4.5); diversity table all vs kept half

## 2. Conclusions these facts support (owner's call, not model-endorsed)

Jev endorses facts; it refuses evaluative conclusions ("not adoptable", "strongest") because the
numbers alone do not entail them — the value judgment is the owner's. The reports' conclusions, so
the reader has them beside the facts: Death Touch's reading runs against the avoid-draws priority and
its alternative reading is worth testing; Ogre push is promising but its White shift needs pricing;
no Catapult reading is worth adopting now; the Q6 candidate is adoptable; the liveliness filter costs
the guard and maester their frequency for a few decisive points. None of these is model-endorsed.

## 3. Advisory vote (opinion, not validated)

- **next_ab** → `ogre_push_repricing` (confidence 0.42; p = ogre_push_repricing 0.51, kings_darkness 0.28, maester_swapany 0.13, kings_march 0.04, deathtouch_alternative 0.02, none 0.02)
- **hidden_risk** → `A` (confidence 0.97; p = A 0.97, M 0.02, none 0.01, G 0.00, S 0.00, L 0.00)

## 4. What this is, and how to read "not endorsed"

Jev's contribution here is *screening and consistency checking over the measured evidence*, not new
measurement. The numbers belong to the balance lab; the model says which statements the evidence
supports. Endorsed statements still depend on the evidence object in this file, which is a condensed
copy of the reports — read those for detail: `sim-kings-2026-09-16.md`, `sim-new-pieces-2026-09-14.md`,
`ai-q6-acceptance-2026-09-16.md`, `setup-liveliness-2026-09-14.md`, `RULES.md`, `RUNS.md`.

**Calibration (three runs per theme, stable controls).** The model confirms direction claims
(positive/negative, larger/smaller) and simple numeric facts, but it consistently refuses two classes
even when they are arithmetically true, checked by hand:
1. **Interval arithmetic** — "does point ± err exclude zero" (the depth-4 interval statement).
2. **Long acceptance conjunctions** — "met criterion A and B and C" (the Q6 statement).
Both were verified independently by `tools/verify-claims.mjs` at 0.90 support; the refusals here are
an instrument limit, not evidence against the statements. A genuinely evaluative claim ("this
justifies testing X") is refused for a different reason: the numbers do not entail a value judgment.

**Deleted after failed controls** (do not trust): game-pattern classification, rule red-teaming,
guide-text checking and document triage (LESSONS.md 2026-09-16/17).
