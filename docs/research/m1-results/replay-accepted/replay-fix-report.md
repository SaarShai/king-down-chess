# Replay fix report

Observed results:
- tsc --noEmit exit code 0
- vitest run src/sim/replay.test.ts src/sim/sim.test.ts exit code 0
- Tests: 37 passed, 0 failed

Fixture corrections applied:
- rejects move exposing own king: FEN changed to '4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1', LAN changed to 'Re2-f2'
- Maester test: start FEN '7k/8/8/8/8/8/pN6/M3K3 w - - 0 1', LAN 'Ma1<>e1', assertions added for maesterSwaps [1,0] and maesterLongSwaps [1,0]
- Archer test: assertion added for archerShots [1,0]
- Imports cleaned: removed typeOf, colorOf, A, M, L
- mkRec simplified: gameId numeric 77, only gameId/startFen/moves fields, GameRecord assertion kept

Logs saved:
- campaign/replay-tsc.log
- campaign/replay-after.log
- campaign/replay-checks.json
- campaign/replay-before.log preserved

Timestamp: 2026-09-22T05:40:36Z
