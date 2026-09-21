# Beast `beastCapture=diagForward` at depth 4 (2026-09-17)

## Method

The shipped beast captures on the 7 adjacent squares except straight ahead. The 2021 reading
`beastCapture=diagForward` narrows the rule to the two forward diagonals only — pawn-like, and it
may keep capturing. The depth-3 run (`pb-ab-S-cap`) read it null on every balance and interest
metric (decisive −0.002 ± 0.022, draws +0.005 ± 0.022, mean plies −1.4 ± 2.6), so this route
repeats it at depth 4 with 1,600 games per arm, seed 72, 40 arrangements, common random numbers,
4 workers:

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-S-diagfwd-d4b --experiment ab --games 1600 --sample 40 --depth 4 --seed 72 --workers 4 --rule "beastCapture=diagForward"
```

Control arm `pb-ab-S-diagfwd-d4b.base`, variant arm `pb-ab-S-diagfwd-d4b.var`
(`sim/out/pb-ab-S-diagfwd-d4b.experiment.md`). Capture counters parse the stored JSONL with a
throwaway script under `/tmp` that sums the `x` segments of every `S…` LAN capture move; the
counter matched `events.beastChains` in all 6,400 games read.

## Depth 4 (1,600 games per population, seed 72)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.546 | +0.005 ± 0.020 | no |
| decisive | 0.756 | 0.769 | +0.013 ± 0.023 | no |
| draw rate | 0.227 | 0.218 | −0.009 ± 0.021 | no |
| capped | 0.017 | 0.013 | −0.004 ± 0.011 | no |
| mean plies | 116.3 | 111.5 | −4.8 ± 4.0 | yes |
| interest | 0.464 | 0.462 | −0.002 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.458 | +0.001 ± 0.009 | no |

The depth-3 run against the same depth-4 numbers, paired means (rule − base):

| metric | depth 3, 1,600/arm | depth 4, 1,600/arm |
|---|---|---|
| decisive | −0.002 ± 0.022 | +0.013 ± 0.023 |
| draw rate | +0.005 ± 0.022 | −0.009 ± 0.021 |
| white score | +0.014 ± 0.023 | +0.005 ± 0.020 |
| mean plies | −1.4 ± 2.6 | −4.8 ± 4.0 |
| interest | −0.002 ± 0.004 | −0.002 ± 0.003 |
| interest (min-use) | −0.004 ± 0.006 | +0.001 ± 0.009 |

Balance is null at both depths: at depth 4 the decisive, draw and white-score intervals contain
zero, as they did at depth 3. The pace estimate doubles and is the only metric that now excludes
zero: −4.8 ± 4.0 plies, a 4.1% shortening of the 116.3-ply base game. Interest is flat under both
readings (−0.002 ± 0.003 and +0.001 ± 0.009), so the rule does not make the game less interesting
at this sample.

## Capture counters

Counted per game over all 1,600 stored games of each arm (total capture steps in brackets):

| counter (per game) | base | with the rule | change |
|---|---|---|---|
| beast capture steps | 1.206 (1,930) | 0.533 (853) | −0.673 (−55.8%) |
| beast capture moves | 1.028 (1,644) | 0.489 (783) | −0.539 (−52.4%) |
| games with ≥1 beast capture | 735 (45.9%) | 528 (33.0%) | −12.9 points |

The depth-3 arms for comparison (`pb-ab-S-cap.base/.var.jsonl`): 1.254 → 0.766 capture steps per
game (−38.9%), 0.993 → 0.675 capture moves, 51.4% → 46.1% of games with at least one beast
capture. The suppression deepens with search depth, from −38.9% at depth 3 to −55.8% at depth 4:
deeper search steers both sides away from the two capture diagonals more effectively.

The report tables agree: `S` captures per game 1.21 → 0.53 at depth 4 (1.25 → 0.77 at depth 3),
`beastChainCaptures` 1.21 → 0.53, `beastChainMoves` 1.03 → 0.49. Every other piece keeps its
capture rate (P 3.59 → 3.63, N 1.55 → 1.61, R 1.67 → 1.78, Q 0.82 → 0.80, L 1.30 → 1.32), so
the population's net capture loss is the beast's own. The beast's moves also fall (10.32 → 8.81
per game) while its survival rises (46.2% → 51.1%).

## What the drop means for the piece

Under the shipped rule the beast is a mid-pack capturer (1.21 per game, beside the king's 1.20
and the bishop's 1.52). Under the pawn-style rule it drops to 0.53 — below the queen's 0.80 and
above only the guard's 0.00 — and it is used less (10.32 → 8.81 moves per game). It survives more
often (46.2% → 51.1%), consistent with a piece that trades less. It remains a live capture threat
in 33.0% of games, but with roughly half its capture volume gone it becomes a pawn-like diagonal
flanker rather than a main capturing piece.

## Verdict

**Balance-neutral at depth 4, but not a no-op: the pawn-style rule keeps the game balanced and
interesting while more than halving the beast's captures.** Decisive +0.013 ± 0.023, draws
−0.009 ± 0.021 and white score +0.005 ± 0.020 all include zero, matching the depth-3 nulls, and
interest holds (−0.002 ± 0.003; interest min-use +0.001 ± 0.009). The one significant move is mean
plies, −4.8 ± 4.0, the depth-3 direction (−1.4 ± 2.6) at twice the size and now excluding zero.
The counters show why this is not an invisible simplification: capture steps fall 55.8%
(1.206 → 0.533 per game) and the share of games with any beast capture falls from 45.9% to 33.0%.
If the intent is the 2021 pawn-like reading, the rule is safe on the tested balance and interest
axes; if the intent was a neutral code simplification, reject it, because the piece measurably
loses its dominant function. This design (each population plays itself) measures character, not
strength, so it does not answer whether the restricted beast is the weaker piece.
