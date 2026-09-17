# Simulation methodology — tooling, statistics, experiment design (2026-09-13)

Research for `docs/SIM-PLAN.md`. It answers five questions: what engine-match tools record, which
formulas to port to TypeScript, whether a variant engine can hold our pieces, how to run many
configurations, and how to store and repeat the runs.

## 1. Sources

| # | Source | Used for |
|---|---|---|
| 1 | [Fastchess wiki page](https://www.chessprogramming.org/Fast-chess) | Tool scope; pentanomial makes tests end sooner |
| 2 | [fastchess man.md](https://github.com/Disservin/fastchess/blob/master/man.md) | Option names, defaults, `-report penta` |
| 3 | [cutechess-cli manual](https://github.com/cutechess/cutechess/blob/master/docs/cutechess-cli.6.txt) | `-draw`, `-resign`, `-maxmoves`, `-repeat`, `-openings`, `nodes=`, `depth=` |
| 4 | [c-chess-cli](https://github.com/lucasart/c-chess-cli) | Sample output fields: FEN, eval, result |
| 5 | [OpenBench](https://github.com/AndyGrant/OpenBench) | Distributed SPRT; built on fastchess |
| 6 | [OpenBench engine rules](https://github.com/AndyGrant/OpenBench/wiki/Requirements-For-Public-Engines) | "All engines must be deterministic across multiple runs"; `bench` prints nodes and nps |
| 7 | [Fishtest fastchess command](https://official-stockfish.github.io/docs/fishtest-wiki/Running-Fastchess.html) | Live adjudication values and the pairing flags |
| 8 | [Fishtest mathematics](https://official-stockfish.github.io/docs/fishtest-wiki/Fishtest-Mathematics.html) | GSPRT; pentanomial outcomes `ll, ld, dd/wl, wd, ww` |
| 9 | [LLRcalc.py](https://github.com/official-stockfish/fishtest/blob/master/server/fishtest/stats/LLRcalc.py) | `stats`, `results_to_pdf`, `nelo_divided_by_nt`, LLR |
| 10 | [stat_util.py](https://github.com/official-stockfish/fishtest/blob/master/server/fishtest/stats/stat_util.py) | `elo`, `get_elo` (Elo, 95% bar, LOS), SPRT bounds |
| 11 | [Van den Bergh, normalized Elo](https://www.cantate.be/Fishtest/normalized_elo_practical.pdf) | (2.1), (3.1)–(3.4), (4.14): nElo, sigma, LLR, test length |
| 12 | [vdbergh/pentanomial sprt.py](https://github.com/vdbergh/pentanomial/blob/master/sprt.py) | `sigma_pg = sqrt(2*var)` for pairs |
| 13 | [CPW Match Statistics](https://www.chessprogramming.org/Match_Statistics) | Elo from score; LOS with `erf` |
| 14 | [CPW SPRT](https://chessprogramming.org/Sequential_Probability_Ratio_Test) | SPRT background |
| 15 | [Engine testing guide, SPRT](https://dannyhammer.github.io/engine-testing-guide/sprt.html) | Bounds `[0,10]` / `[-10,0]`; alpha = beta = 0.05 gives ±2.94 |
| 16 | [Stockfish UHO discussion](https://github.com/official-stockfish/Stockfish/discussions/5079) | Unbalanced books cut the draw rate but can skew a test |
| 17 | [Fairy-Stockfish variants.ini](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/variants.ini) | Option list and the Betza subset |
| 18 | [Fairy-Stockfish Betza thread](https://github.com/fairy-stockfish/Fairy-Stockfish/discussions/773) | Rifle capture, swaps and multi-leg moves are absent |
| 19 | [XBoard Betza notation](https://www.gnu.org/software/xboard/Betza.html) | Atoms and modifiers |
| 20 | [Ludii metric sources](https://github.com/Ludeme/Ludii/tree/master/Evaluation/src/metrics) | The metric list and each definition |
| 21 | [Ludii overview (arXiv 1907.00240)](https://arxiv.org/pdf/1907.00240) | System context |
| 22 | [Browne, Measuring Games](https://link.springer.com/chapter/10.1007/978-1-4471-2179-4_4) | Ludi aesthetic criteria; drama = winner suffers a negative lead |
| 23 | [Survey of algorithm configuration (arXiv 2202.01651)](https://arxiv.org/pdf/2202.01651) | Successive halving, Hyperband, F-Race, irace |
| 24 | [BOHB (arXiv 1807.01774)](https://arxiv.org/pdf/1807.01774) | Successive halving with factor eta; Hyperband brackets |
| 25 | [LHS vs Sobol (arXiv 1505.02350)](https://arxiv.org/abs/1505.02350) | Sobol wins for space filling; LHS wins only at small n |
| 26 | [Wilson interval](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval) | Rate confidence interval that stays inside [0,1] |
| 27 | [Lichess open database](https://database.lichess.org/) | PGN plus `[%eval ...]` per move, monthly files |
| 28 | [Lichess Parquet dataset](https://huggingface.co/datasets/Lichess/standard-chess-games/blob/main/README.md) | Same games as Parquet, partitioned by year and month |
| 29 | [Maia (KDD 2020)](https://www.cs.toronto.edu/~ashton/pubs/maia-kdd2020.pdf) | Move-match rate as a per-game statistic |
| 30 | [Node worker_threads](https://nodejs.org/api/worker_threads.html) | "use a pool of Workers"; transfer or share buffers |
| 31 | [Ludii playout speed (arXiv 2111.02839)](https://arxiv.org/pdf/2111.02839) | Warm the JVM, then measure; playouts per second |

## 2. Formulas (ready to port)

Pairs: play every opening twice and swap the colours; a pair scores 0, 1/4, 2/4, 3/4 or 1. The
pentanomial counts are `[LL, LD+DL, LW+DD+WL, DW+WD, WW]` [8]. Pairs drop the opening bias out of
the variance, so a test ends sooner [1].

```ts
const C = 800 / Math.log(10);            // 347.4356  [11 §3]
const Z = 1.959963985;                   // 95%

const elo = (mu: number) => -400 * Math.log10(1 / clamp(mu, 1e-3, 1 - 1e-3) - 1);   // [10]
const invElo = (e: number) => 1 / (1 + 10 ** (-e / 400));                            // [10]

/** counts = 5 pair counts (or 3 game counts). Replace every 0 by 1e-3 first. [9] */
function stats(counts: number[]) {
  const n = sum(counts), k = counts.length - 1;
  const pdf = counts.map((c, i) => ({ a: i / k, p: c / n }));      // a = score in [0,1]
  const mu = sum(pdf.map(x => x.p * x.a));
  const v = sum(pdf.map(x => x.p * (x.a - mu) ** 2));
  return { n, mu, v, sigmaPg: Math.sqrt(k === 4 ? 2 * v : v) };    // pairs get sqrt(2) [11 §2][12]
}

/** Elo, 95% bar and LOS. For pairs use n = pairs and sd = sqrt(v). [10] */
function eloReport({ n, mu, v }: Stats) {
  const se = Math.sqrt(v / n);
  return {
    elo: elo(mu),
    err95: (elo(mu + Z * se) - elo(mu - Z * se)) / 2,
    los: Phi((mu - 0.5) / se),                       // trinomial form: Phi((w-l)/sqrt(w+l)) [13]
  };
}
// Rule of thumb: d(elo)/d(mu) at mu = 0.5 is 400/(ln10 * 0.25) = 694.9, so
// err95 ~= 694.9 * Z * sigmaPg / sqrt(games).  With a 30% draw rate: +-28 Elo at 400 games,
// +-18 at 1000, +-9 at 4000.   sigmaPg = 0.5 * sqrt(1 - drawRate) for a balanced book. [11 (2.1)]

const nElo = (mu: number, sigmaPg: number) => C * (mu - 0.5) / sigmaPg;   // [11 (3.2)]
// Balanced book: nElo ~= logisticElo / sqrt(1 - drawRate). [11 (3.3)]

/** GSPRT in normalized Elo, approximation (4.14). games = total games. [11 §4] */
function llr(counts: number[], nelo0: number, nelo1: number, games: number) {
  const { mu, sigmaPg } = stats(counts);
  const t = (mu - 0.5) / sigmaPg, t0 = nelo0 / C, t1 = nelo1 / C;
  const raw = (games / 2) * Math.log((1 + (t - t0) ** 2) / (1 + (t - t1) ** 2));
  const cap = games * (t1 - t0) / 2;                    // regularize early noise [11 Rem 4.2]
  return clamp(raw, -cap, cap);
}
// alpha = beta = 0.05: accept H1 at LLR >= log((1-b)/a) = 2.944, H0 at LLR <= log(b/(1-a)). [10][15]
// Worst-case length: games ~= 1_046_535 / (nelo1 - nelo0)^2.  Delta 2 -> 262k, 5 -> 42k. [11 (3.4)]

/** Wilson interval for any rate (draws, decisive games, win rate). [26] */
function wilson(k: number, n: number) {
  const p = k / n, a = 1 + Z * Z / n;
  const c = (p + Z * Z / (2 * n)) / a;
  const h = (Z / a) * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n));
  return [c - h, c + h];
}
// Half width at p = 0.5: +-6.9pp at 200 games, +-4.9 at 400, +-3.1 at 1000, +-1.5 at 4000.
// For a mean metric (length, branching factor) use n = (Z * sd / target) ** 2 with sd from the smoke run.
```

## 3. Run protocol for the four experiments in SIM-PLAN §4

All runs: fixed depth, `timeMs: Infinity`, paired games, ply cap 300. Adjudication copies Fishtest
[7], in cutechess terms [3]: resign at `|eval| >= 600` for 3 full moves on both sides; draw at
`|eval| <= 20` for 8 full moves after move 34. Engine draws (repetition, 50 moves, no material) stay
primary; record the adjudication flag apart, so a run re-scores without it.

| Exp | Games | Depth | Stop rule |
|---|---|---|---|
| 1 Smoke | 200 (100 pairs) | 3 | Fixed. Check the recorder and measure games/s and the sd of every metric. |
| 2 Piece values | 1000 per swap (500 pairs), 9 swaps | 4 | SPRT, nElo bounds [-4, +4], alpha = beta = 0.05, cap 4000 games. Report Elo ± bar. |
| 3 Arrangement sweep | 500 ranks × 40, then halve | 3 then 4 | Successive halving, eta = 2: 500×40 → 250×80 → 125×160 → 62×320. Common seeds per round. |
| 4 Rule toggles | 7 toggles, 1000 games each | 4 | SPRT per toggle on the 62 kept ranks; a toggle that fails both bounds at 6000 games is "no effect". |

At 1000 games and a 30% draw rate the bar is ±18 Elo, so a swap worth under about 40 Elo stays
unproven. Ask SPRT for the direction, and take the piece value from the material regression.

## 4. Record schema (one JSONL line per game)

Header line per run: `runId`, git commit, engine hash, `Rules` object, sampler spec, depth, node
and ply caps, date, host, core count. Then per game:

`gameId`, `configId`, `pairId`, `colourSwapped`, `backRankWhite`, `backRankBlack`, `seed`,
`openingPlies`, `startFen`, `result` (1/0.5/0 for white), `reason`
(`checkmate|stalemate|draw50|drawRepetition|drawMaterial|adjudicatedDraw|adjudicatedResign|plyCap`),
`plies`, `moves` (LAN string), `evals` (Int16 per ply, mover's view), `depths`, `nodes`, `msPerMove`,
`legalMoveCounts` (branching factor), `materialWhite`/`materialBlack` per ply (packed), `captures`
(piece type pairs with ply), `survivors` (piece type counts at the end), `firstCapturePly`,
`checkPlies`, `promotions`, and the fairy counters: `archerShots`, `beastChains` (lengths),
`maesterSwaps`, `maesterLongSwaps`, `paladinSacrifices`, `guardBlocks`.

Store `evals`, `legalMoveCounts` and the material timeline as base64 typed arrays. A line stays near
2–4 kB, so 100k games is about 300 MB. Write JSONL live, then compact each run to Parquet with
DuckDB. Lichess uses the same two steps: PGN with `[%eval]` to transport, Parquet partitions to
analyse [27][28]. `moves` plus `seed` plus the run header replay the game, which is what
c-chess-cli's sample output does in a smaller form [4].

## 5. Can a variant engine hold our pieces?

Short answer: no, not the parts that matter. Fairy-Stockfish reads only a subset of Betza, and it
has no rifle capture, no swap move, no multi-leg or chained capture [17][18].

| Piece | Nearest variants.ini form | Gap |
|---|---|---|
| Archer | `a:mWcFcD` — move 1 orthogonally, capture on a diagonal step or a 2-step jump | The archer must **not** move when it shoots; the leaper does |
| Paladin | `l:pQ` plus `petrifyOnCaptureTypes = l` | `p` hops exactly one screen, not a file of friends; petrify leaves a wall, not an empty square; "cannot check" has no option |
| Guard | `g:mK` (moves, never captures) — exact | No option makes a piece immune to every non-king attacker; `mutuallyImmuneTypes` covers same-type pairs only |
| Maester | `m:K` | No swap. Castling is the only swap-like move and it uses fixed destination files |
| Beast | `s:mfWcFcsWcbW` — forward step, capture on the other 7 | No chain continuation |

Use Fairy-Stockfish only as a control: a standard-piece, random-back-rank variant (`startFen` per
rank, `castling = false`) to check that our white-advantage and draw rates sit near a known engine's.
Do not use it for fairy balance. Also skip driving our engine from fastchess: the managers validate
moves under chess rules. Port the ~80 lines of statistics above; that is all they would give us.

## 6. Design of the sweep

- **Sampling.** Back ranks are discrete, so sample them uniformly with the seeded RNG; Sobol and LHS
  buy nothing here. Keep Sobol for real-valued knobs (eval weights, search depth mixes) [25].
  For the 7 binary rule toggles, run the full 2^7 = 128 cells if the budget allows, otherwise a
  resolution-IV fractional design of 16 cells to get the main effects.
- **Allocation.** Successive halving with eta = 2 [23][24]. Give every configuration in a round the
  *same* opening seeds (common random numbers) and compare paired scores; this cuts the variance far
  more than extra games do.
- **Ranking metrics.** Take the Ludii set, which exists as code [20]: Balance, Completion,
  Drawishness, AdvantageP1, Timeouts, Drama (the winner's worst lead [22]), LeadChange (how often
  the expected winner changes), Stability (variance of the evaluation), DecisivenessMoves and
  DecisivenessThreshold, ClarityNarrowness and ClarityVariance, BoardCoverage (Default/Full/Used),
  BranchingFactor, DecisionFactor, MoveDistance, PieceNumber, DurationTurns and its standard
  deviation, PositionalRepetition and SituationalRepetition, plus IdealDuration and SkillTrace.
- **Depth.** SkillTrace needs a second agent. Our cheap form: 100 games of depth 2 against depth 4
  per surviving rank, plus the move-match rate between them, which is Maia's metric [29]. A rank
  where the deeper side wins under 65% is shallow, and no amount of drama saves it.
- **Sample size.** Rate metrics need ~1000 games for ±3pp [26]. Mean metrics: fit `sd` in the smoke
  run, then `n = (1.96 * sd / target) ** 2`. Report every metric with its interval, never bare.

## 7. Speed and repeatable runs

Three defects block repeatability today, all in `src/ai/search.ts`:

1. `search()` always sets `hardDeadline = start + (opts.timeMs ?? 1000)`. A `maxDepth` run still
   stops on the wall clock, so results change with load and with P vs E cores on the Mac. Pass
   `timeMs: Infinity`, or add a node cap, which is what OpenBench requires of its engines [6].
2. The transposition table, `history` and `killers` are module-level and survive between calls
   (`history` is only faded by `>>= 3`). Game *n* therefore depends on games 1..*n*-1 in the same
   worker. Export a `resetSearch()` and call it when a game starts.
3. `src/ai/worker.ts` is a browser Worker (`self`, `onmessage`). Node needs its own entry that uses
   `parentPort`. Better: give each worker a whole game and call `search()` in process, so no message
   crosses a thread per move [30].

Seeding: derive each game's seed from `hash(runId, configId, gameIndex)` with a counter-based PRNG,
not from one shared stream, so a record replays on its own. Pool size: `availableParallelism() - 1`,
alive for the whole run, because worker startup is not free [30]. Publish a `bench` number (nodes
and nps) in every run header, as OpenBench does [6], and warm the pool before timing, as Ludii warms
the JVM [31]. Throughput is `gamesPerHour = 3600 * workers * nps / (plies * nodesPerMove)`; measure
`nps` in the smoke run instead of trusting the 0.1–0.5 s per game in SIM-PLAN §5.

## 8. Changes to make in SIM-PLAN.md

1. **Pair every game.** Same opening seed, colours swapped, pentanomial counts. Our start position is
   mirrored, so the pair only differs when the opening randomisation runs; keep `openingPlies >= 4`.
2. **Replace "N games" with SPRT** for experiments 2 and 4, with a game cap. Add the length formula
   `1_046_535 / delta_nElo^2` to §5 so the budget is computed, not guessed.
3. **State the adjudication values** (resign 600/3, draw 20/8 after move 34) and record the flag, so
   a run can be re-scored without adjudication.
4. **Fix the depth claim.** "depth 3" is not reproducible while `timeMs` defaults to 1000 ms. Add
   `timeMs: Infinity` plus a node cap and a `resetSearch()` call per game (§7 above).
5. **Add the depth ladder.** Depth 2 vs depth 4, 100 games per surviving rank, as a strategic-depth
   score. It is the cheapest strong filter and it is missing from §3.
6. **Widen experiment 2.** 400 games gives ±28 Elo, which cannot see a half-pawn difference. Use
   1000 games plus the material regression over the whole corpus.
7. **Add common random numbers** to the halving rounds in experiment 3, and state eta and the round
   schedule instead of "keep the top and bottom 50".
8. **Name the metrics** in §3 from the Ludii list with a formula each, and print a Wilson or t
   interval next to every one.
9. **Add the storage step**: JSONL live, Parquet after the run, DuckDB for the report.
10. **Drop the idea of external match tools.** Port the statistics; the managers cannot referee our
    rules.
