# Phase 2 — Paladin substitution and counterplay

Artifact paths below are relative to `/Users/za/.local/share/king-down-supervised-20260922/integration`.

**6,000 games verified: 5,996 full endings, four 512-ply caps.** Eighty fixed arrangements, 2,000 physical games per arm. Replace one designated slot with Paladin, Knight or Maester in both armies; keep every other piece and square fixed. Each file has ten setups. Both players use the same frozen residual evaluator, 50 ms per move, four random opening plies and no adjudication. Actual non-mate median reported depth is 4 in every arm.

This measures a substitution in equal-army play, not a material price or a piece added for free. Outcome estimates condition on complete ended pairs; capped outcomes remain unknown. Intervals resample whole setups. All three arms passed source/spec/start identity and full legal/event/ending replay. Independent Python means match the paired contrasts.

| Designated piece | White score | 95% interval | Checkmate share | Moved by ply 20 | Never moved | Legally immobile owner turns |
|---|---:|---:|---:|---:|---:|---:|
| Paladin | 54.03% | 51.29–56.84% | 79.41% | 80.32% | 1.98% | 0.29% |
| Knight | 50.27% | 47.77–52.69% | 82.16% | 91.25% | 0.49% | 2.18% |
| Maester | 48.23% | 45.59–50.85% | 83.57% | 64.55% | 2.13% | 1.27% |

Activity follows the designated original piece through swaps, shoves and captures; another piece of the same type does not stand in for it. Immobility is measured only while that piece survives and its owner has a turn, so lifetimes differ. Legal availability, voluntary development and usefulness are different questions.

| Paired contrast | White-score change | 95% interval | Checkmate-share change | 95% interval |
|---|---:|---:|---:|---:|
| Paladin − Knight | +3.85 points | -0.15 to +7.95 | -2.82 points | -6.15 to +0.34 |
| Paladin − Maester | +5.85 points | +2.22 to +9.60 | -4.15 points | -7.12 to -1.23 |

The Paladin comparison against Maester shows a White-score shift and fewer checkmates at these settings. The Knight comparison remains uncertain. The effects are not a universal Paladin value or proof of unavoidable first-player advantage. Paired estimates differ slightly from subtracting displayed arm means because caps remove different matched pairs.

File, near/far king and Archer/Beast/Guard-presence tables are retained in `campaign/results/phase-2-analysis.json`. They are exploratory subgroups with small setup counts and multiple comparisons; do not select a placement rule from a favourable interval.

## Twenty-four strongest-looking openings

The 24 selected White advantages were +543 to +1,220 centipawns in the original games. Deeper searches at those late positions left them ahead. But from Black’s first reply, longer play avoided the original large advantage in all 24 short branches. At 400 ms, the final White scores ranged −523 to +125, median −24; all branches were unfinished after 20 additional plies. Several early exposed Paladins could simply be captured. These are available finite-budget defenses, not proofs of forced outcomes.

White used the Paladin in 21 of the selected prefixes and captured with it in 18; eleven included a Queen captured by the Paladin. That identifies a tactic to discuss, not its frequency in normal play. The four random opening plies are a material condition of the full-game study. An extreme selected line containing an ignored threat cannot by itself establish a rules flaw. Details, exact prefixes and both branch points: `campaign/phase-2-opening-review.md`. There are 96 separately counted diagnostic continuations, never pooled with the 6,000 full games.

## Decision

Keep the Paladin rule. Its White-score signal deserves attention, particularly against the Maester comparator, but the evidence does not establish failure of credible counterplay. Use the prepared early/late human exercises to test whether players see the available replies and understand the pawn-survival/sacrifice rule. The 24 cases have 48 playable entry points; nine browser checks and all 152 human-pack position checks pass. Zero real participant responses have been recorded.

Evidence: `campaign/phase-2-evidence.json`; calculations `campaign/results/phase-2-analysis.json`; selected lines and independent selection review in `campaign/results/phase-2-*defenses*.json`; human pack `campaign/human/README.md`. No new abilities, prices or defaults were adopted.
