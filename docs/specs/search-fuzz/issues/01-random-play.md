# Seeded random play

Status: resolved

The owner asks for tests only on `staging/search-fuzz`.

## Plan

1. Read the move probes, setup code, and existing tests.
2. Add one seeded random-play test. Use real armies, all king powers, and the released four-card deal.
3. Compare legal moves, child keys, undo keys, and child legal moves. Keep any fault as a small `it.fails` case.
4. Run the file twice. Run a larger sample for 10 to 20 minutes. Run `npm run typecheck`.
5. Record counts and faults. Commit on this branch. Do not push.

## Checks

- The normal file takes less than 30 seconds.
- The two normal runs have the same counts and result.
- The log gives the seed, ply, FEN, rules, and move for each fault.
- No shipped file changes. No dependency or hook changes.

## Evidence

The existing legality tests compare random boards. The symmetry and guard tests check fixed boards. The perft table compares the paths to depth 2. The sim tests check setup, replay, records, and selected search moves. No test compares both move paths through seeded random games with all these checks.

The two final normal checks pass in 6.40 and 6.15 seconds. Each check plays 57 games and 17,732 plies. Each checks 1,216 positions and 38,620 moves. Each reaches 137 promotions, 37 ended marks, 27 repeated visits, and 54 extra actions in a turn. Each plays 19 released card types. Burn is dealt but not played. MirrorB is not dealt in this sample.

The counts and position traces match exactly. The SHA-256 trace is `c8d1131a6def35a2a8f64d682f79099e5b4de2e13f0ea120f2f258e4dcc32687`.

The larger check uses `KINGDOWN_FUZZ_GAMES=6000`. It passes in 618.36 seconds: 6,000 games, 1,820,278 plies, 125,061 checked positions, and 3,986,980 checked moves. It plays all 21 released card types. It reaches 14,680 promotion moves, 4,101 ended marks, 2,710 repeated visits, and 5,892 extra actions. Twenty games end by repetition. An earlier 4,200-game check also passes in 590.77 seconds.

All twelve king powers occur on both sides. The seven powers with action tags are played. For the five powers with no action tag under the shipped rules, removing each power changes sampled legal lists. The logs count those effects apart from played actions.

No mismatch occurs. No `it.fails` case is needed. No shipped file changes.

Commands: `KINGDOWN_TEST_FILE='src/ai/random-play.test.ts' npm test`; for the larger check, add `KINGDOWN_FUZZ_GAMES=6000`. `npm run typecheck` passes. The full suite does not run, as the owner directs.

The file uses the existing probes. Undo checks compare position keys; the probes do not return the full scratch position after undo. The test also checks the child legal list and the full input position. It checks every sixteenth position and each pending extra action. It does not cover all power pairs, lab cards, or old rule sets.
