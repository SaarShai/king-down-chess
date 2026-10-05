# Piece-balance criteria (owner adopted, 2026-10-03)

Owner, 2026-10-03: "criteria - adopt." These six criteria judge every piece of the random-army
pool. The pool is `POOL = 'QORRBBNNAAGMMSS'` (`src/rules/setup.ts`; `docs/RULES.md` §3): Queen,
Ogre, two Rooks, two Bishops, two Knights, two Archers, Guard, two Maesters, two Beasts. Seven of
the fifteen join the king on the back rank, and both sides get the same rank.

This file gives the criteria, how each one is measured, the evidence that exists, what is missing,
and the commands for the measurement run. No run has been launched for it.

## The six criteria

| # | Criterion | Line | Measured by |
|---|---|---|---|
| 1 | **Worth** | every pool piece except the Queen is worth 2.5–5.5 pawns | `src/sim/run.ts --experiment values`: swap one piece for a reference on one side |
| 2 | **Share of captures** | captures per piece between 0.5× and 1.5× the average piece's | `tools/piece-activity.ts` |
| 3 | **Share of moves** | moves per piece at least 0.5× the average piece's | `tools/piece-activity.ts` |
| 4 | **A role in some phase** | in at least one phase the piece is at or above its own whole-game activity | `tools/piece-activity.ts` (see the note on 4 below) |
| 5 | **It gets used** | the piece moves at least once in ≥ 85% of the cases where it starts on the board (per piece; also shown per game) | `tools/piece-activity.ts` |
| 6 | **The game stays good with it** | games whose army has the piece against games without it: draws within ±3 points, White's score within ±2 points, length within ±10% | `tools/piece-activity.ts` |

The Guard cannot capture by rule (`guardCaptures: 'none'`, Decision 9). It is judged on the other
criteria and flagged on criterion 2.

## How each criterion is measured

**1. Worth.** Muller's asymmetric-material method (`runValues` in `src/sim/experiments.ts`). One arm
replaces one knight of the classic rank `RNBQKBNR` with the piece, on one side only, and plays
colour-reversed pairs. A pawn-odds arm (three times the games, all eight files) converts Elo into
pawns. Implied worth = the reference's engine price + Elo / (Elo per pawn). The knight is the anchor
at its engine price, 3.16 (the Texel fit, `src/ai/eval.ts`). The method holds only inside ±1.5 pawns
of the reference; outside it the tool prints a bound, not a number. So the Archer (about 5) is
measured against the Rook (4.49), not the Knight, and the Guard gives only a bound. "Today's
shipped prices" means no `--values` flag: the search prices every piece with `src/ai/eval.ts`.

**2–5. Activity** (`tools/piece-activity.ts`). The tool replays every stored game with the engine,
under the rules that game played, and refuses a move the rules do not allow. So it knows which
piece made each move and what it took.

- *Counted:* ordinary piece moves and the pieces they remove (a beast chain counts each victim, an
  archer shot is a move with a capture). King-power and card moves are not counted, and by default
  games with a king power or cards are left out (`--withPowers` keeps them). The random opening
  plies (4 by default) are not counted: the computer did not choose them.
- *Per piece* = over the pieces of that type that started on the board. *The average piece* = all
  pool pieces together (pawns and kings out). The capture average leaves out the Guard, because it
  cannot capture.
- *Phases* by ply: opening 1–30 (moves 1–15), middle 31–80, end 81+. *Activity in a phase* = (moves
  + captures) per piece of that type on the board per turn of its side, so it is normalised by the
  pieces still on the board, not by the starting count.
- *Criterion 5:* the share of starting pieces that make at least one counted move; the share of
  games (with the piece) where at least one of them moves is shown beside it. Also the median ply of
  a piece's first move.
- A promoted pawn becomes a new piece of its new type: its moves count for that type, but it is not
  a starting piece.

**Note on criterion 4.** As written it cannot fail. A piece's whole-game activity is a weighted mean
of its three phase activities, so one phase is always at or above it. The tool prints that reading
(column 4) and a stricter one, **4b**: in at least one phase the piece is at or above *the average
piece's* activity in that phase. The owner chooses the reading.

**6. The game with and without the piece.** All games of the set, split by whether the army holds
the piece. Each difference has a 95% interval from resampling the games.

**Verdicts.** PASS or FAIL when the whole 95% interval is on one side of the line; `pass?` or
`fail?` when only the point is.

## Evidence that exists, by piece

### Worth (criterion 1)

| Piece | Engine price | Measured worth | Source | Criterion 1 today |
|---|---|---|---|---|
| Q Queen | 9.33 | — | — | not judged |
| O Ogre | 3.18 | 3.18 ± 0.44 (push, vs knight, 500 games, depth 3, 64 Elo per pawn carried over) | `sim-ogre-explore-2026-09-17.md`; `sim/out/pb-O-push-value.experiment.md` | pass, one pass only |
| R Rook | 4.49 | never measured by a swap; Texel fit only | `sim-tuning-2026-09-13.md`; `src/ai/eval.ts` | likely pass, unmeasured |
| B Bishop | 3.22 | never measured by a swap; Texel fit only | as above | likely pass, unmeasured |
| N Knight | 3.16 | the reference of every swap | `src/ai/eval.ts` | the anchor |
| A Archer | 5.05 | 5.05 ± 0.44 vs rook (500 games, depth 3); vs knight out of band (> 4.66, next seed 556) | `piece-balance-status-2026-09-17.md` §A; `sim/out/pb-A-fwd2-vsR2.log`, `pb-values-refresh2.experiment.md` | **unsure**: the interval reaches 5.49, at the 5.5 cap |
| G Guard | 0.96 | out of band below the knight: < 1.66 (refresh), < 1.70, < 1.46 (tuned engine) | `piece-balance-status-2026-09-17.md` §G | **FAIL**: every bound is below 2.5 |
| M Maester | 3.18 | 3.18 ± 0.42 (second refresh pass, vs knight, depth 3) | `piece-balance-status-2026-09-17.md` (later the same evening) | pass, one pass |
| S Beast | 4.34 | 4.34 ± 0.42 (vs knight, 500 games, depth 3, after the blind spot was removed) | `sim-beast-all8-2026-09-17.md`; `docs/RULES.md` Decision 17 | pass, one pass |

Every value is from 2026-09-13 to 2026-09-17, at depth 3, with one pawn taken as 64 Elo (last
measured 2026-09-13, 64 ± 16).

### Activity (criteria 2–5) before this tool

- Today's pool, 24 games at depth 2: 3.42 archer shots, 1.50 ogre shoves (35 of 36 move a friend),
  0.50 beast chains and 0 guard captures per game (`shipped-balance-2026-09-24.md`). A traffic
  sketch, not a balance study.
- The guard's zero captures is the rule; beast chains are rare because of their geometry
  (`quiet-pieces-2026-09-24.md`).
- The beast's move to any side raised it from 3.6 to 10.8 moves a game; maester swaps run about 6.6
  a game; the guard survives 97% of games; a king never moves in about a quarter of games
  (`piece-balance-status-2026-09-17.md`).
- Archer shots: 3.38 a game at depth 3, 4.43 at depth 4 (`sim-archer-checks-2026-09-17.md`).
- Where the criteria come from: piece usage replaces pick rate in a mirrored game; "a fairy piece
  that never moves is a dead unit; one that is in half of all captures over-centralises"; a 47–53%
  band and usage bands in commercial games (`balancing-frameworks.md` §5, §7 item 4).

### The game with and without a piece (criterion 6) before this tool

`sim-composition-mining-2026-09-17.md` mined 56,000 depth-3 games on the older pool
`QLRRBBNNAAGMMSS` (a Paladin, no Ogre; the sample over-represents arrangements that survived a
balance screen). With the piece minus without it:

| | Q | R | B | N | A | G | M | S |
|---|---|---|---|---|---|---|---|---|
| draws (points) | −1.8 | −0.2 | 0.0 | +1.8 | **−4.8** | **+4.3** | +2.9 | −3.0 |
| White's score (points) | +0.5 | −1.0 | 0.0 | −0.5 | −0.8 | −0.3 | −0.6 | −1.3 |
| length | −9.3% | +2.2% | +0.9% | +3.5% | −1.4% | +6.8% | +5.5% | −7.3% |

On that pool the Archer and the Guard fail the draws line, the Maester and the Beast sit at it, and
the Queen sits near the length line. The Paladin's +4.6 points of White's score would fail
criterion 6; it left the pool on 2026-09-24 (`docs/RULES.md` Decision 18).

### First reading with the new tool: 800 stored ordinary games

The 800 `none` games of `cards-b2` are ordinary games on today's pool: depth 3, a fresh army for
every game (seed 5555), played 2026-10-03. `npx tsx tools/piece-activity.ts cards-b2` (1,000
resamples):

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 phase ≥ own | 4b phase ≥ average piece | 5 moved ≥ 85% | 6 game |
|---|---|---|---|---|---|---|
| Q Queen | PASS 1.18 | PASS 1.19 | PASS | PASS 1.61 | PASS 89.8% | fail? (White) |
| O Ogre | fail? 0.49 [0.43, 0.55] | PASS 0.91 | PASS | fail? 0.97 | PASS 88.1% | fail? (draws, White) |
| R Rook | PASS 0.90 | PASS 0.85 | PASS | PASS 1.41 | fail? 83.3% [80.8, 85.6] | fail? (draws, White) |
| B Bishop | PASS 0.80 | PASS 0.71 | PASS | fail? 0.97 | PASS 92.9% | fail? (White) |
| N Knight | PASS 0.74 | PASS 0.78 | PASS | PASS 1.90 | PASS 98.1% | pass? |
| A Archer | **FAIL 2.00 [1.91, 2.08]** | PASS 1.63 | PASS | PASS 1.73 | PASS 96.7% | pass? |
| G Guard | n/a (cannot capture) | pass? 0.53 [0.45, 0.62] | PASS | **FAIL 0.39** | **FAIL 70.5% [67.0, 74.6]** | fail? (draws, White) |
| M Maester | PASS 0.56 [0.52, 0.60] | PASS 1.15 | PASS | PASS 1.11 | PASS 94.1% | pass? |
| S Beast | PASS 1.08 | PASS 1.03 | PASS | PASS 1.14 | PASS 94.9% | fail? (draws) |

Read with care: 800 games give criterion 6 intervals of ±5–7 points, so none of its verdicts is
settled. Criteria 2–5 are tighter. Three findings already look firm: the **Archer takes twice the
average piece's captures** (1.95 a piece a game), the **Guard stays home**: 29.5% of guards never
move, and its activity is 0.39× the average piece's even in its best phase (the end). The Ogre
(0.49×) and the Maester (0.56×) capture little: the Ogre's verb is the shove, the Maester's the swap,
and neither counts as a capture. Two rooks in an army often leave one at home (83.3% move). The
queen moves late (median first move at ply 31). All games: draws 16.5%, White 55.4%, 101.7 plies.

## What is missing

1. **Worth on today's engine.** One pass each, all from 2026-09-17 or before, with the pawn
   calibration carried over. The Rook and the Bishop were never measured by a swap. The Archer sits
   at the 5.5 cap and has no depth-4 reading. The Guard's FAIL is settled by its bound (below 1.66);
   measuring it again only confirms the bound.
2. **A large set of ordinary games on today's pool** for criteria 2–6: only the 800 games above
   exist. Criterion 6 needs about 12,000 games for ±2 points (below).
3. **The owner's reading of criterion 4** (as written, or 4b).
4. Every number describes how the depth-3 computer uses the pieces, with the lab's linear
   evaluation; the browser plays with the residual net (`src/main.ts`).

## Results (2026-10-04)

Owner (2026-10-04): "before we make these decisions i'd like you to run more tests and collect more
data." Full outputs: `piece-runs-2026-10-04-*.md` beside this file.

**Worth (criterion 1), two Muller passes, depth 3** (pass 2 plays at pass 1's prices, `--values
O=293,R=365,B=299,M=321,S=414,A=463`): Ogre 2.60, Bishop 3.17 (the same-colour caveat above), Knight
3.16 (anchor), Maester 3.28, Rook 3.84, Beast 4.27, Archer 4.11 (vs the Rook at 3.65; 4.43 at depth
4), Guard < 1.66. Pass 1 read the Archer at 5.47 because it took the Rook at its engine price (4.49);
pass 1 measured the Rook at 3.65. So the Archer passes criterion 1; the Guard fails; the Ogre sits
near the floor (±0.28).

**Activity (criteria 2–6), 12,000 ordinary games (`pa-r1`, seed 7001, depth 3):** Archer **FAIL** on
captures (2.11× the average piece) and on draws (armies with it draw 6.2 points less); Guard FAIL on
4b and 5 (70% move); Rook FAIL on 5 (81% move); Bishop FAIL on 4b (0.94). All other lines pass or
are unsettled. All games: draws 17.4%, White 51.7%, 101.1 plies. At depth 4 (`pa-d4`, the first
1,600 of these armies) the Archer takes 2.15× the average piece's captures.

**The classic Archer** (`archerShots=classic`, before Decision 16; `pa-acl`, the first 9,000 of these
armies): its captures fall to 1.33× (PASS) and its draws line passes (+1.0), but the whole game draws
22.3% against 17.6% on the same armies (White 51.3 against 51.2, 107 against 101 plies). The Beast's
armies then draw clearly less (FAIL). The Guard and Rook lines stay as they are.

### The Archer readings (2026-10-04)

Owner (2026-10-04): "archer - test and measure first", then "currently it is too powerful in that it
can take at a distance without putting itself in danger. so i think we should test both" (only the
two-square shots; only over a piece). Each reading: 9,000 ordinary games on the one-Beast pool
(seed 7001, depth 3, the same armies for every reading), and its worth against the Rook (3.65) in
1,000 games (seed 1034, pass-2 prices). Full outputs: `piece-runs-2026-10-04-pa-<id>.md` and
`…-pv-A-<id>.md`.

| reading | `archerShots` | captures × average (2: 0.5–1.5) | draws Δ, armies with it (6: ±3) | all games draw | worth (pawns) |
|---|---|---|---|---|---|
| today (`a14`) | `plusDiagFwd2` | **2.08** [2.06, 2.11] FAIL | −5.9 FAIL | 18.9% | 4.46 ± 0.29 |
| diagonal shot needs a clear square (`abk`) | `plusDiagFwd2Clear` | 2.08 FAIL | −5.9 FAIL | 18.9% | 4.32 ± 0.29 |
| no shot 2 back (`anb`) | `fwd2NoBack` | 2.07 FAIL | −5.8 FAIL | 19.0% | 4.34 ± 0.28 |
| no shots 2 sideways (`ans`) | `fwd2NoSide` | 1.93 FAIL | −6.3 FAIL | 18.6% | 3.99 ± 0.28 |
| only the two-square shots (`af2`) | `far2` | 1.54 [1.51, 1.56] FAIL (just) | −4.1 fail? | **20.3%** | 2.83 ± 0.28 |
| only over a piece (`ao2`) | `over2` | 0.50 [0.49, 0.51] fail? (on the line) | −7.1 FAIL | 17.9% | < 2.15 |

The three middle readings change almost nothing. Only `far2` and `over2` move the Archer, in
opposite ways: `far2` keeps it near its capture limit, costs about 1.6 pawns of worth (below the
Bishop) and raises the whole game's draws by 1.4 points; `over2` makes it the least capturing piece
of all (1.1× moves, worth under 2.15 pawns) and lowers the draws by 1.0. The other pieces' lines
move with it, because the average piece's captures move: under `far2` the Bishop's 4b reaches the
line (1.00, pass?); under `over2` the Queen (1.61×) and the Beast (1.62×) fail the capture limit
instead, and the Maester's armies fail on draws. The three middle readings leave every other line
as it is. The classic Archer (`pa-acl`, above) is on the two-Beast pool, so it is not in this table.

### The Guard readings (2026-10-04)

Owner (2026-10-04): "guard - test both B and C", then "guard - do the testing" (a Guard that is
dropped onto the board, not moved up from the first rank). B, C and C′ played the first 9,000 of
`pa-r1`'s armies (two-Beast pool; the control is `pa-r1`); the two reserve readings played the
one-Beast armies above (the control is `a14`). Worth: against the Knight, 1,000 games, pass-2
prices. Outputs: `piece-runs-2026-10-04-pa-g*.md`, `…-pv-G-g*.md`.

| reading | rule | moves × average (3: ≥ 0.5) | moved in the game (5: ≥ 85%) | best phase × average (4b: ≥ 1) | draws Δ (6: ±3) | worth vs Knight |
|---|---|---|---|---|---|---|
| today (`pa-r1`) | — | 0.56 | 70.2% FAIL | 0.41 FAIL | +3.2 | −190 ± 17 Elo |
| today (`a14`, one Beast) | — | 0.54 | 72.4% FAIL | 0.38 FAIL | +2.9 | |
| B: double first step (`gdf`) | `guardDoubleFirst=slide` | 0.73 | 77.8% FAIL | 0.53 FAIL | +4.4 | −197 ± 17 |
| C: two-square step (`gs2`) | `guardStep=2` | 0.77 | 78.2% FAIL | 0.54 FAIL | +4.1 | −184 ± 17 |
| C′: two squares from the centre (`gcs`) | `guardCapitalStep` | 0.56 | 70.4% FAIL | 0.41 FAIL | +3.2 | −212 ± 17 |
| reserve, enters on rank 1 (`grs1`) | `guardReserve=rank1` | 0.64 | **89.6% PASS** | 0.38 FAIL | +2.9 | −186 ± 17 |
| reserve, rank 1 or 2 (`grs12`) | `guardReserve=rank12` | 0.67 | **95.4% PASS** | 0.52 FAIL | +3.0 | −181 ± 18 |

No reading changes the Guard's worth: every one is 180–210 Elo below a Knight, under 1.66 pawns.
Only the reserve passes criterion 5, and partly by its rule: the entry (`G@b1`) counts as the
Guard's first move. No reading passes 4b: the Guard is the least active piece in every phase. B and C
make the games longer (+10.7%, +12.1%; the line is ±10%). Whole-game draws: B 18.2%, C 18.0%, C′
17.6% (control 17.6%); reserve 18.9% both (control 18.9%).

## How to run

Run from the repository root of a checkout with this branch (`claude/piece-activity`): the R and B
value arms need its fix to `src/sim/experiments.ts` (before it, a standard-piece arm crashed the
report after all its games were played). This branch changes files under `src/sim/`, so its
`sourceId` differs from main's: start these runs with new ids, as below. Start each run detached
(`nohup … &`, AGENTS.md Compute) and check the charger first (`pmset -g batt`; on the 61 W charger
the times below double).

Speeds used for the estimates (16 workers on this Mac): depth 3 about 6 games/s (`cards-b2.log`:
6.2 → 5.9 games/s over its first 706 ordinary games; `pb-A-fwd2-vsR2.log`: 7.5 games/s on 14
workers for value games, 2026-09-17; today's smoke arms 2.1–2.6 s a game per worker); depth 4
about 1.9 games/s (today's smoke arms: 8.2–8.9 s a game per worker; a 32-game `--vs R --pieces A`
arm at depth 4 under other load, 2026-10-04: 1.5 games/s, which makes (ii) about 27 min). No kept
log has a depth-4 values arm.

**(i) Worth at depth 3**, every pool piece but the Queen and the Archer against the Knight, with a
fresh pawn calibration. 6 arms × 1,000 games + 3,000 pawn games = 9,000 games, **about 25 min**:

```
nohup npx tsx src/sim/run.ts --experiment values --id pv-d3 --pieces ORBGMS --games 1000 --depth 3 --seed 1003 --workers 16 > sim/out/pv-d3.log 2>&1 &
```

Result: `sim/out/pv-d3.experiment.md`. The Guard's row will be a bound ("< …"), as before. Read the
Bishop's row with care: its arm puts the extra bishop on b1, a light square like the f1 bishop's
(`RBBQKBNR`), so it measures a second bishop of one colour. A pool army never holds that
(`bishopsOppositeColours`, `src/rules/setup.ts`), and the row may read lower than a pool bishop's
worth.

**(i-b) The Archer at depth 3 against the Rook**, with the calibration from (i) (its line "One pawn =
E Elo"; put E in place of `<E>`). 1,000 games, **about 3 min**:

```
nohup npx tsx src/sim/run.ts --experiment values --id pv-A-vsR-d3 --vs R --pieces A --eloPerPawn <E> --games 1000 --depth 3 --seed 1004 --workers 16 > sim/out/pv-A-vsR-d3.log 2>&1 &
```

**(ii) The Archer at depth 4 against the Rook**, with its own depth-4 calibration (Elo per pawn
changes with depth). 600 + 1,800 games = 2,400 games, **about 21 min**:

```
nohup npx tsx src/sim/run.ts --experiment values --id pv-A-vsR-d4 --vs R --pieces A --games 600 --depth 4 --seed 1005 --workers 16 > sim/out/pv-A-vsR-d4.log 2>&1 &
```

Against the Knight the Archer leaves the method's ±1.5-pawn band (+2.4 pawns at depth 3), and the
bound it gives ("> 4.66") says nothing about the 5.5 cap; against the Rook it is about 0.6 pawns
away.

**(iii) Activity: ordinary games on today's pool**, no king powers, no cards, a fresh army for every
game, depth 3, with the tournament runner (it shards to Kaggle and the M1; `none` against itself,
one game per army). 12,000 games, **about 35 min** on the Mac alone:

```
nohup npx tsx src/sim/tournament.ts run --id pa-r1 --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 7001 --workers 16 > sim/out/pa-r1.log 2>&1 &
# when the run has finished (its log ends with "12000 games in …"):
npx tsx tools/piece-activity.ts pa-r1 --boot 1000 > sim/out/pa-r1.activity.md
```

The tool takes under a minute for 12,000 games (9,400 stored games with 1,000 resamples: 33 s).
With 5 Kaggle notebooks (about 1/3 of the Mac) it is about 27 min: push shards 15–19 of 20 and play
0–14 here, one worker each. Start shard 0 alone first and the others once its log has its first
line (it writes `sim/out/pa-r1.tournament.json` before that line), so they do not race to write it:

```
node tools/kaggle-tournament.mjs push --id pa-r1 --shards 20 --first 15 -- --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 7001
nohup npx tsx src/sim/tournament.ts run --id pa-r1 --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 7001 --shard 0/20 --workers 1 > sim/out/pa-r1.shard0.log 2>&1 &
until grep -q entrants sim/out/pa-r1.shard0.log 2>/dev/null; do sleep 1; done
for i in $(seq 1 14); do nohup npx tsx src/sim/tournament.ts run --id pa-r1 --powers none --mirrorOnly --pairs 12000 --armies perPair --depth 3 --seed 7001 --shard $i/20 --workers 1 > sim/out/pa-r1.shard$i.log 2>&1 & done
# when `node tools/kaggle-tournament.mjs status --id pa-r1` shows the notebooks complete:
node tools/kaggle-tournament.mjs pull --id pa-r1
```

Why 12,000: in the 800 games above, the 95% half-widths of criterion 6 were 6–7.5 points for
White's score, 5–6.5 for draws and 6–9% for length (wider for the two-copy pieces, which are in
about 73% of armies, so few armies lack them). They shrink with the square root of the games: at
12,000 games about ±1.6–1.9 points for White's score, ±1.3–1.7 for draws and ±1.6–2.4% for length.
White's line is itself ±2 points, so a firm PASS there needs a difference near zero; about ±1 point
would need about 45,000 games (about 2 h on the Mac and 5 notebooks).

Total for (i)–(iii): about 85 min on the Mac.

**Smoke tests (2026-10-04, outputs deleted):** a 32-game `--powers none --mirrorOnly` tournament
(16 workers, 6 s of play) and a 16-game `run.ts` set, both read by the tool; values arms at depth 3
(`--pieces O`, with calibration) and depth 4 (`--vs R --pieces A`); `--pieces RB` before and after
the experiments fix (before: `TypeError` in the report). The tool's counts matched the per-piece
counts that 1,040 stored games recorded as they were played, exactly (starting pieces, moves and
captures, every type, with the random plies counted).
