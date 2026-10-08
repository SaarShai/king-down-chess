# Guard strategies: probes for hidden value (design, 2026-10-06)

Status: design. Nothing is built or run. Runs need the owner's go.

## Why

The worth runs measure the Guard as our engine plays it: depth 3, and an eval that keeps
the Guard on its home ranks (`PST[G]`) and rewards it only in the king shield
(`shield()`, `src/ai/eval.ts`). A plan that the eval does not reward is invisible to the
engine. So the Guard's measured worth (about 1 pawn) is a lower bound.

The test for one plan: give one side a lab eval bonus for the plan, and play it against
the same engine without the bonus. Both sides have the same army and the same depth.
If the bonus side scores better, the plan has real value, and we measure the Guard's
worth again with the bonus on. The engine already plays a different eval on each side
(`evalParams.white/black`, `src/sim/game.ts`), and games can start from a FEN.

Guard facts that the plans use: it moves 1 square to an empty square, it never
captures, only a king can capture it, and it blocks sliders. So a Guard is a
permanent wall: the enemy can remove it only with the king.

## Part 1: march strategies (eval probes)

Each probe is one new eval term with a weight. The weight is 0 in the shipped eval.

| Id | Plan | The term rewards |
|---|---|---|
| E1 | Queen escort | A Guard next to its own queen, more when the queen is in the enemy half. |
| E2 | Front shield | A Guard on the square between its queen and the nearest enemy slider line to the queen. |
| E3 | Interpose | A Guard on a line between an enemy slider and its own queen or king (any distance). |
| E4 | Blockade | A Guard directly in front of an enemy pawn, more for a passed pawn. Only their king can clear it. |
| E5 | Pawn escort | A Guard next to its own passed pawn, the pair advancing together. |
| E6 | King net | A Guard next to the enemy king (it takes escape squares, and only that king can take it). |
| E7 | Free Guard | Remove the home-rank pull: `PST[G]` flat. This tests whether the shipped table holds the Guard back. |

E1 is the owner's queen-and-Guard march. E2 and E3 are stricter forms of it. E4 to E6 use
the same fact (the Guard is a wall only a king removes) in other places.

Weights: 30 and 80 centipawns for each term (a small and a large push).

Run per probe and weight (A/B, mirrored pairs, armies with a Guard on each side, Guard
on b1 as in the worth runs, and also next to the king):
- 400 pairs (800 games) at depth 3. The noise is about ±25 Elo, so it detects a plan
  worth about 0.4 pawns.
- Output: the bonus side's score and Elo, draws, length, and how often the plan's
  pattern appears (a probe that never fires measures nothing).

A probe that wins goes to step 2: the worth run (`run.ts --experiment values`) with
the bonus on both sides, at depth 3 and depth 4.

## Part 2: king protection (start from a threat)

The owner's idea: start the games later, with the king under attack, and the Guard next
to the king. Random other pieces. Then compare the same position with and without the
Guard.

Position generator (`tools/king-threat-fens.ts`, new):
1. The defender's king on one of g1, c1, e1, or a random square of ranks 1–2.
2. The Guard on a random square next to the king (variants below).
3. Attack: the enemy queen plus 1–2 random pieces from {Rook, Bishop, Knight, Archer},
   each placed within 3 squares of the defender's king, not giving check, not
   en prise for free.
4. Defence: 1–3 random defender pieces from the same set, and 2–4 pawns in front
   of the king.
5. The rest: random pawns for both sides, then random extra pieces until the material
   is equal by the shipped values, not counting the Guard.
6. Keep a position only when it is legal, no side is in check, and the defender's
   depth-3 eval is between −3 and +1 pawns (a real threat, not lost already).

Each position plays in four arms. The Guard square changes only:
- G-in: the Guard next to the king.
- G-out: the Guard on a far home-rank square (the same piece, not defending).
- Pawn: the Guard replaced by a pawn on the same square.
- None: the Guard removed.

Guard variants for G-in: in front of the king, beside the king, on the line of the
nearest enemy slider (the interpose square).

Each position plays twice with colours swapped (the attacker is White, then Black, and
the board is mirrored), and with the attacker to move. 3,000 positions × 4 arms × 2 =
24,000 games at depth 3, max 120 plies.

Measured: the defender's score in each arm, and how many moves the king survives.
- G-in − None is the Guard's defensive worth.
- G-in − G-out tells how much of it comes from the square.
- G-in − Pawn compares the Guard with the cheapest blocker.
Convert to pawns at 64 Elo a pawn, as the other worth runs.

A second set uses real games: replay pa-r1 and far2 records to ply 30–60, keep
positions where the enemy has 2 or more pieces within 3 squares of the king, and
then run the same four arms. This checks that the random positions do not mislead.

## Part 3: where the runs go

| Run | Machine | Size | Time (estimate) |
|---|---|---|---|
| gs-probe: E1–E7 × 2 weights, Guard on b1 | Kaggle, 5 notebooks | 14 × 800 = 11,200 games | 4–5 h |
| gs-probe-k: E1, E3, E6 × 2 weights, Guard next to the king | M1 | 6 × 800 = 4,800 games | 5–6 h |
| kd-rand: king defence, random positions | Kaggle, 5 notebooks | 24,000 games, short | 5–6 h |
| kd-real: king defence, positions from real games | M1 | 1,500 positions × 4 × 2 = 12,000 games | 6–8 h |
| gs-worth: worth runs for each winning probe | M1 or Kaggle | about 600 games each | after the above |

Kaggle runs tournaments only. To send the probes and the king-defence positions to
Kaggle, the tournament takes two new flags: `--evalParams a.json,b.json` (one eval per
entrant) and `--fens file` (the start positions, one per pair).

## What to build (about one day)

1. Eval terms E1–E7 as `EvalParams` fields, weight 0 by default, with a test that the
   shipped eval is unchanged (the eval hash test).
2. Probe parameter files: one JSON per probe and weight.
3. `tools/king-threat-fens.ts`, the generator, with a self-check (legal, no check,
   equal material) and the four arms.
4. The two tournament flags and the Kaggle wrapper pass-through.
5. A report: score per arm and per probe, with the pattern rate.

## Later (not in this round)

If several probes win, tune all the terms together by self-play (SPSA), so the engine
finds the weights itself. That is level 2 of the strategy-search plan.

## Results (2026-10-07)

- March probes (gs-probe, Guard on b1; gs-probe-k, Guard next to the king): no plan helps the
  engine at depth 3. The best is +0.19 ± 0.27 pawns (E3-30, Guard next to the king). Strong
  bonuses lose: E1-80 −0.88 ± 0.34 (next to the king), E5-80 −0.63 ± 0.26.
- King defence from random threats (kd-rand, 24,000 games): the Guard next to the king is worth
  **+2.82 ± 0.19 pawns** against no Guard, +1.86 against the same Guard far away, +1.13 against a
  pawn on its square. On the interpose square: +3.59 ± 0.40. The king lives 34 plies, not 18.
- So the Guard's value is in defence, which the worth test (Guard on b1, quiet start) does not see.
- kd-real2 (1,500 positions from real games, looser filter): the Guard next to the king is worth +1.05 ± 0.24
  pawns against no Guard. The attacks are milder than the random ones, so the worth is smaller.
- guard-king (normal start): the Guard on f1 is +0.53 ± 0.14 pawns better than on b1, but in quiet games it
  is far below a Knight (−2.52 pawns). Recommendation: start the Guard next to the king.
- Depth 4 (Kaggle): the results hold. No march plan helps (best E3-30 +0.24 ± 0.25); king defence +2.86 ± 0.27.
- kd-real2 (1,500 real-game positions, filter ply 20–80, 1+ attacker within 3 or 2+ within 4,
  every candidate ply tried; 12,000 games): the Guard next to the king is worth **+1.05 ± 0.24
  pawns** against no Guard, +0.37 ± 0.24 against the same Guard far away, +0.38 ± 0.24 against a
  pawn on its square; on the interpose square +2.01 ± 0.80 (145 positions). Real threats are milder
  than the random ones (defender 33–42%, not 12–28%), so the worth is about a third of kd-rand's.
- guard-king (normal start, 4 random opening plies, 2,000 pairs an arm): the same army with the Guard
  on f1 (RNBQKGNR) beats it with the Guard on b1 (RGBQKNNR) by **+0.53 ± 0.14 pawns** (54.9% ± 1.3).
  But the Guard on f1 against a Knight on f1 loses **−2.52 ± 0.17 pawns** (28.3% ± 1.3; outside
  Muller's linear band, so read it as "far below a Knight"). The f1 Guard moves in 88% of games,
  3.3 times a game. So the placement helps, but the defensive worth does not make the Guard near a
  Knight's value in normal games at depth 3.
- guard-king-p at depth 4 (M1, 1,000 pairs): the Guard on f1 beats the Guard on b1 by **+0.54 ± 0.19 pawns**
  (55.0% ± 1.7), the same as at depth 3 (+0.53). The f1 Guard moves in 88% of games, 5.6 times a game.
