# Archer shots and Beast chains in the native engine

Status: verified
Type: prototype

Owner approval (2026-10-11): "go ahead with that plan. port Archer shots and Beast chains, verify them against our rules engine, and assess what remains for full King Down support. don't merge yet."

Plan: keep the pinned upstream source and original smoke evidence. Add a reproducible native patch for a fixed, explicit subset: ordinary pieces, current far2 Archer shots, current eight-neighbour Beast movement/capture/chains, no castling/en passant, no powers/cards or other fairy pieces. Preserve all capture effects in a portable move record and the transposition table. Verify make/undo, keys, attacks, check, legal effects, terminal outcomes and search. Then assess the remaining full-game and browser work.

Acceptance: repeatable patch/build; source and binary hashes; directed fixtures for both colours, blockers, pins/check evasions and long/branching chains; deterministic position corpus against the TypeScript reference; all move effects and undo state match; same-board chain paths collapse only when their final state is identical; ordinary perft regressions; a bounded search returns legal actions; test suite and an independent reader check if available. No full-game or training claim. No merge or deployment.

Integration facts: initial tests use a native child process on this Mac, not M1. Browser use requires a patched WebAssembly build and worker adapter, device speed/memory/battery checks, network loading and exact source distribution. This task does not replace the game AI.

## Result

The patch and fresh rebuild pass 116 positions: 2,199 reference paths, 2,183 distinct legal effects, 16 proven same-state path collapses and a 17-victim Beast chain. All child boards, attacked squares and check flags match. Native undo/key/material/TT and promotion metadata asserts pass. There are 87 deep recapture controls and 17 legal bounded search replies. Both ordinary perft controls pass 20/400/8,902. Four variant depth-2 perfts pass. Mate, stalemate, material/fifty-move draws, threefold history, illegal-action rejection and a capacity negative control pass. Native depth-5 bench passes 47 positions and 35,972 nodes.

`npm test` passes 122 files and 1,933 tests, with one file and 21 tests skipped. The 50 artwork checks pass. Exact artifacts are in the card campaign `fairy-stockfish-port-20261011`. Final certification uses only `final-check` and `final-rebuild-check`; preserve interim checks.

The independent reader identifies three confirmed issues: recapture selection assumes the victim is at the destination; inspection/undo lose promotion flags; exchange pruning is wrong for ordinary captures with remote replies. Each is fixed and has a direct control. The reader checks the repairs and reports no remaining confirmed should-fix issue within the fixed subset. Full-game or strength approval is not claimed.

Staff check: retain one native patch and one small reference driver. Reuse the UCI process client. Do not add a production rule compiler or adapter. The portable move record carries all victims. Same-state paths collapse only under the fixed contract. All other signatures fail closed. A dense-chain capacity error remains a production blocker; one-thread memory/performance, full rules and browser work remain.

Assessment: `docs/research/fairy-stockfish-port-2026-10-11.md`. Remaining base pieces come before the full powers/card state and training pipeline. No merge, deployment, large game run or shipped rule/AI change. Backup `drive:King Down/results-backups/20261011-213926-884603000` passes the cloud manifest checksum and all 70 campaign file hashes, including decompressed remote bytes. The external receipt is in `state/fairy-stockfish-port-backup/verified-port.json`; the completed backup monitor is removed.
