# Lessons: Runs

The lessons on simulation runs, tournaments, balance rounds and how to read them. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-10-02 — random opening moves spent the kings' powers
- A kings' powers tournament let its random opening moves include power moves. Flight alone adds about 200 moves to a position, so most powers were spent by chance in the first four plies and the run measured nothing. → Random opening moves come from the pieces' own moves only (`m.power` excluded); after any new move kind, check what the opening randomiser can pick. (2026-10-02)

## 2026-09-13 — balance-lab traps (from the stage-2 run)
- Pawn-odds calibration with one pawn removed measures that pawn's file, not a pawn: the h-pawn alone read −17 ± 42 Elo because it opens the rook's file. → Average pawn odds over all eight files.
- A stored report is only a baseline if the engine was deterministic when it ran: the first smoke predates `resetSearchState()`/`positionKey()`. → Re-run baselines after any search change; the summary records the search version.
- Sweep spreads must be compared with sampling noise before naming "best/worst" arrangements: 20 games per rank gives sd 0.09 on the score, wider than the observed spread. → Size runs from the noise formula in `docs/SIM-PLAN.md` §3 first.
- Animations must not depend on rAF alone: a hidden tab stops `requestAnimationFrame`, so an awaited tween never resolves and the game loop stalls. → `Tweens` now flushes on `visibilitychange` and resolves instantly while hidden.
- Cross-cutting analysis tools must not import from `src/` while other agents edit it (a mid-edit file breaks the tool). → Import only stable constants; port hot functions with a provenance comment (`tools/mine.ts` does this).
- A "minimum over pieces" term in a composite score is dominated by the weakest piece (the inert beast pulled every rank's interest to the same value). → Use means or per-piece columns; check each term's correlation with the total before ranking.
- Unquoted `$VAR` in zsh does not word-split, so `npm run sim -- $RULES` silently dropped every `--rule` flag. → `parseFlags` now rejects keys with whitespace and the runner prints the live rule diff at start; always read that line before trusting a run.
- A rule can be degenerate only in company: `guardCaptures=pawns` and `guardStep=2` each measured harmless alone, together they made an uncapturable pawn harvester (44% of games). → A/B every combination you intend to ship, and count abuse patterns, not just balance.

## 2026-09-13 — batch 3
- A colour-swapped pair cancels the thing an asymmetric run measures: `byConfig.score` is White's, so `b3-armies` read 0.537 (White's first move) and not the court's 0.566. → For an `asymmetric` spec, score the arm from the JSONL as `0.5 × (result as White + 1 − result as Black)`; the analyzer's own column answers a different question.
- A spec pair is not a control pair until the two armies differ: `tools/mine.ts` gave `b3-nobeast` the same army as `b3-rule-base` (`QLRBAGM`), so 3 200 games measured replication, not the beast. → Print each arm's army and value before a batch runs; `node tools/rebase-batch3.mjs` does this.
- A piece-value table is a dependency of every value-matched spec. The Texel fit moved A 1.70 → 3.4 and G 1.70 → < 1.5, which turned the "A→G isolates a piece" swap into a 1.9-pawn handicap. → Re-derive every matched army after a values pass, and say in the spec `note` which table it was matched against.
- A ranking of arrangements does not survive a rule change: the pre-buff residual-interest order correlates −0.16 with today's, because it was counting beasts. It does survive a ply (+0.81 from depth 3 to depth 4). → Re-measure any stored ranking after a rule change; depth is the cheaper thing to trust.

## 2026-09-13 — a recorded `rules: {}` is not "today's rules"
- **Mistake:** the guard study filtered runs on `spec.rules` and put every `b3-*` run in the
  "immortal guard" pool. An empty diff means *the defaults on the day the run played*, and batch 3
  ran while `DEFAULT_RULES` still carried the buff set. Its guards capture 1.1–2.6 pawns a game
  (`Ge3xd4` appears in `b3-guard2`), so those 68 000 games measure a different piece.
- **Rule:** never read a rule off a stored spec. Read it off the **moves**: a guard capture, a guard
  step of 2, an archer's diagonal step, a guard taken by a non-king. `tools/guard-study.ts
  --list` classifies every run this way and prints the pool it lands in. Cross-check with
  `report.json` → `degeneracy.guardCapturesPerGame` before pooling anything.

## A resumed control run silently mixes pools (2026-09-14)
`pb-ab-base` was played 1 544 games under the two-guard pool, then resumed for 56 games under the one-guard pool: 79 arrangements, 384 two-guard games, and today's arms (`--seed 21 --sample 40`, one-guard pool) share only the 56 resumed games with it — the A/B was void and both buffs looked like miracles (capped 7.1% → 0.9%). The runner records the rule *diff* against the defaults of the day, so "all defaults" is not a fixed thing.
**Rule:** after any change to `POOL` or `DEFAULT_RULES`, never resume an old control: give the control a new id (or list `backRanks` in the spec). Before reading an A/B, check that the control's `configId` set equals the arm's (`python3` one-liner over the JSONL). Better still: the runner should refuse to resume a run whose arrangements do not match its current sampling.
**Now enforced (`checkResume` in `src/sim/run.ts`):** a run stops instead of resuming when a stored game's arrangement is not the one the spec plays for that game id, or when the rules-and-pool stamp now written on every game line differs from today's.

## A metric that reads the mover off ply parity breaks under a rule that changes whose turn it is (2026-09-14)
`leadMetrics()` in `src/sim/analyze.ts` picks the mover with `idx[i] % 2 === 0 ? 1 : -1`. Under
`secondPlayerDoubleFirstTurn` Black plays two moves in a row at the start, so the parity is inverted
for the rest of the game: `killerMove` measured the largest swing *against* the mover and then clamped
it at zero, and `interest` (a weighted sum that includes it) inherited the fault. Both `dt-*` runs read
−0.21 and −0.04 with a ±0.01 bar, in two different pools — the same size twice is the signature of a
systematic fault, not an effect.
**Rule:** a rule that changes *who moves when* invalidates every metric that infers the side from a
ply index. Before reading an A/B of such a rule, list the metrics that use ply parity and strike them
from the table; derive the side from the move record, not from the index. Equal-and-identical
differences across two independent pools mean a bug until proven otherwise.
**Fixed 2026-09-14:** `moverAt(ply, rules)` in `src/rules/engine.ts`, beside `makeMove`, is now the
only place that answers "who moved at this index". `analyze.ts` (`killerMove`, `decisionCost`),
`tools/mine.ts`, `tools/guard-study.ts` and `tools/warden-report.ts` all call it; a stored game
carries its own rule stamp, and a file written before the stamp falls back to the run summary and
then to the defaults. `dt-full` and `dt-nopal` were re-read with `--experiment ab --noReplay`, which
rebuilds an experiment page from the JSONL without playing a game: `killerMove` moves from
−0.209 / −0.211 to +0.010 ± 0.010 / +0.007 ± 0.009, and `interest` from −0.041 / −0.042 to
+0.003 / +0.002. The balance answer does not move, so §5.4 stands.

## Editing the engine while a run launches plays a different game (2026-09-14)
- **Mistake:** benchmarking `isAttacked` by editing `src/rules/engine.ts` between timed runs, I left
  the file in a half-edited state for three minutes — a slice that was meant to delete the catapult
  rays also deleted the pawn and archer loops beside them. The lab chain started `np-N` inside that
  window. A `Worker` snapshots the module graph when it spawns, so all 16 workers played 2 000 games
  under an engine in which pawns and archers gave no check, and neither `tsc` nor the file on disk
  afterwards showed anything wrong. The run had to be thrown away.
- **Rules.** (1) A/B a hot path in a **copy**, never in the file the lab imports; if it must be the
  real file, do it with nothing queued and re-run the suite before anything launches.
  (2) A timing number measured on a broken build is not a timing number: the first "60% of perft"
  reading came from a function that had lost two of its loops.
  (3) Before reporting any run, replay it: parse each stored LAN back and assert it is legal under
  today's engine (`verify.mjs` pattern — `legalMoves(pos).find(x => toLan(pos, x) === lan)` over ~60
  games a file). A broken engine shows up immediately as a move that is not legal now, and it is the
  only check that sees *which* engine actually played.

## 2026-09-17 — one-off action powers drain decisiveness (measured twice)
- **What happened:** both readings of Strike (Flame A) were built and measured at depth 3 and depth 4:
  the reading as written (queen-move, decisive −15.5 ± 3.2 then −20.2 ± 5.8) and the card game's
  verb (capture without moving, −10.1 ± 3.4 then −29.5 ± 7.3, draws +31.5 ± 7.4). Death Touch's
  second reading failed the same way (−6.0 ± 2.7, −6.3 ± 6.0). Every one was used near its maximum
  (Death Touch aside), and every one lowered the decisive share.
- **Pattern:** a power that gives each side one *forced action* (a free capture, a free displacement)
  is spent on the most valuable piece on the board, the material balance collapses, and the ending
  is thin and drawn. Games get **shorter and less decisive at the same time** — plies −27 to −38.
  "A surprise per game" is not what a decisive game is made of.
- **Rule:** before building a power with charges, predict its decisive-share direction from its shape:
  powers that *add* material or *anchor* it (drops, walls, shields) may be fine; powers that let a
  side remove material for free are draw engines until measured otherwise. Build the A/B at depth 3
  and a depth-4 arm in the same campaign, and shelve on a negative depth-4 interval (Strike's shape
  was cheap to build, so this cost one evening, not a day).

## 2026-09-22 — a saved evaluator label does not freeze its other parameters
The stopped campaign proposed the repository's old `sim/nnue/eval-linear.json` against a residual arm copied from today's evaluator. The linear file still priced Archer at 337, Paladin at 326 and Beast at 308, versus current 505/408/434. That confounds evaluator choice with material values. The direct review caught it before main studies; 72 operational trial games remain throughput-only. Pin both full parameter sets from the same current snapshot and assert every field except the intended evaluator selection is identical. A real network blob and a valid source hash alone do not prove a controlled comparison.

## 2026-09-22 — test counterplay before the observed advantage forms
The 24 strongest selected Paladin opening examples still scored White +505 to +1,215 at deeper searches from their late positions. That did not show an unavoidable opening flaw. Replaying from Black’s first reply, replacing the remaining random opening plies with 200/400 ms search for both players, avoided the original large advantage in all 24 short branches. Several exposed Paladins could simply be captured. Preserve the same selected cases, source prefix and finite horizon; distinguish late-position rescue from earlier counterplay. Do not weaken a rule from extreme examples created partly by random opening decisions, and never label short unfinished branches as draws or forced outcomes.

## 2026-10-03 — a balance round measures only the armies it drew
- **What happened:** round 12 re-ran round 11's exact rules and engine with a new seed. Mercy went
  60.4 → 48.7 and Leap 46.2 → 57.6 against intervals of ±5.5 per round. Mercy had been "the one
  power to watch" on the strength of single rounds.
- **Cause:** `src/sim/tournament.ts` draws one army per pair slot (`armies[p]`) and every matchup
  reuses it, so 12 pairs = 12 armies. A power's strength depends on the army, and the per-game
  interval leaves the army-to-army variation out. Resampling the armies gives ±4–10 per power in
  one round. Pair-level and game-level intervals agree (ratio 0.99): the colour-swapped pairs are
  not the problem.
- **Rules:** (1) judge a power on pooled rounds with different seeds, or on many armies, not on one
  round of 12; new rounds use `--armies perPair` (a fresh army for every pair); (2) read the
  "±95% armies" columns of `report`, not the per-game ones; a power is off centre only on the
  report's "all tested together" line — twelve separate 95% intervals flag a power by chance in
  about half of all rounds, so the per-power list is a screen of candidates; and with 12–24 armies
  intervals need t quantiles, not 1.96 (a first reading of rounds 11–12 called Haste, then Flight and
  Darkness, "clearly off centre"; calibrated, Haste is borderline and the rest are candidates);
  (3) before changing a power for being high or low, check it on fresh armies.
- A pooled report grouped games by `pairId`, which restarts at 0 in every round, so rounds with
  different layouts would have merged unrelated pairs (found by review before round 13). → Key
  anything per round (`poolRounds`) before pooling rounds; test a pool of two different layouts.
