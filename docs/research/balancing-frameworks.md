# Balancing frameworks, tools and methods (2026-09-13)

Scope: general game systems that ship balance analytics, research on automated balancing, industry practice for asymmetric units, and libraries we can install today.
Engine choice is in `engine-ai.md`; statistics, SPRT and the run protocol in `sim-methodology.md`; start positions in `chess960.md`. This file does not repeat them.

## 1. Sources

| # | Source | Used for |
|---|---|---|
| 1 | [Ludii repo](https://github.com/Ludeme/Ludii) | Licence CC BY-NC-ND 4.0; Java; AI agents and evaluation code in-repo |
| 2 | [Ludii metric sources](https://github.com/Ludeme/Ludii/tree/master/Evaluation/src/metrics) | Exact metric class names (read per sub-directory) |
| 3 | [Ludii concepts from UCT playouts](https://ludii.games/conceptsUCT.php?gameId=730) | Published metric values per game (De Vasa Chess) |
| 4 | [Writing .lud descriptions](https://ludiitutorials.readthedocs.io/en/latest/lud_format_basics.html) | Grammar shape: `(game ...)`, players, equipment, rules |
| 5 | [Chess.lud](https://github.com/Ludeme/Ludii/blob/master/Common/res/lud/board/war/replacement/checkmate/chess/Chess.lud) | About 180 lines; piece macros; `IsInCheck`; `(then (moveAgain))` |
| 6 | [Ludii User Guide](https://ludii.games/downloads/LudiiUserGuide.pdf) + [Language Reference](https://ludii.games/downloads/LudiiLanguageReference.pdf) | Built-in UCT and alpha-beta agents; `EvalGamesSet` batch trials |
| 7 | [Ludii vs RBG (arXiv 1907.00244)](https://arxiv.org/pdf/1907.00244) + [Efficient Reasoning in RBG](https://arxiv.org/pdf/2006.08295) | Ludii expressed 17 test games, RBG 14; RBG about 37x faster on chess |
| 8 | [RBG repo](https://github.com/marekesz/rbg) | Language, compiler, sample players |
| 9 | [OpenSpiel repo](https://github.com/google-deepmind/open_spiel) | Apache-2.0; C++ core with Python bindings |
| 10 | [OpenSpiel games list](https://github.com/google-deepmind/open_spiel/blob/master/docs/games.md) | About 120 games; chess, antichess, crazyhouse, kriegspiel, shogi, xiangqi |
| 11 | [OpenSpiel developer guide](https://github.com/google-deepmind/open_spiel/blob/master/docs/developer_guide.md) | 11 steps to add a game; Python-only games allowed |
| 12 | [alpha-rank](https://openspiel.readthedocs.io/en/latest/alpha_rank.html) + [AlphaZero](https://openspiel.readthedocs.io/en/stable/alpha_zero.html) docs | Agent evaluation without Elo; self-play actors, learner, evaluators |
| 13 | [GDL overview (Stanford)](http://ggp.stanford.edu/overview/game_description.html) + [Efficiency of GDL reasoners](https://ieeexplore.ieee.org/document/6748004/) | Declarative rules; two orders of magnitude spread in nodes per second |
| 14 | [Polygames archive](https://github.com/facebookarchive/Polygames) | Repository archived; zero-learning framework |
| 15 | [boardgame.io docs](https://boardgame.io/documentation/) | MIT JS/TS turn-based engine; RandomBot and MCTSBot |
| 16 | [Zillions of Games (CPW)](https://www.chessprogramming.org/Zillions_of_Games) | ZRF rules language, 1998-2003, proprietary, Windows |
| 17 | [Tabletop Simulator API](https://api.tabletopsimulator.com/) + [Boardgame Lab](https://boardgamelab.app/blog/tabletop-simulator/) | Lua 5.2 table upkeep, no AI; generated MCTS dummy players |
| 18 | [Machinations Monte Carlo](https://machinations.io/docs/the-monte-carlo-simulations) | Diagram-driven economy simulation, distributions not averages |
| 19 | [Browne PhD, recombination games](https://eprints.qut.edu.au/17025/) | Ludi; quality criteria measured by self-play |
| 20 | [Browne, Yavalath chapter](https://www.genetic-programming.org/hc2012/Browne-Paper-3-Yavalath-07.pdf) | 57 aesthetic criteria; Completion, Duration, Drama, Uncertainty |
| 21 | [Hom and Marks, Automatic Design of Balanced Board Games](https://ojs.aaai.org/index.php/AIIDE/article/view/18777) | Genetic algorithm over rules, balance judged by GGP self-play |
| 22 | [Volz et al., Feasibility of Automatic Game Balancing (arXiv 1603.03795)](https://arxiv.org/abs/1603.03795) | Top Trumps; win rate plus excitement as two objectives |
| 23 | [Mahlmann et al., Evolving card sets for Dominion](https://pure.itu.dk/en/publications/evolving-card-sets-towards-balancing-dominion/) | Three agent skill levels, three fitness functions |
| 24 | [de Mesentier Silva et al., Evolving the Hearthstone Meta (arXiv 1907.01623)](https://arxiv.org/pdf/1907.01623) | NSGA-II; 10,000 games per evaluation; minimal change objective |
| 25 | [Jaffe et al., Restricted Play (AIIDE 2012)](https://homes.cs.washington.edu/~zoran/jaffe2012ecg.pdf) | Balance measured by handicapping one agent |
| 26 | [Isaksen et al., Exploring Game Space (FDG 2015)](http://www.nealen.net/papers/exploring-game-space-FDG2015.pdf) | Fix rules, parameterise, sweep, cluster for unique variants |
| 27 | [Kavanagh et al., Chained Strategy Generation](https://ieeexplore.ieee.org/document/8846763/) | Balance as "no single way to play is strictly better" |
| 28 | [BBExplorer (arXiv 2608.28364)](https://arxiv.org/html/2608.28364) | Find where balance breaks under a finite budget |
| 29 | [Riot, Balance Framework Update](https://www.leagueoflegends.com/en-us/news/dev/dev-balance-framework-update/) | Four player groups; buff and nerf rules; limits of win rate |
| 30 | [Riot, 2XKO Live Balance Philosophy](https://2xko.riotgames.com/en-us/news/dev/2xko-live-balance-philosophy/) | 47-53% band, matchup charts, move usage, anti-homogenisation |
| 31 | [Supercell, Clash Royale balance post](https://supercell.com/en/games/clashroyale/blog/release-notes/may-balance-changes-2/) | Usage rate 5-15% treated as healthy |
| 32 | [Jaffe, Metagame Balance (GDC 2015)](https://www.gdcvault.com/play/1022155/Metagame) | Matchup charts plus Nash equilibrium over the matrix |
| 33 | [Extra Credits, Perfect Imbalance](https://www.youtube.com/watch?v=e31OSVZF77w) + [counter relationships (arXiv 2408.17180)](https://arxiv.org/abs/2408.17180) | Counter structure as the balancing mechanism; Bradley-Terry plus vector quantisation |
| 34 | [openskill.js](https://github.com/philihp/openskill.js) · [glicko2.ts](https://glicko2.js.org/) | TS rating libraries; openskill is free of the TrueSkill patent |
| 35 | [Bayesian Elo](https://www.remi-coulom.fr/Bayesian-Elo/) · [Ordo](https://github.com/michiguel/Ordo) | PGN in, rating list out; all results fitted at once |
| 36 | [choix](https://github.com/lucasmaystre/choix) | Bradley-Terry maximum likelihood in Python |
| 37 | [Optuna HyperbandPruner](https://optuna.readthedocs.io/en/stable/reference/generated/optuna.pruners.HyperbandPruner.html) | Successive halving and Hyperband as a library |
| 38 | [fastchess](https://github.com/Disservin/fastchess) | Pentanomial statistics, SPRT, high concurrency |
| 39 | [Observable Plot](https://observablehq.com/plot/) · [wilson-score-interval](https://www.npmjs.com/package/wilson-score-interval) | Report charts; one-formula npm packages |

## 2. General game systems

**Ludii [1-7].** Java. More than 1000 games. Rules are trees of "ludemes" in a `.lud` file. It is the only system that
ships a finished, named balance and quality metric set, and it publishes the computed values per game. The licence is
CC BY-NC-ND 4.0, so we cannot ship it, fork it or modify it. `engine-ai.md` already rejects it for that reason.

The metric names, read from the source tree [2], are the useful part:

- Outcome: `AdvantageP1`, `Balance`, `Completion`, `Drawishness`, `OutcomeUniformity`, `Timeouts`.
- State evaluation: `LeadChange`, `Stability`, plus `clarity/` and `decisiveness/` (`DecisivenessMoves`, `DecisivenessThreshold`).
- Complexity: `DecisionMoves`, `GameTreeComplexity`, `StateSpaceComplexity`.
- Per-ply series, reduced to average, change, maximum, minimum and variance: `BoardSitesOccupied`, `BranchingFactor`,
  `DecisionFactor`, `Drama`, `MoveDistance`, `MoveEvaluation`, `PieceNumber`, `ScoreDifference`, `StateEvaluationDifference`.
- Designer aids: `IdealDuration`, `SkillTrace`. Also board coverage, duration and state repetition.

Ludii publishes reference values from UCT playouts. For De Vasa Chess [3]: Balance 0.78, AdvantageP1 0.39, Drawishness
0.02, Completion 0.98, DurationTurns 151.95, BranchingFactorAverage 51.48, BoardCoverageDefault 0.92. Our report should
sit beside numbers like these.

Can Ludii express our five pieces? Probably, with work, but we did not verify it. `Chess.lud` is about 180 lines of piece
macros [5]. `(then (moveAgain))` gives the beast chain, swap ludemes give the maester, and a select-and-remove move gives
the archer shot. The guard rule needs a condition on the capturing piece type.

**Ludi (Browne, 2008) [19, 20].** The ancestor of every "fun metric" here. Genetic programming recombines rules of
combinatorial games; self-play measures 57 aesthetic criteria; a human survey keeps the criteria that predict liking.
Named criteria: Completion, Duration, Drama (the winner first suffers a negative lead), Uncertainty (the outcome stays
open late), Lead change, Killer moves, Coolness. The system is not distributed, so take the definitions only.

**OpenSpiel [9-12].** Apache-2.0, so it is the only research-grade system we may legally use and modify. C++ core,
Python bindings, about 120 games, chess included. It ships MCTS and AlphaZero self-play plus analysis tools Ludii lacks:
alpha-rank, Nash averaging, replicator dynamics. It ships no game-quality metrics. Adding a game is an 11-step template
copy, and Python-only games run slowly. Cost for us: a second implementation of our rules, so a second bug surface.

**RBG [7], [8].** Fastest general language, poorest readability, no balance analytics. **GGP / GDL [13]** is universal
for our game class and slow; reasoner speed varies by two orders of magnitude. **Polygames [14]** is archived.

**boardgame.io [15].** MIT, TypeScript, and the closest thing to our stack. It ships `RandomBot` and `MCTSBot` and a
move-simulation interface, but it is single-threaded and has no analytics. Our engine already does more than this.

**Zillions of Games [16].** ZRF rules language, last release 2003, proprietary, Windows. Its one lasting contribution is
that Hom and Marks drove it with a genetic algorithm to design balanced games [21].

**Tabletop tools [17], [18].** Tabletop Simulator automates dealing and counting, not play, and its scripting is too
weak for a decent AI. Boardgame Lab generates MCTS dummy players. Machinations runs Monte Carlo on economy diagrams, not
on board states. None of the three fits a perfect-information chess variant.

## 3. Comparison table

| System | Expresses our 5 pieces? | Metrics it ships | Licence | Language | Effort to adopt |
|---|---|---|---|---|---|
| Ludii | Probably yes, unverified | Full balance and quality set [2] | CC BY-NC-ND 4.0 | Java | Cannot ship. Port the definitions |
| Ludi | No (not distributed) | 57 aesthetic criteria | Unpublished | — | Read the papers only |
| OpenSpiel | Yes, by writing the game again | None for quality; alpha-rank, Nash averaging | Apache-2.0 | C++ / Python | High: second rules implementation |
| RBG | Likely yes | None | Free (see repo) | C++ | High, and no analytics gain |
| GGP / GDL | Yes, verbosely | None | Free | Prolog-like | High, slow, no gain |
| Polygames | Unknown | None | Archived | C++ / Python | Do not use |
| boardgame.io | Yes, by writing the game again | None | MIT | TypeScript | Medium, and it gains us nothing |
| Zillions | Partly (1998 language) | None | Proprietary | ZRF | Do not use |
| Tabletop Simulator | Yes, for humans | None | Commercial | Lua | Useful only for human playtests |
| Machinations | No (economies only) | Economy distributions | Commercial SaaS | Diagram | Ignore |

## 4. Automated balancing and tuning research

| Work | What it tunes | Balance objective | Simulation budget |
|---|---|---|---|
| Hom and Marks [21] | Board game rules | Equal win chance from either side, few draws, by GGP self-play | Not stated |
| Volz et al. [22] | Top Trumps decks | Win rate plus "excitement" (number of tricks), multi-objective | Deck-based and simulation-based objectives |
| Mahlmann et al. [23] | Dominion card sets | Three fitness functions, three agent skill levels | Cards that balance across all skill levels |
| Hearthstone meta [24] | Card attributes | Deck win rates to 50%, with minimum change magnitude (NSGA-II) | 10,000 games per evaluation, 12 decks |
| Restricted play [25] | Measurement, not rules | A k-step-lookahead agent against a full agent | Scales with the handicap grid |
| Isaksen et al. [26] | Fixed rules, free parameters | Target difficulty, then clustering for unique variants | Monte Carlo plus 106M human sessions |
| Chained strategy generation [27] | Turn-based game parameters | No single way to play is strictly better | Probabilistic model checking, not sampling |
| BBExplorer [28] | Finds the balance boundary | Where acceptable stops and problematic starts | About 400k matches in 3D; about 9k per 5D search path |

Findings that matter for us:

1. **Balance is defined as a win rate near 50%, almost everywhere.** The interesting work adds a second objective,
   because balance alone selects dull games. Volz uses excitement [22], Hearthstone uses minimum change magnitude [24],
   Ludi uses the aesthetic criteria [20]. Expect balance and interest to fight; use a multi-objective view, not one
   weighted sum, when the two disagree.
2. **Balance depends on the agent.** Mahlmann shows card sets that are balanced only at one skill level [23]. Our
   depth-3 result is not the depth-5 result. Confirm every headline finding at a second depth.
3. **Restricted play is the most transferable idea [25].** Handicap one side (fewer plies, or no quiescence) and measure
   how much it loses. This tells us whether an arrangement rewards skill, which a 50% win rate cannot. Ludii's
   `SkillTrace` is the same idea in metric form.
4. **Spend the budget on the boundary, not on the mean [28].** Two-stage screening (a cheap screen of all candidates,
   then full evaluation of the top-k) matches the successive halving already planned in `sim-methodology.md` §3.
   BBExplorer found 100% of boundary points in 2D and 3D where random sampling found 20% and 6.7%.
5. **Budgets in this literature are small.** 10,000 games per evaluation is a large published number [24]. Our plan of
   50k-100k games per hour puts us above the state of the art in sample size. Our risk is agent quality, not sample size.

## 5. Industry practice for asymmetric units

- **Riot, League of Legends [29].** 148 champions, four player groups (average, skilled, elite, professional). Buff only
  when a champion underperforms in *every* group; nerf when it overperforms in *any*. Riot states the limit openly: win
  rate alone misses over-centralisation, because a champion at 52-53% with a very high pick and ban rate makes a solved
  meta without crossing a threshold. They then measure "presence" (pick plus ban) instead.
- **Riot, 2XKO [30].** Asymmetric fighting game, so the closest analogue to a fairy-piece roster. Data: win rate and pick
  rate per skill level, team-composition win rates, champion matchup charts, move usage. Band: investigate outside
  47-53%. Beginner play accepts 3% margins; top play uses pick-rate spikes because win rates converge. Patch every five
  weeks. They state plainly that they do not want every winning team to look the same.
- **Supercell, Clash Royale [31].** Usage rate between 5% and 15% is the healthy band, checked at several rank cuts.
- **Jaffe, GDC 2015 [32].** The formal version. Build the matchup matrix, then ask what metagame (mixed Nash
  equilibrium) forms over it. A roster is balanced when the equilibrium uses many options, not when every cell is 50%.
- **Counter structure [33].** "Perfect imbalance" says the counter web, not per-unit parity, keeps a meta alive; the
  academic form fits Bradley-Terry strength, then quantises the residual to find counter groups.

What transfers, and what does not. The back rank is mirrored, so both sides get the same units, and there is no draft
and no pick rate. The per-unit matchup matrix does not exist in the Riot sense. Two things do transfer. First, treat the
*arrangement* as the unit: the matrix is arrangement against arrangement, and the mirror diagonal is the fairness test
(white score near the Chess960 baseline in `chess960.md`). Second, replace pick rate with **piece usage** - moves,
captures and survival per piece type, which `SIM-PLAN.md` §2 already records. A fairy piece that never moves is a dead
unit; one that is in half of all captures over-centralises. A near-50% win rate with a dominant usage share still fails.

## 6. Ready-made tooling for Node, TypeScript and Python

| Tool | Language | Gives | Verdict |
|---|---|---|---|
| openskill [34] | TS, npm | Weng-Lin ratings, no TrueSkill patent | Use only if we rate many agents at once |
| glicko2.ts [34] | TS, npm | Glicko-2 with rating deviation | Not needed; our players are engine settings |
| Bayesian Elo, Ordo [35] | C binaries | Fit all results at once from PGN | Skip. We have no PGN, and the formula is short |
| choix [36] | Python | Bradley-Terry maximum likelihood | Best fit for arrangement strength from pairwise results |
| Optuna [37] | Python | Successive halving, Hyperband, dashboard | Use only if the sweep becomes adaptive |
| fastchess [38] | C++ binary | SPRT, pentanomial, concurrency | Protocol only. Our engine is not UCI |
| Observable Plot [39] | JS | Charts from tabular data, no build step | Use for the report artifact |
| wilson-score-interval [39] | npm | One formula | Write the formula instead |

The honest reading: almost every item here is a formula that `sim-methodology.md` §2 already states. Elo from a score,
the Wilson interval and the pentanomial variance are a few lines each in `analyze.ts`. Bradley-Terry over hundreds of
arrangements is the one fit that is worth a real library, and that library is Python.

## 7. Recommendations for King Down Chess

**Adopt**

1. **Ludii's metric names and definitions, ported by hand into `analyze.ts`.** Start with `Balance`, `AdvantageP1`,
   `Drawishness`, `Completion`, `Timeouts`, `LeadChange`, `Stability`, `Drama`, `DecisivenessMoves`, `BranchingFactor`,
   `BoardSitesOccupied`, `PieceNumber` and `MoveDistance` [2]. Reason: the list is finished, named, and has published
   reference values [3], so our report is comparable to 1000 other games. Port from the papers [19, 20], not from the
   CC BY-NC-ND source, and say so in the file header.
2. **Ludii's per-ply reduction pattern** (average, change, maximum, minimum, variance of a per-ply series). One helper
   turns every eval or count timeline into five numbers. This is the cheapest structural idea in the whole review.
3. **Restricted play as an explicit experiment [25].** Depth 3 against depth 5 on the same arrangement, reported as a
   skill-sensitivity number. It answers "does this back rank reward skill", which no win rate can.
4. **Piece usage as the over-centralisation signal [29, 31].** Flag any arrangement where one piece type takes more than
   a set share of captures, even when the win rate is 50%.
5. **Two-stage screening in the sweep [28].** Cheap screen of all arrangements, full evaluation of the top and bottom
   only. This is already the successive halving in `sim-methodology.md` §3; keep it.

**Port, do not install**

6. Elo from score, the Wilson interval, and the pentanomial variance: formulas, not dependencies.
7. Ludi's Drama and Uncertainty definitions [20]: they need our own eval timeline, so a library cannot supply them.

**Use if the need appears**

8. `choix` [36] in a small Python script, when we rank more than about 100 arrangements from sparse pairwise results.
9. Observable Plot [39] for the report artifact, since it needs no build step.

**Ignore**

10. **Ludii as software.** CC BY-NC-ND blocks shipping and modification [1]. Run it locally to read metric values, and
    nothing more.
11. **OpenSpiel, RBG, GDL, boardgame.io and Polygames as hosts for our rules.** Each requires a second implementation of
    the rules. The metrics we want are not in any of them, so the work buys analytics we still have to write [8-15].
12. **Rating libraries, `bayeselo` and `ordo`** [34, 35]. Our "players" are engine settings and arrangements, not a
    fluctuating population, so a batch Elo fit or Bradley-Terry is enough.
13. **Machinations and Tabletop Simulator** for balance [17, 18]. They target economies and human tables. Tabletop
    Simulator still has value for a human playtest, which is a separate task.
14. **A single weighted "fun score" as the only ranking.** Keep the weighted sum from `SIM-PLAN.md` §3 for convenience,
    but report balance and interest as two axes as well, because the research shows the two objectives conflict [22, 24].
