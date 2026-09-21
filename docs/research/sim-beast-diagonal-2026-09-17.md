# The beast takes diagonally — a lab reading measured (2026-09-17)

The shipped beast captures on the 7 adjacent squares except straight ahead. That rule is cumbersome
and it reads differently for each colour. **`beastCapture: 'diagonal'`** replaces it with one
sentence, the same for both sides: *a beast takes diagonally, and keeps taking.* This note measures
that sentence. Value added: `'diagonal'` against the default `'adjacent'`; the default does not move.

## Exact semantics

- **Captures** only on the four diagonal neighbours, both colours (no forward bias, no blind spot).
- **Movement** is unchanged: `beastMove` still decides it (default `'any'`: one square in any
  direction, empty squares only).
- **Chains** are unchanged: `beastChains` decides them (default on), and every chain step uses the
  same four diagonals from the new square. A chain step still may not take a king, because the
  existing guard `caps.length > 0 && vt === K` applies unchanged.
- **`beastCaptureForward`** is inert under this reading. It only removes the straight-ahead blind
  spot, and only `'adjacent'` has one.
- **`isAttacked`** follows: a beast of either colour attacks a square exactly when it stands on a
  diagonal neighbour of it.

## Implementation seam

| what | where |
|---|---|
| type `BeastCapture = 'adjacent' \| 'diagForward' \| 'diagonal'` | `src/rules/rules.ts:41` |
| `beastCapture` field doc; `beastCaptureForward` marked inert | `src/rules/rules.ts:210`, `src/rules/rules.ts:213` |
| `CHOICES.beastCapture` takes `'diagonal'` | `src/rules/rules.ts:407` |
| capture set: `capDirs = … 'diagonal' ? DIAG : DIRS8` (the four diagonal deltas) | `src/rules/engine.ts:435` |
| straight-ahead skip stays `'adjacent'`-only, so it is inert here | `src/rules/engine.ts:439` |
| `isAttacked` mirror: `beastTakesFrom` returns `df !== 0 && dr !== 0` | `src/rules/engine.ts:640` |

No other file reads `beastCapture` (checked with grep across `src`). The search, FEN, Zobrist,
notation and the browser need no change because the rule set is module state and already in the
run stamp.

**Test:** `beastCapture=diagonal (lab): the four diagonals only, colour-independent, chains from the
new square` (`src/rules/rules.test.ts:853`). It pins the control (the default takes the 7 neighbours
but not straight ahead, d5), then the reading (four first steps, and the chain
`Sd4xc3xb2` onto a pawn that is not adjacent to d4), then `inCheck` on a diagonal but not an
orthogonal neighbour, then `crossCheckAttacks(113)`.

## A/B measurements

Protocol: paired two-population A/B on common random numbers, 40 shared arrangements, 4 workers,
`--rule beastCapture=diagonal`; control = today's defaults. Depth 3: 1,600 games per population,
seed 71 (id `pb-ab-S-diagonal`). Depth 4: 400 games per population, seed 72, same 40 arrangements,
the repo's usual `*-d4` protocol (id `pb-ab-S-diagonal-d4`). Interval is the 95% normal
approximation on the mean paired difference over arrangements.

| metric | depth 3 base | depth 3 diagonal | Δ ± 95% | depth 4 base | depth 4 diagonal | Δ ± 95% |
|---|---|---|---|---|---|---|
| white score | 0.561 | 0.533 | **-0.028 ± 0.023** | 0.540 | 0.516 | -0.024 ± 0.038 |
| decisive | 0.792 | 0.814 | **+0.022 ± 0.020** | 0.760 | 0.762 | +0.003 ± 0.041 |
| draw rate | 0.198 | 0.176 | **-0.022 ± 0.019** | 0.212 | 0.223 | +0.010 ± 0.043 |
| capped | 0.010 | 0.010 | -0.000 ± 0.005 | 0.028 | 0.015 | -0.013 ± 0.017 |
| mean plies | 110.3 | 112.6 | +2.3 ± 2.5 | 117.2 | 116.2 | -1.0 ± 6.0 |
| interest | 0.483 | 0.485 | +0.002 ± 0.004 | 0.466 | 0.466 | +0.002 ± 0.005 |
| interest (min-use) | 0.483 | 0.485 | +0.003 ± 0.006 | 0.466 | 0.466 | +0.005 ± 0.013 |

At depth 3 all three headline metrics clear their interval; at depth 4 none do. The depth-3
decisive gain (**+2.2 points**) shrinks to **+0.3 ± 4.1** and the draw-rate drop
(**-2.2 points**) turns into **+1.0 ± 4.3**. The depth-3 white-score shift (**-2.8 points**,
toward fairness) is **-2.4 ± 3.8** at depth 4. The interest axis does not move at either depth.

## Capture counters

Counted from the run jsonl by a throwaway script (`/tmp/count-Sx-captures.py`): a beast capture move
is a LAN that starts with `S` and holds at least one `x`; each `x` is one capture, chain steps
included.

| counter | d3 base | d3 diagonal | d4 base | d4 diagonal |
|---|---|---|---|---|
| games with ≥1 beast capture | 857 (53.6%) | 724 (45.2%) | 183 (45.8%) | 163 (40.8%) |
| beast capture moves per game | 1.134 | 0.802 | 1.087 | 0.733 |
| beast captures per game | 1.431 | 0.909 | 1.262 | 0.792 |
| chain moves (≥2 captures) per game | 0.174 | 0.081 | 0.128 | 0.040 |
| chain steps per game | 0.297 | 0.107 | 0.175 | 0.060 |

These totals agree with the report's per-piece `S` capture row (1.43 → 0.91 at depth 3;
1.26 → 0.79 at depth 4), so the counter and the report measure the same thing. The reading costs
about **36%** of the beast's captures at both depths (1.431 → 0.909; 1.262 → 0.792) and about
**64%** of its chain steps (0.297 → 0.107; 0.175 → 0.060). Games with a beast capture fall by
8.4 points at depth 3 and 5.0 points at depth 4.

## Verdict: null

The depth-3 sharpening (decisive +2.2, draws -2.2) does not survive depth 4: the intervals cover
zero and the point estimates sit near it. Per the project rule, a result that holds only at depth 3
is not a result. The reading is simple and the implementation is a 2-line branch, but it changes
nothing measurable at depth 4 and it makes the beast rarer: 36% fewer captures and 64% fewer chain
steps. The one-sentence rule works, but what it buys is a smaller diagonal ambusher, not a better
game. Keep the lab value; keep the shipped default `beastCapture: 'adjacent'`.
