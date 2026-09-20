# Pool composition: two beasts vs one under current rules

Rules stamp 2026-09-17, depth 3. Compiled 2026-09-20.

The beast was just re-priced from 3.08 to 3.77 pawns (odds match, converged) and is neutral
on decisiveness — its chains are a marker, not a cause (`docs/research/sim-beast-chains-2026-09-17.md`).
The shipped pool `QLRRBBNNAAGMMSS` holds **two** beasts. This asks whether the army still
needs two.

## Method

- Arms are the shipped pool against the same pool minus one beast. `two` plays
  `QLRRBBNNAAGMMSS` (15 letters, 2×`S`); `one` plays `QLRRBBNNAAGMMS` (14 letters, 1×`S`).
  The pools differ only in one beast.
- Both arms: 2,000 games, depth 3, 4 random opening plies, ply cap 300, 40 back ranks
  sampled from the pool, seed 86, common random numbers, 4 workers, sequential runs.
  Both arms therefore share every gameId and every opening seed, so the comparison is paired
  at the game level. `pairs` stays off (both sides use one engine), as the runner reported.
- Commands, from the repo root (the specs carry the same settings; the CLI only sets workers;
  the loader has no `--workers` in the spec, so it is a flag):

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-beast-2026-09-17/two.json --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/pool-beast-2026-09-17/one.json --workers 4
```

- Spec bodies (identical except `id` and `pool`):

```json
{
  "id": "beastpool-two",
  "games": 2000,
  "backRanks": { "sample": 40, "pool": "QLRRBBNNAAGMMSS" },
  "ai": { "depth": 3 },
  "seed": 86,
  "commonSeeds": true
}
```

```json
{
  "id": "beastpool-one",
  "games": 2000,
  "backRanks": { "sample": 40, "pool": "QLRRBBNNAAGMMS" },
  "ai": { "depth": 3 },
  "seed": 86,
  "commonSeeds": true
}
```

- Outputs: `sim/out/beastpool-two.{jsonl,summary.json}` (932.3 s) and
  `sim/out/beastpool-one.{jsonl,summary.json}` (915.4 s).
- Analysis: throwaway script under `/tmp` (`/tmp/beastpool-analyse.mjs`, `/tmp/beastpool-robust.mjs`).
  Pooled rates carry a 95% Wilson interval; paired differences are per-game means of
  `two - one` over the 2,000 shared gameIds with a 95% normal interval. `result` is White's
  score: 1 win, 0.5 draw, 0 loss.

## Pooled results (2,000 games per arm)

| metric | two beasts | one beast | difference (pooled) |
|---|---:|---:|---:|
| decisive | 0.7900 (0.7716–0.8073) | 0.8010 (0.7829–0.8179) | −0.0110 |
| draw rate | 0.2100 (0.1927–0.2284) | 0.1990 (0.1821–0.2171) | +0.0110 |
| white score | 0.5310 (0.5091–0.5528) | 0.5480 (0.5261–0.5697) | −0.0170 |
| mean plies | 110.40 | 106.25 | +4.16 |
| capped games | 17 (0.85%) | 12 (0.60%) | +0.25 pp |

Decision reasons: `two` — adjudicatedResign 1,580, adjudicatedDraw 324, drawRepetition 54,
draw50 15, plyCap 17, drawMaterial 10. `one` — adjudicatedResign 1,602, adjudicatedDraw 286,
drawRepetition 70, drawMaterial 17, draw50 13, plyCap 12.

## Paired differences (per gameId, n = 2,000)

| metric | paired difference (two − one) | 95% interval | consequential |
|---|---:|---|---|
| decisive | −0.0110 | ±0.0252 | no |
| draw rate | +0.0110 | ±0.0252 | no |
| white score | −0.0170 | ±0.0275 | no |
| mean plies | +4.16 | ±3.02 | pace only, see below |
| capped | +0.0025 | ±0.0083 | no |

Dropping the second beast moves decisiveness +1.1 points, draws −1.1 points and White's score
+1.7 points. Every interval contains zero. A config-level pairing (mean per sampled arrangement,
n = 40) widens the intervals as expected: decisive −0.0110 ±0.0338, white score −0.0170 ±0.0320,
both still containing zero.

The one interval that excludes zero is pace: with two beasts games last 4.2 plies longer
(±3.0, about +3.8%). That does not replicate cleanly across pairing schemes — per-config it is
+4.16 ±4.64 and contains zero, and excluding games capped in either arm it is +3.59 ±2.88
(still positive). The sign test leans the same way: 1,038 games longer, 945 shorter, z = 2.09.
Read it as weak evidence of a small pace effect, not a firm one.

## Beast-use counter, from the stored JSONL

A beast capture move is a LAN that starts with `S` and holds at least one `x`. Capture
segments count the `x` runs inside such a move (a chain has several).

| Arm | Ranks by `S` count | Games with ≥1 beast capture | Beast capture moves | Moves/game | Capture segments | Segments/game |
|---|---:|---:|---:|---:|---:|---:|
| two | 0S:500, 1S:1000, 2S:500 | 1,089 (54.45%) | 2,218 | 1.109 | 2,825 | 1.413 |
| one | 0S:1000, 1S:1000 | 608 (30.40%) | 1,025 | 0.512 | 1,245 | 0.623 |

The counter passes the sanity check: the sampled ranks carry the expected number of beasts
(two: 10/20/10 arrangements with 0/1/2 `S`, 50 games each; one: 20/20 with 0/1 `S`), and the
beast captures roughly double with the second beast.

Games with a beast on the board are somewhat more decisive in both arms, matching the
chain report: `two` 79.53% (n = 1,500 with ≥1 beast) against 77.40% (n = 500 without);
`one` 81.30% (n = 1,000) against 78.90% (n = 1,000). The pool change moves where those games
sit, not what the feature does.

## Verdict

Dropping to one beast is null on decisiveness, draws and fairness. Decisive share moves
+1.1 points, draw rate −1.1 points and White's score +1.7 points, each far inside its paired
95% interval. The only candidate effect is pace: two-beast games run about 4 plies longer
(3.6–4.2 plies depending on pairing and capped games), with the per-config interval containing
zero. The army does not need the second beast for decisiveness; if the shorter game is real,
one beast is also slightly faster, but the evidence for that is weak.

The re-pricing to 3.77 pawns is not re-measured here; this compares counts under the current
pool, not prices. A one-beast pool at the measured price is a defensible ship candidate; a
confirmation run at depth 4 or with a larger sample would settle the pace question.
