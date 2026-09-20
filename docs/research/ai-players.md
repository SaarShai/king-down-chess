# AI players for King Down Chess — the landscape

Researched 2026-09-13. Extends `docs/research/engine-ai.md` (which answers "which engine do we
adopt": none — write TypeScript) and does not repeat its Fairy-Stockfish, licence, AlphaZero-framework
or browser-inference sections. Three targets drive this one: **(a)** a strong browser opponent,
**(b)** a fast, unbiased player for millions of balance games, **(c)** a learned evaluation that
survives rule changes. Unconfirmed claims are marked **[unverified]**.

## Sources

| # | Source | Used for |
|---|---|---|
| 1 | [Delorme, Dumb 2.3 ablation](https://www.talkchess.com/forum/viewtopic.php?p=978411) / [Rustic Elo log](https://talkchess.com/viewtopic.php?t=77734) | Elo cost of each search feature |
| 2 | [Stockfish useful data](https://official-stockfish.github.io/docs/stockfish-wiki/Useful-data.html) | MultiPV cost, speed-to-Elo, threads, hash |
| 3 | [CPW Depth](https://chessprogramming.org/Depth) / [Komodo doubling test](https://talkchess.com/viewtopic.php?t=46370) | Elo per ply and per doubling of time |
| 4 | [nnue-pytorch docs](https://raw.githubusercontent.com/official-stockfish/nnue-pytorch/master/docs/nnue.md) | HalfKP/HalfKA sizes, accumulator, quantisation |
| 5 | [CPW NNUE](https://chessprogramming.org/NNUE) | modern quantisation constants |
| 6 | [Stockfish NNUE launch](https://stockfishchess.org/blog/2020/introducing-nnue-evaluation/) | NNUE Elo over a mature hand eval |
| 7 | [Fairy-Stockfish net list](https://fairy-stockfish.github.io/nnue/) | **NNUE Elo per variant** |
| 8 | [Lozza](https://github.com/op12no2/lozza) / [stockfish.wasm](https://github.com/lichess-org/stockfish.wasm) | pure-JS NNUE engine; browser WASM build |
| 9 | [JS movegen thread](https://talkchess.com/viewtopic.php?t=85748) / [cozy-chess](https://github.com/analog-hors/cozy-chess) | JS and Rust perft nps; 0x88 vs bitboards |
| 10 | [Four JS problems](https://dev.to/trkb/four-javascript-problems-i-hit-writing-a-chess-engine-for-the-browser-4e09) / [BigInt benchmark](https://gist.github.com/alexvictoor/fa518189c3534fce10ce5cfad3d07c8f) | BigInt on the hot path; ops/s |
| 11 | [AlphaZero paper](https://ar5iv.labs.arxiv.org/html/1712.01815) | TPU count, games, self-play temperature |
| 12 | [lczero scale thread](https://groups.google.com/g/lczero/c/vibJiUO1R5I) | games per GPU-day, total cost |
| 13 | [alpha_chess, one GPU](https://github.com/yurit04/alpha_chess) | single-GPU ceiling |
| 14 | [AlphaGateau](https://arxiv.org/html/2410.23753v1) | transfer across board size |
| 15 | [Prokopakop](https://slama.dev/prokopakop/nnues-and-where-to-find-them/) / [Leorik](https://talkchess.com/viewtopic.php?t=79049&start=430) / [bullet](https://github.com/jw1912/bullet) | data rate, first-net Elo, the trainer |
| 16 | [Giraffe](https://ar5iv.labs.arxiv.org/html/1509.01549) | rule-agnostic features, CPU-only cost |
| 17 | [CPW UCT](https://chessprogramming.org/UCT) / [MCTS characterisation](https://arxiv.org/abs/2406.09242) | shallow traps; 1,494-game agent dataset |
| 18 | [Ludii user guide](https://ludii.games/downloads/LudiiUserGuide.pdf) / [playout speedups](https://arxiv.org/abs/2111.02839) | shipped agents; cost of general code |
| 19 | [Stockfish FAQ](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html) | Skill Level and UCI_Elo mechanics |
| 20 | [Maia, KDD 2020](https://www.cs.toronto.edu/~ashton/pubs/maia-kdd2020.pdf) | human move-match accuracy |
| 21 | [AlphaDDA](https://arxiv.org/abs/2111.06266) / [Minibal](https://arxiv.org/html/2603.23059v1) | difficulty from the value estimate |
| 22 | [CPW Engine Testing](https://chessprogramming.org/Engine_Testing) | colour-reversed opening pairs |
| 23 | [UHO imbalance](https://github.com/official-stockfish/Stockfish/discussions/5079) / [CPW Chess960](https://chessprogramming.org/Chess960) | book bias; books do not transfer |

## 1. Classical engines: where the strength comes from

**Search, not evaluation, carries most of the Elo.** Delorme removed one feature at a time from
Dumb 2.3 and measured the loss [1]:

| Removed | Elo | Removed | Elo |
|---|---|---|---|
| MVV-LVA ordering | **−495** | Null move pruning | −116 |
| Transposition table | **−283** | Aspiration windows | −101 |
| Late move reductions | **−229** | History heuristic | −94 |
| Quiescence search | −145 | Killer moves | −22 |

Move ordering is the largest item. The hash *move* alone was worth only −12, because the other
ordering heuristics already found it [1]. Rustic reports the same shape: about 150 Elo from a
transposition table, about 56 Elo from killers in self-play, about 35 Elo in gauntlets [1].

**What a ply buys.** Belle gained about 200 Elo per ply from depth 4 to 9; Heinz measured 115, 92 and
84 Elo for plies 10 to 12; Komodo gained 107 Elo from 0.5 s to 1 s and about 40 Elo per doubling at
long time control [3]. At our depth a ply is worth far more than the 40–80 Elo quoted for strong
engines, and speed converts at a fixed rate: Stockfish measures **1 % speed = 2.10 Elo** [2].

**NNUE in one paragraph.** HalfKP indexes (own king square × piece square × piece type × colour) and
holds `64*64*5*2 = 40960` inputs [4]. HalfKA adds kings as ordinary pieces. A perspective net keeps
one accumulator per side. A move changes at most 4 inputs, on average under 3, so the engine adds and
subtracts a few weight rows instead of running a full forward pass [4]. King-bucketed sets force a
full refresh when the king moves. Stockfish moved from `256x2→32→32→1` to `1024x2→8→32→1`; the
feature transformer uses int16 and the later layers int8 with int32 accumulation [4]. Hobby practice
today is `SCALE=400, QA=255, QB=64` [5]. NNUE gave Stockfish "over 80 Elo" [6] — small, because its
hand eval had twenty years of tuning.

**The number that matters to us is not 80.** Fairy-Stockfish publishes a net per variant with the
measured gain over that variant's hand eval [7]: 3check +200, capablanca +354, racingkings +374,
kingofthehill +644, atomic +719, xiangqi +914, crazyhouse +1136, grasshopper +2574. A new variant has
an untuned hand eval, so a learned eval is worth hundreds of Elo. Two people made most of those 200+
nets [7], so this is a one-person job.

**Copy Lozza, not `stockfish.wasm`.** Lozza is pure JavaScript with no WASM: a quantised
`768→(256×2)→1` squared-ReLU net on ~600M positions, embedded as one base64 line. `stockfish.wasm`
needs SharedArrayBuffer and COOP/COEP headers for its threads [8].

## 2. Learning-based players: what each scale costs

| Path | Compute | Result |
|---|---|---|
| AlphaZero chess [11] / Leela [12] | 5,000 TPU, 9 h, 44M games / ~60M games ≈ 3,000 GPU-days (~$15k) | superhuman |
| AlphaZero, 1–8 GPUs [13][14] | RTX 3090, "a couple of days"; or 13 d on 6–8 A5000 | 1500–1900 Elo |
| **NNUE on our engine's data** [15] | ~500 positions/s of self-play; 11.5 d for 500M | **+200 to +350 Elo** |
| Giraffe [16] | 72 h on a 20-core CPU, ~175M positions | about IM level |

In one sentence: **self-play reinforcement learning buys about 2000 Elo for a week of GPU time;
supervised learning on our own engine's output buys a few hundred Elo for a week of CPU time** — the
better trade, and it needs no new search algorithm.

**The recipe.** Play a few random plies, let the engine finish at fixed nodes or depth 8–12, drop
positions in check or whose best move is a capture, label each with the game result blended with the
search score, then train `768→N→1` in `bullet` [15]. `bullet` tells beginners to start at plain
`768→N→1`, and warns that Stockfish-style architectures cost far more data and time [15].

**How much data.** Advice says 100M+; production nets use 500–620M [8][15]. But one JS net
reached parity with Lozza's mature hand eval on about 8M positions, and `N` as small as 16 can beat a
hand eval [8]. **Start at 5–10M positions and N=32.** That is one overnight run of the simulation
lab we already have.

**A value net beats policy+value here.** Alpha-beta cuts the branching factor from about 35 to under
2, so a small node budget still goes deep; Stockfish with NNUE matches Leela at about 81,000 nodes.
MCTS needs a good policy head, which doubles the training problem. For one second per move in a
browser, one value head inside alpha-beta is the right shape.

**When the rules change.** AlphaGateau pre-trained on 5×5 chess scored 807 Elo on 8×8 with no 8×8
exposure, then reached 1876 Elo after 100 fine-tuning iterations against 500 from scratch [14] —
about a 5× saving. Giraffe points at the stronger answer: its 363 features are **rule-agnostic** —
mobility per sliding direction, plus attack and defend maps giving the lowest-valued attacker and
defender of each square [16]. Those come from the move generator, so they stay correct when a piece
changes. The cost is that attack maps do not update incrementally. A hybrid (incremental
piece-square core plus a small mobility head recomputed per evaluation) is the obvious compromise,
and no engine is known to do it — an untested idea, not a cited one.

## 3. General game AI that needs no tuning

**UCT is the wrong default here.** Ramanujan, Sabharwal and Selman showed that chess is full of
*shallow traps* — positions a short proof tree refutes — and that UCT does not see them and searches
deeper lines instead [17]. Go has few early traps, which is why UCT works there. King Down is worse
than chess here: rifle shots, kamikaze trades and chain captures all make short refutations common.

**Ludii is the reference implementation of "no tuning".** It ships UCT, PUCT, GRAVE, MAST, NST and an
alpha-beta agent with iterative deepening, and its own guide says UCT "will struggle" in chess at one
second per move [18]. Ludii also shows the price of generality: game-specific playouts gave a median
speedup of **5.08×** (mean 6.17×, max 34.31×) over 145 games [18]. A general engine costs about 5× in
speed before any strength question.

A 2024 dataset of 1,494 games, 61 agents and 268,386 plays exists for exactly this comparison, but
its authors report only preliminary analysis [17]. **[unverified]** — no head-to-head
MCTS-versus-alpha-beta table at fixed compute for chess-like games was found.

## 4. Engineering for millions of games

**Mailbox beats bitboards in JavaScript. This is measured.** A 2026 test of one engine written both
ways found 0x88 about **40 % faster**, with perft at **2.4M nps (depth 4), 5.6M (depth 5), 7.0M
(depth 6)** in Node 20 [9]. Lozza's author replied in the same thread that splitting a bitboard into
two `Uint32Array` elements "is still slower than mailbox" [9]. BigInt is the reason: bitwise BigInt
runs at about **26.7M ops/s against 728M ops/s for Number** [10], and it allocates on the hot path
[10]. Our `Int8Array(120)` mailbox is correct, and magic bitboards would not help anyway — archer,
paladin and beast attack sets are not slider masks. Zobrist keys must stay two 32-bit halves [10], as
`src/ai/zobrist.ts` already does.

**What a Rust core would buy.** cozy-chess reaches **318M nps** on perft [9] against 7M nps for JS
mailbox [9] — about 45×, though bulk counting flatters the Rust figure. Assume **5–15× on a real
search**, which is 2–3 plies, which is 200–400 Elo at our depth [3].

**Check whether we need it first.** `SIM-PLAN.md` estimates 0.1–0.5 s per depth-3 game, so 8 cores
give roughly 14–28 games/s, or **1M games in 10–20 hours**. `src/sim/run.ts` already prints games/s
and ETA, and resumes from its JSONL file. Measure before writing any Rust. Cheap wins come first: no
allocation in move generation, pre-sized buffers, integer-encoded moves, no closures in hot loops.

**Keeping two implementations in sync.** Perft is the standard tool: count leaf nodes per depth from
a fixed position list and compare. Our version: freeze about 50 positions (start positions plus one
per fairy interaction — archer shot through a blocker, paladin jump over a friend, guard immunity,
maester long swap, beast chain), commit the `perft(1..5)` counts from the TypeScript engine, and make
any second implementation reproduce them exactly. Build that suite **before** the port.

## 5. Human-facing strength and levels

**How Stockfish weakens itself.** It finds at least 4 candidate moves, adds a random bias to the
scores of the slightly worse ones, and picks at `depth = 1 + Skill Level`; the bias grows as the level
falls. `UCI_Elo` needs `UCI_LimitStrength` and maps to a Skill Level, covering about 1347 to 3212
[19]. MultiPV also costs strength by itself: MultiPV 2 is −97 Elo, MultiPV 5 is −235 Elo [2].

**Depth limiting feels wrong, and there is evidence.** Maia predicts human moves at over 52 %
accuracy; Stockfish at low depth manages 41 % and Leela 46 % [20]. A weak engine is not a weak human:
it plays strong moves, then hangs a piece. AlphaDDA instead adjusts one skill parameter from its own
value estimate, and Minibal minimises the winning margin, scoring −2.96 % average gain against
92.68 % for plain minimax [21]. Both need a strong engine underneath, so **ship a strong engine, then
weaken it.** Our cheapest knob is a softmax over root scores plus a small blunder rate — not a cap.

**Opening books cannot exist for us.** Chess960 already kills book theory [23], and our pool
`QLRRBBNNAAGGMMSS` (7 picks, the king, opposite-colour bishops) gives **1,373 piece sets and
16,236,000 legal back ranks** (computed from `src/rules/setup.ts`) against Chess960's 960. No book,
and no file-indexed opening piece-square tables either.

**For balance runs the problem inverts:** we want diversity without bias. Engine testers use
colour-reversed opening pairs [22] and warn that unbalanced books distort results — about 25 % of the
first 500 UHO positions are too imbalanced to recover from [23]. Our recipe: **play every back rank
twice with colours swapped**, plus a softmax temperature over root moves for diversity (AlphaZero
uses temperature 1 for 30 plies [11]). Without it, a deterministic engine repeats one game and the
sample size is a lie.

## Comparison of candidate players

Games/s assumes 8 cores and a full depth-3 game. Strength is relative to our engine today.

| Approach | Strength | Games/s | Effort | Survives rule change? | Browser? |
|---|---|---|---|---|---|
| Random / greedy-material playout | very weak | ~500+ | hours | yes | yes |
| **TS alpha-beta, depth 3 (today)** | baseline | **14–28** (measure) | done | yes, free | yes |
| TS alpha-beta, 1 s/move | +300–500 | ~1 | done | yes, free | yes |
| Zero-allocation TS pass | +100–200 | 40–80 | 3–5 days | yes, free | yes |
| **TS alpha-beta + small NNUE** | **+200–400** | 10–20 | 1–2 weeks + data | retrain or fine-tune | yes, ~0.2 MB |
| Rust→WASM port (+ NNUE) | +200–400 (+400–800) | 150–400 | 3–6 weeks (+4) | port every change | yes |
| MCTS/UCT, no net | **worse** [17] | ~5 | 1 week | yes, free | yes |
| MCTS + policy/value (AlphaZero) | +500–1000 | slow | months + GPU | full retrain | heavy |
| Fairy-Stockfish fork | n/a | n/a | months | no — see `engine-ai.md` | GPL |

## Recommendation, in stages

**Stage 0 — finish tier 2, then measure (this week).** The work in progress (transposition table,
piece-square tables, better ordering) is the best Elo per hour available, and [1] predicts where it
lands. Then run the two measurements that decide everything else:
1. `npm run sim -- --games 2000 --depth 3`, and read the games/s line. Above 15 games/s a
   million-game run is an overnight job, and **no Rust port is needed**.
2. A self-play ladder of our own versions (depth 3 vs 4 vs 5, 1000 games each, colours swapped). No
   external engine can rate this game, so our own versions are the ruler. Record it in `TASKS.md`.

**Stage 1 — make the balance player unbiased (2–3 days).** Add a `temperature` option to `search()`
that samples the root move from a softmax over scores. Play every back rank twice with colours
swapped in `pairings()`. Both are small changes to code we own, and both remove the largest threat to
the balance numbers: a deterministic engine repeating one game.

**Stage 2 — the small NNUE (1–2 weeks of work, one night of CPU).** The best investment after tier 2.
The Fairy-Stockfish variant table is the evidence [7]: an untuned evaluation leaves 200–600 Elo on the
table. Steps:
1. Dump positions from the simulation lab: random first plies, depth-8 play, skip in-check and
   capture-best positions [15]. Target 5–10M positions, not 500M.
2. Train in `bullet` [15]. Our input is `2 × 11 × 64 = 1408` with a plain perspective net — **no king
   buckets**, so no full refresh and no HalfKA file-size problem.
3. Run inference in plain TypeScript with `Int16Array` accumulators, `QA=255, QB=64, SCALE=400` [5];
   under 0.2 MB at N=32. Copy Lozza's shape [8].
4. Gate it with the stage-0 ladder. If it loses a 1000-game match, it does not ship.

**Stage 3 — only if the rules keep moving.** Add Giraffe-style rule-agnostic features [16] —
mobility per direction, attack and defend maps — as a second, non-incremental head. They come from
our own move generator, so a new piece keeps them valid. Fine-tune instead of retraining after each
rule change; expect about a 5× saving [14].

**Do not do, and why:** MCTS without a policy net (shallow traps [17]); AlphaZero self-play (one GPU
buys 2000 Elo in days [13], and alpha-beta plus NNUE gets there for far less); a Rust port before the
games/s measurement; HalfKA features (king refresh, file size).

## Status update — 2026-09-17

Two of the stages below are now done or measured, in-house rather than with the external tools the
research assumed:

- **The small NNUE exists and passed its gate.** The in-repo TypeScript trainer (`src/sim/gen.ts`,
  not `bullet`) produced a **residual** net (linear evaluation + a clipped net of at most ±150 cp) from
  80,000 fresh self-play games: gate +167 ± 26 Elo, decision **+139 ± 14 Elo** over 1,600 games at
  depth 3, depth-4 confirmation **+149 ± 37**, and a one-second browser search reaching depth 5.92
  against linear's 6.08. It is **accepted as a candidate** and not the default
  (`docs/research/ai-q6-acceptance-2026-09-16.md`). Adopting it is a one-word switch plus a rebuild.
- **The speed question is answered without a Rust port**: the lab runs 6–9 games/s at depth 3 on 16
  cores, so a million-game corpus is a two-day job; the browser search already reaches depth 6 in one
  second with the linear evaluation, 5.9 with the residual.
- **The balance player's bias is handled differently** from the temperature suggestion below: every
  A/B is paired over shared arrangements and opening seeds, and the residual was trained on a corpus
  whose records carry full rule/source stamps.

What remains from the staged plan, in the order the evidence supports: **adopt was done 2026-09-17**;
**stage 1 (opening variety) is done** — the browser samples root moves within 15 cp of the best for
the first six plies (`search({ temperature })`), so the AI stops repeating one opening per back rank;
add an **incremental accumulator** for node speed if the net ships; distill the search
into a **policy** head for instant browser play; build an **opening book** from self-play so games do
not repeat the first plies; solve small endgames with retrograde **tablebases**; and only then consider
AlphaZero-style self-play RL (LightZero/OpenSpiel/minizero over a Rust core), which costs months and a
GPU for gains that alpha-beta + NNUE reaches more cheaply at this scale.

## Not verified

- No head-to-head table of MCTS against alpha-beta at fixed compute for chess-like games.
- `bullet` training time for a 768→256 net; positions and hours for any one Fairy-Stockfish net.
- No benchmark of hand-written int16 JS NNUE against onnxruntime-web on the same net. The case rests
  on dispatch overhead plus the incremental update — sound, but indirect.
- No engine combines an incremental piece-square core with a rule-agnostic mobility head.
