# Fairy-Stockfish comparison

The later [Archer/Beast port assessment](fairy-stockfish-port-2026-10-11.md) records the native action port and its separate functional checks. The eight-game score below applies only to the original shared subset.

This is a bounded shared-rule test. It does not establish full King Down support or an Elo rating.

## Scope and method

The test uses pinned [upstream source](https://github.com/fairy-stockfish/Fairy-Stockfish/tree/9f778da667f6e07dae1e85d3e2ea204fc6dee94d), compiled for this Mac. Both engines have one search thread and a nominal 60 ms per move. Fairy-Stockfish uses its classical evaluator. King Down uses the residual evaluator selected by `src/ai/worker.ts`. Its simulator default is not the browser setting.

Eight games pair two starts and both engine colours in each of two profiles. The first profile uses ordinary pieces, with no castling or en passant. The second replaces the knights with Beasts and disables chain captures under the existing lab switch. This second profile changes no shipped rule. It tests a commoner-like custom piece that both engines can represent.

Both engines must agree on the full legal-move set at every position. After each move they must agree on board, side, halfmove count and fullmove number. The UCI side receives the complete move history. King Down's `Game` supplies checkmate, repetition and other terminal results. A 300-ply cap is censored, not called a draw. No evaluation-based result is used.

The bridge rejects shots, chains, swaps, pushes, self-removal, drops and tagged powers. Fixtures include pins, promotion and a Beast capture. Actual Archer-shot and Beast-chain fixtures must trigger this rejection. The test stops on any rule or state mismatch. It never turns an unsupported action into an ordinary move.

## Measured result

| Profile | Fairy-Stockfish wins | Draws | King Down wins | Caps | Checked positions |
|---|---:|---:|---:|---:|---:|
| Ordinary pieces | 4 | 0 | 0 | 0 | 246 |
| One-capture Beast lab | 4 | 0 | 0 | 0 | 316 |

All eight games end in checkmate. All 554 recorded plies pass a separate full replay under the saved rules. No illegal move, legal-set mismatch or board-state mismatch occurs. The bridge rejects both genuine unsupported-action controls. Four positive fixtures also pass.

Median search time is 60.23 ms for Fairy-Stockfish and 59.08 ms for King Down. Mean time is 56.91 and 49.30 ms; maximum is 64.21 and 71.42 ms. The engines can stop early on forced moves. The recorded times support the nominal time comparison; they are not proof of equal work per node.

The result is a strong initial signal on these starts. It does not estimate an Elo gap. Only two starts per profile are used. The native engine has mature search and classical evaluation; the TypeScript engine has its browser residual evaluation. No ablation isolates language speed, search or evaluation. There is no variant-specific Fairy-Stockfish net in this test. Full King Down still needs a rule port before a match can answer its playing-strength question.

`npm test` passes: 121 files and 1,931 tests, with 21 tests and one file skipped; all 50 artwork tests pass. The source, binary, configuration, harness, neural weights, raw moves, measured times and reports have saved hashes.

## Training and full-game support

See [the training assessment](fairy-stockfish-training-2026-10-11.md) for pinned sources, data formats and a proposed pipeline. The [official custom-variant interface](https://fairy-stockfish.github.io/custom-variants/) can define many piece geometries. Its [trainer FAQ](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/FAQ) confirms custom-variant training. Training does not supply a missing action rule.

Full King Down needs engine work for its signature actions and state. That includes Archer shots, swaps, Ogre pushes, Beast chains, Paladin removal, Guard capture restrictions, card hands, uses, temporary marks and extra turns. A correct port must include attacks, make/undo, terminal results, repetition, search and serialization. The data generator must keep the same complete state. The NNUE features or external evaluation terms must account for it.

The supported trainer path uses CUDA. M1 can generate positions and run inference; Kaggle can supply a CUDA training job after the rule and data gates pass. Existing game files are useful fixtures and possible training inputs after conversion. They are not ready-made Fairy-Stockfish training records. Labels from our current AI can also carry its errors into a new evaluator.

## Recommendation

Keep the TypeScript rules engine as the reference. Use this UCI harness as an external comparison on verified shared rules. Do not replace the shipped AI based on eight games.

Before bulk training, build one exact native rule test for Archer shots. It is a small, distinct action with a clear state effect. Check legal sets, attacks, make/undo and result state against the reference. Then test Beast chains, which place more stress on action encoding and NNUE updates. Stop and assess the port after those two gates. A complete port spec must then cover all production pieces, powers and the selected card pool.

Use the rules framework to store each engine's verified capabilities and the exact rule manifest for each match. An unsupported effect must block dispatch. The same state fixtures can check the browser engine, a future native port and training-record round trips.

After parity passes, generate a small data fixture, verify labels and state, train one candidate, and compare it with the same native engine without NNUE. Use fresh paired starts and equal wall time. Increase data only when the held-out match supports it. Do not pool this smoke test with the balance campaigns.

Raw results, source archives, binary, configuration, test logs and hashes are in the card folder `fairy-stockfish-eval-20261011`. The backup receipt is external to the snapshot. No game rule, shipped AI, merge or deployment changes occur.
