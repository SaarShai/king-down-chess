# No adjudication: the same rules played to their own end — 2026-09-17

The lab ends most games itself. `adjudicate` resigns a side that holds ±600 cp for 3 plies and
declares a draw when the score stays within ±20 cp for 8 plies after ply 68 (`src/sim/spec.ts:15`).
The corpus census found 75.2–83.4% of draws end by adjudication
(`sim-corpus-census-2026-09-17.md`). This route reruns the shipped rules with adjudication off and
compares the two readings.

Method: `node_modules/.bin/tsx src/sim/run.ts --id pb-noadj --games 1600 --sample 40 --depth 3
--seed 71 --workers 4 --noadjudicate`. The flag spelling `--noadjudicate` is confirmed in
`src/sim/spec.ts:201` (`if (f.noadjudicate) base.adjudicate = false`). The control is
`sim/out/pb-ab-G-nocap.base.jsonl` / `.summary.json`: 1,600 games, shipped rules, seed 71,
sample 40, depth 3, ply cap 300. Both arms use the same 40 sampled arrangements. On inspection the
files share all 1,600 `gameId`s, and all 1,600 games sit on the same arrangement at the same
`gameId`, but the control was produced with `commonSeeds: true` (`src/sim/experiments.ts:294`), so
only 1/1,600 games also shares the same per-game seed. The comparison is therefore two samples of
one design (same arrangements), not a paired test; no paired interval is quoted.

## Headline comparison

| metric | control (adjudicated) | no adjudication | difference |
|---|---|---|---|
| games | 1,600 | 1,600 | — |
| white score | 0.5413 | 0.5328 | −0.0085 |
| decisive | 1,266 (79.12%) | 1,395 (87.19%) | +129 (+8.06 pts) |
| draws | 334 (20.88%) | 205 (12.81%) | −129 (−8.06 pts) |
| capped | 7 (0.44%) | 36 (2.25%) | +29 (+1.81 pts) |
| mean plies | 110.8 | 148.9 | +38.1 (+34.4%) |

## End reasons

| reason | control | no adjudication |
|---|---|---|
| adjudicatedResign | 1,266 (79.12%) | — |
| adjudicatedDraw | 266 (16.62%) | — |
| checkmate | — | 1,395 (87.19%) |
| drawRepetition | 43 (2.69%) | 138 (8.62%) |
| draw50 | 7 (0.44%) | 16 (1.00%) |
| drawMaterial | 11 (0.69%) | 15 (0.94%) |
| plyCap | 7 (0.44%) | 36 (2.25%) |

Neither arm records a stalemate. Mean plies by reason — control: adjudicatedResign 110.9,
adjudicatedDraw 98.1, repetition 107.2, material 202.2, fifty-move 262.1, cap 300.0.
No adjudication: checkmate 146.2, repetition 116.2, material 213.9, fifty-move 259.0, cap 300.0.

## No-adjudication endings

The no-adjudication file holds 1,600 games, and all 1,600 ended without adjudication (denominator
1,600 in this section).

- Checkmate ends 1,395/1,600 (87.19%); the other 205/1,600 (12.81%) end by repetition 138
  (8.62%), ply cap 36 (2.25%), fifty-move 16 (1.00%) and dead material 15 (0.94%).
- Games hitting the 300-ply cap: 36/1,600 (2.25%).
- Mean plies of games that ended without adjudication: 148.9 over all 1,600. Checkmates average
  146.2 plies; the other 205 endings average 166.8. Excluding the 36 capped games, the mean is
  145.4 over 1,564.

## Verdict

- In the control, 100% of the decisive share is the adjudication: all 1,266 decisive games
  (79.12% of 1,600) end by `adjudicatedResign`, none by checkmate. Of the 334 control draws, 266
  (79.64%) end by `adjudicatedDraw`.
- Played to its own end, the design is more decisive, not less: 1,395 checkmates give 87.19%
  decisive against 79.12%, and the draw rate falls 8.06 points (20.88% to 12.81%, 129 games). The
  adjudicator does not create the decisive result; it stops the game earlier and files many
  endings as draws.
- Games run long when let go: mean 148.9 plies, +38.1 (+34.4%), and the ply cap claims 36 games
  (2.25%) against 7 (0.44%).
- White score moves −0.0085 (0.5413 to 0.5328). This is a two-sample reading with no paired
  interval, so treat fairness as unchanged.
