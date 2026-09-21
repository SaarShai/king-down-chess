# Capital package C1+C2+C3+C4: all four zone rules together (2026-09-17)

The capital rules were measured one at a time: `guardNoCapital` (C1) moved decisive +0.3 ± 0.3
(`docs/research/sim-guard-2026-09-17.md`), `guardCapitalStep` (C3) +0.2 ± 0.4
(`docs/research/sim-capital-2026-09-17.md`), `pawnCapitalCapture` (C4) +2.4 ± 3.0 on decisive
(`docs/research/sim-capital-c4-2026-09-17.md`), and only `capitalSanctuary` (C2) moved a deciding
metric, draws −3.8 ± 3.1 at depth 3, unconfirmed at depth 4
(`docs/research/sim-capital-c2-2026-09-17.md`). This report measures the **package**: all four rules
on at once, so the capital is a real zone and no single rule hides behind another. Question: does the
zone change the game — decisive share, draws, fairness — or do the four rules cancel out or stay
inert even together?

## The package

All four are lab booleans, off by default:

- **C1 `guardNoCapital`** — a guard may not end a move on a capital square.
- **C2 `capitalSanctuary`** — no capture can take a piece standing on a capital square
  (d4 e4 d5 e5).
- **C3 `guardCapitalStep`** — a guard standing in the capital gains the second square of each ray.
- **C4 `pawnCapitalCapture`** — a pawn standing in the capital captures straight ahead.

C1 and C3 change guard move generation, C2 changes capture generation for every piece, C4 adds one
pawn capture. The package tests them together because C2's protection is what lets C1's and C4's
pieces survive in the capital and what C3's guard could exploit.

## Method

Depth 3, exactly as prescribed:

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-pack --experiment ab --games 1600 --sample 40 \
  --depth 3 --seed 71 --workers 4 --rule "guardNoCapital=true" \
  --rule "capitalSanctuary=true" --rule "guardCapitalStep=true" \
  --rule "pawnCapitalCapture=true"
```

Control arm `pb-ab-cap-pack.base` runs today's defaults; 1,600 games per population, the same 40
arrangements and opening seeds in both (common random numbers). The difference column is the mean of
(rule − base) over the 40 shared arrangements with a 95% normal interval. Raw table:
`sim/out/pb-ab-cap-pack.experiment.md`.

The deciding metrics are decisive share, draw rate and white score (fairness). At depth 3, draw rate
left its interval (−0.029 ± 0.025), so the protocol ran the depth-4 confirmation:

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-pack-d4 --experiment ab --games 400 --sample 40 \
  --depth 4 --seed 72 --workers 4 --rule "guardNoCapital=true" \
  --rule "capitalSanctuary=true" --rule "guardCapitalStep=true" \
  --rule "pawnCapitalCapture=true"
```

Raw table: `sim/out/pb-ab-cap-pack-d4.experiment.md`.

## Depth 3 (1,600 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.536 | −0.025 ± 0.027 | no |
| decisive | 0.792 | 0.815 | +0.023 ± 0.027 | no |
| draw rate | 0.198 | 0.169 | −0.029 ± 0.025 | yes |
| capped | 0.010 | 0.016 | +0.006 ± 0.007 | no |
| mean plies | 110.3 | 105.7 | −4.6 ± 5.3 | no |
| interest | 0.483 | 0.489 | +0.005 ± 0.005 | yes |
| interest (min-use) | 0.483 | 0.489 | +0.007 ± 0.007 | no |

The package is structurally live. Branching factor rises 32.7 → 34.3 (+1.5 ± 0.5, confirmed),
killer move 0.331 → 0.365 (+0.033 ± 0.018), lead change 0.059 → 0.071 (+0.012 ± 0.006), and games
where a king never moved jump from 423 (26.4%) to 580 (36.3%). C2's sanctuary shows in the piece
table: pawn survival rises 41.3% → 50.1%, maester 35.0% → 53.7%, archer 51.6% → 64.9%, and pawn
captures fall 3.84 → 3.01 per game. The guard itself still never captures (0.000 → 0.000) and no
guard rampage occurs (0 games), so C1 and C3 remain inert in play. Dead-material endings rise only
14 (0.9%) → 18 (1.1%), and capped games stay near the floor (1.0% → 1.6%).

## Depth 4 (400 games per arm)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.540 | 0.537 | −0.003 ± 0.054 | no |
| decisive | 0.760 | 0.800 | +0.040 ± 0.065 | no |
| draw rate | 0.212 | 0.175 | −0.037 ± 0.066 | no |
| capped | 0.028 | 0.025 | −0.002 ± 0.025 | no |
| mean plies | 117.2 | 107.8 | −9.4 ± 8.8 | yes |
| interest | 0.466 | 0.466 | +0.002 ± 0.008 | no |
| interest (min-use) | 0.466 | 0.466 | +0.006 ± 0.015 | no |

At depth 4 the draw-rate move is the same size (−0.037) but the 400-game interval is wider
(± 0.066), so none of the three deciding metrics leaves its interval. The protocol therefore runs
no larger depth-4 arm. The depth-3 directions survive as point estimates only: decisive up, draws
down, white score flat. The structural moves confirm again — branching 30.6 → 32.7 (+2.1 ± 0.7),
mean plies 117.2 → 107.8 (−9.4 ± 8.8), kings that never moved 106 (26.5%) → 135 (33.8%) — and
dead-material endings fall 18 (4.5%) → 6 (1.5%). Guard captures stay 0.000 in both arms.

## Verdict: the package is live, the outcome is not

**The four rules together do not change how games end, at the resolution measured.** The depth-3
draw-rate move (−0.029 ± 0.025, from 19.8% to 16.9%) is the only deciding-metric result outside its
interval, and the depth-4 arm does not confirm it (draws −0.037 ± 0.066, decisive +0.040 ± 0.065,
white score −0.003 ± 0.054, all inside). Fairness is untouched at both depths: white score −0.025
± 0.027 and −0.003 ± 0.054. The rules do not cancel each other into noise; they move the board —
branching +1.5 ± 0.5 then +2.1 ± 0.7, mean plies −4.6 ± 5.3 then −9.4 ± 8.8 (confirmed at depth 4),
kings frozen in 26.4% → 36.3% of games, pawn survival 41.3% → 50.1% — but none of that converts into
a decisive, draw or fairness result that survives confirmation. On this evidence the capital package
is a play-shape rule, not an outcome rule, and stays a lab toggle.

Data: `sim/out/pb-ab-cap-pack.base.summary.json`, `sim/out/pb-ab-cap-pack.var.summary.json`,
`sim/out/pb-ab-cap-pack-d4.base.summary.json`, `sim/out/pb-ab-cap-pack-d4.var.summary.json`.
