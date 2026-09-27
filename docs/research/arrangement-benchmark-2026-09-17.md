# Arrangement benchmark — pre-registered criteria (2026-09-17)

Designer's question: **which first rows make the most interesting, most creative games?** This file
fixes the criteria **before** the data is collected, so the ranking cannot be chosen after the fact.

## What is being ranked

Starting arrangements (8-letter back ranks drawn from the pool, mirrored for both sides). Each
arrangement is played by the lab as a *config*: the report carries one row per arrangement with the
interest terms, and the stored games carry the event counters.

## The criteria (all from the lab's analyzer unless noted)

| # | criterion | why it proxies "interesting / creative" |
|---|---|---|
| 1 | **interest (residualised on draw rate)** | the project's composite; residualising stops "more decisive" from passing as "more interesting" |
| 2 | **min utilisation** / **fairyUse** | every piece gets used — no dead weight on the first row |
| 3 | **killer move** | share of games with a turning-point move (a plan that actually flips the game) |
| 4 | **lead change** | comebacks: the game is not decided by the opening |
| 5 | **uncertainty late** | the result is still open deep into the game (suspense) |
| 6 | **drama** | evaluation swings |
| 7 | **decisiveness, with low excess** | games end in a result, not by dragging; `excessDecisiveness (resid.)` must not be positive |
| 8 | **fairness** | `abs(white score − 0.5) ≤ 0.03` — a fun arrangement must not be decided by the draw |
| 9 | **event diversity** (computed from stored games) | fairy actions per game: archer shots, beast chains, maester swaps, paladin sacrifices, promotions, checks — how many of the game's mechanics are engaged |
| 10 | **stability** | the arrangement's rank must survive a second independent sample (Spearman over the shared arrangements) and a depth-4 re-run of the finalists |

## Ranking rule (fixed now)

1. Discard arrangements that fail criterion 8 (fairness) or whose capped-game share exceeds 5%.
2. Among the rest, rank by **interest (resid.)**; break ties by min utilisation, then by event
   diversity.
3. Report the top 20 and the bottom 20 with their full criteria table.
4. Extract placement **features** per arrangement (queen present; guard present; guard's file
   distance to the king; archers adjacent vs apart; maester adjacent to the king; number of distinct
   piece types; pawn-row contact) and report which features separate the top from the bottom.
5. Finalists: re-run the top 10 at **depth 4** and keep only those whose interest stays in the top
   half.

## Runs

- Sweep A: 400 sampled arrangements, 5 successive-halving rounds at depth 3 (8,000 games/round),
  seed 91.
- Sweep B (stability): 200 sampled arrangements, 4 rounds, seed 92 — compared with A on the
  arrangements they share.
- Finalists: depth-4 arms of the top 10 from the ranked list.

Logs and per-round reports land in `sim/out/arr-*`. The final write-up is
`docs/research/arrangement-benchmark-2026-09-17.md`.
