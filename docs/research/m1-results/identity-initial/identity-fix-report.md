# Identity fix report

## Changes
- src/sim/identity.ts: sourceId now uses node:path relative for canonical relative names, normalizes root, includes src/game.ts explicitly, handles missing file root gracefully.
- SRC_ROOTS changed to include src/game.ts instead of src/game directory.
- filesUnder now returns [] on missing path instead of throwing.
- src/sim/identity.test.ts added with four focused tests.

## Verification
- tsc --noEmit return code 0
- vitest run src/sim/identity.test.ts src/sim/replay.test.ts src/sim/sim.test.ts return code 0
- Logs captured in campaign/tsc.log, campaign/vitest.log, campaign/identity-checks.json

## Limitations
- No game simulations run per constraints.
- Source hash intentionally changes, preventing append to old runs; no compatibility fallback added.
