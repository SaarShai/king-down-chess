# Policy distillation for a high-level browser player — plan (2026-09-17)

The adopted residual net raised evaluation quality (+139 ± 14 Elo at depth 3, depth-4 confirmed).
The next strength step is not another evaluation tweak: it is making the **move choice** cheap.
This plan sets out the smallest version that can be measured, in the order the project's evidence
supports. Background and the wider landscape: `docs/research/ai-players.md` (status update 2026-09-17).

## Why a policy net

- The browser search spends its one second on depth 6 with the linear evaluation, 5.9 with the
  residual. Strength grows about **180 Elo per ply** (R1 ladder, depth 2→6 = +730 ± 66), so a policy
  net that ranks moves well converts directly into depth: better ordering prunes more, and the same
  one second reaches deeper.
- It also unlocks an **instant player**: play the top policy move with no search, or search only 2–3
  plies, for weak-device and mobile play.
- It is the standard use of self-play data we already generate: the teacher is our own search, so no
  external engine or rules DSL is needed (see `engine-ai.md` for why external engines cannot express
  the rules).

## Data (the part being built now)

`tools/policy-data.ts` labels positions with the search's own best move:

| field | bytes | meaning |
|---|---|---|
| board | 64 | piece bytes, a1 = 0 |
| turn | 1 | side to move |
| from, to | 2 | the search's best move |
| promo | 1 | promotion piece type, 0 for none |
| margin | 2 | best minus second score, centipawns (Int16) |

Sampling: every game, every Nth plie after the opening, in-check positions skipped. A 300-position
pilot at depth 3 ran at ~12 positions/s; the background pilot is 5,000 positions at depth 4 with the
linear teacher (the lab default), manifest in `sim/nnue/policy.json`. For a real net the target is
**300k–1M positions at depth 5**, which is a few days at one thread; workers or a slower teacher
depth trade quality for rate.

## First training results (2026-09-17, 5,000-position pilot)

- The pipeline works end to end: `tools/policy-train.ts` builds positions from the binary, finds the
  teacher's legal move in all 5,000 records, and trains a listwise softmax over the legal moves.
- **The full 1408-feature model overfits immediately at 5k samples** (train 3.2 → 1.6 while val
  3.1 → 4.5 in ten epochs). The trainer now keeps the **best-validation checkpoint** and defaults to
  hidden 16; the best epoch reached **16.0% top-1 / 32.8% top-3** on the held-out fifth (chance for
  ~30 legal moves is 3.3%).
- Data is the constraint, not the code: a **100,000-position depth-3 distillation** is running
  (chained to a retrain, `sim/out/policy2.done`), and the plan's 300k–1M at depth 5 remains the
  target for a real net. Depth-3 labels match the lab's own baseline; depth 5 is for the net that
  actually ships.

## Model and training

- **Shape, first pass:** a per-move scorer, `position features (1408 bits, the existing NNUE layout)
  + move code (from 64 × to 64, plus 9 promotion targets)` → hidden 64 → 1. Training is a **listwise
  softmax over the legal moves of each position** (cross-entropy with the teacher's move as the
  label), which is the same data path as the existing trainer and keeps one implementation of the
  feature layout.
- **Second pass, if the first works:** factorise to `from × to` heads and add a small trunk shared
  with the residual net, so one forward pass serves both evaluation and ordering.
- **Deliberately not:** AlphaZero-style self-play RL (months + GPU over a fast foreign-language
  core), and MCTS without a policy net (shallow traps; `ai-players.md` §2–3).

## How it will be accepted

1. **Rate gate:** positions/s labelled (teacher quality is the constraint), and the trainer's
   held-out top-1 / top-3 agreement with the teacher.
2. **Ordering gate:** with the net ordering moves, the same depth reaches equal-or-fewer nodes, or
   the same time reaches greater depth, on a fixed position set; no strength regression in a
   1,000-game match against the current engine at equal time.
3. **Instant gate:** the no-search player's strength measured against depth-2 and depth-3 search;
   if it is worse than depth 2 it does not go to the browser.
4. **Browser gate:** one-second moves, worker bundle size, mobile QA (the existing QA harness).

## Also queued, in order

1. **Incremental NNUE accumulator** — the residual's forward pass is a full refresh (~2k adds per
   eval). Incremental updates would buy nodes per second, which is strength at time controls. Do it
   when the policy work shows the search is the bottleneck again.
2. **Opening book from self-play** — mine the 80k-game corpus for the first plies that keep games
   decisive; the browser AI currently repeats its opening in a given position. A small book adds
   variety and avoids known shuffles. Independent of the policy net.
3. **Small endgame tablebases** — retrograde analysis for the quiet material configurations the lab
   already knows are drawish (K+G vs K, K+A vs K, and the guard endgames). Perfect play in endings,
   and it removes the last adjudication ambiguity from those tests.
4. **Human-facing skill levels** — Stockfish-style MultiPV noise and depth caps (see `ai-players.md`
   §5); the most user-visible item, and cheap once the policy net exists.
