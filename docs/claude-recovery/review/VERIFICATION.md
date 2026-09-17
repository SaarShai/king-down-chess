# Review verification — 2026-09-14

This records checks performed during the review. It is not a claim that the takeover plan has been implemented.

## Current source

- `./node_modules/.bin/tsc --noEmit` — passed.
- `./node_modules/.bin/vitest run --maxWorkers=1` — **149 tests passed, 6 test files passed**, 88.14 seconds; run started at 07:36:51 PDT. The low worker count limited contention with inherited simulations.
- All **199 source/tool/build files** in [code-snapshot.json](</Users/za/Documents/king down chess/docs/claude-recovery/review/code-snapshot.json>) remained byte-identical at the final 08:00:30 PDT check, including 12 `src/sim` files.
- `git status --short`: the project has no committed baseline and its working files are untracked. `git check-ignore -v` attributes `src/sim/run.ts`, `sim/specs/newpieces/np-N.json` and `sim/out/nnue-g1.jsonl` to `.gitignore:4:sim/`.
- No production build was run; the recorded v0.7 `dist` is preserved. No application source, asset or simulation output was edited for this review. No existing job was stopped and no simulation/training/release job was started.

## Bounded reproductions

Executed via Node/tsx against the current modules, without adding tests or changing source:

1. With `secondPlayerDoubleFirstTurn=true`, play e2-e4 and e7-e5. Before FEN round-trip: `{turn: 1, ply: 2}`. After `fromFen(toFen(pos))`: `{turn: 1, ply: 3}`. FEN: `rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b - - 0 2`. This proves loss of exact physical ply; it **does not** remove Black’s next move.
2. Starting from `7k/8/8/3p4/3L4/8/8/K7 w - - 0 1`, parse the same recorded `Ld4xd5` using the sampler’s `parseLan` function. With `paladinKamikaze=always`, the result is `7k/8/8/8/8/8/8/K7 b - - 0 1`; with `nonPawn`, it is `7k/8/8/3L4/8/8/8/K7 b - - 0 1`. Both round-trip to the same LAN text. Thus the sampler’s notation-equality check cannot detect rule-dependent replay changes.

The king-power coverage gap and browser worker rule omission were established by code inspection. No fresh full-browser game was run in this pass. Historical v0.7 QA is separately documented in TASKS and the recovered build-agent transcript.

## Background execution checkpoint

At **08:00:30 PDT**, Q6 was still generating. The log reported **56,857 / 79,314** games in the resumed batch; adding the 686 pre-existing records gives approximately **57,543 / 80,000** total. The progress line estimated another 1h15m; that is the process’s changing estimate, not a completion promise. `nnue-g1.summary.json` still reported only 686 and the Q6 done marker did not exist. The live `queue3.sh` process was PID 24043, parent 24041. No sampling/training success was established.

The earlier Standards inspection read 50,684 complete Q6 records and found no rule/pool stamps. That earlier file count is intentionally separate from the later log-derived progress count. The data remain unvalidated for training.

The new-piece replacement chain output ended `CHAIN2 EXIT 0` and `[exited with code 0]`; completion occurred around 07:34 PDT. Its terminal output and the current checkpoint are recorded in [final-checkpoint.json](</Users/za/Documents/king down chess/docs/claude-recovery/review/final-checkpoint.json>).

## Record checks and limits

All 88 recovered project JSONLs parsed without errors during recovery/review. The expanded record index has 957 entries, including 66 saved tool-result files counted recursively. The original recovery inventory and the later review inventories were produced at different times; live logs may subsequently change hashes. A saved summary may lag a growing JSONL.

Both procedural board crops were visually inspected. Recorded brightness measurements are consistent with similar light/dark contrast, but do not replace browser QA.

Historical web research, licensing statements, remote publication availability and every old simulation result were not independently reverified. The review identifies specific evidence that must be checked before reuse; it does not claim that every past experiment is valid under today’s rules.
