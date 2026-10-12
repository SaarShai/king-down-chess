# Fairy-Stockfish compatibility and first match

Status: verified
Type: prototype

Owner: "i want us to test fairy stockfish ... and see how it fairs against what we currently have. i also want you to look into being able to train it on our own fairy pieces and cards and kings powers."

Plan: pin upstream source; build an isolated executable; verify exact legal-move agreement on shared rules; run a bounded paired smoke match under equal time; test unsupported signature effects and document each mismatch; research custom NNUE data/features/training. Keep all game rules and shipped AI unchanged. No merge.

Acceptance: source/binary/config hashes, protocol controls, complete legal-move sets and position transitions on shared-rule fixtures, bounded per-move time and process cleanup, paired colours/openings, results with caps/failures, saved raw moves, explicit limits on inference. A shared-rule match cannot certify full King Down strength. Training cannot replace missing rules.

Use at most20 local smoke games and two workers. Any larger match uses approved M1/Kaggle compute and needs a frozen specification first. Do not launch training before rules/state/features are verified.


## Verified setup

- Native source: `9f778da667f6e07dae1e85d3e2ea204fc6dee94d`. Build: `make -j2 build ARCH=apple-silicon COMP=clang nnue=no`. The UCI test also sets `Use NNUE=false`.
- Baseline: the browser worker's residual evaluator. Do not infer this setting from the simulator default or the older comment in `eval.ts`.
- Configuration check passes for `kdshared` and `kdbeast`. The latter disables Beast chains in the test only.
- `npm test` passes: 121 test files and 1,931 tests; 21 tests and one file are skipped. The 50 artwork tests also pass.
- Research checks engine, generator and trainer source. Custom NNUE piece types work. Board/pocket features omit card hands, power uses and temporary marks. The documented large-board build handles networks above 80 MB.
- Exact files, source archives, executable, configuration and build/test logs are on the card in `fairy-stockfish-eval-20261011`.

## Next acceptance gate

A full-game engine test requires an approved port spec. Start with one unsupported action. Check every legal action, make/undo, attacks, terminal results, repetition and state serialization against the current TypeScript reference. Then add complete state to the generator and evaluator. Do not treat training as a substitute for missing rules.


## Result

All eight games finish in checkmate: Fairy-Stockfish wins 4/4 on ordinary pieces and 4/4 on the one-capture Beast lab. All 562 position comparisons pass. A separate full replay passes all 554 plies and terminal results. Median move times: 60.23 ms native, 59.08 ms TypeScript. No cap or failed game. This is a smoke result on shared rules, not full-game strength or an Elo estimate.

The staff check keeps one small UCI harness and one explicit INI file. No production adapter or rule compiler is added. Unsupported actions fail closed. The native process has bounded replies and closes in `finally`. A full port and GPU training remain separate spec decisions.

Reports: `docs/research/fairy-stockfish-eval-2026-10-11.md` and `docs/research/fairy-stockfish-training-2026-10-11.md`. Final backup is verified: `drive:King Down/results-backups/20261011-205523-807801000`. The cloud manifest MD5 matches the receipt. Eleven required raw, source, binary, test and report files match its SHA-256 entries. The receipt is external to the snapshot. No commit, merge, deployment or shipped rule/AI change.

Independent reader check: no confirmed must-fix issue. The reader checks evaluator settings, paired starts, time controls, legal-set/state assertions, timeout/cleanup and report limits against the saved summary and specification. The final backup ends at 21:02 Pacific and passes checksum checks. No further snapshot is needed for this status-only update.
