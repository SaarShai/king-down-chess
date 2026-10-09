# Build the owner decisions of 2026-10-09

Status: resolved
Type: task

Build docs/RULES.md §6 decisions 20–25:

- [x] Merge `claude/archer-far`; `archerShots` defaults to `far2`. `plusDiagFwd2` stays a lab reading.
- [x] `guardNextToKing` (default on): a drawn guard starts next to its king. Tests: 3,000 seeds.
- [x] `guardReserve: 'any'` (lab): the guard drops on any empty square. Tests. No run.
- [x] The Paladin returns to `POOL` (`QOLRRBBNNAAGMMS`); Morph may make it.
- [x] Death Touch T2: `deathTouchReachForwardBack` in `POWERS_BALANCED`.
- [x] Morph makes no second Guard (test). A second Beast from cards stays allowed.

Verification: `npm test` passes (see the pull request).
